"""
Single unified validation and export pipeline for B2B Laundry CRM Market Intelligence.

Validates 51 global and Indian platforms against strict Pydantic v2 schemas and
synchronizes all runtime datasets for the static visualization web application.
"""

import json
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, ".")
from src.models import LaundryCRMIntelligenceReport, CompanyDossier

DATA_FILE = Path("data/laundry_crm_51_companies_verified.json")
COUNTRY_DIMENSIONS_FILE = Path("data/laundry_crm_country_dimensions.json")
SITE_DATA_DIR = Path("site/data")
SITE_DATA_DIR.mkdir(parents=True, exist_ok=True)

def main():
    print(f"Loading {DATA_FILE} for Pydantic v2 strict validation...")
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    # 1. Strict Pydantic v2 validation
    report = LaundryCRMIntelligenceReport(companies=raw_data)
    print(f"Validation SUCCESS! Successfully validated {report.count()} companies across 12 dimensions.")

    tier_counts = report.get_tier_breakdown()
    status_counts = report.get_status_breakdown()
    print("Tier breakdown:", tier_counts)
    print("Status breakdown:", status_counts)

    country_freq = report.get_country_frequency()
    print(f"Active across {len(country_freq)} unique countries worldwide.")

    # 2. Export sanitized master payload for web visualizer
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

    # JSON export
    site_export_path = SITE_DATA_DIR / "laundry_crm_master_data.json"
    with open(site_export_path, "w", encoding="utf-8") as f:
        json.dump(site_payload, f, indent=2, ensure_ascii=False)
    print(f"Exported JSON dataset to {site_export_path}")

    # JS export for static file:// and GitHub Pages execution
    js_export_path = Path("site/data.js")
    with open(js_export_path, "w", encoding="utf-8") as f:
        f.write("window.LAUNDRY_CRM_DATA = " + json.dumps(site_payload, indent=2, ensure_ascii=False) + ";\n")
    print(f"Exported inlined JS dataset to {js_export_path}")

    # 3. Synchronize Country Dimensions & Map Data
    if COUNTRY_DIMENSIONS_FILE.exists():
        with open(COUNTRY_DIMENSIONS_FILE, "r", encoding="utf-8") as f:
            country_records = json.load(f)

        comps = site_payload["companies"]
        for code, rec in country_records.items():
            active_comps = []
            prices = []
            for c in comps:
                if code in c["market"]["country_codes"]:
                    active_comps.append({
                        "id": c["id"],
                        "name": c["name"],
                        "tier": c["tier"],
                        "price": c["pricing"]["tiers"][0]["price"] if c["pricing"]["tiers"] else "Custom",
                        "price_usd": c["starter_price_usd"],
                        "model": c["business_model_category"],
                        "status": c["status_category"],
                        "actual_status": c.get("actual_revenue", {}).get("actual_status", "undisclosed") if c.get("actual_revenue") else "undisclosed",
                        "reported_figure": c.get("actual_revenue", {}).get("reported_figure") if c.get("actual_revenue") else None,
                        "projected_figure": c.get("actual_revenue", {}).get("projected_figure") if c.get("actual_revenue") else None
                    })
                    if c["starter_price_usd"] > 0:
                        prices.append(c["starter_price_usd"])
            rec["platforms"] = active_comps
            rec["vendor_count"] = len(active_comps)
            if prices:
                rec["avg_starter_price_usd"] = round(sum(prices) / len(prices), 1)

        # Save synchronized country dimensions
        with open(COUNTRY_DIMENSIONS_FILE, "w", encoding="utf-8") as f:
            json.dump(country_records, f, indent=2, ensure_ascii=False)
        print(f"Updated country dimensions in {COUNTRY_DIMENSIONS_FILE}")

        # Export map_data.js for web app
        map_js_path = Path("site/map_data.js")
        with open(map_js_path, "w", encoding="utf-8") as f:
            f.write("window.LAUNDRY_MAP_DATA = " + json.dumps(country_records, indent=2, ensure_ascii=False) + ";\n")
        print(f"Exported map dataset to {map_js_path}")

    print("\nData validation & web synchronization complete!")

if __name__ == "__main__":
    main()
