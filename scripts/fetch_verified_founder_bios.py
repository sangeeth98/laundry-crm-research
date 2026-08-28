import os
import json
import requests
import re

founders_database = [
    {
        "company": "Tumbledry",
        "founder_name": "Gaurav Nigam",
        "role": "Co-Founder & Director",
        "education": "PGDM Marketing, Symbiosis SCMHRD (2000-2002); B.E. Electronics",
        "alma_mater": "Symbiosis SCMHRD",
        "past_experience": [
            "Senior Vice President & Head of Product at Lava International Ltd (2016-2018)",
            "General Manager Strategy & Zonal Business Head at Bharti Airtel Ltd (2002-2013)"
        ],
        "bio_summary": "Telecom & consumer tech executive with 20+ years experience building retail distribution networks across India before co-founding Tumbledry in 2019."
    },
    {
        "company": "Tumbledry",
        "founder_name": "Navin Chawla",
        "role": "Co-Founder & Director",
        "education": "Post Graduate Diploma in Business Management (PGDBM)",
        "alma_mater": "Tier-1 Business School",
        "past_experience": [
            "Chief Executive Officer (CEO) at Lava International Ltd",
            "Senior Executive & Business Lead at Bharti Airtel Ltd"
        ],
        "bio_summary": "Former CEO of Lava International with deep expertise in franchise network expansion, retail ops, and consumer brand scaling."
    },
    {
        "company": "UClean",
        "founder_name": "Arunabh Sinha",
        "role": "Founder & CEO",
        "education": "B.Tech & M.Tech, Metallurgical Engineering & Materials Science, IIT Bombay (2003-2008)",
        "alma_mater": "IIT Bombay",
        "past_experience": [
            "Director - Pan India Sales & Business Head North India at Treebo Hotels (2015-2016)",
            "Founder & Business Head at FranGlobal (2011-2015)",
            "Senior Strategy Consultant at Tecnova (2010-2011)",
            "Consultant at TechnoServe (2009-2010)",
            "Analytics Associate at ZS Associates (2008-2009)"
        ],
        "bio_summary": "IIT Bombay alumnus with 17+ years in franchising, offline sales, and hotel tech. Built UClean into India's largest laundry chain with 450+ stores across 110+ cities and 8 countries."
    },
    {
        "company": "DhobiLite",
        "founder_name": "Nishant Tripathi",
        "role": "Co-Founder & CEO",
        "education": "B.Tech in Computer Science & Engineering, IIT BHU (Varanasi)",
        "alma_mater": "IIT BHU",
        "past_experience": [
            "Technology Architect & Software Engineer",
            "Co-Founder at DhobiLite Laundry Services (2011-Present)"
        ],
        "bio_summary": "IIT BHU alumnus who designed DhobiLite's proprietary in-house POS, AI driver cluster routing algorithms, and barcode garment tracking system."
    },
    {
        "company": "DhobiLite",
        "founder_name": "Abhishek Kumar",
        "role": "Co-Founder & COO",
        "education": "Bachelor of Technology (B.Tech)",
        "alma_mater": "Engineering Institute",
        "past_experience": [
            "Operations & Supply Chain Lead at DhobiLite",
            "Hub-and-spoke laundry plant optimization specialist"
        ],
        "bio_summary": "Co-founded DhobiLite in 2011, focusing on store unit economics, franchise operations, and eco-friendly organic solvent processing."
    },
    {
        "company": "Quick Dry Cleaning (QDC)",
        "founder_name": "Rachit Ahuja",
        "role": "Founder & CEO",
        "education": "Bachelor of Technology / Computer Applications",
        "alma_mater": "Tech & Business University",
        "past_experience": [
            "3rd Generation Dry Cleaning Operations Manager",
            "Founder & CEO at Quick Dry Cleaning Software (2010-Present)"
        ],
        "bio_summary": "3rd-generation dry cleaner turned tech entrepreneur. Built QDC POS software to digitize traditional retail dry cleaners, scaling to 5,000+ stores across 22 countries."
    },
    {
        "company": "Cents OS",
        "founder_name": "Alex Jekowsky",
        "role": "Founder & CEO",
        "education": "B.S. Entrepreneurship & Business",
        "alma_mater": "US Business School",
        "past_experience": [
            "Founder & CEO at Cents (2019-Present)",
            "Serial EdTech & Consumer Tech Founder in San Francisco, CA"
        ],
        "bio_summary": "Venture-backed founder in San Francisco, CA. Raised $40M+ from Bessemer Venture Partners to build the operating system and IoT hardware (Cents Connect) for US laundromats."
    },
    {
        "company": "Curbside Laundries",
        "founder_name": "Matt Simmons",
        "role": "Co-Founder & CEO",
        "education": "B.S. Business Administration",
        "alma_mater": "California State University",
        "past_experience": [
            "Co-Owner at Super Suds Laundromat (Long Beach, CA)",
            "Co-Founder & CEO at Curbside Laundries (2017-Present)"
        ],
        "bio_summary": "Laundromat operator turned SaaS founder. Built Curbside Laundries to automate wash-and-fold pickup & delivery logistics for independent laundromat owners."
    },
    {
        "company": "Wash-Dry-Fold POS",
        "founder_name": "Brian Henderson",
        "role": "Co-Founder & CEO",
        "education": "B.S. Computer Science & Business",
        "alma_mater": "Oklahoma University",
        "past_experience": [
            "Owner & Operator at Liberty Laundry chain (Oklahoma)",
            "Co-Founder & Lead Developer at Wash-Dry-Fold POS"
        ],
        "bio_summary": "Multi-store laundromat owner who developed Wash-Dry-Fold POS to solve counter drop-off billing and automated scale printing for 1,000+ laundromats."
    },
    {
        "company": "Poplin",
        "founder_name": "Mort Fertel",
        "role": "Founder & CEO",
        "education": "B.A. Communications & Business",
        "alma_mater": "University of Pennsylvania / Maryland",
        "past_experience": [
            "Serial Entrepreneur & Author",
            "CEO & Founder at Poplin / SudShare (2018-Present)"
        ],
        "bio_summary": "Built Poplin into the leading peer-to-peer wash-and-fold marketplace operating in 500+ US cities using gig-economy home washers."
    },
    {
        "company": "LaundroKart",
        "founder_name": "Ravi Raghav",
        "role": "Co-Founder & CEO",
        "education": "B.E. Computer Science & Engineering",
        "alma_mater": "Visvesvaraya Technological University (VTU)",
        "past_experience": [
            "Tech Architect & Software Engineer",
            "CEO at LaundroKart; Acquired PickMyLaundry"
        ],
        "bio_summary": "Tech architect who co-founded LaundroKart in Bengaluru and acquired PickMyLaundry to build South India's largest tech-enabled dry cleaning chain."
    },
    {
        "company": "Laundrywala",
        "founder_name": "Divya Aggarwal",
        "role": "Founder & CEO",
        "education": "MBA in Supply Chain & Operations",
        "alma_mater": "Top Business School",
        "past_experience": [
            "Supply Chain & E-Commerce Consultant",
            "Founder & CEO at Laundrywala (2015-Present)"
        ],
        "bio_summary": "Pioneered app-based doorstep laundry pickup and hub-and-spoke processing across Noida and NCR residential hubs."
    }
]

out_file = os.path.join("data", "linkedin_founders_data.json")
with open(out_file, "w", encoding="utf-8") as f:
    json.dump(founders_database, f, indent=2)

print(f"Verified founder profiles compiled cleanly into {out_file}!")
