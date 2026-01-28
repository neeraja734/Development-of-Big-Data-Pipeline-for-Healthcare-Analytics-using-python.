from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.mongo.hooks.mongo import MongoHook
from airflow.models import Variable
from airflow.exceptions import AirflowSkipException
from datetime import datetime
import json
import boto3

# ===== CONFIG =====
BATCH_SIZE = 10000
S3_BUCKET = "my-healthcare-analytics-data"
S3_PREFIX = "data_raw/prescriptions/"
MONGO_DB = "test"
MONGO_COLLECTION = "prescriptions"
AIRFLOW_VAR = "mongo_prescriptions_processed_count"
# ==================


def serialize_mongo(obj):
    if isinstance(obj, dict):
        return {k: serialize_mongo(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [serialize_mongo(item) for item in obj]
    elif isinstance(obj, datetime):
        return obj.isoformat()
    else:
        return obj


def mongo_prescriptions_batch_upload():
    mongo = MongoHook(conn_id="mongo_atlas", srv=True)
    collection = mongo.get_collection(MONGO_COLLECTION, MONGO_DB)

    last_processed = int(Variable.get(AIRFLOW_VAR, default_var=0))

    total_docs = collection.count_documents({})
    remaining = total_docs - last_processed

    if remaining < BATCH_SIZE:
        raise AirflowSkipException(
            f"Waiting for data. Remaining docs: {remaining}"
        )

    cursor = (
        collection
        .find({}, {"_id": 0})
        .skip(last_processed)
        .limit(BATCH_SIZE)
    )

    data = [serialize_mongo(doc) for doc in cursor]

    batch_number = last_processed + BATCH_SIZE
    file_name = f"prescriptions_batch_{batch_number}.json"
    local_path = f"/tmp/{file_name}"

    with open(local_path, "w") as f:
        json.dump(data, f)

    s3 = boto3.client("s3")
    s3.upload_file(
        local_path,
        S3_BUCKET,
        f"{S3_PREFIX}{file_name}"
    )

    Variable.set(AIRFLOW_VAR, batch_number)
    Variable.set("prescriptions_data_ready", "true")
    print(f"Uploaded prescriptions batch ending at record {batch_number}")


with DAG(
    dag_id="mongo_prescriptions_to_s3",
    start_date=datetime(2024, 1, 1),
    schedule_interval="*/5 * * * *",
    max_active_runs=1,
    catchup=False,
    tags=["mongo", "prescriptions", "s3"]
) as dag:

    upload_task = PythonOperator(
        task_id="mongo_prescriptions_batch_upload",
        python_callable=mongo_prescriptions_batch_upload
    )
