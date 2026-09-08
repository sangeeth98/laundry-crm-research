import glob
import json
import os
import re
import sys
import time
from pathlib import Path
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

def clean_prose(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"https?://\S+", "", text)
    text = re.sub(r"#\w+", "", text)
    text = re.sub(r"(?i)(if you haven't subscribed|subscribe to our channel|like this video|leave a comment|click here|for more details|call us at).*$", "", text)
    text = re.sub(r"[*_`]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

def parse_video_dir(video_dir: str) -> Dict[str, Any]:
    meta_path = os.path.join(video_dir, "metadata.json")
    analysis_path = os.path.join(video_dir, "analysis.md")
    
    meta: Dict[str, Any] = {}
    if os.path.exists(meta_path):
        with open(meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)

    title = meta.get("title", os.path.basename(video_dir))
    description = clean_prose(meta.get("description", ""))
    overview = description
    steps: List[str] = []
    
    if os.path.exists(analysis_path):
        with open(analysis_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        ov_match = re.search(r"## Feature Overview & Description\s*\n(.*?)(?=\n##|\Z)", content, re.DOTALL)
        if ov_match:
            raw_ov = ov_match.group(1).strip()
            lines = raw_ov.split("\n")
            bullet_lines = [l.strip() for l in lines if l.strip().startswith(("*", "-", "1.", "2.", "3.", "4.", "5."))]
            non_bullets = [l.strip() for l in lines if not l.strip().startswith(("*", "-", "1.", "2.", "3.", "4.", "5.")) and l.strip()]
            
            clean_ov = clean_prose(" ".join(non_bullets))
            if len(clean_ov) > 25:
                overview = clean_ov
            
            for b in bullet_lines:
                cl = clean_prose(re.sub(r"^[\*\-\d\.\s]+", "", b))
                if len(cl) > 10 and not cl.lower().startswith("http"):
                    steps.append(cl)

    frames_dir = os.path.join(video_dir, "frames")
    frames = sorted(glob.glob(os.path.join(frames_dir, "*.png")))

    return {
        "video_dir": video_dir,
        "video_id": meta.get("id", ""),
        "title": title,
        "url": meta.get("url", f"https://www.youtube.com/watch?v={meta.get('id', '')}"),
        "overview": overview,
        "steps": steps,
        "release_era": meta.get("release_era", "2024-2026 SaaS Era"),
        "formatted_date": meta.get("formatted_date", "2025-01-01"),
        "duration": meta.get("duration_formatted", "02:00"),
        "frames": frames,
    }

def get_action_frame(frames: List[str], target_sec: Optional[int] = None) -> Tuple[str, str]:
    if not frames:
        return "", "00m00s"
    if len(frames) == 1:
        fname = os.path.basename(frames[0])
        m = re.search(r"(\d+m\d+s)", fname)
        return frames[0], m.group(1) if m else "00m02s"
    
    if target_sec is not None:
        best_f = frames[0]
        best_diff = 999999
        for f in frames:
            fname = os.path.basename(f)
            m = re.search(r"(\d+)m(\d+)s", fname)
            if m:
                sec = int(m.group(1)) * 60 + int(m.group(2))
                diff = abs(sec - target_sec)
                if diff < best_diff:
                    best_diff = diff
                    best_f = f
        fname = os.path.basename(best_f)
        m = re.search(r"(\d+m\d+s)", fname)
        return best_f, m.group(1) if m else "00m00s"

    # Pick frame around 40% into video (skipping intro slide)
    idx = max(1, min(len(frames) - 1, int(len(frames) * 0.45)))
    chosen = frames[idx]
    fname = os.path.basename(chosen)
    m = re.search(r"(\d+m\d+s)", fname)
    return chosen, m.group(1) if m else "00m00s"

print("Core parser compiled.")
