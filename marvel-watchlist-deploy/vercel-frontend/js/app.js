(() => {
  'use strict';

  // ---------------------------------------------------------------- state

  const DOOMSDAY = new Date('2026-12-18T00:00:00');

  const PHASE_ORDER = ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Phase 5', 'Phase 6'];

  const TYPE_LABEL = { MOVIE: 'Movie', TV_SHOW: 'TV Show', SPECIAL: 'Special' };

  let titles = [];               // full catalog from /api/titles
  let watched = new Set();       // ids
  let schedule = {};             // id -> { date, time }

  const filters = {
    type: 'all',                 // 'all' | 'MOVIE' | 'TV_SHOW' | 'SPECIAL'
    watch: 'all',                // 'all' | 'watched' | 'unwatched'
    phase: 'all',
    search: '',
  };

  let activeScheduleId = null;

  // ------------------------------------------------------------- elements

  const el = {
    statTotal: document.getElementById('statTotal'),
    statCompleted: document.getElementById('statCompleted'),
    statRemaining: document.getElementById('statRemaining'),
    statNextScheduled: document.getElementById('statNextScheduled'),
    progressText: document.getElementById('progressText'),
    progressPct: document.getElementById('progressPct'),
    progressFill: document.getElementById('progressFill'),
    nextUpInner: document.getElementById('nextUpInner'),
    timeline: document.getElementById('timeline'),
    emptyState: document.getElementById('emptyState'),
    searchInput: document.getElementById('searchInput'),
    typeFilters: document.getElementById('typeFilters'),
    phaseFilter: document.getElementById('phaseFilter'),
    resetBtn: document.getElementById('resetBtn'),
    // modal
    backdrop: document.getElementById('scheduleBackdrop'),
    modalTitle: document.getElementById('scheduleModalTitle'),
    modalSubtitle: document.getElementById('scheduleModalSubtitle'),
    scheduleDate: document.getElementById('scheduleDate'),
    scheduleTime: document.getElementById('scheduleTime'),
    scheduleSave: document.getElementById('scheduleSave'),
    scheduleRemove: document.getElementById('scheduleRemove'),
    scheduleClose: document.getElementById('scheduleClose'),
  };

  // ------------------------------------------------------------------ api

  // Catalog still comes from the Java backend. Watch progress and schedules
  // are stored permanently in Supabase.
  const API_URL = 'https://YOUR-RENDER-SERVICE.onrender.com';
  const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
  const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

  const userIdKey = 'marvel-watchlist-user-id';
  function getUserId() {
    let id = localStorage.getItem(userIdKey);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(userIdKey, id);
    }
    return id;
  }
  const userId = getUserId();

  function api(path) { return API_URL ? `${API_URL}${path}` : path; }
  function sb(path) { return `${SUPABASE_URL}/rest/v1/${path}`; }
  function sbHeaders(extra = {}) {
    return {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      ...extra,
    };
  }

  async function fetchJson(url, options) {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`${url} -> ${res.status}`);
    return res.json();
  }

  async function loadSupabaseState() {
    const rows = await fetchJson(sb(`watchlist_state?user_id=eq.${encodeURIComponent(userId)}&select=title_id,watched,schedule_date,schedule_time`), {
      headers: sbHeaders(),
    });
    watched = new Set(rows.filter(r => r.watched).map(r => r.title_id));
    schedule = {};
    rows.filter(r => r.schedule_date).forEach(r => {
      schedule[r.title_id] = { date: r.schedule_date, time: r.schedule_time || '' };
    });
  }

  async function loadAll() {
    const [titlesRes] = await Promise.all([
      fetchJson(api('/api/titles')),
      loadSupabaseState(),
    ]);
    titles = titlesRes.sort((a, b) => a.order - b.order);
  }

  async function saveState(id, patch) {
    const payload = { user_id: userId, title_id: id, ...patch };
    const res = await fetch(sb('watchlist_state?on_conflict=user_id,title_id'), {
      method: 'POST',
      headers: sbHeaders({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Supabase save -> ${res.status}`);
  }

  async function deleteState(id) {
    const res = await fetch(sb(`watchlist_state?user_id=eq.${encodeURIComponent(userId)}&title_id=eq.${encodeURIComponent(id)}`), {
      method: 'DELETE', headers: sbHeaders(),
    });
    if (!res.ok) throw new Error(`Supabase delete -> ${res.status}`);
  }

  async function resetSupabaseState() {
    const res = await fetch(sb(`watchlist_state?user_id=eq.${encodeURIComponent(userId)}`), {
      method: 'DELETE', headers: sbHeaders(),
    });
    if (!res.ok) throw new Error(`Supabase reset -> ${res.status}`);
  }

  // -------------------------------------------------------------- helpers

  function posterGlyph(name) {
    return name.split(/[\s:]+/).filter(Boolean).slice(0, 4).join(' ');
  }

  function formatScheduleShort(dateStr, timeStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T' + (timeStr || '00:00'));
    const dateFmt = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (timeStr) {
      const timeFmt = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
      return `${dateFmt}, ${timeFmt}`;
    }
    return dateFmt;
  }

  function matchesFilters(t) {
    if (filters.type !== 'all' && t.type !== filters.type) return false;
    if (filters.watch === 'watched' && !watched.has(t.id)) return false;
    if (filters.watch === 'unwatched' && watched.has(t.id)) return false;
    if (filters.phase !== 'all' && t.phase !== filters.phase) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const haystack = `${t.name} ${t.year} ${t.phase} ${t.saga} ${t.typeLabel}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  }

  function nextUnwatched() {
    return titles.find((t) => !watched.has(t.id)) || null;
  }

  // ------------------------------------------------------------ rendering

  function renderDashboard() {
    const total = titles.length;
    const completed = watched.size;
    const remaining = total - completed;
    const pct = total ? Math.round((completed / total) * 100) : 0;

    el.statTotal.textContent = total;
    el.statCompleted.textContent = completed;
    el.statRemaining.textContent = remaining;
    el.progressText.textContent = `${completed} / ${total} titles completed`;
    el.progressPct.textContent = `${pct}%`;
    el.progressFill.style.width = `${pct}%`;

    // soonest upcoming scheduled title
    const upcoming = Object.entries(schedule)
      .filter(([, s]) => s.date)
      .map(([id, s]) => ({ id, ...s, dt: new Date(s.date + 'T' + (s.time || '00:00')) }))
      .sort((a, b) => a.dt - b.dt)[0];

    if (upcoming) {
      const t = titles.find((x) => x.id === upcoming.id);
      el.statNextScheduled.textContent = t
        ? `${t.name} — ${formatScheduleShort(upcoming.date, upcoming.time)}`
        : formatScheduleShort(upcoming.date, upcoming.time);
    } else {
      el.statNextScheduled.textContent = 'None yet';
    }
  }

  function renderNextUp() {
    const next = nextUnwatched();
    el.nextUpInner.innerHTML = '';

    if (!next) {
      const done = document.createElement('div');
      done.className = 'next-up-done';
      done.innerHTML = `You're all caught up. Assemble for Doomsday.<small>Every title in the timeline is marked watched.</small>`;
      el.nextUpInner.appendChild(done);
      return;
    }

    const tag = document.createElement('span');
    tag.className = 'next-up-tag';
    tag.textContent = 'Next Up';

    const poster = document.createElement('div');
    poster.className = 'next-up-poster';
    poster.style.background = `var(--theme-${next.theme})`;
    poster.textContent = next.name.slice(0, 2).toUpperCase();

    const text = document.createElement('div');
    text.className = 'next-up-text';
    text.innerHTML = `
      <p class="next-up-title">${escapeHtml(next.name)}</p>
      <p class="next-up-meta">${next.year} &middot; ${TYPE_LABEL[next.type]} &middot; ${escapeHtml(next.phase)} &middot; ${escapeHtml(next.runtime)}</p>
    `;

    const btn = document.createElement('button');
    btn.className = 'primary-btn';
    btn.textContent = 'Mark Watched';
    btn.addEventListener('click', () => toggleWatch(next.id, true));

    el.nextUpInner.append(tag, poster, text, btn);
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function buildCard(t) {
    const isWatched = watched.has(t.id);
    const sched = schedule[t.id];

    const card = document.createElement('article');
    card.className = 'title-card' + (isWatched ? ' is-watched' : '');
    card.dataset.id = t.id;

    const poster = document.createElement('div');
    poster.className = 'card-poster';
    poster.style.background = `var(--theme-${t.theme})`;

    const orderBadge = document.createElement('span');
    orderBadge.className = 'card-order';
    orderBadge.textContent = '#' + t.order;

    const typeBadge = document.createElement('span');
    typeBadge.className = 'card-typebadge';
    typeBadge.textContent = TYPE_LABEL[t.type];

    const stamp = document.createElement('div');
    stamp.className = 'watched-stamp';
    stamp.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    const glyph = document.createElement('span');
    glyph.className = 'card-poster-glyph';
    glyph.textContent = posterGlyph(t.name);

    poster.append(orderBadge, typeBadge, stamp, glyph);

    const body = document.createElement('div');
    body.className = 'card-body';

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = t.name;

    const meta = document.createElement('div');
    meta.className = 'card-meta';
    meta.innerHTML = `<span>${t.year}</span><span>&middot;</span><span>${escapeHtml(t.phase)}</span><span>&middot;</span><span>${escapeHtml(t.runtime)}</span>`;

    const notes = document.createElement('p');
    notes.className = 'card-notes';
    notes.textContent = t.notes;

    const schedChip = document.createElement('div');
    schedChip.className = 'card-schedule-chip' + (sched && sched.date ? ' visible' : '');
    schedChip.innerHTML = sched && sched.date
      ? `📅 ${formatScheduleShort(sched.date, sched.time)}`
      : '';

    const actions = document.createElement('div');
    actions.className = 'card-actions';

    const watchBtn = document.createElement('button');
    watchBtn.className = 'watch-toggle-btn' + (isWatched ? ' is-active' : '');
    watchBtn.textContent = isWatched ? '✓ Watched' : 'Mark Watched';
    watchBtn.addEventListener('click', () => toggleWatch(t.id, !isWatched));

    const schedBtn = document.createElement('button');
    schedBtn.className = 'schedule-btn' + (sched && sched.date ? ' has-schedule' : '');
    schedBtn.textContent = sched && sched.date ? 'Reschedule' : 'Schedule';
    schedBtn.addEventListener('click', () => openScheduleModal(t.id));

    actions.append(watchBtn, schedBtn);
    body.append(title, meta, notes, schedChip, actions);
    card.append(poster, body);
    return card;
  }

  function renderTimeline() {
    el.timeline.innerHTML = '';
    let visibleCount = 0;

    const byPhase = new Map();
    for (const t of titles) {
      if (!byPhase.has(t.phase)) byPhase.set(t.phase, []);
      byPhase.get(t.phase).push(t);
    }

    const phaseKeys = [...byPhase.keys()].sort(
      (a, b) => PHASE_ORDER.indexOf(a) - PHASE_ORDER.indexOf(b)
    );

    for (const phase of phaseKeys) {
      const items = byPhase.get(phase).filter(matchesFilters);
      if (items.length === 0) continue;
      visibleCount += items.length;

      const group = document.createElement('section');
      group.className = 'phase-group';

      const header = document.createElement('div');
      header.className = 'phase-header';
      header.innerHTML = `
        <span class="phase-title">${escapeHtml(phase)}</span>
        <span class="phase-saga">${escapeHtml(items[0].saga)}</span>
        <span class="phase-count">${items.length} title${items.length === 1 ? '' : 's'}</span>
      `;

      const grid = document.createElement('div');
      grid.className = 'card-grid';
      items.forEach((t, i) => {
        const card = buildCard(t);
        card.style.animationDelay = Math.min(i * 0.03, 0.4) + 's';
        grid.appendChild(card);
      });

      group.append(header, grid);
      el.timeline.appendChild(group);
    }

    el.emptyState.hidden = visibleCount !== 0;
  }

  function renderAll() {
    renderDashboard();
    renderNextUp();
    renderTimeline();
  }

  // -------------------------------------------------------------- actions

  async function toggleWatch(id, watchedNow) {
    // optimistic UI update
    if (watchedNow) watched.add(id); else watched.delete(id);
    renderAll();
    try {
      await saveState(id, { watched: watchedNow });
    } catch (e) {
      console.error('Failed to save watch status', e);
    }
  }

  function openScheduleModal(id) {
    const t = titles.find((x) => x.id === id);
    if (!t) return;
    activeScheduleId = id;
    el.modalTitle.textContent = 'Schedule this watch';
    el.modalSubtitle.textContent = t.name;
    const sched = schedule[id];
    el.scheduleDate.value = sched && sched.date ? sched.date : '';
    el.scheduleTime.value = sched && sched.time ? sched.time : '';
    el.backdrop.hidden = false;
    el.scheduleDate.focus();
  }

  function closeScheduleModal() {
    el.backdrop.hidden = true;
    activeScheduleId = null;
  }

  async function saveScheduleFromModal() {
    if (!activeScheduleId) return;
    const date = el.scheduleDate.value;
    const time = el.scheduleTime.value;
    if (!date) {
      el.scheduleDate.focus();
      return;
    }
    schedule[activeScheduleId] = { date, time };
    closeScheduleModal();
    renderAll();
    try {
      await saveState(activeScheduleId, { watched: watched.has(activeScheduleId), schedule_date: date, schedule_time: time || null });
    } catch (e) {
      console.error('Failed to save schedule', e);
    }
  }

  async function removeScheduleFromModal() {
    if (!activeScheduleId) return;
    const id = activeScheduleId;
    delete schedule[id];
    closeScheduleModal();
    renderAll();
    try {
      await saveState(id, { watched: watched.has(id), schedule_date: null, schedule_time: null });
    } catch (e) {
      console.error('Failed to clear schedule', e);
    }
  }

  async function resetProgress() {
    if (!confirm('Clear all watched titles and scheduled watches? This cannot be undone.')) return;
    watched.clear();
    schedule = {};
    renderAll();
    try {
      await resetSupabaseState();
    } catch (e) {
      console.error('Failed to reset', e);
    }
  }

  // --------------------------------------------------------------- filters

  function initPhaseSelect() {
    const seen = new Set();
    for (const t of titles) {
      if (seen.has(t.phase)) continue;
      seen.add(t.phase);
      const opt = document.createElement('option');
      opt.value = t.phase;
      opt.textContent = t.phase;
      el.phaseFilter.appendChild(opt);
    }
  }

  function wireControls() {
    el.searchInput.addEventListener('input', (e) => {
      filters.search = e.target.value.trim();
      renderTimeline();
    });

    el.typeFilters.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      if (btn.dataset.filterType) {
        filters.type = btn.dataset.filterType;
        el.typeFilters.querySelectorAll('[data-filter-type]').forEach((b) => b.classList.toggle('active', b === btn));
      } else if (btn.dataset.filterWatch) {
        const val = btn.dataset.filterWatch;
        const isActive = btn.classList.contains('active');
        filters.watch = isActive ? 'all' : val;
        el.typeFilters.querySelectorAll('[data-filter-watch]').forEach((b) => b.classList.remove('active'));
        if (!isActive) btn.classList.add('active');
      }
      renderTimeline();
    });

    el.phaseFilter.addEventListener('change', (e) => {
      filters.phase = e.target.value;
      renderTimeline();
    });

    el.resetBtn.addEventListener('click', resetProgress);

    el.scheduleSave.addEventListener('click', saveScheduleFromModal);
    el.scheduleRemove.addEventListener('click', removeScheduleFromModal);
    el.scheduleClose.addEventListener('click', closeScheduleModal);
    el.backdrop.addEventListener('click', (e) => { if (e.target === el.backdrop) closeScheduleModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !el.backdrop.hidden) closeScheduleModal(); });
  }

  // -------------------------------------------------------------- countdown

  function tickCountdown() {
    const now = new Date();
    let diff = DOOMSDAY - now;
    const cdDays = document.getElementById('cd-days');
    const cdHours = document.getElementById('cd-hours');
    const cdMins = document.getElementById('cd-mins');
    const cdSecs = document.getElementById('cd-secs');

    if (diff <= 0) {
      cdDays.textContent = '00';
      cdHours.textContent = '00';
      cdMins.textContent = '00';
      cdSecs.textContent = '00';
      return;
    }

    const days = Math.floor(diff / 86400000);
    diff -= days * 86400000;
    const hours = Math.floor(diff / 3600000);
    diff -= hours * 3600000;
    const mins = Math.floor(diff / 60000);
    diff -= mins * 60000;
    const secs = Math.floor(diff / 1000);

    cdDays.textContent = String(days).padStart(2, '0');
    cdHours.textContent = String(hours).padStart(2, '0');
    cdMins.textContent = String(mins).padStart(2, '0');
    cdSecs.textContent = String(secs).padStart(2, '0');
  }

  // ------------------------------------------------------------------ boot

  async function init() {
    try {
      await loadAll();
    } catch (e) {
      console.error('Failed to load watchlist data', e);
      el.timeline.innerHTML = '<p class="empty-state">Could not reach the server. Is it still running?</p>';
      return;
    }
    initPhaseSelect();
    wireControls();
    renderAll();
    tickCountdown();
    setInterval(tickCountdown, 1000);
  }

  init();
})();
