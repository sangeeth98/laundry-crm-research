---
type: Attested Computation
title: Indian Organized Laundry Store Footprint Share
description: Sanctioned computation to calculate the store footprint share percentage of top laundry brands in India.
status: stable
runtime: python
parameters:
  - { name: target_company, type: string, required: true }
executor:
  resource: references/skills/calculate_share.py
  receipt: [total_stores, company_stores, share_percentage]
attester:
  resource: references/attesters/verify_share.py
generated:
  by: reference_agent/gemini-3.6-flash
  at: 2026-08-22T21:54:00Z
verified:
  by: human:sangeeth
  at: 2026-08-22T21:54:00Z
sources:
  - id: market-data
    resource: data/market_players.json
    title: Indian Laundry Market Players Dataset
---

# Computation

```python
import json

with open("data/market_players.json", "r") as f:
    players = json.load(f)

total_stores = sum(p["store_count"] for p in players)
company = next(p for p in players if p["company"].lower() == target_company.lower())

share_pct = (company["store_count"] / total_stores) * 100.0
print(f"{company['company']} Store Share: {share_pct:.2f}% ({company['store_count']}/{total_stores})")
```

Computes store share percentage directly against the verified dataset.[^market-data]

[^market-data]: Indian Laundry Market Players Dataset
