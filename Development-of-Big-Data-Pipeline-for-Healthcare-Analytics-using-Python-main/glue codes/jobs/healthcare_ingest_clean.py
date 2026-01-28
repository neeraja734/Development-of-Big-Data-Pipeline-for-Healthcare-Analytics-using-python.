# ingest_clean_only.py
# PySpark data ingestion + cleaning ONLY 
# Compatible with AWS Glue / Spark

from pyspark.sql import SparkSession
from pyspark.sql.functions import col, lower, trim, when, lit, to_date, row_number
from pyspark.sql.types import IntegerType, FloatType, StringType
from pyspark.sql.window import Window
from datetime import datetime
import re
import json
import boto3

# ------------------------
# CONFIG
# ------------------------
BUCKET = "my-healthcare-analytics-data"
PARQUET_BASE = f"s3://{BUCKET}/data_parquet/"
CLEANED_BASE = f"s3://{BUCKET}/data_cleaned/"
STATE_KEY = "_pipeline_state/cleaned_raw_files.json"

BATCH_ID = datetime.utcnow().strftime("%Y%m%d_%H%M%S")

spark = SparkSession.builder.appName(
    "Healthcare_Ingest_Clean_Only"
).getOrCreate()
spark.sparkContext.setLogLevel("WARN")

s3 = boto3.client("s3")

# ------------------------
# UTIL
# ------------------------
def normalize_cols(df):
    for c in df.columns:
        df = df.withColumnRenamed(
            c, re.sub(r"\s+", "_", c.lower().strip())
        )
    return df

def list_raw_files(prefix):
    resp = s3.list_objects_v2(
        Bucket=BUCKET,
        Prefix=prefix
    )
    return [
        obj["Key"]
        for obj in resp.get("Contents", [])
        if obj["Key"].endswith(".json")
    ]

# ------------------------
# LOAD STATE
# ------------------------
try:
    state_obj = s3.get_object(Bucket=BUCKET, Key=STATE_KEY)
    state = json.loads(state_obj["Body"].read())
    processed_files = set(state.get("processed_files", []))
except s3.exceptions.NoSuchKey:
    state = {"processed_files": []}
    processed_files = set()

# ------------------------
# FIND NEW RAW FILES
# ------------------------
raw_files = set(list_raw_files("data_raw/"))
new_raw_files = sorted(raw_files - processed_files)

process_data = True
if not new_raw_files:
    print(" No new raw files to clean")
    process_data = False
else:
    print(" New raw files:", new_raw_files)

# =====================================================
# RUN PIPELINE ONLY IF NEW DATA EXISTS
# =====================================================
if process_data:

    # ------------------------
    # 1) READ RAW FILES (JSON)
    # ------------------------
    patients_files = [
        f"s3://{BUCKET}/{f}"
        for f in new_raw_files
        if f.startswith("data_raw/patients/")
    ]

    visits_files = [
        f"s3://{BUCKET}/{f}"
        for f in new_raw_files
        if f.startswith("data_raw/visits/")
    ]

    presc_files = [
        f"s3://{BUCKET}/{f}"
        for f in new_raw_files
        if f.startswith("data_raw/prescriptions/")
    ]

    patients = normalize_cols(spark.read.json(patients_files))
    visits = normalize_cols(spark.read.json(visits_files))
    presc = normalize_cols(spark.read.json(presc_files))

    # =====================================================
    # 2) PATIENTS CLEANING
    # =====================================================
    patient_defaults = {
        "patient_id": "unknown",
        "full_name": "unknown",
        "age": 0,
        "gender": "unknown",
        "blood_group": "unknown",
        "phone_number": "unknown",
        "email": "unknown",
        "emergency_contact": "unknown",
        "hospital_location": "unknown",
        "bmi": 0.0,
        "smoker_status": "no",
        "alcohol_use": "no",
        "chronic_conditions": "none",
        "registration_date": "2020-01-01",
        "insurance_type": "unknown"
    }

    for c, d in patient_defaults.items():
        if c not in patients.columns:
            patients = patients.withColumn(c, lit(d))

    string_cols = [
        "patient_id", "full_name", "gender", "blood_group",
        "phone_number", "email", "emergency_contact",
        "hospital_location", "smoker_status",
        "alcohol_use", "insurance_type"
    ]

    for c in string_cols:
        patients = patients.withColumn(
            c, trim(lower(col(c).cast(StringType())))
        )

    patients = patients.withColumn("age", col("age").cast(IntegerType()))
    patients = patients.withColumn("bmi", col("bmi").cast(FloatType()))
    patients = patients.withColumn(
        "registration_date", to_date(col("registration_date"))
    )

    patients = patients.filter(
        col("patient_id").isNotNull() & (col("patient_id") != "")
    )

    w = Window.partitionBy("patient_id").orderBy(col("registration_date"))
    patients = patients.withColumn("_rn", row_number().over(w)) \
                       .filter(col("_rn") == 1) \
                       .drop("_rn")

    # =====================================================
    # 3) VISITS CLEANING
    # =====================================================
    visit_defaults = {
        "visit_id": "unknown",
        "patient_id": "unknown",
        "visit_date": "2020-01-01",
        "severity_score": 1,
        "visit_type": "op",
        "length_of_stay": 0,
        "lab_result_glucose": 90.0,
        "lab_result_bp": 120.0,
        "previous_visit_gap_days": 0,
        "readmitted_within_30_days": "no",
        "visit_cost": 0.0,
        "doctor_name": "unknown",
        "doctor_speciality": "general"
    }

    for c, d in visit_defaults.items():
        if c not in visits.columns:
            visits = visits.withColumn(c, lit(d))

    for c in [
        "visit_id", "patient_id",
        "visit_type", "doctor_name",
        "doctor_speciality"
    ]:
        visits = visits.withColumn(c, trim(lower(col(c))))

    visits = visits.withColumn("visit_date", to_date(col("visit_date")))
    visits = visits.withColumn(
        "severity_score", col("severity_score").cast(IntegerType())
    )
    visits = visits.withColumn(
        "length_of_stay", col("length_of_stay").cast(IntegerType())
    )
    visits = visits.withColumn(
        "visit_cost", col("visit_cost").cast(FloatType())
    )

    visits = visits.withColumn(
        "readmitted_within_30_days",
        when(lower(col("readmitted_within_30_days")) == "yes", 1).otherwise(0)
    )

    visits = visits.join(
        patients.select("patient_id"),
        on="patient_id",
        how="inner"
    )

    w = Window.partitionBy("visit_id").orderBy(col("visit_date"))
    visits = visits.withColumn("_rn", row_number().over(w)) \
                   .filter(col("_rn") == 1) \
                   .drop("_rn")

    # =====================================================
    # 4) PRESCRIPTIONS CLEANING
    # =====================================================
    presc_defaults = {
        "prescription_id": "unknown",
        "visit_id": "unknown",
        "patient_id": "unknown",
        "diagnosis_id": "unknown",
        "diagnosis_description": "unknown",
        "drug_name": "unknown",
        "dosage": "0 mg",
        "quantity": 1,
        "days_supply": 1,
        "prescribed_date": "2020-01-01",
        "cost": 0.0,
        "doctor_name": "unknown"
    }

    for c, d in presc_defaults.items():
        if c not in presc.columns:
            presc = presc.withColumn(c, lit(d))

    for c in [
        "prescription_id", "visit_id",
        "patient_id", "drug_name",
        "doctor_name"
    ]:
        presc = presc.withColumn(c, trim(lower(col(c))))

    presc = presc.withColumn("quantity", col("quantity").cast(IntegerType()))
    presc = presc.withColumn("days_supply", col("days_supply").cast(IntegerType()))
    presc = presc.withColumn("cost", col("cost").cast(FloatType()))
    presc = presc.withColumn(
        "prescribed_date", to_date(col("prescribed_date"))
    )

    presc = presc.join(
        visits.select("visit_id"),
        on="visit_id",
        how="inner"
    )

    # =====================================================
    # 5) WRITE OUTPUTS
    # =====================================================
    patients.write.mode("append").parquet(
        f"{PARQUET_BASE}patients/batch_id={BATCH_ID}/"
    )
    visits.write.mode("append").parquet(
        f"{PARQUET_BASE}visits/batch_id={BATCH_ID}/"
    )
    presc.write.mode("append").parquet(
        f"{PARQUET_BASE}prescriptions/batch_id={BATCH_ID}/"
    )

    patients.write.mode("append").parquet(
        f"{CLEANED_BASE}patients/batch_id={BATCH_ID}/"
    )
    visits.write.mode("append").parquet(
        f"{CLEANED_BASE}visits/batch_id={BATCH_ID}/"
    )
    presc.write.mode("append").parquet(
        f"{CLEANED_BASE}prescriptions/batch_id={BATCH_ID}/"
    )

    state["processed_files"].extend(new_raw_files)

    s3.put_object(
        Bucket=BUCKET,
        Key=STATE_KEY,
        Body=json.dumps(state)
    )

    print(" Cleaning pipeline completed successfully")

# ------------------------
# STOP SPARK (ONCE)
# ------------------------
spark.stop()
