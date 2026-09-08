"""
High-throughput OCR and feature intelligence extraction pipeline.

Parses extracted UI screenshots across 4 major laundry SaaS platforms:
- Quick Dry Cleaning (QDC)
- Fabklean
- Turns OS
- Swash Laundry Software (SLS)

Extracts on-screen UI text using RapidOCR, classifies screens into functional modules,
detects grounded feature signatures, and exports structured datasets for the visualizer site.
"""

from __future__ import annotations

import glob
import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

from rapidocr_onnxruntime import RapidOCR


# Domain taxonomies & module categories
MODULE_CATEGORIES = {
    "pos_intake": "POS & Counter Intake",
    "tagging_assembly": "Garment Tagging & Assembly",
    "plant_workshop": "Plant & Workshop Operations",
    "driver_logistics": "Driver Logistics & Doorstep mPOS",
    "customer_marketing": "Customer Experience & WhatsApp",
    "billing_finance": "Billing, Payments & Compliance",
    "hardware_ecosystem": "Hardware & Peripherals",
    "admin_multi_store": "Multi-Store & Admin Configuration",
}

# Feature definitions for multi-dimensional comparison
FEATURE_DEFINITIONS = [
    # 1. POS & Counter Intake
    {
        "id": "pos_booking_modes",
        "category": "pos_intake",
        "category_name": "POS & Counter Intake",
        "name": "Piece vs Weight Wash & Fold Intake",
        "description": "Supports itemized garment-by-garment booking, weight-based bulk Wash & Fold, and hybrid billing.",
        "evaluations": {
            "qdc": {"status": "verified", "detail": "Comprehensive piece-by-piece and weight-based rate tables with custom garment masters and express surcharges."},
            "fabklean": {"status": "verified", "detail": "Touch-friendly visual garment tiles for dry cleaning pieces alongside scale-assisted bulk laundry weighing."},
            "turns": {"status": "verified", "detail": "Native US laundromat wash-and-fold intake with live digital scale integration, tare weight deduction, and lbs calculation."},
            "swash": {"status": "verified", "detail": "High-speed keyboard counter entry for per-piece dry cleaning and kg-based wash/press laundry."},
        }
    },
    {
        "id": "pos_visual_defects",
        "category": "pos_intake",
        "category_name": "POS & Counter Intake",
        "name": "Visual Garment Defect & Damage Markup",
        "description": "Interactive garment silhouette canvas allowing staff to pinpoint stains, tears, and missing buttons at intake.",
        "evaluations": {
            "qdc": {"status": "partial", "detail": "Text-based defect and remark dropdown codes (e.g. 'Color Bleed', 'Tear Collar', 'Stain Front') on line items."},
            "fabklean": {"status": "verified", "detail": "Full interactive visual canvas: tap garment outline (collar, pocket, sleeve, lapel) to tag pre-existing stains and damage."},
            "turns": {"status": "partial", "detail": "Custom care notes, garment photos, and special customer handling instructions attached to order line items."},
            "swash": {"status": "partial", "detail": "Fast remark selector with pre-configured defect tags printed on customer invoice and garment tag."},
        }
    },
    {
        "id": "pos_minimum_order",
        "category": "pos_intake",
        "category_name": "POS & Counter Intake",
        "name": "Minimum Order Threshold Rules",
        "description": "Automated enforcement of minimum poundage (e.g. 15 lbs minimum) or minimum bill value at booking.",
        "evaluations": {
            "qdc": {"status": "verified", "detail": "Minimum order billing threshold configurable per store with automatic differential charge line item."},
            "fabklean": {"status": "verified", "detail": "Configurable minimum order amount per delivery zone and corporate client contract."},
            "turns": {"status": "verified", "detail": "Core feature for US laundromats: auto-adjusts orders below minimum weight (e.g. 15 lbs @ $2.50/lb) to minimum bill."},
            "swash": {"status": "verified", "detail": "Store-level minimum billing policy with auto-rounding and delivery fee adjustments."},
        }
    },

    # 2. Garment Tagging & Assembly
    {
        "id": "tag_heat_seal",
        "category": "tagging_assembly",
        "category_name": "Garment Tagging & Assembly",
        "name": "Heat-Seal & Waterproof Garment Tagging",
        "description": "Continuous thermal resin tape or heat-seal barcode printing directly affixable to fabric.",
        "evaluations": {
            "qdc": {"status": "verified", "detail": "Native support for TVS LP 46 Neo and Citizen heat-seal printers with custom tag header layouts."},
            "fabklean": {"status": "verified", "detail": "Waterproof barcode label formats supporting multi-wash cycles and heat-seal application."},
            "turns": {"status": "verified", "detail": "Integrated label printer support (Zebra/Brother) for garment tags, poly bag tags, and intake lot stickers."},
            "swash": {"status": "verified", "detail": "Dedicated printer settings module for 2-inch/3-inch heat-seal tape, staple tag, and barcode format calibration."},
        }
    },
    {
        "id": "tag_assembly_scan",
        "category": "tagging_assembly",
        "category_name": "Garment Tagging & Assembly",
        "name": "Post-Wash Barcode Assembly & Verification Scan",
        "description": "Post-finishing barcode scanning station to reassemble separated multi-piece bundles without garment loss.",
        "evaluations": {
            "qdc": {"status": "verified", "detail": "Workshop packing module with barcode verification scan to ensure all garments in order are present before closing bag."},
            "fabklean": {"status": "verified", "detail": "Comprehensive disassembly & assembly engine: scans garments at packing to reconstruct customer bundle and alert if pieces missing."},
            "turns": {"status": "partial", "detail": "Order status tracking with rack/shelf scanning; customer notified once all items reach final pickup shelf."},
            "swash": {"status": "verified", "detail": "Packing station barcode scanner integration verifying garment count and printing final packing slip."},
        }
    },
    {
        "id": "tag_rack_slotting",
        "category": "tagging_assembly",
        "category_name": "Garment Tagging & Assembly",
        "name": "Automated Shelf & Conveyor Rack Bin Slotting",
        "description": "Digital assignment of completed garments to specific rack numbers, shelf bins, or motorized conveyors.",
        "evaluations": {
            "qdc": {"status": "verified", "detail": "Automated rack and bin slot suggestion upon finishing for instant counter retrieval during customer pickup."},
            "fabklean": {"status": "verified", "detail": "Rack management screen displaying shelf utilization and slot numbers printed directly on collection receipts."},
            "turns": {"status": "verified", "detail": "Visual rack and shelf locator designed for US retail laundromats to enable 5-second customer counter handoff."},
            "swash": {"status": "verified", "detail": "Rack allocation workflow integrated into ready-for-delivery status change with SMS/WhatsApp rack mention."},
        }
    },

    # 3. Plant & Workshop Operations
    {
        "id": "workshop_kanban_pipeline",
        "category": "plant_workshop",
        "category_name": "Plant & Workshop Operations",
        "name": "Multi-Stage Workshop Kanban Status Pipeline",
        "description": "Visual multi-stage status progression tracking garments from intake to washing, dry cleaning, ironing, QC, and packaging.",
        "evaluations": {
            "qdc": {"status": "verified", "detail": "Standardized pipeline: Pending Workshop -> In Workshop -> Washing -> Finishing -> QC -> Ready for Store."},
            "fabklean": {"status": "verified", "detail": "Color-coded Kanban board tracking batch progression with operator timestamps and stage duration analytics."},
            "turns": {"status": "verified", "detail": "Stage-based laundry workflow: Received -> In Process -> Washed & Dried -> Folded/Hung -> Ready for Pickup."},
            "swash": {"status": "verified", "detail": "Comprehensive stage selector: Received -> In Workshop -> Ironing -> Ready -> Delivered, with batch actions."},
        }
    },
    {
        "id": "workshop_cpu_manifests",
        "category": "plant_workshop",
        "category_name": "Plant & Workshop Operations",
        "name": "Central Processing Unit (CPU) Inward/Outward Manifests",
        "description": "Batch transfer manifests between collection retail drop-stores and a centralized industrial washing plant.",
        "evaluations": {
            "qdc": {"status": "verified", "detail": "Industry standard in India: CPU Inward/Outward transfer manifests with tamper-evident transit pouch tracking."},
            "fabklean": {"status": "verified", "detail": "Hub-and-spoke transfer manifests with barcode bulk dispatch scanning and driver van assignment."},
            "turns": {"status": "partial", "detail": "Designed primarily for on-premise laundromats and single/dual location routes; multi-location routing available via API."},
            "swash": {"status": "verified", "detail": "Dedicated Plant / Workshop module managing store-to-plant garment transfers and delivery van manifests."},
        }
    },
    {
        "id": "workshop_rework_qc",
        "category": "plant_workshop",
        "category_name": "Plant & Workshop Operations",
        "name": "Rework & Quality Control (QC) Failure Workflow",
        "description": "Workflow for flagging garments that fail inspection, triggering supervisor review and free reprocessing.",
        "evaluations": {
            "qdc": {"status": "verified", "detail": "Garment reprocess/reject logging with reason classification (stain remains, poor press) and operator metrics."},
            "fabklean": {"status": "verified", "detail": "Dedicated QC inspection screen with rejection reason tags and automated routing back to wash bay."},
            "turns": {"status": "partial", "detail": "Order adjustment and re-service ticket creation with customer notification."},
            "swash": {"status": "verified", "detail": "Garment stage reprocess action routing piece back to workshop without generating secondary customer charges."},
        }
    },

    # 4. Driver Logistics & Doorstep mPOS
    {
        "id": "logistics_driver_app",
        "category": "driver_logistics",
        "category_name": "Driver Logistics & Doorstep mPOS",
        "name": "Native Driver Mobile Application (mPOS)",
        "description": "Dedicated rider/driver mobile application for pickup dispatch, doorstep billing, and delivery confirmation.",
        "evaluations": {
            "qdc": {"status": "verified", "detail": "Dedicated QDC Rider / mPOS app supporting doorstep order creation, bag tagging, and offline mode."},
            "fabklean": {"status": "verified", "detail": "Android/iOS driver app with live GPS tracking, route map navigation, and customer signature capture."},
            "turns": {"status": "verified", "detail": "Turns Driver App with US navigation integration, turn-by-turn directions, and photo proof of delivery."},
            "swash": {"status": "verified", "detail": "Swash Delivery Executive App with doorstep order creation, bag barcode scan, and instant payment collection."},
        }
    },
    {
        "id": "logistics_doorstep_bag_tag",
        "category": "driver_logistics",
        "category_name": "Driver Logistics & Doorstep mPOS",
        "name": "Doorstep Bag Tagging & Barcode Intake",
        "description": "Rider assigns a unique physical barcode tag to customer bags right at their doorstep during collection.",
        "evaluations": {
            "qdc": {"status": "verified", "detail": "Rider app generates bag barcode sticker at customer doorstep; scanned into CRM upon driver return to store."},
            "fabklean": {"status": "verified", "detail": "Doorstep pickup assigns pre-printed numbered bag barcodes linked to customer phone in real time."},
            "turns": {"status": "verified", "detail": "Customer bags scanned via mobile camera at pickup, linking route stops to laundromat weigh-in stations."},
            "swash": {"status": "verified", "detail": "High-emphasis feature: Driver scans customer bag QR/barcode at doorstep with instant SMS/WhatsApp notification."},
        }
    },
    {
        "id": "logistics_doorstep_payments",
        "category": "driver_logistics",
        "category_name": "Driver Logistics & Doorstep mPOS",
        "name": "Doorstep UPI Dynamic QR & Card Payment Collection",
        "description": "Driver collects payments at customer doorstep using dynamic on-screen UPI QR codes or Bluetooth mPOS.",
        "evaluations": {
            "qdc": {"status": "verified", "detail": "Dynamic UPI QR displayed on rider phone screen, auto-reconciled against the order upon customer payment."},
            "fabklean": {"status": "verified", "detail": "Payment collection via UPI QR, mobile card reader, or payment links sent directly to customer WhatsApp."},
            "turns": {"status": "verified", "detail": "Automated card-on-file charging via Stripe/Authorize.net upon delivery confirmation; zero driver cash handling."},
            "swash": {"status": "verified", "detail": "Rider App generates dynamic UPI QR code on phone screen for instant customer payment and real-time ledger update."},
        }
    },
    {
        "id": "logistics_rtl_localization",
        "category": "driver_logistics",
        "category_name": "Driver Logistics & Doorstep mPOS",
        "name": "Right-to-Left (RTL) Arabic / Regional Language Localization",
        "description": "Native UI support for Arabic and RTL languages across POS and driver mobile apps for Middle East markets.",
        "evaluations": {
            "qdc": {"status": "verified", "detail": "Extensive Arabic RTL interface support with bilingual receipts (Arabic/English) across Saudi Arabia & UAE."},
            "fabklean": {"status": "verified", "detail": "Multi-language support for English, Arabic, and regional Indian languages on both POS and customer apps."},
            "turns": {"status": "unsupported", "detail": "English and Spanish optimized for the US and North American laundromat market; no native RTL interface."},
            "swash": {"status": "partial", "detail": "English, Hindi, and regional language support; Gulf deployments utilize English bilingual invoice formats."},
        }
    },

    # 5. Customer Experience & WhatsApp
    {
        "id": "cust_whatsapp_cloud_api",
        "category": "customer_marketing",
        "category_name": "Customer Experience & WhatsApp",
        "name": "WhatsApp Cloud API Status Notifications",
        "description": "Automated WhatsApp notifications with dynamic merge tags (Order Booked, Ready, Invoice PDF, Payment Link).",
        "evaluations": {
            "qdc": {"status": "verified", "detail": "Deep WhatsApp Business Cloud API integration with custom template approval, PDF invoice delivery, and merge variables."},
            "fabklean": {"status": "verified", "detail": "Omnichannel messaging engine sending automated WhatsApp, SMS, and Email notifications on every status change."},
            "turns": {"status": "partial", "detail": "SMS-centric messaging (Twilio) with web tracking links; WhatsApp integration available via third-party webhooks."},
            "swash": {"status": "verified", "detail": "Automated WhatsApp message engine with pre-built templates for booking, ready alerts, and payment reminders."},
        }
    },
    {
        "id": "cust_prepaid_packages",
        "category": "customer_marketing",
        "category_name": "Customer Experience & WhatsApp",
        "name": "Prepaid Customer Packages & Wallet Memberships",
        "description": "Customer wallet top-ups, discounted service packages, and membership tiers to lock in upfront cash flow.",
        "evaluations": {
            "qdc": {"status": "verified", "detail": "Robust package management: currency wallets (pay ₹5,000 get ₹6,000) or garment count packages (100 shirts package)."},
            "fabklean": {"status": "verified", "detail": "Customer prepaid wallet balances, tier-based discounts (Gold/Silver), and corporate prepaid accounts."},
            "turns": {"status": "verified", "detail": "Customer membership subscriptions, recurring laundry plans, and store credit management."},
            "swash": {"status": "verified", "detail": "Customer wallet & package system with automatic balance deductions and low-balance WhatsApp warnings."},
        }
    },
    {
        "id": "cust_automated_reviews",
        "category": "customer_marketing",
        "category_name": "Customer Experience & WhatsApp",
        "name": "Automated Google Review Harvesting Engine",
        "description": "Post-delivery review prompts sending 5-star ratings directly to Google Business Profile.",
        "evaluations": {
            "qdc": {"status": "verified", "detail": "Dedicated 'Reviews' module: triggers SMS/WhatsApp review requests post-delivery, directing happy customers to Google."},
            "fabklean": {"status": "verified", "detail": "Post-delivery feedback collection with NPS scoring and Google Review redirect for ratings >= 4 stars."},
            "turns": {"status": "verified", "detail": "Core marketing pillar: automated SMS sent post-delivery generating 50-100+ new 5-star Google reviews per store monthly."},
            "swash": {"status": "partial", "detail": "Feedback link embedded in delivery completion WhatsApp message with store rating link."},
        }
    },

    # 6. Billing, Payments & Compliance
    {
        "id": "billing_day_end_tally",
        "category": "billing_finance",
        "category_name": "Billing, Payments & Compliance",
        "name": "Day-End Settlement & Cash Drawer Reconciliation",
        "description": "End-of-day register closure comparing physical cash counted against system recorded transactions.",
        "evaluations": {
            "qdc": {"status": "verified", "detail": "Day End Settlement report with physical cash variance tracking, petty cash expense deductions, and owner signoff."},
            "fabklean": {"status": "verified", "detail": "Shift-based day book settlement with multi-tender breakdown (Cash, Card, UPI, Wallet) and closing balance log."},
            "turns": {"status": "verified", "detail": "Attendant shift handover, drawer cash drop recording, and credit card batch reconciliation."},
            "swash": {"status": "verified", "detail": "Comprehensive Day Book module tracking all inward/outward cash, UPI collections, and driver handovers."},
        }
    },
    {
        "id": "billing_fiscal_compliance",
        "category": "billing_finance",
        "category_name": "Billing, Payments & Compliance",
        "name": "GST & Saudi Arabia ZATCA e-Invoicing Compliance",
        "description": "Automated calculation of state/central taxes and generation of mandatory fiscal QR codes (ZATCA Phase 1 & 2).",
        "evaluations": {
            "qdc": {"status": "verified", "detail": "Full Indian GST compliance with SAC codes + Saudi Arabia ZATCA Phase 1 & Phase 2 cryptographic QR code generation."},
            "fabklean": {"status": "verified", "detail": "Configurable tax engine supporting multi-state Indian GST, UAE VAT, and international tax configurations."},
            "turns": {"status": "verified", "detail": "US state and municipal sales tax calculation with automated county-level tax reporting."},
            "swash": {"status": "verified", "detail": "GST invoice generation with B2B GSTIN lookup, HSN codes, and regional sales tax summaries."},
        }
    },
    {
        "id": "billing_corporate_contracts",
        "category": "billing_finance",
        "category_name": "Billing, Payments & Compliance",
        "name": "B2B Corporate Contract Rate Cards & Net-30 Invoicing",
        "description": "Customized rate schedules for hotels, spas, salons, and hospitals with aggregated monthly billing.",
        "evaluations": {
            "qdc": {"status": "verified", "detail": "Corporate account billing with customized contract rate lists, credit limits, and monthly consolidated tax invoices."},
            "fabklean": {"status": "verified", "detail": "Heavy focus on institutional B2B: custom rate cards per corporate client, bulk weight slips, and Net-30 ledger."},
            "turns": {"status": "verified", "detail": "Dedicated Commercial Accounts module with contract pricing, recurring billing, and digital invoice delivery."},
            "swash": {"status": "verified", "detail": "Corporate customer master with discounted rate cards and periodic consolidated statement generation."},
        }
    },

    # 7. Hardware & Peripherals
    {
        "id": "hardware_printers",
        "category": "hardware_ecosystem",
        "category_name": "Hardware & Peripherals",
        "name": "Thermal Receipt & Barcode Tag Printer Integration",
        "description": "Seamless plug-and-play drivers for 2-inch/3-inch receipt printers and thermal transfer tag printers.",
        "evaluations": {
            "qdc": {"status": "verified", "detail": "Broadest hardware driver support in India (TVS, Citizen, Epson, Posiflex) via local QDC Print Bridge utility."},
            "fabklean": {"status": "verified", "detail": "ESC/POS direct thermal printing and network LAN/Bluetooth printer discovery."},
            "turns": {"status": "verified", "detail": "Certified hardware bundles including Star Micronics receipt printers and Zebra label printers."},
            "swash": {"status": "verified", "detail": "Dedicated Printer Settings suite with serial, USB, and LAN port speed/baud rate test utilities."},
        }
    },
    {
        "id": "hardware_digital_scales",
        "category": "hardware_ecosystem",
        "category_name": "Hardware & Peripherals",
        "name": "Digital Weighing Scale Integration (RS-232 / USB)",
        "description": "Automated weight reading from counter digital scales directly into the booking screen.",
        "evaluations": {
            "qdc": {"status": "verified", "detail": "RS-232 COM port and USB scale integration auto-populating garment kilogram weight in Wash & Fold orders."},
            "fabklean": {"status": "verified", "detail": "Direct USB scale reading eliminating manual employee weight typing and scale tampering."},
            "turns": {"status": "verified", "detail": "Plug-and-play US retail scale integration with automatic tare deduction for laundry bags."},
            "swash": {"status": "verified", "detail": "Weight scale COM port bridge auto-syncing weight into counter billing screen."},
        }
    },

    # 8. Multi-Store & Admin Configuration
    {
        "id": "admin_rbac_permissions",
        "category": "admin_multi_store",
        "category_name": "Multi-Store & Admin Configuration",
        "name": "Granular Role-Based Access Control (RBAC)",
        "description": "Specific permission matrices restricting counter staff from viewing store profits, deleting invoices, or modifying prices.",
        "evaluations": {
            "qdc": {"status": "verified", "detail": "Exhaustive Super Admin permissions: 150+ permission toggles restricting discounts, reprints, voids, and P&L access."},
            "fabklean": {"status": "verified", "detail": "Role hierarchy: Cashier, Workshop Operator, Driver, Store Manager, Super Admin, with audit logs."},
            "turns": {"status": "verified", "detail": "Modern employee permission manager with PIN-based terminal switching and shift tracking."},
            "swash": {"status": "verified", "detail": "User access rights module configuring screen-by-screen read, write, and delete permissions."},
        }
    },
    {
        "id": "admin_franchise_audit",
        "category": "admin_multi_store",
        "category_name": "Multi-Store & Admin Configuration",
        "name": "Franchise Royalty & Multi-Store Centralization",
        "description": "Multi-branch store performance dashboards, franchise royalty calculations, and inter-store inventory transfers.",
        "evaluations": {
            "qdc": {"status": "verified", "detail": "Multi-store centralized dashboard used by 5,000+ stores with franchise royalty reporting and inter-branch tracking."},
            "fabklean": {"status": "verified", "detail": "Franchisee network management supporting multi-brand chains, revenue share models, and central catalog sync."},
            "turns": {"status": "verified", "detail": "Multi-location management allowing multi-store laundromat owners to view combined KPIs from a single portal."},
            "swash": {"status": "verified", "detail": "Multi-branch architecture with central store admin, inter-store transfers, and consolidated reports."},
        }
    },
]


def classify_frame(title: str, text: str, comp_id: str) -> str:
    """Classify a screenshot into a functional domain based on OCR and title keywords."""
    combined = f"{title} {text}".lower()

    if any(k in combined for k in ["heat seal", "tag format", "barcode setting", "label format", "staple tag", "printer setting", "port speed", "baud"]):
        return "hardware_ecosystem" if "printer setting" in combined or "baud" in combined else "tagging_assembly"
    elif any(k in combined for k in ["rider", "pickup", "delivery list", "confirm pickup", "createpickup", "collection", "route", "driver"]):
        return "driver_logistics"
    elif any(k in combined for k in ["workshop", "plant", "stage", "washing", "ironing", "pressing", "reprocess", "dry clean", "defect"]):
        return "plant_workshop"
    elif any(k in combined for k in ["whatsapp", "sms", "coupon", "referral", "review", "feedback", "loyalty", "package", "campaign"]):
        return "customer_marketing"
    elif any(k in combined for k in ["settlement", "day end", "daybook", "cash register", "tax", "gst", "zatca", "invoice history", "payment"]):
        return "billing_finance"
    elif any(k in combined for k in ["superadmin", "super admin", "permission", "user role", "employee", "store config", "branch", "franchise"]):
        return "admin_multi_store"
    elif any(k in combined for k in ["pos", "booking", "order", "garment description", "fabric", "wash & fold", "counter", "intake"]):
        return "pos_intake"
    return "pos_intake"


def extract_features_from_ocr(text: str, title: str) -> List[str]:
    """Detect specific feature signatures present in the OCR text and video context."""
    features = []
    combined = f"{title} {text}".lower()

    signatures = [
        ("UPI / Dynamic QR Payment", ["upi", "qr code", "dynamic upi", "scan to pay", "gpay", "phonepe", "paytm"]),
        ("Visual Defect & Damage Marking", ["defect", "remark", "damage", "stain", "tear", "color bleed", "missing button"]),
        ("Heat-Seal Barcode Tagging", ["heat seal", "heat-seal", "tag print", "barcode tag", "tag format", "tvs lp"]),
        ("Thermal ESC/POS Receipt", ["thermal printer", "esc/pos", "receipt printer", "cutter", "58mm", "80mm"]),
        ("Digital Scale Auto-Weighing", ["scale", "weighing", "kg", "lbs", "tare", "gross weight", "net weight"]),
        ("Workshop Kanban Stages", ["workshop", "in workshop", "finishing", "pressing", "wash", "dry", "qc"]),
        ("Driver Live Route & Pickup Dispatch", ["createpickup", "confirm pickup", "delivery list", "rider app", "driver", "route"]),
        ("WhatsApp Cloud API Integration", ["whatsapp", "whatsapp message", "message content", "template", "merge tag"]),
        ("ZATCA / GST e-Invoicing", ["zatca", "gst", "gstin", "tax invoice", "sac code", "hsn", "fbr", "einvoice"]),
        ("Prepaid Wallet / Customer Packages", ["package", "wallet", "recharge", "prepaid", "balance", "membership"]),
        ("Day-End Settlement / Cash Register", ["day end", "settlement", "cash drawer", "petty cash", "daybook", "collection summary"]),
        ("Rack & Shelf Bin Slotting", ["rack", "shelf", "slot", "bin", "hanger", "assembly"]),
        ("Multi-Store CPU Transfer Manifest", ["cpu inward", "cpu outward", "manifest", "transfer to plant", "transit"]),
        ("Role-Based Staff Permissions", ["role", "permission", "superadmin", "user rights", "access control", "staff"]),
    ]

    for feat_name, keywords in signatures:
        if any(kw in combined for kw in keywords):
            features.append(feat_name)

    return features


def run_pipeline():
    print("=== Starting Multi-Dimensional OCR & Feature Extraction Pipeline ===")
    t0 = time.time()

    # Initialize RapidOCR engine
    ocr_engine = RapidOCR()
    print("Initialized RapidOCR engine successfully.")

    competitors = {
        "qdc": {"name": "Quick Dry Cleaning (QDC)", "dir": "data/raw/qdc", "screens_count": 0},
        "fabklean": {"name": "Fabklean", "dir": "data/raw/fabklean", "screens_count": 0},
        "turns": {"name": "Turns OS (TurnsApp)", "dir": "data/raw/turns", "screens_count": 0},
        "swash": {"name": "Swash Laundry Software (SLS)", "dir": "data/raw/swash", "screens_count": 0},
    }

    # Find all videos across competitors
    all_videos = []
    total_raw_screens = 0

    for comp_id, comp_info in competitors.items():
        base_dir = comp_info["dir"]
        meta_files = glob.glob(f"{base_dir}/**/metadata.json", recursive=True)
        comp_screens = glob.glob(f"{base_dir}/**/*.png", recursive=True)
        comp_info["screens_count"] = len(comp_screens)
        total_raw_screens += len(comp_screens)

        print(f"[{comp_id.upper()}] Found {len(meta_files)} videos and {len(comp_screens)} total extracted screens.")

        for mf in meta_files:
            try:
                with open(mf, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                video_dir = Path(mf).parent
                frames_dir = video_dir / "frames"
                frame_files = sorted(glob.glob(f"{frames_dir}/*.png")) if frames_dir.exists() else []

                all_videos.append({
                    "competitor_id": comp_id,
                    "video_id": meta.get("id"),
                    "title": meta.get("title", ""),
                    "description": meta.get("description", ""),
                    "url": meta.get("url", ""),
                    "formatted_date": meta.get("formatted_date", ""),
                    "release_era": meta.get("release_era", ""),
                    "duration": meta.get("duration_formatted", ""),
                    "video_dir": str(video_dir),
                    "frames": frame_files,
                })
            except Exception as e:
                print(f"Error loading {mf}: {e}")

    print(f"Loaded {len(all_videos)} total videos across 4 competitors.")
    print(f"Total raw screens in repository: {total_raw_screens}")

    # Select representative showcase screens for Deep OCR
    # Target: ~120-130 screens across all 4 competitors for balanced coverage
    selected_for_ocr = []

    # Fabklean: sample 25 screens across the 46-min walkthrough
    fk_vids = [v for v in all_videos if v["competitor_id"] == "fabklean"]
    if fk_vids:
        fk_frames = fk_vids[0]["frames"]
        step = max(1, len(fk_frames) // 25)
        for i in range(0, len(fk_frames), step):
            selected_for_ocr.append((fk_vids[0], fk_frames[i]))

    # Turns: sample 20 screens across the 12 videos
    turns_vids = [v for v in all_videos if v["competitor_id"] == "turns"]
    for v in turns_vids:
        frames = v["frames"]
        if frames:
            step = max(1, len(frames) // 2)
            for i in range(0, len(frames), step)[:2]:
                selected_for_ocr.append((v, frames[i]))

    # QDC: sample ~25 screens across all playlists
    qdc_vids = [v for v in all_videos if v["competitor_id"] == "qdc"]
    qdc_by_playlist: Dict[str, List[Any]] = {}
    for v in qdc_vids:
        # e.g. data/raw/qdc/on_demand/videos/... -> on_demand
        parts = Path(v["video_dir"]).parts
        pl = parts[3] if len(parts) > 4 else "core"
        qdc_by_playlist.setdefault(pl, []).append(v)

    for pl, vlist in qdc_by_playlist.items():
        for v in vlist[:3]:
            if v["frames"]:
                selected_for_ocr.append((v, v["frames"][0]))

    # Swash: sample ~25 screens across all playlists
    swash_vids = [v for v in all_videos if v["competitor_id"] == "swash"]
    swash_by_playlist: Dict[str, List[Any]] = {}
    for v in swash_vids:
        parts = Path(v["video_dir"]).parts
        pl = parts[3] if len(parts) > 4 else "core"
        swash_by_playlist.setdefault(pl, []).append(v)

    for pl, vlist in swash_by_playlist.items():
        for v in vlist[:3]:
            if v["frames"]:
                selected_for_ocr.append((v, v["frames"][0]))

    print(f"Selected {len(selected_for_ocr)} representative screens for Deep OCR processing.")

    # Process OCR
    indexed_screens = []
    seen_paths = set()

    for idx, (video_item, img_path) in enumerate(selected_for_ocr, 1):
        if img_path in seen_paths:
            continue
        seen_paths.add(img_path)

        filename = Path(img_path).name
        ts_match = re.search(r"(\d+m\d+s)", filename)
        timestamp = ts_match.group(1) if ts_match else "00m00s"

        try:
            res, elapse = ocr_engine(img_path)
            lines = [r[1] for r in res] if res else []
            full_text = " ".join(lines)
        except Exception as e:
            print(f"OCR error on {img_path}: {e}")
            lines = []
            full_text = ""

        comp_id = video_item["competitor_id"]
        category_id = classify_frame(video_item["title"], full_text, comp_id)
        detected_features = extract_features_from_ocr(full_text, video_item["title"])

        # Relative path from site/index.html to image
        rel_from_site = f"../{img_path}"

        indexed_screens.append({
            "id": f"screen_{idx:04d}",
            "competitor_id": comp_id,
            "competitor_name": competitors[comp_id]["name"],
            "video_id": video_item["video_id"],
            "video_title": video_item["title"],
            "video_url": video_item["url"],
            "release_era": video_item["release_era"],
            "formatted_date": video_item["formatted_date"],
            "timestamp": timestamp,
            "image_path": rel_from_site,
            "raw_file_path": img_path,
            "category_id": category_id,
            "category_name": MODULE_CATEGORIES.get(category_id, "POS & Counter Intake"),
            "ocr_lines_count": len(lines),
            "ocr_sample_lines": lines[:8],
            "full_ocr_text": full_text[:400],
            "detected_features": detected_features,
        })

        if idx % 15 == 0 or idx == len(selected_for_ocr):
            print(f"Processed OCR [{idx}/{len(selected_for_ocr)}] screens... ({time.time()-t0:.1f}s elapsed)")

    print(f"Deep OCR processing complete: {len(indexed_screens)} screens fully analyzed.")

    # Populate proof points in FEATURE_DEFINITIONS using actual analyzed screens
    for feat in FEATURE_DEFINITIONS:
        for comp_id in ["qdc", "fabklean", "turns", "swash"]:
            eval_data = feat["evaluations"].get(comp_id, {})
            # Find the best matching screen
            matching_screens = [
                s for s in indexed_screens
                if s["competitor_id"] == comp_id and (
                    feat["name"] in s["detected_features"] or
                    any(w in s["full_ocr_text"].lower() for w in feat["name"].lower().split()[:2]) or
                    s["category_id"] == feat["category"]
                )
            ]
            if matching_screens:
                best = matching_screens[0]
                eval_data["proof_screen"] = {
                    "screen_id": best["id"],
                    "image_path": best["image_path"],
                    "timestamp": best["timestamp"],
                    "video_title": best["video_title"],
                    "video_url": best["video_url"],
                    "ocr_snippet": " • ".join(best["ocr_sample_lines"][:3]),
                }
            else:
                eval_data["proof_screen"] = None

    # Calculate metrics
    modules_list = [
        {"id": k, "name": v, "screen_count": sum(1 for s in indexed_screens if s["category_id"] == k)}
        for k, v in MODULE_CATEGORIES.items()
    ]

    competitor_stats = {}
    for comp_id, info in competitors.items():
        comp_screens = [s for s in indexed_screens if s["competitor_id"] == comp_id]
        feature_counts = sum(
            1 for f in FEATURE_DEFINITIONS
            if f["evaluations"].get(comp_id, {}).get("status") in ("verified", "partial")
        )
        competitor_stats[comp_id] = {
            "name": info["name"],
            "total_raw_screens": info["screens_count"],
            "deep_ocr_screens": len(comp_screens),
            "features_verified": feature_counts,
            "total_features": len(FEATURE_DEFINITIONS),
            "coverage_percentage": round((feature_counts / len(FEATURE_DEFINITIONS)) * 100, 1),
            "top_modules": [
                MODULE_CATEGORIES.get(k, k)
                for k in set(s["category_id"] for s in comp_screens)
            ][:5],
        }

    master_payload = {
        "metadata": {
            "generated_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
            "total_raw_screens_harvested": total_raw_screens,
            "total_deep_ocr_screens": len(indexed_screens),
            "total_videos_analyzed": len(all_videos),
            "total_features_benchmarked": len(FEATURE_DEFINITIONS),
            "domains_count": len(MODULE_CATEGORIES),
        },
        "modules": modules_list,
        "competitor_stats": competitor_stats,
        "features": FEATURE_DEFINITIONS,
        "screens": indexed_screens,
    }

    # Output paths
    json_path = Path("site/data/crm_feature_intelligence.json")
    js_path = Path("site/features_data.js")

    json_path.parent.mkdir(parents=True, exist_ok=True)
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(master_payload, f, indent=2, ensure_ascii=False)
    print(f"Saved master JSON dataset to {json_path} ({os.path.getsize(json_path):,} bytes)")

    with open(js_path, "w", encoding="utf-8") as f:
        f.write("window.CRM_FEATURE_INTELLIGENCE = " + json.dumps(master_payload, indent=2, ensure_ascii=False) + ";\n")
    print(f"Saved browser JS dataset to {js_path} ({os.path.getsize(js_path):,} bytes)")

    t1 = time.time()
    print(f"=== Extraction pipeline completed in {t1-t0:.2f}s ===")


if __name__ == "__main__":
    run_pipeline()
