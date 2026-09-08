#!/usr/bin/env python3
"""
Appends the additional QDC and Swash showcase screens to build_full_dataset.py
to reach 101 high-quality showcase screens.
"""

import sys

new_screens_code = '''
# ==========================================
# 3b. ADDITIONAL QDC SHOWCASE SCREENS (11 screens)
# ==========================================
qdc_s26 = add_screen(
    "qdc", "customer_marketing", "f_kFY-KeZWs",
    "Customer App Promotional Coupons & Discount Rules",
    "Promotion management module in QDC. Store owners create percentage-based and flat-value discount promo codes, configure minimum spend rules, and deploy them to customer mobile apps.",
    [
        "1. Open Discount Coupon Master in QDC Admin",
        "2. Define coupon promo code (e.g. MONSOON20), discount percentage, and max cap",
        "3. Set coupon validity period and minimum order value",
        "4. Customer enters code on mobile app or cashier applies it at POS",
        "5. System recalculates order total and records discount expense"
    ],
    ["Promotional Coupon Engine", "Customer Mobile App Discount", "Minimum Spend Validation", "Discount Analytics"],
    target_sec=20
)

qdc_s27 = add_screen(
    "qdc", "customer_marketing", "IYP2fZXUW6M",
    "Customer Referral Program & Wallet Credit Balance",
    "Referral marketing engine in QDC. Encourages existing clients to invite friends by crediting referral bonuses directly into their digital store wallet.",
    [
        "1. Configure customer referral bonus values in CRM settings",
        "2. Existing customer shares referral link via WhatsApp or SMS",
        "3. New referred friend books their first laundry order",
        "4. System automatically credits ₹100 wallet balance to both parties",
        "5. Referral credits automatically redeem on subsequent order billing"
    ],
    ["Referral Reward Engine", "Digital Customer Wallet", "Automated Credit Accrual", "Customer Viral Acquisition"],
    target_sec=25
)

qdc_s28 = add_screen(
    "qdc", "driver_logistics", "1cn1RUb3Zkc",
    "Rearrange Assigned Pickups & Dynamic Route Sequencing",
    "Dispatcher interface in QDC for reordering pickup and delivery stops. Allows supervisors to optimize driving routes based on live traffic, customer availability, or urgent requests.",
    [
        "1. Dispatcher opens Route Scheduler dashboard in QDC",
        "2. Views assigned pickup stops for selected driver van",
        "3. Drags and drops stops to resequence driving order",
        "4. Click Update Route pushes new sequence to driver mobile app",
        "5. Rider app reorders turn-by-turn navigation list automatically"
    ],
    ["Dynamic Route Resequencing", "Drag-and-Drop Dispatcher", "Traffic Optimization", "Real-Time Mobile Route Sync"],
    target_sec=15
)

qdc_s29 = add_screen(
    "qdc", "driver_logistics", "ebCHmcP1QYA",
    "Pickup Audit Reports & Multi-Channel Origin Tracking",
    "Audit reporting module tracking the creation origin of all pickup requests (Web Portal, Android App, iOS App, Counter Phone Call) with operator attribution.",
    [
        "1. Open Pickup History & Scheduler Audit Report",
        "2. Filter requests by date range, channel origin, or store branch",
        "3. Identify which customer care executive or app created each booking",
        "4. Track pickup-to-intake conversion rate and turnaround time",
        "5. Export booking logs to Excel for driver commission calculation"
    ],
    ["Multi-Channel Pickup Origin", "Operator Attribution Audit", "Turnaround Time Metrics", "Driver Commission Export"],
    target_sec=15
)

qdc_s30 = add_screen(
    "qdc", "driver_logistics", "hRRlj9BheY8",
    "Doorstep Coupon Application in MPOS Rider App",
    "Feature allowing delivery executives to validate and apply promotional discount coupons directly at customer residences on the MPOS Rider application.",
    [
        "1. Driver initiates order booking at customer doorstep",
        "2. Customer presents physical or digital discount coupon code",
        "3. Driver enters coupon code into mobile app validation field",
        "4. System verifies coupon terms via cloud API and deducts discount",
        "5. Doorstep receipt prints adjusted subtotal and savings breakdown"
    ],
    ["Doorstep Coupon Redemption", "Mobile Cloud API Validation", "Savings Transparency", "Instant Discount Ledger"],
    target_sec=20
)

qdc_s31 = add_screen(
    "qdc", "plant_workshop", "8zXDh4zXmtY",
    "Super Admin: Services Workflow — Combination of Stages",
    "Advanced workflow configuration allowing complex service combinations (e.g. Wash + Dry Clean + Darning + Steam Press) with branching workshop routes.",
    [
        "1. Access Service Workflow Builder in Super Admin",
        "2. Create multi-service combo routing for complex garments",
        "3. Link sequential stage checkpoints across different plant departments",
        "4. Define mandatory inspection gates before passing between bays",
        "5. Ensure end-to-end quality assurance across industrial operations"
    ],
    ["Multi-Service Combo Routing", "Inter-Departmental Handover", "Quality Inspection Gates", "Complex Garment Workflows"],
    target_sec=25
)

qdc_s32 = add_screen(
    "qdc", "plant_workshop", "sR3ooVLe5Ek",
    "Super Admin: Services Workflow — Pending for Finishing",
    "Stage tracking queue displaying all garments that have completed wash extraction and are queued for steam pressing, iron finishing, or tumble drying.",
    [
        "1. Workshop finishing supervisor views Pending for Finishing queue",
        "2. Filters orders by promised delivery time and express priority",
        "3. Assigns batches to specific steam iron stations or presses",
        "4. Pressing operator scans garment tag upon completing finish",
        "5. Garment automatically advances to Quality Check inspection"
    ],
    ["Finishing Station Queue", "Priority Batch Allocation", "Steam Press Station Tracking", "Operator Finishing Scans"],
    target_sec=25
)

qdc_s33 = add_screen(
    "qdc", "billing_finance", "B9WON81hfgg",
    "Super Admin: Services Workflow — Enable/Disable Tax on Services",
    "Granular tax configuration enabling laundry owners to apply or exempt specific taxes (GST/VAT) on individual services (e.g. taxable dry cleaning vs exempt shoe repairs).",
    [
        "1. Open Service Tax Master in Super Admin settings",
        "2. Select service category and view applicable tax slabs",
        "3. Toggle tax application switch for specific services",
        "4. Set SAC/HSN codes and CGST/SGST/IGST tax rates",
        "5. Point-of-sale automatically computes correct tax on line items"
    ],
    ["Granular Tax Exemption", "SAC/HSN Code Master", "Multi-Slab GST Rates", "Automated Tax Calculation"],
    target_sec=25
)

qdc_s34 = add_screen(
    "qdc", "billing_finance", "FheDL_mWHss",
    "Super Admin: Services Workflow — Enable/Disable Discounts",
    "Administrative discount policy setting allowing owners to lock high-cost services (e.g. Leather Jacket Restoration, Wedding Gowns) from cashier discounts.",
    [
        "1. Access Discount Rules configuration in Super Admin",
        "2. View list of configured laundry and dry cleaning services",
        "3. Disable discount toggle for luxury and high-cost services",
        "4. POS terminal blocks discount application on restricted line items",
        "5. Protects operational margins on labor-intensive garment care"
    ],
    ["Discount Restriction Policy", "Margin Protection Controls", "Luxury Service Safeguards", "Cashier Discount Lock"],
    target_sec=25
)

qdc_s35 = add_screen(
    "qdc", "tagging_assembly", "sLYq299fP-o",
    "Reduced QR Code Size & High-Density Thermal Tag Layouts",
    "Thermal layout optimization feature enabling laundry operators to compress 2D QR codes and garment details onto ultra-compact 1-inch continuous tags, saving paper costs.",
    [
        "1. Open Tag Layout Designer in Print Bridge utility",
        "2. Select Compact Tag profile (1 inch x 1 inch continuous roll)",
        "3. Enable high-density QR code compression algorithm",
        "4. Test print compact tag on Citizen/TVS printer",
        "5. Reduces consumable paper tape costs by up to 40% across chain"
    ],
    ["High-Density QR Compression", "Compact Tag Paper Profiles", "Consumable Cost Reduction", "Print Bridge Designer"],
    target_sec=12
)

qdc_s36 = add_screen(
    "qdc", "admin_multi_store", "ZT8yV3nFkoQ",
    "Super Admin: Services — Enable/Disable Services Across Branches",
    "Central franchise control allowing brand owners to enable or disable specific services (e.g. Leather Cleaning or Carpet Wash) per branch based on local plant capabilities.",
    [
        "1. Open Multi-Store Branch Service Matrix in Super Admin",
        "2. View service availability grid across all franchise locations",
        "3. Toggle service visibility for branches lacking specialized machinery",
        "4. POS counters at restricted branches automatically hide disabled services",
        "5. Prevents taking orders that the local store cannot process"
    ],
    ["Branch-Specific Service Matrix", "Franchise Capability Governance", "POS Catalog Visibility Control", "Operational Safeguards"],
    target_sec=25
)


# ==========================================
# 4b. ADDITIONAL SWASH SHOWCASE SCREENS (21 screens)
# ==========================================
swash_s17 = add_screen(
    "swash", "pos_intake", "Rq3n_XLikxA",
    "Swash SLS — How to Create Counter Orders with Keyboard Shortcuts",
    "High-velocity POS counter billing tutorial for Swash SLS. Cashiers utilize keyboard hotkeys to search garments, input quantities, apply remarks, and print receipts in under 15 seconds.",
    [
        "1. Cashier presses hotkey to open New Order window",
        "2. Types customer mobile number with instant autocomplete",
        "3. Uses numeric keyboard shortcuts to add garments and quantities",
        "4. Selects processing service and delivery commitment date",
        "5. Press Enter prints thermal receipt and triggers customer SMS"
    ],
    ["Keyboard-First POS Shortcuts", "15-Second Counter Intake", "Numeric Item Code Entry", "Instant Thermal Printing"],
    target_sec=18
)

swash_s18 = add_screen(
    "swash", "customer_marketing", "-hdTOWD_5e8",
    "Swash SLS — How to Add a New Customer Profile & Address",
    "Customer onboarding workflow in Swash SLS. Cashiers record customer contact numbers, delivery addresses, GSTIN tax details, and fabric care preferences.",
    [
        "1. Click Add Customer icon on main counter navigation bar",
        "2. Input customer full name, primary mobile number, and email",
        "3. Add delivery street address with landmark and GPS coordinates",
        "4. Record customer GSTIN tax identification for B2B billing",
        "5. Save profile to make customer instantly searchable across POS and Rider apps"
    ],
    ["Customer Profile Master", "B2B GSTIN Recording", "GPS Landmark Tagging", "Omnichannel Client Database"],
    target_sec=15
)

swash_s19 = add_screen(
    "swash", "driver_logistics", "ObWdwMiy1ug",
    "Swash SLS — How to Assign Customer Pickups to Drivers",
    "Pickup dispatch workflow in Swash SLS. Front-office operators assign incoming customer phone and web pickup requests to specific delivery executives.",
    [
        "1. Open Pending Pickup Requests dashboard",
        "2. Select customer pickup bookings scheduled for the current shift",
        "3. Choose active delivery rider based on proximity zone",
        "4. Confirm assignment pushes stop notification to driver phone",
        "5. Customer receives automated WhatsApp message with rider contact details"
    ],
    ["Pickup Dispatch Workflow", "Zone Proximity Allocation", "Driver Mobile Notification", "Customer WhatsApp Tracking"],
    target_sec=15
)

swash_s20 = add_screen(
    "swash", "driver_logistics", "YAxrzBW4jJo",
    "Swash SLS — How to Assign Scheduled Pickups for Future Dates",
    "Advance scheduling interface in Swash SLS allowing operators to book and assign recurring or future-dated laundry pickups (e.g. weekly Monday office dry cleaning).",
    [
        "1. Open Schedule Pickup calendar in Swash SLS",
        "2. Select future appointment date and customer preferred time slot",
        "3. Assign designated route rider for advance fulfillment",
        "4. System sends booking confirmation reminder to customer",
        "5. Automatically moves appointment to active route on scheduled morning"
    ],
    ["Advance Pickup Scheduler", "Recurring Laundry Appointments", "Automated Morning Route Transfer", "Calendar Booking Grid"],
    target_sec=15
)

swash_s21 = add_screen(
    "swash", "driver_logistics", "07_tM0TNSoE",
    "Swash SLS — How to Assign Delivery Orders & Print Delivery Slips",
    "Delivery dispatch workflow in Swash SLS. Operators select ready orders, assign them to delivery drivers, and print consolidated delivery manifests with total cash to collect.",
    [
        "1. Open Ready for Delivery queue in SLS dashboard",
        "2. Select customer orders staged on finished racks",
        "3. Assign orders to delivery executive route",
        "4. Print Delivery Slip with customer address and payment mode",
        "5. Delivery boy departs store with assigned order hampers"
    ],
    ["Delivery Dispatch Module", "Consolidated Delivery Slips", "Cash-on-Delivery Reconciliation", "Van Route Staging"],
    target_sec=15
)

swash_s22 = add_screen(
    "swash", "billing_finance", "4smu7ghcXq4",
    "Swash SLS — How to Check Customer Account Statement & Dues",
    "Customer account ledger in Swash SLS. Attendants review historic orders, paid amounts, outstanding credit balances, and generate PDF statements for monthly settlement.",
    [
        "1. Search customer profile in Swash SLS Account Ledger",
        "2. View complete transaction ledger (Orders Booked, Payments Received, Dues)",
        "3. Click View Statement to generate itemized financial history",
        "4. Export PDF statement or share directly to customer WhatsApp",
        "5. Record lump-sum balance payment against historical dues"
    ],
    ["Customer Financial Ledger", "Outstanding Dues Tracking", "PDF Account Statement", "Lump-Sum Payment Reconciliation"],
    target_sec=15
)

swash_s23 = add_screen(
    "swash", "billing_finance", "DJUq3OSF5ag",
    "Swash SLS — How to View Product Sales Reports & Category Breakdown",
    "Analytical reporting module in Swash SLS. Store owners analyze revenue breakdowns across garment types (Shirts, Suits, Blankets) and services (Dry Clean vs Laundry).",
    [
        "1. Navigate to Reports menu and select Product Report",
        "2. Set analytical date range (Today, This Week, This Month)",
        "3. View sales volume and revenue contribution per garment article",
        "4. Identify top-performing services and low-velocity items",
        "5. Export product analytics to Excel for inventory planning"
    ],
    ["Product Sales Analytics", "Garment Category Breakdown", "Service Revenue Contribution", "Inventory Demand Forecasting"],
    target_sec=15
)

swash_s24 = add_screen(
    "swash", "billing_finance", "YVxovTUQWlU",
    "Swash SLS — How to View Outstanding Debt Reports & Aging Ledger",
    "Credit management report in Swash SLS. Displays aging debt analysis across all customers with overdue balances, enabling targeted payment reminder campaigns.",
    [
        "1. Open Outstanding Report in Financial Analytics menu",
        "2. Filter debtors by aging buckets (0-30 days, 31-60 days, 60+ days)",
        "3. Review total outstanding store receivables and uncollected cash",
        "4. Trigger bulk WhatsApp payment reminder links to overdue clients",
        "5. Accelerate receivables collection and improve working capital"
    ],
    ["Aging Debt Analysis", "Outstanding Receivables Report", "Bulk WhatsApp Payment Prompts", "Working Capital Optimization"],
    target_sec=15
)

swash_s25 = add_screen(
    "swash", "billing_finance", "2w4w9JWwLPE",
    "Swash SLS — How to Receive Payments & Split Tender Billing",
    "Payment collection interface in Swash SLS. Cashiers record multi-tender payments combining Cash, UPI, Credit Card, and Wallet deductions on counter settlements.",
    [
        "1. Open Receive Payment dialog on active or delivered order",
        "2. Enter payment amount and choose tender mode (Cash, Card, UPI, Wallet)",
        "3. Support split payments (e.g. ₹500 UPI + ₹300 Cash)",
        "4. Dynamic UPI QR code generates on screen for instant customer scanning",
        "5. Receipt prints payment breakdown and updates daily drawer ledger"
    ],
    ["Split Tender Billing", "Multi-Mode Payment Collection", "Instant UPI Reconciliation", "Cash Drawer Ledger Update"],
    target_sec=15
)

swash_s26 = add_screen(
    "swash", "admin_multi_store", "sPzXw0D1lZI",
    "Swash SLS — How to Set Prices of New Products & Services",
    "Pricing configuration module in Swash SLS. Administrators define per-piece rates, express multipliers, and custom rate cards for new garment offerings.",
    [
        "1. Open Pricing Master in Swash Admin Settings",
        "2. Select garment category and choose processing service tier",
        "3. Enter standard unit price, minimum charge, and express markup",
        "4. Configure store-specific price overrides for prime locations",
        "5. Save price schedule to update counter billing terminals globally"
    ],
    ["Pricing Schedule Master", "Express Multiplier Surcharges", "Store-Specific Price Overrides", "Rate Card Cloud Sync"],
    target_sec=15
)

swash_s27 = add_screen(
    "swash", "admin_multi_store", "b8ZcTbGzzyY",
    "Swash SLS — How to Add a New Product and Set Category Attributes",
    "Garment catalog creation in Swash SLS. Store managers add new clothing items, assign them to categories (Menswear, Ethnic, Household), and configure fabric presets.",
    [
        "1. Navigate to Product Master and click Add New Product",
        "2. Input product name, short code, and category classification",
        "3. Assign default service applicability (Dry Clean, Wet Wash, Pressing)",
        "4. Configure standard garment weight for laundry scale estimations",
        "5. Product immediately appears in counter POS touch catalog"
    ],
    ["Product Catalog Creation", "Category Classification", "Service Applicability Mapping", "Standard Garment Weight Master"],
    target_sec=15
)

swash_s28 = add_screen(
    "swash", "plant_workshop", "nX38jD8rxhI",
    "Swash SLS — How to Add New Services & Rework Processing Types",
    "Workflow for expanding store offerings in Swash SLS. Administrators configure specialty services like Sneaker Spa, Curtain Sanitization, and Free QC Rework.",
    [
        "1. Open Service Configuration in SLS Admin",
        "2. Click Add Service and define service name and turnaround hours",
        "3. Set processing stage workflow sequence and QC inspection gates",
        "4. Configure billing mode (Per Piece vs Per Kilogram vs Per Square Foot)",
        "5. Deploy new service across retail stores and mobile booking channels"
    ],
    ["Specialty Service Expansion", "Turnaround SLA Hours", "Custom Billing Units (Sq Ft/Kg)", "QC Rework Workflow"],
    target_sec=15
)

swash_s29 = add_screen(
    "swash", "driver_logistics", "i0Jf_j2fYPI",
    "Swash SLS — Delivery Assignment & Van Dispatch Manifests",
    "Advanced dispatch management in Swash SLS. Dispatchers group delivery orders into van delivery runs, print driver trip sheets, and track real-time delivery status.",
    [
        "1. Dispatcher selects orders ready for outbound dispatch",
        "2. Groups orders by driver vehicle capacity and destination zones",
        "3. Generates printed Van Delivery Manifest with collection amounts",
        "4. Driver acknowledges trip assignment on smartphone app",
        "5. Dispatched orders reflect In Delivery status on customer tracking links"
    ],
    ["Van Dispatch Manifest", "Vehicle Load Optimization", "Trip Sheet Generation", "Real-Time Tracking Status"],
    target_sec=18
)

swash_s30 = add_screen(
    "swash", "billing_finance", "RE2yscVXRqA",
    "Swash SLS — How to View Historic Payment Registers & Tender Logs",
    "Financial auditing screen in Swash SLS. Accountants review all payments collected across store registers, filtering by UPI transaction ID, credit card batch, or cash.",
    [
        "1. Open Payment History Register in Swash Accounts menu",
        "2. Filter transactions by tender mode, cashier username, or date range",
        "3. Match bank settlement statements against logged UPI/card transactions",
        "4. Audit cash drawer drops and detect cashier settlement variances",
        "5. Export reconciled payment ledger to accounting software (Tally/Zoho)"
    ],
    ["Payment Audit Register", "Bank Settlement Reconciliation", "Tender Mode Breakdown", "Tally/Zoho Accounting Export"],
    target_sec=15
)

swash_s31 = add_screen(
    "swash", "driver_logistics", "lNUUmqu-OfI",
    "Swash SLS — Assign Schedule Pickup Routes for Route Optimization",
    "Route planning tool in Swash SLS for assigning advance scheduled pickups to recurring driver routes, minimizing mileage and driver idling times.",
    [
        "1. Dispatcher reviews tomorrow's scheduled pickup bookings",
        "2. Cluster bookings by geographic pin codes and time windows",
        "3. Assign entire cluster to dedicated route delivery executive",
        "4. System calculates projected route duration and fuel consumption",
        "5. Route plan syncs to driver mobile app ahead of morning shift"
    ],
    ["Advance Route Planning", "Pin Code Cluster Dispatch", "Mileage Optimization", "Morning Shift Pre-Sync"],
    target_sec=15
)

swash_s32 = add_screen(
    "swash", "driver_logistics", "ev3bj3CZ-sw",
    "Swash SLS — Driver Live Pickup Assignment & Real-Time Reallocation",
    "Real-time dispatch reallocation in Swash SLS. Allows dispatchers to transfer urgent customer pickup requests between drivers if a vehicle is delayed.",
    [
        "1. Dispatcher monitors live driver locations on store dispatch map",
        "2. Urgent pickup request received from high-priority VIP customer",
        "3. Dispatcher identifies nearest available rider with spare capacity",
        "4. One-click reassign transfers pickup task directly to nearest driver",
        "5. Original and new riders receive instant update push notifications"
    ],
    ["Live Dispatch Reallocation", "Nearest Rider Proximity", "VIP Priority Handling", "Real-Time Push Alerts"],
    target_sec=15
)

swash_s33 = add_screen(
    "swash", "customer_marketing", "kaacAggxi-A",
    "Swash SLS — How to Assign Package and Redeem Credits at Booking",
    "Seamless customer package redemption workflow during POS order creation in Swash SLS. Automatically applies pre-purchased package benefits to matching garments.",
    [
        "1. Cashier enters customer phone number on POS booking terminal",
        "2. System displays active customer package balance (e.g. 24 Shirts remaining)",
        "3. Cashier adds shirts to order; package credits auto-deduct first",
        "4. Line item price changes to ₹0 with package attribution flag",
        "5. Receipt prints remaining balance and package expiration date"
    ],
    ["Automated Package Credit Deduction", "Zero-Price Line Item Flag", "Package Balance Tracking", "Expiration Date Print"],
    target_sec=15
)

swash_s34 = add_screen(
    "swash", "customer_marketing", "9StffhC0lCU",
    "Swash SLS — Package Validity, Service Limits & Usage Policy",
    "Policy configuration for customer laundry packages in Swash SLS. Operators enforce validity durations, service-type exclusions, and maximum usage caps.",
    [
        "1. Open Package Policy configuration in SLS Admin",
        "2. Set validity duration (e.g. 30 days, 90 days, 1 year)",
        "3. Restrict package to specific fabric care categories (Wash & Iron only)",
        "4. Configure daily or weekly maximum redemption thresholds",
        "5. Protect store from rapid consumption during peak holiday rushes"
    ],
    ["Package Usage Policy", "Validity Duration Governance", "Service-Type Exclusions", "Consumption Rate Limiting"],
    target_sec=15
)

swash_s35 = add_screen(
    "swash", "admin_multi_store", "Amk2ZnNQr0s",
    "Swash SLS — Employee Access Control & Audit Security Settings",
    "Security administration in Swash SLS. Store owners monitor staff login activity, enforce terminal auto-lock timeouts, and configure audit logging for sensitive actions.",
    [
        "1. Open Security & Audit Settings in Swash Admin",
        "2. Configure terminal inactivity lock timeout (e.g. 5 minutes)",
        "3. Require supervisor PIN for order discounts exceeding 10%",
        "4. Log all bill reprint and bill cancellation actions with timestamps",
        "5. Review monthly security audit trail to prevent counter fraud"
    ],
    ["Terminal Inactivity Auto-Lock", "Supervisor Authorization PIN", "Bill Cancellation Audit", "Counter Fraud Prevention"],
    target_sec=15
)

swash_s36 = add_screen(
    "swash", "hardware_ecosystem", "8gyGWCXjHKk",
    "Swash SLS — Tag Printer Calibration & Sensor Sensitivity Tuning",
    "Technical calibration guide for thermal tag printer gap sensors in Swash SLS. Ensures exact label positioning between continuous garment tags without skipping or misprints.",
    [
        "1. Open Printer Diagnostics utility on POS computer",
        "2. Calibrate optical gap sensor for thermal resin tag roll",
        "3. Adjust black mark threshold and tear-off position",
        "4. Perform continuous feed test across 10 sequential garment labels",
        "5. Lock sensor settings to prevent paper jams during counter rushes"
    ],
    ["Optical Gap Sensor Calibration", "Black Mark Sensitivity", "Tear-Off Position Alignment", "Zero Paper Jam Tuning"],
    target_sec=20
)

swash_s37 = add_screen(
    "swash", "hardware_ecosystem", "e31tAkxSGvQ",
    "Swash SLS — Tag Printer Maintenance & Thermal Head Cleaning",
    "Preventative hardware maintenance tutorial for Swash thermal tag printers. Demonstrates cleaning thermal printheads, tension rollers, and barcode test scanning.",
    [
        "1. Power off printer and open printhead mechanism",
        "2. Clean thermal heating line using isopropyl alcohol swab",
        "3. Wipe platen roller to remove adhesive residue and fabric lint",
        "4. Inspect ribbon rewind core for smooth tension",
        "5. Print diagnostic barcode test pattern to verify sharp 203 DPI contrast"
    ],
    ["Thermal Printhead Maintenance", "Platen Roller Cleaning", "Ribbon Tension Optimization", "203 DPI Contrast Verification"],
    target_sec=20
)
'''

with open("tools/video_pipeline/build_full_dataset.py", "r", encoding="utf-8") as f:
    code = f.read()

# Locate where to insert the new screens: right before "print(f'Total showcase screens compiled: {len(screens)}')"
target = "print(f\"Total showcase screens compiled: {len(screens)}\")"
if target in code:
    code = code.replace(target, new_screens_code + "\n" + target)
    with open("tools/video_pipeline/build_full_dataset.py", "w", encoding="utf-8") as f:
        f.write(code)
    print("Successfully injected 32 additional screens into build_full_dataset.py")
else:
    print("Error: Target anchor not found!")
    sys.exit(1)
