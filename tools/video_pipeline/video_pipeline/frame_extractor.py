"""Intelligent UI demo screenshot and keyframe extraction."""

from __future__ import annotations

import json
import math
import subprocess
from pathlib import Path
from typing import Dict, List, Optional
import cv2
import numpy as np
from pydantic import BaseModel, Field


class ExtractedFrame(BaseModel):
    index: int
    filename: str
    relative_path: str
    timestamp_seconds: float
    timestamp_formatted: str
    width: int
    height: int
    diff_score: float = 0.0
    detected_ui_type: Optional[str] = None  # e.g., "Dashboard", "Form", "Table", "Modal"


class FramesManifest(BaseModel):
    video_id: str
    total_frames_extracted: int
    video_duration_seconds: float
    video_resolution: str
    frames: List[ExtractedFrame] = Field(default_factory=list)

    def save_json(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(self.model_dump_json(indent=2))


def format_seconds(seconds: float) -> str:
    s = int(round(seconds))
    mins, secs = divmod(s, 60)
    hours, mins = divmod(mins, 60)
    if hours > 0:
        return f"{hours:02d}h{mins:02d}m{secs:02d}s"
    return f"{mins:02d}m{secs:02d}s"


def format_timestamp_clock(seconds: float) -> str:
    s = int(round(seconds))
    mins, secs = divmod(s, 60)
    hours, mins = divmod(mins, 60)
    if hours > 0:
        return f"{hours:02d}:{mins:02d}:{secs:02d}"
    return f"{mins:02d}:{secs:02d}"


def get_video_stream_info(video_path: Path) -> Dict[str, float | int]:
    """Extract accurate fps, duration, and resolution using ffprobe."""
    try:
        res = subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-select_streams",
                "v:0",
                "-show_entries",
                "stream=r_frame_rate,avg_frame_rate,width,height",
                "-show_entries",
                "format=duration",
                "-of",
                "json",
                str(video_path),
            ],
            capture_output=True,
            text=True,
            check=True,
        )
        data = json.loads(res.stdout)
        stream = data.get("streams", [{}])[0]
        fmt = data.get("format", {})

        fps_str = stream.get("avg_frame_rate") or stream.get("r_frame_rate") or "30/1"
        if "/" in fps_str:
            num, den = fps_str.split("/")
            fps = float(num) / float(den) if float(den) != 0 else 30.0
        else:
            fps = float(fps_str)

        duration = float(fmt.get("duration", 0.0))
        width = int(stream.get("width", 1280))
        height = int(stream.get("height", 720))
        return {"fps": fps, "duration": duration, "width": width, "height": height}
    except Exception:
        return {"fps": 30.0, "duration": 0.0, "width": 1280, "height": 720}


def classify_screen(gray_frame: np.ndarray) -> str:
    """Heuristic classification of CRM screen type."""
    edges = cv2.Canny(gray_frame, 50, 150)
    edge_density = float(np.mean(edges))

    # Horizontal and vertical projection profiles to detect tables / forms
    horizontal_proj = np.mean(gray_frame, axis=1)
    vertical_proj = np.mean(gray_frame, axis=0)

    h_variance = float(np.std(horizontal_proj))
    v_variance = float(np.std(vertical_proj))

    if edge_density > 22:
        return "Data Grid / Tabular Report"
    elif edge_density < 8:
        return "Dialog / Modal Overlay"
    elif h_variance > 30 and v_variance > 30:
        return "Form / Parameter Settings"
    else:
        return "Application Navigation / Dashboard"


def extract_ui_frames(
    video_path: Path,
    output_dir: Path,
    video_id: str,
    sample_step_seconds: float = 1.0,
    min_interval_seconds: float = 3.0,
    scene_threshold: float = 6.0,
    max_frames: int = 25,
) -> FramesManifest:
    """Extract representative UI screens from demo video using perceptual difference."""
    output_dir.mkdir(parents=True, exist_ok=True)
    frames_dir = output_dir / "frames"
    frames_dir.mkdir(parents=True, exist_ok=True)

    info = get_video_stream_info(video_path)
    fps = float(info["fps"])
    duration = float(info["duration"])
    width = int(info["width"])
    height = int(info["height"])
    res_str = f"{width}x{height}"

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise ValueError(f"Could not open video file {video_path}")

    step_frames = max(1, int(round(fps * sample_step_seconds)))
    min_interval_frames = int(round(fps * min_interval_seconds))

    prev_thumbnail: Optional[np.ndarray] = None
    last_saved_frame_idx = -min_interval_frames
    extracted_frames: List[ExtractedFrame] = []
    frame_count = 0
    saved_index = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_count % step_frames != 0:
            frame_count += 1
            continue

        curr_sec = frame_count / fps

        # Skip first 1.5 seconds if video is long (intro animation)
        if duration > 10 and curr_sec < 1.5:
            frame_count += 1
            continue

        # Skip final 2.5 seconds (outro branding)
        if duration > 10 and curr_sec > (duration - 2.5):
            frame_count += 1
            continue

        # Check frame brightness/variance
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        mean_val = float(np.mean(gray))
        std_val = float(np.std(gray))

        # Discard near-black or uniform blank frames
        if mean_val < 15 or std_val < 10:
            frame_count += 1
            continue

        # Create low-res thumbnail for perceptual difference comparison
        thumb = cv2.resize(gray, (320, 180), interpolation=cv2.INTER_AREA)

        diff_score = 0.0
        should_save = False

        if prev_thumbnail is None:
            # First application screen
            should_save = True
            diff_score = 100.0
        else:
            diff = cv2.absdiff(thumb, prev_thumbnail)
            diff_score = float(np.mean(diff))

            frames_since_last = frame_count - last_saved_frame_idx
            time_since_last = frames_since_last / fps

            fallback_interval = 45.0 if duration > 600 else 15.0
            # Significant visual change (new tab, modal, screen transition)
            if time_since_last >= min_interval_seconds and diff_score >= scene_threshold:
                should_save = True
            # Periodic capture during long walkthroughs on same screen (showing inputs/fields)
            elif time_since_last >= fallback_interval and diff_score >= 2.2:
                should_save = True

        if should_save:
            saved_index += 1
            ts_slug = format_seconds(curr_sec)
            ts_clock = format_timestamp_clock(curr_sec)
            filename = f"frame_{saved_index:02d}_{ts_slug}.png"
            target_path = frames_dir / filename

            # Save full resolution PNG
            cv2.imwrite(str(target_path), frame, [cv2.IMWRITE_PNG_COMPRESSION, 4])

            screen_type = classify_screen(gray)

            extracted_frames.append(
                ExtractedFrame(
                    index=saved_index,
                    filename=filename,
                    relative_path=f"frames/{filename}",
                    timestamp_seconds=round(curr_sec, 2),
                    timestamp_formatted=ts_clock,
                    width=width,
                    height=height,
                    diff_score=round(diff_score, 2),
                    detected_ui_type=screen_type,
                )
            )

            prev_thumbnail = thumb
            last_saved_frame_idx = frame_count

            if len(extracted_frames) >= max_frames:
                break

        frame_count += 1

    cap.release()

    manifest = FramesManifest(
        video_id=video_id,
        total_frames_extracted=len(extracted_frames),
        video_duration_seconds=round(duration, 2),
        video_resolution=res_str,
        frames=extracted_frames,
    )
    manifest.save_json(output_dir / "frames_manifest.json")
    return manifest

