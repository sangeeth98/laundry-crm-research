"""Batch harvester for all requested QDC playlists."""

import time
from pathlib import Path
from rich.console import Console

from video_pipeline.cli import harvest_playlist

console = Console()

PLAYLISTS = [
    {
        "key": "mpos_rider",
        "title": "QDC MPOS Rider App",
        "url": "https://www.youtube.com/playlist?list=PLEHcmgrc1fgw",
        "out_dir": Path("data/raw/qdc/mpos_rider"),
    },
    {
        "key": "client_reviews",
        "title": "Clients Reviews",
        "url": "https://www.youtube.com/playlist?list=PLJhh9iRAkgRZn84GFaAWbFPWLIfjYMpdI",
        "out_dir": Path("data/raw/qdc/client_reviews"),
    },
    {
        "key": "referrals",
        "title": "Referrals",
        "url": "https://www.youtube.com/playlist?list=PLJhh9iRAkgRbvvo1lVTu5be-vJu-QfheT",
        "out_dir": Path("data/raw/qdc/referrals"),
    },
    {
        "key": "on_demand_app",
        "title": "On Demand App",
        "url": "https://www.youtube.com/playlist?list=PLJhh9iRAkgRY_Ex8P3T4Uva8hJQM-Hj9M",
        "out_dir": Path("data/raw/qdc/on_demand_app"),
    },
    {
        "key": "attendance_management",
        "title": "Attendance Management & Salary/Payout",
        "url": "https://www.youtube.com/playlist?list=PLJhh9iRAkgRZtebKdkSbU03u3SnaHQIHn",
        "out_dir": Path("data/raw/qdc/attendance_management"),
    },
    {
        "key": "coupons",
        "title": "Coupons",
        "url": "https://www.youtube.com/playlist?list=PLJhh9iRAkgRbBzDGxKUVrWj0NRsu0f3bI",
        "out_dir": Path("data/raw/qdc/coupons"),
    },
    {
        "key": "schedule_pickups",
        "title": "Website - Schedule Pickup",
        "url": "https://www.youtube.com/playlist?list=PLJhh9iRAkgRbdC7N1SpbYSML10Wk93zqP",
        "out_dir": Path("data/raw/qdc/schedule_pickups"),
    },
    {
        "key": "qdc_101",
        "title": "QDC 101",
        "url": "https://www.youtube.com/playlist?list=PLJhh9iRAkgRZJaiLna2VImF1i861GED2a",
        "out_dir": Path("data/raw/qdc/qdc_101"),
    },
]


def main():
    total_start = time.time()
    console.print(f"[bold cyan]Starting batch harvest across {len(PLAYLISTS)} playlists...[/bold cyan]\n")

    for idx, pl in enumerate(PLAYLISTS, 1):
        console.rule(f"[bold green]({idx}/{len(PLAYLISTS)}) Harvesting Playlist: {pl['title']}[/bold green]")
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
                max_frames=25,
            )
            elapsed = time.time() - pl_start
            console.print(f"[bold green]✔ Finished {pl['title']} in {elapsed:.1f}s[/bold green]\n")
        except Exception as e:
            console.print(f"[bold red]✘ Error harvesting playlist {pl['title']}: {e}[/bold red]\n")

    total_elapsed = time.time() - total_start
    console.print(f"[bold cyan]🎉 All {len(PLAYLISTS)} playlists harvested in {total_elapsed/60:.1f} minutes![/bold cyan]")


if __name__ == "__main__":
    main()
