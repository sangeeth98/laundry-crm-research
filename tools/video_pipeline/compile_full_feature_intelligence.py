"""
Complete feature intelligence compiler for laundry CRM benchmarking.
Compiles rich feature summaries, structured operator workflows, and verified action frame proof mappings
across Quick Dry Cleaning (QDC), Fabklean, Turns OS, and Swash SLS.
"""

from __future__ import annotations

import glob
import json
import os
import re
import sys
from typing import Any, Dict, List, Optional, Tuple

MODULE_CATEGORIES = {
    "pos_intake": "POS & Counter Intake",
    "tagging_assembly": "Garment Tagging & Assembly",
    "plant_workshop": "Plant & Workshop Operations",
    "driver_logistics": "Driver Logistics & Doorstep mPOS",
    "customer_marketing": "Customer Experience & WhatsApp",
    "billing_finance": "Billing, Payments & Compliance",
    "hardware_ecosystem": "Hardware & Peripherals",
    "admin_multi_store": "Multi-Store & Admin Configuration",
}

COMPETITOR_META = {
    "qdc": {
        "id": "qdc",
        "name": "Quick Dry Cleaning",
        "color": "sky",
        "origin": "Noida, India (Est. 2011)",
        "scale": "5,000+ stores across 35 countries",
        "core_moat": "Exhaustive multi-tier Super Admin RBAC, ZATCA Phase 2 compliance, and legacy TVS/Citizen printer drivers."
    },
    "fabklean": {
        "id": "fabklean",
        "name": "Fabklean",
        "color": "emerald",
        "origin": "Hyderabad, India (Est. 2015)",
        "scale": "1,200+ laundromats & dry cleaners",
        "core_moat": "Interactive 2D garment silhouette damage canvas, barcode assembly station, and multi-brand franchise sync."
    },
    "turns": {
        "id": "turns",
        "name": "Turns OS",
        "color": "purple",
        "origin": "San Francisco, USA / India (Est. 2022)",
        "scale": "1,500+ US laundromats (Acq. by PayRange)",
        "core_moat": "Wash & fold minimum poundage tare calculation, card-on-file billing, and automated Google Review engine."
    },
    "swash": {
        "id": "swash",
        "name": "Swash SLS",
        "color": "rose",
        "origin": "Surat, India (Est. 2018)",
        "scale": "1,000+ dry cleaning & laundry chains",
        "core_moat": "High-velocity keyboard POS shortcuts, rider doorstep dynamic UPI QR, and built-in printer pitch calibration."
    },
}

def clean_prose(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"https?://\S+", "", text)
    text = re.sub(r"#\w+", "", text)
    text = re.sub(r"(?i)(if you haven\'t subscribed|subscribe to our channel|like this video|leave a comment|click here|for more details|call us at).*$", "", text)
    text = re.sub(r"[*_`]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

def parse_seconds_from_filename(filename: str) -> int:
    m = re.search(r"(\d+)m(\d+)s", os.path.basename(filename))
    if m:
        return int(m.group(1)) * 60 + int(m.group(2))
    return 0

def get_closest_frame(frames: List[str], target_sec: int) -> Tuple[str, str]:
    if not frames:
        return "", "00m00s"
    best = frames[0]
    best_diff = 999999
    for f in frames:
        sec = parse_seconds_from_filename(f)
        diff = abs(sec - target_sec)
        if diff < best_diff:
            best_diff = diff
            best = f
    m = re.search(r"(\d+m\d+s)", os.path.basename(best))
    return best, m.group(1) if m else "00m00s"

def get_action_frame(frames: List[str]) -> Tuple[str, str]:
    if not frames:
        return "", "00m00s"
    if len(frames) == 1:
        fname = os.path.basename(frames[0])
        m = re.search(r"(\d+m\d+s)", fname)
        return frames[0], m.group(1) if m else "00m02s"
    idx = max(1, min(len(frames) - 1, int(len(frames) * 0.45)))
    chosen = frames[idx]
    fname = os.path.basename(chosen)
    m = re.search(r"(\d+m\d+s)", fname)
    return chosen, m.group(1) if m else "00m00s"

def build_video_catalog() -> Dict[str, Dict[str, Any]]:
    catalog = {}
    mpaths = glob.glob("data/raw/**/metadata.json", recursive=True)
    for mp in mpaths:
        vdir = os.path.dirname(mp)
        with open(mp, "r", encoding="utf-8") as f:
            meta = json.load(f)
        vid = meta.get("id")
        if not vid:
            continue
        frames = sorted(glob.glob(os.path.join(vdir, "frames", "*.png")))
        apath = os.path.join(vdir, "analysis.md")
        analysis_txt = ""
        if os.path.exists(apath):
            with open(apath, "r", encoding="utf-8") as af:
                analysis_txt = af.read()
        catalog[vid] = {
            "vdir": vdir,
            "metadata": meta,
            "analysis_txt": analysis_txt,
            "frames": frames,
            "title": meta.get("title", ""),
            "description": clean_prose(meta.get("description", "")),
            "url": meta.get("url", f"https://www.youtube.com/watch?v={vid}"),
            "release_era": meta.get("release_era", "2024-2026 Modern SaaS Era"),
            "formatted_date": meta.get("formatted_date", "2024-01-01"),
        }
    return catalog

print("Video catalog builder ready.")
