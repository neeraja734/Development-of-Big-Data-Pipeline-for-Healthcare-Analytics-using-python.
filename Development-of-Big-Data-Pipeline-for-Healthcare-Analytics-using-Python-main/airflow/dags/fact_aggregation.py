from airflow import DAG
from airflow.providers.amazon.aws.sensors.s3 import S3KeySensor
from airflow.providers.amazon.aws.operators.glue import GlueJobOperator
from datetime import datetime

BUCKET_NAME = "my-healthcare-analytics-data"
REGION = "us-east-1"

with DAG(
    dag_id="healthcare_fact_and_aggregation_glue",
    start_date=datetime(2024, 1, 1),
    schedule_interval="*/10 * * * *",
    max_active_runs=1,
    catchup=False,
    tags=["s3", "glue", "fact", "aggregation", "healthcare"]
) as dag:

    # =========================================================
    # ✅ SENSOR 1: Wait for new CLEANED parquet batch
    # (If cleaned data exists, trigger fact job)
    # =========================================================
    wait_for_cleaned_data = S3KeySensor(
        task_id="wait_for_cleaned_data",
        bucket_name=BUCKET_NAME,
        bucket_key="data_cleaned/**/*.parquet",
        wildcard_match=True,
        aws_conn_id="aws_default",
        poke_interval=120,
        timeout=60 * 60,
        mode="reschedule"
    )

    # =========================================================
    #  GLUE JOB 1: Generate MASTER FACT TABLE
    # Output:
    # compiled_aggregation/batch_id=.../fact_patient_encounters/
    # =========================================================
    run_glue_master_fact = GlueJobOperator(
        task_id="run_master_fact_table",
        job_name="master fact table",  #  your Glue job name
        aws_conn_id="aws_default",
        region_name=REGION,
        iam_role_name="airflowacesstos3",
        wait_for_completion=True
    )

    # =========================================================
    #  SENSOR 2: Wait for FACT TABLE output parquet
    # =========================================================
    wait_for_fact_table = S3KeySensor(
        task_id="wait_for_fact_table",
        bucket_name=BUCKET_NAME,
        bucket_key="compiled_aggregation/**/*.parquet",
        wildcard_match=True,
        aws_conn_id="aws_default",
        poke_interval=120,
        timeout=60 * 60,
        mode="reschedule"
    )

    # =========================================================
    #  GLUE JOB 2: Generate ALL 23 AGGREGATIONS
    # Output:
    # data_aggregated/batch_id=.../<agg_name>/
    # =========================================================
    run_glue_aggregations = GlueJobOperator(
        task_id="run_healthcare_aggregations",
        job_name="healthcare_aggregation",  #  your Glue aggregation job name
        aws_conn_id="aws_default",
        region_name=REGION,
        iam_role_name="airflowacesstos3",
        wait_for_completion=True
    )

    # DAG DEPENDENCY CHAIN
    wait_for_cleaned_data >> run_glue_master_fact >> wait_for_fact_table >> run_glue_aggregations
