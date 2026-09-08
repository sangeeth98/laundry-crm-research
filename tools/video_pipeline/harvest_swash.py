"""Batch harvester for Swash Laundry Software playlists."""

import time
from pathlib import Path
from rich.console import Console

from video_pipeline.cli import harvest_playlist

console = Console()

SWASH_PLAYLISTS = [
    {
        "key": "rider_app_support",
        "title": "SLS Rider App – Support",
        "url": "https://www.youtube.com/playlist?list=PLRSHLrpPJoqM",
        "out_dir": Path("data/raw/swash/rider_app_support"),
    },
    {
        "key": "software_support",
        "title": "SLS Laundry Software Support",
        "url": "https://www.youtube.com/playlist?list=PLMpJekKOJ3xo",
        "out_dir": Path("data/raw/swash/software_support"),
    },
    {
        "key": "feedback_video",
        "title": "Feedback Video",
        "url": "https://www.youtube.com/playlist?list=PLl2LT-dtKfeox_DgzixFKWKSoBt9vkmc4",
        "out_dir": Path("data/raw/swash/feedback_video"),
    },
    {
        "key": "printer_settings",
        "title": "Printer Settings",
        "url": "https://www.youtube.com/playlist?list=PLl2LT-dtKfeqHxOXLFQD5myEhlvLg_ROJ",
        "out_dir": Path("data/raw/swash/printer_settings"),
    },
    {
        "key": "latest_videos_2025",
        "title": "SLS Latest Videos (2025)",
        "url": "https://www.youtube.com/playlist?list=PLl2LT-dtKfepP0lvce_57FKakKyGLC5nP",
        "out_dir": Path("data/raw/swash/latest_videos_2025"),
    },
    {
        "key": "demo_videos_2025",
        "title": "SLS Demo Videos (2025)",
        "url": "https://www.youtube.com/playlist?list=PLl2LT-dtKfeozKJL8Aw8DPNg8qOVnlUNZ",
        "out_dir": Path("data/raw/swash/demo_videos_2025"),
    },
    {
        "key": "videos_with_audio",
        "title": "SLS Video With Audio",
        "url": "https://www.youtube.com/playlist?list=PLl2LT-dtKfeoUJ2OykGyJv59L4LmqA1tV",
        "out_dir": Path("data/raw/swash/videos_with_audio"),
    },
    {
        "key": "delivery_executive_rider",
        "title": "Delivery Executive (Rider App)",
        "url": "https://www.youtube.com/playlist?list=PLl2LT-dtKfeof7acY7GkJzH3rzBc2Zj7p",
        "out_dir": Path("data/raw/swash/delivery_executive_rider"),
    },
    {
        "key": "admin_web_panel",
        "title": "Admin (Web Panel)",
        "url": "https://www.youtube.com/playlist?list=PLl2LT-dtKfeqhxD2mesSAa7wRpngLmswx",
        "out_dir": Path("data/raw/swash/admin_web_panel"),
    },
]


def main():
    total_start = time.time()
    console.print(f"[bold cyan]Starting batch harvest across {len(SWASH_PLAYLISTS)} Swash playlists...[/bold cyan]\n")

    for idx, pl in enumerate(SWASH_PLAYLISTS, 1):
        console.rule(f"[bold green]({idx}/{len(SWASH_PLAYLISTS)}) Harvesting Swash Playlist: {pl['title']}[/bold green]")
        pl_start = time.time()
        try:
            harvest_playlist(
                url=pl["url"],
                out_dir=pl["out_dir"],
                limit=None,
                offset=0,
                workers=3,
                keep_video=False,
                sample_step=1.0,
                min_interval=2.5,
                scene_threshold=8.0,
                max_frames=25,
            )
            elapsed = time.time() - pl_start
            console.print(f"[bold green]✔ Finished {pl['title']} in {elapsed:.1f}s[/bold green]\n")
        except Exception as e:
            console.print(f"[bold red]✘ Error harvesting playlist {pl['title']}: {e}[/bold red]\n")

    total_elapsed = time.time() - total_start
    console.print(f"[bold cyan]🎉 All {len(SWASH_PLAYLISTS)} Swash playlists harvested in {total_elapsed/60:.1f} minutes![/bold cyan]")


if __name__ == "__main__":
    main()
