# Video UI Analysis: Masked Customer Numbers in QDC

## Release & Historical Context
- **Release Date**: 2024-12-05 (2024-Q4 (December 2024))
- **Duration**: 01:07
- **Resolution**: 1920x1080
- **Channel**: Quick Dry Cleaning Software
- **Video URL**: [https://www.youtube.com/watch?v=hgpqDHqQ4Rs](https://www.youtube.com/watch?v=hgpqDHqQ4Rs)
- **Feature Domain**: `Core Configuration & Admin`

> [!NOTE]
> **UI Temporal Relevance**: This video was released on **2024-12-05**. The captured interface reflects the software's UI architecture, styling conventions, and user workflow at that specific point in time (2024-Q4 (December 2024)).

## Feature Overview & Description
CRM Security Features:

Masked Mobile Numbers in Reports: Customer mobile numbers are now masked in reports, displaying only the last four digits.

Controlled Excel Export:

Exporting data to Excel is now governed by access rights.

Even if a user has export rights but lacks mobile masking permissions, the exported data will still display only the last four digits of mobile numbers.

Secure Customer Search: To search for a customer, the full 10-digit mobile number is required. This feature is implemented across reports and all software search functionalities, including the home page.

## UI Workflow & Screen Breakdown
Captured **9 representative screens** illustrating the end-to-end workflow:

### Screen 01 @ `00:02` — Application Navigation / Dashboard
- **Timestamp**: `00:02` (2.0s)
- **Screen Classification**: Application Navigation / Dashboard
- **Image**: `frames/frame_01_00m02s.png`

![Screen 01 @ 00:02](frames/frame_01_00m02s.png)

### Screen 02 @ `00:13` — Application Navigation / Dashboard
- **Timestamp**: `00:13` (13.0s)
- **Screen Classification**: Application Navigation / Dashboard
- **Image**: `frames/frame_02_00m13s.png`

![Screen 02 @ 00:13](frames/frame_02_00m13s.png)

### Screen 03 @ `00:16` — Dialog / Modal Overlay
- **Timestamp**: `00:16` (16.0s)
- **Screen Classification**: Dialog / Modal Overlay
- **Image**: `frames/frame_03_00m16s.png`

![Screen 03 @ 00:16](frames/frame_03_00m16s.png)

### Screen 04 @ `00:21` — Application Navigation / Dashboard
- **Timestamp**: `00:21` (21.0s)
- **Screen Classification**: Application Navigation / Dashboard
- **Image**: `frames/frame_04_00m21s.png`

![Screen 04 @ 00:21](frames/frame_04_00m21s.png)

### Screen 05 @ `00:25` — Application Navigation / Dashboard
- **Timestamp**: `00:25` (25.0s)
- **Screen Classification**: Application Navigation / Dashboard
- **Image**: `frames/frame_05_00m25s.png`

![Screen 05 @ 00:25](frames/frame_05_00m25s.png)

### Screen 06 @ `00:36` — Dialog / Modal Overlay
- **Timestamp**: `00:36` (36.0s)
- **Screen Classification**: Dialog / Modal Overlay
- **Image**: `frames/frame_06_00m36s.png`

![Screen 06 @ 00:36](frames/frame_06_00m36s.png)

### Screen 07 @ `00:39` — Application Navigation / Dashboard
- **Timestamp**: `00:39` (39.0s)
- **Screen Classification**: Application Navigation / Dashboard
- **Image**: `frames/frame_07_00m39s.png`

![Screen 07 @ 00:39](frames/frame_07_00m39s.png)

### Screen 08 @ `00:47` — Application Navigation / Dashboard
- **Timestamp**: `00:47` (47.0s)
- **Screen Classification**: Application Navigation / Dashboard
- **Image**: `frames/frame_08_00m47s.png`

![Screen 08 @ 00:47](frames/frame_08_00m47s.png)

### Screen 09 @ `01:02` — Application Navigation / Dashboard
- **Timestamp**: `01:02` (62.0s)
- **Screen Classification**: Application Navigation / Dashboard
- **Image**: `frames/frame_09_01m02s.png`

![Screen 09 @ 01:02](frames/frame_09_01m02s.png)

## Architectural & UX Observations
- **Navigation Paradigm**: Check layout patterns visible across screens (top header, left navigation drawer, breadcrumb navigation).
- **Data Entry & Controls**: Notice the input fields, validation hints, toggle switches, and modal overlays used in this workflow.
- **Business Logic Encapsulation**: Evaluates how QDC enforces business rules (e.g. validation, permission checks, automated notifications).
