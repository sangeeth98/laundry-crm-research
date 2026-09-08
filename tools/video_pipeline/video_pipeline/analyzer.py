"""Analysis and documentation generator for extracted CRM UI screens."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Optional
from video_pipeline.metadata import VideoMetadata, PlaylistManifest
from video_pipeline.frame_extractor import FramesManifest


def infer_feature_category(title: str, description: Optional[str] = None) -> str:
    """Categorize video based on title and description keywords."""
    text = f"{title} {description or ''}".lower()
    if any(k in text for k in ["store", "superadmin", "super admin", "setting", "config", "setup", "permission"]):
        return "Core Configuration & Admin"
    elif any(k in text for k in ["advance", "payment", "stripe", "discount", "price", "pricing", "invoic", "zatca", "bill"]):
        return "Billing, Pricing & Payments"
    elif any(k in text for k in ["workshop", "reject", "reprocess", "garment", "plant", "iron", "wash"]):
        return "Workshop & Plant Operations"
    elif any(k in text for k in ["customer", "loyalty", "otp", "package", "onboard", "address", "map"]):
        return "Customer Management & Loyalty"
    elif any(k in text for k in ["mpos", "pos", "order", "delivery", "pickup", "scheduler", "rider", "route"]):
        return "POS, Pickup & Delivery Operations"
    elif any(k in text for k in ["whatsapp", "marketing", "growth mate", "notification", "sms"]):
        return "Marketing & Communication"
    elif any(k in text for k in ["report", "analytics", "dashboard", "overview"]):
        return "Reporting & Analytics"
    return "General CRM Operations"


def generate_video_analysis(
    metadata: VideoMetadata,
    frames_manifest: FramesManifest,
    output_dir: Path,
) -> Path:
    """Generate structured analysis.md and analysis.json documenting UI and workflow."""
    category = infer_feature_category(metadata.title, metadata.description)

    analysis_data = {
        "video_id": metadata.id,
        "title": metadata.title,
        "release_date": metadata.formatted_date,
        "release_era": metadata.release_era,
        "duration": metadata.duration_formatted,
        "category": category,
        "total_screenshots": frames_manifest.total_frames_extracted,
        "resolution": frames_manifest.video_resolution,
        "url": metadata.url,
        "extracted_frames": [
            {
                "index": f.index,
                "timestamp": f.timestamp_formatted,
                "file": f.filename,
                "type": f.detected_ui_type,
            }
            for f in frames_manifest.frames
        ],
    }

    with open(output_dir / "analysis.json", "w", encoding="utf-8") as f:
        json.dump(analysis_data, f, indent=2)

    # Build comprehensive analysis markdown
    md_lines: List[str] = [
        f"# Video UI Analysis: {metadata.title}",
        "",
        "## Release & Historical Context",
        f"- **Release Date**: {metadata.formatted_date or 'Unknown'} ({metadata.release_era or 'Era Unknown'})",
        f"- **Duration**: {metadata.duration_formatted or 'N/A'}",
        f"- **Resolution**: {frames_manifest.video_resolution}",
        f"- **Channel**: {metadata.channel or 'Quick Dry Cleaning Software'}",
        f"- **Video URL**: [{metadata.url}]({metadata.url})",
        f"- **Feature Domain**: `{category}`",
        "",
        "> [!NOTE]",
        f"> **UI Temporal Relevance**: This video was released on **{metadata.formatted_date}**. "
        "The captured interface reflects the software's UI architecture, styling conventions, and user workflow "
        f"at that specific point in time ({metadata.release_era}).",
        "",
        "## Feature Overview & Description",
        metadata.description.strip() if metadata.description else "No video description provided.",
        "",
        "## UI Workflow & Screen Breakdown",
        f"Captured **{frames_manifest.total_frames_extracted} representative screens** illustrating the end-to-end workflow:",
        "",
    ]

    for frame in frames_manifest.frames:
        md_lines.extend([
            f"### Screen {frame.index:02d} @ `{frame.timestamp_formatted}` — {frame.detected_ui_type}",
            f"- **Timestamp**: `{frame.timestamp_formatted}` ({frame.timestamp_seconds:.1f}s)",
            f"- **Screen Classification**: {frame.detected_ui_type}",
            f"- **Image**: `frames/{frame.filename}`",
            "",
            f"![Screen {frame.index:02d} @ {frame.timestamp_formatted}](frames/{frame.filename})",
            "",
        ])

    vendor_name = metadata.channel or "the platform"
    md_lines.extend([
        "## Architectural & UX Observations",
        "- **Navigation Paradigm**: Check layout patterns visible across screens (top header, left navigation drawer, breadcrumb navigation).",
        "- **Data Entry & Controls**: Notice the input fields, validation hints, toggle switches, and modal overlays used in this workflow.",
        f"- **Business Logic Encapsulation**: Evaluates how {vendor_name} enforces business rules (e.g. validation, permission checks, automated notifications).",
        "",
    ])

    analysis_md_path = output_dir / "analysis.md"
    with open(analysis_md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md_lines))

    return analysis_md_path


def update_ui_timeline(
    competitor_raw_dir: Path,
    manifest: Optional[PlaylistManifest] = None,
) -> Path:
    """Generate or update chronological ui_timeline.md in the competitor raw folder."""
    timeline_path = competitor_raw_dir / "ui_timeline.md"
    videos_dir = competitor_raw_dir / "videos"

    processed_analyses: List[Dict] = []
    if videos_dir.exists():
        for sub in sorted(videos_dir.iterdir()):
            if not sub.is_dir():
                continue
            analysis_json = sub / "analysis.json"
            if analysis_json.exists():
                try:
                    with open(analysis_json, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        data["_dir_name"] = sub.name
                        processed_analyses.append(data)
                except Exception:
                    pass

    # Sort processed videos by release_date
    processed_analyses.sort(key=lambda x: x.get("release_date") or "0000-00-00")

    lines: List[str] = [
        "# Chronological UI & Feature Evolution Timeline",
        "",
        "This document tracks the temporal rollout of features, application screens, and user workflows.",
        "Understanding video publication dates allows us to accurately reconstruct when specific UI designs and capabilities were delivered to customers.",
        "",
        "## Summary Metrics",
        f"- **Total Cataloged Videos**: {manifest.total_videos if manifest else len(processed_analyses)}",
        f"- **Deep-Analyzed Videos with Screenshots**: {len(processed_analyses)}",
        "",
        "## Chronological Feature Releases (Analyzed)",
        "",
    ]

    if not processed_analyses:
        lines.append("*No video analyses recorded yet.*")
    else:
        lines.extend([
            "| Release Date | UI Era | Feature / Video Title | Category | Screens | Video Link |",
            "|:---|:---|:---|:---|:---:|:---|",
        ])
        for a in processed_analyses:
            date_str = a.get("release_date") or "Unknown"
            era_str = a.get("release_era") or "N/A"
            title = a.get("title", "Untitled")
            cat = a.get("category", "General")
            screens = a.get("total_screenshots", 0)
            dir_name = a.get("_dir_name")
            link = f"[{title}](videos/{dir_name}/analysis.md)" if dir_name else f"[{title}]({a.get('url')})"
            lines.append(f"| {date_str} | {era_str} | {link} | {cat} | {screens} | [YouTube]({a.get('url')}) |")

    if manifest and manifest.entries:
        lines.extend([
            "",
            "## Full Playlist Catalog (Chronological Manifest)",
            "",
            f"**Playlist Title**: {manifest.playlist_title} ({manifest.total_videos} videos)",
            "",
            "| # | Video Title | Duration | Status | YouTube URL |",
            "|---:|:---|:---:|:---:|:---|",
        ])
        analyzed_ids = {a.get("video_id") for a in processed_analyses}
        for entry in manifest.entries:
            status = " Analyzed" if entry.id in analyzed_ids else " Cataloged"
            lines.append(
                f"| {entry.playlist_index or '-'} | {entry.title} | {entry.duration_formatted or '-'} | {status} | [{entry.id}]({entry.url}) |"
            )

    with open(timeline_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    return timeline_path

