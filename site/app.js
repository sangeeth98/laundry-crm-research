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
    founderFilter: 'all'
  };

  function isDarkMode() {
    return document.documentElement.classList.contains('dark');
  }

  // Chart instances
  let geoChart = null;
  let pricingChart = null;
  let revenueChart = null;

  // DOM Elements
  const companyGrid = document.getElementById('companyGrid');
  const emptyState = document.getElementById('emptyState');
  const filteredCountEl = document.getElementById('filteredCount');
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
    filterAndRender();
  }

  function setupThemeToggle() {
    if (!themeToggleBtn) return;
    themeToggleBtn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      window.dispatchEvent(new Event('themeChanged'));
      initCharts();
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

  function filterAndRender() {
    currentFilteredList = getFilteredCompanies();
    if (filteredCountEl) filteredCountEl.textContent = currentFilteredList.length;

    const isFiltered = state.tier !== 'all' || state.status !== 'all' || state.model !== 'all' || 
                       state.country !== 'all' || state.search !== '' || state.maxPrice < 250;
    
    if (resetFiltersBtn) resetFiltersBtn.classList.toggle('hidden', !isFiltered);
    if (resetCountryBtn) resetCountryBtn.classList.toggle('hidden', state.country === 'all');
    if (clearSearchBtn) clearSearchBtn.classList.toggle('hidden', state.search === '');

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
      const firstPrice = c.pricing.tiers.length > 0 ? c.pricing.tiers[0].price.split('(')[0].trim() : 'Custom';
      const revYears = Object.keys(c.revenue.past_years);
      const latestRev = revYears.length > 0 ? c.revenue.past_years[revYears[revYears.length - 1]] : 'N/A';

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
              <span class="font-bold text-neutral-900 dark:text-neutral-100 truncate block">${firstPrice}</span>
            </div>
            <div>
              <span class="text-emerald-600 dark:text-emerald-400 block text-[9px] uppercase font-bold flex items-center space-x-0.5">
                <span>Actual Rev</span>
                <span title="Audited / Regulatory Registrar Data Point">✓</span>
              </span>
              <span class="font-bold text-neutral-900 dark:text-neutral-100 truncate block" title="Actual Reported: ${c.actual_revenue ? c.actual_revenue.reported_figure + ' (' + c.actual_revenue.period + ' - ' + c.actual_revenue.source_authority + ')' : latestRev}">${c.actual_revenue ? c.actual_revenue.reported_figure.split('(')[0].trim() : latestRev.split('(')[0]}</span>
              <span class="text-[9px] text-neutral-400 dark:text-neutral-500 block truncate">${c.actual_revenue ? c.actual_revenue.period : ''}</span>
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
        <td class="p-2.5 text-neutral-900 dark:text-neutral-100 font-mono font-bold" title="${c.actual_revenue ? c.actual_revenue.source_citation : ''}">
          <span>${c.actual_revenue ? c.actual_revenue.reported_figure : latestRev}</span>
          <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal block">${c.actual_revenue ? c.actual_revenue.period + ' • ' + c.actual_revenue.source_authority.split('(')[0].trim() : ''}</span>
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
      const point = {
        x: Math.max(1, c.employee_count.current),
        y: Math.max(0.1, c.est_revenue_usd_m || 0.5),
        id: c.id,
        name: c.name,
        actualRevenue: act.reported_figure || 'N/A',
        filingPeriod: act.period || 'N/A',
        filingAuthority: act.source_authority || 'N/A',
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
                return [
                  `${r.name} (${r.tier})`,
                  `Actual Reported: ${r.actualRevenue} (${r.filingPeriod})`,
                  `Filing Authority: ${r.filingAuthority}`,
                  `Headcount: ${r.x} staff`,
                  `Normalized ARR: $${r.y.toFixed(1)}M`,
                  `Capital Efficiency: ~$${r.revPerStaff.toLocaleString()} / employee`
                ];
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
      html = `
        <div class="space-y-4">
          <!-- Actual Reported Financial Data Point Banner -->
          <div class="p-4 ${isDark ? 'bg-emerald-950/40 border-emerald-800' : 'bg-emerald-50 border-emerald-200'} rounded-lg border space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="font-mono text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-emerald-400' : 'text-emerald-800'} flex items-center space-x-1">
                <span>✓ Actual Reported Revenue (Public Registry Record)</span>
              </span>
              <span class="font-mono text-xs font-bold px-2 py-0.5 rounded ${isDark ? 'bg-emerald-900/80 text-emerald-200' : 'bg-emerald-100 text-emerald-800'}">
                ${act.period || 'Verified'}
              </span>
            </div>
            
            <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <span class="text-xl sm:text-2xl font-bold font-mono ${isDark ? 'text-white' : 'text-neutral-900'}">
                ${act.reported_figure || (c.est_revenue_usd_m ? '$' + c.est_revenue_usd_m + 'M' : 'N/A')}
              </span>
              <span class="text-xs font-mono ${isDark ? 'text-neutral-400' : 'text-neutral-600'}">
                Authority: <strong>${act.source_authority || 'Official Corporate Filing'}</strong>
              </span>
            </div>

            <div class="pt-2 border-t ${isDark ? 'border-emerald-800/60 text-neutral-300' : 'border-emerald-200 text-neutral-700'} text-[11px] font-mono leading-relaxed">
              <strong>Filing / Disclosure Citation:</strong> ${act.source_citation || 'Corporate Regulatory Filing'}
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
- Actual Reported Revenue: ${act.reported_figure || 'N/A'} (${act.period || 'N/A'} - ${act.source_authority || 'N/A'})
- Statutory Citation: ${act.source_citation || 'N/A'}
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
      ['Index', 'Platform Name', 'Legal Entity', 'Tier', 'Status', 'Start Date', 'Country Count', 'Country Codes', 'Founders', 'Actual Reported Revenue', 'Filing Period', 'Filing Authority', 'Statutory Citation', 'Headcount', 'Base Price', 'Website']
    ];

    currentFilteredList.forEach((c, i) => {
      const act = c.actual_revenue || {};
      const firstPrice = c.pricing.tiers.length > 0 ? c.pricing.tiers[0].price : 'N/A';

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
        `"${act.reported_figure || 'N/A'}"`,
        `"${act.period || 'N/A'}"`,
        `"${act.source_authority || 'N/A'}"`,
        `"${act.source_citation || 'N/A'}"`,
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
        const isDark = isDarkMode();
        document.querySelectorAll('.story-btn').forEach(b => {
          b.className = `story-btn px-3 py-1 rounded-full border ${isDark ? 'border-neutral-800 text-neutral-400 hover:border-neutral-100' : 'border-neutral-200 text-neutral-600 hover:border-neutral-900'} transition whitespace-nowrap`;
        });
        btn.className = `story-btn px-3 py-1 rounded-full border ${isDark ? 'border-neutral-100 bg-neutral-100 text-neutral-900' : 'border-neutral-900 bg-neutral-900 text-white'} font-medium transition whitespace-nowrap`;
        
        state.story = btn.getAttribute('data-story');
        handleStoryChange(state.story);
      });
    });

    // Tier buttons
    document.querySelectorAll('.tier-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const isDark = isDarkMode();
        document.querySelectorAll('.tier-btn').forEach(b => {
          b.className = 'tier-btn px-2.5 py-0.5 rounded text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100';
        });
        btn.className = `tier-btn px-2.5 py-0.5 rounded font-semibold ${isDark ? 'text-neutral-100 bg-neutral-800' : 'text-neutral-900 bg-neutral-100'}`;

        state.tier = btn.getAttribute('data-tier');
        filterAndRender();
      });
    });

    // Status buttons
    document.querySelectorAll('.status-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const isDark = isDarkMode();
        document.querySelectorAll('.status-btn').forEach(b => {
          b.className = 'status-btn px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100';
        });
        btn.className = `status-btn px-2 py-1 rounded font-medium ${isDark ? 'bg-neutral-100 text-neutral-900' : 'bg-neutral-900 text-white'}`;

        state.status = btn.getAttribute('data-status');
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

    // Reset buttons
    const resetAll = () => {
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
      
      const isDark = isDarkMode();
      document.querySelectorAll('.tier-btn').forEach(b => b.className = 'tier-btn px-2.5 py-0.5 rounded text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100');
      const allTierBtn = document.querySelector('.tier-btn[data-tier="all"]');
      if (allTierBtn) allTierBtn.className = `tier-btn px-2.5 py-0.5 rounded font-semibold ${isDark ? 'text-neutral-100 bg-neutral-800' : 'text-neutral-900 bg-neutral-100'}`;

      document.querySelectorAll('.status-btn').forEach(b => b.className = 'status-btn px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100');
      const allStatusBtn = document.querySelector('.status-btn[data-status="all"]');
      if (allStatusBtn) allStatusBtn.className = `status-btn px-2 py-1 rounded font-medium ${isDark ? 'bg-neutral-100 text-neutral-900' : 'bg-neutral-900 text-white'}`;

      if (activeCountryFilter) activeCountryFilter.textContent = 'All Countries';
      renderCountryPills();
      filterAndRender();
    };

    if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetAll);
    if (emptyResetBtn) emptyResetBtn.addEventListener('click', resetAll);
    if (resetCountryBtn) resetCountryBtn.addEventListener('click', () => setCountryFilter('all'));

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
