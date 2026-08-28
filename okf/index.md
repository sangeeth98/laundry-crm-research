# Open Knowledge Format (OKF) v0.2 Knowledge Bundle Index
**Root Package:** Indian Laundry Market & CRM Research Ontology  
**Mantra Guidelines:** [`MANTRA.md`](file:///c:/projects/laundry/research/MANTRA.md)  
**Master Report Deliverable:** [`build/laundry_market_report.pdf`](file:///c:/projects/laundry/research/build/laundry_market_report.pdf)  

---

## Knowledge Graph Navigation

### 1. Data Gathering Methodology & Verification Node (`concepts/methodology.md`)
*   **Initial Notes Intake:** Processing raw user requirements from `notes.txt`.
*   **Decoupled Entity Modeling:** Decoupling Category A (Service Providers) from Category B (CRM & Software Platforms).
*   **Playwright Automation:** Capturing 12 live website screenshots in `data/images/real_sites/`.
*   **Network & Tech Inspection:** Mapping CDN, frontend frameworks, mobile stacks, and databases in `data/tech_stack_profiles.json`.
*   **LinkedIn Founder Verification:** Scraping executive education (IIT Bombay, IIT BHU, Symbiosis) and career history.
*   **Quantitative Analytics:** Executing `laundry_market_visualization.ipynb` via `uv run jupyter`.

### 2. Category A — Service Provider Companies
*   [`concepts/entities/tumbledry.md`](file:///c:/projects/laundry/research/okf/concepts/entities/tumbledry.md)
*   [`concepts/entities/uclean.md`](file:///c:/projects/laundry/research/okf/concepts/entities/uclean.md)
*   [`concepts/entities/dhobilite.md`](file:///c:/projects/laundry/research/okf/concepts/entities/dhobilite.md)
*   [`concepts/entities/fabricspa.md`](file:///c:/projects/laundry/research/okf/concepts/entities/fabricspa.md)

### 3. Category B — CRM & Software Platforms
*   [`concepts/software/qdc.md`](file:///c:/projects/laundry/research/okf/concepts/software/qdc.md)
*   [`concepts/software/cleancloud.md`](file:///c:/projects/laundry/research/okf/concepts/software/cleancloud.md)
*   [`concepts/software/cents.md`](file:///c:/projects/laundry/research/okf/concepts/software/cents.md)
*   [`concepts/software/curbside.md`](file:///c:/projects/laundry/research/okf/concepts/software/curbside.md)
*   [`concepts/software/wash-dry-fold-pos.md`](file:///c:/projects/laundry/research/okf/concepts/software/wash-dry-fold-pos.md)
*   [`concepts/software/zoho-crm.md`](file:///c:/projects/laundry/research/okf/concepts/software/zoho-crm.md)

### 4. Empirical SPO Triples
*   [`triples/market_triples.json`](file:///c:/projects/laundry/research/okf/triples/market_triples.json)

### 5. Technical Lessons Learned & Failure Modes
*   [`concepts/research/scraping-lessons-learned.md`](file:///c:/projects/laundry/research/okf/concepts/research/scraping-lessons-learned.md)

