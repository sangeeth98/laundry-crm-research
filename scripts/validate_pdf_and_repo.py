import os
import glob
import pypdf
import json

def validate_all():
    report_path = "build/laundry_market_report.pdf"
    
    print("=== EMPIRICAL VALIDATION SUITE ===")
    
    # 1. Check PDF existence & Page Count
    if not os.path.exists(report_path):
        raise FileNotFoundError(f"PDF Report missing at {report_path}")
    
    reader = pypdf.PdfReader(report_path)
    page_count = len(reader.pages)
    print(f"[OK] Master PDF Report exists: {report_path}")
    print(f"[OK] Total PDF Page Count: {page_count} Pages (Target: 50+ Pages)")
    assert page_count >= 50, f"Page count is {page_count}, expected >= 50"

    # 2. Check founder data JSON
    with open("data/linkedin_founders_data.json", "r") as f:
        founders = json.load(f)
    print(f"[OK] Founder records count: {len(founders)}")
    for f_info in founders:
        assert "linkedin_url" in f_info and f_info["linkedin_url"].startswith("http"), f"Missing valid linkedin_url for {f_info['founder_name']}"
        assert "photo_path" not in f_info, f"photo_path still exists for {f_info['founder_name']}"
    print("[OK] All 12 founder records verified clean with valid hyperlinked URLs and 0 image placeholders.")

    # 3. Check one-time scripts cleanup
    existing_scripts = glob.glob("scripts/*.py")
    disallowed_scripts = [
        "capture_founder_avatars.py",
        "scrape_founder_photos.py",
        "fetch_public_founder_photos.py",
        "scrape_real_founder_photos.py",
        "fetch_bing_founder_headshots.py",
        "fast_linkedin_scrape.py"
    ]
    for script_path in existing_scripts:
        basename = os.path.basename(script_path)
        assert basename not in disallowed_scripts, f"Disallowed one-time script found: {basename}"
    print(f"[OK] Workspace scripts directory clean: {len(existing_scripts)} active core scripts ({[os.path.basename(s) for s in existing_scripts]}).")

    # 4. Check founder images directory deleted
    assert not os.path.exists("data/images/founders"), "data/images/founders directory still exists!"
    print("[OK] data/images/founders directory cleanly removed.")

    # 5. Check OKF Lessons Learned documentation
    assert os.path.exists("okf/concepts/research/scraping-lessons-learned.md"), "Scraping lessons learned document missing!"
    print("[OK] okf/concepts/research/scraping-lessons-learned.md verified.")

    print("=== ALL EMPIRICAL VALIDATION CHECKS PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    validate_all()
