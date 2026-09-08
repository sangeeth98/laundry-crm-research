/**
 * Interactive SVG World Map with Real Vector Country Boundaries
 * Multi-Dimensional Visualizations & Dynamic Dark Mode Support
 */

(function () {
  'use strict';

  const svgPaths = window.WORLD_SVG_PATHS || {};
  const mapData = window.LAUNDRY_MAP_DATA || {};

  let currentDimension = 'density'; // 'density', 'pricing', 'archetype', 'origins'
  let selectedCountryCode = null;
  let selectedCompanyId = 'all'; // 'all' or company.id

  // DOM Elements
  const mapSvg = document.getElementById('worldMapSvg');
  const mapTooltip = document.getElementById('mapTooltip');
  const mapCountryDrawer = document.getElementById('mapCountryDrawer');
  const mapLegendContainer = document.getElementById('mapLegendContainer');
  const mapDimensionTitle = document.getElementById('mapDimensionTitle');
  const mapDimensionDesc = document.getElementById('mapDimensionDesc');
  const mapCompanyFilter = document.getElementById('mapCompanyFilter');
  const clearCompanyFilterBtn = document.getElementById('clearCompanyFilterBtn');
  const companyPenetrationBadge = document.getElementById('companyPenetrationBadge');

  function isDarkMode() {
    return document.documentElement.classList.contains('dark');
  }

  function getSelectedCompany() {
    if (!selectedCompanyId || selectedCompanyId === 'all') return null;
    const cData = window.LAUNDRY_CRM_DATA || {};
    const companies = cData.companies || [];
    return companies.find(c => c.id === selectedCompanyId) || null;
  }

  function initMap() {
    if (!mapSvg) return;
    setupCompanyFilter();
    renderMap();
    setupDimensionControls();
    setupRegionPresets();
    updateLegend();

    // Re-render on theme change
    window.addEventListener('themeChanged', () => {
      renderMap();
      updateLegend();
    });

    // Re-populate company dropdown if CRM data became available after initial load
    if (window.LAUNDRY_CRM_DATA && (!mapCompanyFilter || mapCompanyFilter.options.length <= 1)) {
      populateCompanyFilter();
    }
  }

  function populateCompanyFilter() {
    if (!mapCompanyFilter) return;
    const cData = window.LAUNDRY_CRM_DATA || {};
    const companies = cData.companies || [];
    if (!companies.length) return;

    const prevVal = selectedCompanyId || 'all';
    mapCompanyFilter.innerHTML = '<option value="all">🌍 All Platforms (Aggregate Choropleth)</option>';

    const tiers = [
      { id: 1, label: 'Tier 1: Indian Native SaaS & POS' },
      { id: 2, label: 'Tier 2: Indian Regional & Hyper-Local Solutions' },
      { id: 3, label: 'Tier 3: Global Enterprise & Industrial ERPs' },
      { id: 4, label: 'Tier 4: Direct Franchise Chains & D2C Startups' }
    ];

    tiers.forEach(t => {
      const tierComps = companies.filter(c => c.tier === t.id);
      if (!tierComps.length) return;

      tierComps.sort((a, b) => {
        const countA = a.market ? (a.market.country_count || a.market.country_codes?.length || 0) : 0;
        const countB = b.market ? (b.market.country_count || b.market.country_codes?.length || 0) : 0;
        return countB - countA;
      });

      const optgroup = document.createElement('optgroup');
      optgroup.label = t.label;

      tierComps.forEach(c => {
        const count = c.market ? (c.market.country_count || c.market.country_codes?.length || 0) : 0;
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.name} (${count} ${count === 1 ? 'country' : 'countries'})`;
        optgroup.appendChild(opt);
      });

      mapCompanyFilter.appendChild(optgroup);
    });

    mapCompanyFilter.value = prevVal;
  }

  function setupCompanyFilter() {
    populateCompanyFilter();

    if (mapCompanyFilter) {
      mapCompanyFilter.addEventListener('change', (e) => {
        setCompanyFilter(e.target.value);
      });
    }

    if (clearCompanyFilterBtn) {
      clearCompanyFilterBtn.addEventListener('click', () => {
        setCompanyFilter('all');
      });
    }
  }

  function setCompanyFilter(companyId) {
    selectedCompanyId = companyId || 'all';
    if (mapCompanyFilter && mapCompanyFilter.value !== selectedCompanyId) {
      mapCompanyFilter.value = selectedCompanyId;
    }

    const isDark = isDarkMode();
    const comp = getSelectedCompany();

    if (!comp) {
      selectedCompanyId = 'all';
      if (clearCompanyFilterBtn) clearCompanyFilterBtn.classList.add('hidden');
      if (companyPenetrationBadge) {
        companyPenetrationBadge.classList.add('hidden');
        companyPenetrationBadge.classList.remove('flex');
      }

      document.querySelectorAll('.map-dimension-btn').forEach(b => {
        const dim = b.getAttribute('data-dimension');
        if (dim === currentDimension) {
          b.className = `map-dimension-btn px-2.5 sm:px-3 py-1.5 rounded text-xs font-mono border ${isDark ? 'border-sky-500 bg-sky-500/20 text-sky-300' : 'border-neutral-900 bg-neutral-900 text-white'} font-medium transition`;
        } else {
          b.className = `map-dimension-btn px-2.5 sm:px-3 py-1.5 rounded text-xs font-mono border ${isDark ? 'border-neutral-700 text-neutral-400 hover:border-neutral-500' : 'border-neutral-200 text-neutral-600 hover:border-neutral-900'} transition`;
        }
      });

      updateDimensionDescriptions(currentDimension);
    } else {
      if (clearCompanyFilterBtn) clearCompanyFilterBtn.classList.remove('hidden');

      if (companyPenetrationBadge) {
        const hqCountry = (comp.market?.countries_list && comp.market.countries_list[0]) || (comp.market?.country_codes && comp.market.country_codes[0]) || 'Origin';
        const reachPct = Math.round(((comp.market?.country_count || 1) / 58) * 100);
        companyPenetrationBadge.innerHTML = `
          <span class="inline-flex items-center px-2 py-0.5 rounded font-bold ${isDark ? 'bg-sky-950 text-sky-300 border border-sky-800' : 'bg-sky-100 text-sky-900 border border-sky-300'}">
            ✓ ${comp.market.country_count} Markets
          </span>
          <span class="text-neutral-400 dark:text-neutral-500">•</span>
          <span>${reachPct}% Global Coverage</span>
          <span class="text-neutral-400 dark:text-neutral-500">•</span>
          <span class="text-purple-600 dark:text-purple-400 font-semibold">★ HQ: ${hqCountry}</span>
        `;
        companyPenetrationBadge.classList.remove('hidden');
        companyPenetrationBadge.classList.add('flex');
      }

      document.querySelectorAll('.map-dimension-btn').forEach(b => {
        b.className = `map-dimension-btn px-2.5 sm:px-3 py-1.5 rounded text-xs font-mono border ${isDark ? 'border-neutral-700 text-neutral-400 hover:border-neutral-500' : 'border-neutral-200 text-neutral-600 hover:border-neutral-900'} transition`;
      });

      if (mapDimensionTitle) {
        mapDimensionTitle.textContent = `${comp.name}: Global Footprint & Market Penetration`;
      }
      if (mapDimensionDesc) {
        const hqName = (comp.market?.countries_list && comp.market.countries_list[0]) || 'Origin';
        const hqCode = (comp.market?.country_codes && comp.market.country_codes[0]) || '';
        mapDimensionDesc.textContent = `Penetrated in ${comp.market.country_count} countries worldwide. Primary HQ: ${hqName} (${hqCode}). ${comp.market.penetration_details || ''}`;
      }
    }

    renderMap();
    updateLegend();
  }

  function renderMap() {
    if (!mapSvg) return;
    mapSvg.innerHTML = '';

    const isDark = isDarkMode();
    const comp = getSelectedCompany();
    const isCompanyMode = !!comp;

    // 1. Graticule Grid Lines (Equirectangular)
    const graticules = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    graticules.setAttribute('stroke', isDark ? '#1e293b' : '#e2e8f0');
    graticules.setAttribute('stroke-width', '0.6');
    graticules.setAttribute('stroke-dasharray', '2,4');

    [70, 150, 250, 360, 440].forEach(y => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', '0');
      line.setAttribute('x2', '1000');
      line.setAttribute('y1', y);
      line.setAttribute('y2', y);
      graticules.appendChild(line);
    });

    [150, 300, 500, 700, 850].forEach(x => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x);
      line.setAttribute('x2', x);
      line.setAttribute('y1', '0');
      line.setAttribute('y2', '500');
      graticules.appendChild(line);
    });
    mapSvg.appendChild(graticules);

    // 2. Countries Layer (Authentic Vector Boundaries)
    const countriesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    countriesGroup.setAttribute('id', 'mapCountriesGroup');

    const allCountryCodes = Object.keys(svgPaths);

    allCountryCodes.forEach(code => {
      const countryGeo = svgPaths[code];
      const data = mapData[code];
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

      path.setAttribute('d', countryGeo.d);
      path.setAttribute('data-code', code);
      path.setAttribute('data-name', countryGeo.name);
      path.setAttribute('class', 'country-path cursor-pointer transition-colors duration-200');

      // Check if this country is currently selected
      const isSelected = selectedCountryCode === code;
      if (isSelected) {
        path.classList.add('country-active');
      }

      if (isCompanyMode) {
        // --- COMPANY PENETRATION VIEW ---
        const isPenetrated = comp.market?.country_codes?.includes(code);
        const isHQ = comp.market?.country_codes?.[0] === code;

        const visual = calculateVisualProps(data, currentDimension, isDark, code);
        path.setAttribute('fill', visual.fill);
        path.setAttribute('stroke', isSelected ? (isDark ? '#ffffff' : '#0f172a') : visual.stroke);
        path.setAttribute('stroke-width', isSelected ? '2.5' : (visual.strokeWidth || '0.7'));
        path.setAttribute('fill-opacity', visual.opacity);

        path.addEventListener('mouseenter', (e) => showCompanyTooltip(e, code, countryGeo, data, comp, isPenetrated, isHQ));
        path.addEventListener('mousemove', moveTooltip);
        path.addEventListener('mouseleave', hideTooltip);
        path.addEventListener('click', () => {
          if (data) {
            selectCountry(data);
          } else {
            selectCountry({
              code: code,
              name: countryGeo.name,
              region: 'International Territory',
              vendor_count: 0,
              avg_starter_price_usd: 0,
              dominant_archetype_label: 'Emerging Market',
              platforms: []
            });
          }
        });

      } else {
        // --- STANDARD AGGREGATE DIMENSION VIEW ---
        if (data) {
          const visual = calculateVisualProps(data, currentDimension, isDark, code);
          path.setAttribute('fill', visual.fill);
          path.setAttribute('stroke', isSelected ? (isDark ? '#ffffff' : '#0f172a') : visual.stroke);
          path.setAttribute('stroke-width', isSelected ? '2' : '0.7');
          path.setAttribute('fill-opacity', visual.opacity);

          path.addEventListener('mouseenter', (e) => showTooltip(e, data));
          path.addEventListener('mousemove', moveTooltip);
          path.addEventListener('mouseleave', hideTooltip);
          path.addEventListener('click', () => selectCountry(data));

        } else {
          path.setAttribute('fill', isDark ? '#111827' : '#f1f5f9');
          path.setAttribute('stroke', isDark ? '#1f2937' : '#cbd5e1');
          path.setAttribute('stroke-width', '0.5');

          path.addEventListener('mouseenter', (e) => showInactiveTooltip(e, countryGeo.name));
          path.addEventListener('mousemove', moveTooltip);
          path.addEventListener('mouseleave', hideTooltip);
        }
      }

      countriesGroup.appendChild(path);
    });

    mapSvg.appendChild(countriesGroup);

    // 3. Beacons Layer
    renderBeacons(isDark, comp);
  }

  function renderBeacons(isDark, comp) {
    const beaconsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    beaconsGroup.setAttribute('id', 'mapBeaconsGroup');

    if (comp) {
      // Company Penetration Beacons: Highlight HQ and penetrated hubs
      const hqCode = comp.market?.country_codes?.[0];
      const penetratedCodes = comp.market?.country_codes || [];

      penetratedCodes.forEach(code => {
        const data = mapData[code];
        if (!data || !data.svg_x || !data.svg_y) return;

        const isHQ = code === hqCode;
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', `translate(${data.svg_x}, ${data.svg_y})`);
        g.setAttribute('class', 'pointer-events-none');

        if (isHQ) {
          // Prominent pulsating HQ halo
          const halo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          halo.setAttribute('r', '8');
          halo.setAttribute('fill', isDark ? '#a855f7' : '#8b5cf6');
          halo.setAttribute('fill-opacity', '0.35');
          halo.setAttribute('stroke', isDark ? '#c084fc' : '#6d28d9');
          halo.setAttribute('stroke-width', '1.2');
          g.appendChild(halo);

          const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          dot.setAttribute('r', '3.5');
          dot.setAttribute('fill', '#ffffff');
          dot.setAttribute('stroke', '#7c3aed');
          dot.setAttribute('stroke-width', '1.5');
          g.appendChild(dot);

          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('y', '14');
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('font-family', 'JetBrains Mono, monospace');
          text.setAttribute('font-size', '8.5');
          text.setAttribute('font-weight', 'bold');
          text.setAttribute('fill', isDark ? '#d8b4fe' : '#581c87');
          text.textContent = `★ HQ: ${code}`;
          g.appendChild(text);

        } else if (['US', 'IN', 'AE', 'GB', 'CA', 'AU', 'SA', 'SG', 'ZA', 'DE'].includes(code)) {
          // Secondary Hub Dot for key markets
          const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          dot.setAttribute('r', '2.5');
          dot.setAttribute('fill', isDark ? '#38bdf8' : '#0284c7');
          dot.setAttribute('stroke', '#ffffff');
          dot.setAttribute('stroke-width', '0.8');
          g.appendChild(dot);

          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('y', '11');
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('font-family', 'JetBrains Mono, monospace');
          text.setAttribute('font-size', '7.5');
          text.setAttribute('font-weight', 'bold');
          text.setAttribute('fill', isDark ? '#bae6fd' : '#0369a1');
          text.textContent = code;
          g.appendChild(text);
        }

        beaconsGroup.appendChild(g);
      });

    } else {
      // Standard Global Hub Beacons
      const beaconCodes = ['IN', 'US', 'AE', 'GB', 'CA', 'AU', 'ZA', 'SA', 'SG', 'QA', 'DE', 'FR', 'NL', 'NG', 'BR', 'MX'];

      beaconCodes.forEach(code => {
        const data = mapData[code];
        if (!data) return;

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', `translate(${data.svg_x}, ${data.svg_y})`);
        g.setAttribute('class', 'pointer-events-none');

        if (data.vendor_count >= 20 || data.is_hq_hub) {
          const halo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          halo.setAttribute('r', '6');
          halo.setAttribute('fill', isDark ? '#38bdf8' : '#0284c7');
          halo.setAttribute('fill-opacity', '0.25');
          halo.setAttribute('stroke', isDark ? '#38bdf8' : '#0284c7');
          halo.setAttribute('stroke-width', '0.8');
          halo.setAttribute('stroke-opacity', '0.6');
          g.appendChild(halo);
        }

        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('r', '3');
        dot.setAttribute('fill', isDark ? '#ffffff' : '#0f172a');
        dot.setAttribute('stroke', isDark ? '#0284c7' : '#ffffff');
        dot.setAttribute('stroke-width', '1');
        g.appendChild(dot);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('y', '12');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-family', 'JetBrains Mono, monospace');
        text.setAttribute('font-size', '8');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('fill', isDark ? '#e2e8f0' : '#1e293b');
        text.textContent = code;
        g.appendChild(text);

        beaconsGroup.appendChild(g);
      });
    }

    mapSvg.appendChild(beaconsGroup);
  }

  function calculateVisualProps(c, dim, isDark, countryCode) {
    const comp = getSelectedCompany();

    // 1. Company Penetration Mode
    if (comp) {
      const code = countryCode || (c ? c.code : null);
      const isPenetrated = comp.market?.country_codes?.includes(code);
      const isHQ = comp.market?.country_codes?.[0] === code;

      if (isPenetrated) {
        if (isHQ) {
          return {
            fill: isDark ? '#7c3aed' : '#6d28d9',
            stroke: isDark ? '#c084fc' : '#4c1d95',
            strokeWidth: '1.2',
            opacity: '0.98',
            valueStr: `★ Primary Incubation Base & Global HQ`
          };
        } else {
          return {
            fill: isDark ? '#0284c7' : '#0284c7',
            stroke: isDark ? '#38bdf8' : '#0369a1',
            strokeWidth: '0.9',
            opacity: '0.92',
            valueStr: `✓ Active Market Footprint`
          };
        }
      } else {
        // Muted / Unpenetrated
        return {
          fill: isDark ? '#0a0f1d' : '#f1f5f9',
          stroke: isDark ? '#1e293b' : '#e2e8f0',
          strokeWidth: '0.5',
          opacity: isDark ? '0.35' : '0.55',
          valueStr: `✕ Not Penetrated`
        };
      }
    }

    // 2. Standard Aggregate Mode
    if (!c) {
      return { fill: isDark ? '#111827' : '#f1f5f9', stroke: isDark ? '#1f2937' : '#cbd5e1', opacity: '0.5', strokeWidth: '0.5', valueStr: '' };
    }

    if (dim === 'density') {
      const count = c.vendor_count;
      if (count >= 25) {
        return {
          fill: isDark ? '#38bdf8' : '#0f172a',
          stroke: isDark ? '#7dd3fc' : '#334155',
          opacity: isDark ? '0.95' : '1',
          valueStr: `${count} Platforms Active (Top Tier)`
        };
      } else if (count >= 15) {
        return {
          fill: isDark ? '#0284c7' : '#0369a1',
          stroke: isDark ? '#38bdf8' : '#0c4a6e',
          opacity: isDark ? '0.9' : '0.9',
          valueStr: `${count} Platforms Active`
        };
      } else if (count >= 7) {
        return {
          fill: isDark ? '#0369a1' : '#38bdf8',
          stroke: isDark ? '#0284c7' : '#0284c7',
          opacity: isDark ? '0.85' : '0.85',
          valueStr: `${count} Platforms Active`
        };
      } else {
        return {
          fill: isDark ? '#1e3a8a' : '#bae6fd',
          stroke: isDark ? '#1e40af' : '#7dd3fc',
          opacity: isDark ? '0.8' : '0.8',
          valueStr: `${count} Platforms Active`
        };
      }

    } else if (dim === 'pricing') {
      const price = c.avg_starter_price_usd;
      if (price >= 100) {
        return {
          fill: isDark ? '#f43f5e' : '#e11d48',
          stroke: isDark ? '#fb7185' : '#9f1239',
          opacity: '0.9',
          valueStr: `Avg Starter: $${price}/mo (Premium ARPU)`
        };
      } else if (price >= 60) {
        return {
          fill: isDark ? '#fb923c' : '#ea580c',
          stroke: isDark ? '#fdba74' : '#c2410c',
          opacity: '0.85',
          valueStr: `Avg Starter: $${price}/mo (Mid-High ARPU)`
        };
      } else if (price >= 35) {
        return {
          fill: isDark ? '#14b8a6' : '#0d9488',
          stroke: isDark ? '#2dd4bf' : '#115e59',
          opacity: '0.85',
          valueStr: `Avg Starter: $${price}/mo (Moderate ARPU)`
        };
      } else {
        return {
          fill: isDark ? '#34d399' : '#10b981',
          stroke: isDark ? '#6ee7b7' : '#047857',
          opacity: '0.85',
          valueStr: `Avg Starter: $${price}/mo (Hyper-Efficient)`
        };
      }

    } else if (dim === 'archetype') {
      const model = c.dominant_model;
      const modelColors = {
        franchise: isDark ? '#a78bfa' : '#8b5cf6',
        saas_subscription: isDark ? '#38bdf8' : '#0284c7',
        saas_payments_iot: isDark ? '#fbbf24' : '#f59e0b',
        hardware_bundled: isDark ? '#fb923c' : '#ea580c',
        perpetual_license: isDark ? '#34d399' : '#10b981',
        hub_industrial: isDark ? '#94a3b8' : '#64748b'
      };

      return {
        fill: modelColors[model] || (isDark ? '#38bdf8' : '#0284c7'),
        stroke: isDark ? '#ffffff' : '#1e293b',
        opacity: '0.88',
        valueStr: `Archetype: ${c.dominant_archetype_label}`
      };

    } else if (dim === 'origins') {
      const hq = c.hq_count || 0;
      if (hq >= 10) {
        return {
          fill: isDark ? '#c084fc' : '#7c3aed',
          stroke: isDark ? '#e9d5ff' : '#581c87',
          opacity: '0.95',
          valueStr: `${hq} Platform Headquarters (Global Hub)`
        };
      } else if (hq >= 2) {
        return {
          fill: isDark ? '#60a5fa' : '#2563eb',
          stroke: isDark ? '#93c5fd' : '#1d4ed8',
          opacity: '0.9',
          valueStr: `${hq} Platform Headquarters`
        };
      } else if (hq >= 1) {
        return {
          fill: isDark ? '#22d3ee' : '#0891b2',
          stroke: isDark ? '#67e8f9' : '#0e7490',
          opacity: '0.85',
          valueStr: `1 Platform Headquarter`
        };
      } else {
        return {
          fill: isDark ? '#1e293b' : '#e2e8f0',
          stroke: isDark ? '#334155' : '#cbd5e1',
          opacity: '0.5',
          valueStr: 'Market Territory (0 HQ)'
        };
      }
    }

    return { fill: '#0284c7', stroke: '#ffffff', opacity: '0.8', valueStr: '' };
  }

  // Tooltip in Company Penetration Mode
  function showCompanyTooltip(e, code, countryGeo, data, comp, isPenetrated, isHQ) {
    if (!mapTooltip) return;
    const isDark = isDarkMode();
    const countryName = countryGeo ? countryGeo.name : (data ? data.name : code);
    const competitorCount = data ? data.vendor_count : 0;
    const starterPrice = comp.pricing?.tiers?.[0]?.price || (`$${comp.starter_price_usd}/mo`);

    let statusBadge = '';
    let statusText = '';

    if (isPenetrated) {
      if (isHQ) {
        statusBadge = `<span class="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-purple-600 text-white">★ PRIMARY HQ</span>`;
        statusText = `<span class="text-purple-400 font-semibold">${comp.name} was incubated & headquartered here</span>`;
      } else {
        statusBadge = `<span class="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${isDark ? 'bg-sky-500/20 text-sky-300 border border-sky-600' : 'bg-sky-100 text-sky-800 border border-sky-300'}">✓ ACTIVE MARKET</span>`;
        statusText = `<span class="${isDark ? 'text-sky-300' : 'text-sky-700'} font-semibold">Active client & store deployments confirmed</span>`;
      }
    } else {
      statusBadge = `<span class="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium ${isDark ? 'bg-neutral-800 text-neutral-400 border border-neutral-700' : 'bg-neutral-100 text-neutral-600 border border-neutral-300'}">NOT PENETRATED</span>`;
      statusText = `<span class="${isDark ? 'text-neutral-400' : 'text-neutral-500'}">No confirmed operating footprint in this nation</span>`;
    }

    mapTooltip.innerHTML = `
      <div class="space-y-1.5 min-w-[210px] max-w-[280px]">
        <div class="flex items-center justify-between border-b ${isDark ? 'border-neutral-700' : 'border-neutral-200'} pb-1 gap-2">
          <span class="font-bold ${isDark ? 'text-white' : 'text-neutral-900'} text-xs">${countryName} (${code})</span>
          ${statusBadge}
        </div>
        <div class="text-[11px] font-mono leading-tight">${statusText}</div>
        
        <div class="pt-0.5 space-y-0.5 text-[10px] ${isDark ? 'text-neutral-300' : 'text-neutral-600'}">
          ${isPenetrated ? `<div><span class="text-neutral-400">Entry Plan:</span> <strong>${starterPrice}</strong></div>` : ''}
          <div><span class="text-neutral-400">Market Competition:</span> <strong>${competitorCount} Total Platforms Active</strong></div>
        </div>

        <div class="text-[9px] ${isDark ? 'text-sky-400' : 'text-sky-600'} italic pt-0.5 border-t ${isDark ? 'border-neutral-800' : 'border-neutral-200'}">
          Click country to inspect local competitors →
        </div>
      </div>
    `;

    mapTooltip.classList.remove('hidden');
    moveTooltip(e);
  }

  // Tooltip in Standard Aggregate Mode
  function showTooltip(e, country) {
    if (!mapTooltip) return;
    const isDark = isDarkMode();
    const props = calculateVisualProps(country, currentDimension, isDark, country.code);

    mapTooltip.innerHTML = `
      <div class="space-y-1">
        <div class="flex items-center justify-between border-b ${isDark ? 'border-neutral-700' : 'border-neutral-200'} pb-1 gap-2">
          <span class="font-bold ${isDark ? 'text-white' : 'text-neutral-900'} text-xs">${country.name} (${country.code})</span>
          <span class="text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-500'} font-mono">${country.region}</span>
        </div>
        <div class="text-[11px] font-mono font-semibold ${isDark ? 'text-sky-400' : 'text-sky-700'}">${props.valueStr}</div>
        <div class="text-[10px] ${isDark ? 'text-neutral-300' : 'text-neutral-600'}">Total Active: ${country.vendor_count} Solutions</div>
        <div class="text-[9px] ${isDark ? 'text-neutral-500' : 'text-neutral-400'} italic">Click country to inspect platforms</div>
      </div>
    `;
    mapTooltip.classList.remove('hidden');
    moveTooltip(e);
  }

  function showInactiveTooltip(e, name) {
    if (!mapTooltip) return;
    const isDark = isDarkMode();
    mapTooltip.innerHTML = `
      <div class="text-xs font-mono">
        <span class="font-bold ${isDark ? 'text-neutral-300' : 'text-neutral-800'}">${name}</span>
        <span class="block text-[10px] ${isDark ? 'text-neutral-500' : 'text-neutral-400'}">No platforms tracked</span>
      </div>
    `;
    mapTooltip.classList.remove('hidden');
    moveTooltip(e);
  }

  function moveTooltip(e) {
    if (!mapTooltip) return;
    const offset = 12;
    mapTooltip.style.left = `${e.pageX + offset}px`;
    mapTooltip.style.top = `${e.pageY + offset}px`;
  }

  function hideTooltip() {
    if (mapTooltip) mapTooltip.classList.add('hidden');
  }

  // Country Selection & Drawer
  function selectCountry(country) {
    selectedCountryCode = country.code;
    renderMap(); // update selected stroke

    if (!mapCountryDrawer) return;
    mapCountryDrawer.classList.remove('hidden');

    const isDark = isDarkMode();
    const comp = getSelectedCompany();
    const isPenetrated = comp ? comp.market?.country_codes?.includes(country.code) : false;
    const isHQ = comp ? comp.market?.country_codes?.[0] === country.code : false;

    // Filtered company highlight banner at top of drawer
    const companyStatusBanner = comp ? `
      <div class="p-3 rounded-md border ${isPenetrated ? (isDark ? 'bg-sky-950/40 border-sky-800 text-sky-200' : 'bg-sky-50 border-sky-200 text-sky-900') : (isDark ? 'bg-neutral-800/80 border-neutral-700 text-neutral-400' : 'bg-neutral-100 border-neutral-300 text-neutral-600')} text-xs space-y-1">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="font-bold text-sm text-neutral-900 dark:text-neutral-100">${comp.name}</span>
            <span class="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-bold ${isPenetrated ? (isHQ ? 'bg-purple-600 text-white' : 'bg-sky-600 text-white') : 'bg-neutral-600 text-white'}">
              ${isPenetrated ? (isHQ ? '★ Primary HQ Base' : '✓ Active Market') : '✕ Not Operating Here'}
            </span>
          </div>
          <button onclick="window.openCompanyModalById && window.openCompanyModalById('${comp.id}')" class="underline text-[10px] font-mono hover:text-sky-500 font-semibold">
            Company Dossier →
          </button>
        </div>
        <p class="text-[11px] opacity-90">
          ${isPenetrated ? `${comp.name} has confirmed customer base and store deployments in ${country.name}. Listed tier: ${comp.pricing?.tiers?.[0]?.price || ('$' + comp.starter_price_usd + '/mo')}.` : `${comp.name} does not have active tracked footprint in ${country.name}. Check the ${country.vendor_count} local alternatives below.`}
        </p>
      </div>
    ` : '';

    const platformsHtml = (country.platforms || []).map(p => {
      const isThisCompany = comp && p.id === comp.id;
      return `
        <div class="p-2.5 ${isThisCompany ? (isDark ? 'ring-2 ring-sky-500 bg-sky-950/60 border-sky-700' : 'ring-2 ring-sky-500 bg-sky-50/80 border-sky-300') : (isDark ? 'bg-neutral-800 border-neutral-700 hover:border-neutral-500' : 'bg-white border-neutral-200 hover:border-neutral-900')} border rounded flex items-center justify-between text-xs cursor-pointer transition" onclick="window.openCompanyModalById && window.openCompanyModalById('${p.id}')">
          <div>
            <div class="flex items-center gap-1.5">
              <span class="font-bold ${isDark ? 'text-neutral-100' : 'text-neutral-900'}">${p.name}</span>
              ${isThisCompany ? `<span class="px-1 py-0.2 rounded text-[8px] uppercase font-mono font-bold bg-sky-600 text-white">Selected</span>` : ''}
            </div>
            <span class="text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-500'} block font-mono">Tier ${p.tier} • ${p.price}</span>
          </div>
          <span class="px-1.5 py-0.5 rounded text-[9px] uppercase font-mono ${isDark ? 'bg-neutral-700 text-neutral-200' : 'bg-neutral-100 text-neutral-800'}">${p.status}</span>
        </div>
      `;
    }).join('');

    const hqSection = country.is_hq_hub ? `
      <div class="p-3 ${isDark ? 'bg-violet-950/40 border-violet-800 text-violet-300' : 'bg-violet-50 border-violet-200 text-violet-900'} border rounded text-xs space-y-1">
        <span class="font-bold block font-mono text-[10px] uppercase">Birthplace of Innovation (${country.hq_count} Entities):</span>
        <span>${country.hq_platforms ? country.hq_platforms.join(', ') : 'Tracked Platforms'}</span>
      </div>
    ` : '';

    mapCountryDrawer.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-start justify-between border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'} pb-3">
          <div>
            <div class="flex items-center space-x-2">
              <h4 class="text-base font-bold ${isDark ? 'text-white' : 'text-neutral-900'}">${country.name}</h4>
              <span class="px-2 py-0.5 ${isDark ? 'bg-neutral-800 text-white' : 'bg-neutral-900 text-white'} rounded font-mono text-xs font-bold">${country.code}</span>
            </div>
            <span class="text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'} font-mono">${country.region} • ${country.vendor_count} Platforms Operating</span>
          </div>
          <button id="closeDrawerBtn" class="${isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-400 hover:text-neutral-900'} p-1">✕</button>
        </div>

        ${companyStatusBanner}

        <div class="grid grid-cols-2 gap-3 text-xs font-mono">
          <div class="p-2.5 ${isDark ? 'bg-neutral-800/80 border-neutral-700' : 'bg-neutral-50 border-neutral-200'} border rounded">
            <span class="text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-500'} uppercase block">Avg Starter Price</span>
            <span class="text-sm font-bold ${isDark ? 'text-white' : 'text-neutral-900'}">$${country.avg_starter_price_usd} / mo</span>
          </div>
          <div class="p-2.5 ${isDark ? 'bg-neutral-800/80 border-neutral-700' : 'bg-neutral-50 border-neutral-200'} border rounded">
            <span class="text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-500'} uppercase block">Dominant Archetype</span>
            <span class="text-xs font-bold ${isDark ? 'text-sky-400' : 'text-sky-700'} truncate block">${(country.dominant_archetype_label || 'Cloud SaaS').split('&')[0]}</span>
          </div>
        </div>

        ${hqSection}

        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="font-mono text-[11px] uppercase font-bold ${isDark ? 'text-neutral-300' : 'text-neutral-700'}">Operating Platforms (${(country.platforms || []).length})</span>
            <button id="filterDirectoryByCountryBtn" class="text-xs font-mono ${isDark ? 'text-sky-400' : 'text-sky-600'} hover:underline font-semibold">
              Filter Directory by ${country.code} →
            </button>
          </div>
          <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
            ${platformsHtml || '<div class="text-xs text-neutral-400 italic p-2">No individual vendor profiles cataloged in this market.</div>'}
          </div>
        </div>
      </div>
    `;

    document.getElementById('closeDrawerBtn')?.addEventListener('click', () => {
      mapCountryDrawer.classList.add('hidden');
    });

    document.getElementById('filterDirectoryByCountryBtn')?.addEventListener('click', () => {
      if (window.setCountryFilterGlobal) {
        window.setCountryFilterGlobal(country.code);
        const explorer = document.getElementById('explorerGridSection');
        if (explorer) explorer.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Dimension Controls
  function setupDimensionControls() {
    document.querySelectorAll('.map-dimension-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        // Reset company filter when switching aggregate dimensions
        if (selectedCompanyId !== 'all') {
          selectedCompanyId = 'all';
          if (mapCompanyFilter) mapCompanyFilter.value = 'all';
          if (clearCompanyFilterBtn) clearCompanyFilterBtn.classList.add('hidden');
          if (companyPenetrationBadge) {
            companyPenetrationBadge.classList.add('hidden');
            companyPenetrationBadge.classList.remove('flex');
          }
        }

        const isDark = isDarkMode();
        document.querySelectorAll('.map-dimension-btn').forEach(b => {
          b.className = `map-dimension-btn px-2.5 sm:px-3 py-1.5 rounded text-xs font-mono border ${isDark ? 'border-neutral-700 text-neutral-400 hover:border-neutral-500' : 'border-neutral-200 text-neutral-600 hover:border-neutral-900'} transition`;
        });
        btn.className = `map-dimension-btn px-2.5 sm:px-3 py-1.5 rounded text-xs font-mono border ${isDark ? 'border-sky-500 bg-sky-500/20 text-sky-300' : 'border-neutral-900 bg-neutral-900 text-white'} font-medium transition`;

        currentDimension = btn.getAttribute('data-dimension');
        updateDimensionDescriptions(currentDimension);
        renderMap();
        updateLegend();
      });
    });
  }

  function updateDimensionDescriptions(dim) {
    if (!mapDimensionTitle || !mapDimensionDesc) return;

    if (dim === 'density') {
      mapDimensionTitle.textContent = 'Dimension 1: Platform Density & Market Penetration';
      mapDimensionDesc.textContent = 'Authentic boundary choropleth. India (34), UAE (29), and the US (29) lead globally in available software choices.';
    } else if (dim === 'pricing') {
      mapDimensionTitle.textContent = 'Dimension 2: Average Starter Software Pricing ($/mo ARPU)';
      mapDimensionDesc.textContent = 'Regional entry barrier map. US/Canada lead in software ARPU ($100-$120/mo), while India maintains hyper-efficient pricing ($15-$25/mo).';
    } else if (dim === 'archetype') {
      mapDimensionTitle.textContent = 'Dimension 3: Dominant Operational Archetype';
      mapDimensionDesc.textContent = 'Colors each nation by its leading operational structure: FOFO Live Stores in India vs. Coin Laundromat IoT in the US vs. High-Street EPOS in Europe.';
    } else if (dim === 'origins') {
      mapDimensionTitle.textContent = 'Dimension 4: Platform Origins & Headquarters (Birthplaces)';
      mapDimensionDesc.textContent = 'Maps where the 51 platforms were incubated. India (28) and North America (13) lead as global engineering epicenters.';
    }
  }

  function updateLegend() {
    if (!mapLegendContainer) return;
    const isDark = isDarkMode();
    const comp = getSelectedCompany();

    // 1. Company Penetration Legend View
    if (comp) {
      const hqCode = comp.market?.country_codes?.[0] || 'Origin';
      const hqName = comp.market?.countries_list?.[0] || hqCode;
      const reachPct = Math.round(((comp.market?.country_count || 1) / 58) * 100);

      const countryChipsHtml = (comp.market?.country_codes || []).map((cc, idx) => {
        const countryName = comp.market?.countries_list?.[idx] || cc;
        const isHQ = cc === hqCode;
        return `
          <button data-code="${cc}" class="map-penetrated-chip px-2 py-0.5 rounded text-[11px] font-mono border transition flex items-center gap-1 cursor-pointer ${isHQ ? (isDark ? 'bg-purple-950/80 border-purple-700 text-purple-200 font-bold hover:bg-purple-900' : 'bg-purple-100 border-purple-300 text-purple-900 font-bold hover:bg-purple-200') : (isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:border-sky-500 hover:text-sky-300' : 'bg-white border-neutral-300 text-neutral-800 hover:border-sky-600 hover:text-sky-700')}">
            <span>${isHQ ? '★ ' + cc : cc}</span>
            <span class="text-[9px] opacity-75 hidden sm:inline">(${countryName})</span>
          </button>
        `;
      }).join('');

      mapLegendContainer.innerHTML = `
        <div class="space-y-3 font-mono text-xs">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b ${isDark ? 'border-neutral-700/80' : 'border-neutral-200'} pb-2.5">
            <div class="flex items-center space-x-2 flex-wrap gap-y-1">
              <span class="font-bold text-sm ${isDark ? 'text-white' : 'text-neutral-900'}">${comp.name}</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isDark ? 'bg-sky-950 text-sky-300 border border-sky-800' : 'bg-sky-100 text-sky-800 border border-sky-300'}">${comp.tier_label ? comp.tier_label.split(':')[0] : 'Platform'}</span>
              <span class="text-neutral-400 dark:text-neutral-500 text-[10px]">•</span>
              <span class="text-[10px] ${isDark ? 'text-neutral-300' : 'text-neutral-600'}">Primary HQ: <strong>${hqName} (${hqCode})</strong></span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-[11px] ${isDark ? 'text-sky-400' : 'text-sky-700'} font-bold">
                ${comp.market.country_count} Countries (${reachPct}% Global Coverage)
              </span>
              <button onclick="window.openCompanyModalById && window.openCompanyModalById('${comp.id}')" class="px-2.5 py-1 rounded bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[10px] font-semibold hover:opacity-90 transition">
                Company Dossier →
              </button>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400">Penetrated Country Footprint (Click chip to inspect market):</span>
              <span class="text-[10px] text-neutral-400">★ = Headquarters</span>
            </div>
            <div class="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
              ${countryChipsHtml}
            </div>
          </div>
        </div>
      `;

      // Attach click events on penetrated country chips
      mapLegendContainer.querySelectorAll('.map-penetrated-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const code = chip.getAttribute('data-code');
          if (!code) return;
          const countryData = mapData[code] || {
            code: code,
            name: (svgPaths[code] && svgPaths[code].name) || code,
            region: 'International Territory',
            vendor_count: 1,
            avg_starter_price_usd: 0,
            dominant_archetype_label: 'Regional Cloud POS',
            platforms: []
          };
          selectCountry(countryData);

          const path = mapSvg.querySelector(`path[data-code="${code}"]`);
          if (path) {
            path.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        });
      });

      return;
    }

    // 2. Standard Aggregate Dimension Legend View
    if (currentDimension === 'density') {
      mapLegendContainer.innerHTML = `
        <div class="flex flex-wrap items-center gap-4 text-xs font-mono ${isDark ? 'text-neutral-400' : 'text-neutral-600'}">
          <span class="${isDark ? 'text-neutral-500' : 'text-neutral-400'} uppercase text-[10px]">Vendor Density:</span>
          <div class="flex items-center space-x-1.5"><span class="w-3 h-3 rounded-full ${isDark ? 'bg-[#38bdf8]' : 'bg-[#0f172a]'}"></span><span>25+ (Heavy)</span></div>
          <div class="flex items-center space-x-1.5"><span class="w-3 h-3 rounded-full ${isDark ? 'bg-[#0284c7]' : 'bg-[#0369a1]'}"></span><span>15-24 (High)</span></div>
          <div class="flex items-center space-x-1.5"><span class="w-3 h-3 rounded-full ${isDark ? 'bg-[#0369a1]' : 'bg-[#38bdf8]'}"></span><span>7-14 (Moderate)</span></div>
          <div class="flex items-center space-x-1.5"><span class="w-3 h-3 rounded-full ${isDark ? 'bg-[#1e3a8a]' : 'bg-[#bae6fd]'}"></span><span>1-6 (Emerging)</span></div>
        </div>
      `;
    } else if (currentDimension === 'pricing') {
      mapLegendContainer.innerHTML = `
        <div class="flex flex-wrap items-center gap-4 text-xs font-mono ${isDark ? 'text-neutral-400' : 'text-neutral-600'}">
          <span class="${isDark ? 'text-neutral-500' : 'text-neutral-400'} uppercase text-[10px]">Avg Starter Price:</span>
          <div class="flex items-center space-x-1.5"><span class="w-3 h-3 rounded-full bg-[#e11d48]"></span><span>$100+/mo (North America)</span></div>
          <div class="flex items-center space-x-1.5"><span class="w-3 h-3 rounded-full bg-[#ea580c]"></span><span>$60-$99/mo (Europe/AU)</span></div>
          <div class="flex items-center space-x-1.5"><span class="w-3 h-3 rounded-full bg-[#0d9488]"></span><span>$35-$59/mo (GCC/SG)</span></div>
          <div class="flex items-center space-x-1.5"><span class="w-3 h-3 rounded-full bg-[#10b981]"></span><span><$35/mo (India/Africa)</span></div>
        </div>
      `;
    } else if (currentDimension === 'archetype') {
      mapLegendContainer.innerHTML = `
        <div class="flex flex-wrap items-center gap-3 text-xs font-mono ${isDark ? 'text-neutral-400' : 'text-neutral-600'}">
          <span class="${isDark ? 'text-neutral-500' : 'text-neutral-400'} uppercase text-[10px]">Archetypes:</span>
          <div class="flex items-center space-x-1"><span class="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]"></span><span>Franchise FOFO</span></div>
          <div class="flex items-center space-x-1"><span class="w-2.5 h-2.5 rounded-full bg-[#0284c7]"></span><span>Cloud SaaS</span></div>
          <div class="flex items-center space-x-1"><span class="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span><span>Coin-Op IoT</span></div>
          <div class="flex items-center space-x-1"><span class="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span><span>Perpetual POS</span></div>
          <div class="flex items-center space-x-1"><span class="w-2.5 h-2.5 rounded-full bg-[#64748b]"></span><span>Industrial Hub</span></div>
        </div>
      `;
    } else if (currentDimension === 'origins') {
      mapLegendContainer.innerHTML = `
        <div class="flex flex-wrap items-center gap-4 text-xs font-mono ${isDark ? 'text-neutral-400' : 'text-neutral-600'}">
          <span class="${isDark ? 'text-neutral-500' : 'text-neutral-400'} uppercase text-[10px]">HQ Hubs:</span>
          <div class="flex items-center space-x-1.5"><span class="w-3 h-3 rounded-full bg-[#7c3aed]"></span><span>10+ Origins (India: 28, US: 13)</span></div>
          <div class="flex items-center space-x-1.5"><span class="w-3 h-3 rounded-full bg-[#2563eb]"></span><span>2-9 Origins (UK: 5)</span></div>
          <div class="flex items-center space-x-1.5"><span class="w-3 h-3 rounded-full bg-[#0891b2]"></span><span>1 Origin (NL, AU, NG, IL, PK)</span></div>
        </div>
      `;
    }
  }

  // Region Viewport Zoom / Presets
  function setupRegionPresets() {
    document.querySelectorAll('.map-region-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const region = btn.getAttribute('data-region');
        applyRegionPreset(region);
      });
    });
  }

  function applyRegionPreset(region) {
    if (!mapSvg) return;
    let viewBox = "0 0 1000 500";

    if (region === 'south_asia') {
      viewBox = "640 130 240 180"; // Focus on India & Subcontinent
    } else if (region === 'gcc') {
      viewBox = "560 140 220 160"; // Focus on Middle East
    } else if (region === 'north_america') {
      viewBox = "100 60 360 250"; // Focus on US & Canada
    } else if (region === 'europe') {
      viewBox = "440 40 260 200"; // Focus on Europe & UK
    }

    mapSvg.setAttribute('viewBox', viewBox);
  }

  // Export to global scope
  window.initWorldMap = initMap;
  window.reRenderWorldMap = renderMap;
  window.setMapCompanyFilter = setCompanyFilter;
  window.populateMapCompanyFilter = populateCompanyFilter;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMap);
  } else {
    initMap();
  }

})();
