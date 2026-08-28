# OKF Research & Technical Architecture Mantra

**Version:** 4.0  
**Core Purpose:** Absolute research rigor, empirical tech stack verification, decoupled entity classification, Playwright live website analysis, dynamic image aspect-ratio scaling, and strict repository hygiene.

---

## The 7 Core Guiding Principles (The Main Mantra)

1. **Decouple Service Providers from CRM Software Platforms**:
   - **Category A — Service Provider Companies (Finished B2C & Franchise Laundry Operators):** Companies that wash and dry clean garments for end retail consumers or franchisees (e.g., Tumbledry, UClean, DhobiLite, Fabricspa, Laundrywala, LaundroKart).
   - **Category B — CRM & Software Platforms (B2B SaaS POS & ERP Engines):** Technology platforms used by store owners to run POS, billing, driver dispatch, barcode tagging, and washer IoT hardware (e.g., Quick Dry Cleaning QDC, CleanCloud, Cents OS, Curbside Laundries, Wash-Dry-Fold POS, LinenMaster, ABS ABSSolute, Zoho CRM / Creator).

2. **Empirical Fact Verification & OKF v0.2 Compliance**:
   - Every claim, store count, revenue estimate, founding year, pricing tier, and founder background must be backed by verifiable sources and documented in Subject-Predicate-Object (S-P-O) triples under the **Google OKF v0.2 Specification**.

3. **Playwright Real Data & Live Web Captures**:
   - Use Playwright browser automation to capture real, live website screenshots of operational platforms instead of generated graphic placeholders. All screenshots are stored in `data/images/real_sites/`.

4. **Hyperlinked Founder Profiles & Zero-Placeholder Policy**:
   - Verify founder education, career history, alma mater (e.g., IIT Bombay, IIT BHU, Symbiosis), and past executive roles.
   - **Never** embed unauthenticated login walls, broken avatar placeholders, or AI generated image mockups. Present founder credentials with direct clickable hyperlinks (`<a href="https://linkedin.com/in/...">Founder Name</a>`).

5. **Deep Tech Stack & Network Traffic Inspection**:
   - Inspect HTTP response headers, CDN middleware (Cloudflare, AWS CloudFront, Nginx), frontend frameworks (React, Next.js, Vue, Tailwind), mobile app stacks (Flutter, React Native), database backends (PostgreSQL, Redis, MySQL), and user auth/payment gateways (MSG91, Firebase Auth, Razorpay, Stripe). Save all structured stack data in `data/tech_stack_profiles.json`.

6. **Dynamic Image Scaling & Zero-Distortion PDF Layouts**:
   - Always calculate proportional image dimensions dynamically using `PIL.Image` size before rendering in ReportLab. Never pass hardcoded static `width` and `height` parameters that stretch or tilt PDF pages.

7. **Strict Script & Repository Hygiene**:
   - Keep only reusable core scripts inside `scripts/` (`scripts/capture_real_screenshots.py`, `scripts/inspect_tech_stack.py`, `scripts/generate_visualizations.py`, `scripts/build_notebook.py`, `scripts/build_pdf_report.py`).
   - Immediately delete temporary one-time execution scripts.
   - Store all compiled PDF deliverables inside `build/` (`build/laundry_market_report.pdf`).
