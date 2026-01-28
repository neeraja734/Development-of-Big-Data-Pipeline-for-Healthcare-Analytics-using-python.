import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import boto3
from io import BytesIO
import warnings
warnings.filterwarnings('ignore')

# ==============================================================================
# PAGE CONFIG
# ==============================================================================
st.set_page_config(
    page_title="Healthcare Analytics Dashboard",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ==============================================================================
# PROFESSIONAL UI CSS
# ==============================================================================
st.markdown("""
<style>
.stApp {
    background-color: #F7FAFC;
}

.main-header {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1B4965;
    text-align: center;
    padding: 1rem 0;
}

h2, h3 {
    color: #1B4965;
    font-weight: 600;
}

[data-testid="stSidebar"] {
    background-color: #1B4965;
}

[data-testid="stSidebar"] * {
    color: white;
}

.stTabs [data-baseweb="tab-list"] {
    gap: 2rem;
}

[data-testid="stMetric"] {
    background-color: white;
    padding: 1rem;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.js-plotly-plot {
    background-color: white;
    border-radius: 14px;
    box-shadow: 0 6px 16px rgba(0,0,0,0.08);
}
</style>
""", unsafe_allow_html=True)

# ==============================================================================
# AWS S3 CONFIGURATION
# ==============================================================================
BUCKET = "my-healthcare-analytics-data"

#  Graphs come from this (Gold aggregations)
AGG_BASE = "data_aggregated/"

#  Tables come from this (Master fact table)
FACT_BASE = "compiled_aggregation/"

@st.cache_resource
def get_s3_client():
    return boto3.client(
        "s3",
        aws_access_key_id=st.secrets["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=st.secrets["AWS_SECRET_ACCESS_KEY"],
        region_name=st.secrets["AWS_DEFAULT_REGION"]
    )

# ==============================================================================
# BATCH LISTING (MULTI-BATCH)
# ==============================================================================
@st.cache_data(ttl=300)
def list_available_batches():
    """
    List all available batch IDs from S3 using data_aggregated folder
    Expected:
      data_aggregated/batch_id=<BATCH_ID>/
    """
    try:
        s3 = get_s3_client()
        resp = s3.list_objects_v2(
            Bucket=BUCKET,
            Prefix=AGG_BASE,
            Delimiter="/"
        )

        batches = []
        for p in resp.get("CommonPrefixes", []):
            prefix = p["Prefix"]
            if "batch_id=" in prefix:
                batch_id = prefix.split("batch_id=")[1].rstrip("/")
                batches.append(batch_id)

        return sorted(batches, reverse=True) if batches else []
    except Exception as e:
        st.error(f"Error listing batches: {e}")
        return []

# ==============================================================================
# LOAD PARQUET DATA FROM S3
# ==============================================================================
@st.cache_data(ttl=300)
def load_parquet_folder_as_df(s3_prefix):
    """
    Reads all parquet part files under a given S3 prefix into one pandas DF.
    Example s3_prefix:
      data_aggregated/batch_id=xxx/patient_by_gender/
    """
    try:
        s3 = get_s3_client()

        resp = s3.list_objects_v2(Bucket=BUCKET, Prefix=s3_prefix)

        if "Contents" not in resp:
            return None

        parquet_files = [
            obj["Key"] for obj in resp["Contents"]
            if obj["Key"].endswith(".parquet")
        ]

        if not parquet_files:
            return None

        dfs = []
        for key in parquet_files:
            try:
                obj = s3.get_object(Bucket=BUCKET, Key=key)
                df_temp = pd.read_parquet(BytesIO(obj["Body"].read()), engine="fastparquet")
                dfs.append(df_temp)
            except Exception as e:
                st.warning(f"Could not load {key}: {e}")
                continue

        if not dfs:
            return None

        df = pd.concat(dfs, ignore_index=True)
        return df if not df.empty else None

    except Exception as e:
        st.warning(f"Error loading parquet folder {s3_prefix}: {e}")
        return None

@st.cache_data(ttl=300)
def load_aggregation(batch_id, agg_name):
    """
    Loads ONE aggregation dataset from:
      data_aggregated/batch_id=<BATCH_ID>/<agg_name>/
    """
    path = f"{AGG_BASE}batch_id={batch_id}/{agg_name}/"
    return load_parquet_folder_as_df(path)

@st.cache_data(ttl=300)
def load_fact_table(batch_id):
    """
    Loads Master Fact Table from:
      compiled_aggregation/batch_id=<BATCH_ID>/fact_patient_encounters/
    """
    path = f"{FACT_BASE}batch_id={batch_id}/fact_patient_encounters/"
    return load_parquet_folder_as_df(path)

# ==============================================================================
# TABLE FILTER (TAB-WISE FROM FACT)
# ==============================================================================
def safe_filter_columns(df, cols):
    if df is None or df.empty:
        return None
    available = [c for c in cols if c in df.columns]
    if not available:
        return None
    return df[available]

# ==============================================================================
# CHART HELPERS (UNCHANGED)
# ==============================================================================
def create_bar_chart(df, x_col, y_col, title, color=None):
    if df is None or df.empty:
        return None
    try:
        df_sorted = df.sort_values(by=y_col, ascending=False)

        fig = px.bar(
            df_sorted,
            x=x_col,
            y=y_col,
            title=title,
            color=color if color else x_col,
            text=y_col,
            color_discrete_sequence=px.colors.qualitative.Set3
        )

        fig.update_traces(texttemplate='%{text:.2s}', textposition='outside')
        fig.update_layout(
            showlegend=False if not color else True,
            xaxis_title=x_col.replace('_', ' ').title(),
            yaxis_title=y_col.replace('_', ' ').title(),
            height=400,
            hovermode='x unified'
        )
        return fig
    except Exception as e:
        st.warning(f"Could not create bar chart: {e}")
        return None

def create_line_chart(df, x_col, y_col, title, color=None):
    if df is None or df.empty:
        return None
    try:
        df_sorted = df.sort_values(by=x_col)

        fig = px.line(
            df_sorted,
            x=x_col,
            y=y_col,
            title=title,
            color=color,
            markers=True,
            color_discrete_sequence=px.colors.qualitative.Bold
        )

        fig.update_layout(
            xaxis_title=x_col.replace('_', ' ').title(),
            yaxis_title=y_col.replace('_', ' ').title(),
            height=400,
            hovermode='x unified'
        )
        return fig
    except Exception as e:
        st.warning(f"Could not create line chart: {e}")
        return None

def create_pie_chart(df, names_col, values_col, title):
    if df is None or df.empty:
        return None
    try:
        fig = px.pie(
            df,
            names=names_col,
            values=values_col,
            title=title,
            color_discrete_sequence=px.colors.qualitative.Pastel
        )
        fig.update_traces(textposition='inside', textinfo='percent+label')
        fig.update_layout(height=400)
        return fig
    except Exception as e:
        st.warning(f"Could not create pie chart: {e}")
        return None

# ==============================================================================
# MAIN DASHBOARD
# ==============================================================================
def main():
    st.markdown('<h1 class="main-header">🏥 Healthcare Analytics Dashboard</h1>', unsafe_allow_html=True)

    st.sidebar.title("⚙️ Configuration")

    batches = list_available_batches()

    if not batches:
        st.sidebar.error("No data batches found in S3")
        st.info("Available batches will appear here once data is uploaded.")
        return

    st.sidebar.write(f"📦 **Available Batches:** {len(batches)}")
    with st.sidebar.expander("View All Batches"):
        for i, batch in enumerate(batches, 1):
            st.write(f"{i}. {batch}")

    selected_batch = st.sidebar.selectbox("Select Data Batch", batches, index=0)
    st.sidebar.markdown("---")
    st.sidebar.success(f"✅ Selected Batch: **{selected_batch}**")

    # ✅ Load fact table once (used for tab tables)
    df_fact = load_fact_table(selected_batch)

    tab1, tab2, tab3, tab4, tab5 = st.tabs([
        "👥 Patient Analytics",
        "🏨 Visit Analytics",
        "💊 Prescription Analytics",
        "🩺 Disease Analytics",
        "💰 Cost Analytics"
    ])

    # ========================= TAB 1: PATIENT ANALYTICS =========================
    with tab1:
        st.header("Patient Demographics & Behavior")

        col1, col2 = st.columns(2)

        with col1:
            df_gender = load_aggregation(selected_batch, "patient_by_gender")
            if df_gender is not None:
                fig = create_pie_chart(df_gender, "gender", "patient_count",
                                     "Patient Distribution by Gender")
                if fig:
                    st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("No gender data available")

        with col2:
            df_age = load_aggregation(selected_batch, "patient_by_age_group")
            if df_age is not None:
                age_order = ["0-18", "19-35", "36-60", "60+"]
                df_age["age_group"] = pd.Categorical(df_age["age_group"], age_order, ordered=True)
                df_age = df_age.sort_values("age_group")
                fig = create_bar_chart(df_age, "age_group", "patient_count",
                                     "Patient Distribution by Age Group")
                if fig:
                    st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("No age data available")

        col3, col4 = st.columns(2)

        with col3:
            df_loc = load_aggregation(selected_batch, "patient_by_location")
            if df_loc is not None:
                fig = create_bar_chart(df_loc, "hospital_location", "patient_count",
                                     "Patients by Hospital Location")
                if fig:
                    st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("No location data available")

        with col4:
            df_ins = load_aggregation(selected_batch, "patient_by_insurance")
            if df_ins is not None:
                fig = create_pie_chart(df_ins, "insurance_type", "patient_count",
                                     "Insurance Type Distribution")
                if fig:
                    st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("No insurance data available")

        st.subheader("Health Behavior Analysis")

        col5, col6 = st.columns(2)

        with col5:
            df_smoke = load_aggregation(selected_batch, "pct_smokers_by_location")
            if df_smoke is not None:
                fig = create_bar_chart(df_smoke, "hospital_location", "pct_smokers",
                                     "Smoking Rate by Location (%)")
                if fig:
                    st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("No smoking data available")

        with col6:
            df_alcohol = load_aggregation(selected_batch, "pct_alcohol_by_age_group")
            if df_alcohol is not None:
                age_order = ["0-18", "19-35", "36-60", "60+"]
                df_alcohol["age_group"] = pd.Categorical(df_alcohol["age_group"], age_order, ordered=True)
                df_alcohol = df_alcohol.sort_values("age_group")
                fig = create_bar_chart(df_alcohol, "age_group", "pct_alcohol_users",
                                     "Alcohol Use by Age Group (%)")
                if fig:
                    st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("No alcohol data available")

        col7 = st.columns(1)[0]
        with col7:
            df_bmi = load_aggregation(selected_batch, "avg_bmi_by_gender_location")
            if df_bmi is not None and not df_bmi.empty:
                df_bmi_pred = (
                    df_bmi.groupby("gender", as_index=False)["avg_bmi"]
                    .mean()
                )
                fig = px.bar(
                    df_bmi_pred,
                    x="gender",
                    y="avg_bmi",
                    title="Average BMI by Gender (Risk Indicator)",
                    text="avg_bmi",
                    color="gender",
                    color_discrete_sequence=px.colors.qualitative.Set2
                )
                fig.add_hline(
                    y=25,
                    line_dash="dash",
                    line_color="red",
                    annotation_text="Healthy BMI Threshold (25)",
                    annotation_position="top right"
                )
                fig.update_traces(texttemplate="%{text:.1f}", textposition="outside")
                fig.update_layout(
                    yaxis_title="Average BMI",
                    xaxis_title="Gender",
                    height=420,
                    hovermode="x unified",
                    showlegend=False
                )
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("No BMI data available")

        st.markdown("---")
        st.subheader("📋 Patient Analytics Table (from Master Fact Table)")

        patient_cols = [
            "patient_id", "full_name", "age", "gender", "blood_group",
            "hospital_location", "insurance_type", "bmi",
            "smoker_status", "alcohol_use"
        ]
        df_patient_table = safe_filter_columns(df_fact, patient_cols)

        if df_patient_table is not None:
            st.dataframe(df_patient_table.drop_duplicates(), use_container_width=True, hide_index=True)
        else:
            st.info("Fact table not available for Patient tab.")

    # ========================= TAB 2: VISIT ANALYTICS =========================
    with tab2:
        st.header("Hospital Visit Patterns")

        col1, col2 = st.columns(2)

        with col1:
            df_monthly = load_aggregation(selected_batch, "monthly_visit_count")
            if df_monthly is not None:
                df_monthly["month_year"] = (
                    df_monthly["visit_year"].astype(str) + "-" +
                    df_monthly["visit_month"].astype(str).str.zfill(2)
                )
                df_monthly = df_monthly.sort_values(["visit_year", "visit_month"])
                fig = create_line_chart(df_monthly, "month_year", "visit_count",
                                      "Monthly Visit Trends")
                if fig:
                    st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("No monthly visit data available")

        with col2:
            df_visit_type = load_aggregation(selected_batch, "op_vs_ip_visit_ratio")
            if df_visit_type is not None:
                fig = create_pie_chart(df_visit_type, "visit_type", "visit_count",
                                     "Outpatient vs Inpatient Visits")
                if fig:
                    st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("No visit type data available")

        col3, col4 = st.columns(2)

        with col3:
            df_los = load_aggregation(selected_batch, "avg_los_by_severity")
            if df_los is not None:
                df_los = df_los.sort_values("severity_score")
                fig = create_bar_chart(df_los, "severity_score", "avg_length_of_stay",
                                     "Avg Length of Stay by Severity")
                if fig:
                    st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("No length of stay data available")

        with col4:
            df_visit_loc = load_aggregation(selected_batch, "visits_by_location")
            if df_visit_loc is not None:
                fig = create_bar_chart(df_visit_loc, "hospital_location", "visit_count",
                                     "Visits by Location")
                if fig:
                    st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("No visit location data available")

        st.subheader("Readmission Analysis")

        col5, col6, col7 = st.columns(3)

        with col5:
            df_readm = load_aggregation(selected_batch, "readmission_rate")
            if df_readm is not None and not df_readm.empty:
                st.metric("Overall Readmission Rate",
                          f"{df_readm['readmission_rate_pct'].values[0]:.2f}%")
            else:
                st.info("No readmission data")

        with col6:
            df_gap = load_aggregation(selected_batch, "avg_gap_before_readmission")
            if df_gap is not None and not df_gap.empty:
                st.metric("Avg Days Until Readmission",
                          f"{df_gap['avg_gap_days'].values[0]:.1f}")
            else:
                st.info("No readmission gap data")

        with col7:
            df_readm_sev = load_aggregation(selected_batch, "readmissions_by_severity")
            if df_readm_sev is not None and not df_readm_sev.empty:
                st.metric("Total Readmissions",
                          f"{df_readm_sev['readmission_count'].sum():,}")
            else:
                st.info("No readmission severity data")

        st.markdown("---")
        st.subheader("📋 Visit Analytics Table (from Master Fact Table)")

        visit_cols = [
            "visit_id", "patient_id", "visit_date", "visit_type",
            "severity_score", "length_of_stay",
            "previous_visit_gap_days", "readmitted_within_30_days",
            "visit_cost", "hospital_location"
        ]
        df_visit_table = safe_filter_columns(df_fact, visit_cols)

        if df_visit_table is not None:
            st.dataframe(df_visit_table.drop_duplicates(subset=["visit_id"]), use_container_width=True, hide_index=True)
        else:
            st.info("Fact table not available for Visit tab.")

    # ========================= TAB 3: PRESCRIPTION ANALYTICS =========================
    with tab3:
        st.header("Prescription & Drug Analysis")

        col1, col2 = st.columns(2)

        with col1:
            df_drugs = load_aggregation(selected_batch, "most_prescribed_drugs")
            if df_drugs is not None:
                fig = create_bar_chart(df_drugs.head(10), "drug_name", "prescription_count",
                                     "Top 10 Most Prescribed Drugs")
                if fig:
                    st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("No drug data available")

        with col2:
            df_days = load_aggregation(selected_batch, "avg_days_supply_by_drug")
            if df_days is not None:
                df_days_sorted = df_days.sort_values("avg_days_supply", ascending=False).head(10)
                fig = create_bar_chart(df_days_sorted, "drug_name", "avg_days_supply",
                                     "Avg Days Supply by Drug (Top 10)")
                if fig:
                    st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("No days supply data available")

        st.markdown("---")
        st.subheader("📋 Prescription Analytics Table (from Master Fact Table)")

        pres_cols = [
            "prescription_id", "visit_id", "patient_id",
            "drug_name", "dosage", "quantity", "days_supply",
            "rx_date", "cost"
        ]
        df_pres_table = safe_filter_columns(df_fact, pres_cols)

        if df_pres_table is not None:
            st.dataframe(df_pres_table.drop_duplicates(subset=["prescription_id"]), use_container_width=True, hide_index=True)
        else:
            st.info("Fact table not available for Prescription tab.")

    # ========================= TAB 4: DISEASE ANALYTICS =========================
    with tab4:
        st.header("Disease & Diagnosis Patterns")

        col1, col2 = st.columns(2)

        with col1:
            df_disease = load_aggregation(selected_batch, "most_common_diseases")
            if df_disease is not None:
                fig = create_bar_chart(df_disease.head(10),
                                     "diagnosis_description", "case_count",
                                     "Top 10 Most Common Diseases")
                if fig:
                    st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("No disease data available")

        with col2:
            df_disease_loc = load_aggregation(selected_batch, "disease_by_location")
            if df_disease_loc is not None:
                try:
                    top = (
                        df_disease_loc.groupby("diagnosis_description")["case_count"]
                        .sum().nlargest(5).index
                    )
                    df_f = df_disease_loc[df_disease_loc["diagnosis_description"].isin(top)]
                    fig = px.bar(
                        df_f,
                        x="hospital_location",
                        y="case_count",
                        color="diagnosis_description",
                        title="Top 5 Diseases by Location",
                        barmode="group",
                        color_discrete_sequence=px.colors.qualitative.Set2
                    )
                    fig.update_layout(height=400)
                    st.plotly_chart(fig, use_container_width=True)
                except Exception as e:
                    st.warning(f"Could not create disease location chart: {e}")
            else:
                st.info("No disease location data available")

        st.subheader("Disease Trends Over Time")

        df_trends = load_aggregation(selected_batch, "monthly_disease_trends")
        if df_trends is not None:
            try:
                top = (
                    df_trends.groupby("diagnosis_description")["case_count"]
                    .sum().nlargest(5).index
                )
                df_trends_top = df_trends[df_trends["diagnosis_description"].isin(top)]
                df_trends_top["month_year"] = (
                    df_trends_top["rx_year"].astype(str) + "-" +
                    df_trends_top["rx_month"].astype(str).str.zfill(2)
                )

                fig = px.area(
                    df_trends_top,
                    x="month_year",
                    y="case_count",
                    color="diagnosis_description",
                    title="Top 5 Disease Trends Over Time",
                    color_discrete_sequence=[
                        "#1B4965", "#62B6CB", "#5FA8D3", "#CAE9FF", "#A9D6E5"
                    ]
                )
                fig.update_layout(
                    height=400,
                    xaxis_title="Month-Year",
                    yaxis_title="Cases",
                    hovermode="x unified"
                )
                st.plotly_chart(fig, use_container_width=True)
            except Exception as e:
                st.warning(f"Could not create disease trends chart: {e}")
        else:
            st.info("No disease trend data available")

        st.markdown("---")
        st.subheader("📋 Disease Analytics Table (from Master Fact Table)")

        disease_cols = [
            "prescription_id", "visit_id", "patient_id",
            "diagnosis_id", "diagnosis_description",
            "hospital_location", "rx_date"
        ]
        df_disease_table = safe_filter_columns(df_fact, disease_cols)

        if df_disease_table is not None:
            st.dataframe(df_disease_table.drop_duplicates(), use_container_width=True, hide_index=True)
        else:
            st.info("Fact table not available for Disease tab.")

    # ========================= TAB 5: COST ANALYTICS =========================
    with tab5:
        st.header("Healthcare Cost Analysis")

        col1, col2 = st.columns(2)

        with col1:
            df_cost_diag = load_aggregation(selected_batch, "avg_cost_by_diagnosis")
            if df_cost_diag is not None:
                df_cost_diag_sorted = df_cost_diag.sort_values("avg_cost", ascending=False).head(10)
                fig = create_bar_chart(df_cost_diag_sorted,
                                     "diagnosis_description", "avg_cost",
                                     "Avg Cost by Diagnosis (Top 10)")
                if fig:
                    st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("No cost by diagnosis data available")

        with col2:
            df_cost_sev = load_aggregation(selected_batch, "avg_cost_by_severity")
            if df_cost_sev is not None:
                df_cost_sev = df_cost_sev.sort_values("severity_score")
                fig = create_bar_chart(df_cost_sev,
                                     "severity_score", "avg_cost",
                                     "Avg Cost by Severity Score")
                if fig:
                    st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("No cost by severity data available")

        st.subheader("Regional Cost Analysis")

        df_cost_loc = load_aggregation(selected_batch, "cost_by_location")
        if df_cost_loc is not None:
            fig = create_bar_chart(df_cost_loc,
                                 "hospital_location", "total_cost",
                                 "Total Healthcare Cost by Location")
            if fig:
                st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No cost by location data available")

        st.markdown("---")
        st.subheader("📋 Cost Analytics Table (from Master Fact Table)")

        cost_cols = [
            "visit_id", "patient_id", "hospital_location",
            "visit_cost", "prescription_id", "cost",
            "diagnosis_description"
        ]
        df_cost_table = safe_filter_columns(df_fact, cost_cols)

        if df_cost_table is not None:
            st.dataframe(df_cost_table.drop_duplicates(), use_container_width=True, hide_index=True)
        else:
            st.info("Fact table not available for Cost tab.")

        st.markdown("---")
        st.subheader("💡 Cost Insights & Summary")

        col_insight1, col_insight2, col_insight3 = st.columns(3)

        with col_insight1:
            df_cost_diag = load_aggregation(selected_batch, "avg_cost_by_diagnosis")
            if df_cost_diag is not None and not df_cost_diag.empty:
                max_cost = df_cost_diag['avg_cost'].max()
                max_disease = df_cost_diag.loc[df_cost_diag['avg_cost'].idxmax(), 'diagnosis_description']
                st.metric("Highest Cost Disease", f"${max_cost:,.0f}", delta=f"({max_disease})")
            else:
                st.info("No cost data")

        with col_insight2:
            df_cost_sev = load_aggregation(selected_batch, "avg_cost_by_severity")
            if df_cost_sev is not None and not df_cost_sev.empty:
                total_cost = df_cost_sev['avg_cost'].sum()
                st.metric("Total Avg Healthcare Cost", f"${total_cost:,.0f}")
            else:
                st.info("No severity cost data")

        with col_insight3:
            df_cost_loc = load_aggregation(selected_batch, "cost_by_location")
            if df_cost_loc is not None and not df_cost_loc.empty:
                max_loc_cost = df_cost_loc['total_cost'].max()
                max_location = df_cost_loc.loc[df_cost_loc['total_cost'].idxmax(), 'hospital_location']
                st.metric("Highest Cost Location", f"${max_loc_cost:,.0f}", delta=f"({max_location})")
            else:
                st.info("No location cost data")

# ==============================================================================
# RUN DASHBOARD
# ==============================================================================
if __name__ == "__main__":
    main()
