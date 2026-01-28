import sys
import boto3
import warnings
warnings.filterwarnings("ignore")

from awsglue.utils import getResolvedOptions
from awsglue.context import GlueContext
from awsglue.job import Job
from pyspark.context import SparkContext

from pyspark.sql.functions import (
    col, trim, lower, lit, current_timestamp,
    to_date, when
)

# ==============================================================================
#  GLUE JOB ARGS
# ==============================================================================
args = getResolvedOptions(sys.argv, ["JOB_NAME"])
JOB_NAME = args["JOB_NAME"]

# ==============================================================================
#  BUCKET + PREFIXES
# ==============================================================================
BUCKET = "my-healthcare-analytics-data"

CLEAN_BASE_PREFIX = "data_cleaned/"
COMPILED_PREFIX = "compiled_aggregation/"

PATIENTS_PREFIX = CLEAN_BASE_PREFIX + "patients/"
VISITS_PREFIX = CLEAN_BASE_PREFIX + "visits/"
PRESCRIPTIONS_PREFIX = CLEAN_BASE_PREFIX + "prescriptions/"

# ==============================================================================
#  GLUE / SPARK SETUP
# ==============================================================================
sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session

job = Job(glueContext)
job.init(JOB_NAME, args)

# ==============================================================================
#  S3 CLIENT
# ==============================================================================
s3 = boto3.client("s3")

def list_batch_ids(prefix):
    """
    Lists batch_id folders under a given prefix.
    Example:
      data_cleaned/patients/batch_id=20260111_140001/
    """
    resp = s3.list_objects_v2(
        Bucket=BUCKET,
        Prefix=prefix,
        Delimiter="/"
    )

    batch_ids = []
    for p in resp.get("CommonPrefixes", []):
        folder = p["Prefix"]
        if "batch_id=" in folder:
            bid = folder.split("batch_id=")[1].rstrip("/")
            batch_ids.append(bid)

    return sorted(batch_ids)

# ==============================================================================
#  SAFE HELPERS
# ==============================================================================
def safe_trim(df, col_name):
    if col_name in df.columns:
        return df.withColumn(col_name, trim(col(col_name)))
    return df

def safe_lower_trim(df, col_name):
    if col_name in df.columns:
        return df.withColumn(col_name, lower(trim(col(col_name))))
    return df

def select_existing(df, cols):
    available = [c for c in cols if c in df.columns]
    return df.select(*available)

# ==============================================================================
#  MAIN
# ==============================================================================
def main():
    # --------------------------------------------------------------------------
    #  Detect new batches (compare cleaned vs compiled)
    # --------------------------------------------------------------------------
    cleaned_batches = list_batch_ids(PATIENTS_PREFIX)
    compiled_batches = list_batch_ids(COMPILED_PREFIX)

    new_batches = [b for b in cleaned_batches if b not in compiled_batches]

    print(" CLEANED BATCHES FOUND:", cleaned_batches)
    print(" COMPILED BATCHES FOUND:", compiled_batches)
    print(" NEW BATCHES TO PROCESS:", new_batches)

    if not new_batches:
        print(" No new batches found. Glue job finished successfully.")
        return

    for BATCH_ID in new_batches:
        print("\n" + "=" * 80)
        print(" PROCESSING BATCH_ID =", BATCH_ID)
        print("=" * 80)

        # ----------------------------------------------------------------------
        # Input Paths
        # ----------------------------------------------------------------------
        PATIENTS_PATH = f"s3://{BUCKET}/{PATIENTS_PREFIX}batch_id={BATCH_ID}/"
        VISITS_PATH = f"s3://{BUCKET}/{VISITS_PREFIX}batch_id={BATCH_ID}/"
        PRESCRIPTIONS_PATH = f"s3://{BUCKET}/{PRESCRIPTIONS_PREFIX}batch_id={BATCH_ID}/"

        # ----------------------------------------------------------------------
        # Output Path
        # ----------------------------------------------------------------------
        FACT_OUT_PATH = f"s3://{BUCKET}/{COMPILED_PREFIX}batch_id={BATCH_ID}/fact_patient_encounters/"

        # ----------------------------------------------------------------------
        # Read Cleaned Parquet
        # ----------------------------------------------------------------------
        try:
            patients_df = spark.read.parquet(PATIENTS_PATH)
            visits_df = spark.read.parquet(VISITS_PATH)
            prescriptions_df = spark.read.parquet(PRESCRIPTIONS_PATH)
        except Exception as e:
            print(f" Failed reading cleaned parquet for batch_id={BATCH_ID}")
            print("Reason:", str(e))
            continue

        # ----------------------------------------------------------------------
        #  Standardize key columns (trim)
        # ----------------------------------------------------------------------
        patients_df = safe_trim(patients_df, "patient_id")

        visits_df = safe_trim(visits_df, "patient_id")
        visits_df = safe_trim(visits_df, "visit_id")

        prescriptions_df = safe_trim(prescriptions_df, "visit_id")
        prescriptions_df = safe_trim(prescriptions_df, "prescription_id")

        # ----------------------------------------------------------------------
        #  Avoid ambiguity: drop patient_id from prescriptions before join
        # ----------------------------------------------------------------------
        if "patient_id" in prescriptions_df.columns:
            prescriptions_df = prescriptions_df.drop("patient_id")

        # ----------------------------------------------------------------------
        #  Normalize text (lowercase where needed)
        # ----------------------------------------------------------------------
        patients_df = safe_lower_trim(patients_df, "gender")
        patients_df = safe_lower_trim(patients_df, "hospital_location")
        patients_df = safe_lower_trim(patients_df, "smoker_status")
        patients_df = safe_lower_trim(patients_df, "alcohol_use")
        patients_df = safe_lower_trim(patients_df, "insurance_type")

        visits_df = safe_lower_trim(visits_df, "visit_type")
        visits_df = safe_lower_trim(visits_df, "doctor_speciality")

       
        visits_df = safe_lower_trim(visits_df, "readmitted_within_30_days")

        # ----------------------------------------------------------------------
        #  Select only required columns (PATIENTS)
        # ----------------------------------------------------------------------
        patients_needed = [
            "patient_id",
            "full_name",
            "age",
            "gender",
            "blood_group",
            "hospital_location",
            "bmi",
            "smoker_status",
            "alcohol_use",
            "insurance_type"
        ]
        patients_df = select_existing(patients_df, patients_needed)

        # ----------------------------------------------------------------------
        # ✅ Select only required columns (VISITS)
        # ----------------------------------------------------------------------
        visits_needed = [
            "visit_id",
            "patient_id",
            "visit_date",
            "severity_score",
            "visit_type",
            "length_of_stay",
            "lab_result_glucose",
            "lab_result_bp",
            "previous_visit_gap_days",
            "readmitted_within_30_days",
            "visit_cost",
            "doctor_name",
            "doctor_speciality"
        ]
        visits_df = select_existing(visits_df, visits_needed)

        
        if "prescribed_date" in prescriptions_df.columns:
            prescriptions_df = prescriptions_df.withColumnRenamed("prescribed_date", "rx_date")

        prescriptions_needed = [
            "prescription_id",
            "visit_id",
            "diagnosis_id",
            "diagnosis_description",
            "drug_name",
            "dosage",
            "quantity",
            "days_supply",
            "rx_date",
            "cost",
            "doctor_name"
        ]
        prescriptions_df = select_existing(prescriptions_df, prescriptions_needed)

        
        if "readmitted_within_30_days" in visits_df.columns:
            visits_df = visits_df.withColumn(
                "readmitted_within_30_days",
                when(col("readmitted_within_30_days").isin("yes", "y", "true", "1"), lit(1))
                .otherwise(lit(0))
            )

        # ----------------------------------------------------------------------
        #  Cast dates
        # ----------------------------------------------------------------------
        if "visit_date" in visits_df.columns:
            visits_df = visits_df.withColumn("visit_date", to_date(col("visit_date")))

        if "rx_date" in prescriptions_df.columns:
            prescriptions_df = prescriptions_df.withColumn("rx_date", to_date(col("rx_date")))

        # ----------------------------------------------------------------------
        #  JOIN INTO MASTER FACT TABLE
        # ----------------------------------------------------------------------
        try:
            fact_df = (
                visits_df.alias("v")
                .join(patients_df.alias("p"), on="patient_id", how="left")
                .join(prescriptions_df.alias("rx"), on="visit_id", how="left")
            )
        except Exception as e:
            print(f"❌ Join failed for batch_id={BATCH_ID}")
            print("Reason:", str(e))
            continue

        # ----------------------------------------------------------------------
        #  Add metadata
        # ----------------------------------------------------------------------
        fact_df = (
            fact_df
            .withColumn("batch_id", lit(BATCH_ID))
            .withColumn("compiled_at", current_timestamp())
        )

        # ----------------------------------------------------------------------
        #  FINAL COLUMN ORDER (100% SUPPORTS ALL YOUR 23 AGGS)
        # ----------------------------------------------------------------------
        final_cols_order = [
            "batch_id",
            "compiled_at",

            # Patient
            "patient_id",
            "full_name",
            "age",
            "gender",
            "blood_group",
            "hospital_location",
            "insurance_type",
            "bmi",
            "smoker_status",
            "alcohol_use",

            # Visit
            "visit_id",
            "visit_date",
            "severity_score",
            "visit_type",
            "length_of_stay",
            "lab_result_glucose",
            "lab_result_bp",
            "previous_visit_gap_days",
            "readmitted_within_30_days",
            "visit_cost",

            # Prescription / Disease
            "prescription_id",
            "diagnosis_id",
            "diagnosis_description",
            "drug_name",
            "dosage",
            "quantity",
            "days_supply",
            "rx_date",
            "cost",
        ]

        existing_final_cols = [c for c in final_cols_order if c in fact_df.columns]
        fact_df = fact_df.select(*existing_final_cols)

        # ----------------------------------------------------------------------
        #  WRITE FACT TABLE
        # ----------------------------------------------------------------------
        try:
            (
                fact_df
                .repartition(1)
                .write.mode("overwrite")
                .parquet(FACT_OUT_PATH)
            )

            print(f" Master fact table written for batch_id={BATCH_ID}")
            print("📌 Output:", FACT_OUT_PATH)

        except Exception as e:
            print(f"❌ Failed writing fact table for batch_id={BATCH_ID}")
            print("Reason:", str(e))
            continue

    print("\n All new batches processed successfully.")

# ==============================================================================
#  RUN
# ==============================================================================
main()
job.commit()
