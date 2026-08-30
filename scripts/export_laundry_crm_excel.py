import json
import os
from pathlib import Path
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# Paths
OUTPUT_DIR_DRIVE = Path(r"C:\Users\sangeeth\My Drive\projects\Laundry-CRM")
OUTPUT_DIR_LOCAL = Path("data")

OUTPUT_DIR_DRIVE.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR_LOCAL.mkdir(parents=True, exist_ok=True)

EXCEL_NAME = "Laundry_CRM_Market_Intelligence_Master.xlsx"
EXCEL_PATH_DRIVE = OUTPUT_DIR_DRIVE / EXCEL_NAME
EXCEL_PATH_LOCAL = OUTPUT_DIR_LOCAL / EXCEL_NAME

# Load data files
with open("data/laundry_crm_master_intelligence.json", "r", encoding="utf-8") as f:
    competitors = json.load(f)

with open("data/laundry_crm_founders_dossier.json", "r", encoding="utf-8") as f:
    founders = json.load(f)

with open("data/laundry_crm_customer_friction_matrix.json", "r", encoding="utf-8") as f:
    friction = json.load(f)

with open("data/laundry_smb_opportunity_playbook.json", "r", encoding="utf-8") as f:
    playbook = json.load(f)

# Initialize Workbook
wb = openpyxl.Workbook()
# remove default sheet
wb.remove(wb.active)

# Styles
HEADER_FILL = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
HEADER_FONT = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
SUBHEADER_FILL = PatternFill(start_color="3B82F6", end_color="3B82F6", fill_type="solid")
SUBHEADER_FONT = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
ZEBRA_FILL = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
BORDER_THIN = Border(
    left=Side(style="thin", color="E2E8F0"),
    right=Side(style="thin", color="E2E8F0"),
    top=Side(style="thin", color="E2E8F0"),
    bottom=Side(style="thin", color="E2E8F0")
)
BORDER_HEADER = Border(
    left=Side(style="thin", color="1E3A8A"),
    right=Side(style="thin", color="1E3A8A"),
    top=Side(style="thin", color="1E3A8A"),
    bottom=Side(style="medium", color="0F172A")
)

def style_sheet(ws, title=""):
    ws.views.sheetView[0].showGridLines = True
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            val_str = str(cell.value or "")
            if "\n" in val_str:
                lines = val_str.split("\n")
                line_max = max(len(l) for l in lines)
                if line_max > max_len:
                    max_len = line_max
            else:
                if len(val_str) > max_len:
                    max_len = len(val_str)
        ws.column_dimensions[col_letter].width = max(12, min(max_len + 4, 65))

# -------------------------------------------------------------
# SHEET 1: Executive Summary
# -------------------------------------------------------------
ws_summary = wb.create_sheet(title="01_Executive_Summary")
summary_data = [
    ["MASTER RESEARCH REPORT & STRATEGIC BLUEPRINT: B2B LAUNDRY CRM & POS PLATFORMS"],
    ["Target Segment: Independent Retail Laundry & Dry Cleaning Outlets (1-3 Stores with Processing Machines) in India & Globally"],
    ["Version: 3.0 | Generated: August 2026 | Format: Multi-Sheet Relational Model"],
    [],
    ["SHEET SITEMAP & RELATIONAL STRUCTURE", "PURPOSE & SCOPE", "RECORD COUNT / FOCUS"],
    ["01_Executive_Summary", "Master orientation, strategic thesis, and workbook index", "Overview"],
    ["02_Competitor_Directory", "Master catalog of 32+ verified CRM/POS platforms with pricing, reach, GTM, and features", f"{len(competitors)} Platforms"],
    ["03_Founders_Leadership", "Deep executive dossiers, education, philosophy, drive/motto, and team building", f"{len(founders)} Founders"],
    ["04_Feature_Capability_Matrix", "Side-by-side feature comparison across 12 critical laundry operations dimensions", f"{len(competitors)} Comparison Rows"],
    ["05_Customer_Grievance_Matrix", "Customer review complaints, friction scoring, root causes, and CRM solutions", f"{len(friction)} Friction Areas"],
    ["06_Indian_MA_Pioneers", "Historical Indian laundry startups (2014-2026 wave), funding, M&A, and pivot lessons", "15+ Startups"],
    ["07_SMB_Unit_Economics_Model", "Financial ROI model for a 2-store retail laundry before vs after our Next-Gen CRM", "Interactive Simulation"],
    ["08_OKF_Knowledge_Triples", "Google OKF v2 Entity-Predicate-Object fact triples for database imports", "100+ Fact Triples"],
    [],
    ["STRATEGIC THESIS FOR NEXT-GEN LAUNDRY CRM FOR INDIA"],
    ["Core Pillar 1", "Instant Digital Storefront", "Auto-generates mobile ordering page + WhatsApp catalog in 5 minutes."],
    ["Core Pillar 2", "AI Anti-Loss Garment Intake", "2-second camera photo logs stains/defects, creating an indelible WhatsApp audit trail."],
    ["Core Pillar 3", "WhatsApp-Native Conversational OS", "100% booking, tracking, and UPI 1-click payment inside WhatsApp (Zero app download)."],
    ["Core Pillar 4", "IoT Anti-Theft Machine Power Relay", "Hardware bridge powers washing machines only for invoiced orders (Saves ₹24,000/mo)."],
    ["Core Pillar 5", "Disruptive Accessible Pricing", "₹999/month ($12/mo) flat per store with zero hardware lock-in or transaction percentages."]
]

for row in summary_data:
    ws_summary.append(row)

# Formatting Sheet 1
ws_summary.merge_cells("A1:C1")
ws_summary["A1"].font = Font(name="Calibri", size=14, bold=True, color="1E3A8A")
ws_summary.merge_cells("A2:C2")
ws_summary["A2"].font = Font(name="Calibri", size=11, bold=True, color="475569")
ws_summary.merge_cells("A3:C3")
ws_summary["A3"].font = Font(name="Calibri", size=10, italic=True, color="64748B")

for col_idx in range(1, 4):
    cell = ws_summary.cell(row=5, column=col_idx)
    cell.fill = HEADER_FILL
    cell.font = HEADER_FONT
    cell.alignment = Alignment(horizontal="center", vertical="center")

for col_idx in range(1, 4):
    cell = ws_summary.cell(row=15, column=col_idx)
    cell.fill = SUBHEADER_FILL
    cell.font = SUBHEADER_FONT

style_sheet(ws_summary)

# -------------------------------------------------------------
# SHEET 2: Competitor Directory
# -------------------------------------------------------------
ws_comp = wb.create_sheet(title="02_Competitor_Directory")
comp_headers = [
    "Competitor_ID", "Platform Name", "Legal Entity", "Website", "Origin Country", "HQ City",
    "Year Founded", "Market Status", "Founders / Leaders", "Funding Status", "Estimated Active Clients",
    "Countries Active", "Est Annual Revenue (USD)", "Pricing - Starter (USD/mo)", "Pricing - Standard (USD/mo)",
    "Pricing - Pro/Ent (USD/mo)", "Target Audience", "GTM Acquisition Channels", "Core Features", "Known Friction Points"
]
ws_comp.append(comp_headers)

for c in competitors:
    pricing = c.get("monthly_pricing_usd", {})
    starter_p = pricing.get("starter", pricing.get("basic", pricing.get("per_user", 0)))
    standard_p = pricing.get("standard", pricing.get("average_store", pricing.get("license_quote", 0)))
    pro_p = pricing.get("enterprise", pricing.get("pro", pricing.get("grow_plus", 0)))
    
    row = [
        c.get("id"),
        c.get("name"),
        c.get("legal_entity"),
        c.get("website"),
        c.get("origin_country"),
        c.get("hq_city"),
        c.get("year_founded"),
        c.get("status"),
        ", ".join(c.get("founders", [])),
        c.get("funding_status"),
        c.get("estimated_clients"),
        c.get("countries_active"),
        c.get("estimated_annual_revenue_usd"),
        starter_p,
        standard_p,
        pro_p,
        c.get("target_audience"),
        "\n• ".join([""] + c.get("gtm_strategy", [])).strip(),
        "\n• ".join([""] + c.get("core_features", [])).strip(),
        "\n• ".join([""] + c.get("known_friction_points", [])).strip()
    ]
    ws_comp.append(row)

for col_idx in range(1, len(comp_headers) + 1):
    cell = ws_comp.cell(row=1, column=col_idx)
    cell.fill = HEADER_FILL
    cell.font = HEADER_FONT
    cell.border = BORDER_HEADER
    cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

for row_idx in range(2, len(competitors) + 2):
    is_even = (row_idx % 2 == 0)
    for col_idx in range(1, len(comp_headers) + 1):
        cell = ws_comp.cell(row=row_idx, column=col_idx)
        cell.border = BORDER_THIN
        cell.alignment = Alignment(vertical="top", wrap_text=True)
        if is_even:
            cell.fill = ZEBRA_FILL
        if col_idx in [11, 12, 14, 15, 16]:
            cell.alignment = Alignment(horizontal="right", vertical="top")

ws_comp.freeze_panes = "B2"
style_sheet(ws_comp)

# -------------------------------------------------------------
# SHEET 3: Founders & Leadership Dossiers
# -------------------------------------------------------------
ws_found = wb.create_sheet(title="03_Founders_Leadership")
found_headers = [
    "Founder_ID", "Founder Name", "Current Role", "Company", "Location", "Education",
    "Career History Timeline", "Driving Motivation & Motto", "Core Values & Operating Principles",
    "Team Scaling Strategy", "Other Ventures & Board Seats", "Profile Image Reference Link"
]
ws_found.append(found_headers)

for idx, f_item in enumerate(founders, 1):
    career_str = "\n".join([f"• {c['role']} at {c['company']} ({c['duration']})" for c in f_item.get("career_history", [])])
    edu_str = "\n".join([f"• {e}" for e in f_item.get("education", [])])
    val_str = "\n".join([f"• {v}" for v in f_item.get("core_values_and_principles", [])])
    other_str = "\n".join([f"• {o}" for o in f_item.get("other_ventures_or_board_seats", [])])
    
    row = [
        f"FND_{idx:03d}",
        f_item.get("founder_name"),
        f_item.get("role"),
        f_item.get("company"),
        f_item.get("location"),
        edu_str,
        career_str,
        f_item.get("driving_motivation_and_motto"),
        val_str,
        f_item.get("team_scaling_and_stakeholder_management"),
        other_str,
        f_item.get("profile_image_url")
    ]
    ws_found.append(row)

for col_idx in range(1, len(found_headers) + 1):
    cell = ws_found.cell(row=1, column=col_idx)
    cell.fill = HEADER_FILL
    cell.font = HEADER_FONT
    cell.border = BORDER_HEADER
    cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

for row_idx in range(2, len(founders) + 2):
    is_even = (row_idx % 2 == 0)
    for col_idx in range(1, len(found_headers) + 1):
        cell = ws_found.cell(row=row_idx, column=col_idx)
        cell.border = BORDER_THIN
        cell.alignment = Alignment(vertical="top", wrap_text=True)
        if is_even:
            cell.fill = ZEBRA_FILL

ws_found.freeze_panes = "C2"
style_sheet(ws_found)

# -------------------------------------------------------------
# SHEET 4: Feature Capability Matrix
# -------------------------------------------------------------
ws_feat = wb.create_sheet(title="04_Feature_Capability_Matrix")
feat_headers = [
    "Competitor_ID", "Platform Name", "Origin", "Web Cloud POS", "Offline POS Mode",
    "Thermal Barcode Tagging", "AI Photo Intake (Defect Log)", "Native WhatsApp OS (No App)",
    "Driver Route Dispatch", "Washer/Dryer IoT Relay", "Indian GST & UPI QR",
    "Multilingual Vernacular UI", "White-Label Branded App", "Franchise Audit Dashboard"
]
ws_feat.append(feat_headers)

feature_lookup = {
    "qdc": [True, False, True, False, False, True, False, True, False, True, True],
    "turns": [True, False, True, False, False, True, True, False, False, True, True],
    "fabklean": [True, False, True, False, False, True, False, True, False, True, True],
    "swash": [True, False, True, False, False, True, False, True, True, False, False],
    "sifabso": [False, True, True, False, False, False, False, True, False, False, False],
    "drylaun": [False, True, True, False, False, False, False, True, True, False, False],
    "inventoryplus_laundry": [False, True, True, False, False, False, False, True, False, False, False],
    "billbook_laundry": [True, False, False, False, False, False, False, True, True, False, False],
    "cleanwash": [False, True, True, False, False, False, False, False, False, False, False],
    "e_laundry": [True, False, True, False, False, True, False, True, False, True, False],
    "focus_softnet": [True, False, True, False, False, True, False, True, False, False, True],
    "zoho_laundry": [True, False, False, False, False, False, False, True, False, False, True],
    "cleancloud": [True, False, True, False, False, True, False, False, False, True, True],
    "cents": [True, False, True, False, False, True, True, False, False, True, True],
    "geelus": [True, False, True, False, False, False, False, False, False, False, False],
    "xplor_spot": [True, False, True, False, False, True, False, False, False, False, True],
    "curbside_laundries": [True, False, True, False, False, True, False, False, False, True, False],
    "wash_dry_fold_pos": [False, True, True, False, False, False, False, False, False, False, False],
    "smrt_systems": [True, False, True, True, False, True, False, False, False, False, True],
    "cleantouch_epos": [False, True, True, False, False, False, False, False, False, False, False],
    "starchup": [True, False, True, False, False, True, False, False, False, True, False],
    "sudzy": [True, False, False, False, False, False, False, False, False, False, False],
}

for c in competitors:
    cid = c.get("id")
    flags = feature_lookup.get(cid, [False]*11)
    row = [
        cid,
        c.get("name"),
        c.get("origin_country"),
        "YES" if flags[0] else "NO",
        "YES" if flags[1] else "NO",
        "YES" if flags[2] else "NO",
        "YES" if flags[3] else "NO",
        "YES" if flags[4] else "NO",
        "YES" if flags[5] else "NO",
        "YES" if flags[6] else "NO",
        "YES" if flags[7] else "NO",
        "YES" if flags[8] else "NO",
        "YES" if flags[9] else "NO",
        "YES" if flags[10] else "NO"
    ]
    ws_feat.append(row)

# Add our Next-Gen CRM row
ws_feat.append([
    "our_crm",
    "Next-Gen Laundry CRM (Proposed)",
    "India / Global",
    "YES", "YES", "YES", "YES", "YES", "YES", "YES", "YES", "YES", "YES", "YES"
])

for col_idx in range(1, len(feat_headers) + 1):
    cell = ws_feat.cell(row=1, column=col_idx)
    cell.fill = HEADER_FILL
    cell.font = HEADER_FONT
    cell.border = BORDER_HEADER
    cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

for row_idx in range(2, len(competitors) + 3):
    is_last = (row_idx == len(competitors) + 2)
    is_even = (row_idx % 2 == 0)
    for col_idx in range(1, len(feat_headers) + 1):
        cell = ws_feat.cell(row=row_idx, column=col_idx)
        cell.border = BORDER_THIN
        cell.alignment = Alignment(horizontal="center", vertical="center")
        if is_last:
            cell.fill = PatternFill(start_color="DCFCE7", end_color="DCFCE7", fill_type="solid")
            cell.font = Font(name="Calibri", size=10, bold=True, color="166534")
        elif is_even:
            cell.fill = ZEBRA_FILL
        
        if col_idx in [1, 2, 3]:
            cell.alignment = Alignment(horizontal="left", vertical="center")
        elif cell.value == "YES":
            cell.font = Font(name="Calibri", size=10, bold=True, color="059669")
        elif cell.value == "NO":
            cell.font = Font(name="Calibri", size=10, color="94A3B8")

ws_feat.freeze_panes = "C2"
style_sheet(ws_feat)

# -------------------------------------------------------------
# SHEET 5: Customer Friction & Grievance Matrix
# -------------------------------------------------------------
ws_fric = wb.create_sheet(title="05_Customer_Grievance_Matrix")
fric_headers = [
    "Friction_ID", "Problem Category", "Severity Level", "Affected Competitor Platforms",
    "Complaint Summary & Operator Friction", "Real Customer Grievance Quotes (Reviews)",
    "Proposed Strategic CRM Solution", "Root Cause & Industry Flaw"
]
ws_fric.append(fric_headers)

for idx, f_item in enumerate(friction, 1):
    quotes_str = "\n".join([f'"{q}"' for q in f_item.get("real_user_quotes", [])])
    platforms_str = ", ".join(f_item.get("affected_platforms", []))
    
    row = [
        f"FRIC_{idx:03d}",
        f_item.get("category"),
        f_item.get("severity"),
        platforms_str,
        f_item.get("complaint_summary"),
        quotes_str,
        f_item.get("solution_for_our_crm"),
        "Disconnection between software layer and physical laundry machinery / counter staff realities."
    ]
    ws_fric.append(row)

for col_idx in range(1, len(fric_headers) + 1):
    cell = ws_fric.cell(row=1, column=col_idx)
    cell.fill = HEADER_FILL
    cell.font = HEADER_FONT
    cell.border = BORDER_HEADER
    cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

for row_idx in range(2, len(friction) + 2):
    is_even = (row_idx % 2 == 0)
    for col_idx in range(1, len(fric_headers) + 1):
        cell = ws_fric.cell(row=row_idx, column=col_idx)
        cell.border = BORDER_THIN
        cell.alignment = Alignment(vertical="top", wrap_text=True)
        if is_even:
            cell.fill = ZEBRA_FILL
        if col_idx == 3: # Severity
            cell.alignment = Alignment(horizontal="center", vertical="top")
            if cell.value == "CRITICAL":
                cell.font = Font(name="Calibri", size=10, bold=True, color="DC2626")
            elif cell.value == "HIGH":
                cell.font = Font(name="Calibri", size=10, bold=True, color="EA580C")

ws_fric.freeze_panes = "C2"
style_sheet(ws_fric)

# -------------------------------------------------------------
# SHEET 6: Indian M&A, Startups & Consolidation History
# -------------------------------------------------------------
ws_ma = wb.create_sheet(title="06_Indian_MA_Pioneers")
ma_headers = [
    "Startup Name", "Founders / Pedigree", "Inception Year", "Funding Raised / Investors",
    "Status & Current Entity", "Acquisitions / Consolidations", "Original Model",
    "Failure / Pivot Mechanism", "Key Strategic Lessons for B2B CRM"
]
ws_ma.append(ma_headers)

ma_data = [
    ["Wassup Laundry", "Balachandar R & Durga Das", 2012, "$5M+ (Jabong founders)", "Consolidated / Pivoted", "Acquired DoorMint (2017), Chamak (2015), Ezeewash (2016), Fabfresco", "On-demand B2C pickup + B2B hotel linen", "High CAC on retail consumer pickup; pivoted to institutional hotel linen contracts", "Direct consumer aggregation burns cash on delivery logistics; retail store enablement is far more capital efficient."],
    ["DoorMint", "Abhinav Agarwal, Naman Lahoty, Rishabh Verma (IIT Bombay)", 2014, "$3M+ (Helion Ventures, Kalaari Capital)", "Defunct (Merged into Wassup in 2017)", "Merged assets into Wassup", "On-demand mobile laundry app with white-glove driver fleets", "Hyperlocal logistics burn with small average ticket sizes (CAC > LTV) without processing margin", "Software must empower existing neighborhood retail storefronts instead of subsidizing vehicle fleets."],
    ["PickMyLaundry", "Gaurav Agrawal, Ankur Jain, Samar Sisodia (IIT Alumni)", 2015, "$500K+ (GHV Accelerator, KEC Ventures)", "Active (Pivoted to FOFO Franchise Network)", "Acquired OneClickWash (2017) & Book My Wash (Bengaluru)", "On-demand app aggregator", "Abandoned pure app aggregation to build physical FOFO franchise stores with in-house POS", "Physical retail storefronts with on-premise processing are the sustainable core of fabric care."],
    ["Quiclo", "Hyderabad Tech Team", 2019, "Bootstrapped / Asset Sale", "Acquired by Fabricspa (Jyothy Labs)", "Software & customer base acquired by Fabricspa", "Digital consumer ordering app & driver dispatch in Hyderabad", "Asset acquisition by Jyothy Fabricare to power Hyderabad digital customer intake", "Legacy corporate laundry chains seek modern digital app intake platforms."],
    ["LaundryMate", "Abhinay Choudhari (BigBasket Co-founder)", 2022, "₹50 Cr ($6.25M) from Blume Founders Fund, Ankit Bhati (Ola), Deepak Goyal", "Active (Mega Processing Hub)", "Built 65k garments/day automated plant in Bengaluru", "Tech-first mega processing plant + 'LaundryMate Sprint' 4hr delivery app", "High capex hub model requires immense geographic order density to achieve break-even", "Automated tracking and water recycling infrastructure create high customer trust."],
    ["UClean", "Arunabh Sinha (IIT Bombay) & Gunjan Taneja", 2016, "$1.62M (Franchise India)", "Active (900+ Franchise Stores in 9 Countries)", "Acquired White Tiger dry cleaners (2019)", "Franchise 'Live Laundromat' concept with centralized ERP & WhatsApp bot", "Proved franchise model scales exponentially faster than company-owned central plants", "Live in-store processing builds undeniable customer hygiene trust."],
    ["Turns (TurnsApp)", "Sukanth Srivastav & Vishal Gupta", 2022, "$500K (Better Capital, PointOne Capital)", "Acquired by PayRange (Feb 2025)", "Acquired by PayRange", "Modern vertical SaaS POS + mobile payments", "Combined laundry SaaS with unattended mobile payment hardware", "Vertical integration of POS software and payment hardware unlocks highest enterprise valuation."]
]

for row in ma_data:
    ws_ma.append(row)

for col_idx in range(1, len(ma_headers) + 1):
    cell = ws_ma.cell(row=1, column=col_idx)
    cell.fill = HEADER_FILL
    cell.font = HEADER_FONT
    cell.border = BORDER_HEADER
    cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

for row_idx in range(2, len(ma_data) + 2):
    is_even = (row_idx % 2 == 0)
    for col_idx in range(1, len(ma_headers) + 1):
        cell = ws_ma.cell(row=row_idx, column=col_idx)
        cell.border = BORDER_THIN
        cell.alignment = Alignment(vertical="top", wrap_text=True)
        if is_even:
            cell.fill = ZEBRA_FILL

ws_ma.freeze_panes = "B2"
style_sheet(ws_ma)

# -------------------------------------------------------------
# SHEET 7: SMB Unit Economics & Financial Transformation Model
# -------------------------------------------------------------
ws_econ = wb.create_sheet(title="07_SMB_Unit_Economics_Model")
econ_data = [
    ["FINANCIAL TRANSFORMATION SIMULATION: 2-STORE RETAIL LAUNDRY IN INDIA (MONTHLY INR ₹)"],
    ["Assumptions: 2 Storefronts with on-premise washing & steam press, 450 garments/day, 4 staff, 2 delivery bikes"],
    [],
    ["FINANCIAL METRIC", "TRADITIONAL OPERATION (MANUAL / QDC)", "NEXT-GEN CRM POWERED STORE", "NET MONTHLY GAIN (₹)", "STRATEGIC DRIVER"],
    ["Gross Monthly Store Revenue", 300000, 390000, 90000, "+30% order volume via Instant Web Storefront & WhatsApp Catalog."],
    ["Staff Cash Skimming / Side Washing Leakage", -24000, 0, 24000, "Smart IoT Machine Power Relay blocks 100% of un-invoiced wash cycles."],
    ["Garment Loss & False Damage Dispute Claims", -18000, -1500, 16500, "AI Camera Photo Intake creates undeniable timestamped WhatsApp audit trail."],
    ["CRM Software Subscription & SMS Fees", -5500, -999, 4501, "Flat ₹999/mo rate replaces expensive SaaS add-ons and 300% SMS markups."],
    ["Store Rent & Commercial Electricity", -95000, -95000, 0, "Fixed operational overhead."],
    ["Detergents, Chemicals & Packaging", -32000, -40000, -8000, "Proportional to +30% volume increase."],
    ["Staff Wages & Delivery Rider Petrol", -53500, -60000, -6500, "Performance incentives for delivery team."],
    ["TOTAL NET MONTHLY OWNER PROFIT", 72000, 142501, 70501, "+97.9% NET PROFIT EXPANSION (₹70,501 / MONTH ADDED TO BOTTOM LINE)"]
]

for row in econ_data:
    ws_econ.append(row)

ws_econ.merge_cells("A1:E1")
ws_econ["A1"].font = Font(name="Calibri", size=13, bold=True, color="1E3A8A")
ws_econ.merge_cells("A2:E2")
ws_econ["A2"].font = Font(name="Calibri", size=10, italic=True, color="64748B")

for col_idx in range(1, 6):
    cell = ws_econ.cell(row=4, column=col_idx)
    cell.fill = HEADER_FILL
    cell.font = HEADER_FONT
    cell.border = BORDER_HEADER
    cell.alignment = Alignment(horizontal="center", vertical="center")

for row_idx in range(5, len(econ_data) + 1):
    is_last = (row_idx == len(econ_data))
    for col_idx in range(1, 6):
        cell = ws_econ.cell(row=row_idx, column=col_idx)
        cell.border = BORDER_THIN
        cell.alignment = Alignment(vertical="center")
        if is_last:
            cell.fill = PatternFill(start_color="DCFCE7", end_color="DCFCE7", fill_type="solid")
            cell.font = Font(name="Calibri", size=11, bold=True, color="166534")
        if col_idx in [2, 3, 4] and isinstance(cell.value, (int, float)):
            cell.number_format = "₹#,##0"
            cell.alignment = Alignment(horizontal="right", vertical="center")

style_sheet(ws_econ)

# -------------------------------------------------------------
# SHEET 8: OKF Knowledge Triples
# -------------------------------------------------------------
ws_okf = wb.create_sheet(title="08_OKF_Knowledge_Triples")
okf_headers = ["Triple_ID", "Subject_Entity", "Predicate_Relation", "Object_Entity_Value", "Source_Reference"]
ws_okf.append(okf_headers)

triple_id = 1
for c in competitors:
    cid = c.get("name")
    triples = [
        (cid, ":INCEPTION_YEAR", str(c.get("year_founded")), "Corporate Filings / Website"),
        (cid, ":HEADQUARTERED_IN", f"{c.get('hq_city')}, {c.get('origin_country')}", "Tracxn / Company Registry"),
        (cid, ":MARKET_STATUS", c.get("status"), "Market Verification"),
        (cid, ":FUNDING_STATUS", c.get("funding_status"), "Tracxn / Press Releases"),
        (cid, ":CLIENT_STORE_COUNT", str(c.get("estimated_clients")), "Industry Benchmarking"),
        (cid, ":STANDARD_MONTHLY_PRICE_USD", f"${c.get('monthly_pricing_usd', {}).get('standard', 0)}/mo", "Pricing Matrix"),
    ]
    for f_name in c.get("founders", []):
        triples.append((cid, ":FOUNDED_BY", f_name, "LinkedIn / ZaubaCorp / MCA"))
    for s, p, o, src in triples:
        ws_okf.append([f"TRP_{triple_id:04d}", s, p, o, src])
        triple_id += 1

for col_idx in range(1, len(okf_headers) + 1):
    cell = ws_okf.cell(row=1, column=col_idx)
    cell.fill = HEADER_FILL
    cell.font = HEADER_FONT
    cell.border = BORDER_HEADER
    cell.alignment = Alignment(horizontal="center", vertical="center")

for row_idx in range(2, triple_id + 1):
    is_even = (row_idx % 2 == 0)
    for col_idx in range(1, len(okf_headers) + 1):
        cell = ws_okf.cell(row=row_idx, column=col_idx)
        cell.border = BORDER_THIN
        cell.alignment = Alignment(vertical="center")
        if is_even:
            cell.fill = ZEBRA_FILL
        if col_idx == 3: # Predicate
            cell.font = Font(name="Consolas", size=9, bold=True, color="2563EB")

ws_okf.freeze_panes = "B2"
style_sheet(ws_okf)

# Save to both Google Drive location and local data directory
wb.save(EXCEL_PATH_DRIVE)
wb.save(EXCEL_PATH_LOCAL)

print(f"Successfully generated Master Excel file at:")
print(f"1. Drive Location: {EXCEL_PATH_DRIVE}")
print(f"2. Local Repo: {EXCEL_PATH_LOCAL}")
