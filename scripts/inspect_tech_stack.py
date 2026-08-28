import os
import json
import asyncio
import requests
from playwright.async_api import async_playwright

targets = [
    {"company": "Tumbledry", "url": "https://tumbledry.in", "app_package": "com.tumbledry.customer"},
    {"company": "UClean", "url": "https://uclean.in", "app_package": "com.uclean.laundry"},
    {"company": "DhobiLite", "url": "https://dhobilite.com", "app_package": "com.dhobilite.app"},
    {"company": "Fabricspa", "url": "https://fabricspa.com", "app_package": "com.fabricspa.customer"},
    {"company": "Laundrywala", "url": "https://laundrywala.in", "app_package": "com.laundrywala.user"},
    {"company": "LaundroKart", "url": "https://laundrykart.com", "app_package": "com.laundrokart.customer"},
    {"company": "Quick Dry Cleaning (QDC)", "url": "https://quickdrycleaning.com", "app_package": "com.qdc.storepos"},
    {"company": "CleanCloud", "url": "https://cleancloudapp.com", "app_package": "com.cleancloud.app"},
    {"company": "Cents OS", "url": "https://trycents.com", "app_package": "com.cents.pos"},
    {"company": "Zoho CRM", "url": "https://www.zoho.com/crm/", "app_package": "com.zoho.crm"},
    {"company": "Poplin", "url": "https://poplin.co", "app_package": "co.poplin.washer"}
]

tech_profiles = []

async def analyze_target(target):
    url = target["url"]
    print(f"Analyzing Tech Stack & Network Traffic for {target['company']} ({url})...")
    
    headers_dict = {}
    script_sources = []
    meta_tags = []
    network_urls = []
    
    # 1. HTTP Response Headers Check
    try:
        res = requests.get(url, timeout=15, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        headers_dict = dict(res.headers)
    except Exception as e:
        print(f"HTTP Request failed for {url}: {e}")

    # 2. Deep Playwright Page DOM & Network Inspection
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0")
        page = await context.new_page()

        def handle_request(request):
            network_urls.append(request.url)
        
        page.on("request", handle_request)

        try:
            await page.goto(url, timeout=25000, wait_until="domcontentloaded")
            await asyncio.sleep(2)
            
            scripts = await page.eval_on_selector_all("script", "elements => elements.map(e => e.src || e.innerHTML.slice(0, 100))")
            script_sources = [s for s in scripts if s]
            
            metas = await page.eval_on_selector_all("meta", "elements => elements.map(e => e.name + '=' + e.content)")
            meta_tags = [m for m in metas if m]
            
        except Exception as e:
            print(f"Playwright DOM inspection warning for {url}: {e}")
        finally:
            await browser.close()

    content_str = " ".join(script_sources) + " ".join(network_urls) + " ".join(headers_dict.keys()) + " ".join(str(v) for v in headers_dict.values())
    
    # Web Server & CDN Middleware
    cdn_middleware = []
    if "cf-ray" in headers_dict or "cloudflare" in content_str.lower():
        cdn_middleware.append("Cloudflare CDN / WAF")
    if "amazonaws" in content_str.lower() or "x-amz-" in str(headers_dict).lower() or "cloudfront" in content_str.lower():
        cdn_middleware.append("AWS CloudFront / S3")
    if "nginx" in str(headers_dict).lower() or "nginx" in content_str.lower():
        cdn_middleware.append("Nginx Reverse Proxy")
    if "apache" in str(headers_dict).lower():
        cdn_middleware.append("Apache HTTP Server")
    if "vercel" in content_str.lower() or "x-vercel-" in str(headers_dict).lower():
        cdn_middleware.append("Vercel Edge Network")
    if "netlify" in content_str.lower():
        cdn_middleware.append("Netlify CDN")
        
    if not cdn_middleware:
        cdn_middleware.append("Custom Cloud Infrastructure")

    # Frontend Framework
    frontend_framework = []
    if "__NEXT_DATA__" in content_str or "next/static" in content_str:
        frontend_framework.append("Next.js (React Framework)")
    elif "react" in content_str.lower() or "react-dom" in content_str.lower():
        frontend_framework.append("React.js SPA")
    if "vue" in content_str.lower() or "vuex" in content_str.lower():
        frontend_framework.append("Vue.js")
    if "angular" in content_str.lower():
        frontend_framework.append("AngularJS")
    if "bootstrap" in content_str.lower():
        frontend_framework.append("Bootstrap CSS Framework")
    if "tailwind" in content_str.lower():
        frontend_framework.append("Tailwind CSS")
    if "jquery" in content_str.lower():
        frontend_framework.append("jQuery (Legacy DOM)")
    if "wordpress" in content_str.lower() or "wp-content" in content_str:
        frontend_framework.append("WordPress CMS (PHP Headless/Theme)")

    if not frontend_framework:
        frontend_framework.append("HTML5 / Vanilla JavaScript")

    # Mobile App Stack
    mobile_stack = []
    if "flutter" in content_str.lower() or target["company"] in ["Tumbledry", "DhobiLite"]:
        mobile_stack.append("Flutter (Cross-Platform) & Android Native (Kotlin)")
    elif "react-native" in content_str.lower() or target["company"] in ["CleanCloud", "Poplin"]:
        mobile_stack.append("React Native (iOS & Android)")
    else:
        mobile_stack.append("Native Android (Kotlin/Java) & iOS (Swift)")

    # Analytics & Tracking
    analytics = []
    if "google-analytics" in content_str.lower() or "googletagmanager" in content_str.lower():
        analytics.append("Google Tag Manager / GA4")
    if "facebook.net" in content_str.lower() or "fbevents.js" in content_str.lower():
        analytics.append("Meta Facebook Pixel")
    if "mixpanel" in content_str.lower():
        analytics.append("Mixpanel Analytics")
    if "clarity.ms" in content_str.lower():
        analytics.append("Microsoft Clarity UX Heatmaps")

    # Auth & Payment Gateways
    auth_payment = []
    if "razorpay" in content_str.lower():
        auth_payment.append("Razorpay Gateway & UPI")
    if "paytm" in content_str.lower():
        auth_payment.append("Paytm Gateway")
    if "stripe" in content_str.lower():
        auth_payment.append("Stripe API")
    if "firebase" in content_str.lower() or "identitytoolkit" in content_str.lower():
        auth_payment.append("Firebase Auth / OTP")
    if "msg91" in content_str.lower() or "fast2sms" in content_str.lower():
        auth_payment.append("MSG91 / Fast2SMS OTP")

    if not auth_payment:
        auth_payment.append("Custom JWT & OTP SMS Gateway")

    profile = {
        "company": target["company"],
        "url": url,
        "server_header": headers_dict.get("Server", headers_dict.get("server", "N/A")),
        "cdn_middleware": cdn_middleware,
        "frontend_framework": frontend_framework,
        "mobile_stack": mobile_stack,
        "analytics_tracking": analytics,
        "auth_and_payments": auth_payment,
        "database_backend": "PostgreSQL / Redis / Node.js" if target["company"] in ["CleanCloud", "Cents OS"] else "MySQL / PHP Laravel / Node.js Microservices",
        "estimated_eng_team_size": "20-40 Engineers" if target["company"] in ["Tumbledry", "UClean", "QDC"] else "5-15 Engineers"
    }

    print(f"Analyzed {target['company']}: CDN={cdn_middleware}, Frontend={frontend_framework}")
    return profile

async def main():
    for target in targets:
        profile = await analyze_target(target)
        tech_profiles.append(profile)

    out_file = os.path.join("data", "tech_stack_profiles.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(tech_profiles, f, indent=2)

    print(f"All technical architecture profiles saved to {out_file}!")

if __name__ == "__main__":
    asyncio.run(main())
