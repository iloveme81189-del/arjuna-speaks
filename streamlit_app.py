"""
Arjuna Speaks — Report Generator (Streamlit)
==============================================
Standalone Streamlit app for generating professional reports
from uploaded CSV/Excel files with charts, summaries, and insights.

Usage:
    pip install streamlit pandas plotly openpyxl
    streamlit run streamlit_app.py
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import io
import base64
from datetime import datetime
import os

# ─── Page Config ───────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Arjuna Speaks — Report Generator",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ─── Constants ─────────────────────────────────────────────────────────────────
ACCENT_COLOR = "#2563EB"
SECONDARY_COLOR = "#6366F1"
BG_COLOR = "#F8FAFC"
CARD_BG = "#FFFFFF"
TEXT_COLOR = "#1E293B"
MUTED_COLOR = "#64748B"

DOMAIN_EMOJIS = {
    "Finance": "💰", "Healthcare": "🏥", "Sales": "🛒", "HR": "👥",
    "Education": "🎓", "Manufacturing": "🏭", "Real Estate": "🏢",
    "Technology": "💻", "Marketing": "📢", "Logistics": "🚚",
    "Energy": "⚡", "Agriculture": "🌾", "Hospitality": "🏨",
    "Legal": "⚖️", "Sports": "🏀", "Government": "🏛️",
}

COLOR_PALETTES = {
    "Corporate": ["#118D95", "#185ABD", "#0078D4", "#2563EB", "#1E40AF"],
    "Modern": ["#4F46E5", "#10B981", "#8B5CF6", "#0EA5E9", "#F43F5E"],
    "Semantic": ["#198754", "#DC3545", "#FFC107", "#0D6EFD", "#22C55E"],
    "Vintage": ["#D97706", "#B45309", "#78350F", "#047857", "#065F46"],
    "Pastels": ["#A7F3D0", "#FDE68A", "#FBCFE8", "#C7D2FE", "#BAE6FD"],
}

# ─── Session State ─────────────────────────────────────────────────────────────
if "data" not in st.session_state:
    st.session_state.data = None
if "df" not in st.session_state:
    st.session_state.df = None
if "report_html" not in st.session_state:
    st.session_state.report_html = None
if "color_scheme" not in st.session_state:
    st.session_state.color_scheme = "Corporate"


# ─── Helper Functions ──────────────────────────────────────────────────────────

def detect_domain(df: pd.DataFrame, filename: str) -> str:
    """Detect the most likely business domain from column names and file name."""
    keywords = {
        "Finance": ["revenue", "profit", "cost", "expense", "income", "budget", "tax", "audit", "finance", "accounting"],
        "Healthcare": ["patient", "doctor", "hospital", "clinic", "medical", "diagnosis", "treatment", "health"],
        "Sales": ["sales", "product", "customer", "order", "purchase", "cart", "inventory", "sku", "retail"],
        "HR": ["employee", "staff", "hiring", "attrition", "salary", "payroll", "attendance", "hr", "human resource"],
        "Education": ["student", "teacher", "course", "grade", "score", "exam", "enrollment", "academic"],
        "Manufacturing": ["production", "factory", "manufacturing", "assembly", "batch", "quality", "inventory"],
        "Real Estate": ["property", "rent", "lease", "apartment", "real estate", "mortgage", "tenant"],
        "Technology": ["software", "server", "api", "database", "cloud", "deployment", "tech", "it ", "system"],
        "Marketing": ["campaign", "marketing", "social", "email", "click", "impression", "conversion", "seo"],
        "Logistics": ["logistics", "shipment", "delivery", "fleet", "warehouse", "transport", "courier"],
        "Energy": ["energy", "electricity", "power", "consumption", "utility", "solar", "grid"],
        "Agriculture": ["crop", "harvest", "yield", "farm", "soil", "agriculture", "irrigation"],
    }

    name_lower = filename.lower()
    cols_lower = [str(c).lower() for c in df.columns]
    all_text = " ".join(cols_lower) + " " + name_lower

    scores = {}
    for domain, words in keywords.items():
        score = sum(2 if w in name_lower else 1 for w in words if w in all_text)
        if score > 0:
            scores[domain] = score

    if scores:
        return max(scores, key=scores.get)
    return "General"


def analyze_dataframe(df: pd.DataFrame) -> dict:
    """Generate comprehensive data analysis."""
    numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
    categorical_cols = df.select_dtypes(include=["object", "category"]).tolist()
    datetime_cols = df.select_dtypes(include=["datetime"]).tolist()

    analysis = {
        "total_rows": len(df),
        "total_cols": len(df.columns),
        "numeric_cols": numeric_cols,
        "categorical_cols": categorical_cols,
        "datetime_cols": datetime_cols,
        "missing_data": df.isnull().sum().to_dict(),
        "stats": {},
    }

    for col in numeric_cols:
        analysis["stats"][col] = {
            "min": float(df[col].min()) if not df[col].isnull().all() else 0,
            "max": float(df[col].max()) if not df[col].isnull().all() else 0,
            "avg": float(df[col].mean()) if not df[col].isnull().all() else 0,
            "sum": float(df[col].sum()) if not df[col].isnull().all() else 0,
            "median": float(df[col].median()) if not df[col].isnull().all() else 0,
            "std": float(df[col].std()) if not df[col].isnull().all() else 0,
        }

    return analysis


def generate_report_html(df: pd.DataFrame, filename: str, color_scheme: str) -> str:
    """Generate a complete HTML report with embedded charts."""
    analysis = analyze_dataframe(df)
    domain = detect_domain(df, filename)
    emoji = DOMAIN_EMOJIS.get(domain, "📊")
    palette = COLOR_PALETTES.get(color_scheme, COLOR_PALETTES["Corporate"])
    now = datetime.now().strftime("%B %d, %Y at %H:%M")

    # ── Charts ──────────────────────────────────────────────────────────────
    charts_html = ""

    # 1. Distribution plots for numeric columns
    for col in analysis["numeric_cols"][:4]:
        fig = px.histogram(df, x=col, title=f"Distribution of {col}",
                           color_discrete_sequence=[palette[0]],
                           template="plotly_white")
        fig.update_layout(margin=dict(l=20, r=20, t=40, b=20),
                          height=350, font_family="Inter, sans-serif")
        charts_html += f'<div class="chart-card"><div class="chart-title">📈 Distribution: {col}</div>{fig.to_html(full_html=False, include_plotlyjs="cdn")}</div>'

    # 2. Bar chart for first categorical
    if analysis["categorical_cols"] and analysis["numeric_cols"]:
        cat_col = analysis["categorical_cols"][0]
        num_col = analysis["numeric_cols"][0]
        top_cats = df.groupby(cat_col)[num_col].sum().sort_values(ascending=False).head(10).reset_index()
        fig = px.bar(top_cats, x=cat_col, y=num_col,
                     title=f"{num_col} by {cat_col} (Top 10)",
                     color=cat_col, color_discrete_sequence=palette,
                     template="plotly_white")
        fig.update_layout(showlegend=False, margin=dict(l=20, r=20, t=40, b=20),
                          height=400, font_family="Inter, sans-serif")
        charts_html += f'<div class="chart-card"><div class="chart-title">📊 {num_col} by {cat_col}</div>{fig.to_html(full_html=False, include_plotlyjs="cdn")}</div>'

    # 3. Correlation heatmap
    if len(analysis["numeric_cols"]) >= 2:
        corr_df = df[analysis["numeric_cols"]].corr()
        fig = px.imshow(corr_df, text_auto=".2f", color_continuous_scale="Blues",
                        title="Correlation Matrix", aspect="auto",
                        template="plotly_white")
        fig.update_layout(margin=dict(l=20, r=20, t=40, b=20),
                          height=450, font_family="Inter, sans-serif")
        charts_html += f'<div class="chart-card"><div class="chart-title">🔗 Correlation Matrix</div>{fig.to_html(full_html=False, include_plotlyjs="cdn")}</div>'

    # 4. Pie/Donut for categorical distribution
    if analysis["categorical_cols"]:
        cat_col = analysis["categorical_cols"][0]
        value_counts = df[cat_col].value_counts().head(8).reset_index()
        value_counts.columns = [cat_col, "count"]
        fig = px.pie(value_counts, values="count", names=cat_col,
                     title=f"Distribution of {cat_col}",
                     color_discrete_sequence=palette,
                     template="plotly_white")
        fig.update_traces(textposition="inside", textinfo="percent+label")
        fig.update_layout(margin=dict(l=20, r=20, t=40, b=20),
                          height=400, font_family="Inter, sans-serif")
        charts_html += f'<div class="chart-card"><div class="chart-title">🥧 {cat_col} Distribution</div>{fig.to_html(full_html=False, include_plotlyjs="cdn")}</div>'

    # 5. Time series if datetime column exists
    if analysis["datetime_cols"] and analysis["numeric_cols"]:
        dt_col = analysis["datetime_cols"][0]
        num_col = analysis["numeric_cols"][0]
        ts_data = df.groupby(pd.Grouper(key=dt_col, freq="D"))[num_col].sum().reset_index()
        fig = px.line(ts_data, x=dt_col, y=num_col,
                      title=f"{num_col} Over Time",
                      color_discrete_sequence=[palette[1]],
                      template="plotly_white")
        fig.update_layout(margin=dict(l=20, r=20, t=40, b=20),
                          height=400, font_family="Inter, sans-serif")
        charts_html += f'<div class="chart-card"><div class="chart-title">📈 {num_col} Trend</div>{fig.to_html(full_html=False, include_plotlyjs="cdn")}</div>'

    # ── Generate Stats Table ────────────────────────────────────────────────
    stats_rows = ""
    for col, s in list(analysis["stats"].items())[:10]:
        stats_rows += f"""<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;font-weight:500;">{col}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;text-align:right;">{s['min']:,.1f}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;text-align:right;">{s['max']:,.1f}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;text-align:right;">{s['avg']:,.1f}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;text-align:right;">{s['sum']:,.1f}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #E2E8F0;text-align:right;">{s['median']:,.1f}</td>
        </tr>"""

    # ── Build Full Report ───────────────────────────────────────────────────
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Arjuna Speaks — {filename}</title>
    <script src="https://cdn.plot.ly/plotly-2.35.0.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: 'Inter', -apple-system, sans-serif;
            background: {BG_COLOR};
            color: {TEXT_COLOR};
            line-height: 1.6;
        }}
        .report-container {{ max-width: 1200px; margin: 0 auto; padding: 40px 24px; }}
        .header {{
            background: linear-gradient(135deg, {palette[0]}, {palette[1]});
            color: white;
            padding: 40px 48px;
            border-radius: 16px;
            margin-bottom: 32px;
        }}
        .header h1 {{ font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }}
        .header p {{ font-size: 14px; opacity: 0.9; margin-top: 8px; }}
        .header .meta {{ display: flex; gap: 16px; margin-top: 16px; flex-wrap: wrap; }}
        .header .meta span {{
            background: rgba(255,255,255,0.2);
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
        }}
        .section {{ margin-bottom: 32px; }}
        .section-title {{
            font-size: 18px;
            font-weight: 700;
            color: {TEXT_COLOR};
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }}
        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 12px;
            margin-bottom: 24px;
        }}
        .stat-card {{
            background: {CARD_BG};
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
        }}
        .stat-card .value {{
            font-size: 28px;
            font-weight: 700;
            color: {palette[0]};
            line-height: 1.2;
        }}
        .stat-card .label {{
            font-size: 12px;
            color: {MUTED_COLOR};
            margin-top: 4px;
            font-weight: 500;
        }}
        .stat-card .accent {{
            width: 40px;
            height: 3px;
            background: {palette[0]};
            border-radius: 4px;
            margin: 8px auto 0;
        }}
        .chart-card {{
            background: {CARD_BG};
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            overflow: hidden;
        }}
        .chart-card .chart-title {{
            font-size: 14px;
            font-weight: 600;
            color: {TEXT_COLOR};
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }}
        table.data-table {{
            width: 100%;
            border-collapse: collapse;
            background: {CARD_BG};
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #E2E8F0;
            font-size: 13px;
        }}
        table.data-table thead th {{
            background: {palette[0]}15;
            padding: 12px 16px;
            text-align: left;
            font-weight: 600;
            color: {palette[0]};
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #E2E8F0;
        }}
        .insight-card {{
            background: {CARD_BG};
            border: 1px solid #E2E8F0;
            border-left: 4px solid {palette[0]};
            border-radius: 8px;
            padding: 16px 20px;
            margin-bottom: 12px;
        }}
        .insight-card h4 {{ font-size: 14px; font-weight: 600; margin-bottom: 4px; }}
        .insight-card p {{ font-size: 13px; color: {MUTED_COLOR}; }}
        .footer {{
            text-align: center;
            padding: 24px;
            color: {MUTED_COLOR};
            font-size: 12px;
            border-top: 1px solid #E2E8F0;
            margin-top: 48px;
        }}
        .columns-badge {{
            display: inline-flex;
            gap: 6px;
            flex-wrap: wrap;
            margin-top: 8px;
        }}
        .columns-badge span {{
            padding: 3px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 500;
        }}
        .columns-badge .numeric {{ background: #EFF6FF; color: #2563EB; }}
        .columns-badge .categorical {{ background: #FFF7ED; color: #EA580C; }}
        @media print {{
            .header {{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
            .stat-card {{ break-inside: avoid; }}
            .chart-card {{ break-inside: avoid; page-break-inside: avoid; }}
        }}
    </style>
</head>
<body>
    <div class="report-container">
        <!-- Header -->
        <div class="header">
            <h1>{emoji} {filename}</h1>
            <p>Professional Data Report — Generated by Arjuna Speaks</p>
            <div class="meta">
                <span>📅 {now}</span>
                <span>{analysis['total_rows']:,} rows</span>
                <span>{analysis['total_cols']} columns</span>
                <span>{emoji} {domain}</span>
            </div>
        </div>

        <!-- Key Stats -->
        <div class="section">
            <div class="section-title">📊 Key Metrics</div>
            <div class="stats-grid">
                <div class="stat-card"><div class="value">{analysis['total_rows']:,}</div><div class="label">Total Rows</div><div class="accent"></div></div>
                <div class="stat-card"><div class="value">{analysis['total_cols']}</div><div class="label">Total Columns</div><div class="accent"></div></div>
                <div class="stat-card"><div class="value">{len(analysis['numeric_cols'])}</div><div class="label">Numeric Columns</div><div class="accent"></div></div>
                <div class="stat-card"><div class="value">{len(analysis['categorical_cols'])}</div><div class="label">Categorical Columns</div><div class="accent"></div></div>
            </div>
        </div>

        <!-- Column Details -->
        <div class="section">
            <div class="section-title">📋 Column Information</div>
            <div class="columns-badge">
                {''.join(f'<span class="numeric">🔢 {c}</span>' for c in analysis['numeric_cols'][:8])}
                {''.join(f'<span class="categorical">📁 {c}</span>' for c in analysis['categorical_cols'][:8])}
            </div>
        </div>

        <!-- Statistical Summary -->
        <div class="section">
            <div class="section-title">📈 Statistical Summary</div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Column</th>
                        <th style="text-align:right;">Min</th>
                        <th style="text-align:right;">Max</th>
                        <th style="text-align:right;">Average</th>
                        <th style="text-align:right;">Sum</th>
                        <th style="text-align:right;">Median</th>
                    </tr>
                </thead>
                <tbody>
                    {stats_rows}
                </tbody>
            </table>
        </div>

        <!-- Charts -->
        <div class="section">
            <div class="section-title">📉 Visualizations</div>
            {charts_html}
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>Generated by <strong>Arjuna Speaks</strong> — AI-Powered Data Analysis Platform</p>
            <p style="margin-top:4px;">{now}</p>
            <p style="margin-top:8px;font-size:10px;opacity:0.6;">
                Icons provided by <a href="https://www.flaticon.com/free-icons/fab" target="_blank" style="color:{palette[0]};">Flaticon</a>
            </p>
        </div>
    </div>
</body>
</html>"""

    return html


# ─── UI ────────────────────────────────────────────────────────────────────────

st.markdown(f"""
<style>
    /* Light theme only — enforced */
    :root, .stApp {{
        --background-color: {BG_COLOR};
        --secondary-background-color: {CARD_BG};
        --text-color: {TEXT_COLOR};
        --font-color: {TEXT_COLOR};
    }}
    .stApp header {{ background: white !important; }}
    .main-header {{
        background: linear-gradient(135deg, {ACCENT_COLOR}, {SECONDARY_COLOR});
        color: white;
        padding: 24px 32px;
        border-radius: 16px;
        margin-bottom: 24px;
    }}
    .main-header h1 {{ font-size: 28px; font-weight: 800; margin: 0; }}
    .main-header p {{ opacity: 0.9; font-size: 14px; margin-top: 4px; }}
    .report-preview {{
        background: {CARD_BG};
        border: 1px solid #E2E8F0;
        border-radius: 16px;
        padding: 4px;
        overflow: hidden;
    }}
    .stTabs [data-baseweb="tab-list"] {{ gap: 8px; }}
    .stTabs [data-baseweb="tab"] {{
        border-radius: 8px;
        padding: 8px 16px;
        font-weight: 500;
    }}
    .stTabs [aria-selected="true"] {{
        background: {ACCENT_COLOR} !important;
        color: white !important;
    }}
    .metric-chip {{
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
    }}
    div[data-testid="stFileUploader"] {{
        border: 2px dashed #CBD5E1;
        border-radius: 12px;
        padding: 24px;
        background: {CARD_BG};
    }}
    div[data-testid="stFileUploader"]:hover {{
        border-color: {ACCENT_COLOR};
        background: #F0F5FF;
    }}
</style>
""", unsafe_allow_html=True)

# ─── Sidebar ───────────────────────────────────────────────────────────────────

with st.sidebar:
    st.markdown(f"""
    <div style="text-align:center;padding:16px 0;">
        <div style="font-size:48px;margin-bottom:8px;">📊</div>
        <h3 style="color:{TEXT_COLOR};font-weight:700;">Arjuna Speaks</h3>
        <p style="color:{MUTED_COLOR};font-size:12px;">AI Report Generator</p>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("---")
    st.markdown("### ⚙️ Settings")

    color_scheme = st.selectbox(
        "Color Scheme",
        options=list(COLOR_PALETTES.keys()),
        index=0,
        key="color_scheme_select",
    )
    st.session_state.color_scheme = color_scheme

    st.markdown("---")
    st.markdown("### 📋 About")
    st.markdown("""
    <p style="font-size:12px;color:#64748B;">
    Upload a CSV or Excel file to generate a professional data report 
    with statistical analysis, visualizations, and insights.
    </p>
    """, unsafe_allow_html=True)

    st.markdown("---")
    st.markdown(f"""
    <p style="font-size:10px;text-align:center;color:#94A3B8;">
        Icons by <a href="https://www.flaticon.com/free-icons/fab" target="_blank" style="color:{ACCENT_COLOR};">Flaticon</a>
    </p>
    """, unsafe_allow_html=True)


# ─── Main Content ──────────────────────────────────────────────────────────────

st.markdown(f"""
<div class="main-header">
    <h1>📊 Professional Report Generator</h1>
    <p>Upload your data and get a comprehensive, exportable HTML report with charts, statistics, and insights.</p>
</div>
""", unsafe_allow_html=True)

# File upload
uploaded_file = st.file_uploader(
    "Choose a CSV or Excel file",
    type=["csv", "xlsx", "xls"],
    help="Supports .csv, .xlsx, .xls files up to 500MB",
)

if uploaded_file is not None:
    # Read the file
    try:
        file_ext = uploaded_file.name.split(".")[-1].lower()
        if file_ext == "csv":
            df = pd.read_csv(uploaded_file)
        else:
            df = pd.read_excel(uploaded_file, engine="openpyxl")

        st.session_state.df = df
        st.session_state.data = uploaded_file

        # Show file info
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("Rows", f"{len(df):,}")
        with col2:
            st.metric("Columns", len(df.columns))
        with col3:
            st.metric("Numeric", len(df.select_dtypes(include=["number"]).columns))
        with col4:
            st.metric("Categories", len(df.select_dtypes(include=["object", "category"]).columns))

        # Preview
        with st.expander("👁️ Data Preview", expanded=False):
            st.dataframe(df.head(10), use_container_width=True)

        # Generate Report
        st.markdown("---")
        st.markdown("### 🚀 Generate Report")

        report_name = st.text_input(
            "Report Title (optional)",
            value=uploaded_file.name.replace(f".{file_ext}", ""),
            placeholder="Enter a custom report title...",
        )

        generate_btn = st.button(
            "📄 Generate Professional Report",
            type="primary",
            use_container_width=True,
        )

        if generate_btn:
            with st.spinner("Generating report... This may take a moment."):
                html_content = generate_report_html(
                    df,
                    report_name or uploaded_file.name,
                    st.session_state.color_scheme,
                )
                st.session_state.report_html = html_content

            st.success("✅ Report generated successfully!")

            # Show preview
            st.markdown("### 👇 Report Preview")
            with st.container():
                st.components.v1.html(html_content, height=800, scrolling=True)

            # Download buttons
            col1, col2 = st.columns(2)
            with col1:
                b64 = base64.b64encode(html_content.encode()).decode()
                href = f'<a href="data:text/html;base64,{b64}" download="{report_name}_report.html" style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;background:{ACCENT_COLOR};color:white;text-decoration:none;border-radius:10px;font-weight:500;font-size:14px;">📥 Download HTML Report</a>'
                st.markdown(href, unsafe_allow_html=True)

            with col2:
                # PDF via print (client-side)
                st.markdown(f"""
                <button onclick="window.print()" style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;background:white;color:{TEXT_COLOR};border:1px solid #E2E8F0;text-decoration:none;border-radius:10px;font-weight:500;font-size:14px;cursor:pointer;">
                    🖨️ Print / Save as PDF
                </button>
                """, unsafe_allow_html=True)

    except Exception as e:
        st.error(f"❌ Error reading file: {str(e)}")
        st.info("Please check that your file is a valid CSV or Excel file.")

else:
    # Empty state
    st.markdown("""
    <div style="text-align:center;padding:80px 24px;">
        <div style="font-size:64px;margin-bottom:16px;">📤</div>
        <h3 style="color:#1E293B;font-weight:600;">Upload a file to get started</h3>
        <p style="color:#64748B;max-width:400px;margin:8px auto 0;">
            Drop your CSV or Excel file above and we'll generate a beautiful, 
            professional report with charts, statistics, and key insights.
        </p>
    </div>
    """, unsafe_allow_html=True)
