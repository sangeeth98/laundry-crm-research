"""High-quality video downloader using yt-dlp."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, Optional
import yt_dlp


def download_high_quality_video(
    url: str,
    output_dir: Path,
    filename_prefix: Optional[str] = None,
    keep_existing: bool = True,
) -> Path:
    """Download highest quality video stream and merge into an MP4 file.

    Returns the path to the downloaded MP4 file.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    out_template = f"{filename_prefix}.%(ext)s" if filename_prefix else "%(id)s.%(ext)s"
    target_pattern = output_dir / out_template

    # If prefix provided and MP4 already exists, skip download
    if filename_prefix and keep_existing:
        existing_mp4 = output_dir / f"{filename_prefix}.mp4"
        if existing_mp4.exists() and existing_mp4.stat().st_size > 0:
            return existing_mp4

    ydl_opts: Dict[str, Any] = {
        "format": "bestvideo[vcodec^=avc1][ext=mp4]+bestaudio[ext=m4a]/bestvideo[vcodec^=avc1]+bestaudio/bestvideo[ext=mp4]+bestaudio/best[ext=mp4]/best",
        "merge_output_format": "mp4",
        "outtmpl": str(target_pattern),
        "quiet": False,
        "no_warnings": True,
        "js_runtimes": {"node": {}},
        "retries": 10,
        "extractor_retries": 5,
        "fragment_retries": 10,
        "socket_timeout": 30,
    }

    import time
    video_id = None
    for attempt in range(1, 4):
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                video_id = info.get("id")
            break
        except Exception as e:
            if attempt == 3:
                raise
            time.sleep(3 * attempt)

    # Find the resulting file
    if filename_prefix:
        expected = output_dir / f"{filename_prefix}.mp4"
        if expected.exists():
            return expected
    expected_id = output_dir / f"{video_id}.mp4"
    if expected_id.exists():
        return expected_id

    # Fallback to any mp4 in output_dir matching the id
    matches = list(output_dir.glob(f"*{video_id}*.mp4"))
    if matches:
        return matches[0]

    raise FileNotFoundError(f"Failed to locate downloaded video for {url} in {output_dir}")

