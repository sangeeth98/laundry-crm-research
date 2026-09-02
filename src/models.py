"""
Pydantic v2 Data Models for B2B Laundry CRM Market Intelligence.
Validates 51 global and Indian platforms across 12 granular research dimensions.
"""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict
import re

class VerifiedSource(BaseModel):
    """Grounded source citation proving factual provenance of claims."""
    type: str = Field(description="Category of source: Registry, Official, Venture, Association, Press, Directory")
    citation: str = Field(description="Exact reference, CIN/file number, or publication title")

class MarketPenetration(BaseModel):
    """Dimension 1: Geographic footprint and ISO country penetration."""
    country_count: int = Field(ge=1, description="Total number of countries active")
    country_codes: List[str] = Field(description="Exhaustive ISO-3166-1 alpha-2 country codes")
    countries_list: List[str] = Field(description="Full English country names")
    penetration_details: str = Field(description="Market share, store counts, and geographic concentration")

    @field_validator("country_codes")
    @classmethod
    def validate_iso_codes(cls, v: List[str]) -> List[str]:
        for code in v:
            if not re.match(r"^[A-Z]{2}$", code):
                raise ValueError(f"Invalid ISO-3166-1 alpha-2 code: '{code}'. Must be 2 uppercase letters.")
        return v

class FounderHistory(BaseModel):
    """Dimension 3: Educational background, career trajectory, life principles, and expansion focus."""
    pedigree_education: str = Field(description="Alma mater, degrees, and academic pedigree")
    career_trajectory: str = Field(description="Prior roles, executive history, and founding background")
    life_operating_principles: str = Field(description="Core operating mantras, business values, and philosophy")
    latest_strategic_focus: str = Field(description="Recent expansion focus, public insights, podcasts, and initiatives")
    other_ventures_board_seats: str = Field(description="Other companies, board seats, or industry association roles")

class RevenueTrajectory(BaseModel):
    """Dimension 4: Multi-year annual revenue figures and growth drivers."""
    past_years: Dict[str, str] = Field(description="Annual revenue by fiscal year (e.g. FY22, FY23, FY24, FY25)")
    growth_drivers: str = Field(description="Core drivers of top-line expansion and revenue mechanics")

class EmployeeCount(BaseModel):
    """Dimension 5: Current team size and historical growth trajectory."""
    current: int = Field(ge=0, description="Current full-time employee headcount (2025/2026)")
    historical_trend: str = Field(description="Headcount evolution timeline and office locations")

class SiteLinks(BaseModel):
    """Dimension 9: Active and passive web links."""
    active: List[str] = Field(description="Live official website and web app URLs")
    passive_support: Optional[List[str]] = Field(default=[], description="Support portals, knowledge bases, or archived links")

class MarketingStrategies(BaseModel):
    """Dimension 10: Go-to-market channels (digital, offline, associations)."""
    digital: str = Field(description="Google Ads, Meta/Instagram, SEO, YouTube tutorials, podcasts")
    door_to_door_offline: str = Field(description="Field sales, expos (Clean India, Clean Show), conferences")
    directories_partners: str = Field(description="B2B directories (SoftwareSuggest, Capterra, IndiaMART) and hardware partners")

class PricingTier(BaseModel):
    """Granular tier breakdown within Dimension 11."""
    tier_name: str = Field(description="Name of the pricing plan (e.g. Starter, Standard, Pro, Enterprise)")
    price: str = Field(description="Exact price string in USD, INR, or EUR with billing interval")
    target: str = Field(description="Target customer segment for this specific tier")
    features: str = Field(description="Detailed itemized feature list included in this plan")

class PricingData(BaseModel):
    """Dimension 11: Pricing models and feature tiers."""
    model: str = Field(description="Overarching pricing model (Monthly SaaS, Perpetual, Hardware Bundle, Franchise)")
    tiers: List[PricingTier] = Field(default=[], description="Structured pricing tiers with feature descriptions")

class ActualRevenueDataPoint(BaseModel):
    """Actual grounded financial data point acquired from public records, regulatory filings, or executive disclosures."""
    reported_figure: str = Field(description="Exact reported revenue string (e.g. '₹35.0 Cr', '$30.0M ARR', '€22.0M')")
    period: str = Field(description="Exact reporting period or fiscal year of the filing (e.g. 'FY24', 'FY23', '2024')")
    source_authority: str = Field(description="Filing authority or registry (e.g. 'Ministry of Corporate Affairs (MCA)', 'SEC EDGAR', 'Companies House UK')")
    source_citation: str = Field(description="Full legal citation with CIN, registration number, or official disclosure")
    is_audited_filing: bool = Field(default=True, description="Whether figure is backed by an official government registrar or SEC filing")

class StrategicStory(BaseModel):
    """Dimension 12: Success flywheel or failure post-mortem, and CRM lessons."""
    success_or_failure_analysis: str = Field(description="Why the platform succeeded or why it shut down/pivoted")
    vulnerabilities_lessons: str = Field(description="Competitor vulnerabilities and actionable takeaways for our CRM")

class CompanyDossier(BaseModel):
    """Master entity model representing all 12 dimensions + grounded evidence."""
    model_config = ConfigDict(extra="ignore")

    id: str = Field(description="Unique snake_case identifier")
    name: str = Field(description="Brand and product name")
    legal_entity: str = Field(description="Dimension 2: Corporate legal entity name")
    tier: int = Field(ge=1, le=3, description="1: Indian SaaS, 2: Global SaaS, 3: Indian Chains/Pivots")
    tier_label: str = Field(description="Human-readable tier classification")
    
    # Normalized Categories & Metrics
    status_category: str = Field(default="active", description="Normalized status: active, acquired, pivoted, defunct")
    business_model_category: str = Field(default="saas_subscription", description="Normalized model: saas_subscription, perpetual_license, hardware_bundled, franchise, hub_industrial, custom_erp, consumer_aggregator_pivot")
    starter_price_usd: float = Field(default=0.0, ge=0.0, description="Normalized starter price in USD per month")
    est_revenue_usd_m: float = Field(default=0.0, ge=0.0, description="Normalized annual revenue in USD millions for charts")

    # Actual Grounded Revenue Data Point
    actual_revenue: Optional[ActualRevenueDataPoint] = Field(default=None, description="Actual reported financial data point acquired from public records/filings")

    # 12 Research Dimensions
    market: MarketPenetration = Field(description="Dimension 1: Geographic penetration")
    founders: List[str] = Field(description="Dimension 2: Founder and executive leadership names")
    founder_history: FounderHistory = Field(description="Dimension 3: Pedigree, career, and philosophy")
    revenue: RevenueTrajectory = Field(description="Dimension 4: Multi-year revenue")
    employee_count: EmployeeCount = Field(description="Dimension 5: Headcount metrics")
    start_date: str = Field(description="Dimension 6: Inception date/year")
    end_date: str = Field(description="Dimension 7: Operational status or transition date")
    demo_links: List[str] = Field(description="Dimension 8: Product demos and walkthrough links")
    site_links: SiteLinks = Field(description="Dimension 9: Active and passive domains")
    marketing_strategies: MarketingStrategies = Field(description="Dimension 10: GTM playbooks")
    pricing: PricingData = Field(description="Dimension 11: Pricing tiers and features")
    strategic_story: StrategicStory = Field(description="Dimension 12: Success/failure analysis and CRM lessons")
    
    # Grounded Evidence
    sources: List[VerifiedSource] = Field(default=[], description="Verified source citations")

class LaundryCRMIntelligenceReport(BaseModel):
    """Root model holding the entire 51-company competitive intelligence ecosystem."""
    companies: List[CompanyDossier]

    def count(self) -> int:
        return len(self.companies)

    def by_tier(self, tier: int) -> List[CompanyDossier]:
        return [c for c in self.companies if c.tier == tier]

    def by_status(self, status: str) -> List[CompanyDossier]:
        return [c for c in self.companies if c.status_category.lower() == status.lower()]

    def get_country_frequency(self) -> Dict[str, int]:
        """Aggregate country penetration counts across all platforms."""
        freq: Dict[str, int] = {}
        for c in self.companies:
            for code in c.market.country_codes:
                freq[code] = freq.get(code, 0) + 1
        return dict(sorted(freq.items(), key=lambda x: x[1], reverse=True))

    def get_tier_breakdown(self) -> Dict[str, int]:
        breakdown = {
            "Tier 1: Indian Native SaaS": len(self.by_tier(1)),
            "Tier 2: Global SaaS Benchmarks": len(self.by_tier(2)),
            "Tier 3: Indian Chains & Consolidators": len(self.by_tier(3))
        }
        return breakdown

    def get_status_breakdown(self) -> Dict[str, int]:
        counts = {}
        for c in self.companies:
            counts[c.status_category] = counts.get(c.status_category, 0) + 1
        return counts
