from airflow import DAG
from airflow.providers.amazon.aws.sensors.s3 import S3KeySensor
from airflow.providers.amazon.aws.operators.glue import GlueJobOperator
from airflow.operators.python import ShortCircuitOperator, PythonOperator
from airflow.models import Variable
from datetime import datetime

BUCKET_NAME = "my-healthcare-analytics-data"

# ---------- FLAGS CHECK ----------
def all_folders_ready():
    return (
        Variable.get("patients_data_ready", default_var="false") == "true"
        and Variable.get("visits_data_ready", default_var="false") == "true"
        and Variable.get("prescriptions_data_ready", default_var="false") == "true"
    )

# ---------- RESET FUNCTION ----------
def reset_data_ready_flags():
    Variable.set("patients_data_ready", "false")
    Variable.set("visits_data_ready", "false")
    Variable.set("prescriptions_data_ready", "false")

with DAG(
    dag_id="s3_raw_to_glue_cleaning",
    start_date=datetime(2024, 1, 1),
    schedule_interval="*/10 * * * *",
    max_active_runs=1,
    catchup=False,
    tags=["s3", "glue", "etl"]
) as dag:

    # ---------- S3 SENSORS ----------
    wait_for_patients = S3KeySensor(
        task_id="wait_for_patients_data",
        bucket_name="my-healthcare-analytics-data",
        bucket_key="data_raw/patients/*",
        wildcard_match=True,
        aws_conn_id="aws_default",
        poke_interval=60,
        timeout=3600,
        mode="reschedule"
    )

    wait_for_visits = S3KeySensor(
        task_id="wait_for_visits_data",
        bucket_name="my-healthcare-analytics-data",
        bucket_key="data_raw/visits/*",
        wildcard_match=True,
        aws_conn_id="aws_default",
        poke_interval=120,
        timeout=3600,
        mode="reschedule"
    )

    wait_for_prescriptions = S3KeySensor(
        task_id="wait_for_prescriptions_data",
        bucket_name="my-healthcare-analytics-data",
        bucket_key="data_raw/prescriptions/*",
        wildcard_match=True,
        aws_conn_id="aws_default",
        poke_interval=60,
        timeout=3600,
        mode="reschedule"
    )

    # ---------- CHECK ALL FLAGS ----------
    check_all_ready = ShortCircuitOperator(
        task_id="check_all_folders_ready",
        python_callable=all_folders_ready
    )

    # ---------- GLUE JOB ----------
    run_glue_cleaning = GlueJobOperator(
        task_id="run_glue_cleaning_job",
        job_name="healthcare_ingest_clean",  #
        aws_conn_id="aws_default",
        region_name="us-east-1",
        iam_role_name="AWSGlueServiceRole-HealthcareAnalytics",
        wait_for_completion=True
    )

    # ---------- RESET FLAGS ----------
    reset_flags = PythonOperator(
        task_id="reset_data_ready_flags",
        python_callable=reset_data_ready_flags,
    )

    # ---------- DAG ORDER ----------
    (
        [wait_for_patients, wait_for_visits, wait_for_prescriptions]
        >> check_all_ready
        >> run_glue_cleaning
        >> reset_flags
    )

