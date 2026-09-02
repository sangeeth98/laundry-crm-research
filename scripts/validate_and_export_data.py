import json
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, '.')
from src.models import LaundryCRMIntelligenceReport, CompanyDossier

DATA_FILE = Path("data/laundry_crm_51_companies_verified.json")
SITE_DATA_DIR = Path("site/data")
SITE_DATA_DIR.mkdir(parents=True, exist_ok=True)

def main():
    print(f"Loading {DATA_FILE} for Pydantic v2 strict validation...")
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    # Validate against Pydantic model
    report = LaundryCRMIntelligenceReport(companies=raw_data)
    print(f"Validation SUCCESS! Successfully validated {report.count()} companies.")

    tier_counts = report.get_tier_breakdown()
    status_counts = report.get_status_breakdown()
    print("Tier breakdown:", tier_counts)
    print("Status breakdown:", status_counts)

    country_freq = report.get_country_frequency()
    print(f"Active in {len(country_freq)} unique countries worldwide.")

    # Export sanitized payload for static visualization web app
    site_payload = {
        "metadata": {
            "title": "51 B2B Laundry CRM & Operations Platforms: Master Intelligence Dossier",
            "total_companies": report.count(),
            "tier_counts": tier_counts,
            "status_counts": status_counts,
            "unique_countries_count": len(country_freq),
            "country_frequencies": country_freq
        },
        "companies": [c.model_dump() for c in report.companies]
    }

    # 1. JSON export
    site_export_path = SITE_DATA_DIR / "laundry_crm_master_data.json"
    with open(site_export_path, "w", encoding="utf-8") as f:
        json.dump(site_payload, f, indent=2, ensure_ascii=False)
    print(f"Exported JSON dataset to {site_export_path}")

    # 2. JS export for offline file:// support
    js_export_path = Path("site/data.js")
    with open(js_export_path, "w", encoding="utf-8") as f:
        f.write("window.LAUNDRY_CRM_DATA = " + json.dumps(site_payload, indent=2, ensure_ascii=False) + ";\n")
    print(f"Exported inlined JS dataset to {js_export_path}")

if __name__ == "__main__":
    main()
