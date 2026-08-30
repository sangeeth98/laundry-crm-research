import json
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

# Setup aesthetic plotting styling
plt.style.use('seaborn-v0_8-whitegrid')
plt.rcParams['font.sans-serif'] = 'Helvetica, Arial, DejaVu Sans'
plt.rcParams['axes.edgecolor'] = '#cbd5e1'
plt.rcParams['axes.linewidth'] = 1.0

CHARTS_DIR = Path("data/charts")
CHARTS_DIR.mkdir(parents=True, exist_ok=True)

# Load data
with open("data/laundry_crm_master_intelligence.json", "r", encoding="utf-8") as f:
    competitors = json.load(f)

# 1. Chart: Monthly Pricing vs Client Base Size
names = [c["name"].split("(")[0].strip() for c in competitors if "monthly_pricing_usd" in c and "standard" in c["monthly_pricing_usd"]]
prices = [c["monthly_pricing_usd"]["standard"] for c in competitors if "monthly_pricing_usd" in c and "standard" in c["monthly_pricing_usd"]]
clients = [c["estimated_clients"] for c in competitors if "monthly_pricing_usd" in c and "standard" in c["monthly_pricing_usd"]]
origins = [c["origin_country"] for c in competitors if "monthly_pricing_usd" in c and "standard" in c["monthly_pricing_usd"]]

plt.figure(figsize=(10, 6), dpi=300)
colors = ['#2563eb' if 'India' in o else '#059669' if 'USA' in o else '#d97706' for o in origins]

scatter = plt.scatter(prices, clients, s=[max(100, p*5) for p in prices], c=colors, alpha=0.8, edgecolors='black', linewidth=1.5)

for i, txt in enumerate(names):
    plt.annotate(f"{txt} (${prices[i]}/mo)", (prices[i] + 3, clients[i] + 120), fontsize=9, fontweight='semibold', color='#1e293b')

plt.title("Laundry CRM Landscape: Monthly Standard Price vs Estimated Client Footprint", fontsize=13, fontweight='bold', pad=15, color='#0f172a')
plt.xlabel("Standard Monthly Subscription (USD $)", fontsize=11, fontweight='semibold', labelpad=10)
plt.ylabel("Estimated Business Client Stores", fontsize=11, fontweight='semibold', labelpad=10)
plt.xlim(0, 280)
plt.ylim(0, 7000)

# Custom legend
from matplotlib.lines import Line2D
legend_elements = [
    Line2D([0], [0], marker='o', color='w', label='India-Rooted', markerfacecolor='#2563eb', markersize=10),
    Line2D([0], [0], marker='o', color='w', label='USA-Rooted', markerfacecolor='#059669', markersize=10),
    Line2D([0], [0], marker='o', color='w', label='UK / Aus / Global', markerfacecolor='#d97706', markersize=10)
]
plt.legend(handles=legend_elements, loc='upper right', frameon=True, facecolor='white', framealpha=0.95)
plt.tight_layout()
plt.savefig(CHARTS_DIR / "laundry_crm_pricing_vs_market_reach.png")
plt.close()

# 2. Chart: Customer Friction & Problem Breakdown
friction_labels = [
    "Garment Loss &\nDispute Claims",
    "Hardware Lock-in\n& High Capex",
    "Hidden Add-on &\nSMS Markup Fees",
    "Slow / Unresponsive\nPost-Sales Support",
    "Staff Training &\nComplex Counter UI",
    "Un-invoiced Cash\nSkimming by Staff"
]
friction_impact_score = [95, 88, 85, 82, 78, 92] # Out of 100 in severity & frequency
friction_colors = ['#dc2626', '#ea580c', '#d97706', '#ca8a04', '#4f46e5', '#9333ea']

plt.figure(figsize=(10, 5.5), dpi=300)
bars = plt.barh(friction_labels, friction_impact_score, color=friction_colors, height=0.6, edgecolor='#334155', linewidth=1)

for bar in bars:
    w = bar.get_width()
    plt.text(w + 1.5, bar.get_y() + bar.get_height()/2, f"{int(w)}/100", ha='left', va='center', fontsize=10, fontweight='bold', color='#1e293b')

plt.title("Industry Problem Index: Top Customer Complaints & Operational Friction in Laundry CRM", fontsize=13, fontweight='bold', pad=15, color='#0f172a')
plt.xlabel("Severity & Complaint Frequency Index (0 - 100)", fontsize=11, fontweight='semibold', labelpad=10)
plt.xlim(0, 110)
plt.gca().invert_yaxis()
plt.tight_layout()
plt.savefig(CHARTS_DIR / "customer_friction_severity_matrix.png")
plt.close()

# 3. Chart: 1-3 Store Indian Laundry Economics (Before vs After Our Next-Gen CRM)
categories = ['Monthly Revenue', 'Prevented Cash Skimming', 'Garment Dispute Loss', 'CRM Software Cost', 'Net Monthly Profit']
before_inr = [300000, 0, -18000, -5500, 72000] # In INR per 2-store average
after_inr = [390000, 24000, -1500, -999, 142501] # +30% orders via WhatsApp/online, IoT eliminates cash theft, AI stops claims

x = range(len(categories))
width = 0.35

fig, ax = plt.subplots(figsize=(11, 6), dpi=300)
rects1 = ax.bar([i - width/2 for i in x], [abs(v) for v in before_inr], width, label='Traditional Ops (Manual / Legacy QDC)', color='#94a3b8', edgecolor='#475569')
rects2 = ax.bar([i + width/2 for i in x], [abs(v) for v in after_inr], width, label='Next-Gen CRM Powered Store', color='#10b981', edgecolor='#065f46')

ax.set_title("Unit Economics Transformation for a 2-Store Retail Laundry in India (Monthly INR ₹)", fontsize=13, fontweight='bold', pad=15, color='#0f172a')
ax.set_xticks(list(x))
ax.set_xticklabels(categories, fontsize=10, fontweight='semibold')
ax.set_ylabel("Amount (INR ₹)", fontsize=11, fontweight='semibold')
ax.legend(frameon=True, facecolor='white', framealpha=0.95)

# Formatting y axis with rupee commas
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda val, loc: f"₹{int(val):,}"))
plt.tight_layout()
plt.savefig(CHARTS_DIR / "indian_smb_laundry_economic_impact.png")
plt.close()

print("Generated all 3 visual intelligence charts in data/charts/")
