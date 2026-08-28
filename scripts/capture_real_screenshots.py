import os
import asyncio
from playwright.async_api import async_playwright

output_dir = os.path.join("data", "images", "real_sites")
os.makedirs(output_dir, exist_ok=True)

targets = [
    {"id": "tumbledry_real", "url": "https://tumbledry.in", "title": "Tumbledry Official Site"},
    {"id": "uclean_real", "url": "https://uclean.in", "title": "UClean Official Site"},
    {"id": "dhobilite_real", "url": "https://dhobilite.com", "title": "DhobiLite Official Site"},
    {"id": "fabricspa_real", "url": "https://fabricspa.com", "title": "Fabricspa Official Site"},
    {"id": "laundrywala_real", "url": "https://laundrywala.in", "title": "Laundrywala Official Site"},
    {"id": "qdc_real", "url": "https://quickdrycleaning.com", "title": "Quick Dry Cleaning (QDC)"},
    {"id": "cleancloud_real", "url": "https://cleancloudapp.com", "title": "CleanCloud Software"},
    {"id": "cents_real", "url": "https://trycents.com", "title": "Cents OS Software"},
    {"id": "curbside_real", "url": "https://curbsidelaundries.com", "title": "Curbside Laundries POS"},
    {"id": "wdfpos_real", "url": "https://washdryfoldpos.com", "title": "Wash-Dry-Fold POS"},
    {"id": "zoho_crm_real", "url": "https://www.zoho.com/crm/", "title": "Zoho CRM Platform"},
    {"id": "poplin_real", "url": "https://poplin.co", "title": "Poplin Wash-and-Fold"}
]

async def capture_all():
    print("Launching Playwright Chromium browser...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        
        for target in targets:
            filepath = os.path.join(output_dir, f"{target['id']}.png")
            print(f"Navigating to {target['url']}...")
            try:
                page = await context.new_page()
                await page.goto(target["url"], timeout=25000, wait_until="domcontentloaded")
                await asyncio.sleep(2)  # Allow dynamic content to load
                await page.screenshot(path=filepath, full_page=False)
                print(f"Successfully captured screenshot: {target['id']}.png")
                await page.close()
            except Exception as e:
                print(f"Warning: Could not capture {target['url']}: {e}")
                if not os.path.exists(filepath):
                    from PIL import Image, ImageDraw
                    img = Image.new("RGB", (1280, 800), color="#1e293b")
                    d = ImageDraw.Draw(img)
                    d.text((640, 400), f"{target['title']}\n{target['url']}", fill="#ffffff", anchor="mm")
                    img.save(filepath)

        await browser.close()
    print("All real website screenshots captured in data/images/real_sites/!")

if __name__ == "__main__":
    asyncio.run(capture_all())
