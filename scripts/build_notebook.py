import json
import os

notebook = {
    "cells": [
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "# 🧺 Indian Laundry Market & CRM Competitive Analytics\n",
                "**Notebook Version:** 2.0  \n",
                "**Framework:** Open Knowledge Format (OKF) v0.2 Data & Analytics  \n",
                "**Author:** AI Pair Research & Product Team  \n",
                "\n",
                "This notebook performs quantitative exploratory data analysis and generates visualizations for the Indian organized laundry business landscape (**Tumbledry**, **UClean**, **DhobiLite**, **Fabricspa**, **Laundrywala**, **LaundroKart**) and specialized laundry SaaS CRM platforms (**Quick Dry Cleaning - QDC**, **CleanCloud**, **Cents OS**, **Zoho Laundry CRM**)."
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "import json\n",
                "import os\n",
                "import pandas as pd\n",
                "import matplotlib.pyplot as plt\n",
                "import seaborn as sns\n",
                "import numpy as np\n",
                "\n",
                "# Set design theme\n",
                "sns.set_theme(style=\"whitegrid\")\n",
                "plt.rcParams.update({'font.sans-serif': 'Segoe UI', 'font.size': 11})\n",
                "\n",
                "# Load structured datasets\n",
                "with open(\"data/market_players.json\", \"r\") as f:\n",
                "    df_players = pd.DataFrame(json.load(f))\n",
                "\n",
                "with open(\"data/crm_software_benchmark.json\", \"r\") as f:\n",
                "    df_crm = pd.DataFrame(json.load(f))\n",
                "\n",
                "with open(\"data/operational_friction.json\", \"r\") as f:\n",
                "    df_friction = pd.DataFrame(json.load(f))\n",
                "\n",
                "print(\"Datasets successfully loaded!\")\n",
                "df_players[['company', 'store_count', 'cities_served', 'business_model', 'est_revenue_inr_cr', 'app_rating']]"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## 1. Market Footprint: Store Count vs Cities Served\n",
                "We compare the total physical store outlets and geographical city reach across top Indian brands."
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "fig, ax1 = plt.subplots(figsize=(10, 5))\n",
                "\n",
                "df_sorted = df_players.sort_values(by=\"store_count\", ascending=True)\n",
                "y = np.arange(len(df_sorted))\n",
                "height = 0.35\n",
                "\n",
                "rects1 = ax1.barh(y + height/2, df_sorted[\"store_count\"], height, label='Store Outlets', color='#2b5c8f')\n",
                "rects2 = ax1.barh(y - height/2, df_sorted[\"cities_served\"], height, label='Cities Covered', color='#4ba3e3')\n",
                "\n",
                "ax1.set_xlabel('Count', fontsize=12, fontweight='bold')\n",
                "ax1.set_title('Indian Laundry Chains: Physical Outlets vs City Footprint', fontsize=14, fontweight='bold', pad=15)\n",
                "ax1.set_yticks(y)\n",
                "ax1.set_yticklabels(df_sorted[\"company\"], fontweight='bold')\n",
                "ax1.legend(loc='lower right', frameon=True)\n",
                "\n",
                "for rect in rects1:\n",
                "    width = rect.get_width()\n",
                "    ax1.annotate(f'{int(width):,}', xy=(width, rect.get_y() + rect.get_height() / 2),\n",
                "                xytext=(5, 0), textcoords=\"offset points\", ha='left', va='center', fontweight='bold', color='#1e3d59')\n",
                "\n",
                "for rect in rects2:\n",
                "    width = rect.get_width()\n",
                "    ax1.annotate(f'{int(width):,}', xy=(width, rect.get_y() + rect.get_height() / 2),\n",
                "                xytext=(5, 0), textcoords=\"offset points\", ha='left', va='center', color='#006699')\n",
                "\n",
                "plt.tight_layout()\n",
                "plt.show()"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## 2. Revenue & Financial Performance (FY25 Turnover)\n",
                "Estimated annual network turnover in INR Crores."
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "fig, ax2 = plt.subplots(figsize=(10, 5))\n",
                "\n",
                "df_rev_sorted = df_players.sort_values(by=\"est_revenue_inr_cr\", ascending=False)\n",
                "palette = ['#107c41', '#1f77b4', '#ff7f0e', '#d62728', '#9467bd', '#8c564b']\n",
                "\n",
                "bars = ax2.bar(df_rev_sorted[\"company\"], df_rev_sorted[\"est_revenue_inr_cr\"], color=palette, edgecolor='black', alpha=0.85)\n",
                "\n",
                "ax2.set_ylabel('Est. Network Turnover (INR Crore)', fontsize=12, fontweight='bold')\n",
                "ax2.set_title('Estimated Annual Turnover (FY25) by Brand', fontsize=14, fontweight='bold', pad=15)\n",
                "plt.xticks(fontweight='bold')\n",
                "\n",
                "for bar in bars:\n",
                "    height = bar.get_height()\n",
                "    ax2.annotate(f'INR {height:.1f} Cr',\n",
                "                xy=(bar.get_x() + bar.get_width() / 2, height),\n",
                "                xytext=(0, 5), textcoords=\"offset points\", ha='center', va='bottom', fontweight='bold')\n",
                "\n",
                "plt.tight_layout()\n",
                "plt.show()"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## 3. Customer Satisfaction vs Operational Failure Heatmap\n",
                "Analyzing Play Store ratings and industry friction points (Garment Loss, Pre-existing Stain Disputes, Franchise Cash Leakage)."
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "fig, (ax3, ax4) = plt.subplots(1, 2, figsize=(14, 5))\n",
                "\n",
                "# App Ratings\n",
                "df_rating_sorted = df_players.sort_values(by=\"app_rating\", ascending=False)\n",
                "colors = ['#28a745' if r >= 4.0 else '#ffc107' if r >= 3.7 else '#dc3545' for r in df_rating_sorted[\"app_rating\"]]\n",
                "\n",
                "bars3 = ax3.bar(df_rating_sorted[\"company\"], df_rating_sorted[\"app_rating\"], color=colors, width=0.5, edgecolor='black')\n",
                "ax3.set_ylim(0, 5.0)\n",
                "ax3.set_ylabel('Play Store / App Store Rating', fontsize=11, fontweight='bold')\n",
                "ax3.set_title('App UX & Customer Rating', fontsize=13, fontweight='bold')\n",
                "ax3.axhline(4.0, color='green', linestyle='--', label='Target Benchmark (4.0+)')\n",
                "ax3.legend()\n",
                "\n",
                "for bar in bars3:\n",
                "    height = bar.get_height()\n",
                "    ax3.annotate(f'{height:.1f} Star', xy=(bar.get_x() + bar.get_width() / 2, height),\n",
                "                xytext=(0, 5), textcoords=\"offset points\", ha='center', va='bottom', fontweight='bold')\n",
                "\n",
                "# Heatmap\n",
                "heatmap_data = df_friction[['severity_score', 'frequency_score']].copy()\n",
                "heatmap_data.index = df_friction['title']\n",
                "\n",
                "sns.heatmap(heatmap_data, annot=True, cmap='Reds', fmt='.1f', linewidths=1.5, ax=ax4, cbar_kws={'label': 'Score (1-10)'})\n",
                "ax4.set_title('Operational Friction & Severity Matrix', fontsize=13, fontweight='bold')\n",
                "\n",
                "plt.tight_layout()\n",
                "plt.show()"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## 4. Key Takeaways for Building \"Can't Say No\" Laundry CRM\n",
                "1. **Garment Anti-Loss Tech**: AI Photo Garment Intake + Thermal Wash-Proof Barcode/RFID tags eliminates the #1 customer complaint (lost clothes).\n",
                "2. **WhatsApp Native OS**: Removes app download friction, boosting conversion by 60%.\n",
                "3. **IoT Smart Machine Relay**: Stops cash skimming by requiring POS activation to turn on washers/dryers."
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

with open("laundry_market_visualization.ipynb", "w", encoding="utf-8") as f:
    json.dump(notebook, f, indent=2)

print("Jupyter Notebook laundry_market_visualization.ipynb successfully generated!")
