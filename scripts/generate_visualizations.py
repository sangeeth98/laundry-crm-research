import json
import os
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

# Set style
sns.set_theme(style="whitegrid")
plt.rcParams.update({'font.sans-serif': 'Segoe UI', 'font.size': 11})

# Ensure charts folder exists
charts_dir = os.path.join("data", "charts")
os.makedirs(charts_dir, exist_ok=True)

# Load data
with open("data/market_players.json", "r") as f:
    df_players = pd.DataFrame(json.load(f))

with open("data/crm_software_benchmark.json", "r") as f:
    df_crm = pd.DataFrame(json.load(f))

with open("data/operational_friction.json", "r") as f:
    df_friction = pd.DataFrame(json.load(f))

print("Data successfully loaded!")

# ---------------------------------------------------------
# Chart 1: Store Count & City Reach Comparison
# ---------------------------------------------------------
fig, ax1 = plt.subplots(figsize=(10, 6))
df_sorted = df_players.sort_values(by="store_count", ascending=True)
y = np.arange(len(df_sorted))
height = 0.35

rects1 = ax1.barh(y + height/2, df_sorted["store_count"], height, label='Store Count', color='#2b5c8f')
rects2 = ax1.barh(y - height/2, df_sorted["cities_served"], height, label='Cities Served', color='#4ba3e3')

ax1.set_xlabel('Count', fontsize=12, fontweight='bold')
ax1.set_title('Indian Laundry Market: Store Footprint vs City Coverage', fontsize=14, fontweight='bold', pad=15)
ax1.set_yticks(y)
ax1.set_yticklabels(df_sorted["company"], fontweight='bold')
ax1.legend(loc='lower right', frameon=True)

for rect in rects1:
    width = rect.get_width()
    ax1.annotate(f'{int(width):,}', xy=(width, rect.get_y() + rect.get_height() / 2),
                xytext=(5, 0), textcoords="offset points", ha='left', va='center', fontweight='bold', color='#1e3d59')

for rect in rects2:
    width = rect.get_width()
    ax1.annotate(f'{int(width):,}', xy=(width, rect.get_y() + rect.get_height() / 2),
                xytext=(5, 0), textcoords="offset points", ha='left', va='center', color='#006699')

plt.tight_layout()
plt.savefig(os.path.join(charts_dir, "chart_1_store_and_city_reach.png"), dpi=300)
plt.close()

# ---------------------------------------------------------
# Chart 2: Estimated Revenue & Funding Comparison
# ---------------------------------------------------------
fig, ax2 = plt.subplots(figsize=(10, 6))
df_rev_sorted = df_players.sort_values(by="est_revenue_inr_cr", ascending=False)
palette = ['#107c41', '#1f77b4', '#ff7f0e', '#d62728', '#9467bd', '#8c564b']

bars = ax2.bar(df_rev_sorted["company"], df_rev_sorted["est_revenue_inr_cr"], color=palette, edgecolor='black', alpha=0.85)
ax2.set_ylabel('Est. Network Turnover (INR Crore)', fontsize=12, fontweight='bold')
ax2.set_title('Estimated Annual Turnover (FY25) by Brand', fontsize=14, fontweight='bold', pad=15)
plt.xticks(fontweight='bold')

for bar in bars:
    height = bar.get_height()
    ax2.annotate(f'INR {height:.1f} Cr', xy=(bar.get_x() + bar.get_width() / 2, height),
                xytext=(0, 5), textcoords="offset points", ha='center', va='bottom', fontweight='bold')

plt.tight_layout()
plt.savefig(os.path.join(charts_dir, "chart_2_revenue_comparison.png"), dpi=300)
plt.close()

# ---------------------------------------------------------
# Chart 3: Play Store App UX Rating
# ---------------------------------------------------------
fig, ax3 = plt.subplots(figsize=(10, 5))
df_rating_sorted = df_players.sort_values(by="app_rating", ascending=False)
colors = ['#28a745' if r >= 4.0 else '#ffc107' if r >= 3.7 else '#dc3545' for r in df_rating_sorted["app_rating"]]

bars3 = ax3.bar(df_rating_sorted["company"], df_rating_sorted["app_rating"], color=colors, width=0.5, edgecolor='black')
ax3.set_ylim(0, 5.0)
ax3.set_ylabel('Play Store / App Store Rating (out of 5.0)', fontsize=12, fontweight='bold')
ax3.set_title('Customer Satisfaction & App UX Ratings', fontsize=14, fontweight='bold', pad=15)
ax3.axhline(4.0, color='green', linestyle='--', linewidth=1.5, label='Target Benchmark (4.0+)')
ax3.legend()

for bar in bars3:
    height = bar.get_height()
    ax3.annotate(f'{height:.1f} Star', xy=(bar.get_x() + bar.get_width() / 2, height),
                xytext=(0, 5), textcoords="offset points", ha='center', va='bottom', fontweight='bold')

plt.tight_layout()
plt.savefig(os.path.join(charts_dir, "chart_3_app_ratings.png"), dpi=300)
plt.close()

# ---------------------------------------------------------
# Chart 4: Operational Friction Heatmap
# ---------------------------------------------------------
fig, ax4 = plt.subplots(figsize=(9, 5))
heatmap_data = df_friction[['severity_score', 'frequency_score']].copy()
heatmap_data.index = df_friction['title']

sns.heatmap(heatmap_data, annot=True, cmap='Reds', fmt='.1f', linewidths=1.5, ax=ax4, cbar_kws={'label': 'Impact Score (1-10)'})
ax4.set_title('Operational Pain Points & Failure Severity Matrix', fontsize=14, fontweight='bold', pad=15)
ax4.set_ylabel('Industry Friction Issue', fontsize=11, fontweight='bold')
ax4.set_xlabel('Metric', fontsize=11, fontweight='bold')

plt.tight_layout()
plt.savefig(os.path.join(charts_dir, "chart_4_friction_heatmap.png"), dpi=300)
plt.close()

# ---------------------------------------------------------
# Chart 5: Sub-Market CRM Ecosystem Distribution
# ---------------------------------------------------------
fig, ax5 = plt.subplots(figsize=(10, 5))
submarket_counts = df_crm['sub_market'].value_counts()
explode = [0.05] + [0.0] * (len(submarket_counts) - 1)

ax5.pie(submarket_counts, labels=submarket_counts.index, autopct='%1.1f%%', startangle=140, 
        explode=explode)
ax5.set_title('Specialized Laundry CRM Sub-Market Coverage', fontsize=14, fontweight='bold', pad=15)

plt.tight_layout()
plt.savefig(os.path.join(charts_dir, "chart_5_submarket_distribution.png"), dpi=300)
plt.close()

print("All 5 charts successfully generated in data/charts/!")
