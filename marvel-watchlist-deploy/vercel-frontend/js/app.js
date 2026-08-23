// Marvel Watchlist Command Center
const API_URL = 'https://marvel-watchlist.onrender.com';
const SUPABASE_URL = 'https://ulfkgqttyyhqnieltkdn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_qPynWf204MA04jy6sor7wg_cnvmHl0t';

let titles = [], watched = new Set(), schedule = {};
let currentUser = null, accessToken = null, activeScheduleId = null, authMode = 'login';
let typeFilter = 'all', watchFilter = 'all';

const $ = id => document.getElementById(id);
const el = {
  timeline: $('timeline'), emptyState: $('emptyState'), searchInput: $('searchInput'), phaseFilter: $('phaseFilter'),
  statTotal: $('statTotal'), statCompleted: $('statCompleted'), statRemaining: $('statRemaining'), statNextScheduled: $('statNextScheduled'),
  progressFill: $('progressFill'), progressText: $('progressText'), progressPct: $('progressPct'), nextUpInner: $('nextUpInner'),
  loginBtn: $('loginBtn'), signupBtn: $('signupBtn'), logoutBtn: $('logoutBtn'), resetBtn: $('resetBtn'), userEmail: $('userEmail'),
  authBackdrop: $('authBackdrop'), authClose: $('authClose'), authModalTitle: $('authModalTitle'), authModalSubtitle: $('authModalSubtitle'), authEmail: $('authEmail'), authPassword: $('authPassword'), authMessage: $('authMessage'), authSwitchBtn: $('authSwitchBtn'), authSubmitBtn: $('authSubmitBtn'),
  scheduleBackdrop: $('scheduleBackdrop'), scheduleClose: $('scheduleClose'), scheduleTitle: $('scheduleTitle'), scheduleDate: $('scheduleDate'), scheduleTime: $('scheduleTime'), scheduleSave: $('scheduleSave'), scheduleDelete: $('scheduleDelete'), scheduleRemove: $('scheduleRemove'), scheduleModalSubtitle: $('scheduleModalSubtitle')
};

function headers(extra = {}) { return { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', ...extra }; }
function rest(path) { return `${SUPABASE_URL}/rest/v1/${path}`; }
async function json(url, options = {}) { const r = await fetch(url, options); if (!r.ok) throw new Error(await r.text()); return r.json(); }

function storeSession(s) { accessToken = s.access_token; currentUser = s.user; localStorage.setItem('marvel-watchlist-session', JSON.stringify(s)); }
function clearSession() { accessToken = null; currentUser = null; localStorage.removeItem('marvel-watchlist-session'); }

async function restoreSession() {
  const raw = localStorage.getItem('marvel-watchlist-session'); if (!raw) return;
  try { const s = JSON.parse(raw); const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${s.access_token}` } }); if (!r.ok) throw new Error(); currentUser = await r.json(); accessToken = s.access_token; } catch { clearSession(); }
}

function updateAuthUI() {
  const yes = !!currentUser;
  if (el.loginBtn) el.loginBtn.hidden = yes; if (el.signupBtn) el.signupBtn.hidden = yes;
  if (el.logoutBtn) el.logoutBtn.hidden = !yes; if (el.resetBtn) el.resetBtn.hidden = !yes;
  if (el.userEmail) { el.userEmail.hidden = !yes; el.userEmail.textContent = yes ? currentUser.email : ''; }
}

function openAuth(mode = 'login') {
  authMode = mode; if (!el.authBackdrop) return;
  el.authEmail.value = ''; el.authPassword.value = ''; el.authMessage.textContent = '';
  const login = mode === 'login';
  el.authModalTitle.textContent = login ? 'Welcome back' : 'Join the timeline';
  el.authModalSubtitle.textContent = login ? 'Log in to access your personal Marvel watchlist.' : 'Create an account and save your Marvel progress.';
  el.authSubmitBtn.textContent = login ? 'Log In' : 'Create Account';
  el.authSwitchBtn.textContent = login ? 'Need an account? Sign up' : 'Already have an account? Log in';
  el.authBackdrop.hidden = false; setTimeout(() => el.authEmail?.focus(), 50);
}
function closeAuth() { if (el.authBackdrop) el.authBackdrop.hidden = true; }

async function submitAuth() {
  const email = el.authEmail.value.trim(), password = el.authPassword.value;
  if (!email || !password) { el.authMessage.textContent = 'Please enter your email and password.'; return; }
  if (password.length < 6) { el.authMessage.textContent = 'Password must be at least 6 characters.'; return; }
  el.authSubmitBtn.disabled = true; el.authMessage.textContent = authMode === 'login' ? 'Logging in...' : 'Creating your account...';
  try {
    const endpoint = authMode === 'login' ? `${SUPABASE_URL}/auth/v1/token?grant_type=password` : `${SUPABASE_URL}/auth/v1/signup`;
    const r = await fetch(endpoint, { method: 'POST', headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const data = await r.json(); if (!r.ok) throw new Error(data.error_description || data.msg || data.message || 'Authentication failed.');
    if (!data.access_token) { el.authMessage.textContent = 'Account created. Check your email to confirm it, then log in.'; return; }
    storeSession(data); watched = new Set(); schedule = {}; await loadState(); updateAuthUI(); closeAuth(); renderAll();
  } catch (e) { el.authMessage.textContent = e.message || 'Something went wrong.'; }
  finally { el.authSubmitBtn.disabled = false; }
}

async function logOut() { try { if (accessToken) await fetch(`${SUPABASE_URL}/auth/v1/logout`, { method: 'POST', headers: headers() }); } finally { clearSession(); watched = new Set(); schedule = {}; updateAuthUI(); renderAll(); } }

async function loadState() {
  if (!currentUser) { watched = new Set(); schedule = {}; return; }
  const rows = await json(rest(`watchlist_state?select=title_id,watched,schedule_date,schedule_time`), { headers: headers() });
  watched = new Set(rows.filter(x => x.watched).map(x => x.title_id)); schedule = {};
  rows.filter(x => x.schedule_date).forEach(x => schedule[x.title_id] = { date: x.schedule_date, time: x.schedule_time || '' });
}
async function saveState(id, patch = {}) {
  const payload = { user_id: currentUser.id, title_id: id, watched: watched.has(id), schedule_date: schedule[id]?.date || null, schedule_time: schedule[id]?.time || null, ...patch };
  const r = await fetch(rest('watchlist_state?on_conflict=user_id,title_id'), { method: 'POST', headers: headers({ Prefer: 'resolution=merge-duplicates,return=minimal' }), body: JSON.stringify(payload) });
  if (!r.ok) throw new Error(await r.text());
}
async function resetState() { const r = await fetch(rest('watchlist_state'), { method: 'DELETE', headers: headers() }); if (!r.ok) throw new Error(await r.text()); }

async function loadTitles() { const data = await json(`${API_URL}/api/titles`); titles = Array.isArray(data) ? data.sort((a,b) => (a.order || 0) - (b.order || 0)) : []; }

function filteredTitles() {
  const q = (el.searchInput?.value || '').trim().toLowerCase(), phase = el.phaseFilter?.value || 'all';
  return titles.filter(t => {
    const matchesQ = !q || `${t.name} ${t.year} ${t.phase} ${t.saga}`.toLowerCase().includes(q);
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    const matchesWatch = watchFilter === 'all' || (watchFilter === 'watched' ? watched.has(t.id) : !watched.has(t.id));
    const matchesPhase = phase === 'all' || t.phase === phase || t.saga === phase;
    return matchesQ && matchesType && matchesWatch && matchesPhase;
  });
}

function poster(t) {
  if (t.posterUrl) return `<div class="poster"><img src="${escapeHtml(t.posterUrl)}" alt="${escapeHtml(t.name)} poster" loading="lazy"></div>`;
  return `<div class="poster poster-${t.theme || 1}"><span class="poster-glyph">${escapeHtml((t.name || 'M').charAt(0))}</span></div>`;
}
function escapeHtml(v) { return String(v ?? '').replace(/[&<>'\"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c])); }

function renderTimeline() {
  const list = filteredTitles(); if (!el.timeline) return;
  el.timeline.innerHTML = list.map(t => {
    const done = watched.has(t.id), s = schedule[t.id];
    return `<article class="timeline-card ${done ? 'watched' : ''}" data-id="${escapeHtml(t.id)}">${poster(t)}<div class="card-content"><div class="card-heading"><div><h3>${escapeHtml(t.name)}</h3><p class="card-meta">${escapeHtml(t.year)} · ${escapeHtml(t.typeLabel || t.type)} · ${escapeHtml(t.phase || '')}</p></div><span class="order-number">#${escapeHtml(t.order || '')}</span></div>${t.runtime ? `<p class="card-runtime">${escapeHtml(t.runtime)}</p>` : ''}${t.notes ? `<p class="card-notes">${escapeHtml(t.notes)}</p>` : ''}${s ? `<p class="schedule-text">Scheduled: ${escapeHtml(s.date)}${s.time ? ` at ${escapeHtml(s.time)}` : ''}</p>` : ''}<div class="card-actions"><button class="watch-btn" data-watch="${escapeHtml(t.id)}">${done ? '✓ Watched' : 'Mark Watched'}</button><button class="schedule-btn" data-schedule="${escapeHtml(t.id)}">${s ? 'Edit Schedule' : 'Schedule'}</button></div></div></article>`;
  }).join('');
  if (el.emptyState) el.emptyState.hidden = list.length > 0;
  el.timeline.querySelectorAll('[data-watch]').forEach(b => b.addEventListener('click', () => toggleWatch(b.dataset.watch)));
  el.timeline.querySelectorAll('[data-schedule]').forEach(b => b.addEventListener('click', () => openSchedule(b.dataset.schedule)));
}

async function toggleWatch(id) {
  if (!currentUser) return openAuth('login'); const before = watched.has(id); before ? watched.delete(id) : watched.add(id); renderAll();
  try { await saveState(id); } catch (e) { before ? watched.add(id) : watched.delete(id); renderAll(); alert('Could not save your progress.'); }
}

function openSchedule(id) {
  if (!currentUser) return openAuth('login'); activeScheduleId = id; const t = titles.find(x => x.id === id), s = schedule[id];
  if (el.scheduleTitle) el.scheduleTitle.textContent = t ? `Schedule ${t.name}` : 'Schedule this watch';
  if (el.scheduleModalSubtitle) el.scheduleModalSubtitle.textContent = t ? t.name : '';
  el.scheduleDate.value = s?.date || ''; el.scheduleTime.value = s?.time || ''; el.scheduleBackdrop.hidden = false;
}
function closeSchedule() { if (el.scheduleBackdrop) el.scheduleBackdrop.hidden = true; activeScheduleId = null; }
async function saveSchedule() {
  if (!activeScheduleId) return; const id = activeScheduleId, date = el.scheduleDate.value, time = el.scheduleTime.value;
  if (!date) return alert('Please choose a date.'); schedule[id] = { date, time }; renderAll(); closeSchedule();
  try { await saveState(id); } catch (e) { alert('Could not save the schedule.'); await loadState(); renderAll(); }
}
async function removeSchedule() {
  if (!activeScheduleId) return; const id = activeScheduleId, old = schedule[id]; delete schedule[id]; renderAll(); closeSchedule();
  try { await saveState(id, { schedule_date: null, schedule_time: null }); } catch (e) { if (old) schedule[id] = old; renderAll(); alert('Could not remove the schedule.'); }
}

function renderDashboard() {
  const total = titles.length, complete = watched.size, remaining = Math.max(0, total - complete), pct = total ? Math.round(complete / total * 100) : 0;
  if (el.statTotal) el.statTotal.textContent = total; if (el.statCompleted) el.statCompleted.textContent = complete; if (el.statRemaining) el.statRemaining.textContent = remaining;
  if (el.progressText) el.progressText.textContent = `${complete} / ${total} titles completed`; if (el.progressPct) el.progressPct.textContent = `${pct}%`; if (el.progressFill) el.progressFill.style.width = `${pct}%`;
  const upcoming = Object.entries(schedule).map(([id,s]) => ({ id, ...s, title: titles.find(t => t.id === id) })).filter(x => x.title).sort((a,b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  const next = upcoming[0]; if (el.statNextScheduled) el.statNextScheduled.textContent = next ? next.title.name : 'None yet';
  if (el.nextUpInner) el.nextUpInner.innerHTML = next ? `<div class="next-up-card"><span class="next-up-label">NEXT UP</span><h2>${escapeHtml(next.title.name)}</h2><p>${escapeHtml(next.date)}${next.time ? ` · ${escapeHtml(next.time)}` : ''}</p><button class="primary-btn" id="nextUpWatch">${watched.has(next.id) ? 'Watched ✓' : 'Mark Watched'}</button></div>` : `<div class="next-up-card"><span class="next-up-label">NEXT UP</span><h2>Your next mission awaits.</h2><p>Schedule a title to see it here.</p></div>`;
  $('nextUpWatch')?.addEventListener('click', () => toggleWatch(next.id));
}

function populatePhases() {
  if (!el.phaseFilter) return; const current = el.phaseFilter.value || 'all'; const values = [...new Set(titles.map(t => t.phase).filter(Boolean))];
  el.phaseFilter.innerHTML = '<option value="all">All Phases</option>' + values.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
  if ([...el.phaseFilter.options].some(o => o.value === current)) el.phaseFilter.value = current;
}
function renderAll() { renderDashboard(); renderTimeline(); }

function tickCountdown() {
  const target = new Date('2026-12-18T00:00:00'); let d = Math.max(0, target - new Date());
  const parts = { 'cd-days': Math.floor(d / 86400000), 'cd-hours': Math.floor(d / 3600000) % 24, 'cd-mins': Math.floor(d / 60000) % 60, 'cd-secs': Math.floor(d / 1000) % 60 };
  Object.entries(parts).forEach(([id,v]) => { const n = $(id); if (n) n.textContent = String(v).padStart(2,'0'); });
}

function wire() {
  el.loginBtn?.addEventListener('click', () => openAuth('login')); el.signupBtn?.addEventListener('click', () => openAuth('signup')); el.logoutBtn?.addEventListener('click', logOut);
  el.authClose?.addEventListener('click', closeAuth); el.authSwitchBtn?.addEventListener('click', () => openAuth(authMode === 'login' ? 'signup' : 'login')); el.authSubmitBtn?.addEventListener('click', submitAuth);
  el.authPassword?.addEventListener('keydown', e => { if (e.key === 'Enter') submitAuth(); }); el.authBackdrop?.addEventListener('click', e => { if (e.target === el.authBackdrop) closeAuth(); });
  el.searchInput?.addEventListener('input', renderTimeline); el.phaseFilter?.addEventListener('change', renderTimeline);
  document.querySelectorAll('[data-filter-type]').forEach(b => b.addEventListener('click', () => { typeFilter = b.dataset.filterType; document.querySelectorAll('[data-filter-type]').forEach(x => x.classList.toggle('active', x === b)); renderTimeline(); }));
  document.querySelectorAll('[data-filter-watch]').forEach(b => b.addEventListener('click', () => { watchFilter = b.dataset.filterWatch; document.querySelectorAll('[data-filter-watch]').forEach(x => x.classList.toggle('active', x === b)); renderTimeline(); }));
  el.resetBtn?.addEventListener('click', async () => { if (!currentUser || !confirm('Clear all watched titles and schedules?')) return; try { await resetState(); watched = new Set(); schedule = {}; renderAll(); } catch { alert('Could not reset your progress.'); } });
  el.scheduleClose?.addEventListener('click', closeSchedule); el.scheduleSave?.addEventListener('click', saveSchedule); (el.scheduleDelete || el.scheduleRemove)?.addEventListener('click', removeSchedule); el.scheduleBackdrop?.addEventListener('click', e => { if (e.target === el.scheduleBackdrop) closeSchedule(); });
}

async function init() {
  wire(); tickCountdown(); setInterval(tickCountdown, 1000);
  try { await restoreSession(); updateAuthUI(); await loadTitles(); populatePhases(); if (currentUser) await loadState(); renderAll(); }
  catch (e) { console.error(e); if (el.timeline) el.timeline.innerHTML = '<div class="empty-state"><h3>Something went wrong</h3><p>Check the API connection and try again.</p></div>'; }
}
document.addEventListener('DOMContentLoaded', init);
