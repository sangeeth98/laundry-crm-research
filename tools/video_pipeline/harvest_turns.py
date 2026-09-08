"""Batch harvester for Turns OS playlists."""

import time
from pathlib import Path
from rich.console import Console

from video_pipeline.cli import harvest_playlist

console = Console()

TURNS_PLAYLISTS = [
    {
        "key": "customer_feedback",
        "title": "Turns Customer Feedback & Reviews",
        "url": "https://www.youtube.com/playlist?list=PLqDSSaq9pFSOZWuDm2MDLSN3Zsj1WBjLU",
        "out_dir": Path("data/raw/turns/customer_feedback"),
    },
    {
        "key": "modern_laundromat",
        "title": "Modern Laundromat Must Have",
        "url": "https://www.youtube.com/playlist?list=PLqDSSaq9pFSOp8Xs-Q67RE2fH5UsEC6gh",
        "out_dir": Path("data/raw/turns/modern_laundromat"),
    },
    {
        "key": "pud_request",
        "title": "PUD Request (Pickup & Delivery)",
        "url": "https://www.youtube.com/playlist?list=PLqDSSaq9pFSPZz9fkdhAQVBymvYoIn2xM",
        "out_dir": Path("data/raw/turns/pud_request"),
    },
    {
        "key": "setting_up_pos",
        "title": "Setting Up Sifabso POS",
        "url": "https://www.youtube.com/playlist?list=PLqDSSaq9pFSORDVSPLlP32l7f6nQnWtlS",
        "out_dir": Path("data/raw/turns/setting_up_pos"),
    },
    {
        "key": "pos_trainer",
        "title": "SIfabso POS Trainer",
        "url": "https://www.youtube.com/playlist?list=PLqDSSaq9pFSPRcKI2xlh6AGQVUg8mT9-_",
        "out_dir": Path("data/raw/turns/pos_trainer"),
    },
]


def main():
    total_start = time.time()
    console.print(f"[bold cyan]Starting batch harvest across {len(TURNS_PLAYLISTS)} Turns OS playlists...[/bold cyan]\n")

    for idx, pl in enumerate(TURNS_PLAYLISTS, 1):
        console.rule(f"[bold green]({idx}/{len(TURNS_PLAYLISTS)}) Harvesting Turns Playlist: {pl['title']}[/bold green]")
        pl_start = time.time()
        try:
            harvest_playlist(
                url=pl["url"],
                out_dir=pl["out_dir"],
                limit=None,
                offset=0,
                workers=2,
                keep_video=False,
                sample_step=1.0,
                min_interval=2.5,
                scene_threshold=8.0,
                max_frames=30,
            )
            elapsed = time.time() - pl_start
            console.print(f"[bold green]✔ Finished {pl['title']} in {elapsed:.1f}s[/bold green]\n")
        except Exception as e:
            console.print(f"[bold red]✘ Error harvesting playlist {pl['title']}: {e}[/bold red]\n")

    total_elapsed = time.time() - total_start
    console.print(f"[bold cyan]🎉 All {len(TURNS_PLAYLISTS)} Turns OS playlists harvested in {total_elapsed/60:.1f} minutes![/bold cyan]")


if __name__ == "__main__":
    main()
