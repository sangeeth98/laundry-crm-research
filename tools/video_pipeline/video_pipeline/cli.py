"""CLI interface for video pipeline."""

from __future__ import annotations

import os
import shutil
from pathlib import Path
from typing import Optional
import typer
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn

from video_pipeline.metadata import (
    extract_playlist_manifest,
    extract_video_metadata,
    PlaylistManifest,
    VideoMetadata,
)
from video_pipeline.downloader import download_high_quality_video
from video_pipeline.frame_extractor import extract_ui_frames
from video_pipeline.analyzer import generate_video_analysis, update_ui_timeline

app = typer.Typer(help="YouTube Video Harvester & UI Screen Extraction Pipeline")
console = Console()


def sanitize_filename(name: str) -> str:
    """Sanitize string for directory and file naming."""
    clean = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in name)
    return "_".join(part for part in clean.split("_") if part)[:60]


def extract_id_from_url(url: str) -> Optional[str]:
    """Extract YouTube video ID from URL or return string if already an ID."""
    url = url.strip()
    if len(url) == 11 and not any(c in url for c in "/?&=#"):
        return url
    if "v=" in url:
        return url.split("v=")[1].split("&")[0].split("#")[0]
    if "youtu.be/" in url:
        return url.split("youtu.be/")[1].split("?")[0].split("#")[0]
    return None


@app.command()
def fetch_manifest(
    url: str = typer.Option(..., "--url", "-u", help="YouTube playlist URL"),
    out_dir: Path = typer.Option(..., "--out-dir", "-o", help="Target output directory e.g. data/raw/qdc"),
    max_items: Optional[int] = typer.Option(None, "--max-items", "-m", help="Max videos to index"),
):
    """Fetch playlist metadata and create playlist_manifest.json and ui_timeline.md without downloading."""
    console.print(f"[bold cyan]Fetching playlist manifest from:[/bold cyan] {url}")
    out_dir.mkdir(parents=True, exist_ok=True)

    with console.status("[bold green]Extracting playlist entries via yt-dlp...[/bold green]"):
        manifest = extract_playlist_manifest(url, fetch_full_metadata=False, max_items=max_items)

    manifest_path = out_dir / "playlist_manifest.json"
    manifest.save_json(manifest_path)
    console.print(f"[green]✔ Saved manifest with {manifest.total_videos} videos to:[/green] {manifest_path}")

    timeline_path = update_ui_timeline(out_dir, manifest)
    console.print(f"[green]✔ Initialized UI timeline at:[/green] {timeline_path}")


@app.command()
def harvest_video(
    url: str = typer.Option(..., "--url", "-u", help="YouTube video URL or ID"),
    out_dir: Path = typer.Option(Path("data/raw/qdc"), "--out-dir", "-o", help="Target competitor directory"),
    keep_video: bool = typer.Option(False, "--keep-video/--no-keep-video", help="Keep the downloaded MP4 after extraction"),
    sample_step: float = typer.Option(1.0, "--sample-step", help="Seconds between candidate frames"),
    min_interval: float = typer.Option(2.5, "--min-interval", help="Minimum seconds between saved frames"),
    scene_threshold: float = typer.Option(8.0, "--scene-threshold", help="Frame difference threshold"),
    max_frames: int = typer.Option(25, "--max-frames", help="Max frames to extract per video"),
    update_timeline: bool = typer.Option(True, "--update-timeline/--no-update-timeline", help="Update ui_timeline.md after harvesting"),
):
    """Extract metadata, download video, extract UI screenshots, and generate analysis for a single video."""
    out_dir.mkdir(parents=True, exist_ok=True)

    # Fast skip if already harvested without making network call
    video_id_quick = extract_id_from_url(url)
    if video_id_quick:
        existing_matches = list((out_dir / "videos").glob(f"{video_id_quick}_*"))
        if existing_matches:
            vdir = existing_matches[0]
            if (vdir / "analysis.json").exists() and (vdir / "frames_manifest.json").exists() and (vdir / "frames").exists():
                if any((vdir / "frames").iterdir()):
                    console.print(f"[yellow]⏩ Video {video_id_quick} already analyzed with screenshots. Skipping.[/yellow]")
                    return

        # Check sibling directories under competitor parent to reuse analyses across playlists
        if out_dir.parent.exists():
            sibling_matches = list(out_dir.parent.glob(f"*/videos/{video_id_quick}_*"))
            for smatch in sibling_matches:
                if smatch.is_dir() and (smatch / "analysis.json").exists() and (smatch / "frames").exists() and any((smatch / "frames").iterdir()):
                    console.print(f"[green]⚡ [{video_id_quick}] Reusing existing analysis from sibling {smatch.parent.parent.name}...[/green]")
                    target_dir = out_dir / "videos" / smatch.name
                    target_dir.mkdir(parents=True, exist_ok=True)
                    shutil.copytree(smatch, target_dir, dirs_exist_ok=True)
                    return

    console.print(f"[bold cyan]Harvesting video:[/bold cyan] {url}")

    with console.status("[bold green]Extracting video metadata & release date...[/bold green]"):
        meta = extract_video_metadata(url)

    slug = sanitize_filename(f"{meta.id}_{meta.title}")
    video_dir = out_dir / "videos" / slug
    video_dir.mkdir(parents=True, exist_ok=True)

    meta.save_json(video_dir / "metadata.json")
    console.print(f"[cyan]Title:[/cyan] {meta.title}")
    console.print(f"[cyan]Release Date:[/cyan] {meta.formatted_date} ([bold yellow]{meta.release_era}[/bold yellow])")
    console.print(f"[cyan]Duration:[/cyan] {meta.duration_formatted}")

    # Double check if already harvested
    if (video_dir / "analysis.json").exists() and (video_dir / "frames_manifest.json").exists() and (video_dir / "frames").exists():
        if any((video_dir / "frames").iterdir()):
            console.print(f"[yellow]⏩ Video {meta.id} already analyzed with screenshots. Skipping download.[/yellow]")
            return

    # Temporary directory for video download if not keeping
    temp_dir = video_dir / "tmp_video"
    download_dir = video_dir if keep_video else temp_dir
    download_dir.mkdir(parents=True, exist_ok=True)

    try:
        console.print("[bold green]Downloading high-quality video...[/bold green]")
        video_file = download_high_quality_video(
            url=meta.url,
            output_dir=download_dir,
            filename_prefix=meta.id,
            keep_existing=True,
        )
        console.print(f"[green]✔ Downloaded video to:[/green] {video_file} ({video_file.stat().st_size / (1024*1024):.1f} MB)")

        console.print("[bold green]Extracting representative UI screens...[/bold green]")
        frames_manifest = extract_ui_frames(
            video_path=video_file,
            output_dir=video_dir,
            video_id=meta.id,
            sample_step_seconds=sample_step,
            min_interval_seconds=min_interval,
            scene_threshold=scene_threshold,
            max_frames=max_frames,
        )
        console.print(f"[green]✔ Extracted {frames_manifest.total_frames_extracted} UI screens into:[/green] {video_dir / 'frames'}")

        # Generate analysis
        analysis_md = generate_video_analysis(meta, frames_manifest, video_dir)
        console.print(f"[green]✔ Generated UI analysis at:[/green] {analysis_md}")
    finally:
        # Clean up temp video if not keeping
        if not keep_video and temp_dir.exists():
            shutil.rmtree(temp_dir, ignore_errors=True)
            console.print("[yellow]Cleaned up temporary video MP4 to conserve disk space.[/yellow]")

    if update_timeline:
        manifest_file = out_dir / "playlist_manifest.json"
        manifest: Optional[PlaylistManifest] = None
        if manifest_file.exists():
            try:
                with open(manifest_file, "r", encoding="utf-8") as f:
                    manifest = PlaylistManifest.model_validate_json(f.read())
            except Exception:
                pass
        update_ui_timeline(out_dir, manifest)

    console.print(f"[bold green]✔ Successfully completed harvesting for {meta.id}![/bold green]\n")


@app.command()
def harvest_playlist(
    url: str = typer.Option(..., "--url", "-u", help="YouTube playlist URL"),
    out_dir: Path = typer.Option(Path("data/raw/qdc"), "--out-dir", "-o", help="Target competitor directory"),
    limit: Optional[int] = typer.Option(None, "--limit", "-l", help="Number of videos to process (default: all)"),
    offset: int = typer.Option(0, "--offset", help="Starting offset in playlist (default: 0)"),
    workers: int = typer.Option(3, "--workers", "-w", help="Concurrent worker threads for downloading & extraction"),
    keep_video: bool = typer.Option(False, "--keep-video/--no-keep-video", help="Keep downloaded MP4s"),
    sample_step: float = typer.Option(1.0, "--sample-step", help="Seconds between candidate frames"),
    min_interval: float = typer.Option(2.5, "--min-interval", help="Minimum seconds between saved frames"),
    scene_threshold: float = typer.Option(8.0, "--scene-threshold", help="Frame difference threshold"),
    max_frames: int = typer.Option(25, "--max-frames", help="Max frames to extract per video"),
):
    """Harvest multiple videos from a playlist with configurable limit, offset, and concurrency."""
    import concurrent.futures

    console.print(f"[bold cyan]Processing playlist:[/bold cyan] {url}")
    out_dir.mkdir(parents=True, exist_ok=True)

    with console.status("[bold green]Extracting playlist entries...[/bold green]"):
        manifest = extract_playlist_manifest(url, fetch_full_metadata=False)

    manifest_path = out_dir / "playlist_manifest.json"
    manifest.save_json(manifest_path)
    console.print(f"[green]✔ Total videos in playlist:[/green] {manifest.total_videos}")

    selected_entries = manifest.entries[offset:]
    if limit is not None:
        selected_entries = selected_entries[:limit]

    console.print(
        f"[bold yellow]Beginning harvest for {len(selected_entries)} videos "
        f"(offset {offset}, limit {limit or 'all'}, workers {workers})...[/bold yellow]\n"
    )

    def _process_single(entry_with_idx):
        idx, entry = entry_with_idx
        # Fast check if already analyzed
        existing_matches = list((out_dir / "videos").glob(f"{entry.id}_*"))
        if existing_matches:
            vdir = existing_matches[0]
            if (vdir / "analysis.json").exists() and (vdir / "frames_manifest.json").exists() and (vdir / "frames").exists():
                if any((vdir / "frames").iterdir()):
                    console.print(f"[yellow]⏩ [{idx}/{len(selected_entries)}] Video {entry.id} ({entry.title}) already analyzed. Skipping.[/yellow]")
                    return entry.id, True, None

        # Check sibling directories under competitor parent
        if out_dir.parent.exists():
            sibling_matches = list(out_dir.parent.glob(f"*/videos/{entry.id}_*"))
            for smatch in sibling_matches:
                if smatch.is_dir() and (smatch / "analysis.json").exists() and (smatch / "frames").exists() and any((smatch / "frames").iterdir()):
                    console.print(f"[green]⚡ [{idx}/{len(selected_entries)}] Reusing analysis for {entry.id} from sibling {smatch.parent.parent.name}...[/green]")
                    target_dir = out_dir / "videos" / smatch.name
                    target_dir.mkdir(parents=True, exist_ok=True)
                    shutil.copytree(smatch, target_dir, dirs_exist_ok=True)
                    return entry.id, True, None

        console.print(f"[bold magenta]=== [{idx}/{len(selected_entries)}] Processing: {entry.title} ({entry.id}) ===[/bold magenta]")
        try:
            harvest_video(
                url=entry.url,
                out_dir=out_dir,
                keep_video=keep_video,
                sample_step=sample_step,
                min_interval=min_interval,
                scene_threshold=scene_threshold,
                max_frames=max_frames,
                update_timeline=False,
            )
            return entry.id, True, None
        except Exception as e:
            console.print(f"[bold red]✘ Failed to harvest video {entry.id}: {e}[/bold red]")
            return entry.id, False, str(e)

    entries_with_indices = list(enumerate(selected_entries, start=1))

    if workers <= 1:
        for item in entries_with_indices:
            _process_single(item)
    else:
        with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
            list(executor.map(_process_single, entries_with_indices))

    # Rebuild complete timeline at the end of batch
    update_ui_timeline(out_dir, manifest)
    console.print("[bold green]✔ Playlist batch harvesting finished and UI timeline updated successfully![/bold green]")


@app.command()
def refresh_timeline(
    out_dir: Path = typer.Option(Path("data/raw/qdc"), "--out-dir", "-o", help="Target competitor directory"),
):
    """Rebuild ui_timeline.md from existing video analysis files."""
    manifest_file = out_dir / "playlist_manifest.json"
    manifest: Optional[PlaylistManifest] = None
    if manifest_file.exists():
        try:
            with open(manifest_file, "r", encoding="utf-8") as f:
                manifest = PlaylistManifest.model_validate_json(f.read())
        except Exception:
            pass

    timeline_path = update_ui_timeline(out_dir, manifest)
    console.print(f"[green]✔ Refreshed UI timeline at:[/green] {timeline_path}")


if __name__ == "__main__":
    app()

