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
S3_PREFIX = "data_raw/"
MONGO_DB = "test"                 #  MUST match your actual Mongo DB
MONGO_COLLECTION = "patients"
AIRFLOW_VAR = "mongo_processed_count"
DATASET = "patients"
# ==================


#  Recursive serializer for Mongo documents
def serialize_mongo(obj):
    if isinstance(obj, dict):
        return {k: serialize_mongo(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [serialize_mongo(item) for item in obj]
    elif isinstance(obj, datetime):
        return obj.isoformat()
    else:
        return obj


def mongo_batch_upload():
    # Connect to MongoDB Atlas
    mongo = MongoHook(conn_id="mongo_atlas", srv=True)
    collection = mongo.get_collection(MONGO_COLLECTION, MONGO_DB)

    # Get how many records are already processed
    last_processed = int(Variable.get(AIRFLOW_VAR, default_var=0))

    total_docs = collection.count_documents({})
    remaining = total_docs - last_processed

    # Not enough new data → skip safely
    if remaining < BATCH_SIZE:
        raise AirflowSkipException(
            f"Waiting for data. Remaining docs: {remaining}"
        )

    # Fetch NEXT batch only
    cursor = (
        collection
        .find({}, {"_id": 0})
        .skip(last_processed)
        .limit(BATCH_SIZE)
    )

    #  serialize ALL nested datetime fields
    data = [serialize_mongo(doc) for doc in cursor]

    # Write to temp file
    batch_number = last_processed + BATCH_SIZE
    file_name = f"patients_batch_{batch_number}.json"
    local_path = f"/tmp/{file_name}"

    with open(local_path, "w") as f:
        json.dump(data, f)

    # Upload to S3
    s3 = boto3.client("s3")
    s3.upload_file(
        local_path,
        S3_BUCKET,
        f"{S3_PREFIX}{DATASET}/{file_name}"
    )




    # Update progress
    Variable.set(AIRFLOW_VAR, batch_number)
    Variable.set("patients_data_ready", "true")

    print(f"Uploaded batch ending at record {batch_number}")


with DAG(
    dag_id="mongo_batch_to_s3",
    start_date=datetime(2024, 1, 1),
    schedule_interval="*/5 * * * *",
    max_active_runs=1,
    catchup=False,
    tags=["mongo", "s3", "batch"]
) as dag:

    upload_task = PythonOperator(
        task_id="mongo_batch_upload",
        python_callable=mongo_batch_upload
    )

