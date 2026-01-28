# Development-of-Big-Data-Pipeline-for-Healthcare-Analytics-using-Python

Interface Link : https://development-of-big-data-pipeline-fo-three.vercel.app/ 
Dashboard Link: https://mb5xxdo4ar57ypbqozdxsc.streamlit.app/



🎥 **Project Demo Video (Unlisted)**  
👉  https://www.youtube.com/watch?v=BWlpSQnlLGo




Healthcare Analytics Platform

End-to-End Data Pipeline using MongoDB, Apache Airflow, AWS & Streamlit


📌 Project Overview

This repository implements a production-style healthcare analytics system that covers:

Data ingestion via a web interface

Automated ETL orchestration using Apache Airflow

Scalable processing with AWS Glue

Analytics visualization using Streamlit

A lightweight AI-powered query agent for insights over processed data

The project demonstrates real-world data engineering and analytics workflows using cloud-native tools.


----------------------------------------------------------------------------------------------------------------------------
🧑‍💻 Interface Layer (interface-main/)

Admin and Doctor interfaces for uploading:

Patient data

Visit records

Prescriptions

Data stored in MongoDB

Deployed using:

Render (backend)

Vercel (frontend)

This layer acts as the data source for the analytics pipeline.




--------------------------------------------------------------------------------------------------------------------------
Airflow Setup & Orchestration (airflow/)
Infrastructure

Ubuntu Server hosted on AWS EC2

Apache Airflow installed via pip

Airflow runs as the central orchestration engine

Responsibilities

Extract data from MongoDB

Upload raw batches to Amazon S3

Trigger AWS Glue jobs

Manage scheduling, retries, and dependencies

DAG Management

DAGs are located in airflow/dags/

DAGs are:

Time-based (scheduled)

Manually triggerable

Configuration values are handled through:

Code-level constants

Airflow Variables (where applicable)

Runtime artifacts (logs, metadata DB) are excluded from version control.
Attach IAM Role  to EC2 Instance with permision for glue and s3

--------------------------------------------------------------------------------------------------------------------------
AWS Glue ETL Layer

Design Principles

ETL logic lives in Python scripts (jobs/)

Job configuration & infrastructure live in JSON (configs/)

No executable code is embedded inside configuration files

Glue Execution Flow

Glue scripts are stored in an AWS Glue assets S3 bucket

Airflow triggers Glue jobs by job name

Glue reads raw data from S3, performs transformations, and writes:

Cleaned datasets

Master fact table

Aggregations

This separation ensures maintainability and scalability.
Attach IAM Role  with permision for glue jobs to acces s3

--------------------------------------------------------------------------------------------------------------------------

Analytics Dashboard (dashboard/)
Technology

Built using Streamlit

Reads processed datasets from Amazon S3

Features
Patient -Analytics
Visit - Analytics
Prescription - Analytics
Disease - Analytics
Cost - Analytics

Setup
pip install -r requirements.txt
streamlit run app.py


AWS access is handled via IAM roles or environment variables.

--------------------------------------------------------------------------------------------------------------------------

🤖 AI Agent (ai-agent/)
Overview

A lightweight AI-powered analytics assistant built using:

Flask

Python

Grok (LLM)

Capabilities

Fetches structured analytics data from S3 buckets

Uses Grok to:

Answer natural language questions

Summarize healthcare analytics

Provide insights over processed datasets

Role in the System

The AI agent acts as an intelligent query layer on top of the analytics pipeline, enabling conversational access to healthcare data.

------------------------------------------------------------------------------------------------------------------------------------------

 AWS Services Used

EC2 – Airflow orchestration (Ubuntu)

S3 – Raw, processed, and analytics data storage

Glue – ETL jobs and aggregations

IAM – Secure access and execution roles


------------------------------------------------------------------------------------------------------------------------------------------

🔐 Configuration & Security

Secrets and credentials are never committed

Runtime files are excluded via .gitignore

AWS access managed through IAM roles or environment variables


------------------------------------------------------------------------------------------------------------------------------------------


Key Highlights

Development of a Big Data pipeline for healthcare analytics using Python

Automated data orchestration using Apache Airflow

Batch ETL processing with AWS Glue

Scalable data storage using Amazon S3

Interactive analytics visualization with Streamlit

AI-powered insight generation using a Flask-based agent with Grok

Clean separation of ingestion, processing, analytics, and AI layers

Production-style project structure and configuration management

Design and implementation of a Big Data pipeline for healthcare analytics using Python and cloud-native services

------------------------------------------------------------------------------------------------------------------------------------------

🚀 Future Enhancements

Real-time ingestion (Kafka / Kinesis)

Integration with real EHR systems

------------------------------------------------------------------------------------------------------------------------------------------


