"""Metadata extraction and normalization for YouTube videos and playlists."""

from __future__ import annotations

import datetime
import json
from pathlib import Path
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import yt_dlp


class VideoMetadata(BaseModel):
    id: str
    title: str
    url: str
    upload_date: Optional[str] = None  # YYYYMMDD
    formatted_date: Optional[str] = None  # YYYY-MM-DD
    timestamp: Optional[int] = None
    iso_timestamp: Optional[str] = None  # ISO-8601 UTC
    release_era: Optional[str] = None  # e.g. "2020-Q4", "November 2020"
    duration_seconds: Optional[int] = None
    duration_formatted: Optional[str] = None
    channel: Optional[str] = None
    channel_url: Optional[str] = None
    view_count: Optional[int] = None
    resolution: Optional[str] = None
    description: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    playlist_id: Optional[str] = None
    playlist_title: Optional[str] = None
    playlist_index: Optional[int] = None

    def save_json(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(self.model_dump_json(indent=2))


class PlaylistManifest(BaseModel):
    playlist_id: str
    playlist_title: str
    playlist_url: str
    channel: Optional[str] = None
    total_videos: int
    extracted_at: str
    entries: List[VideoMetadata] = Field(default_factory=list)

    def save_json(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(self.model_dump_json(indent=2))


def format_upload_date(raw_date: Optional[str], timestamp: Optional[int] = None) -> tuple[Optional[str], Optional[str], Optional[str]]:
    """Convert raw upload_date (YYYYMMDD) or unix timestamp into:
    (formatted_date YYYY-MM-DD, release_era e.g. 2020-Q4, iso_timestamp)
    """
    dt: Optional[datetime.datetime] = None
    if timestamp:
        try:
            dt = datetime.datetime.fromtimestamp(timestamp, tz=datetime.timezone.utc)
        except Exception:
            pass

    if not dt and raw_date and len(raw_date) == 8:
        try:
            dt = datetime.datetime.strptime(raw_date, "%Y%m%d").replace(tzinfo=datetime.timezone.utc)
        except Exception:
            pass

    if not dt:
        return None, None, None

    formatted_date = dt.strftime("%Y-%m-%d")
    iso_timestamp = dt.isoformat()
    quarter = (dt.month - 1) // 3 + 1
    era = f"{dt.year}-Q{quarter} ({dt.strftime('%B %Y')})"

    return formatted_date, era, iso_timestamp


def format_duration(seconds: Optional[float | int]) -> Optional[str]:
    """Format duration in seconds to MM:SS or HH:MM:SS."""
    if seconds is None:
        return None
    s = int(seconds)
    hours, remainder = divmod(s, 3600)
    minutes, secs = divmod(remainder, 60)
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


def get_ydl_options(quiet: bool = True, extra: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    opts: Dict[str, Any] = {
        "quiet": quiet,
        "no_warnings": quiet,
        "js_runtimes": {"node": {}},
        "retries": 10,
        "extractor_retries": 5,
        "socket_timeout": 30,
    }
    if extra:
        opts.update(extra)
    return opts


def extract_video_metadata(url_or_id: str, playlist_info: Optional[Dict[str, Any]] = None) -> VideoMetadata:
    """Extract complete metadata for a single video."""
    import time
    url = url_or_id if url_or_id.startswith("http") else f"https://www.youtube.com/watch?v={url_or_id}"
    opts = get_ydl_options(quiet=True)
    
    info = None
    for attempt in range(1, 4):
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=False)
            break
        except Exception as e:
            if attempt == 3:
                raise
            time.sleep(2 * attempt)
    assert info is not None

    raw_date = info.get("upload_date")
    timestamp = info.get("timestamp")
    formatted_date, era, iso_ts = format_upload_date(raw_date, timestamp)
    duration_s = info.get("duration")

    meta = VideoMetadata(
        id=info.get("id", ""),
        title=info.get("title", "Untitled"),
        url=info.get("webpage_url", url),
        upload_date=raw_date,
        formatted_date=formatted_date,
        timestamp=timestamp,
        iso_timestamp=iso_ts,
        release_era=era,
        duration_seconds=duration_s,
        duration_formatted=format_duration(duration_s),
        channel=info.get("channel") or info.get("uploader"),
        channel_url=info.get("channel_url") or info.get("uploader_url"),
        view_count=info.get("view_count"),
        resolution=info.get("resolution") or (f"{info.get('width')}x{info.get('height')}" if info.get('width') else None),
        description=info.get("description"),
        tags=info.get("tags") or [],
        playlist_id=playlist_info.get("id") if playlist_info else info.get("playlist_id"),
        playlist_title=playlist_info.get("title") if playlist_info else info.get("playlist_title"),
        playlist_index=playlist_info.get("index") if playlist_info else info.get("playlist_index"),
    )
    return meta


def extract_playlist_manifest(
    playlist_url: str,
    fetch_full_metadata: bool = False,
    max_items: Optional[int] = None,
) -> PlaylistManifest:
    """Extract all video entries and metadata from a playlist."""
    opts = get_ydl_options(quiet=True, extra={"extract_flat": not fetch_full_metadata})
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(playlist_url, download=False)

    playlist_id = info.get("id", "")
    playlist_title = info.get("title", "Unknown Playlist")
    channel = info.get("channel") or info.get("uploader")
    entries_raw = info.get("entries") or []

    if max_items:
        entries_raw = entries_raw[:max_items]

    entries: List[VideoMetadata] = []
    for idx, entry in enumerate(entries_raw, start=1):
        if not entry:
            continue
        v_id = entry.get("id")
        v_title = entry.get("title") or f"Video {idx}"
        v_url = entry.get("url") or f"https://www.youtube.com/watch?v={v_id}"
        duration_s = entry.get("duration")

        raw_date = entry.get("upload_date")
        timestamp = entry.get("timestamp")
        formatted_date, era, iso_ts = format_upload_date(raw_date, timestamp)

        meta = VideoMetadata(
            id=v_id,
            title=v_title,
            url=v_url if v_url.startswith("http") else f"https://www.youtube.com/watch?v={v_id}",
            upload_date=raw_date,
            formatted_date=formatted_date,
            timestamp=timestamp,
            iso_timestamp=iso_ts,
            release_era=era,
            duration_seconds=duration_s,
            duration_formatted=format_duration(duration_s),
            channel=channel,
            playlist_id=playlist_id,
            playlist_title=playlist_title,
            playlist_index=idx,
            description=entry.get("description"),
            view_count=entry.get("view_count"),
        )
        entries.append(meta)

    return PlaylistManifest(
        playlist_id=playlist_id,
        playlist_title=playlist_title,
        playlist_url=playlist_url,
        channel=channel,
        total_videos=len(entries),
        extracted_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        entries=entries,
    )

