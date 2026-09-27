(() => {
  'use strict';

  // URL options: ?theme=light|dark  ?embed=1 (hides the title, for iframes)
  const params = new URLSearchParams(location.search);
  if (['light', 'dark'].includes(params.get('theme'))) document.documentElement.dataset.theme = params.get('theme');
  if (params.has('embed')) document.body.classList.add('embed');

  const PALETTE = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#14b8a6', '#ec4899', '#84cc16', '#64748b'];
  const TILES = {
    light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  };
  const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const place = (f) => [f.city, f.region, f.country].filter(Boolean).join(', ');
  const formatVisited = (v) => {
    if (!v) return '';
    const [y, m] = v.split('-');
    return m ? new Date(Number(y), Number(m) - 1).toLocaleString(undefined, { month: 'short', year: 'numeric' }) : y;
  };

  const isDark = () => {
    const forced = document.documentElement.dataset.theme;
    return forced ? forced === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const map = L.map('map', { worldCopyJump: true, zoomControl: true }).setView([30, -40], 2);
  let tiles = L.tileLayer(isDark() ? TILES.dark : TILES.light, { attribution: ATTRIBUTION, subdomains: 'abcd', maxZoom: 18 }).addTo(map);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => tiles.setUrl(isDark() ? TILES.dark : TILES.light));

  const cluster = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 45,
    iconCreateFunction: (c) => L.divIcon({ html: `<div class="cluster">${c.getChildCount()}</div>`, className: '', iconSize: [38, 38] }),
  });
  map.addLayer(cluster);

  let facilities = [];
  const colors = new Map();
  const active = new Set();
  let query = '';

  function popupHtml(f) {
    const sub = [f.company, place(f), formatVisited(f.visited)].filter(Boolean).map(esc).join(' · ');
    return `<div class="popup">
      <h3>${esc(f.name)}${f.confidential ? '<span class="badge">NDA</span>' : ''}</h3>
      <div class="sub">${sub}</div>
      <div><span class="dot" style="--c:${colors.get(f.category)};display:inline-block;margin-right:6px"></span>${esc(f.category)}</div>
      ${f.description ? `<p>${esc(f.description)}</p>` : ''}
      ${f.confidential ? '<p class="sub">Details withheld at the client’s request; location is approximate.</p>' : ''}
      ${f.link ? `<a href="${esc(f.link)}" target="_blank" rel="noopener">Watch / read more →</a>` : ''}
    </div>`;
  }

  function renderStats(stats) {
    const tiles = [
      ['Facilities', stats.facilities],
      ['Countries', stats.countries],
      ['Regions', stats.regions],
      ['Industries', stats.categories],
    ];
    if (stats.since) tiles.push(['Since', stats.since]);
    $('stats').innerHTML = tiles.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('');
  }

  function renderChips(categories) {
    $('chips').innerHTML = categories.map((c) =>
      `<button class="chip" type="button" aria-pressed="true" data-cat="${esc(c.name)}">
        <span class="dot" style="--c:${colors.get(c.name)}"></span>${esc(c.name)} <span class="n">${c.count}</span>
      </button>`).join('');
    $('chips').addEventListener('click', (e) => {
      const btn = e.target.closest('.chip');
      if (!btn) return;
      const cat = btn.dataset.cat;
      // First click isolates a category; later clicks toggle; turning everything off resets.
      if (active.size === categories.length) { active.clear(); active.add(cat); }
      else if (active.has(cat)) active.delete(cat);
      else active.add(cat);
      if (!active.size) categories.forEach((c) => active.add(c.name));
      $('chips').querySelectorAll('.chip').forEach((b) => b.setAttribute('aria-pressed', active.has(b.dataset.cat)));
      update();
    });
  }

  function matches(f) {
    if (!active.has(f.category)) return false;
    if (!query) return true;
    return [f.name, f.company, f.city, f.region, f.country, f.category].join(' ').toLowerCase().includes(query);
  }

  function update() {
    const visible = facilities.filter(matches);
    cluster.clearLayers();
    cluster.addLayers(visible.map((f) => f.marker));

    $('count').textContent = `Showing ${visible.length} of ${facilities.length}`;
    $('list').innerHTML = visible.length
      ? visible.map((f) => `<li><button type="button" data-i="${f.index}">
          <span class="dot" style="--c:${colors.get(f.category)}"></span>
          <span class="name">${esc(f.name)}${f.confidential ? '<span class="badge">NDA</span>' : ''}</span>
          <span class="year">${esc(formatVisited(f.visited))}</span>
          <span class="meta">${esc(place(f))}</span>
        </button></li>`).join('')
      : '<li class="empty">No facilities match.</li>';
  }

  function focus(f) {
    cluster.zoomToShowLayer(f.marker, () => f.marker.openPopup());
    if (matchMedia('(max-width: 800px)').matches) $('map').scrollIntoView({ behavior: 'smooth' });
  }

  $('list').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-i]');
    if (btn) focus(facilities[Number(btn.dataset.i)]);
  });
  $('search').addEventListener('input', (e) => { query = e.target.value.trim().toLowerCase(); update(); });

  fetch('data/facilities.json', { cache: 'no-cache' })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((data) => {
      data.categories.forEach((c, i) => { colors.set(c.name, PALETTE[Math.min(i, PALETTE.length - 1)]); active.add(c.name); });
      facilities = data.facilities.map((f, index) => {
        const icon = L.divIcon({ className: '', html: `<div class="pin${f.confidential ? ' confidential' : ''}" style="--c:${colors.get(f.category)}"></div>`, iconSize: [16, 16] });
        const marker = L.marker([f.lat, f.lng], { icon, title: f.name, keyboard: true }).bindPopup(popupHtml(f), { maxWidth: 300 });
        return { ...f, index, marker };
      });
      renderStats(data.stats);
      renderChips(data.categories);
      update();
      if (facilities.length) map.fitBounds(L.latLngBounds(facilities.map((f) => [f.lat, f.lng])), { padding: [40, 40], maxZoom: 6 });
    })
    .catch(() => { $('count').textContent = 'Could not load the facility list.'; });
})();
