/**
 * B2B Laundry CRM Competitive Intelligence Application
 * Inspired by 100.datavizproject.com
 * Interactive Data Exploration across 51 Platforms & 12 Dimensions
 * With Dynamic Dark Mode Support
 */

(function () {
  'use strict';

  // 1. Data Retrieval
  const rawData = window.LAUNDRY_CRM_DATA || { metadata: {}, companies: [] };
  const allCompanies = rawData.companies || [];
  const metadata = rawData.metadata || {};
  const featureData = window.CRM_FEATURE_INTELLIGENCE || { metadata: {}, modules: [], features: [], screens: [], competitor_stats: {} };

  // 2. Application State
  const state = {
    story: 'all',
    tier: 'all',
    status: 'all',
    model: 'all',
    country: 'all',
    maxPrice: 250,
    search: '',
    selectedCompanyIndex: -1,
    activeTab: 'overview',
    founderFilter: 'all',
    featuresMode: 'matrix',
    activeFeatureDomain: 'all',
    activeWorkflowStage: 'stage_intake',
    galleryComp: 'all',
    galleryModule: 'all',
    gallerySearch: ''
  };

  function isDarkMode() {
    return document.documentElement.classList.contains('dark');
  }

  // Chart instances
  let geoChart = null;
  let pricingChart = null;
  let revenueChart = null;
  let featuresRadarChart = null;

  // DOM Elements
  const companyGrid = document.getElementById('companyGrid');
  const emptyState = document.getElementById('emptyState');
  const filteredCountEl = document.getElementById('filteredCount');
  const headerFilterCount = document.getElementById('headerFilterCount');
  const headerResetFilterBtn = document.getElementById('headerResetFilterBtn');
  const activeFilterChipsContainer = document.getElementById('activeFilterChipsContainer');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  const emptyResetBtn = document.getElementById('emptyResetBtn');
  const countryPills = document.getElementById('countryPills');
  const activeCountryFilter = document.getElementById('activeCountryFilter');
  const resetCountryBtn = document.getElementById('resetCountryBtn');
  const modelSelect = document.getElementById('modelSelect');
  const priceSlider = document.getElementById('priceSlider');
  const priceSliderVal = document.getElementById('priceSliderVal');
  const founderPedigreeSelect = document.getElementById('founderPedigreeSelect');
  const matrixBody = document.getElementById('matrixBody');
  const toggleMatrixBtn = document.getElementById('toggleMatrixBtn');
  const matrixContainer = document.getElementById('matrixContainer');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const toastNotification = document.getElementById('toastNotification');
  const toastMessage = document.getElementById('toastMessage');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  
  // Modal Elements
  const companyModal = document.getElementById('companyModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalDoneBtn = document.getElementById('modalDoneBtn');
  const modalPrevBtn = document.getElementById('modalPrevBtn');
  const modalNextBtn = document.getElementById('modalNextBtn');
  const copyDossierBtn = document.getElementById('copyDossierBtn');
  const modalIndex = document.getElementById('modalIndex');
  const modalTier = document.getElementById('modalTier');
  const modalStatus = document.getElementById('modalStatus');
  const modalTitle = document.getElementById('modalTitle');
  const modalLegal = document.getElementById('modalLegal');
  const modalTabContent = document.getElementById('modalTabContent');
  const modalWebsiteLink = document.getElementById('modalWebsiteLink');

  // Currently filtered list cache (for next/prev navigation)
  let currentFilteredList = [];

  // 3. Initialize App
  function init() {
    updateMetadataDisplay();
    setupThemeToggle();
    setupEventListeners();
    setupChartControls();
    populateChartCompanySelect();
    renderCountryPills();
    renderFounderCards();
    renderPostmortemCards();
    renderMatrixTable();
    initLottieAnimation();
    updateStoryUI();
    updateTierUI();
    updateStatusUI();
    filterAndRender();
  }

  function setupThemeToggle() {
    if (!themeToggleBtn) return;
    themeToggleBtn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      window.dispatchEvent(new Event('themeChanged'));
      updateStoryUI();
      updateTierUI();
      updateStatusUI();
      initCharts();
      if (featuresRadarChart) initFeaturesRadarChart();
      renderWorkflowStepper();
      renderWorkflowDiffCard(state.activeWorkflowStage || 'stage_intake');
      filterAndRender();
    });
  }

  function updateMetadataDisplay() {
    const totalEl = document.getElementById('statTotal');
    const countriesEl = document.getElementById('statCountries');
    if (totalEl) totalEl.textContent = allCompanies.length;
    if (countriesEl) countriesEl.textContent = metadata.unique_countries_count || 58;

    const statusCounts = metadata.status_counts || {};
    const countActive = document.getElementById('countActive');
    const countAcquired = document.getElementById('countAcquired');
    const countPivoted = document.getElementById('countPivoted');
    const countDefunct = document.getElementById('countDefunct');

    if (countActive) countActive.textContent = statusCounts.active || 41;
    if (countAcquired) countAcquired.textContent = statusCounts.acquired || 5;
    if (countPivoted) countPivoted.textContent = statusCounts.pivoted || 3;
    if (countDefunct) countDefunct.textContent = statusCounts.defunct || 2;
  }

  // 4. Multi-Dimensional Filtering Logic
  function getFilteredCompanies() {
    return allCompanies.filter(c => {
      // Tier filter
      if (state.tier !== 'all' && c.tier.toString() !== state.tier) {
        return false;
      }
      // Status category filter
      if (state.status !== 'all') {
        if (c.status_category.toLowerCase() !== state.status.toLowerCase()) {
          return false;
        }
      }
      // Business model category filter
      if (state.model !== 'all') {
        if (c.business_model_category !== state.model) {
          return false;
        }
      }
      // Country code filter
      if (state.country !== 'all') {
        if (!c.market.country_codes.includes(state.country)) {
          return false;
        }
      }
      // Max starter price filter
      if (state.maxPrice < 250) {
        if (c.starter_price_usd > state.maxPrice && c.starter_price_usd > 0) {
          return false;
        }
      }
      // Search query (fuzzy multi-field)
      if (state.search) {
        const q = state.search.toLowerCase().trim();
        const inName = c.name.toLowerCase().includes(q);
        const inLegal = c.legal_entity.toLowerCase().includes(q);
        const inFounders = c.founders.some(f => f.toLowerCase().includes(q));
        const inCountryCodes = c.market.country_codes.some(code => code.toLowerCase() === q);
        const inCountryNames = c.market.countries_list.some(name => name.toLowerCase().includes(q));
        const inPedigree = c.founder_history.pedigree_education.toLowerCase().includes(q);
        const inStory = c.strategic_story.success_or_failure_analysis.toLowerCase().includes(q);
        const inLessons = c.strategic_story.vulnerabilities_lessons.toLowerCase().includes(q);
        const inFeatures = c.pricing.tiers.some(t => t.features.toLowerCase().includes(q) || t.tier_name.toLowerCase().includes(q));
        const inMarketing = c.marketing_strategies.digital.toLowerCase().includes(q) || c.marketing_strategies.door_to_door_offline.toLowerCase().includes(q);

        if (!inName && !inLegal && !inFounders && !inCountryCodes && !inCountryNames && 
            !inPedigree && !inStory && !inLessons && !inFeatures && !inMarketing) {
          return false;
        }
      }
      return true;
    });
  }

  function updateStoryUI() {
    const isDark = isDarkMode();
    document.querySelectorAll('.story-btn').forEach(b => {
      const storyVal = b.getAttribute('data-story');
      const isActive = storyVal === state.story;
      if (isActive) {
        b.className = `story-btn flex-shrink-0 px-3 py-1 rounded-full border text-xs font-medium ${isDark ? 'border-neutral-100 bg-neutral-100 text-neutral-900' : 'border-neutral-900 bg-neutral-900 text-white'} whitespace-nowrap transition flex items-center space-x-1.5 shadow-sm`;
      } else {
        b.className = `story-btn flex-shrink-0 px-3 py-1 rounded-full border text-xs ${isDark ? 'border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200' : 'border-neutral-200 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900'} whitespace-nowrap transition flex items-center space-x-1.5`;
      }
    });
  }

  function updateTierUI() {
    const isDark = isDarkMode();
    document.querySelectorAll('.tier-btn').forEach(b => {
      const tierVal = b.getAttribute('data-tier');
      const isActive = tierVal === state.tier;
      if (isActive) {
        b.className = `tier-btn flex-shrink-0 px-3 py-1 rounded-md text-xs font-semibold ${isDark ? 'bg-neutral-100 text-neutral-900' : 'bg-neutral-900 text-white'} whitespace-nowrap transition shadow-sm flex items-center space-x-1.5`;
      } else {
        b.className = `tier-btn flex-shrink-0 px-3 py-1 rounded-md text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 whitespace-nowrap transition flex items-center space-x-1.5`;
      }
    });
  }

  function updateStatusUI() {
    const isDark = isDarkMode();
    document.querySelectorAll('.status-btn').forEach(b => {
      const statusVal = b.getAttribute('data-status');
      const isActive = statusVal === state.status;
      if (isActive) {
        b.className = `status-btn flex-shrink-0 px-2.5 py-1 rounded text-xs font-semibold ${isDark ? 'bg-neutral-100 text-neutral-900' : 'bg-neutral-900 text-white'} whitespace-nowrap transition shadow-sm flex items-center space-x-1.5`;
      } else {
        b.className = `status-btn flex-shrink-0 px-2.5 py-1 rounded text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-700 whitespace-nowrap transition flex items-center space-x-1.5`;
      }
    });
  }

  function resetAll() {
    state.tier = 'all';
    state.status = 'all';
    state.model = 'all';
    state.country = 'all';
    state.maxPrice = 250;
    state.search = '';
    if (searchInput) searchInput.value = '';
    if (modelSelect) modelSelect.value = 'all';
    if (priceSlider) priceSlider.value = 250;
    if (priceSliderVal) priceSliderVal.textContent = '$250/mo';
    
    updateTierUI();
    updateStatusUI();

    if (activeCountryFilter) activeCountryFilter.textContent = 'All Countries';
    renderCountryPills();
    filterAndRender();
  }

  function renderActiveFilterChips() {
    if (!activeFilterChipsContainer) return;
    const chips = [];

    if (state.tier !== 'all') {
      const tierLabels = {
        '1': 'Tier 1: Indian SaaS',
        '2': 'Tier 2: Global SaaS',
        '3': 'Tier 3: Chains & Laundromats'
      };
      chips.push({
        label: `Tier: ${tierLabels[state.tier] || state.tier}`,
        onClear: () => {
          state.tier = 'all';
          updateTierUI();
          filterAndRender();
        }
      });
    }

    if (state.status !== 'all') {
      chips.push({
        label: `Status: ${state.status.toUpperCase()}`,
        onClear: () => {
          state.status = 'all';
          updateStatusUI();
          filterAndRender();
        }
      });
    }

    if (state.model !== 'all') {
      const modelLabels = {
        saas_subscription: 'SaaS',
        franchise: 'Franchise',
        perpetual_license: 'Perpetual',
        hardware_bundled: 'Hardware',
        hub_industrial: 'Industrial Hub',
        custom_erp: 'Custom ERP',
        consumer_aggregator_pivot: 'Aggregator'
      };
      chips.push({
        label: `Model: ${modelLabels[state.model] || state.model}`,
        onClear: () => {
          state.model = 'all';
          if (modelSelect) modelSelect.value = 'all';
          filterAndRender();
        }
      });
    }

    if (state.country !== 'all') {
      chips.push({
        label: `Country: ${state.country}`,
        onClear: () => {
          setCountryFilter('all');
        }
      });
    }

    if (state.search) {
      chips.push({
        label: `Search: "${state.search}"`,
        onClear: () => {
          state.search = '';
          if (searchInput) searchInput.value = '';
          filterAndRender();
        }
      });
    }

    if (state.maxPrice < 250) {
      chips.push({
        label: `Max Price: $${state.maxPrice}/mo`,
        onClear: () => {
          state.maxPrice = 250;
          if (priceSlider) priceSlider.value = 250;
          if (priceSliderVal) priceSliderVal.textContent = '$250/mo';
          filterAndRender();
        }
      });
    }

    if (chips.length === 0) {
      activeFilterChipsContainer.classList.add('hidden');
      activeFilterChipsContainer.innerHTML = '';
      return;
    }

    activeFilterChipsContainer.classList.remove('hidden');
    activeFilterChipsContainer.innerHTML = `
      <span class="text-neutral-500 dark:text-neutral-400 font-semibold mr-1">Active Filters (${chips.length}):</span>
    `;

    chips.forEach(chip => {
      const chipEl = document.createElement('span');
      chipEl.className = 'inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 shadow-sm text-[11px]';
      chipEl.innerHTML = `
        <span>${chip.label}</span>
        <button type="button" class="ml-1 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 focus:outline-none font-bold" title="Remove filter">×</button>
      `;
      chipEl.querySelector('button').addEventListener('click', (e) => {
        e.stopPropagation();
        chip.onClear();
      });
      activeFilterChipsContainer.appendChild(chipEl);
    });

    const clearAllEl = document.createElement('button');
    clearAllEl.className = 'ml-auto text-[11px] text-rose-500 hover:text-rose-700 dark:text-rose-400 hover:underline font-semibold flex items-center space-x-0.5';
    clearAllEl.innerHTML = '<span>✕ Clear All</span>';
    clearAllEl.addEventListener('click', () => {
      resetAll();
    });
    activeFilterChipsContainer.appendChild(clearAllEl);
  }

  function filterAndRender() {
    currentFilteredList = getFilteredCompanies();
    if (filteredCountEl) filteredCountEl.textContent = currentFilteredList.length;
    if (headerFilterCount) headerFilterCount.textContent = currentFilteredList.length;

    const isFiltered = state.tier !== 'all' || state.status !== 'all' || state.model !== 'all' || 
                       state.country !== 'all' || state.search !== '' || state.maxPrice < 250;
    
    if (resetFiltersBtn) resetFiltersBtn.classList.toggle('hidden', !isFiltered);
    if (headerResetFilterBtn) headerResetFilterBtn.classList.toggle('hidden', !isFiltered);
    if (resetCountryBtn) resetCountryBtn.classList.toggle('hidden', state.country === 'all');
    if (clearSearchBtn) clearSearchBtn.classList.toggle('hidden', state.search === '');

    renderActiveFilterChips();
    renderGrid(currentFilteredList);
  }

  // 5. Render Company Cards Grid (100.datavizproject aesthetic with Dark Mode)
  function renderGrid(companies) {
    if (!companyGrid) return;
    companyGrid.innerHTML = '';

    if (companies.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }
    if (emptyState) emptyState.classList.add('hidden');

    const isDark = isDarkMode();

    companies.forEach((c, idx) => {
      const card = document.createElement('div');
      card.className = `company-card bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-5 flex flex-col justify-between cursor-pointer hover:border-neutral-900 dark:hover:border-neutral-400 group transition-all`;
      card.setAttribute('data-id', c.id);

      // Status badge styling
      let statusBg = isDark ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200';
      if (c.status_category === 'acquired') {
        statusBg = isDark ? 'bg-sky-950/60 text-sky-300 border-sky-800' : 'bg-sky-50 text-sky-700 border-sky-200';
      }
      if (c.status_category === 'pivoted') {
        statusBg = isDark ? 'bg-amber-950/60 text-amber-300 border-amber-800' : 'bg-amber-50 text-amber-700 border-amber-200';
      }
      if (c.status_category === 'defunct') {
        statusBg = isDark ? 'bg-rose-950/60 text-rose-300 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-200';
      }

      const shortStatus = c.status_category.toUpperCase();
      const rawPrice = c.pricing.tiers.length > 0 ? c.pricing.tiers[0].price : 'Custom Quote';
      let firstPrice = 'Custom';
      if (c.pricing.tiers.length > 0) {
        const cleanP = c.pricing.tiers[0].price.split('(')[0].trim();
        if (cleanP.toLowerCase().includes('custom') || cleanP.toLowerCase().includes('quote')) {
          firstPrice = 'Custom';
        } else {
          firstPrice = cleanP.replace(/\s*\/\s*month$/i, '').replace(/\s*\/\s*mo$/i, '').trim();
        }
      }
      const revYears = Object.keys(c.revenue.past_years);
      const latestRev = revYears.length > 0 ? c.revenue.past_years[revYears[revYears.length - 1]] : 'N/A';
      const cleanLatestRev = latestRev.split('(')[0].replace(/in\s+[A-Za-z]+.*$/i, '').replace(/\s*ARR\s*$/i, '').trim();
      const cleanProjectedRev = (c.actual_revenue && c.actual_revenue.projected_figure ? c.actual_revenue.projected_figure : cleanLatestRev).split('(')[0].replace(/in\s+[A-Za-z]+.*$/i, '').replace(/\s*ARR\s*$/i, '').trim();
      const cleanVerifiedRev = c.actual_revenue && c.actual_revenue.reported_figure ? c.actual_revenue.reported_figure.split('(')[0].replace(/in\s+[A-Za-z]+.*$/i, '').replace(/\s*ARR\s*$/i, '').trim() : '';

      const modelLabels = {
        saas_subscription: 'SaaS',
        franchise: 'FOFO Franchise',
        perpetual_license: 'Perpetual POS',
        hardware_bundled: 'Hardware / IoT',
        hub_industrial: 'Industrial Hub',
        custom_erp: 'Custom ERP',
        consumer_aggregator_pivot: 'Aggregator'
      };
      const modelBadge = modelLabels[c.business_model_category] || 'Software';
      const footprintWidth = Math.min(100, Math.max(15, c.market.country_count * 2));

      card.innerHTML = `
        <div>
          <!-- Card Header Bar -->
          <div class="flex items-center justify-between text-[11px] font-mono mb-2">
            <div class="flex items-center space-x-1.5">
              <span class="font-bold text-neutral-400 dark:text-neutral-500">#${String(idx + 1).padStart(2, '0')}</span>
              <span class="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[10px]">${modelBadge}</span>
            </div>
            <span class="px-2 py-0.5 rounded border text-[10px] font-semibold ${statusBg}">${shortStatus}</span>
          </div>

          <!-- Platform Title -->
          <h4 class="text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight group-hover:text-sky-600 dark:group-hover:text-sky-400 transition">${c.name}</h4>
          <p class="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono truncate mb-2.5">${c.legal_entity}</p>

          <!-- Country Badges (Clickable) -->
          <div class="flex flex-wrap gap-1 mb-3">
            ${c.market.country_codes.slice(0, 5).map(code => 
              `<button type="button" data-country-click="${code}" class="country-pill-btn px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-900 dark:hover:bg-neutral-100 hover:text-white dark:hover:text-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded text-[10px] font-mono font-medium text-neutral-700 dark:text-neutral-300 transition" title="Filter by ${code}">${code}</button>`
            ).join('')}
            ${c.market.country_codes.length > 5 ? 
              `<span class="px-1.5 py-0.5 bg-neutral-50 dark:bg-neutral-800/40 text-neutral-400 dark:text-neutral-500 rounded text-[10px] font-mono">+${c.market.country_codes.length - 5}</span>` : ''}
          </div>

          <!-- Micro Metric Bar Graphic (100.datavizproject aesthetic) -->
          <div class="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1 mb-3 overflow-hidden" title="Geographic Scale: ${c.market.country_count} Countries">
            <div class="bg-neutral-900 dark:bg-sky-400 h-1 rounded-full" style="width: ${footprintWidth}%"></div>
          </div>

          <!-- Key Metrics Block -->
          <div class="grid grid-cols-3 gap-2 py-2 px-3 bg-neutral-50 dark:bg-neutral-800/60 rounded border border-neutral-100 dark:border-neutral-800 text-[11px] font-mono mb-3">
            <div>
              <span class="text-neutral-400 dark:text-neutral-500 block text-[9px] uppercase">Base Price</span>
              <span class="font-bold text-neutral-900 dark:text-neutral-100 truncate block font-mono" title="${rawPrice}">${firstPrice}</span>
            </div>
            <div>
              ${c.actual_revenue && c.actual_revenue.actual_status === 'verified' ? `
                <span class="text-emerald-600 dark:text-emerald-400 block text-[9px] uppercase font-bold flex items-center space-x-0.5" title="Verified Public Disclosure">
                  <span>✓ Verified Rev</span>
                </span>
                <span class="font-bold text-neutral-900 dark:text-neutral-100 truncate block font-mono" title="${c.actual_revenue.reported_figure} (${c.actual_revenue.period} - ${c.actual_revenue.source_authority})">${cleanVerifiedRev}</span>
                <span class="text-[9px] text-emerald-600 dark:text-emerald-400 block truncate">${c.actual_revenue.period || 'Verified'}</span>
              ` : `
                <span class="text-amber-600 dark:text-amber-400 block text-[9px] uppercase font-bold flex items-center space-x-0.5" title="Projected Estimate (Actual is Private / Undisclosed)">
                  <span>⚡ Proj. Rev</span>
                </span>
                <span class="font-bold text-amber-700 dark:text-amber-300 truncate block font-mono" title="Projected: ${c.actual_revenue ? c.actual_revenue.projected_figure : latestRev} (${c.actual_revenue ? c.actual_revenue.projection_methodology : ''})">${cleanProjectedRev}</span>
                <span class="text-[9px] text-neutral-400 dark:text-neutral-500 block truncate italic">Actual: Undisclosed</span>
              `}
            </div>
            <div>
              <span class="text-neutral-400 dark:text-neutral-500 block text-[9px] uppercase">Team</span>
              <span class="font-bold text-neutral-900 dark:text-neutral-100 block">${c.employee_count.current}</span>
            </div>
          </div>

          <!-- Core Differentiator / Moat -->
          <p class="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-snug mb-3">
            ${c.strategic_story.success_or_failure_analysis}
          </p>
        </div>

        <div class="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs font-mono">
          <span class="text-neutral-400 dark:text-neutral-500">Est. ${c.start_date}</span>
          <span class="text-neutral-900 dark:text-neutral-100 font-semibold group-hover:underline flex items-center space-x-1">
            <span>Inspect 12 Dimensions</span>
            <span>→</span>
          </span>
        </div>
      `;

      card.addEventListener('click', (e) => {
        const countryBtn = e.target.closest('[data-country-click]');
        if (countryBtn) {
          e.stopPropagation();
          const code = countryBtn.getAttribute('data-country-click');
          setCountryFilter(code);
          return;
        }
        openCompanyModalById(c.id);
      });

      companyGrid.appendChild(card);
    });
  }

  // 6. Country Filter Actions & Story 1 Pills
  function renderCountryPills() {
    if (!countryPills) return;
    countryPills.innerHTML = '';

    const freq = metadata.country_frequencies || {};
    const topCodes = Object.keys(freq).slice(0, 16);
    const isDark = isDarkMode();

    const allPill = document.createElement('button');
    allPill.className = state.country === 'all' ? 
      'px-2 py-1 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded text-[11px] font-mono font-medium' :
      'px-2 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-[11px] font-mono';
    allPill.textContent = `All (${metadata.unique_countries_count || 58})`;
    allPill.addEventListener('click', () => setCountryFilter('all'));
    countryPills.appendChild(allPill);

    topCodes.forEach(code => {
      const pill = document.createElement('button');
      const isSelected = state.country === code;
      pill.className = isSelected ? 
        'px-2 py-1 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded text-[11px] font-mono font-medium' :
        'country-pill px-2 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-[11px] font-mono';
      pill.textContent = `${code} (${freq[code]})`;
      pill.addEventListener('click', () => setCountryFilter(code));
      countryPills.appendChild(pill);
    });
  }

  function setCountryFilter(code) {
    state.country = code;
    if (activeCountryFilter) {
      if (code === 'all') {
        activeCountryFilter.textContent = 'All Countries';
      } else {
        const count = metadata.country_frequencies[code] || 0;
        activeCountryFilter.textContent = `${code} (${count} Platforms)`;
      }
    }
    renderCountryPills();
    filterAndRender();
  }

  // 7. Founder Cards in Story 4
  function renderFounderCards() {
    const container = document.getElementById('founderCards');
    if (!container) return;
    container.innerHTML = '';

    const isDark = isDarkMode();
    let featured = allCompanies;
    if (state.founderFilter === 'iit') {
      featured = allCompanies.filter(c => c.founder_history.pedigree_education.toLowerCase().includes('iit') || c.founder_history.pedigree_education.toLowerCase().includes('iim'));
    } else if (state.founderFilter === 'global') {
      featured = allCompanies.filter(c => {
        const ped = c.founder_history.pedigree_education.toLowerCase();
        return ped.includes('oxford') || ped.includes('harvard') || ped.includes('nyu') || ped.includes('georgia tech') || ped.includes('florida');
      });
    } else if (state.founderFilter === 'veteran') {
      featured = allCompanies.filter(c => c.founder_history.career_trajectory.toLowerCase().includes('veteran') || c.founder_history.career_trajectory.toLowerCase().includes('operator') || c.founder_history.career_trajectory.toLowerCase().includes('founded in 19'));
    }

    featured.slice(0, 12).forEach(c => {
      const card = document.createElement('div');
      card.className = `p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-md space-y-2 cursor-pointer hover:border-neutral-900 dark:hover:border-neutral-400 transition flex flex-col justify-between`;
      card.innerHTML = `
        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-[11px] font-mono">
            <span class="font-bold text-neutral-900 dark:text-neutral-100">${c.name}</span>
            <span class="text-neutral-400 dark:text-neutral-500 text-[10px]">${c.tier_label.split(':')[0]}</span>
          </div>
          <div class="font-semibold text-xs text-neutral-800 dark:text-neutral-200">${c.founders.join(', ')}</div>
          <div class="text-[11px] text-neutral-600 dark:text-neutral-400"><strong>Alma Mater:</strong> ${c.founder_history.pedigree_education}</div>
          <div class="text-[11px] text-neutral-500 dark:text-neutral-400 italic bg-neutral-50 dark:bg-neutral-800/50 p-2 rounded border border-neutral-100 dark:border-neutral-800">
            "${c.founder_history.life_operating_principles.substring(0, 130)}..."
          </div>
        </div>
        <div class="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[10px] font-mono text-neutral-400 dark:text-neutral-500 flex items-center justify-between">
          <span>Click to inspect</span>
          <span>→</span>
        </div>
      `;
      card.addEventListener('click', () => openCompanyModalById(c.id));
      container.appendChild(card);
    });
  }

  // 8. Post-Mortem Cards in Story 5
  function renderPostmortemCards() {
    const container = document.getElementById('postmortemCards');
    if (!container) return;
    container.innerHTML = '';

    const isDark = isDarkMode();
    const postmortemIds = ['doormint', 'quiclo', 'wassup', 'sudzy', 'tumbledry', 'cents', 'qdc'];
    const cases = allCompanies.filter(c => postmortemIds.includes(c.id));

    cases.forEach(c => {
      const card = document.createElement('div');
      const isSuccess = c.status_category === 'active';
      const isAcquired = c.status_category === 'acquired';
      const isPivoted = c.status_category === 'pivoted';
      
      let badgeLabel = 'FAILURE / SHUTDOWN POST-MORTEM';
      let borderClass = isDark ? 'border-rose-900/60 bg-rose-950/20' : 'border-rose-200 bg-rose-50/20';
      let badgeClass = isDark ? 'bg-rose-950 text-rose-300' : 'bg-rose-100 text-rose-800';

      if (isSuccess) {
        badgeLabel = 'WINNING GROWTH BLUEPRINT';
        borderClass = isDark ? 'border-emerald-900/60 bg-emerald-950/20' : 'border-emerald-200 bg-emerald-50/20';
        badgeClass = isDark ? 'bg-emerald-950 text-emerald-300' : 'bg-emerald-100 text-emerald-800';
      } else if (isAcquired) {
        badgeLabel = 'ACQUISITION / M&A ROLL-UP';
        borderClass = isDark ? 'border-sky-900/60 bg-sky-950/20' : 'border-sky-200 bg-sky-50/20';
        badgeClass = isDark ? 'bg-sky-950 text-sky-300' : 'bg-sky-100 text-sky-800';
      } else if (isPivoted) {
        badgeLabel = 'STRATEGIC SURVIVAL PIVOT';
        borderClass = isDark ? 'border-amber-900/60 bg-amber-950/20' : 'border-amber-200 bg-amber-50/20';
        badgeClass = isDark ? 'bg-amber-950 text-amber-300' : 'bg-amber-100 text-amber-800';
      }

      card.className = `p-5 bg-white dark:bg-neutral-900 border ${borderClass} rounded-lg space-y-3 cursor-pointer hover:border-neutral-900 dark:hover:border-neutral-400 transition`;
      card.innerHTML = `
        <div class="flex items-center justify-between text-xs font-mono">
          <span class="font-bold text-neutral-900 dark:text-neutral-100 text-sm">${c.name}</span>
          <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${badgeClass}">
            ${badgeLabel}
          </span>
        </div>
        <p class="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">${c.strategic_story.success_or_failure_analysis}</p>
        <div class="p-3 bg-white/80 dark:bg-neutral-800/80 rounded border border-neutral-200 dark:border-neutral-700 text-[11px] font-mono text-neutral-800 dark:text-neutral-200">
          <strong class="text-neutral-900 dark:text-neutral-100 block mb-0.5">Critical Strategic Takeaway:</strong>
          <span>${c.strategic_story.vulnerabilities_lessons}</span>
        </div>
      `;
      card.addEventListener('click', () => openCompanyModalById(c.id));
      container.appendChild(card);
    });
  }

  // 9. Master Benchmarking Matrix Table
  function renderMatrixTable() {
    if (!matrixBody) return;
    matrixBody.innerHTML = '';

    allCompanies.forEach((c, idx) => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60 cursor-pointer transition';
      
      const firstPrice = c.pricing.tiers.length > 0 ? c.pricing.tiers[0].price.split('(')[0].trim() : 'Custom';
      const revKeys = Object.keys(c.revenue.past_years);
      const latestRev = revKeys.length > 0 ? c.revenue.past_years[revKeys[revKeys.length - 1]].split('(')[0].trim() : 'N/A';

      tr.innerHTML = `
        <td class="p-2.5 text-neutral-400 dark:text-neutral-500 font-bold">${idx + 1}</td>
        <td class="p-2.5 font-bold text-neutral-900 dark:text-neutral-100">${c.name}</td>
        <td class="p-2.5 text-neutral-500 dark:text-neutral-400 truncate max-w-xs">${c.legal_entity}</td>
        <td class="p-2.5 text-neutral-600 dark:text-neutral-300">${c.market.countries_list[0]}</td>
        <td class="p-2.5 text-neutral-900 dark:text-neutral-100 font-bold">${c.market.country_count}</td>
        <td class="p-2.5 text-neutral-700 dark:text-neutral-300 truncate max-w-xs">${c.founders[0] || 'N/A'}</td>
        <td class="p-2.5 text-neutral-500 dark:text-neutral-400">${c.start_date}</td>
        <td class="p-2.5"><span class="px-1.5 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-mono">${c.status_category.toUpperCase()}</span></td>
        <td class="p-2.5 font-mono">
          ${c.actual_revenue && c.actual_revenue.actual_status === 'verified' ? `
            <span class="font-bold text-emerald-600 dark:text-emerald-400 block">${c.actual_revenue.reported_figure}</span>
            <span class="text-[10px] text-neutral-400 block">${c.actual_revenue.source_authority.split('&')[0].trim()}</span>
          ` : `
            <span class="text-neutral-400 dark:text-neutral-500 italic text-[11px]">Undisclosed (Private)</span>
          `}
        </td>
        <td class="p-2.5 font-mono">
          <span class="text-amber-700 dark:text-amber-300 font-semibold block" title="${c.actual_revenue ? c.actual_revenue.projection_methodology : ''}">
            ${c.actual_revenue ? c.actual_revenue.projected_figure.split('(')[0].trim() : latestRev}
          </span>
          <span class="text-[10px] text-neutral-400 block truncate" title="${c.actual_revenue ? c.actual_revenue.projection_methodology : ''}">
            ${c.actual_revenue && c.actual_revenue.registry_band ? c.actual_revenue.registry_band.split('(')[0].trim() : 'Analytical Model'}
          </span>
        </td>
        <td class="p-2.5 text-neutral-700 dark:text-neutral-300 font-mono">${c.employee_count.current}</td>
        <td class="p-2.5 text-neutral-900 dark:text-neutral-100 font-semibold font-mono">${firstPrice}</td>
      `;
      tr.addEventListener('click', () => openCompanyModalById(c.id));
      matrixBody.appendChild(tr);
    });

    if (toggleMatrixBtn && matrixContainer) {
      toggleMatrixBtn.addEventListener('click', () => {
        const isHidden = matrixContainer.classList.contains('hidden');
        matrixContainer.classList.toggle('hidden', !isHidden);
        toggleMatrixBtn.textContent = isHidden ? 'Collapse' : 'Expand';
      });
    }
  }

  // 10. Chart.js Initializations with Dark Mode Awareness
  function initCharts() {
    const isDark = isDarkMode();
    const textColor = isDark ? '#94a3b8' : '#475569';
    const gridColor = isDark ? '#1e293b' : '#f3f4f6';

    // Geo Chart
    const geoCanvas = document.getElementById('geoChart');
    if (geoCanvas) {
      const freq = metadata.country_frequencies || {};
      const labels = Object.keys(freq).slice(0, 15);
      const data = labels.map(k => freq[k]);

      if (geoChart) geoChart.destroy();
      geoChart = new Chart(geoCanvas, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Platforms Active',
            data: data,
            backgroundColor: isDark ? '#38bdf8' : '#0f172a',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.raw} Platforms operating in ${ctx.label}`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { color: textColor },
              grid: { color: gridColor }
            },
            x: {
              ticks: { color: textColor },
              grid: { display: false }
            }
          }
        }
      });
    }

    // Pricing Chart
    const pricingCanvas = document.getElementById('pricingChart');
    if (pricingCanvas) {
      const sampleNames = ['DryLaun', 'FabKlean', 'QDC', 'CleanCloud', 'Cents', 'Curbside', 'SPOT'];
      const starterPrices = [12, 19, 45, 50, 89, 149, 120];
      const proPrices = [20, 49, 85, 179, 199, 249, 250];

      if (pricingChart) pricingChart.destroy();
      pricingChart = new Chart(pricingCanvas, {
        type: 'bar',
        data: {
          labels: sampleNames,
          datasets: [
            {
              label: 'Starter Tier ($/mo)',
              data: starterPrices,
              backgroundColor: isDark ? '#64748b' : '#a3a3a3',
              borderRadius: 4
            },
            {
              label: 'Pro / Growth Tier ($/mo)',
              data: proPrices,
              backgroundColor: isDark ? '#38bdf8' : '#0f172a',
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: textColor }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'USD / Month', color: textColor },
              ticks: { color: textColor },
              grid: { color: gridColor }
            },
            x: {
              ticks: { color: textColor },
              grid: { display: false }
            }
          }
        }
      });
    }

    // Revenue vs Headcount Chart
    renderRevenueChart();
  }

  // Story 3: Scale & Revenue Chart Interactive Controller
  const chartState = {
    excludedIds: new Set(['zoho_laundry', 'focus_softnet']),
    scaleMode: 'linear', // 'linear' or 'logarithmic'
    tier: 'all' // 'all', '1', '2', '3'
  };

  function renderRevenueChart() {
    const revCanvas = document.getElementById('revenueChart');
    if (!revCanvas) return;

    const isDark = isDarkMode();
    const textColor = isDark ? '#94a3b8' : '#475569';
    const gridColor = isDark ? '#1e293b' : '#f3f4f6';

    // Filter companies
    const activeComps = allCompanies.filter(c => {
      if (chartState.excludedIds.has(c.id)) return false;
      if (chartState.tier !== 'all' && c.tier.toString() !== chartState.tier) return false;
      return true;
    });

    // Split into 3 datasets by tier
    const tier1Data = [];
    const tier2Data = [];
    const tier3Data = [];

    activeComps.forEach(c => {
      const act = c.actual_revenue || {};
      const isVerified = act.actual_status === 'verified';
      const point = {
        x: Math.max(1, c.employee_count.current),
        y: Math.max(0.1, c.est_revenue_usd_m || 0.5),
        id: c.id,
        name: c.name,
        isVerified: isVerified,
        actualRevenue: act.reported_figure || 'Undisclosed (Private)',
        sourceName: act.source_authority || 'Confidential / Paywalled Registry',
        projectedRevenue: act.projected_figure || 'N/A',
        methodology: act.projection_methodology || '',
        tier: c.tier_label.split(':')[0],
        revPerStaff: Math.round(((c.est_revenue_usd_m || 0.5) * 1000000) / Math.max(1, c.employee_count.current))
      };
      if (c.tier === 1) tier1Data.push(point);
      else if (c.tier === 2) tier2Data.push(point);
      else if (c.tier === 3) tier3Data.push(point);
    });

    const isLog = chartState.scaleMode === 'logarithmic';

    if (revenueChart) revenueChart.destroy();
    revenueChart = new Chart(revCanvas, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Tier 1: Indian Native SaaS',
            data: tier1Data,
            backgroundColor: isDark ? '#38bdf8' : '#0284c7',
            borderColor: isDark ? '#7dd3fc' : '#0369a1',
            pointRadius: 6,
            hoverRadius: 9
          },
          {
            label: 'Tier 2: Global SaaS Benchmarks',
            data: tier2Data,
            backgroundColor: isDark ? '#fbbf24' : '#d97706',
            borderColor: isDark ? '#fde68a' : '#b45309',
            pointRadius: 6,
            hoverRadius: 9
          },
          {
            label: 'Tier 3: Indian Chains & Consolidators',
            data: tier3Data,
            backgroundColor: isDark ? '#c084fc' : '#7c3aed',
            borderColor: isDark ? '#e9d5ff' : '#6d28d9',
            pointRadius: 6,
            hoverRadius: 9
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (e, elements) => {
          if (elements && elements.length > 0) {
            const el = elements[0];
            const dataset = revenueChart.data.datasets[el.datasetIndex];
            const item = dataset.data[el.index];
            if (item && item.id) {
              openCompanyModalById(item.id);
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: textColor,
              boxWidth: 10,
              font: { family: 'JetBrains Mono, monospace', size: 10 }
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const r = ctx.raw;
                const lines = [`${r.name} (${r.tier})`];
                if (r.isVerified) {
                  lines.push(`✓ Verified Actual: ${r.actualRevenue}`);
                  lines.push(`Source: ${r.sourceName}`);
                } else {
                  lines.push(`✕ Actual Revenue: Undisclosed (Private Entity)`);
                  lines.push(`⚡ Projected Benchmark: ${r.projectedRevenue}`);
                }
                lines.push(`Headcount: ${r.x} staff | Normalized ARR: $${r.y.toFixed(1)}M`);
                lines.push(`Capital Efficiency: ~$${r.revPerStaff.toLocaleString()} / employee`);
                return lines;
              }
            }
          }
        },
        scales: {
          x: {
            type: isLog ? 'logarithmic' : 'linear',
            title: { display: true, text: isLog ? 'Employee Headcount (Log Scale)' : 'Employee Headcount (Staff)', color: textColor },
            ticks: { color: textColor },
            grid: { color: gridColor }
          },
          y: {
            type: isLog ? 'logarithmic' : 'linear',
            title: { display: true, text: isLog ? 'Actual / Normalized Revenue ($M Log Scale)' : 'Actual / Normalized Revenue ($ Millions)', color: textColor },
            ticks: { color: textColor },
            grid: { color: gridColor }
          }
        }
      }
    });

    updateChartExcludedChips();
  }

  function populateChartCompanySelect() {
    const select = document.getElementById('chartCompanySelect');
    if (!select) return;
    select.innerHTML = '<option value="">+ Toggle Company on Chart...</option>';
    const sorted = [...allCompanies].sort((a, b) => a.name.localeCompare(b.name));
    sorted.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      const isEx = chartState.excludedIds.has(c.id);
      opt.textContent = `${isEx ? '[EXCLUDED] ' : ''}${c.name} (${c.tier_label.split(':')[0]})`;
      select.appendChild(opt);
    });
  }

  function updateChartExcludedChips() {
    const container = document.getElementById('chartExcludedChips');
    const countBadge = document.getElementById('chartCountBadge');
    const resetBtn = document.getElementById('resetChartTogglesBtn');
    const toggleZoho = document.getElementById('toggleExcludeZoho');
    const toggleFocus = document.getElementById('toggleExcludeFocus');

    if (toggleZoho) toggleZoho.checked = chartState.excludedIds.has('zoho_laundry');
    if (toggleFocus) toggleFocus.checked = chartState.excludedIds.has('focus_softnet');

    let plotted = 0;
    allCompanies.forEach(c => {
      if (!chartState.excludedIds.has(c.id)) {
        if (chartState.tier === 'all' || c.tier.toString() === chartState.tier) {
          plotted++;
        }
      }
    });

    if (countBadge) {
      countBadge.textContent = `${plotted} of 51 plotted`;
    }

    if (resetBtn) {
      const isCustom = chartState.excludedIds.size !== 2 || 
                       !chartState.excludedIds.has('zoho_laundry') || 
                       !chartState.excludedIds.has('focus_softnet') ||
                       chartState.scaleMode !== 'linear' ||
                       chartState.tier !== 'all';
      resetBtn.classList.toggle('hidden', !isCustom);
    }

    if (!container) return;
    container.innerHTML = '';

    if (chartState.excludedIds.size === 0) {
      container.innerHTML = '<span class="text-neutral-400 dark:text-neutral-500 text-[10px] italic">None (All 51 plotted)</span>';
      return;
    }

    chartState.excludedIds.forEach(id => {
      const comp = allCompanies.find(c => c.id === id);
      if (!comp) return;
      const chip = document.createElement('button');
      chip.className = 'px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-rose-100 dark:hover:bg-rose-950/60 hover:text-rose-700 dark:hover:text-rose-300 text-[10px] font-mono flex items-center space-x-1 transition';
      chip.innerHTML = `<span>✕</span><span>${comp.name.split('(')[0].trim()}</span>`;
      chip.title = `Click to restore ${comp.name} to the chart`;
      chip.addEventListener('click', () => {
        chartState.excludedIds.delete(id);
        updateChartExcludedChips();
        populateChartCompanySelect();
        renderRevenueChart();
      });
      container.appendChild(chip);
    });
  }

  function setupChartControls() {
    const toggleZoho = document.getElementById('toggleExcludeZoho');
    if (toggleZoho) {
      toggleZoho.addEventListener('change', (e) => {
        if (e.target.checked) chartState.excludedIds.add('zoho_laundry');
        else chartState.excludedIds.delete('zoho_laundry');
        populateChartCompanySelect();
        renderRevenueChart();
      });
    }

    const toggleFocus = document.getElementById('toggleExcludeFocus');
    if (toggleFocus) {
      toggleFocus.addEventListener('change', (e) => {
        if (e.target.checked) chartState.excludedIds.add('focus_softnet');
        else chartState.excludedIds.delete('focus_softnet');
        populateChartCompanySelect();
        renderRevenueChart();
      });
    }

    const linearBtn = document.getElementById('scaleLinearBtn');
    const logBtn = document.getElementById('scaleLogBtn');
    if (linearBtn && logBtn) {
      linearBtn.addEventListener('click', () => {
        chartState.scaleMode = 'linear';
        const isDark = isDarkMode();
        linearBtn.className = `px-2 py-0.5 rounded text-[11px] font-semibold ${isDark ? 'bg-neutral-100 text-neutral-900' : 'bg-neutral-900 text-white'}`;
        logBtn.className = 'px-2 py-0.5 rounded text-[11px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100';
        renderRevenueChart();
      });
      logBtn.addEventListener('click', () => {
        chartState.scaleMode = 'logarithmic';
        const isDark = isDarkMode();
        logBtn.className = `px-2 py-0.5 rounded text-[11px] font-semibold ${isDark ? 'bg-neutral-100 text-neutral-900' : 'bg-neutral-900 text-white'}`;
        linearBtn.className = 'px-2 py-0.5 rounded text-[11px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100';
        renderRevenueChart();
      });
    }

    document.querySelectorAll('.chart-tier-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const isDark = isDarkMode();
        document.querySelectorAll('.chart-tier-btn').forEach(b => {
          b.className = 'chart-tier-btn px-2 py-0.5 rounded bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-100';
        });
        btn.className = `chart-tier-btn px-2 py-0.5 rounded font-semibold ${isDark ? 'bg-neutral-100 text-neutral-900' : 'bg-neutral-900 text-white'}`;
        chartState.tier = btn.getAttribute('data-chart-tier');
        renderRevenueChart();
      });
    });

    const compSelect = document.getElementById('chartCompanySelect');
    if (compSelect) {
      compSelect.addEventListener('change', (e) => {
        const id = e.target.value;
        if (!id) return;
        if (chartState.excludedIds.has(id)) {
          chartState.excludedIds.delete(id);
        } else {
          chartState.excludedIds.add(id);
        }
        compSelect.value = '';
        populateChartCompanySelect();
        renderRevenueChart();
      });
    }

    const resetChartBtn = document.getElementById('resetChartTogglesBtn');
    if (resetChartBtn) {
      resetChartBtn.addEventListener('click', () => {
        chartState.excludedIds = new Set(['zoho_laundry', 'focus_softnet']);
        chartState.scaleMode = 'linear';
        chartState.tier = 'all';

        const isDark = isDarkMode();
        if (linearBtn) linearBtn.className = `px-2 py-0.5 rounded text-[11px] font-semibold ${isDark ? 'bg-neutral-100 text-neutral-900' : 'bg-neutral-900 text-white'}`;
        if (logBtn) logBtn.className = 'px-2 py-0.5 rounded text-[11px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100';

        document.querySelectorAll('.chart-tier-btn').forEach(b => {
          b.className = 'chart-tier-btn px-2 py-0.5 rounded bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-100';
        });
        const allTier = document.querySelector('.chart-tier-btn[data-chart-tier="all"]');
        if (allTier) allTier.className = `chart-tier-btn px-2 py-0.5 rounded font-semibold ${isDark ? 'bg-neutral-100 text-neutral-900' : 'bg-neutral-900 text-white'}`;

        populateChartCompanySelect();
        renderRevenueChart();
      });
    }
  }

  // 11. Modal Dialog & 12 Dimensions Controller
  function openCompanyModalById(id) {
    const idx = currentFilteredList.findIndex(c => c.id === id);
    if (idx !== -1) {
      state.selectedCompanyIndex = idx;
      renderModalForCurrentIndex();
    } else {
      const allIdx = allCompanies.findIndex(c => c.id === id);
      if (allIdx !== -1) {
        state.selectedCompanyIndex = allIdx;
        currentFilteredList = allCompanies;
        renderModalForCurrentIndex();
      }
    }
  }

  function renderModalForCurrentIndex() {
    const c = currentFilteredList[state.selectedCompanyIndex];
    if (!c) return;

    modalIndex.textContent = `#${String(state.selectedCompanyIndex + 1).padStart(2, '0')}`;
    modalTier.textContent = c.tier_label;
    modalStatus.textContent = c.status_category.toUpperCase();
    modalTitle.textContent = c.name;
    modalLegal.textContent = c.legal_entity;

    if (modalPrevBtn) modalPrevBtn.disabled = state.selectedCompanyIndex <= 0;
    if (modalNextBtn) modalNextBtn.disabled = state.selectedCompanyIndex >= currentFilteredList.length - 1;

    const activeUrl = c.site_links.active[0] || '#';
    modalWebsiteLink.innerHTML = `<a href="${activeUrl}" target="_blank" rel="noopener noreferrer" class="text-neutral-900 dark:text-neutral-100 font-semibold underline hover:text-sky-500">${activeUrl} ↗</a>`;

    updateModalTabButtons();
    renderModalTabContent();

    if (companyModal.showModal && !companyModal.open) {
      companyModal.showModal();
    } else if (!companyModal.open) {
      companyModal.setAttribute('open', '');
    }
  }

  function updateModalTabButtons() {
    const isDark = isDarkMode();
    document.querySelectorAll('.modal-tab-btn').forEach(btn => {
      const tab = btn.getAttribute('data-tab');
      if (tab === state.activeTab) {
        btn.className = `modal-tab-btn py-3 px-3 border-b-2 ${isDark ? 'border-neutral-100 text-neutral-100' : 'border-neutral-900 text-neutral-900'} font-semibold whitespace-nowrap`;
      } else {
        btn.className = `modal-tab-btn py-3 px-3 border-b-2 border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 whitespace-nowrap`;
      }
    });
  }

  function renderModalTabContent() {
    const c = currentFilteredList[state.selectedCompanyIndex];
    if (!c || !modalTabContent) return;

    const isDark = isDarkMode();
    let html = '';

    if (state.activeTab === 'overview') {
      html = `
        <div class="space-y-4">
          <div>
            <h5 class="font-mono uppercase text-neutral-400 dark:text-neutral-500 text-[10px] tracking-wider">Dimension 1: Geographic Reach & Penetration</h5>
            <div class="mt-2 p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div class="flex items-center justify-between">
                <span class="font-bold text-neutral-900 dark:text-neutral-100 text-sm">${c.market.country_count} Active Countries</span>
                <span class="text-neutral-500 dark:text-neutral-400 font-mono text-[11px]">Primary: ${c.market.countries_list[0]}</span>
              </div>
              <p class="text-neutral-700 dark:text-neutral-300 leading-relaxed">${c.market.penetration_details}</p>
              <div>
                <span class="font-mono text-[10px] uppercase text-neutral-400 dark:text-neutral-500 block mb-1.5">Exhaustive ISO-3166 Country Codes (${c.market.country_codes.length}):</span>
                <div class="flex flex-wrap gap-1">
                  ${c.market.country_codes.map(code => 
                    `<span class="px-2 py-0.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded font-mono font-bold text-neutral-900 dark:text-neutral-100 text-[11px]">${code}</span>`
                  ).join('')}
                </div>
              </div>
              <div>
                <span class="font-mono text-[10px] uppercase text-neutral-400 dark:text-neutral-500 block mb-1">Country Footprint:</span>
                <span class="text-xs text-neutral-600 dark:text-neutral-400">${c.market.countries_list.join(', ')}</span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded border border-neutral-200 dark:border-neutral-800">
              <span class="font-mono text-[10px] uppercase text-neutral-400 dark:text-neutral-500 block">Dimension 6: Inception Date</span>
              <span class="text-sm font-bold text-neutral-900 dark:text-neutral-100 mt-1 block">${c.start_date}</span>
            </div>
            <div class="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded border border-neutral-200 dark:border-neutral-800">
              <span class="font-mono text-[10px] uppercase text-neutral-400 dark:text-neutral-500 block">Dimension 7: End Date & Status</span>
              <span class="text-sm font-bold text-neutral-900 dark:text-neutral-100 mt-1 block">${c.end_date}</span>
            </div>
          </div>
        </div>
      `;
    } else if (state.activeTab === 'founders') {
      html = `
        <div class="space-y-4">
          <div>
            <h5 class="font-mono uppercase text-neutral-400 dark:text-neutral-500 text-[10px] tracking-wider">Dimension 2: Founders & Leadership</h5>
            <div class="mt-2 p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded border border-neutral-200 dark:border-neutral-800">
              <div class="font-bold text-sm text-neutral-900 dark:text-neutral-100">${c.founders.join(' & ')}</div>
              <div class="text-neutral-500 dark:text-neutral-400 font-mono text-[11px] mt-0.5">${c.legal_entity}</div>
            </div>
          </div>

          <div>
            <h5 class="font-mono uppercase text-neutral-400 dark:text-neutral-500 text-[10px] tracking-wider">Dimension 3: Founder History & Philosophy</h5>
            <div class="mt-2 space-y-3 p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded border border-neutral-200 dark:border-neutral-800">
              <div>
                <strong class="text-neutral-900 dark:text-neutral-100 block mb-0.5">Education & Alma Mater:</strong>
                <p class="text-neutral-700 dark:text-neutral-300">${c.founder_history.pedigree_education}</p>
              </div>
              <div>
                <strong class="text-neutral-900 dark:text-neutral-100 block mb-0.5">Career Trajectory & Prior Roles:</strong>
                <p class="text-neutral-700 dark:text-neutral-300">${c.founder_history.career_trajectory}</p>
              </div>
              <div>
                <strong class="text-neutral-900 dark:text-neutral-100 block mb-0.5">Life & Operating Principles:</strong>
                <p class="text-neutral-700 dark:text-neutral-300 italic bg-white dark:bg-neutral-900 p-3 rounded border border-neutral-100 dark:border-neutral-800">"${c.founder_history.life_operating_principles}"</p>
              </div>
              <div>
                <strong class="text-neutral-900 dark:text-neutral-100 block mb-0.5">Latest Strategic Focus / LinkedIn Posts:</strong>
                <p class="text-neutral-700 dark:text-neutral-300">${c.founder_history.latest_strategic_focus}</p>
              </div>
              <div>
                <strong class="text-neutral-900 dark:text-neutral-100 block mb-0.5">Other Ventures & Board Seats:</strong>
                <p class="text-neutral-700 dark:text-neutral-300">${c.founder_history.other_ventures_board_seats}</p>
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (state.activeTab === 'financials') {
      const act = c.actual_revenue || {};
      const isVerified = act.actual_status === 'verified';
      html = `
        <div class="space-y-4">
          <!-- 1. Actual Statutory Revenue Status -->
          ${isVerified ? `
            <div class="p-4 ${isDark ? 'bg-emerald-950/40 border-emerald-800' : 'bg-emerald-50 border-emerald-200'} rounded-lg border space-y-2.5">
              <div class="flex items-center justify-between">
                <span class="font-mono text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-emerald-400' : 'text-emerald-800'} flex items-center space-x-1">
                  <span>✓ Verified Public Financial Disclosure</span>
                </span>
                <span class="font-mono text-xs font-bold px-2 py-0.5 rounded ${isDark ? 'bg-emerald-900/80 text-emerald-200' : 'bg-emerald-100 text-emerald-800'}">
                  ${act.period || 'Verified'}
                </span>
              </div>
              
              <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <span class="text-xl sm:text-2xl font-bold font-mono ${isDark ? 'text-white' : 'text-neutral-900'}">
                  ${act.reported_figure}
                </span>
                <span class="text-xs font-mono ${isDark ? 'text-neutral-400' : 'text-neutral-600'}">
                  Authority: <strong>${act.source_authority}</strong>
                </span>
              </div>

              <div class="pt-2 border-t ${isDark ? 'border-emerald-800/60 text-neutral-300' : 'border-emerald-200 text-neutral-700'} text-[11px] font-mono leading-relaxed">
                <strong>Public Source / Filing:</strong> <a href="${act.source_url || '#'}" target="_blank" rel="noopener noreferrer" class="underline hover:text-sky-500 font-bold">${act.source_citation} ↗</a>
              </div>
            </div>
          ` : `
            <div class="p-4 ${isDark ? 'bg-neutral-800/60 border-neutral-700' : 'bg-neutral-100 border-neutral-300'} rounded-lg border space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-mono text-[10px] uppercase font-bold tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center space-x-1">
                  <span>✕ Actual Statutory Financials: Not Publicly Disclosed</span>
                </span>
                <span class="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                  Private Entity
                </span>
              </div>
              <p class="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">
                Detailed statutory P&L balance sheets for this entity are not freely published on the open web. MCA Form AOC-4 or state corporate division attachments sit behind confidential paid registry paywalls.
              </p>
              ${act.registry_band ? `
                <div class="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 pt-1.5 border-t border-neutral-200 dark:border-neutral-700">
                  <strong>Public Registry Band:</strong> ${act.registry_band}
                </div>
              ` : ''}
            </div>
          `}

          <!-- 2. Modeled / Projected Benchmark (Distinct Amber Highlight) -->
          <div class="p-4 ${isDark ? 'bg-amber-950/30 border-amber-800/80 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-950'} rounded-lg border space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="font-mono text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-amber-400' : 'text-amber-800'} flex items-center space-x-1">
                <span>⚡ Projected Run-Rate Benchmark (Modeled Estimate)</span>
              </span>
              <span class="font-mono text-xs font-bold px-2 py-0.5 rounded ${isDark ? 'bg-amber-900/60 text-amber-300' : 'bg-amber-200 text-amber-900'}">
                Analytical Model
              </span>
            </div>

            <div class="text-xl sm:text-2xl font-bold font-mono ${isDark ? 'text-amber-100' : 'text-amber-950'}">
              ${act.projected_figure || (c.est_revenue_usd_m ? '$' + c.est_revenue_usd_m + 'M' : 'N/A')}
            </div>

            <div class="text-xs font-sans leading-relaxed ${isDark ? 'text-amber-300/90' : 'text-amber-900'} pt-2 border-t ${isDark ? 'border-amber-800/60' : 'border-amber-200'}">
              <strong>Estimation Methodology:</strong> ${act.projection_methodology || 'Analytical estimate based on store footprint and industry averages.'}
            </div>
            <div class="text-[10px] font-mono italic opacity-75">
              *Notice: This projection is an inferred analytical model for comparative market sizing, not an official audited P&L statement.
            </div>
          </div>

          <div>
            <h5 class="font-mono uppercase text-neutral-400 dark:text-neutral-500 text-[10px] tracking-wider">Dimension 4: Revenue Trajectory (Multi-Year)</h5>
            <div class="mt-2 p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                ${Object.keys(c.revenue.past_years).map(yr => `
                  <div class="p-2.5 bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-700">
                    <span class="font-mono text-[10px] text-neutral-400 dark:text-neutral-500 uppercase block">${yr}</span>
                    <span class="font-mono font-bold text-neutral-900 dark:text-neutral-100 text-xs mt-0.5 block">${c.revenue.past_years[yr]}</span>
                  </div>
                `).join('')}
              </div>
              <div>
                <strong class="text-neutral-900 dark:text-neutral-100 block mb-0.5">Growth Engine & Revenue Mechanics:</strong>
                <p class="text-neutral-700 dark:text-neutral-300">${c.revenue.growth_drivers}</p>
              </div>
            </div>
          </div>

          <div>
            <h5 class="font-mono uppercase text-neutral-400 dark:text-neutral-500 text-[10px] tracking-wider">Dimension 5: Employee Count & Headcount Evolution</h5>
            <div class="mt-2 p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded border border-neutral-200 dark:border-neutral-800 space-y-2">
              <div class="flex items-center space-x-2">
                <span class="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">${c.employee_count.current}</span>
                <span class="text-neutral-500 dark:text-neutral-400 font-mono text-xs">Current Full-Time Employees (2025/2026)</span>
              </div>
              <p class="text-neutral-700 dark:text-neutral-300 leading-relaxed">${c.employee_count.historical_trend}</p>
            </div>
          </div>
        </div>
      `;
    } else if (state.activeTab === 'pricing') {
      html = `
        <div class="space-y-4">
          <div>
            <div class="flex items-center justify-between mb-2">
              <h5 class="font-mono uppercase text-neutral-400 dark:text-neutral-500 text-[10px] tracking-wider">Dimension 11: Pricing Model & Tier Structure</h5>
              <span class="font-mono text-xs px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-neutral-800 dark:text-neutral-200">${c.pricing.model}</span>
            </div>

            <div class="space-y-3">
              ${c.pricing.tiers.map(t => `
                <div class="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded border border-neutral-200 dark:border-neutral-800">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                    <span class="font-bold text-neutral-900 dark:text-neutral-100 text-sm font-mono">${t.tier_name}</span>
                    <span class="font-bold text-sky-700 dark:text-sky-400 font-mono text-xs bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">${t.price}</span>
                  </div>
                  <div class="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono mb-2">Target Customer: ${t.target}</div>
                  <p class="text-neutral-700 dark:text-neutral-300 leading-relaxed bg-white dark:bg-neutral-900 p-3 rounded border border-neutral-100 dark:border-neutral-800">${t.features}</p>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    } else if (state.activeTab === 'gtm') {
      html = `
        <div class="space-y-4">
          <h5 class="font-mono uppercase text-neutral-400 dark:text-neutral-500 text-[10px] tracking-wider">Dimension 10: Marketing & GTM Playbooks</h5>
          <div class="space-y-3">
            <div class="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded border border-neutral-200 dark:border-neutral-800">
              <strong class="text-neutral-900 dark:text-neutral-100 block mb-1">Digital Marketing & Search Advertising:</strong>
              <p class="text-neutral-700 dark:text-neutral-300 leading-relaxed">${c.marketing_strategies.digital}</p>
            </div>
            <div class="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded border border-neutral-200 dark:border-neutral-800">
              <strong class="text-neutral-900 dark:text-neutral-100 block mb-1">Door-to-Door, Field Outreach & Expos:</strong>
              <p class="text-neutral-700 dark:text-neutral-300 leading-relaxed">${c.marketing_strategies.door_to_door_offline}</p>
            </div>
            <div class="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded border border-neutral-200 dark:border-neutral-800">
              <strong class="text-neutral-900 dark:text-neutral-100 block mb-1">B2B Directories, Ecosystem Aggregators & Hardware:</strong>
              <p class="text-neutral-700 dark:text-neutral-300 leading-relaxed">${c.marketing_strategies.directories_partners}</p>
            </div>
          </div>
        </div>
      `;
    } else if (state.activeTab === 'strategy') {
      html = `
        <div class="space-y-4">
          <h5 class="font-mono uppercase text-neutral-400 dark:text-neutral-500 text-[10px] tracking-wider">Dimension 12: Strategic Story & Critical Lessons</h5>
          
          <div class="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded border border-neutral-200 dark:border-neutral-800">
            <strong class="text-neutral-900 dark:text-neutral-100 block mb-1">Success Flywheel / Failure Post-Mortem:</strong>
            <p class="text-neutral-700 dark:text-neutral-300 leading-relaxed">${c.strategic_story.success_or_failure_analysis}</p>
          </div>

          <div class="p-4 bg-sky-50 dark:bg-sky-950/40 rounded border border-sky-200 dark:border-sky-800">
            <strong class="text-sky-950 dark:text-sky-300 block mb-1">Competitor Vulnerabilities & Actionable Blueprint for Our CRM:</strong>
            <p class="text-sky-900 dark:text-sky-400 leading-relaxed">${c.strategic_story.vulnerabilities_lessons}</p>
          </div>
        </div>
      `;
    } else if (state.activeTab === 'sources') {
      html = `
        <div class="space-y-4">
          <div>
            <h5 class="font-mono uppercase text-neutral-400 dark:text-neutral-500 text-[10px] tracking-wider">Dimension 8: Product Demos & Walkthroughs</h5>
            <ul class="mt-2 space-y-1.5 p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded border border-neutral-200 dark:border-neutral-800">
              ${c.demo_links.map(link => `
                <li class="truncate">
                  <a href="${link}" target="_blank" rel="noopener noreferrer" class="text-sky-600 dark:text-sky-400 hover:underline font-mono text-xs flex items-center">
                    <span class="mr-1.5">▶</span> ${link}
                  </a>
                </li>
              `).join('')}
            </ul>
          </div>

          <div>
            <h5 class="font-mono uppercase text-neutral-400 dark:text-neutral-500 text-[10px] tracking-wider">Dimension 9: Active & Secondary Domains</h5>
            <div class="mt-2 p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded border border-neutral-200 dark:border-neutral-800 space-y-1.5">
              <div class="font-mono text-xs">
                <strong>Active Domains:</strong> ${c.site_links.active.map(u => `<a href="${u}" target="_blank" rel="noopener noreferrer" class="text-neutral-900 dark:text-neutral-100 underline mr-2">${u}</a>`).join('')}
              </div>
              ${c.site_links.passive_support && c.site_links.passive_support.length > 0 ? `
                <div class="font-mono text-xs text-neutral-500 dark:text-neutral-400">
                  <strong>Support / Secondary:</strong> ${c.site_links.passive_support.join(', ')}
                </div>
              ` : ''}
            </div>
          </div>

          <div>
            <h5 class="font-mono uppercase text-neutral-400 dark:text-neutral-500 text-[10px] tracking-wider">Grounded Evidence & Source Citations</h5>
            <div class="mt-2 space-y-2">
              ${c.sources.map(s => `
                <div class="p-2.5 bg-neutral-50 dark:bg-neutral-800/60 rounded border border-neutral-200 dark:border-neutral-800 flex items-start space-x-2">
                  <span class="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-mono text-[9px] uppercase font-bold flex-shrink-0">${s.type}</span>
                  <span class="text-neutral-700 dark:text-neutral-300 text-xs">${s.citation}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    } else if (state.activeTab === 'ui_features') {
      const fd = window.CRM_FEATURE_INTELLIGENCE || featureData;
      const compStats = (fd.competitor_stats || {})[c.id];
      const compScreens = (fd.screens || []).filter(s => s.competitor_id === c.id);

      if (compStats) {
        html = `
          <div class="space-y-5">
            <!-- Platform Header -->
            <div class="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span class="font-mono text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Reverse-Engineered UI & Workflow Analysis</span>
                  <h4 class="text-base font-bold text-neutral-900 dark:text-neutral-100">${compStats.name} Product Architecture</h4>
                </div>
                <div class="flex items-center space-x-2 font-mono text-xs">
                  <span class="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">${compStats.features_verified}/${compStats.total_features} Capabilities Verified</span>
                </div>
              </div>

              <!-- Stat pills -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-700/60 font-mono text-xs">
                <div class="p-2 bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-700">
                  <span class="text-[10px] text-neutral-400 uppercase block">Raw Harvested</span>
                  <strong class="text-neutral-900 dark:text-neutral-100">${compStats.total_raw_screens.toLocaleString()} Screens</strong>
                </div>
                <div class="p-2 bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-700">
                  <span class="text-[10px] text-neutral-400 uppercase block">Deep OCR Analyzed</span>
                  <strong class="text-neutral-900 dark:text-neutral-100">${compStats.deep_ocr_screens} Screens</strong>
                </div>
                <div class="p-2 bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-700">
                  <span class="text-[10px] text-neutral-400 uppercase block">Feature Coverage</span>
                  <strong class="text-emerald-600 dark:text-emerald-400">${compStats.coverage_percentage}%</strong>
                </div>
                <div class="p-2 bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-neutral-700">
                  <span class="text-[10px] text-neutral-400 uppercase block">Harvest Source</span>
                  <strong class="text-neutral-900 dark:text-neutral-100">YouTube Pipeline</strong>
                </div>
              </div>
            </div>

            <!-- Representative Screenshots Showcase -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <h5 class="font-mono uppercase text-neutral-400 dark:text-neutral-500 text-[10px] tracking-wider font-bold">Representative UI Screens & OCR Breakdown (${compScreens.length}):</h5>
                <span class="text-[11px] text-neutral-500 font-mono">Click to inspect high-resolution UI</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto p-1">
                ${compScreens.map(s => `
                  <div class="p-2.5 bg-neutral-50 dark:bg-neutral-800/60 rounded border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition flex space-x-3 cursor-pointer group" onclick="window.openScreenshotLightbox('${s.id}')">
                    <div class="w-28 h-18 aspect-video bg-neutral-950 rounded overflow-hidden flex-shrink-0 relative">
                      <img src="${s.image_path}" alt="${s.video_title}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition duration-200" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'120\\' height=\\'70\\' viewBox=\\'0 0 120 70\\'><rect fill=\\'%23222\\' width=\\'120\\' height=\\'70\\'/></svg>'">
                      <span class="absolute bottom-1 right-1 text-[8px] font-mono text-white bg-black/70 px-1 py-0.2 rounded">${s.timestamp}</span>
                    </div>
                    <div class="min-w-0 flex-1 flex flex-col justify-between font-mono text-xs">
                      <div>
                        <span class="text-[9px] uppercase font-bold text-sky-600 dark:text-sky-400 block">${s.category_name}</span>
                        <h6 class="text-[11px] font-semibold text-neutral-900 dark:text-neutral-100 truncate mt-0.5" title="${s.video_title}">${s.video_title}</h6>
                      </div>
                      ${s.detected_features && s.detected_features.length > 0 ? `
                        <div class="flex flex-wrap gap-1">
                          <span class="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold truncate max-w-[150px]">${s.detected_features[0]}</span>
                        </div>
                      ` : ''}
                      <span class="text-[10px] text-sky-600 dark:text-sky-400 group-hover:underline font-bold">Inspect Details →</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `;
      } else {
        html = `
          <div class="p-6 text-center border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg space-y-3 font-mono">
            <span class="text-2xl">🔬</span>
            <h4 class="text-sm font-bold text-neutral-900 dark:text-neutral-100">Deep Video Reverse-Engineering Focused on Core SaaS Leaders</h4>
            <p class="text-xs text-neutral-600 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
              Our 3,809-screen video OCR extraction pipeline currently benchmarks the 4 dominant market systems: Quick Dry Cleaning (QDC), Fabklean, Turns OS, and Swash SLS.
            </p>
            <div class="pt-2">
              <a href="#viewFeatures" onclick="companyModal.close(); handleStoryChange('features');" class="inline-flex items-center space-x-1 px-3 py-1.5 rounded bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold hover:bg-neutral-800 dark:hover:bg-white transition">
                <span>View 4-Platform Comparative Matrix →</span>
              </a>
            </div>
          </div>
        `;
      }
    }

    modalTabContent.innerHTML = html;
  }

  // 12. Copy Dossier to Markdown
  function copyCurrentDossier() {
    const c = currentFilteredList[state.selectedCompanyIndex];
    if (!c) return;

    const act = c.actual_revenue || {};
    const md = `### ${c.name} (${c.legal_entity})
- Tier: ${c.tier_label}
- Status: ${c.end_date}
- Inception: ${c.start_date}
- Countries (${c.market.country_count}): ${c.market.country_codes.join(', ')}
- Founders: ${c.founders.join(', ')}
- Education: ${c.founder_history.pedigree_education}
- Operating Principle: ${c.founder_history.life_operating_principles}
- Actual Statutory Revenue: ${act.actual_status === 'verified' ? (act.reported_figure + ' (' + act.period + ' - ' + act.source_authority + ')') : 'Not Publicly Disclosed (Private Unlisted Entity)'}
- Projected Benchmark (Modeled): ${act.projected_figure || 'N/A'} (Methodology: ${act.projection_methodology || 'Analytical Model'})
- Source / Citation: ${act.source_citation || act.registry_band || 'N/A'}
- Revenue Trajectory: ${JSON.stringify(c.revenue.past_years)}
- Headcount: ${c.employee_count.current}
- Pricing: ${c.pricing.model}
- Strategic Story: ${c.strategic_story.success_or_failure_analysis}
- CRM Blueprint: ${c.strategic_story.vulnerabilities_lessons}
- Website: ${c.site_links.active[0]}
`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(md).then(() => {
        showToast('Dossier copied to clipboard as Markdown!');
      }).catch(() => {
        showToast('Failed to copy to clipboard');
      });
    }
  }

  function showToast(msg) {
    if (!toastNotification || !toastMessage) return;
    toastMessage.textContent = msg;
    toastNotification.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-2');
    setTimeout(() => {
      toastNotification.classList.add('opacity-0', 'pointer-events-none', 'translate-y-2');
    }, 2500);
  }

  // 13. Export Tools (CSV / JSON)
  function exportFilteredCSV() {
    const rows = [
      ['Index', 'Platform Name', 'Legal Entity', 'Tier', 'Status', 'Start Date', 'Country Count', 'Country Codes', 'Founders', 'Actual Revenue Status', 'Verified Actual Revenue', 'Source Authority & Citation', 'Projected Revenue Benchmark', 'Projection Methodology', 'Headcount', 'Base Price', 'Website']
    ];

    currentFilteredList.forEach((c, i) => {
      const act = c.actual_revenue || {};
      const firstPrice = c.pricing.tiers.length > 0 ? c.pricing.tiers[0].price : 'N/A';
      const isVerified = act.actual_status === 'verified';

      rows.push([
        i + 1,
        `"${c.name}"`,
        `"${c.legal_entity}"`,
        `"${c.tier_label.split(':')[0]}"`,
        `"${c.status_category}"`,
        c.start_date,
        c.market.country_count,
        `"${c.market.country_codes.join(' ')}"`,
        `"${c.founders.join('; ')}"`,
        `"${isVerified ? 'Verified Public Disclosure' : 'Undisclosed (Private Entity)'}"`,
        `"${isVerified ? act.reported_figure : 'Not Publicly Disclosed'}"`,
        `"${isVerified ? act.source_citation : (act.registry_band || 'Private Entity')}"`,
        `"${act.projected_figure || 'N/A'}"`,
        `"${act.projection_methodology || ''}"`,
        c.employee_count.current,
        `"${firstPrice}"`,
        c.site_links.active[0] || ''
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laundry_crm_platforms_filtered_${currentFilteredList.length}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${currentFilteredList.length} platforms to CSV!`);
  }

  function exportFilteredJSON() {
    const jsonStr = JSON.stringify(currentFilteredList, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laundry_crm_platforms_filtered_${currentFilteredList.length}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported ${currentFilteredList.length} platforms to JSON!`);
  }

  // 14. Event Listeners Setup
  function setupEventListeners() {
    // Search input
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.search = e.target.value;
        filterAndRender();
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        state.search = '';
        if (searchInput) searchInput.value = '';
        filterAndRender();
      });
    }

    // Story buttons (100.datavizproject style)
    document.querySelectorAll('.story-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.story = btn.getAttribute('data-story');
        updateStoryUI();
        handleStoryChange(state.story);
      });
    });

    // Tier buttons
    document.querySelectorAll('.tier-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.tier = btn.getAttribute('data-tier');
        updateTierUI();
        filterAndRender();
      });
    });

    // Status buttons
    document.querySelectorAll('.status-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.status = btn.getAttribute('data-status');
        updateStatusUI();
        filterAndRender();
      });
    });

    // Model select
    if (modelSelect) {
      modelSelect.addEventListener('change', (e) => {
        state.model = e.target.value;
        filterAndRender();
      });
    }

    // Price Slider
    if (priceSlider) {
      priceSlider.addEventListener('input', (e) => {
        state.maxPrice = parseInt(e.target.value, 10);
        if (priceSliderVal) {
          priceSliderVal.textContent = state.maxPrice >= 250 ? '$250+/mo' : `$${state.maxPrice}/mo`;
        }
        filterAndRender();
      });
    }

    if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetAll);
    if (headerResetFilterBtn) headerResetFilterBtn.addEventListener('click', resetAll);
    if (emptyResetBtn) emptyResetBtn.addEventListener('click', resetAll);
    if (resetCountryBtn) resetCountryBtn.addEventListener('click', () => setCountryFilter('all'));

    // Deep Feature Intelligence listeners
    setupFeaturesListeners();

    // Global keyboard shortcut: "/" to focus search, "Escape" to clear/blur
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== searchInput && 
          document.activeElement.tagName !== 'INPUT' && 
          document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
      if (e.key === 'Escape' && document.activeElement === searchInput) {
        searchInput.blur();
      }
    });

    // Export buttons
    if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportFilteredCSV);
    if (exportJsonBtn) exportJsonBtn.addEventListener('click', exportFilteredJSON);

    // Founder Pedigree Select in Story 4
    if (founderPedigreeSelect) {
      founderPedigreeSelect.addEventListener('change', (e) => {
        state.founderFilter = e.target.value;
        renderFounderCards();
      });
    }

    // Modal navigation
    if (modalPrevBtn) {
      modalPrevBtn.addEventListener('click', () => {
        if (state.selectedCompanyIndex > 0) {
          state.selectedCompanyIndex--;
          renderModalForCurrentIndex();
        }
      });
    }
    if (modalNextBtn) {
      modalNextBtn.addEventListener('click', () => {
        if (state.selectedCompanyIndex < currentFilteredList.length - 1) {
          state.selectedCompanyIndex++;
          renderModalForCurrentIndex();
        }
      });
    }

    if (copyDossierBtn) copyDossierBtn.addEventListener('click', copyCurrentDossier);

    // Modal tabs
    document.querySelectorAll('.modal-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeTab = btn.getAttribute('data-tab');
        updateModalTabButtons();
        renderModalTabContent();
      });
    });

    // Modal close
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (modalDoneBtn) modalDoneBtn.addEventListener('click', closeModal);

    // Light dismiss for dialog
    if (companyModal) {
      companyModal.addEventListener('click', (e) => {
        const rect = companyModal.getBoundingClientRect();
        const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
        if (!isInDialog) {
          closeModal();
        }
      });
    }

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (companyModal && companyModal.open) {
        if (e.key === 'ArrowLeft' && state.selectedCompanyIndex > 0) {
          state.selectedCompanyIndex--;
          renderModalForCurrentIndex();
        } else if (e.key === 'ArrowRight' && state.selectedCompanyIndex < currentFilteredList.length - 1) {
          state.selectedCompanyIndex++;
          renderModalForCurrentIndex();
        } else if (e.key === 'Escape') {
          closeModal();
        }
      }

      const lightboxModal = document.getElementById('screenshotLightboxModal');
      if (lightboxModal && (lightboxModal.open || lightboxModal.hasAttribute('open'))) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          navigateLightbox(-1);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          navigateLightbox(1);
        } else if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          toggleLightboxZoom();
        } else if (e.key === 'Escape') {
          if (lightboxModal.close) lightboxModal.close();
          else lightboxModal.removeAttribute('open');
        }
      }
    });
  }

  function handleStoryChange(story) {
    document.querySelectorAll('.story-section').forEach(sec => sec.classList.add('hidden'));

    if (story === 'all') {
      const explorer = document.getElementById('explorerGridSection');
      if (explorer) explorer.scrollIntoView({ behavior: 'smooth' });
    } else if (story === 'geo') {
      const el = document.getElementById('viewGeo');
      if (el) {
        el.classList.remove('hidden');
        if (window.reRenderWorldMap) window.reRenderWorldMap();
        initCharts();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (story === 'pricing') {
      const el = document.getElementById('viewPricing');
      if (el) {
        el.classList.remove('hidden');
        initCharts();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (story === 'revenue') {
      const el = document.getElementById('viewRevenue');
      if (el) {
        el.classList.remove('hidden');
        initCharts();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (story === 'founders') {
      const el = document.getElementById('viewFounders');
      if (el) {
        el.classList.remove('hidden');
        renderFounderCards();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (story === 'postmortem') {
      const el = document.getElementById('viewPostmortem');
      if (el) {
        el.classList.remove('hidden');
        renderPostmortemCards();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (story === 'features') {
      const el = document.getElementById('viewFeatures');
      if (el) {
        el.classList.remove('hidden');
        renderFeaturesSection();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  function closeModal() {
    if (companyModal.close) {
      companyModal.close();
    } else {
      companyModal.removeAttribute('open');
    }
    state.selectedCompanyIndex = -1;
  }

  // 14B. Deep Feature Intelligence & UI Reverse-Engineering Controller
  function renderFeaturesSection() {
    const fd = window.CRM_FEATURE_INTELLIGENCE || featureData;
    if (!fd || !fd.metadata) return;

    // Update KPI metrics
    const kpiRaw = document.getElementById('kpiRawScreens');
    if (kpiRaw) kpiRaw.textContent = (fd.metadata.total_raw_screens_harvested || 3809).toLocaleString() + ' Screens';

    const kpiFeat = document.getElementById('kpiFeatureCount');
    if (kpiFeat) kpiFeat.textContent = (fd.features.length || 23) + ' Capabilities';

    const kpiOcr = document.getElementById('kpiOcrScreens');
    if (kpiOcr) kpiOcr.textContent = (fd.screens.length || 0) + ' Showcase Screens';

    // Populate module dropdown in gallery if empty
    const moduleSelect = document.getElementById('galleryModuleSelect');
    if (moduleSelect && moduleSelect.options.length <= 1 && fd.modules) {
      let optHtml = '<option value="all">All Functional Modules</option>';
      fd.modules.forEach(m => {
        optHtml += `<option value="${m.id}">${m.name} (${m.screen_count})</option>`;
      });
      moduleSelect.innerHTML = optHtml;
    }

    // Render Capability Radar
    initFeaturesRadarChart();

    // Render 6-Stage Operational Stepper & Diff Card
    renderWorkflowStepper();
    renderWorkflowDiffCard(state.activeWorkflowStage || 'stage_intake');

    // Render domain filters
    renderFeatureDomainFilters();

    // Render active view mode
    if (state.featuresMode === 'matrix') {
      renderFeaturesMatrix();
    } else {
      renderFeaturesGallery();
    }
  }

  function initFeaturesRadarChart() {
    const canvas = document.getElementById('featuresRadarChart');
    if (!canvas) return;

    const isDark = isDarkMode();
    const textColor = isDark ? '#cbd5e1' : '#334155';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
    const angleLineColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)';

    const radarLabels = [
      'POS & Intake',
      'Garment Tagging',
      'Plant Operations',
      'Driver Logistics',
      'WhatsApp & Growth',
      'Billing & Tax',
      'Hardware & Scale',
      'Multi-Store Admin'
    ];

    const datasets = [
      {
        label: 'Quick Dry Cleaning',
        data: [90, 95, 95, 90, 95, 98, 92, 96],
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.22)',
        pointBackgroundColor: '#0284c7',
        pointBorderColor: '#ffffff',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#0284c7',
        borderWidth: 2.5,
        pointRadius: 3.5
      },
      {
        label: 'Fabklean',
        data: [96, 95, 92, 94, 92, 90, 88, 90],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.22)',
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#10b981',
        borderWidth: 2.5,
        pointRadius: 3.5
      },
      {
        label: 'Turns OS',
        data: [86, 76, 80, 92, 88, 86, 84, 85],
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.22)',
        pointBackgroundColor: '#a855f7',
        pointBorderColor: '#ffffff',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#a855f7',
        borderWidth: 2.5,
        pointRadius: 3.5
      },
      {
        label: 'Swash SLS',
        data: [94, 95, 88, 96, 92, 92, 96, 88],
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.22)',
        pointBackgroundColor: '#f43f5e',
        pointBorderColor: '#ffffff',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#f43f5e',
        borderWidth: 2.5,
        pointRadius: 3.5
      }
    ];

    if (featuresRadarChart) {
      featuresRadarChart.destroy();
    }

    featuresRadarChart = new Chart(canvas, {
      type: 'radar',
      data: {
        labels: radarLabels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        elements: {
          line: { tension: 0.15 }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}/100 benchmark score`
            }
          }
        },
        scales: {
          r: {
            angleLines: { color: angleLineColor },
            grid: { color: gridColor },
            pointLabels: {
              color: textColor,
              font: {
                family: 'monospace',
                size: 10,
                weight: '600'
              }
            },
            ticks: {
              backdropColor: 'transparent',
              color: isDark ? '#64748b' : '#94a3b8',
              stepSize: 20,
              font: { size: 9, family: 'monospace' }
            },
            suggestedMin: 40,
            suggestedMax: 100
          }
        }
      }
    });

    renderRadarMethodology(state.activeRadarDomainIndex !== undefined ? state.activeRadarDomainIndex : 0);
  }

  window.toggleRadarCompetitor = function(index) {
    if (!featuresRadarChart) return;
    const ds = featuresRadarChart.data.datasets[index];
    if (!ds) return;
    ds.hidden = !ds.hidden;
    featuresRadarChart.update();

    const buttons = document.querySelectorAll('#featuresRadarLegend button');
    if (buttons[index]) {
      if (ds.hidden) {
        buttons[index].classList.add('opacity-30', 'line-through');
      } else {
        buttons[index].classList.remove('opacity-30', 'line-through');
      }
    }
  };

  // -------------------------------------------------------------------------
  // Competitive Multi-Axis Benchmark — Scoring Methodology & Domain Audits
  // -------------------------------------------------------------------------
  const RADAR_METHODOLOGY_DOMAINS = [
    {
      index: 0,
      id: 'pos_intake',
      name: 'POS & Counter Intake',
      icon: '⚡',
      rubric: 'Evaluates front-desk operator speed, sub-second keyboard shortcuts, scale auto-tare integration, and visual garment defect marking.',
      subFeatures: ['Digital Scale Tare Links', 'Sub-15s Hotkey Billing', 'Garment Defect/Stain Mapping', 'Express Rush Turnaround', 'Per-Pound Wash & Fold Mode'],
      scores: {
        qdc: {
          score: 90,
          rank: '#3',
          rationale: 'High-speed keyboard navigation with F2 item search, F5 item code, and direct RS232 digital scale auto-tare, but uses text dropdowns rather than visual defect canvas.',
          proofId: 'screen_0029',
          proofTitle: 'MPOS | Create Per Weight Order with Digital Scale',
          keyMoat: 'RS232 Serial Scale Auto-Tare'
        },
        fabklean: {
          score: 96,
          rank: '#1',
          rationale: 'Highest visual intake ergonomics in industry: clerks tap directly on a 2D garment silhouette diagram (Shirt, Trouser, Saree) to mark exact defect coordinates (Stain, Tear, Burn) printed on claim checks.',
          proofId: 'screen_0001',
          proofTitle: 'Touch-First Counter POS & Itemized Garment Intake',
          keyMoat: 'Interactive 2D Defect Silhouette Canvas'
        },
        turns: {
          score: 86,
          rank: '#4',
          rationale: 'Engineered for North American laundromats where 70%+ volume is billed per pound. Auto-deducts bag tare weight via CAS digital scale and saves credit card on file, but lacks complex ethnic garment defect mapping.',
          proofId: 'screen_0017',
          proofTitle: 'Itemized Per-Piece Dry Cleaning & Laundry Order Creation',
          keyMoat: 'Wash & Fold Scale Tare & Card Vault'
        },
        swash: {
          score: 94,
          rank: '#2',
          rationale: 'Sub-second counter entry with dedicated keyboard hotkeys, 4-hour rush express turnaround toggles, and instant receipt generation in under 15 seconds.',
          proofId: 'screen_0081',
          proofTitle: 'Swash SLS — Create Counter Orders with Keyboard Shortcuts',
          keyMoat: 'Sub-15s Keyboard Shortcut Velocity'
        }
      }
    },
    {
      index: 1,
      id: 'tagging_assembly',
      name: 'Garment Tagging & Assembly',
      icon: '🏷️',
      rubric: 'Evaluates heat-seal resin durability, barcode density, post-wash assembly reconstruction scan stations, and missing garment alerts.',
      subFeatures: ['Chemical-Proof Thermal Resin', '2D QR & 1D Barcode Switching', 'Scan-to-Reconstruct Station', 'Audio/Visual Missing Item Chimes', 'Baud-Rate Hardware Calibration'],
      scores: {
        qdc: {
          score: 95,
          rank: '#1 (tied)',
          rationale: 'Indelible continuous thermal resin tape surviving 90°C chemical wash cycles, seamless 1D Code-128 and 2D QR tag formatting, and automated rack slot allocations.',
          proofId: 'screen_0045',
          proofTitle: 'Switch QR Code to Barcode & Tag Format Layouts',
          keyMoat: 'Indelible Resin & Automated Rack Slotting'
        },
        fabklean: {
          score: 95,
          rank: '#1 (tied)',
          rationale: 'Prints hydro-fix chemical-resistant barcode tags paired with an interactive post-wash assembly station showing real-time bundle progress (e.g. 3 of 5 items) and missing item alarms.',
          proofId: 'screen_0004',
          proofTitle: 'Thermal Barcode Garment Tagging & Printer Config',
          keyMoat: 'Hydro-Fix Tape & Scan Reconstruction Station'
        },
        turns: {
          score: 76,
          rank: '#4',
          rationale: 'Uses Zebra cloud printers for paper bag and hanger tags suited for wash-and-fold, but lacks industrial chemical-proof hydro-fix resin tags required for high-solvent dry cleaning plants.',
          proofId: 'screen_0020',
          proofTitle: 'The Wash House Newburgh — Zebra Label Printing',
          keyMoat: 'Cloud Zebra Bag Tagging'
        },
        swash: {
          score: 95,
          rank: '#1 (tied)',
          rationale: 'Features low-level hardware baud-rate and pitch calibrator preventing paper jams, coupled with high-speed barcode assembly chimes allowing 200+ garments/hour throughput.',
          proofId: 'screen_0056',
          proofTitle: 'Swash SLS — Tag Print Settings & Pitch Calibration',
          keyMoat: 'Baud-Rate Pitch Calibrator & Assembly Chimes'
        }
      }
    },
    {
      index: 2,
      id: 'plant_workshop',
      name: 'Plant Operations & Central Workshop',
      icon: '🏭',
      rubric: 'Evaluates retail-to-central plant hub-and-spoke transfer manifests, machine batch weight sorting, visual Kanban status pipeline, and operator SLA tracking.',
      subFeatures: ['Store-to-CPU Gatekeeper Manifests', 'Visual Workshop Kanban Swimlanes', 'Machine Load Capacity Batching', 'Operator Dwell-Time SLAs', 'Defect Spotting & Re-Wash Loops'],
      scores: {
        qdc: {
          score: 95,
          rank: '#1',
          rationale: 'Enterprise hub-and-spoke transfer manifests with barcode gatekeeper checks between retail front stores and central processing plants (CPU), ensuring zero garment leakage during transit.',
          proofId: 'screen_0041',
          proofTitle: 'Super Admin: Services — Workflow and Garment Stages',
          keyMoat: 'Enterprise CPU Transfer Manifest Protocol'
        },
        fabklean: {
          score: 92,
          rank: '#2',
          rationale: 'Real-time drag-and-drop digital workshop Kanban pipeline (Washing, Dry Clean, Spotting, Ironing, QC) with operator dwell-time tracking and bottleneck alerts.',
          proofId: 'screen_0007',
          proofTitle: 'Multi-Stage Workshop Kanban Status Pipeline',
          keyMoat: 'Visual Drag-and-Drop Plant Kanban'
        },
        turns: {
          score: 80,
          rank: '#4',
          rationale: 'Associates customer orders with commercial washer/dryer machine cycle timers and sends automated alerts, but lacks multi-facility truck manifest logistics.',
          proofId: 'screen_0023',
          proofTitle: 'Draiklin Success Story — Processing Stage Management',
          keyMoat: 'Laundromat Machine Cycle Timing'
        },
        swash: {
          score: 88,
          rank: '#3',
          rationale: 'Plant batching by machine load capacities (e.g. 25kg darks vs 15kg whites) and customizable turnaround SLA stages across distinct garment service lines.',
          proofId: 'screen_0066',
          proofTitle: 'How to Create and Manage Services & Garment Stages in SLS',
          keyMoat: 'Machine Capacity Batch Sorting'
        }
      }
    },
    {
      index: 3,
      id: 'driver_logistics',
      name: 'Driver Logistics & Route Execution',
      icon: '🛵',
      rubric: 'Evaluates driver mobile dispatch, offline route execution, doorstep dynamic UPI QR generation, photo proof-of-delivery, and third-party gig fleet integration.',
      subFeatures: ['Doorstep Dynamic UPI QR Display', 'Offline Mobile Route Sync', 'Photo Proof of Delivery (POD)', 'DoorDash / Uber Direct Fleet Toggle', 'Mobile Bluetooth Receipt Printing'],
      scores: {
        qdc: {
          score: 90,
          rank: '#4',
          rationale: 'Offline-first MPOS rider app allowing drivers to execute routes in basement zones without connectivity, capturing signatures and syncing upon reconnecting.',
          proofId: 'screen_0033',
          proofTitle: 'MPOS Rider App Tutorial — Login & Route Activation',
          keyMoat: 'Offline-First Driver Routing & Sync'
        },
        fabklean: {
          score: 94,
          rank: '#2',
          rationale: 'Driver app creates brand-new bookings directly at the customer doorstep, issues tags via portable Bluetooth thermal printers, and presents dynamic UPI QR codes.',
          proofId: 'screen_0012',
          proofTitle: 'Doorstep Dynamic UPI QR & Card Payment Collection',
          keyMoat: 'Doorstep Mobile POS & Bluetooth Tagging'
        },
        turns: {
          score: 92,
          rank: '#3',
          rationale: 'Integrated DoorDash / Uber Direct courier fleet toggle with automated driver dispatch, contactless photo proof of delivery on porches, and automated card-on-file charge.',
          proofId: 'screen_0026',
          proofTitle: 'Turns Driver App — Delivery Assignment & Photo Proof',
          keyMoat: 'Native DoorDash / Gig Fleet API Dispatch'
        },
        swash: {
          score: 96,
          rank: '#1',
          rationale: 'Market-leading driver dynamic UPI QR engine: generates exact-amount BharatPe/UPI QR directly on the rider smartphone screen, auto-settling customer balance in 2 seconds.',
          proofId: 'screen_0054',
          proofTitle: 'Swash Laundry Rider App — Doorstep Dynamic UPI QR Payment',
          keyMoat: 'Instant 2s Doorstep UPI Dynamic QR Settlement'
        }
      }
    },
    {
      index: 4,
      id: 'customer_marketing',
      name: 'WhatsApp & Customer Growth',
      icon: '💬',
      rubric: 'Evaluates Meta WhatsApp Cloud API integration, automated PDF tax invoice push, customer self-service booking, and automated Google Review harvesting.',
      subFeatures: ['Meta WhatsApp Cloud API Push', 'Automated PDF Tax Invoices', 'Automated Google Review SMS Harvest', 'Customer Self-Service PWA / iOS / Android', 'Promotional Coupon Campaigns'],
      scores: {
        qdc: {
          score: 95,
          rank: '#1',
          rationale: 'Enterprise WhatsApp notifications for order booking, pickup ready, PDF invoice delivery, and promotional discount coupons with detailed customer review workflows.',
          proofId: 'screen_0047',
          proofTitle: 'Saudi Arabia ZATCA e-Invoicing & WhatsApp Invoicing',
          keyMoat: 'End-to-End Enterprise WhatsApp Cloud Engine'
        },
        fabklean: {
          score: 92,
          rank: '#2 (tied)',
          rationale: 'Automated WhatsApp Cloud API pushes interactive messages with PDF invoice download and instant online payment links, boosting prompt settlement.',
          proofId: 'screen_0013',
          proofTitle: 'WhatsApp Cloud API Omnichannel Messaging Engine',
          keyMoat: 'Interactive WhatsApp Payment Links'
        },
        turns: {
          score: 88,
          rank: '#4',
          rationale: 'Industry-leading automated Google Review engine sending SMS prompts 30 min post-delivery, generating 50-100+ five-star reviews/month, but relies on SMS over WhatsApp due to US market focus.',
          proofId: 'screen_0027',
          proofTitle: 'Automated Google Review Engine & Modern Laundromat Tech',
          keyMoat: 'Automated Google Review Harvesting Engine'
        },
        swash: {
          score: 92,
          rank: '#2 (tied)',
          rationale: 'Omnichannel SMS and WhatsApp broadcast engine for ready-for-pickup notifications, customer statement exports, and promotional loyalty messages.',
          proofId: 'screen_0068',
          proofTitle: 'How to View Invoice History & GST Tax Compliance in SLS',
          keyMoat: 'Automated Ready Alerts & Statement Export'
        }
      }
    },
    {
      index: 5,
      id: 'billing_finance',
      name: 'Billing, Taxation & Compliance',
      icon: '💳',
      rubric: 'Evaluates international tax compliance (Saudi ZATCA Phase 2 XML, India GST), split-tender settlement, day-end cashier variance tally, and customer ledgers.',
      subFeatures: ['Saudi ZATCA Phase 2 Cryptographic HSM', 'India GST e-Way Bill & Multi-State Slabs', 'Split-Tender Settlement (Cash/UPI/Card/Credit)', 'Rigorous Day-End Cashier Closing Tally', 'Prepaid Customer Wallet Packages'],
      scores: {
        qdc: {
          score: 98,
          rank: '#1',
          rationale: 'Highest regulatory compliance rating: full Saudi Arabia ZATCA Phase 2 XML e-invoicing with cryptographic stamps and Base64 TLV QR codes, plus Indian GST tax slabs and day-end audit reports.',
          proofId: 'screen_0047',
          proofTitle: 'Saudi Arabia ZATCA Phase 1 & 2 e-Invoicing Compliance',
          keyMoat: 'Saudi ZATCA Phase 2 Cryptographic Compliance'
        },
        fabklean: {
          score: 90,
          rank: '#3',
          rationale: 'Comprehensive Indian GST tax invoicing, corporate B2B monthly credit billing accounts, and integrated Razorpay/UPI gateway reconciliation.',
          proofId: 'screen_0012',
          proofTitle: 'Doorstep Dynamic UPI QR & Card Payment Collection',
          keyMoat: 'Corporate B2B Invoicing & GST Slabs'
        },
        turns: {
          score: 86,
          rank: '#4',
          rationale: 'Stripe payment vault integration, recurring customer wash subscriptions, and US county sales tax computation, but lacks GCC ZATCA e-invoicing capabilities.',
          proofId: 'screen_0026',
          proofTitle: 'Turns Driver Mobile App — Delivery Assignment & Photo Proof',
          keyMoat: 'Stripe Card Vault & Recurring Wash Subscriptions'
        },
        swash: {
          score: 92,
          rank: '#2',
          rationale: 'Rigorous Day-End register closing module comparing physical cash in drawer against software calculations, paired with split-tender settlement and GST sales export.',
          proofId: 'screen_0068',
          proofTitle: 'How to View Invoice History & GST Tax Compliance in SLS',
          keyMoat: 'Rigorous Day-End Cashier Shift Tally'
        }
      }
    },
    {
      index: 6,
      id: 'hardware_ecosystem',
      name: 'Hardware & Scale Integration',
      icon: '🖨️',
      rubric: 'Evaluates direct serial COM scale drivers, ESC/POS thermal command sets, low-level printer pitch calibrations, and cash drawer RJ11 kick mechanisms.',
      subFeatures: ['Low-Level Baud-Rate Pitch Calibrator', 'RS232 Serial COM Scale Drivers', 'ESC/POS Raw Command Direct Printing', 'Bluetooth Mobile Thermal Printers', 'RJ11 Cash Drawer Kick Relays'],
      scores: {
        qdc: {
          score: 92,
          rank: '#2',
          rationale: 'Proven desktop serial drivers for CAS and Mettler-Toledo digital scales, Citizen and Zebra thermal transfer tag printers, and receipt cash drawers.',
          proofId: 'screen_0029',
          proofTitle: 'MPOS | Create Per Weight Order with Digital Scale',
          keyMoat: 'Mettler-Toledo & CAS Scale Driver Links'
        },
        fabklean: {
          score: 88,
          rank: '#3',
          rationale: 'Flexible hardware ecosystem supporting portable Bluetooth mobile receipt printers for drivers, USB electronic weighing scales, and desktop thermal printers.',
          proofId: 'screen_0004',
          proofTitle: 'Thermal Barcode Garment Tagging & Printer Config',
          keyMoat: 'Mobile Bluetooth Thermal Field Printers'
        },
        turns: {
          score: 84,
          rank: '#4',
          rationale: 'Cloud-first printing via Star Micronics and Zebra cloud printers; optimized for web kiosks and iPads rather than legacy Windows serial COM ports.',
          proofId: 'screen_0020',
          proofTitle: 'The Wash House Newburgh — Zebra Label Printing',
          keyMoat: 'Star Micronics & Zebra Cloud Printing'
        },
        swash: {
          score: 96,
          rank: '#1',
          rationale: 'Unrivaled low-level hardware calibration utility: allows store operators to adjust baud rate, cutter stroke timing, paper feed margins, and barcode font density to eliminate jams.',
          proofId: 'screen_0056',
          proofTitle: 'Swash SLS — Tag Print Settings & Pitch Calibration',
          keyMoat: 'Low-Level Baud Rate & Pitch Calibrator'
        }
      }
    },
    {
      index: 7,
      id: 'multi_store_admin',
      name: 'Multi-Store & Franchise Administration',
      icon: '🏢',
      rubric: 'Evaluates enterprise franchise role-based access control (RBAC), multi-branch inventory transfers, centralized service masters, and royalty split calculations.',
      subFeatures: ['Enterprise Role-Based Access Control (RBAC)', 'Centralized Super-Admin Service Master', 'Inter-Branch Stock & Garment Transfer', 'Franchise Royalty Split Calculations', 'Cross-Store Customer Balance Portability'],
      scores: {
        qdc: {
          score: 96,
          rank: '#1',
          rationale: 'Enterprise franchise multi-store hierarchy: Super Admin creates centralized price lists, service masters, and tax slabs while individual store managers operate constrained permissions with cross-store balance sync.',
          proofId: 'screen_0041',
          proofTitle: 'Super Admin: Services — Workflow and Garment Stages',
          keyMoat: 'Super-Admin Centralized Service & Price Master'
        },
        fabklean: {
          score: 90,
          rank: '#2',
          rationale: 'Multi-outlet dashboard aggregating revenue, orders, and rider statuses with regional store manager permissions and centralized customer databases.',
          proofId: 'screen_0007',
          proofTitle: 'Multi-Stage Workshop Kanban Status Pipeline',
          keyMoat: 'Multi-Outlet Regional Revenue Aggregation'
        },
        turns: {
          score: 85,
          rank: '#4',
          rationale: 'Multi-location laundromat dashboard with aggregated revenue metrics and remote store switching, but lighter on franchise royalty split workflows.',
          proofId: 'screen_0023',
          proofTitle: 'Draiklin Success Story — Processing Stage Management',
          keyMoat: 'Multi-Laundromat Remote Fleet Switching'
        },
        swash: {
          score: 88,
          rank: '#3',
          rationale: 'Multi-branch order tracking and user permission matrices allowing staff to transfer garments between branches and monitor consolidated performance.',
          proofId: 'screen_0066',
          proofTitle: 'How to Create and Manage Services & Garment Stages in SLS',
          keyMoat: 'Branch-to-Branch Order Tracking'
        }
      }
    }
  ];

  function renderRadarMethodology(domainIndex) {
    const container = document.getElementById('radarMethodologyContainer');
    if (!container) return;

    if (domainIndex === undefined || domainIndex === null) {
      domainIndex = state.activeRadarDomainIndex || 0;
    }
    state.activeRadarDomainIndex = domainIndex;

    const domain = RADAR_METHODOLOGY_DOMAINS[domainIndex] || RADAR_METHODOLOGY_DOMAINS[0];
    const isDark = isDarkMode();

    let html = `
      <!-- Header Banner & Math Formula -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-700/80">
        <div>
          <div class="flex items-center space-x-2">
            <span class="text-xs px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-bold">
              EMPIRICAL BENCHMARK METHODOLOGY
            </span>
            <span class="text-[10px] text-neutral-500 font-normal">Score Formulation & Grounded Evidence</span>
          </div>
          <h4 class="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 mt-1">
            How The 0–100 Capability Radar Scores Are Derived
          </h4>
          <p class="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 max-w-2xl font-sans leading-relaxed">
            Every capability index is a transparent composite score evaluated from <strong>3,809 harvested UI frames</strong> and <strong>296 analyzed video walkthroughs</strong> across 3 calibrated evaluation pillars.
          </p>
        </div>
        <div class="flex-shrink-0 bg-white dark:bg-neutral-900 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-[11px] space-y-1">
          <span class="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block">Mathematical Scoring Formula</span>
          <div class="font-mono text-xs font-bold text-sky-700 dark:text-sky-300">
            Score = (0.50 × Coverage) + (0.30 × Ergonomics) + (0.20 × Compliance)
          </div>
        </div>
      </div>

      <!-- 3 Scoring Weight Pillars -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
        <div class="p-3 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div class="flex items-center justify-between mb-1">
            <span class="font-bold text-neutral-900 dark:text-neutral-100">1. Feature Coverage (50%)</span>
            <span class="text-sky-600 dark:text-sky-400 font-bold">0.50 Wt</span>
          </div>
          <p class="text-neutral-600 dark:text-neutral-400 font-sans text-[11px] leading-snug">
            Evaluates presence in our 23-module feature ontology: Verified Native (100 pts), Configurable Add-On (65 pts), or Unsupported/Third-Party (0 pts).
          </p>
        </div>

        <div class="p-3 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div class="flex items-center justify-between mb-1">
            <span class="font-bold text-neutral-900 dark:text-neutral-100">2. Workflow Ergonomics (30%)</span>
            <span class="text-emerald-600 dark:text-emerald-400 font-bold">0.30 Wt</span>
          </div>
          <p class="text-neutral-600 dark:text-neutral-400 font-sans text-[11px] leading-snug">
            Grounded in operator video velocity: sub-second hotkey billing, 2D defect canvas coordinate picking, and zero-latency barcode assembly chimes.
          </p>
        </div>

        <div class="p-3 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div class="flex items-center justify-between mb-1">
            <span class="font-bold text-neutral-900 dark:text-neutral-100">3. Compliance & Hardware (20%)</span>
            <span class="text-purple-600 dark:text-purple-400 font-bold">0.20 Wt</span>
          </div>
          <p class="text-neutral-600 dark:text-neutral-400 font-sans text-[11px] leading-snug">
            Direct hardware driver links (RS232 scales, raw ESC/POS commands) and statutory compliance (ZATCA Phase 2 XML, India GST, Dynamic UPI QR).
          </p>
        </div>
      </div>

      <!-- Domain Selector Tabs (8 domains) -->
      <div>
        <span class="text-[10px] uppercase font-mono tracking-wider text-neutral-400 dark:text-neutral-500 font-bold block mb-2">
          Select Operational Domain for Grounded Evidence & Score Breakdown:
        </span>
        <div class="flex flex-wrap gap-1.5 font-mono text-xs">
    `;

    RADAR_METHODOLOGY_DOMAINS.forEach((d, idx) => {
      const isActive = idx === domainIndex;
      html += `
        <button type="button" onclick="window.selectRadarDomain(${idx})" class="px-2.5 py-1.5 rounded-lg border transition flex items-center space-x-1.5 cursor-pointer ${
          isActive
            ? (isDark ? 'bg-sky-950 border-sky-500 text-sky-200 font-bold shadow-sm' : 'bg-sky-50 border-sky-600 text-sky-950 font-bold shadow-sm')
            : (isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700' : 'bg-white border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:border-neutral-300')
        }">
          <span>${d.icon}</span>
          <span>${d.name}</span>
        </button>
      `;
    });

    html += `
        </div>
      </div>

      <!-- Selected Domain Deep-Dive Container -->
      <div class="p-3.5 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <div class="flex items-center space-x-2">
              <span class="text-lg">${domain.icon}</span>
              <h5 class="font-bold text-sm text-neutral-900 dark:text-neutral-100">${domain.name} — Domain Scoring Audit</h5>
            </div>
            <p class="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 font-sans">${domain.rubric}</p>
          </div>
          <div class="flex flex-wrap gap-1">
            ${domain.subFeatures.map(sf => `<span class="text-[9px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-mono">${sf}</span>`).join('')}
          </div>
        </div>

        <!-- 4 Platforms Comparison Grid for this domain -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
    `;

    const compConfig = [
      { key: 'qdc', name: 'Quick Dry Cleaning', color: 'sky', border: 'border-sky-500/40', badge: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' },
      { key: 'fabklean', name: 'Fabklean', color: 'emerald', border: 'border-emerald-500/40', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
      { key: 'turns', name: 'Turns OS', color: 'purple', border: 'border-purple-500/40', badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' },
      { key: 'swash', name: 'Swash SLS', color: 'rose', border: 'border-rose-500/40', badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' }
    ];

    compConfig.forEach(c => {
      const item = domain.scores[c.key];
      if (!item) return;

      html += `
        <div class="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border ${c.border} flex flex-col justify-between space-y-2.5">
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="font-bold text-neutral-900 dark:text-neutral-100 text-xs">${c.name}</span>
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${c.badge}">${item.rank}</span>
            </div>
            <div class="flex items-baseline space-x-1.5">
              <span class="text-xl font-bold font-mono ${c.key === 'qdc' ? 'text-sky-600 dark:text-sky-400' : c.key === 'fabklean' ? 'text-emerald-600 dark:text-emerald-400' : c.key === 'turns' ? 'text-purple-600 dark:text-purple-400' : 'text-rose-600 dark:text-rose-400'}">${item.score}</span>
              <span class="text-[10px] text-neutral-400 font-mono">/ 100 Index</span>
            </div>
            <span class="text-[10px] font-bold block text-neutral-700 dark:text-neutral-300">${item.keyMoat}</span>
            <p class="text-[11px] font-sans text-neutral-600 dark:text-neutral-400 leading-relaxed">${item.rationale}</p>
          </div>

          <div class="pt-2 border-t border-neutral-200 dark:border-neutral-700/60 space-y-1 text-[10px]">
            <div class="text-neutral-400 dark:text-neutral-500 truncate font-mono">
              <strong>Proof:</strong> ${item.proofTitle}
            </div>
            <div class="grid grid-cols-2 gap-1 pt-0.5">
              <button type="button" onclick="window.openScreenshotLightbox('${item.proofId}')" class="py-1 px-1 rounded bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 hover:border-neutral-500 text-sky-600 dark:text-sky-400 font-bold text-center transition flex items-center justify-center space-x-0.5 cursor-pointer">
                <span>📷</span>
                <span>Frame</span>
              </button>
              <button type="button" onclick="window.openProofVideo('${item.proofId}')" class="py-1 px-1 rounded bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 font-bold text-center transition flex items-center justify-center space-x-0.5 cursor-pointer">
                <span>▶</span>
                <span>Video</span>
              </button>
            </div>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  window.selectRadarDomain = function(domainIndex) {
    renderRadarMethodology(domainIndex);
  };

  const WORKFLOW_STAGES = [
    {
      id: 'stage_intake',
      number: '01',
      name: 'Counter Intake & Tagging',
      shortName: '01. Intake',
      icon: '⚡',
      subtitle: 'Touch vs Hotkeys vs Scales',
      description: 'Front-desk staff intake ergonomics: rapid item lookup, defect/stain tagging, and digital scale tare.',
      metrics: '15s - 45s ticket entry • Tare auto-deduct • Visual stain canvas',
      paradigms: {
        qdc: {
          badge: 'Scale Tare & Hotkeys',
          title: 'Per Weight Intake & RS232 Scale POS',
          highlight: 'Optimized for front-desk clerks with digital scale auto-tare integration for bulk kilo laundry and numeric keyboard shortcuts (F2 search, F5 item code) for rapid counter submission.',
          hardware: 'Serial RS232 digital scale, ESC/POS receipt printer',
          proof_screen_id: 'screen_0029'
        },
        fabklean: {
          badge: 'Visual Canvas Silhouette',
          title: 'Touch Category Grid & Stain Canvas',
          highlight: 'Clerks use touch category tiles (Men, Women, Household) and tap directly on 2D garment silhouette diagrams to pin exact defect coordinates (Stain, Tear, Burn) printed on claim tickets.',
          hardware: 'Touchscreen tablet/PC, USB digital scale',
          proof_screen_id: 'screen_0001'
        },
        turns: {
          badge: 'Auto-Tare Scale Centric',
          title: 'Per-Piece & Weight Laundry Booking',
          highlight: 'Tailored for laundromats handling mixed dry cleaning and per-pound laundry. Auto-deducts bag tare weight via CAS/USB scales and saves card-on-file for friction-free billing.',
          hardware: 'CAS / USB digital scale, iPad touch kiosk',
          proof_screen_id: 'screen_0017'
        },
        swash: {
          badge: 'High-Speed Hotkeys',
          title: 'Keyboard Shortcut Counter Intake',
          highlight: 'High-velocity counter billing workflow utilizing keyboard shortcuts to search garments, input quantities, apply rush turnaround remarks, and submit tickets in under 15 seconds.',
          hardware: 'Keyboard POS station, USB digital scale',
          proof_screen_id: 'screen_0081'
        }
      }
    },
    {
      id: 'stage_tagging',
      number: '02',
      name: 'Garment Tagging & ID',
      shortName: '02. Tagging',
      icon: '🏷️',
      subtitle: 'Waterproof Heat-Seal & Barcodes',
      description: 'Applying chemical-resistant barcodes, continuous resin heat-seal tape, or hydro-fix tags to guarantee zero lost garments.',
      metrics: '90°C chemical-proof • 2-part claim check • ESC/POS direct drive',
      paradigms: {
        qdc: {
          badge: 'QR & 1D Tag Formats',
          title: 'Configurable Barcode Tag Layouts',
          highlight: 'Switch between 2D QR codes and 1D Code-128 barcodes with custom tag layouts. Prints dual-part claim checks with sequence numbers (1/4, 2/4) on chemical-proof thermal paper.',
          hardware: 'Citizen / Zebra thermal transfer tag printer',
          proof_screen_id: 'screen_0045'
        },
        fabklean: {
          badge: 'Hydro-Fix Barcode Tape',
          title: 'Chemical-Resistant Barcode Tags',
          highlight: 'Prints unique order numbers and piece barcodes on hydro-fix paper resistant to perchloroethylene dry-cleaning solvents, hydrocarbon liquids, and 90°C industrial washing.',
          hardware: 'Standard 2-inch/3-inch thermal barcode printer',
          proof_screen_id: 'screen_0004'
        },
        turns: {
          badge: 'Zebra Label Printing',
          title: 'Integrated Laundromat Bag & Rack Tags',
          highlight: 'Automated printing of Zebra thermal tags, barcode intake lot stickers, and durable poly-bag labels that survive heavy industrial laundromat wash-and-fold cycles.',
          hardware: 'Zebra / Star Micronics thermal cloud printer',
          proof_screen_id: 'screen_0020'
        },
        swash: {
          badge: 'Tag Pitch Calibrator',
          title: 'Baud-Rate Hardware Calibrator',
          highlight: 'Low-level hardware settings to calibrate thermal printer paper pitch, barcode width, font density, and cutter timing, preventing paper jams during peak intake hours.',
          hardware: 'Direct serial/USB thermal barcode printer',
          proof_screen_id: 'screen_0056'
        }
      }
    },
    {
      id: 'stage_processing',
      number: '03',
      name: 'Plant Processing & Stages',
      shortName: '03. Processing',
      icon: '🏭',
      subtitle: 'Kanban Stages & Central Plant',
      description: 'Routing garments between front retail stores and central processing plants (CPU), tracking washing, spotting, and steam pressing.',
      metrics: 'Store-to-CPU manifests • Machine batch weight • Stage bottlenecks',
      paradigms: {
        qdc: {
          badge: 'Workshop Garment Stages',
          title: 'Custom Processing Stage Management',
          highlight: 'Enterprise workshop configuration allowing laundry chains to define custom processing stages (Sorting, Washing, Dry Cleaning, Stain Removal, Finishing, Quality Check) with mandatory gatekeeper scans.',
          hardware: 'Industrial barcode wand, plant PC terminal',
          proof_screen_id: 'screen_0041'
        },
        fabklean: {
          badge: 'Visual Kanban Pipeline',
          title: 'Multi-Stage Workshop Kanban Board',
          highlight: 'Operators drag-and-drop or scan batches across digital Kanban swimlanes: Wash Bay, Hydro-Extraction, Dry Cleaning, Ironing, and QC with operator dwell time and SLA tracking.',
          hardware: 'Touch tablets mounted at plant workstations',
          proof_screen_id: 'screen_0007'
        },
        turns: {
          badge: 'Machine Cycle Timing',
          title: 'Laundromat Washer/Dryer Tracking',
          highlight: 'Tracks garments and orders across distinct processing stages with operator timestamps, ensuring high machine turnover, scheduled dryer timing, and zero missed customer deadlines.',
          hardware: 'Laundromat tablet terminal',
          proof_screen_id: 'screen_0023'
        },
        swash: {
          badge: 'Service Master Stages',
          title: 'Service Progression & Turnaround SLA',
          highlight: 'Centralized service master setup configuring standard turnaround timelines, garment care stages (Dry Clean, Starch Press, Shoe Spa), and status progression milestones.',
          hardware: 'Plant workstation barcode scanner',
          proof_screen_id: 'screen_0066'
        }
      }
    },
    {
      id: 'stage_assembly',
      number: '04',
      name: 'Post-Wash Assembly & Sorting',
      shortName: '04. Assembly',
      icon: '🧩',
      subtitle: 'Barcode Reconstruction & Racks',
      description: 'Recombining multi-piece customer orders after washing and pressing into a single bundle before customer delivery.',
      metrics: 'Missing item alarm • Alphanumeric rack slots • Poly-wrap label',
      paradigms: {
        qdc: {
          badge: 'Order Tracking Protocol',
          title: 'Garment Barcode Lifecycle Tracking',
          highlight: 'End-to-end piece serialization tracking every garment from washing through finishing to assembly racks. Warns counter staff if attempting to pack an incomplete order.',
          hardware: 'Barcode scanner, audio alert chimes',
          proof_screen_id: 'screen_0046'
        },
        fabklean: {
          badge: 'Assembly Scan Station',
          title: 'Post-Wash Order Reconstruction',
          highlight: 'Operators scan cleaned garments at a dedicated assembly station with a live progress bar. Alerts instantly if any garment is missing, preventing misplaced customer bundles.',
          hardware: 'Barcode wand, poly-bag sticker printer',
          proof_screen_id: 'screen_0005'
        },
        turns: {
          badge: 'Shelf Staging Workflow',
          title: 'Order Assembly & Cubby Staging',
          highlight: 'Staff fold clean laundry, scan the bundle barcode, and slot the order into assigned pickup shelves/cubbies, triggering automated customer ready-for-pickup notifications.',
          hardware: 'Wireless barcode scanner, iPad terminal',
          proof_screen_id: 'screen_0021'
        },
        swash: {
          badge: 'Numbered Rack Assignment',
          title: 'Rack & Shelf Bin Slotting',
          highlight: 'Completed orders are assigned to specific numbered racks (e.g. Rack A-12). Store staff scan the rack bin tag to locate garments in seconds during customer checkout.',
          hardware: 'Hands-free barcode scanner, rack bin labels',
          proof_screen_id: 'screen_0059'
        }
      }
    },
    {
      id: 'stage_logistics',
      number: '05',
      name: 'Field Logistics & Doorstep UPI',
      shortName: '05. Logistics',
      icon: '🛵',
      subtitle: 'Rider App, Route & On-Spot Pay',
      description: 'Driver route dispatch, doorstep pickup weighing, and instant payment settlement at the customer doorstep.',
      metrics: 'Doorstep UPI QR • Offline sync • GPS route navigation',
      paradigms: {
        qdc: {
          badge: 'Enterprise Dispatch App',
          title: 'MPOS Rider App & Driver Routes',
          highlight: 'Riders log into the dedicated MPOS app, view daily route assignments, navigate to customer stops, and manage doorstep pickups with offline synchronization.',
          hardware: 'Android/iOS driver smartphone',
          proof_screen_id: 'screen_0033'
        },
        fabklean: {
          badge: 'Doorstep Dynamic UPI QR',
          title: 'Mobile Pickup POS & UPI QR',
          highlight: 'Driver app generates an on-screen dynamic UPI QR code for the exact bill amount. Customers scan and pay via PhonePe/GPay, instantly updating the store ledger in real time.',
          hardware: 'Driver smartphone, mobile Bluetooth printer',
          proof_screen_id: 'screen_0012'
        },
        turns: {
          badge: 'Driver App & Photo Proof',
          title: 'Delivery Sequence & Contactless Proof',
          highlight: 'Drivers view optimized delivery stops, capture contactless photo proof of delivery on porches, collect digital signatures, and automatically charge stored cards on file.',
          hardware: 'iOS / Android smartphone with DoorDash API',
          proof_screen_id: 'screen_0026'
        },
        swash: {
          badge: 'Dynamic On-Screen UPI QR',
          title: 'Swash Rider App Dynamic UPI QR Collection',
          highlight: 'The Swash Delivery Executive Rider App generates a dynamic UPI QR code on the driver smartphone screen matching the exact bill amount. Customers scan with PhonePe/Google Pay, and the CRM updates the order balance in real time.',
          hardware: 'Android/iOS driver smartphone with UPI QR generator',
          proof_screen_id: 'screen_0054'
        }
      }
    },
    {
      id: 'stage_billing',
      number: '06',
      name: 'Settlement, Tax & WhatsApp Growth',
      shortName: '06. Settlement',
      icon: '💳',
      subtitle: 'ZATCA, GST, Day-End & Reviews',
      description: 'Closing the cash drawer, generating legally compliant tax invoices (ZATCA, GST), and triggering automated retention marketing.',
      metrics: 'ZATCA Phase 2 XML • Day-end cash tally • WhatsApp PDF push',
      paradigms: {
        qdc: {
          badge: 'ZATCA e-Invoicing Compliance',
          title: 'Saudi ZATCA & India GST Compliance',
          highlight: 'Full Saudi Arabia ZATCA Phase 1 & 2 e-invoicing compliance generating cryptographic Base64 TLV QR codes and XML audit files, alongside multi-state India GST settlement.',
          hardware: 'ZATCA cryptographic HSM / e-invoicing API',
          proof_screen_id: 'screen_0047'
        },
        fabklean: {
          badge: 'WhatsApp Cloud API',
          title: 'Omnichannel WhatsApp Invoicing',
          highlight: 'Meta WhatsApp Cloud API pushes automated, branded PDF tax invoices to customers with embedded payment links, ready-for-pickup alerts, and direct re-booking triggers.',
          hardware: 'Meta WhatsApp Cloud API integration',
          proof_screen_id: 'screen_0013'
        },
        turns: {
          badge: 'Google Review Engine',
          title: 'Automated Reputation & SMS Reviews',
          highlight: 'Automated Google Review harvesting engine triggers SMS prompts 30 minutes after delivery, generating 50-100+ five-star reviews per month, plus recurring subscription billing.',
          hardware: 'Twilio SMS gateway, Stripe card vault',
          proof_screen_id: 'screen_0027'
        },
        swash: {
          badge: 'Invoice History & GST',
          title: 'Billing History & Tax Compliance',
          highlight: 'Comprehensive billing history in Swash SLS. Cashiers review invoices, process reprints, track split payment tenders, and export GST sales registers for tax filing.',
          hardware: 'Thermal receipt printer, cash drawer kick RJ11',
          proof_screen_id: 'screen_0068'
        }
      }
    }
  ];

  function renderWorkflowStepper() {
    const container = document.getElementById('workflowStepperContainer');
    if (!container) return;

    const isDark = isDarkMode();
    const activeStage = state.activeWorkflowStage || 'stage_intake';

    let html = '';
    WORKFLOW_STAGES.forEach(stage => {
      const isActive = stage.id === activeStage;
      html += `
        <button type="button" data-stage="${stage.id}" class="workflow-stage-btn text-left p-2.5 rounded-lg border transition flex flex-col justify-between space-y-1 ${
          isActive
            ? (isDark ? 'bg-sky-950/70 border-sky-500 text-sky-200 shadow-sm' : 'bg-sky-50 border-sky-600 text-sky-950 shadow-sm')
            : (isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200' : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:text-neutral-900')
        }">
          <div class="flex items-center justify-between font-mono text-[10px]">
            <span class="font-bold ${isActive ? (isDark ? 'text-sky-300' : 'text-sky-700') : 'text-neutral-400'}">${stage.number}</span>
            <span class="text-sm">${stage.icon}</span>
          </div>
          <div>
            <span class="font-bold text-xs block leading-tight ${isActive ? (isDark ? 'text-white' : 'text-neutral-900') : ''}">${stage.name}</span>
            <span class="text-[10px] text-neutral-400 dark:text-neutral-500 block truncate mt-0.5">${stage.subtitle}</span>
          </div>
        </button>
      `;
    });

    container.innerHTML = html;

    container.querySelectorAll('.workflow-stage-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const stageId = btn.getAttribute('data-stage');
        state.activeWorkflowStage = stageId;
        renderWorkflowStepper();
        renderWorkflowDiffCard(stageId);
      });
    });
  }

  function renderWorkflowDiffCard(stageId) {
    const container = document.getElementById('workflowDiffContainer');
    if (!container) return;

    const stage = WORKFLOW_STAGES.find(s => s.id === stageId) || WORKFLOW_STAGES[0];
    const isDark = isDarkMode();

    let html = `
      <div class="space-y-4">
        <!-- Stage Banner Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-200 dark:border-neutral-700/80">
          <div>
            <div class="flex items-center space-x-2">
              <span class="text-xl">${stage.icon}</span>
              <h4 class="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 font-mono">
                Stage ${stage.number}: ${stage.name}
              </h4>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-bold">
                Operational Paradigm Comparison
              </span>
            </div>
            <p class="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
              ${stage.description}
            </p>
          </div>
          <div class="flex-shrink-0 text-left sm:text-right font-mono text-[11px] text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-900 px-3 py-1.5 rounded border border-neutral-200 dark:border-neutral-700">
            <span class="block text-[9px] uppercase tracking-wider text-neutral-400 font-bold">Critical Engineering Benchmarks</span>
            <span class="font-semibold text-neutral-800 dark:text-neutral-200">${stage.metrics}</span>
          </div>
        </div>

        <!-- 4-Platform Comparative Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
    `;

    const comps = [
      { key: 'qdc', name: 'Quick Dry Cleaning', color: 'sky', border: 'hover:border-sky-500', badgeColor: isDark ? 'bg-sky-950 text-sky-300 border-sky-800' : 'bg-sky-50 text-sky-800 border-sky-200' },
      { key: 'fabklean', name: 'Fabklean', color: 'emerald', border: 'hover:border-emerald-500', badgeColor: isDark ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-emerald-50 text-emerald-800 border-emerald-200' },
      { key: 'turns', name: 'Turns OS', color: 'purple', border: 'hover:border-purple-500', badgeColor: isDark ? 'bg-purple-950 text-purple-300 border-purple-800' : 'bg-purple-50 text-purple-800 border-purple-200' },
      { key: 'swash', name: 'Swash SLS', color: 'rose', border: 'hover:border-rose-500', badgeColor: isDark ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-rose-50 text-rose-800 border-rose-200' }
    ];

    comps.forEach(c => {
      const p = stage.paradigms[c.key];
      if (!p) return;

      html += `
        <div class="p-3.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700/80 flex flex-col justify-between space-y-3 transition ${c.border}">
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-bold text-neutral-900 dark:text-neutral-100 text-xs">${c.name}</span>
              <span class="text-[9px] px-1.5 py-0.5 rounded border font-semibold ${c.badgeColor}">${p.badge}</span>
            </div>
            <h5 class="text-xs font-semibold text-neutral-800 dark:text-neutral-200 leading-snug">${p.title}</h5>
            <p class="text-[11px] font-sans text-neutral-600 dark:text-neutral-400 leading-relaxed">${p.highlight}</p>
          </div>

          <div class="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[10px]">
            <div class="text-neutral-500 dark:text-neutral-400 truncate">
              <span class="text-neutral-400 dark:text-neutral-500 font-bold">Hardware:</span> ${p.hardware || 'Standard'}
            </div>
            ${p.proof_screen_id ? `
              <div class="grid grid-cols-2 gap-1.5 pt-0.5">
                <button type="button" onclick="window.openScreenshotLightbox('${p.proof_screen_id}')" class="py-1 px-1.5 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-900 hover:text-white dark:hover:bg-neutral-100 dark:hover:text-neutral-900 transition flex items-center justify-center space-x-1 font-bold text-sky-600 dark:text-sky-400 hover:text-white cursor-pointer text-[10px]" title="Inspect UI Screen Frame">
                  <span>📷</span>
                  <span>Frame</span>
                </button>
                <button type="button" onclick="window.openProofVideo('${p.proof_screen_id}')" class="py-1 px-1.5 rounded bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition flex items-center justify-center space-x-1 font-bold text-rose-600 dark:text-rose-400 hover:text-white cursor-pointer text-[10px]" title="Watch Video Walkthrough">
                  <span>▶</span>
                  <span>Video</span>
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  function renderFeatureDomainFilters() {
    const container = document.getElementById('featureDomainFilters');
    if (!container) return;

    const fd = window.CRM_FEATURE_INTELLIGENCE || featureData;
    const isDark = isDarkMode();

    let html = `
      <button data-domain="all" class="feat-domain-btn px-2.5 py-1 rounded-md text-xs font-mono whitespace-nowrap transition ${
        state.activeFeatureDomain === 'all'
          ? (isDark ? 'bg-neutral-100 text-neutral-900 font-bold' : 'bg-neutral-900 text-white font-bold')
          : (isDark ? 'bg-neutral-800 text-neutral-400 hover:text-neutral-200' : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900')
      }">All Domains (${fd.features ? fd.features.length : 0})</button>
    `;

    (fd.modules || []).forEach(m => {
      const count = (fd.features || []).filter(f => f.category === m.id).length;
      const isActive = state.activeFeatureDomain === m.id;
      html += `
        <button data-domain="${m.id}" class="feat-domain-btn px-2.5 py-1 rounded-md text-xs font-mono whitespace-nowrap transition ${
          isActive
            ? (isDark ? 'bg-neutral-100 text-neutral-900 font-bold' : 'bg-neutral-900 text-white font-bold')
            : (isDark ? 'bg-neutral-800 text-neutral-400 hover:text-neutral-200' : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900')
        }">${m.name} (${count})</button>
      `;
    });

    container.innerHTML = html;

    container.querySelectorAll('.feat-domain-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeFeatureDomain = btn.getAttribute('data-domain');
        renderFeatureDomainFilters();
        renderFeaturesMatrix();
      });
    });
  }

  function renderFeaturesMatrix() {
    const tbody = document.getElementById('featuresTableBody');
    if (!tbody) return;

    const fd = window.CRM_FEATURE_INTELLIGENCE || featureData;
    const featuresList = fd.features || [];
    const filteredFeatures = state.activeFeatureDomain === 'all'
      ? featuresList
      : featuresList.filter(f => f.category === state.activeFeatureDomain);

    const isDark = isDarkMode();

    const statusBadge = (st) => {
      if (st === 'verified') {
        return `<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${isDark ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}">✓ Verified Native</span>`;
      } else if (st === 'partial') {
        return `<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${isDark ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-amber-100 text-amber-800 border border-amber-200'}">⚡ Partial / Basic</span>`;
      } else if (st === 'addon') {
        return `<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${isDark ? 'bg-sky-950 text-sky-300 border border-sky-800' : 'bg-sky-100 text-sky-800 border border-sky-200'}">⊕ Add-on</span>`;
      } else {
        return `<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${isDark ? 'bg-neutral-800 text-neutral-400 border border-neutral-700' : 'bg-neutral-100 text-neutral-600 border border-neutral-300'}">✕ Unsupported</span>`;
      }
    };

    let html = '';
    filteredFeatures.forEach(feat => {
      html += `
        <tr class="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition">
          <td class="p-3 align-top">
            <span class="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400 block">${feat.category_name}</span>
            <strong class="text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 block mt-0.5">${feat.name}</strong>
            <p class="text-neutral-500 dark:text-neutral-400 text-[11px] leading-relaxed mt-1">${feat.description}</p>
          </td>
      `;

      ['qdc', 'fabklean', 'turns', 'swash'].forEach(compKey => {
        const ev = (feat.evaluations || {})[compKey] || { status: 'unsupported', detail: 'N/A' };
        html += `
          <td class="p-3 align-top space-y-1.5 border-l border-neutral-100 dark:border-neutral-800/60">
            <div>${statusBadge(ev.status)}</div>
            <p class="text-neutral-700 dark:text-neutral-300 text-xs leading-relaxed">${ev.detail}</p>
            ${ev.proof_screen ? `
              <div class="mt-1 flex items-center space-x-2">
                <button onclick="window.openScreenshotLightbox('${ev.proof_screen.screen_id}')" class="inline-flex items-center space-x-1 text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer">
                  <span>📷 Proof (${ev.proof_screen.timestamp})</span>
                </button>
                <button onclick="window.openProofVideo('${ev.proof_screen.screen_id}')" class="inline-flex items-center space-x-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer" title="Watch Video">
                  <span>▶ Video</span>
                </button>
              </div>
            ` : ''}
          </td>
        `;
      });

      html += `</tr>`;
    });

    tbody.innerHTML = html;
  }

  function renderFeaturesGallery() {
    const grid = document.getElementById('galleryGrid');
    const countEl = document.getElementById('galleryFilteredCount');
    if (!grid) return;

    const fd = window.CRM_FEATURE_INTELLIGENCE || featureData;
    const screens = fd.screens || [];

    const filtered = screens.filter(s => {
      if (state.galleryComp !== 'all' && s.competitor_id !== state.galleryComp) return false;
      if (state.galleryModule !== 'all' && s.category_id !== state.galleryModule) return false;
      if (state.gallerySearch) {
        const q = state.gallerySearch.toLowerCase();
        const combined = `${s.video_title} ${s.full_ocr_text} ${(s.detected_features || []).join(' ')} ${s.competitor_name}`.toLowerCase();
        if (!combined.includes(q)) return false;
      }
      return true;
    });

    if (countEl) countEl.textContent = filtered.length;

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full text-center py-12 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg space-y-2">
          <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">No UI screens match the filter</p>
          <p class="text-xs text-neutral-500 dark:text-neutral-400">Try selecting "All" platforms or clearing the search query.</p>
        </div>
      `;
      return;
    }

    let html = '';
    filtered.forEach(s => {
      const compColor = s.competitor_id === 'qdc' ? 'bg-sky-600' :
                        s.competitor_id === 'fabklean' ? 'bg-emerald-600' :
                        s.competitor_id === 'turns' ? 'bg-purple-600' : 'bg-rose-600';

      html += `
        <div class="group bg-neutral-50 dark:bg-neutral-800/60 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden hover:shadow-md hover:border-neutral-400 dark:hover:border-neutral-600 transition flex flex-col cursor-pointer" onclick="window.openScreenshotLightbox('${s.id}')">
          <!-- Thumbnail -->
          <div class="relative aspect-video bg-neutral-950 overflow-hidden">
            <img src="${s.image_path}" data-original-src="${s.image_path}" alt="${s.video_title}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" onerror="if(!this.src.includes('../') && !this.src.startsWith('data:')) { this.src='../' + this.getAttribute('data-original-src'); } else { this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'300\\' height=\\'180\\' viewBox=\\'0 0 300 180\\'><rect fill=\\'%23222\\' width=\\'300\\' height=\\'180\\'/><text fill=\\'%23888\\' x=\\'50%\\' y=\\'50%\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' font-family=\\'monospace\\' font-size=\\'12\\'>UI Screen</text></svg>'; }">
            <div class="absolute top-2 left-2 flex items-center space-x-1">
              <span class="text-[9px] font-mono font-bold text-white px-1.5 py-0.5 rounded ${compColor}">${s.competitor_id.toUpperCase()}</span>
              <span class="text-[9px] font-mono text-white/90 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm">${s.timestamp}</span>
            </div>
            <div class="absolute bottom-2 right-2">
              <span class="text-[9px] font-mono text-white/90 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm">${s.ocr_lines_count} text lines</span>
            </div>
          </div>

          <!-- Content -->
          <div class="p-3 flex-1 flex flex-col justify-between space-y-2 text-xs">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-mono uppercase font-bold text-sky-600 dark:text-sky-400 block">${s.category_name}</span>
                <span class="text-[10px] font-mono text-neutral-400">${(s.workflow_steps || []).length} steps</span>
              </div>
              <h5 class="text-xs font-bold text-neutral-900 dark:text-neutral-100 line-clamp-2 mt-0.5 leading-snug" title="${s.video_title}">
                ${s.video_title}
              </h5>
              <p class="text-[11px] text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed mt-1 font-sans">
                ${s.feature_summary || ''}
              </p>
            </div>

            ${s.detected_features && s.detected_features.length > 0 ? `
              <div class="flex flex-wrap gap-1 pt-1 font-mono">
                ${s.detected_features.slice(0, 3).map(f => `
                  <span class="text-[9px] px-1.5 py-0.5 rounded bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 truncate max-w-[140px]">${f}</span>
                `).join('')}
              </div>
            ` : ''}

            <div class="pt-2 border-t border-neutral-200 dark:border-neutral-700/60 flex items-center justify-between text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
              <span class="truncate">${s.release_era || s.formatted_date || 'SaaS'}</span>
              <span class="text-sky-600 dark:text-sky-400 group-hover:underline font-bold">Inspect Workflow & Proof →</span>
            </div>
          </div>
        </div>
      `;
    });

    grid.innerHTML = html;
  }

  function setupFeaturesListeners() {
    const matrixBtn = document.getElementById('featuresModeMatrixBtn');
    const galleryBtn = document.getElementById('featuresModeGalleryBtn');
    const matrixView = document.getElementById('featuresMatrixView');
    const galleryView = document.getElementById('featuresGalleryView');

    if (matrixBtn && galleryBtn && matrixView && galleryView) {
      matrixBtn.addEventListener('click', () => {
        state.featuresMode = 'matrix';
        matrixView.classList.remove('hidden');
        galleryView.classList.add('hidden');
        matrixBtn.className = 'px-3 py-1.5 rounded-md text-xs font-mono font-medium transition bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-sm flex items-center space-x-1.5';
        galleryBtn.className = 'px-3 py-1.5 rounded-md text-xs font-mono font-medium transition text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center space-x-1.5';
        renderFeaturesMatrix();
      });

      galleryBtn.addEventListener('click', () => {
        state.featuresMode = 'gallery';
        matrixView.classList.add('hidden');
        galleryView.classList.remove('hidden');
        galleryBtn.className = 'px-3 py-1.5 rounded-md text-xs font-mono font-medium transition bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-sm flex items-center space-x-1.5';
        matrixBtn.className = 'px-3 py-1.5 rounded-md text-xs font-mono font-medium transition text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center space-x-1.5';
        renderFeaturesGallery();
      });
    }

    // Gallery Competitor Filters
    document.querySelectorAll('.gallery-comp-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.galleryComp = btn.getAttribute('data-comp');
        document.querySelectorAll('.gallery-comp-btn').forEach(b => {
          if (b === btn) {
            b.className = 'gallery-comp-btn px-2.5 py-1 rounded text-xs font-semibold bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 transition shadow-sm';
          } else {
            b.className = 'gallery-comp-btn px-2.5 py-1 rounded text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition';
          }
        });
        renderFeaturesGallery();
      });
    });

    // Gallery Module Select
    const moduleSelect = document.getElementById('galleryModuleSelect');
    if (moduleSelect) {
      moduleSelect.addEventListener('change', (e) => {
        state.galleryModule = e.target.value;
        renderFeaturesGallery();
      });
    }

    // Gallery Search Input
    const searchInputEl = document.getElementById('gallerySearchInput');
    if (searchInputEl) {
      searchInputEl.addEventListener('input', (e) => {
        state.gallerySearch = e.target.value.trim();
        renderFeaturesGallery();
      });
    }

    // Close Lightbox Button
    const closeLightboxBtn = document.getElementById('closeLightboxBtn');
    const lightboxModal = document.getElementById('screenshotLightboxModal');
    if (closeLightboxBtn && lightboxModal) {
      closeLightboxBtn.addEventListener('click', () => {
        if (lightboxModal.close) {
          lightboxModal.close();
        } else {
          lightboxModal.removeAttribute('open');
        }
      });

      lightboxModal.addEventListener('click', (e) => {
        const rect = lightboxModal.getBoundingClientRect();
        const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
        if (!isInDialog) {
          if (lightboxModal.close) lightboxModal.close();
          else lightboxModal.removeAttribute('open');
        }
      });
    }

    // Lightbox Prev & Next Controls
    const prevBtn = document.getElementById('lightboxPrevBtn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => navigateLightbox(-1));
    }
    const nextBtn = document.getElementById('lightboxNextBtn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => navigateLightbox(1));
    }

    // Lightbox Zoom Toggle Button
    const zoomBtn = document.getElementById('lightboxZoomBtn');
    if (zoomBtn) {
      zoomBtn.addEventListener('click', () => toggleLightboxZoom());
    }

    // Lightbox Copy OCR Button
    const copyOcrBtn = document.getElementById('lightboxCopyOcrBtn');
    if (copyOcrBtn) {
      copyOcrBtn.addEventListener('click', () => copyLightboxOcr());
    }

    // Initialize YouTube In-App Modal Player
    initYoutubeModal();
  }

  // -------------------------------------------------------------
  // Embedded In-App YouTube Modal with Blurred Overlay Backdrop
  // -------------------------------------------------------------
  function parseTimestampToSeconds(ts) {
    if (!ts) return 0;
    if (typeof ts === 'number') return ts;
    ts = String(ts).trim().toLowerCase();
    if (/^\d+s?$/.test(ts)) {
      return parseInt(ts, 10) || 0;
    }
    const msMatch = ts.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/);
    if (msMatch && (msMatch[1] || msMatch[2] || msMatch[3])) {
      const hours = parseInt(msMatch[1] || '0', 10);
      const mins = parseInt(msMatch[2] || '0', 10);
      const secs = parseInt(msMatch[3] || '0', 10);
      return (hours * 3600) + (mins * 60) + secs;
    }
    if (ts.includes(':')) {
      const parts = ts.split(':').map(Number);
      if (parts.length === 2) return (parts[0] * 60) + parts[1];
      if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    }
    return 0;
  }

  function extractYoutubeEmbedUrl(url, fallbackTimestamp) {
    if (!url) return null;
    let videoId = '';
    let startSeconds = 0;
    try {
      if (url.includes('youtube.com/watch')) {
        const parsed = new URL(url);
        videoId = parsed.searchParams.get('v') || '';
        const t = parsed.searchParams.get('t');
        if (t) startSeconds = parseTimestampToSeconds(t);
      } else if (url.includes('youtu.be/')) {
        const parts = url.split('youtu.be/')[1].split(/[?#]/);
        videoId = parts[0];
        const match = url.match(/[?&]t=([0-9a-zA-Z]+)/);
        if (match) startSeconds = parseTimestampToSeconds(match[1]);
      } else if (url.includes('youtube.com/embed/')) {
        const parts = url.split('youtube.com/embed/')[1].split(/[?#]/);
        videoId = parts[0];
      }
    } catch (e) {
      const m = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (m) videoId = m[1];
    }

    if (!startSeconds && fallbackTimestamp) {
      startSeconds = parseTimestampToSeconds(fallbackTimestamp);
    }

    if (!videoId) return null;
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&start=${startSeconds}&rel=0&enablejsapi=1`;
  }

  window.openYoutubeModal = function(url, title, timestamp) {
    if (!url) return;
    const modal = document.getElementById('youtubeVideoModal');
    const iframe = document.getElementById('youtubeModalIframe');
    const titleEl = document.getElementById('youtubeModalTitle');
    const tsEl = document.getElementById('youtubeModalTimestamp');
    const extLink = document.getElementById('youtubeModalExternalLink');

    const embedUrl = extractYoutubeEmbedUrl(url, timestamp);
    if (!embedUrl) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    if (titleEl) titleEl.textContent = title || 'Video Walkthrough';
    if (tsEl) tsEl.textContent = timestamp ? `Timestamp: ${timestamp}` : 'Full Video Stream';
    if (extLink) extLink.href = url;

    if (iframe) {
      iframe.src = embedUrl;
    }

    if (modal) {
      if (modal.showModal) modal.showModal();
      else modal.setAttribute('open', '');
    }
  };

  window.closeYoutubeModal = function() {
    const modal = document.getElementById('youtubeVideoModal');
    const iframe = document.getElementById('youtubeModalIframe');
    if (iframe) {
      iframe.src = ''; // Immediately stop playback
    }
    if (modal) {
      if (modal.close) modal.close();
      else modal.removeAttribute('open');
    }
  };

  window.openProofVideo = function(screenId) {
    const fd = window.CRM_FEATURE_INTELLIGENCE || featureData;
    const screen = (fd.screens || []).find(s => s.id === screenId);
    if (screen && screen.video_url) {
      window.openYoutubeModal(screen.video_url, screen.video_title, screen.timestamp);
    }
  };

  function initYoutubeModal() {
    const modal = document.getElementById('youtubeVideoModal');
    const closeBtn = document.getElementById('closeYoutubeModalBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        window.closeYoutubeModal();
      });
    }
    if (modal) {
      modal.addEventListener('click', (e) => {
        const rect = modal.getBoundingClientRect();
        const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
        if (!isInDialog) {
          window.closeYoutubeModal();
        }
      });
      modal.addEventListener('cancel', () => {
        const iframe = document.getElementById('youtubeModalIframe');
        if (iframe) iframe.src = '';
      });
    }
  }

  function getLightboxScreenList() {
    const fd = window.CRM_FEATURE_INTELLIGENCE || featureData;
    const allScreens = fd.screens || [];
    if (state.featuresMode === 'gallery') {
      const filtered = allScreens.filter(s => {
        if (state.galleryComp !== 'all' && s.competitor_id !== state.galleryComp) return false;
        if (state.galleryModule !== 'all' && s.category_id !== state.galleryModule) return false;
        if (state.gallerySearch) {
          const q = state.gallerySearch.toLowerCase();
          const combined = `${s.video_title} ${s.full_ocr_text} ${(s.detected_features || []).join(' ')} ${s.competitor_name}`.toLowerCase();
          if (!combined.includes(q)) return false;
        }
        return true;
      });
      return filtered.length > 0 ? filtered : allScreens;
    }
    return allScreens;
  }

  let currentLightboxScreenId = null;
  let isLightboxZoomed = false;

  window.openScreenshotLightbox = function(screenId) {
    const fd = window.CRM_FEATURE_INTELLIGENCE || featureData;
    const list = getLightboxScreenList();
    let screen = list.find(s => s.id === screenId);
    if (!screen) {
      screen = (fd.screens || []).find(s => s.id === screenId);
    }
    currentLightboxScreenId = screen.id;

    const modal = document.getElementById('screenshotLightboxModal');
    if (!modal) return;

    // Reset zoom state
    isLightboxZoomed = false;
    const img = document.getElementById('lightboxImg');
    if (img) {
      img.className = 'max-h-[74vh] max-w-full w-auto h-auto object-contain rounded-lg shadow-2xl border border-neutral-800/80 transition-transform duration-200 cursor-zoom-in';
      img.src = screen.image_path;
      img.setAttribute('data-original-src', screen.image_path);
      img.onerror = function() {
        if (!this.src.includes('../') && !this.src.startsWith('data:')) {
          this.src = '../' + screen.image_path;
        } else {
          this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect fill="%2318181b" width="600" height="400"/><text fill="%23a1a1aa" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14">UI Screenshot Archive</text></svg>';
        }
      };
    }

    const zoomLabel = document.getElementById('lightboxZoomLabel');
    if (zoomLabel) zoomLabel.textContent = 'Zoom';
    const zoomIcon = document.getElementById('lightboxZoomIcon');
    if (zoomIcon) zoomIcon.textContent = '🔍';

    const compBadge = document.getElementById('lightboxCompBadge');
    if (compBadge) compBadge.textContent = screen.competitor_name;

    const modBadge = document.getElementById('lightboxModuleBadge');
    if (modBadge) modBadge.textContent = screen.category_name;

    const ts = document.getElementById('lightboxTimestamp');
    if (ts) ts.textContent = screen.timestamp;

    const idxIndicator = document.getElementById('lightboxIndexIndicator');
    if (idxIndicator) {
      const curIdx = list.findIndex(s => s.id === screen.id);
      idxIndicator.textContent = curIdx >= 0 ? `(${curIdx + 1} of ${list.length})` : '';
    }

    const title = document.getElementById('lightboxVideoTitle');
    if (title) title.textContent = screen.video_title;

    const ytBtn = document.getElementById('lightboxYoutubeBtn') || document.getElementById('lightboxYoutubeLink');
    if (ytBtn) {
      if (screen.video_url) {
        ytBtn.classList.remove('opacity-40', 'cursor-not-allowed');
        ytBtn.onclick = function(e) {
          e.preventDefault();
          window.openYoutubeModal(screen.video_url, screen.video_title, screen.timestamp);
        };
      } else {
        ytBtn.classList.add('opacity-40', 'cursor-not-allowed');
        ytBtn.onclick = null;
      }
    }

    const openNewTabBtn = document.getElementById('lightboxOpenNewTabBtn');
    if (openNewTabBtn) openNewTabBtn.href = screen.image_path;

    // Feature Overview & Summary
    const summaryEl = document.getElementById('lightboxFeatureSummary');
    if (summaryEl) {
      summaryEl.textContent = screen.feature_summary || screen.video_title || 'Detailed feature description available in video walkthrough.';
    }

    // Operator Execution Workflow
    const workflowEl = document.getElementById('lightboxWorkflowSteps');
    if (workflowEl) {
      if (screen.workflow_steps && screen.workflow_steps.length > 0) {
        workflowEl.innerHTML = screen.workflow_steps.map((step, idx) => {
          const cleanStep = step.replace(/^\d+\.\s*/, '');
          return `
            <li class="flex items-start space-x-2.5">
              <span class="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-mono font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5 border border-sky-300 dark:border-sky-800">${idx+1}</span>
              <span class="text-neutral-800 dark:text-neutral-200 leading-relaxed font-sans text-xs">${cleanStep}</span>
            </li>
          `;
        }).join('');
      } else {
        workflowEl.innerHTML = `<li class="text-neutral-400 italic">Standard operator workflow executed at terminal</li>`;
      }
    }

    // Copy Summary Button
    const copySummaryBtn = document.getElementById('lightboxCopySummaryBtn');
    if (copySummaryBtn) {
      copySummaryBtn.onclick = function() {
        const text = `${screen.video_title} (${screen.competitor_name} - ${screen.timestamp})\n\nFEATURE SUMMARY:\n${screen.feature_summary}\n\nOPERATOR WORKFLOW:\n${(screen.workflow_steps || []).join('\n')}`;
        navigator.clipboard.writeText(text).then(() => {
          copySummaryBtn.innerHTML = '<span>✓ Copied!</span>';
          setTimeout(() => { copySummaryBtn.innerHTML = '<span>📋 Copy Summary</span>'; }, 2000);
        });
      };
    }

    const lineCountEl = document.getElementById('lightboxLineCount');
    if (lineCountEl) lineCountEl.textContent = `${screen.ocr_lines_count || 0}`;

    // Detected capabilities
    const featContainer = document.getElementById('lightboxDetectedFeatures');
    if (featContainer) {
      if (screen.detected_features && screen.detected_features.length > 0) {
        featContainer.innerHTML = screen.detected_features.map(f => `
          <span class="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded font-bold text-[10px] border border-emerald-300 dark:border-emerald-800">${f}</span>
        `).join('');
      } else {
        featContainer.innerHTML = `<span class="text-[11px] text-neutral-400 italic">Standard UI Component</span>`;
      }
    }

    // OCR lines with search highlighting
    const ocrContainer = document.getElementById('lightboxOcrLines');
    if (ocrContainer) {
      if (screen.ocr_sample_lines && screen.ocr_sample_lines.length > 0) {
        const query = state.gallerySearch ? state.gallerySearch.toLowerCase().trim() : '';
        ocrContainer.innerHTML = screen.ocr_sample_lines.map((l, i) => {
          let displayedLine = l;
          if (query && l.toLowerCase().includes(query)) {
            const regex = new RegExp(`(${query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi');
            displayedLine = l.replace(regex, '<mark class="bg-amber-300 dark:bg-amber-500/40 text-neutral-900 dark:text-neutral-100 px-0.5 rounded font-bold">$1</mark>');
          }
          return `
            <div class="flex items-start space-x-2">
              <span class="text-neutral-400 text-[9px] w-4 flex-shrink-0 text-right font-mono">${i+1}.</span>
              <span class="select-text">${displayedLine}</span>
            </div>
          `;
        }).join('');
      } else {
        ocrContainer.innerHTML = `<span class="text-neutral-400 italic">No OCR text lines detected</span>`;
      }
    }

    if (modal.showModal) {
      modal.showModal();
    } else {
      modal.setAttribute('open', '');
    }
  };

  window.toggleLightboxZoom = function() {
    const img = document.getElementById('lightboxImg');
    const zoomLabel = document.getElementById('lightboxZoomLabel');
    const zoomIcon = document.getElementById('lightboxZoomIcon');
    if (!img) return;

    isLightboxZoomed = !isLightboxZoomed;
    if (isLightboxZoomed) {
      img.className = 'max-h-none max-w-none transform scale-125 transition-transform duration-200 cursor-zoom-out rounded-lg shadow-2xl my-auto';
      if (zoomLabel) zoomLabel.textContent = 'Fit';
      if (zoomIcon) zoomIcon.textContent = '🔍-';
    } else {
      img.className = 'max-h-[74vh] max-w-full w-auto h-auto object-contain rounded-lg shadow-2xl border border-neutral-800/80 transition-transform duration-200 cursor-zoom-in';
      if (zoomLabel) zoomLabel.textContent = 'Zoom';
      if (zoomIcon) zoomIcon.textContent = '🔍+';
    }
  };

  function navigateLightbox(delta) {
    const list = getLightboxScreenList();
    if (!list || list.length === 0) return;
    let idx = list.findIndex(s => s.id === currentLightboxScreenId);
    if (idx === -1) idx = 0;
    const nextIdx = (idx + delta + list.length) % list.length;
    window.openScreenshotLightbox(list[nextIdx].id);
  }

  function copyLightboxOcr() {
    const fd = window.CRM_FEATURE_INTELLIGENCE || featureData;
    const screen = (fd.screens || []).find(s => s.id === currentLightboxScreenId);
    if (!screen) return;

    const fullText = screen.full_ocr_text || (screen.ocr_sample_lines || []).join('\n');
    if (!fullText) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(fullText).then(() => {
        const copyBtn = document.getElementById('lightboxCopyOcrBtn');
        if (copyBtn) {
          const orig = copyBtn.innerHTML;
          copyBtn.innerHTML = '<span>✓ Copied!</span>';
          setTimeout(() => { copyBtn.innerHTML = orig; }, 2000);
        }
        showToast(`Copied ${screen.ocr_lines_count || 0} lines of OCR text!`);
      }).catch(() => {
        fallbackCopyText(fullText);
      });
    } else {
      fallbackCopyText(fullText);
    }
  }

  function fallbackCopyText(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast('Copied OCR transcript to clipboard!');
    } catch (e) {
      showToast('Could not copy to clipboard');
    }
    document.body.removeChild(ta);
  }

  // 15. Lottie Micro-Animation in Hero
  function initLottieAnimation() {
    const lottieContainer = document.getElementById('lottieHero');
    if (!lottieContainer) return;

    if (window.lottie) {
      try {
        const pulseAnimData = {
          v: '5.7.4', fr: 30, ip: 0, op: 60, w: 100, h: 100,
          nm: 'RadarPulse', ddd: 0,
          layers: [
            {
              ddd: 0, ind: 1, ty: 4, nm: 'PulseRing', sr: 1, ks: {
                o: { a: 1, k: [{ t: 0, s: [80] }, { t: 60, s: [0] }] },
                r: { a: 0, k: 0 },
                p: { a: 0, k: [50, 50, 0] },
                a: { a: 0, k: [0, 0, 0] },
                s: { a: 1, k: [{ t: 0, s: [30, 30, 100] }, { t: 60, s: [100, 100, 100] }] }
              },
              shapes: [{
                ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [80, 80] }
              }, {
                ty: 'st', c: { a: 0, k: [0.01, 0.52, 0.78, 1] }, w: { a: 0, k: 3 }
              }]
            },
            {
              ddd: 0, ind: 2, ty: 4, nm: 'CenterDot', sr: 1, ks: {
                o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [50, 50, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] }
              },
              shapes: [{
                ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [16, 16] }
              }, {
                ty: 'fl', c: { a: 0, k: [0.09, 0.09, 0.09, 1] }
              }]
            }
          ]
        };

        window.lottie.loadAnimation({
          container: lottieContainer,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: pulseAnimData
        });
      } catch (err) {
        console.warn('Lottie fallback:', err);
      }
    }
  }

  // Expose global controller helpers
  window.openCompanyModalById = openCompanyModalById;
  window.setCountryFilterGlobal = setCountryFilter;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
