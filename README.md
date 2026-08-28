# Laundry CRM & Market Intelligence Research (OKF v0.2)

> **Empirical Market Research, Knowledge Graph, Technical Architecture & B2B/B2C Laundry Ecosystem Analysis**

---

## 📌 Executive Summary

This repository contains research data, empirical tech-stack analyses, market benchmarks, OKF v0.2 knowledge graphs, and quantitative visualizations for the **Indian & Global Commercial Laundry & Dry Cleaning Industry**.

### Core Guiding Mantra: Strict Entity Decoupling
1. **Category A — Finished Service Providers (B2C & Franchise Operators):**
   - Companies washing and dry-cleaning garments for end retail consumers & franchise networks (e.g., *Tumbledry, UClean, DhobiLite, Fabricspa, Laundrywala, LaundroKart*).
2. **Category B — CRM & SaaS POS Platforms (B2B Software Engines):**
   - Software engines powering counter billing, store POS, barcode garment tracking, driver dispatch, driver route optimization, and washer IoT hardware (e.g., *Quick Dry Cleaning (QDC), CleanCloud, Cents OS, Curbside Laundries, Wash-Dry-Fold POS, Zoho CRM*).

---

## 📂 Repository Structure

```
├── data/
│   ├── charts/                     # Quantitative visualization figures & charts
│   ├── images/real_sites/          # Live web captures of platforms & software
│   ├── crm_software_benchmark.json # B2B POS & CRM feature/pricing matrix
│   ├── linkedin_founders_data.json # Verified executive leadership profiles & education
│   ├── market_players.csv          # Store counts, cities, models, and revenue data
│   ├── market_players.json         # JSON structured market player database
│   ├── operational_friction.json   # Store-level operational bottleneck analysis
│   ├── system_architecture.json    # Target modern laundry ERP architecture schema
│   ├── tech_stack_profiles.json    # Verified CDN, frontend, mobile, DB & auth profiles
│   └── unit_economics.json         # Unit economics model for FOFO store outlets
├── okf/                            # Google OKF v0.2 Knowledge Graph Bundle
│   ├── SPEC.md                     # Full formal specification of OKF v0.2 graph
│   ├── index.md                    # Root concept navigation & index
│   └── concepts/                   # Modular markdown concepts (SPO triples)
│       ├── architecture/           # System & IoT architecture concepts
│       ├── computations/           # Market share & TAM calculation formulas
│       ├── crm/                    # SaaS & POS deep dives
│       ├── economics/              # Store unit economics & payback periods
│       ├── players/                # Operator & software company profiles
│       └── research/               # Empirical methodology & scraping notes
├── scripts/                        # Empirical data collection & analysis scripts
│   ├── build_notebook.py           # Programmatic Jupyter notebook generator
│   ├── capture_real_screenshots.py # Playwright automated web screenshot capture
│   ├── fetch_verified_founder_bios.py # LinkedIn & executive intelligence scraper
│   ├── generate_visualizations.py  # Matplotlib/Seaborn visualization pipeline
│   ├── inspect_tech_stack.py       # Live HTTP header & CDN/tech stack inspector
│   └── validate_pdf_and_repo.py    # Repository validation & verification suite
├── laundry_market_report.tex       # Comprehensive LaTeX formal report source
├── laundry_market_research_okf_v2.md # Concise research findings & summary matrix
├── laundry_market_visualization.ipynb # Interactive visual analytics notebook
├── MANTRA.md                       # Core 7 guiding principles & repository mantra
├── pyproject.toml                  # Python package configuration (uv managed)
└── uv.lock                         # Exact reproducible dependency lockfile
```

---

## 🛠️ Tech Stack & Tooling

- **Package & Dependency Manager:** [`uv`](https://github.com/astral-sh/uv) (Fast Python package resolver)
- **Data Analysis & Visualization:** `pandas`, `numpy`, `matplotlib`, `seaborn`, `jupyter`
- **Automation & Inspection:** `playwright`, `httpx`, `beautifulsoup4`
- **Report Typesetting:** LaTeX (`tectonic` engine)

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure [`uv`](https://docs.astral.sh/uv/) is installed on your system.

### 2. Environment Setup & Dependency Installation
```bash
# Clone the repository
git clone https://github.com/sangeeth98/laundry-crm-research.git
cd laundry-crm-research

# Sync dependencies using uv
uv sync
```

### 3. Run Analytics & Visualizations
```bash
# Generate charts into data/charts/
uv run python scripts/generate_visualizations.py

# Launch Jupyter Notebook
uv run jupyter lab laundry_market_visualization.ipynb
```

---

## 📊 Key Research Findings

1. **Market Domination & Fragmentation:** The top 3 organized players in India (Tumbledry ~1,200 stores, UClean ~450 stores, DhobiLite ~150 stores) represent only ~4% of the addressable urban market; >95% remains fragmented unorganized mom-and-pop dhobi setups.
2. **ERP & POS Monopolies:** Quick Dry Cleaning (QDC) powers 5,000+ dry cleaning locations across 22+ countries, serving as the dominant legacy backend POS in India, while CleanCloud and Cents OS lead in Western markets.
3. **Primary Operational Bottlenecks:** Garment misplacement/mix-ups during sorting, billing disputes, washer idle times, delayed home pickup/deliveries, and lack of real-time multi-stage IoT tracking.

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
