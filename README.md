# Laundry CRM & Operations Software — Global Market Intelligence

[![Live Visualizer](https://img.shields.io/badge/Live_Visualizer-GitHub_Pages-0284c7?style=for-the-badge&logo=github)](https://sangeeth98.github.io/laundry-crm-research/)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Pydantic v2](https://img.shields.io/badge/Validation-Pydantic_v2-E92063?style=for-the-badge&logo=pydantic&logoColor=white)](https://docs.pydantic.dev/)
[![Package Manager](https://img.shields.io/badge/uv-Astral-DE5FE9?style=for-the-badge&logo=astral)](https://docs.astral.sh/uv/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)

An empirical competitive intelligence dossier and interactive visualizer benchmarking **51 B2B laundry CRM, POS, and operations software platforms** across 12 research dimensions. Inspired by the clean data-storytelling of [*100.datavizproject.com*](https://100.datavizproject.com/).

👉 **[Explore the Live Interactive Visualizer](https://sangeeth98.github.io/laundry-crm-research/)**

---

## 🌟 Key Highlights

- **51 Comprehensive Platform Dossiers**: Indian native SaaS (*Quick Dry Cleaning QDC, Turns, FabKlean, Swash*), global benchmarks (*CleanCloud, Cents OS, SMRT Systems, Geelus*), and enterprise consolidators evaluated across 12 dimensions (GTM, pricing, tech stack, founder pedigrees, customer friction).
- **Grounded Financial Transparency**: Strict dual-status reporting distinguishing **18 Verified Public Disclosures** (backed by direct URLs to *TechCrunch, UK Companies House, Dutch KvK, SEC, Inc 5000, Entrackr*) from **33 Undisclosed Private Entities** with explicit amber-highlighted modeled run-rates and calculation formulas.
- **Natural Earth SVG World Map**: 177 vector national borders rendered across 4 switchable dimensions (*Market Density, Starter Pricing, Business Models, HQ Origins*) with stationary glowing beacons.
- **Interactive Analytics Engine**: Real-time search, multi-tier filtering, outlier controls (toggle conglomerate outliers like Zoho Corp and Focus Softnet), linear/log10 scale switcher, native zero-flash dark mode, and client-side CSV/JSON/Markdown exports.
- **Pydantic v2 Core Schema**: All platform data is strictly validated against typed models enforcing ISO-3166 country codes, pricing structures, and financial audits.

---

## 🚀 Quickstart

Ensure [`uv`](https://docs.astral.sh/uv/) is installed:

```bash
# 1. Clone repository & install dependencies (<1s with uv)
git clone https://github.com/sangeeth98/laundry-crm-research.git
cd laundry-crm-research
uv sync

# 2. Validate data against Pydantic v2 & synchronize web assets
uv run python scripts/validate_and_export_data.py

# 3. Serve the interactive visualizer locally
python3 -m http.server 8080 -d site
```

Open `http://localhost:8080` in your browser.

---

## 📊 Data Assets

- **Single Source of Truth**: [`data/laundry_crm_51_companies_verified.json`](data/laundry_crm_51_companies_verified.json)
- **Typed Pydantic Schema**: [`src/models.py`](src/models.py)
- **Deep Research Report**: [`laundry_crm_deep_research_51_competitors.md`](laundry_crm_deep_research_51_competitors.md) (3,400+ lines)
- **Formatted Excel Workbook**: [`data/Laundry_CRM_Market_Intelligence_Master.xlsx`](data/Laundry_CRM_Market_Intelligence_Master.xlsx)  
  *(Generated via `uv run python scripts/export_laundry_crm_excel.py`)*

---

> [!NOTE]
> **Historical Archive**: Earlier exploratory research benchmarking Indian retail laundry service providers (*Tumbledry, UClean, DhobiLite*, store unit economics) is preserved in [`research/retail_laundry_operations_archive.md`](research/retail_laundry_operations_archive.md).

---

## 📜 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.
