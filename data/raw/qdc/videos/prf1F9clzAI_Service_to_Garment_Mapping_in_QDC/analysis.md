# Video UI Analysis: Service to Garment Mapping in QDC

## Release & Historical Context
- **Release Date**: 2024-12-06 (2024-Q4 (December 2024))
- **Duration**: 01:00
- **Resolution**: 1920x1008
- **Channel**: Quick Dry Cleaning Software
- **Video URL**: [https://www.youtube.com/watch?v=prf1F9clzAI](https://www.youtube.com/watch?v=prf1F9clzAI)
- **Feature Domain**: `Billing, Pricing & Payments`

> [!NOTE]
> **UI Temporal Relevance**: This video was released on **2024-12-06**. The captured interface reflects the software's UI architecture, styling conventions, and user workflow at that specific point in time (2024-Q4 (December 2024)).

## Feature Overview & Description
We’ve introduced a smart Service-to-Garment Mapping feature to streamline the Order Screen display. This ensures that only relevant garments are shown based on the selected service, making the process faster and more efficient.
How It Works:
* For each service, only garments with a price assigned will appear on the Order Screen.
* For example, if you offer Shoe Cleaning as a service, you only need to set prices for shoes. The Order Screen will then display only shoe-related options, hiding all unrelated garments.
* This feature applies to all services, helping to declutter the interface and ensure a more focused workflow.

## UI Workflow & Screen Breakdown
Captured **8 representative screens** illustrating the end-to-end workflow:

### Screen 01 @ `00:02` — Application Navigation / Dashboard
- **Timestamp**: `00:02` (2.0s)
- **Screen Classification**: Application Navigation / Dashboard
- **Image**: `frames/frame_01_00m02s.png`

![Screen 01 @ 00:02](frames/frame_01_00m02s.png)

### Screen 02 @ `00:24` — Application Navigation / Dashboard
- **Timestamp**: `00:24` (24.0s)
- **Screen Classification**: Application Navigation / Dashboard
- **Image**: `frames/frame_02_00m24s.png`

![Screen 02 @ 00:24](frames/frame_02_00m24s.png)

### Screen 03 @ `00:30` — Dialog / Modal Overlay
- **Timestamp**: `00:30` (30.0s)
- **Screen Classification**: Dialog / Modal Overlay
- **Image**: `frames/frame_03_00m30s.png`

![Screen 03 @ 00:30](frames/frame_03_00m30s.png)

### Screen 04 @ `00:33` — Application Navigation / Dashboard
- **Timestamp**: `00:33` (33.0s)
- **Screen Classification**: Application Navigation / Dashboard
- **Image**: `frames/frame_04_00m33s.png`

![Screen 04 @ 00:33](frames/frame_04_00m33s.png)

### Screen 05 @ `00:37` — Application Navigation / Dashboard
- **Timestamp**: `00:37` (37.0s)
- **Screen Classification**: Application Navigation / Dashboard
- **Image**: `frames/frame_05_00m37s.png`

![Screen 05 @ 00:37](frames/frame_05_00m37s.png)

### Screen 06 @ `00:40` — Application Navigation / Dashboard
- **Timestamp**: `00:40` (40.0s)
- **Screen Classification**: Application Navigation / Dashboard
- **Image**: `frames/frame_06_00m40s.png`

![Screen 06 @ 00:40](frames/frame_06_00m40s.png)

### Screen 07 @ `00:44` — Application Navigation / Dashboard
- **Timestamp**: `00:44` (44.0s)
- **Screen Classification**: Application Navigation / Dashboard
- **Image**: `frames/frame_07_00m44s.png`

![Screen 07 @ 00:44](frames/frame_07_00m44s.png)

### Screen 08 @ `00:47` — Dialog / Modal Overlay
- **Timestamp**: `00:47` (47.0s)
- **Screen Classification**: Dialog / Modal Overlay
- **Image**: `frames/frame_08_00m47s.png`

![Screen 08 @ 00:47](frames/frame_08_00m47s.png)

## Architectural & UX Observations
- **Navigation Paradigm**: Check layout patterns visible across screens (top header, left navigation drawer, breadcrumb navigation).
- **Data Entry & Controls**: Notice the input fields, validation hints, toggle switches, and modal overlays used in this workflow.
- **Business Logic Encapsulation**: Evaluates how QDC enforces business rules (e.g. validation, permission checks, automated notifications).
