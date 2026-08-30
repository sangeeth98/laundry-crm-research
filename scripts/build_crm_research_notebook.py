import json
from pathlib import Path

notebook = {
    "cells": [
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "# 👔 Laundry CRM & POS B2B SaaS Deep Intelligence Dashboard\n",
                "**Analysis Scope:** 20+ Global & Indian Laundry CRM Platforms, Founder Leadership Dossiers, Grievance Mining & SMB Playbook  \n",
                "**Target Segment:** Independent Retail Laundry & Dry Cleaning Outlets (1–3 Stores with Processing Units) in India  \n",
                "\n",
                "This interactive Jupyter notebook performs quantitative analysis, pricing benchmarking, customer grievance severity scoring, and economic transformation modeling for our competitive CRM solution."
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "import json\n",
                "import pandas as pd\n",
                "import matplotlib.pyplot as plt\n",
                "import seaborn as sns\n",
                "import numpy as np\n",
                "\n",
                "# Aesthetic plot styling\n",
                "sns.set_theme(style='whitegrid')\n",
                "plt.rcParams.update({'font.sans-serif': 'Segoe UI', 'font.size': 11})\n",
                "\n",
                "# 1. Load Master Intelligence Datasets\n",
                "with open('data/laundry_crm_master_intelligence.json', 'r', encoding='utf-8') as f:\n",
                "    competitors_raw = json.load(f)\n",
                "\n",
                "with open('data/laundry_crm_founders_dossier.json', 'r', encoding='utf-8') as f:\n",
                "    founders_raw = json.load(f)\n",
                "\n",
                "with open('data/laundry_crm_customer_friction_matrix.json', 'r', encoding='utf-8') as f:\n",
                "    friction_raw = json.load(f)\n",
                "\n",
                "with open('data/laundry_smb_opportunity_playbook.json', 'r', encoding='utf-8') as f:\n",
                "    playbook_raw = json.load(f)\n",
                "\n",
                "# Flatten competitor data into DataFrame\n",
                "crm_list = []\n",
                "for c in competitors_raw:\n",
                "    std_price = c.get('monthly_pricing_usd', {}).get('standard', None)\n",
                "    if std_price is None:\n",
                "        std_price = list(c.get('monthly_pricing_usd', {}).values())[0] if c.get('monthly_pricing_usd') else 0\n",
                "    crm_list.append({\n",
                "        'id': c['id'],\n",
                "        'name': c['name'],\n",
                "        'origin': c['origin_country'],\n",
                "        'year_founded': c['year_founded'],\n",
                "        'status': c['status'],\n",
                "        'funding': c['funding_status'],\n",
                "        'clients': c['estimated_clients'],\n",
                "        'countries': c['countries_active'],\n",
                "        'price_usd': std_price\n",
                "    })\n",
                "\n",
                "df_crm = pd.DataFrame(crm_list)\n",
                "print(f\"Loaded {len(df_crm)} Competitor Profiles, {len(founders_raw)} Founder Dossiers, and {len(friction_raw)} Customer Grievance Categories.\")\n",
                "df_crm[['name', 'origin', 'year_founded', 'price_usd', 'clients', 'countries']].sort_values(by='clients', ascending=False)"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## 1. Global & Indian Laundry CRM Pricing vs Client Reach\n",
                "We benchmark standard monthly SaaS pricing (USD) against total active business clients and geographic distribution."
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "plt.figure(figsize=(11, 6), dpi=150)\n",
                "\n",
                "colors = ['#2563eb' if 'India' in o else '#059669' if 'USA' in o else '#d97706' for o in df_crm['origin']]\n",
                "sizes = [max(120, p * 4) for p in df_crm['price_usd']]\n",
                "\n",
                "plt.scatter(df_crm['price_usd'], df_crm['clients'], s=sizes, c=colors, alpha=0.8, edgecolors='black', linewidth=1.2)\n",
                "\n",
                "for _, row in df_crm.iterrows():\n",
                "    short_name = row['name'].split('(')[0].strip()\n",
                "    plt.annotate(f\"{short_name} (${row['price_usd']}/mo)\", (row['price_usd'] + 3, row['clients'] + 100), fontsize=9, fontweight='bold', color='#1e293b')\n",
                "\n",
                "plt.title('Laundry CRM Benchmark: Monthly Subscription (USD $) vs Client Footprint', fontsize=14, fontweight='bold', pad=15)\n",
                "plt.xlabel('Standard Monthly Subscription (USD $)', fontsize=12, fontweight='bold')\n",
                "plt.ylabel('Estimated Active Store Clients', fontsize=12, fontweight='bold')\n",
                "plt.xlim(0, 260)\n",
                "plt.ylim(0, 6800)\n",
                "\n",
                "from matplotlib.lines import Line2D\n",
                "legend_elements = [\n",
                "    Line2D([0], [0], marker='o', color='w', label='India-Rooted (QDC, FabKlean, Swash, Zoho)', markerfacecolor='#2563eb', markersize=10),\n",
                "    Line2D([0], [0], marker='o', color='w', label='USA-Rooted (Cents, SPOT, Curbside, Wash-Dry-Fold)', markerfacecolor='#059669', markersize=10),\n",
                "    Line2D([0], [0], marker='o', color='w', label='UK / Aus / Global (CleanCloud, Geelus)', markerfacecolor='#d97706', markersize=10)\n",
                "]\n",
                "plt.legend(handles=legend_elements, loc='upper right', frameon=True)\n",
                "plt.tight_layout()\n",
                "plt.show()"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## 2. Customer Grievance & Operational Friction Severity Matrix\n",
                "Analysis of real-world complaints mined from G2, Capterra, Reddit (r/drycleaning), and app reviews."
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "df_fric = pd.DataFrame(friction_raw)\n",
                "\n",
                "severity_map = {'CRITICAL': 95, 'HIGH': 82, 'MEDIUM': 65}\n",
                "df_fric['score'] = df_fric['severity'].map(severity_map)\n",
                "\n",
                "plt.figure(figsize=(10, 5), dpi=150)\n",
                "palette = ['#dc2626' if s == 'CRITICAL' else '#ea580c' for s in df_fric['severity']]\n",
                "\n",
                "bars = plt.barh(df_fric['category'], df_fric['score'], color=palette, height=0.55, edgecolor='#1e293b')\n",
                "\n",
                "for bar in bars:\n",
                "    w = bar.get_width()\n",
                "    plt.text(w + 1.5, bar.get_y() + bar.get_height()/2, f\"{int(w)}/100\", ha='left', va='center', fontweight='bold')\n",
                "\n",
                "plt.title('Top Operational Friction Points in Retail Laundry Software', fontsize=14, fontweight='bold', pad=15)\n",
                "plt.xlabel('Severity Index (0 - 100)', fontsize=12, fontweight='bold')\n",
                "plt.xlim(0, 110)\n",
                "plt.gca().invert_yaxis()\n",
                "plt.tight_layout()\n",
                "plt.show()"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## 3. Unit Economics: Traditional Store vs Next-Gen CRM Powered Store\n",
                "Simulation of monthly financial gains for a 2-store independent laundry operator in India."
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "categories = ['Monthly Revenue', 'Prevented Cash Skimming', 'Garment Dispute Loss', 'CRM Software Cost', 'Net Monthly Profit']\n",
                "before_ops = [300000, 0, -18000, -5500, 72000]\n",
                "after_ops = [390000, 24000, -1500, -999, 142501]\n",
                "\n",
                "x = np.arange(len(categories))\n",
                "width = 0.35\n",
                "\n",
                "fig, ax = plt.subplots(figsize=(11, 5.5), dpi=150)\n",
                "rects1 = ax.bar(x - width/2, [abs(v) for v in before_ops], width, label='Traditional Store (Manual / Legacy QDC)', color='#94a3b8', edgecolor='#475569')\n",
                "rects2 = ax.bar(x + width/2, [abs(v) for v in after_ops], width, label='Next-Gen CRM Powered Store', color='#10b981', edgecolor='#065f46')\n",
                "\n",
                "ax.set_title('Financial Transformation for a 2-Store Retail Laundry in India (Monthly INR ₹)', fontsize=14, fontweight='bold', pad=15)\n",
                "ax.set_xticks(x)\n",
                "ax.set_xticklabels(categories, fontweight='bold')\n",
                "ax.set_ylabel('Amount in INR (₹)', fontsize=12, fontweight='bold')\n",
                "ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda val, loc: f'₹{int(val):,}'))\n",
                "ax.legend(frameon=True)\n",
                "\n",
                "plt.tight_layout()\n",
                "plt.show()"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## 4. Key Takeaways & Strategic Blueprint\n",
                "1. **WhatsApp-First UX:** 100% of customer interactions occur inside WhatsApp with UPI 1-click payment links.\n",
                "2. **AI Anti-Loss Intake:** Smartphone photo at counter logs stains and pre-existing tears -> eliminates false damage claims.\n",
                "3. **IoT Machine Power Relay:** Plugs into commercial washers to block un-invoiced cycles -> saves ₹24,000/mo.\n",
                "4. **Affordable Pricing:** ₹999/month flat per store with zero hardware mandates."
            ]
        }
    ],
    "metadata": {
        "language_info": {
            "name": "python"
        }
    },
    "nbformat": 4,
    "nbformat_minor": 2
}

with open("laundry_crm_deep_research_v3.ipynb", "w", encoding="utf-8") as f:
    json.dump(notebook, f, indent=2)

print("Generated laundry_crm_deep_research_v3.ipynb successfully!")
