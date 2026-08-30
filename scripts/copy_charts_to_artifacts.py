import shutil
from pathlib import Path

SRC = Path("data/charts")
DST = Path(r"C:\Users\sangeeth\.gemini\antigravity-ide\brain\ac4285e0-1dde-4e9d-8ba2-ef9701ad112c")
DST.mkdir(parents=True, exist_ok=True)

for chart in SRC.glob("*.png"):
    shutil.copy(chart, DST / chart.name)
    print(f"Copied {chart.name} to artifacts directory")
