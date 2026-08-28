# Technical Lessons Learned & Scraping Failure Modes (OKF v0.2 Knowledge Triple)

## 1. LinkedIn Unauthenticated Scraper Failure Mode
- **Phenomenon:** Running automated headless scrapers (Playwright/Puppeteer) against public LinkedIn profile URLs without an active authenticated user session (`storageState`) triggers anti-scraping auth walls.
- **Root Cause:** LinkedIn intercepts unauthenticated HTTP requests from headless Chrome user-agents, serving an interstitial sign-in modal (`Join LinkedIn / Sign In`) or returning SVG placeholder avatars instead of rendering `.pv-top-card__photo`.
- **Symptom:** Naive DOM element screenshots capture "Sign-in to LinkedIn" banners or broken preview blocks.
- **Protocol Directive:**
  - **Never** embed login-wall screenshots or synthetic generated mockups into executive client reports.
  - Rely on hyperlinked founder credentials (`<a href="https://linkedin.com/in/...">Founder Name</a>`) pointing directly to their live LinkedIn profiles.
  - Delete one-time temporary scraping scripts after execution to maintain repository hygiene.

## 2. ReportLab PDF Image Distortion & Skewing Mitigation
- **Phenomenon:** Hardcoding static `width` and `height` parameters on ReportLab `Image` flowables (e.g., `Image(path, width=6.5*inch, height=3.0*inch)`) stretches pixel aspect ratios non-uniformly.
- **Root Cause:** Images with non-matching aspect ratios are forced into distorted bounding boxes, causing visual warping and perceived "tilting" of document pages.
- **Protocol Directive:**
  - Calculate exact proportional dimensions dynamically:
    ```python
    from PIL import Image as PILImage
    with PILImage.open(img_path) as im:
        w, h = im.size
        aspect = w / h
        calc_w = min(max_width, w)
        calc_h = calc_w / aspect
        if calc_h > max_height:
            calc_h = max_height
            calc_w = calc_h * aspect
        return RLImage(img_path, width=calc_w, height=calc_h)
    ```

## 3. OKF Knowledge Triples Index
```turtle
@prefix okf: <http://google.com/okf/v0.2#> .
@prefix ex:  <http://laundrystartup.org/entity/> .

ex:LinkedInScraper okf:hasFailureMode "Unauthenticated interstitial sign-in wall modal redirect" .
ex:ReportLabRenderer okf:requiresMitigation "Dynamic proportional aspect ratio scaling via PIL.Image size inspection" .
ex:RepositoryHygiene okf:mandatesAction "Delete one-time scraping scripts and clean temporary assets" .
```
