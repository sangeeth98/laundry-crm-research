import json
import os
from pathlib import Path
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether, HRFlowable, PageBreak
)
from reportlab.pdfgen import canvas

# Paths
BUILD_DIR = Path("build")
BUILD_DIR.mkdir(parents=True, exist_ok=True)

DRIVE_DIR = Path(r"C:\Users\sangeeth\My Drive\projects\Laundry-CRM")
DRIVE_DIR.mkdir(parents=True, exist_ok=True)

PDF_FILENAME = "Laundry_CRM_Market_Intelligence_Master_Report.pdf"
PDF_LOCAL = BUILD_DIR / PDF_FILENAME
PDF_DRIVE = DRIVE_DIR / PDF_FILENAME
TEX_FILE = Path("laundry_crm_market_intelligence_report.tex")

# Load Intelligence Datasets
with open("data/laundry_crm_master_intelligence.json", "r", encoding="utf-8") as f:
    competitors = json.load(f)

with open("data/laundry_crm_founders_dossier.json", "r", encoding="utf-8") as f:
    founders = json.load(f)

with open("data/laundry_crm_customer_friction_matrix.json", "r", encoding="utf-8") as f:
    friction = json.load(f)

with open("data/laundry_smb_opportunity_playbook.json", "r", encoding="utf-8") as f:
    playbook = json.load(f)

# -------------------------------------------------------------
# 1. GENERATE EXHAUSTIVE LATEX (.TEX) SOURCE DOCUMENT
# -------------------------------------------------------------
def escape_tex(text):
    if not text:
        return ""
    text = str(text)
    replacements = {
        "\\": "\\textbackslash{}",
        "&": "\\&",
        "%": "\\%",
        "$": "\\$",
        "#": "\\#",
        "_": "\\_",
        "{": "\\{",
        "}": "\\}",
        "~": "\\textasciitilde{}",
        "^": "\\textasciicircum{}",
        "₹": "Rs.~"
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    return text

tex_content = r"""\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[margin=1in]{geometry}
\usepackage{booktabs}
\usepackage{longtable}
\usepackage{array}
\usepackage{xcolor}
\usepackage{hyperref}
\usepackage{titlesec}
\usepackage{fancyhdr}
\usepackage{enumitem}
\usepackage{microtype}
\usepackage{graphicx}

% Color Definitions
\definecolor{slate900}{RGB}{15, 23, 42}
\definecolor{navyblue}{RGB}{30, 58, 138}
\definecolor{emerald600}{RGB}{5, 150, 105}
\definecolor{slate50}{RGB}{248, 250, 252}
\definecolor{slate200}{RGB}{226, 232, 240}

% Hyperlinks
\hypersetup{
    colorlinks=true,
    linkcolor=navyblue,
    urlcolor=navyblue,
    citecolor=navyblue
}

% Page Setup
\pagestyle{fancy}
\fancyhf{}
\fancyhead[L]{\textcolor{navyblue}{\small\textbf{B2B Laundry CRM Market Intelligence Master Report}}}
\fancyhead[R]{\textcolor{gray}{\small August 2026 | Comprehensive Edition}}
\fancyfoot[C]{\textcolor{gray}{\small Page \thepage}}
\renewcommand{\headrulewidth}{0.4pt}

% Section Titles
\titleformat{\section}{\Large\bfseries\color{slate900}}{\thesection}{1em}{}[\titlerule]
\titleformat{\subsection}{\large\bfseries\color{navyblue}}{\thesubsection}{1em}{}
\titleformat{\subsubsection}{\normalsize\bfseries\color{slate900}}{\thesubsubsection}{1em}{}

\begin{document}

% Title Page
\begin{titlepage}
    \centering
    \vspace*{1.0cm}
    {\Huge\bfseries\color{slate900} B2B LAUNDRY \& DRY-CLEANING CRM\\[0.3em] MASTER MARKET INTELLIGENCE}\\[1.2cm]
    {\Large\color{navyblue} Comprehensive Competitive Benchmarking, Founder Dossiers, Customer Grievance Analytics, and Strategic Unit Economics for Retail Laundries (1--3 Stores) in India \& Globally}\\[1.5cm]
    
    \begin{minipage}{0.85\textwidth}
        \centering
        \textbf{Prepared By:} Strategic Intelligence \& Product Research Team\\
        \textbf{Document Version:} 5.0 (Master Executive Report)\\
        \textbf{Coverage:} 51 Verified Global \& Indian Platforms | 13 Deep Founder Dossiers\\
        \textbf{Target Segment:} Independent Retail Laundry \& Dry Cleaning Outlets in India\\
        \textbf{Date of Publication:} August 2026
    \end{minipage}
    
    \vfill
    {\color{emerald600}\rule{\textwidth}{2.5pt}}\\[0.4cm]
    {\small Verified Data Sources: Techjockey, SoftwareSuggest, IndiaMART, Tracxn, Capterra, Google Play Store, ZaubaCorp, and MCA Filings.}
\end{titlepage}

\tableofcontents
\newpage

\section{Executive Summary \& Strategic Industry Thesis}

The Indian fabric care and laundry market is undergoing a structural paradigm shift from traditional, unorganized dhobis (accounting for >90\% of volume) toward organized, tech-enabled neighborhood laundry and dry-cleaning retail storefronts.

While corporate franchise networks such as \textbf{Tumbledry} (1,500+ stores across 600+ cities) and \textbf{UClean} (900+ stores across 9 countries) operate on proprietary, locked-down software, thousands of independent laundry entrepreneurs operating \textbf{1 to 3 retail storefronts} with on-premise washing machines, steam presses, and local delivery boys are caught in severe operational bottlenecks:

\begin{enumerate}[leftmargin=*]
    \item \textbf{Garment Loss \& Damage Dispute Liabilities:} 2 to 5 garment loss/damage disputes occur per month per store, costing Rs.~5,000 to Rs.~15,000 in customer cash compensations.
    \item \textbf{Staff Cash Skimming \& Un-invoiced Wash Cycles:} Store attendants routinely run unauthorized wash cycles for walk-in customers and pocket the cash, draining Rs.~15,000 to Rs.~30,000 monthly per store in direct revenue and utility costs.
    \item \textbf{Software Disconnect:} Existing software options are either prohibitively expensive Western platforms (\$89--\$249/month with proprietary hardware lock-ins and zero Indian UPI support) or rigid legacy Windows desktop clients (like QDC) that lack interactive WhatsApp customer ordering.
\end{enumerate}

\subsection{The Next-Gen Laundry CRM Strategic Blueprint (Rs.~999 / Month Flat)}

Our proposed solution addresses the root cause of these industry failures through five core architectural pillars:
\begin{itemize}[leftmargin=*]
    \item \textbf{Instant Digital Storefront:} Auto-generates a branded mobile ordering page, Google Maps catalog, and WhatsApp storefront in under 5 minutes.
    \item \textbf{AI Anti-Loss Garment Intake:} A 2-second smartphone photo tags garment fabric, color, pre-existing stains, and tears at the counter, sending an indelible WhatsApp audit link to the customer before washing begins.
    \item \textbf{WhatsApp-Native Conversational OS:} 100\% booking, status tracking, and 1-click UPI payments executed inside WhatsApp without forcing customers to download standalone apps.
    \item \textbf{IoT Anti-Theft Machine Power Relay:} A plug-and-play Rs.~1,500 smart power bridge unlocks commercial washing machine power only when an active invoice is created in the POS, eliminating 100\% of staff side-washing.
    \item \textbf{Disruptive Accessible Pricing:} A flat Rs.~999/month (\$12/mo) pricing tier with zero contract lock-ins, zero hardware extortion, and zero SMS markups.
\end{itemize}

\newpage
\section{Master Competitor Benchmarking Directory (51 Verified Platforms)}

Below is the exhaustive catalog of all 51 verified CRM, POS, and ERP platforms operating in or influencing the retail laundry landscape.

\begin{longtable}{p{3.2cm} p{2.2cm} p{2.5cm} p{2.2cm} p{1.8cm} p{2.5cm}}
\toprule
\textbf{Platform Name} & \textbf{Origin / HQ} & \textbf{Leadership / Founders} & \textbf{Market Status} & \textbf{Pricing} & \textbf{Target Segment} \\
\midrule
\endhead
"""

for c in competitors:
    p = c.get("monthly_pricing_usd", {})
    p_val = p.get("standard", p.get("average_store", p.get("license_quote", p.get("starter", p.get("one_time_fee", 0)))))
    p_str = f"${p_val}/mo" if p_val else "Custom"
    founders_str = ", ".join(c.get("founders", []))
    if len(founders_str) > 30:
        founders_str = founders_str[:28] + "..."
    tex_content += f"{escape_tex(c.get('name'))} & {escape_tex(c.get('origin_country'))} / {escape_tex(c.get('hq_city'))} & {escape_tex(founders_str)} & {escape_tex(c.get('status')[:20])} & {escape_tex(p_str)} & {escape_tex(c.get('target_audience')[:35])} \\\\\n\\midrule\n"

tex_content += r"""\bottomrule
\end{longtable}

\newpage
\section{Deep Founder Intelligence \& Leadership Dossiers}
"""

for f_item in founders:
    tex_content += f"\\subsection{{{escape_tex(f_item.get('founder_name'))} --- {escape_tex(f_item.get('company'))}}}\n"
    tex_content += f"\\textbf{{Current Role:}} {escape_tex(f_item.get('role'))} \\quad \\textbf{{Location:}} {escape_tex(f_item.get('location'))}\\\\\n"
    tex_content += f"\\textbf{{Driving Motto:}} \\textit{{{escape_tex(f_item.get('driving_motivation_and_motto'))}}}\n\n"
    tex_content += r"\textbf{Career Journey \& Educational Background:}" + "\n\\begin{itemize}[leftmargin=*]\n"
    for e in f_item.get("education", []):
        tex_content += f"    \\item \\textbf{{Education:}} {escape_tex(e)}\n"
    for c in f_item.get("career_history", []):
        tex_content += f"    \\item {escape_tex(c.get('role'))} at {escape_tex(c.get('company'))} ({escape_tex(c.get('duration'))})\n"
    tex_content += "\\end{itemize}\n\n"
    tex_content += r"\textbf{Core Operating Principles \& Philosophy:}" + "\n\\begin{itemize}[leftmargin=*]\n"
    for v in f_item.get("core_values_and_principles", []):
        tex_content += f"    \\item {escape_tex(v)}\n"
    tex_content += "\\end{itemize}\n\n"
    tex_content += f"\\textbf{{Team Scaling \\& Stakeholder Management:}} {escape_tex(f_item.get('team_scaling_and_stakeholder_management'))}\n\n"

tex_content += r"""\newpage
\section{Customer Grievance Mining \& Friction Root Cause Analysis}

Through analysis of verified operator and customer reviews on Capterra, G2, Trustpilot, MouthShut, Google Play Store, and Reddit (\texttt{r/drycleaning}), six critical operational failure points were identified:

\begin{itemize}[leftmargin=*]
"""

for fric in friction:
    tex_content += f"\\item \\textbf{{{escape_tex(fric.get('category'))} [Severity: {escape_tex(fric.get('severity'))}]:}}\n"
    tex_content += f"\\begin{{itemize}}\n"
    tex_content += f"    \\item \\textbf{{Summary:}} {escape_tex(fric.get('complaint_summary'))}\n"
    tex_content += f"    \\item \\textbf{{Affected Platforms:}} {escape_tex(', '.join(fric.get('affected_platforms', [])))}\n"
    tex_content += f"    \\item \\textbf{{Product Solution in Next-Gen CRM:}} {escape_tex(fric.get('solution_for_our_crm'))}\n"
    tex_content += f"\\end{{itemize}}\n"

tex_content += r"""\end{itemize}

\newpage
\section{Indian Laundry Tech Startups: M\&A, Pivots \& Unit Economic Lessons (2014--2026)}

The Indian online laundry market has experienced multiple evolutionary cycles between 2014 and 2026:

\begin{enumerate}[leftmargin=*]
    \item \textbf{The Pure B2C Aggregator Fallacy (DoorMint, Tooler):} Between 2014 and 2016, venture-funded startups raised millions to subsidize on-demand home pickup and delivery. High customer acquisition costs (CAC) combined with low average order values (Rs.~200--350) and zero processing margin ownership led to massive cash burn and business failure.
    \item \textbf{Consolidation Era (Wassup Laundry):} Wassup acquired DoorMint, Chamak, Ezeewash, and Fabfresco, subsequently pivoting away from volatile consumer pickup to institutional B2B hotel linen contracts.
    \item \textbf{Franchise \& Physical Unit Economics (UClean, Tumbledry, DhobiLite):} Proved that decentralized in-store processing with physical storefronts delivers sustainable profitability, rapid 24-hour turnaround, and high consumer trust.
    \item \textbf{Vertical SaaS + Hardware Payments (Turns / PayRange):} Demonstrates that combining laundry CRM software with unattended payment hardware unlocks maximum enterprise valuation and frictionless customer payments.
\end{enumerate}

\newpage
\section{SMB Unit Economics Transformation Model}

\begin{table}[h!]
\centering
\begin{tabular}{p{6.5cm} r r r}
\toprule
\textbf{Monthly Financial Metric} & \textbf{Traditional Store} & \textbf{Next-Gen CRM Store} & \textbf{Net Monthly Impact} \\
\midrule
Gross Monthly Store Revenue & Rs.~3,00,000 & Rs.~3,90,000 & +Rs.~90,000 (+30\%) \\
Staff Cash Skimming Leakage & -Rs.~24,000 & Rs.~0 & +Rs.~24,000 (Saved) \\
Garment Loss Dispute Claims & -Rs.~18,000 & -Rs.~1,500 & +Rs.~16,500 (Saved) \\
Software Subscription \& SMS Fees & -Rs.~5,500 & -Rs.~999 & +Rs.~4,501 (Saved) \\
Store Rent \& Commercial Power & -Rs.~95,000 & -Rs.~95,000 & Rs.~0 \\
Detergents, Chemicals \& Bags & -Rs.~32,000 & -Rs.~40,000 & -Rs.~8,000 \\
Staff Wages \& Rider Fuel Incentives & -Rs.~53,500 & -Rs.~60,000 & -Rs.~6,500 \\
\midrule
\textbf{TOTAL NET OWNER PROFIT} & \textbf{Rs.~72,000} & \textbf{Rs.~1,42,501} & \textbf{+Rs.~70,501 (+97.9\%)} \\
\bottomrule
\end{tabular}
\caption{Comprehensive P\&L Impact Simulation for a 2-Store Retail Laundry in India}
\end{table}

\end{document}
"""

with open(TEX_FILE, "w", encoding="utf-8") as f:
    f.write(tex_content)

print(f"Generated LaTeX source file at: {TEX_FILE}")

# -------------------------------------------------------------
# 2. COMPILE EXHAUSTIVE MULTI-PAGE PDF VIA REPORTLAB
# -------------------------------------------------------------
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, page_count):
        if self._pageNumber > 1:
            self.saveState()
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor("#1E3A8A"))
            self.drawString(40, 755, "B2B LAUNDRY CRM MASTER INTELLIGENCE REPORT")
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#64748B"))
            self.drawRightString(572, 755, "August 2026 | Executive Strategy Edition")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.75)
            self.line(40, 747, 572, 747)
            # Footer
            self.line(40, 42, 572, 42)
            self.drawString(40, 30, "Strictly Confidential - Prepared for Executive Leadership & Product Architecture")
            self.drawRightString(572, 30, f"Page {self._pageNumber} of {page_count}")
            self.restoreState()

def build_pdf_report():
    doc = SimpleDocTemplate(
        str(PDF_LOCAL),
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=48,
        bottomMargin=48
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle('DocTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=22, leading=26, textColor=colors.HexColor("#0F172A"), spaceAfter=8)
    subtitle_style = ParagraphStyle('DocSubTitle', parent=styles['Normal'], fontName='Helvetica', fontSize=11, leading=15, textColor=colors.HexColor("#334155"), spaceAfter=14)
    h1_style = ParagraphStyle('H1', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=14, leading=18, textColor=colors.HexColor("#0F172A"), spaceBefore=14, spaceAfter=8, keepWithNext=True)
    h2_style = ParagraphStyle('H2', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=11, leading=14, textColor=colors.HexColor("#1E3A8A"), spaceBefore=10, spaceAfter=4, keepWithNext=True)
    h3_style = ParagraphStyle('H3', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9.5, leading=12, textColor=colors.HexColor("#0F172A"), spaceBefore=6, spaceAfter=2, keepWithNext=True)
    body_style = ParagraphStyle('Body', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, leading=12, textColor=colors.HexColor("#334155"), spaceAfter=5)
    callout_style = ParagraphStyle('Callout', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, leading=12, textColor=colors.HexColor("#0F172A"))
    table_cell = ParagraphStyle('TableCell', parent=styles['Normal'], fontName='Helvetica', fontSize=7.5, leading=9.5, textColor=colors.HexColor("#1E293B"))
    table_cell_bold = ParagraphStyle('TableCellBold', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, leading=9.5, textColor=colors.HexColor("#0F172A"))
    table_header = ParagraphStyle('TableHeader', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=colors.white)

    story = []

    # Cover Page Block
    story.append(Paragraph("B2B LAUNDRY & DRY-CLEANING CRM MASTER INTELLIGENCE", title_style))
    story.append(Paragraph("<b>Exhaustive Competitive Benchmarking, Founder Dossiers, Grievance Mining & ₹999/mo Architecture</b>", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#0F172A"), spaceAfter=12))

    # Executive Overview
    story.append(Paragraph("1. Executive Summary & Strategic Context", h1_style))
    story.append(Paragraph(
        "The Indian fabric care ecosystem is experiencing a generational shift from unorganized dhobi ghats to organized, "
        "technology-driven neighborhood retail outlets. While corporate chains (Tumbledry with 1,500+ stores, UClean with 900+ stores) "
        "scale on proprietary ERPs, thousands of independent operators running <b>1 to 3 storefronts</b> with on-premise washing machines "
        "face severe operational blockers:", body_style
    ))
    story.append(Paragraph("• <b>Garment Loss Disputes:</b> Drop-offs without verified intake conditions cost ₹5,000–₹15,000 monthly in compensation settlements.", body_style))
    story.append(Paragraph("• <b>Staff Cash Skimming:</b> Attendants running un-invoiced wash cycles pocket cash, draining ₹15,000–₹30,000 monthly per store.", body_style))
    story.append(Paragraph("• <b>Software Mismatch:</b> Western SaaS ($89–$249/mo) and legacy desktop software (QDC) fail to provide frictionless WhatsApp customer ordering.", body_style))
    story.append(Spacer(1, 8))

    # 5-Pillar Solution Box
    callout_data = [
        [Paragraph("<b>THE ₹999/MONTH NEXT-GEN CRM SOLUTION ARCHITECTURE</b><br/>"
                   "1. <b>Instant Storefront:</b> 5-minute auto-generated mobile booking site + Google Maps & WhatsApp catalog.<br/>"
                   "2. <b>AI Anti-Loss Intake:</b> 2-second smartphone photo tags stains/defects and sends customer instant WhatsApp audit link.<br/>"
                   "3. <b>WhatsApp-Native OS:</b> 100% booking, tracking, & 1-click UPI payments in WhatsApp (Zero app downloads).<br/>"
                   "4. <b>IoT Power Relay Bridge:</b> ₹1,500 smart relay unlocks washing machine power ONLY for invoiced orders.<br/>"
                   "5. <b>Accessible Flat Pricing:</b> ₹999/mo ($12/mo) flat with zero contracts, zero hardware lock-in, and zero SMS markups.", callout_style)]
    ]
    callout_table = Table(callout_data, colWidths=[532])
    callout_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor("#1E3A8A")),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(callout_table)
    story.append(Spacer(1, 10))

    # Embed Pricing vs Market Reach Chart
    p_chart = Path("data/charts/laundry_crm_pricing_vs_market_reach.png")
    if p_chart.exists():
        story.append(Paragraph("Market Pricing vs Reach Landscape", h2_style))
        story.append(Image(str(p_chart), width=7.0*inch, height=2.6*inch))
        story.append(Spacer(1, 10))

    story.append(PageBreak())

    # Section 2: Complete Master Competitor Benchmarking Directory (All 51 Platforms)
    story.append(Paragraph("2. Master Competitor Benchmarking Directory (51 Verified Platforms)", h1_style))
    story.append(Paragraph("Comprehensive catalog of verified Indian and global laundry CRM, POS, and ERP platforms categorized by market tier:", body_style))

    comp_headers = [
        Paragraph("Platform", table_header),
        Paragraph("HQ & Origin", table_header),
        Paragraph("Founders / Leadership", table_header),
        Paragraph("Pricing", table_header),
        Paragraph("Reach & Clients", table_header),
        Paragraph("Target Segment", table_header)
    ]
    
    comp_rows = [comp_headers]
    for c in competitors:
        p = c.get("monthly_pricing_usd", {})
        p_val = p.get("standard", p.get("average_store", p.get("license_quote", p.get("starter", p.get("one_time_fee", 0)))))
        p_str = f"${p_val}/mo" if p_val else "Custom"
        founders_str = ", ".join(c.get("founders", []))
        if len(founders_str) > 28:
            founders_str = founders_str[:26] + "..."
        comp_rows.append([
            Paragraph(f"<b>{c.get('name')}</b>", table_cell_bold),
            Paragraph(f"{c.get('hq_city', '')}, {c.get('origin_country', '')}", table_cell),
            Paragraph(founders_str, table_cell),
            Paragraph(p_str, table_cell),
            Paragraph(f"{c.get('estimated_clients', 0)} stores", table_cell),
            Paragraph(c.get('target_audience', '')[:38], table_cell)
        ])

    comp_table = Table(comp_rows, colWidths=[105, 85, 105, 50, 65, 122], repeatRows=1)
    comp_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0F172A")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
    ]))
    story.append(comp_table)
    story.append(Spacer(1, 12))

    story.append(PageBreak())

    # Section 3: Deep Leadership Dossiers (All 13 Profiles)
    story.append(Paragraph("3. Deep Leadership Profiles & Founder Dossiers", h1_style))
    story.append(Paragraph("Detailed intelligence dossiers on founders, career pedigree, operating principles, and team scaling strategies:", body_style))

    for f_item in founders:
        story.append(Paragraph(f"<b>{f_item.get('founder_name')}</b> — {f_item.get('company')} ({f_item.get('role')})", h2_style))
        story.append(Paragraph(f"<b>Location:</b> {f_item.get('location')}", body_style))
        story.append(Paragraph(f"<b>Driving Motivation & Motto:</b> <i>\"{f_item.get('driving_motivation_and_motto')}\"</i>", body_style))
        
        # Education & Career
        career_list = [f"• {c['role']} at {c['company']} ({c['duration']})" for c in f_item.get("career_history", [])]
        edu_list = [f"• {e}" for e in f_item.get("education", [])]
        story.append(Paragraph("<b>Career Timeline & Pedigree:</b> " + " | ".join(career_list), body_style))
        
        # Core Principles
        principles = " ".join([f"• <b>{p.split(':')[0]}:</b> {p.split(':')[1] if ':' in p else p}" for p in f_item.get("core_values_and_principles", [])])
        story.append(Paragraph(f"<b>Operating Principles:</b> {principles}", body_style))
        story.append(Paragraph(f"<b>Team & Scaling Model:</b> {f_item.get('team_scaling_and_stakeholder_management')}", body_style))
        story.append(Spacer(1, 6))

    story.append(PageBreak())

    # Section 4: Customer Friction Matrix & Reviews
    story.append(Paragraph("4. Customer Grievance Mining & Root Cause Analysis", h1_style))
    story.append(Paragraph("Synthesis of verified operator reviews from Capterra, G2, Trustpilot, MouthShut, and Play Store:", body_style))

    fric_chart = Path("data/charts/customer_friction_severity_matrix.png")
    if fric_chart.exists():
        story.append(Image(str(fric_chart), width=7.0*inch, height=2.8*inch))
        story.append(Spacer(1, 8))

    for fric in friction:
        story.append(Paragraph(f"<b>{fric.get('category')} [Severity: {fric.get('severity')}]</b>", h3_style))
        story.append(Paragraph(f"• <b>Complaint Summary:</b> {fric.get('complaint_summary')}", body_style))
        story.append(Paragraph(f"• <b>Affected Platforms:</b> {', '.join(fric.get('affected_platforms', []))}", body_style))
        quotes = " | ".join([f'"{q}"' for q in fric.get("real_user_quotes", [])])
        story.append(Paragraph(f"• <b>Real User Quotes:</b> <i>{quotes}</i>", body_style))
        story.append(Paragraph(f"• <b>Next-Gen CRM Product Fix:</b> <b>{fric.get('solution_for_our_crm')}</b>", body_style))
        story.append(Spacer(1, 4))

    story.append(PageBreak())

    # Section 5: Indian Laundry Tech Startups & M&A History (2014-2026)
    story.append(Paragraph("5. Indian Laundry Tech Startups: M&A, Pivots & Lessons (2014–2026)", h1_style))
    story.append(Paragraph("Strategic analysis of the four waves of laundry technology ventures in India:", body_style))

    ma_rows = [
        [Paragraph("Startup Name", table_header), Paragraph("Founders / Pedigree", table_header), Paragraph("Funding / M&A Outcome", table_header), Paragraph("Core Model & Strategic Lessons", table_header)],
        [Paragraph("<b>Wassup Laundry</b>", table_cell_bold), Paragraph("Balachandar R & Durga Das", table_cell), Paragraph("$5M+ (Jabong founders) | Acquired DoorMint, Chamak, Ezeewash", table_cell), Paragraph("Aggressive M&A consolidator; shifted from high-CAC consumer pickup to institutional hotel linen contracts.", table_cell)],
        [Paragraph("<b>DoorMint</b>", table_cell_bold), Paragraph("Abhinav Agarwal, Naman Lahoty (IIT-B)", table_cell), Paragraph("$3M+ (Helion, Kalaari) | Merged into Wassup (2017)", table_cell), Paragraph("Pure consumer app aggregation burned cash on logistics without owning processing margin (CAC > LTV).", table_cell)],
        [Paragraph("<b>PickMyLaundry</b>", table_cell_bold), Paragraph("Gaurav Agrawal, Ankur Jain (IIT)", table_cell), Paragraph("$500K+ | Acquired OneClickWash & BookMyWash", table_cell), Paragraph("Pivoted away from pure app aggregation to build physical FOFO franchise stores with in-house POS.", table_cell)],
        [Paragraph("<b>Quiclo</b>", table_cell_bold), Paragraph("Hyderabad Tech Team", table_cell), Paragraph("Acquired by Fabricspa / Jyothy Labs (2019)", table_cell), Paragraph("Consumer intake app & route dispatch acquired by corporate laundry giant to power digital growth.", table_cell)],
        [Paragraph("<b>LaundryMate</b>", table_cell_bold), Paragraph("Abhinay Choudhari (BigBasket)", table_cell), Paragraph("₹50 Cr ($6.25M) from Blume Founders Fund, Ola, BCG", table_cell), Paragraph("Built 65k garments/day mega automated hub in Bengaluru with 4-hour 'Sprint' delivery app.", table_cell)],
        [Paragraph("<b>UClean</b>", table_cell_bold), Paragraph("Arunabh Sinha (IIT-B), Gunjan Taneja", table_cell), Paragraph("$1.62M (Franchise India) | Acquired White Tiger", table_cell), Paragraph("Pioneered Live Laundromats (900+ stores across 9 countries); proved franchise capital efficiency.", table_cell)],
        [Paragraph("<b>Tumbledry</b>", table_cell_bold), Paragraph("Gaurav Nigam, Navin Chawla", table_cell), Paragraph("Bootstrapped FOFO Network", table_cell), Paragraph("1,500+ stores in 600+ cities with in-house franchise POS; proved neighborhood live washing beats central plants.", table_cell)],
        [Paragraph("<b>Turns (TurnsApp)</b>", table_cell_bold), Paragraph("Sukanth Srivastav, Vishal Gupta", table_cell), Paragraph("$500K Pre-Seed | Acquired by PayRange (Feb 2025)", table_cell), Paragraph("Combined laundry SaaS with mobile payment hardware; unlocks maximum enterprise valuation.", table_cell)],
    ]
    ma_table = Table(ma_rows, colWidths=[90, 110, 140, 192])
    ma_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0F172A")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
    ]))
    story.append(ma_table)
    story.append(Spacer(1, 10))

    story.append(PageBreak())

    # Section 6: SMB Unit Economics & Financial ROI Transformation Model
    story.append(Paragraph("6. SMB Unit Economics & Financial ROI Transformation Model", h1_style))
    story.append(Paragraph("Detailed monthly profit and loss transformation model for an Indian 2-store retail laundry operator:", body_style))

    econ_rows = [
        [Paragraph("Monthly Financial Metric", table_header), Paragraph("Traditional Store", table_header), Paragraph("Next-Gen CRM Store", table_header), Paragraph("Net Monthly Gain", table_header), Paragraph("Strategic Driver", table_header)],
        [Paragraph("Gross Monthly Revenue", table_cell), Paragraph("₹3,00,000", table_cell), Paragraph("₹3,90,000", table_cell), Paragraph("+₹90,000", table_cell), Paragraph("+30% order volume via Instant Web & WhatsApp catalog.", table_cell)],
        [Paragraph("Staff Cash Skimming Leakage", table_cell), Paragraph("-₹24,000", table_cell), Paragraph("₹0", table_cell), Paragraph("+₹24,000", table_cell), Paragraph("Smart IoT Relay blocks 100% of un-invoiced wash cycles.", table_cell)],
        [Paragraph("Garment Loss Dispute Claims", table_cell), Paragraph("-₹18,000", table_cell), Paragraph("-₹1,500", table_cell), Paragraph("+₹16,500", table_cell), Paragraph("AI Photo Intake creates timestamped WhatsApp proof.", table_cell)],
        [Paragraph("Software Subscription & SMS", table_cell), Paragraph("-₹5,500", table_cell), Paragraph("-₹999", table_cell), Paragraph("+₹4,501", table_cell), Paragraph("Flat ₹999/mo rate replaces expensive SaaS add-ons.", table_cell)],
        [Paragraph("Store Rent & Commercial Power", table_cell), Paragraph("-₹95,000", table_cell), Paragraph("-₹95,000", table_cell), Paragraph("₹0", table_cell), Paragraph("Fixed overhead.", table_cell)],
        [Paragraph("Detergents, Chemicals & Bags", table_cell), Paragraph("-₹32,000", table_cell), Paragraph("-₹40,000", table_cell), Paragraph("-₹8,000", table_cell), Paragraph("Proportional to +30% volume increase.", table_cell)],
        [Paragraph("Staff Wages & Rider Fuel", table_cell), Paragraph("-₹53,500", table_cell), Paragraph("-₹60,000", table_cell), Paragraph("-₹6,500", table_cell), Paragraph("Performance incentives for delivery team.", table_cell)],
        [Paragraph("<b>TOTAL NET OWNER PROFIT</b>", table_cell), Paragraph("<b>₹72,000</b>", table_cell), Paragraph("<b>₹1,42,501</b>", table_cell), Paragraph("<b>+₹70,501</b>", table_cell), Paragraph("<b>+97.9% NET PROFIT EXPANSION (₹70,501/MO ADDED)</b>", table_cell)],
    ]
    econ_table = Table(econ_rows, colWidths=[130, 75, 85, 75, 167])
    econ_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1E3A8A")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor("#DCFCE7")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(econ_table)
    story.append(Spacer(1, 10))

    econ_chart = Path("data/charts/indian_smb_laundry_economic_impact.png")
    if econ_chart.exists():
        story.append(Image(str(econ_chart), width=7.0*inch, height=3.0*inch))

    # Build PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Generated comprehensive Master PDF report at: {PDF_LOCAL}")

    # Mirror to Google Drive Location
    with open(PDF_LOCAL, "rb") as src_f, open(PDF_DRIVE, "wb") as dst_f:
        dst_f.write(src_f.read())
    print(f"Copied Master PDF report to Google Drive: {PDF_DRIVE}")

if __name__ == "__main__":
    build_pdf_report()
