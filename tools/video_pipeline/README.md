# Video Pipeline Subproject

A high-performance YouTube video harvester, frame extractor, and UI timeline analysis tool built for competitive CRM and software research.

## Features
- **Temporal UI Analysis**: Automatically extracts video upload dates, ISO timestamps, and categorizes features into UI eras (e.g. `2020-Q4`, `2023-Q2`).
- **High-Quality Video Harvester**: Leverages `yt-dlp` with Node.js runtime and FFmpeg to fetch highest resolution streams (1080p/720p).
- **Perceptual UI Screen Extraction**: Smart OpenCV-based scene difference detection captures representative software screens, forms, modals, and reports while filtering out duplicates and static frames.
- **Structured Research Artifacts**: For every video, generates:
  - `metadata.json`: Complete YouTube metadata and release information.
  - `frames/`: Full-resolution PNG screenshots with timestamp filenames.
  - `frames_manifest.json`: Index of screenshots with exact second marks and UI classifications.
  - `analysis.md`: Detailed markdown review of workflows, features, and UI screens.
- **Chronological Timeline Generator**: Synthesizes a playlist-wide `ui_timeline.md` tracking the evolution of features and screens across years.

## Installation & Setup

Managed via `uv`:
```bash
cd tools/video_pipeline
uv sync
```

## Usage

You can run commands directly using `uv run --project tools/video_pipeline video-pipeline <command>` from the repository root:

### 1. Index Playlist Manifest (Instant metadata indexing for 100+ videos)
```bash
uv run --project tools/video_pipeline video-pipeline fetch-manifest \
  --url "https://www.youtube.com/playlist?list=PLJhh9iRAkgRZJ133lE4K-jgeKBNJAuLiJ" \
  --out-dir "data/raw/qdc"
```

### 2. Harvest Single Video (Download + Screenshot Extraction + Analysis)
```bash
uv run --project tools/video_pipeline video-pipeline harvest-video \
  --url "https://www.youtube.com/watch?v=oKIHjtb2dPw" \
  --out-dir "data/raw/qdc" \
  --no-keep-video
```

### 3. Harvest Batch from Playlist
```bash
uv run --project tools/video_pipeline video-pipeline harvest-playlist \
  --url "https://www.youtube.com/playlist?list=PLJhh9iRAkgRZJ133lE4K-jgeKBNJAuLiJ" \
  --out-dir "data/raw/qdc" \
  --limit 5 \
  --offset 0
```

### 4. Refresh Chronological UI Timeline
```bash
uv run --project tools/video_pipeline video-pipeline refresh-timeline \
  --out-dir "data/raw/qdc"
```

