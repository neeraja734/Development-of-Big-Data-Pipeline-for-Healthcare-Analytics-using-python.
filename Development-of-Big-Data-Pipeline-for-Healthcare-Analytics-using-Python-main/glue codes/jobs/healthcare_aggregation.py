
from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col, count, when, avg, sum, round,
    to_date, month, year
)
import boto3

# ---------------------------------------------------------
# CONFIG
# ---------------------------------------------------------
BUCKET = "my-healthcare-analytics-data"

FACT_PREFIX = "compiled_aggregation/"
AGG_PREFIX = "data_aggregated/"

FACT_BASE = f"s3://{BUCKET}/{FACT_PREFIX}"
AGG_BASE = f"s3://{BUCKET}/{AGG_PREFIX}"

spark = SparkSession.builder \
    .appName("Healthcare_Analytics_Aggregations_From_Fact") \
    .getOrCreate()

spark.sparkContext.setLogLevel("WARN")

s3 = boto3.client("s3")

# -------------------------------------------------
# HELPERS
# -------------------------------------------------
def list_batches(prefix):
    """
    Lists batch_id folders under a given prefix.
    Expected folder format:
      prefix/batch_id=<BATCH_ID>/
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

# -------------------------------------------------
# 1) FIND NEW BATCHES
# -------------------------------------------------
fact_batches = list_batches(FACT_PREFIX)
agg_batches = list_batches(AGG_PREFIX)

new_batches = sorted(set(fact_batches) - set(agg_batches))

if not new_batches:
    print(" No new batches to aggregate (already done)")
    spark.stop()
    raise SystemExit

print(" New batches to process:", new_batches)

# -------------------------------------------------
# 2) PROCESS EACH BATCH
# -------------------------------------------------
for BATCH_ID in new_batches:
    print(f"\n▶ Processing batch_id={BATCH_ID}")

    # ---------------------------------------------------------
    # READ FACT TABLE (SINGLE BATCH)
    # ---------------------------------------------------------
    fact = spark.read.parquet(
        f"{FACT_BASE}batch_id={BATCH_ID}/fact_patient_encounters/"
    )

    print("Fact rows:", fact.count())

    # ---------------------------------------------------------
    # ENRICHMENTS
    # ---------------------------------------------------------
    # Age group for patient aggregations
    fact = fact.withColumn(
        "age_group",
        when(col("age") <= 18, "0-18")
        .when(col("age") <= 35, "19-35")
        .when(col("age") <= 60, "36-60")
        .otherwise("60+")
    )

    # Visit date enrichments
    fact = fact.withColumn("visit_date", to_date(col("visit_date"))) \
               .withColumn("visit_month", month("visit_date")) \
               .withColumn("visit_year", year("visit_date"))

    # Rx date enrichments
    fact = fact.withColumn("rx_date", to_date(col("rx_date"))) \
               .withColumn("rx_month", month("rx_date")) \
               .withColumn("rx_year", year("rx_date"))

    # ---------------------------------------------------------
    # IMPORTANT: Build unique patient & unique visit views
    # ---------------------------------------------------------
    patients_u = fact.select(
        "patient_id",
        "age",
        "age_group",
        "gender",
        "hospital_location",
        "insurance_type",
        "bmi",
        "smoker_status",
        "alcohol_use"
    ).dropDuplicates(["patient_id"])

    visits_u = fact.select(
        "visit_id",
        "patient_id",
        "visit_date",
        "visit_year",
        "visit_month",
        "visit_type",
        "severity_score",
        "length_of_stay",
        "readmitted_within_30_days",
        "previous_visit_gap_days",
        "visit_cost",
        "hospital_location"
    ).dropDuplicates(["visit_id"])

    # ---------------------------------------------------------
    # AGGREGATIONS (ALL 23)
    # ---------------------------------------------------------
    aggregations = {}

    # 1) avg_bmi_by_gender_location
    aggregations["avg_bmi_by_gender_location"] = (
        patients_u.groupBy("gender", "hospital_location")
        .agg(round(avg("bmi"), 2).alias("avg_bmi"))
    )

    # 2) avg_cost_by_diagnosis  (use prescription cost)
    aggregations["avg_cost_by_diagnosis"] = (
        fact.filter(col("diagnosis_description").isNotNull())
        .groupBy("diagnosis_description")
        .agg(round(avg("cost"), 2).alias("avg_cost"))
    )

    # 3) avg_cost_by_severity (use visit_cost)
    aggregations["avg_cost_by_severity"] = (
        visits_u.groupBy("severity_score")
        .agg(round(avg("visit_cost"), 2).alias("avg_cost"))
    )

    # 4) avg_days_supply_by_drug
    aggregations["avg_days_supply_by_drug"] = (
        fact.filter(col("drug_name").isNotNull())
        .groupBy("drug_name")
        .agg(round(avg("days_supply"), 2).alias("avg_days_supply"))
    )

    # 5) avg_gap_before_readmission
    aggregations["avg_gap_before_readmission"] = (
        visits_u.filter(col("readmitted_within_30_days") == 1)
        .agg(round(avg("previous_visit_gap_days"), 2).alias("avg_gap_days"))
    )

    # 6) avg_los_by_severity
    aggregations["avg_los_by_severity"] = (
        visits_u.groupBy("severity_score")
        .agg(round(avg("length_of_stay"), 2).alias("avg_length_of_stay"))
    )

    # 7) cost_by_location (use visit_cost)
    aggregations["cost_by_location"] = (
        visits_u.groupBy("hospital_location")
        .agg(round(sum("visit_cost"), 2).alias("total_cost"))
    )

    # 8) daily_visit_count
    aggregations["daily_visit_count"] = (
        visits_u.groupBy("visit_date")
        .agg(count("*").alias("visit_count"))
    )

    # 9) disease_by_location
    aggregations["disease_by_location"] = (
        fact.filter(col("diagnosis_description").isNotNull())
        .groupBy("hospital_location", "diagnosis_description")
        .agg(count("*").alias("case_count"))
    )

    # 10) monthly_disease_trends
    aggregations["monthly_disease_trends"] = (
        fact.filter(col("diagnosis_description").isNotNull())
        .groupBy("rx_year", "rx_month", "diagnosis_description")
        .agg(count("*").alias("case_count"))
    )

    # 11) monthly_visit_count
    aggregations["monthly_visit_count"] = (
        visits_u.groupBy("visit_year", "visit_month")
        .agg(count("*").alias("visit_count"))
    )

    # 12) most_common_diseases
    aggregations["most_common_diseases"] = (
        fact.filter(col("diagnosis_description").isNotNull())
        .groupBy("diagnosis_description")
        .agg(count("*").alias("case_count"))
        .orderBy(col("case_count").desc())
    )

    # 13) most_prescribed_drugs
    aggregations["most_prescribed_drugs"] = (
        fact.filter(col("drug_name").isNotNull())
        .groupBy("drug_name")
        .agg(count("*").alias("prescription_count"))
        .orderBy(col("prescription_count").desc())
    )

    # 14) op_vs_ip_visit_ratio
    aggregations["op_vs_ip_visit_ratio"] = (
        visits_u.groupBy("visit_type")
        .agg(count("*").alias("visit_count"))
    )

    # 15) patient_by_age_group
    aggregations["patient_by_age_group"] = (
        patients_u.groupBy("age_group")
        .agg(count("*").alias("patient_count"))
    )

    # 16) patient_by_gender
    aggregations["patient_by_gender"] = (
        patients_u.groupBy("gender")
        .agg(count("*").alias("patient_count"))
    )

    # 17) patient_by_insurance
    aggregations["patient_by_insurance"] = (
        patients_u.groupBy("insurance_type")
        .agg(count("*").alias("patient_count"))
    )

    # 18) patient_by_location
    aggregations["patient_by_location"] = (
        patients_u.groupBy("hospital_location")
        .agg(count("*").alias("patient_count"))
    )

    # 19) pct_alcohol_by_age_group
    aggregations["pct_alcohol_by_age_group"] = (
        patients_u.groupBy("age_group")
        .agg(
            round(
                avg(when(col("alcohol_use") == "yes", 1).otherwise(0)) * 100, 2
            ).alias("pct_alcohol_users")
        )
    )

    # 20) pct_smokers_by_location
    aggregations["pct_smokers_by_location"] = (
        patients_u.groupBy("hospital_location")
        .agg(
            round(
                avg(when(col("smoker_status") == "yes", 1).otherwise(0)) * 100, 2
            ).alias("pct_smokers")
        )
    )

    # 21) readmission_rate
    aggregations["readmission_rate"] = (
        visits_u.agg(
            round(avg(col("readmitted_within_30_days")) * 100, 2)
            .alias("readmission_rate_pct")
        )
    )

    # 22) readmissions_by_severity
    aggregations["readmissions_by_severity"] = (
        visits_u.filter(col("readmitted_within_30_days") == 1)
        .groupBy("severity_score")
        .agg(count("*").alias("readmission_count"))
    )

    # 23) visits_by_location
    aggregations["visits_by_location"] = (
        visits_u.groupBy("hospital_location")
        .agg(count("*").alias("visit_count"))
    )

    # ---------------------------------------------------------
    # WRITE OUTPUTS
    # ---------------------------------------------------------
    for name, df in aggregations.items():
        df.write.mode("overwrite").parquet(
            f"{AGG_BASE}batch_id={BATCH_ID}/{name}/"
        )
        print(f" Written {name} for batch_id={BATCH_ID}")

    print(f" Completed batch_id={BATCH_ID}")

print("\n ALL NEW BATCHES PROCESSED SUCCESSFULLY")
spark.stop()
