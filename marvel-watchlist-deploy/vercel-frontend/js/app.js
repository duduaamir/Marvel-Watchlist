// ============================================================
// MARVEL WATCHLIST
// vercel-frontend/js/app.js
// ============================================================


// ------------------------------------------------------------
// CONFIG
// ------------------------------------------------------------

const API_URL = 'https://marvel-watchlist.onrender.com/';

const SUPABASE_URL = 'https://ulfkgqttyyhqnieltkdn.supabase.co';

const SUPABASE_ANON_KEY = 'sb_publishable_qPynWf204MA04jy6sor7wg_cnvmHl0t';


// ------------------------------------------------------------
// STATE
// ------------------------------------------------------------

let titles = [];
let watched = new Set();
let schedule = {};

let currentUser = null;
let accessToken = null;

let activeScheduleId = null;
let authMode = 'login';


// ------------------------------------------------------------
// DOM ELEMENTS
// ------------------------------------------------------------

const el = {
  timeline: document.getElementById('timeline'),

  watchedCount: document.getElementById('watchedCount'),
  totalCount: document.getElementById('totalCount'),
  progressFill: document.getElementById('progressFill'),
  progressText: document.getElementById('progressText'),

  searchInput: document.getElementById('searchInput'),
  typeFilter: document.getElementById('typeFilter'),
  phaseFilter: document.getElementById('phaseFilter'),

  resetBtn: document.getElementById('resetBtn'),

  // AUTH
  loginBtn: document.getElementById('loginBtn'),
  signupBtn: document.getElementById('signupBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  userEmail: document.getElementById('userEmail'),

  authBackdrop: document.getElementById('authBackdrop'),
  authClose: document.getElementById('authClose'),
  authModalTitle: document.getElementById('authModalTitle'),
  authModalSubtitle: document.getElementById('authModalSubtitle'),
  authEmail: document.getElementById('authEmail'),
  authPassword: document.getElementById('authPassword'),
  authMessage: document.getElementById('authMessage'),
  authSwitchBtn: document.getElementById('authSwitchBtn'),
  authSubmitBtn: document.getElementById('authSubmitBtn'),

  // SCHEDULE MODAL
  scheduleBackdrop: document.getElementById('scheduleBackdrop'),
  scheduleClose: document.getElementById('scheduleClose'),
  scheduleTitle: document.getElementById('scheduleTitle'),
  scheduleDate: document.getElementById('scheduleDate'),
  scheduleTime: document.getElementById('scheduleTime'),
  scheduleSave: document.getElementById('scheduleSave'),
  scheduleDelete: document.getElementById('scheduleDelete'),
};


// ============================================================
// SUPABASE HELPERS
// ============================================================

function sb(path) {
  return `${SUPABASE_URL}/rest/v1/${path}`;
}


function sbHeaders(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}


async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);

  if (!res.ok) {
    const text = await res.text();

    throw new Error(
      `Request failed (${res.status}): ${text}`
    );
  }

  return res.json();
}


// ============================================================
// AUTH
// ============================================================

function storeSession(session) {
  accessToken = session.access_token;
  currentUser = session.user;

  localStorage.setItem(
    'marvel-watchlist-session',
    JSON.stringify(session)
  );
}


function clearSession() {
  accessToken = null;
  currentUser = null;

  localStorage.removeItem(
    'marvel-watchlist-session'
  );
}


async function restoreSession() {
  const stored = localStorage.getItem(
    'marvel-watchlist-session'
  );

  if (!stored) {
    return;
  }

  try {
    const session = JSON.parse(stored);

    if (!session.access_token) {
      clearSession();
      return;
    }

    const res = await fetch(
      `${SUPABASE_URL}/auth/v1/user`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (!res.ok) {
      clearSession();
      return;
    }

    const user = await res.json();

    currentUser = user;
    accessToken = session.access_token;

  } catch (error) {
    console.error('Session restore failed:', error);

    clearSession();
  }
}


function updateAuthUI() {
  const loggedIn = Boolean(currentUser);

  if (el.loginBtn) {
    el.loginBtn.hidden = loggedIn;
  }

  if (el.signupBtn) {
    el.signupBtn.hidden = loggedIn;
  }

  if (el.logoutBtn) {
    el.logoutBtn.hidden = !loggedIn;
  }

  if (el.resetBtn) {
    el.resetBtn.hidden = !loggedIn;
  }

  if (el.userEmail) {
    el.userEmail.hidden = !loggedIn;

    el.userEmail.textContent = loggedIn
      ? currentUser.email
      : '';
  }
}


function openAuthModal(mode = 'login') {
  authMode = mode;

  if (!el.authBackdrop) return;

  el.authEmail.value = '';
  el.authPassword.value = '';
  el.authMessage.textContent = '';

  if (mode === 'login') {
    el.authModalTitle.textContent =
      'Welcome back';

    el.authModalSubtitle.textContent =
      'Log in to access your personal Marvel watchlist.';

    el.authSubmitBtn.textContent =
      'Log In';

    el.authSwitchBtn.textContent =
      'Need an account? Sign up';

  } else {
    el.authModalTitle.textContent =
      'Join the timeline';

    el.authModalSubtitle.textContent =
      'Create an account and save your Marvel progress.';

    el.authSubmitBtn.textContent =
      'Create Account';

    el.authSwitchBtn.textContent =
      'Already have an account? Log in';
  }

  el.authBackdrop.hidden = false;

  setTimeout(() => {
    el.authEmail.focus();
  }, 100);
}


function closeAuthModal() {
  if (el.authBackdrop) {
    el.authBackdrop.hidden = true;
  }
}


async function signUp() {
  const email = el.authEmail.value.trim();
  const password = el.authPassword.value;

  if (!email || !password) {
    el.authMessage.textContent =
      'Please enter your email and password.';

    return;
  }

  if (password.length < 6) {
    el.authMessage.textContent =
      'Password must be at least 6 characters.';

    return;
  }

  el.authSubmitBtn.disabled = true;

  el.authMessage.textContent =
    'Creating your account...';

  try {
    const res = await fetch(
      `${SUPABASE_URL}/auth/v1/signup`,
      {
        method: 'POST',

        headers: {
          apikey: SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.msg ||
        data.message ||
        'Could not create account.'
      );
    }

    // If email confirmation is disabled,
    // Supabase gives us a session immediately.
    if (data.access_token && data.user) {
      storeSession(data);

      closeAuthModal();

      updateAuthUI();

      watched = new Set();
      schedule = {};

      await loadSupabaseState();

      renderAll();

      return;
    }

    el.authMessage.textContent =
      'Account created! Please check your email to confirm your account.';

  } catch (error) {
    console.error(error);

    el.authMessage.textContent =
      error.message ||
      'Something went wrong while creating your account.';

  } finally {
    el.authSubmitBtn.disabled = false;
  }
}


async function logIn() {
  const email = el.authEmail.value.trim();
  const password = el.authPassword.value;

  if (!email || !password) {
    el.authMessage.textContent =
      'Please enter your email and password.';

    return;
  }

  el.authSubmitBtn.disabled = true;

  el.authMessage.textContent =
    'Logging in...';

  try {
    const res = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: 'POST',

        headers: {
          apikey: SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error_description ||
        data.msg ||
        data.message ||
        'Invalid email or password.'
      );
    }

    storeSession(data);

    closeAuthModal();

    updateAuthUI();

    watched = new Set();
    schedule = {};

    await loadSupabaseState();

    renderAll();

  } catch (error) {
    console.error(error);

    el.authMessage.textContent =
      error.message ||
      'Could not log in.';

  } finally {
    el.authSubmitBtn.disabled = false;
  }
}


async function logOut() {
  try {
    if (accessToken) {
      await fetch(
        `${SUPABASE_URL}/auth/v1/logout`,
        {
          method: 'POST',

          headers: sbHeaders(),
        }
      );
    }

  } catch (error) {
    console.error('Logout failed:', error);

  } finally {
    clearSession();

    watched = new Set();
    schedule = {};

    updateAuthUI();

    renderAll();
  }
}


// ============================================================
// SUPABASE WATCHLIST
// ============================================================

async function loadSupabaseState() {
  if (!currentUser) {
    watched = new Set();
    schedule = {};
    return;
  }

  const rows = await fetchJson(
    sb(
      `watchlist_state?user_id=eq.${encodeURIComponent(
        currentUser.id
      )}&select=title_id,watched,schedule_date,schedule_time`
    ),
    {
      headers: sbHeaders(),
    }
  );

  watched = new Set(
    rows
      .filter(row => row.watched)
      .map(row => row.title_id)
  );

  schedule = {};

  rows
    .filter(row => row.schedule_date)
    .forEach(row => {
      schedule[row.title_id] = {
        date: row.schedule_date,
        time: row.schedule_time || '',
      };
    });
}


async function saveState(id, patch) {
  if (!currentUser) {
    openAuthModal('login');

    throw new Error(
      'You must be logged in.'
    );
  }

  const payload = {
    user_id: currentUser.id,
    title_id: id,
    watched: watched.has(id),
    schedule_date: null,
    schedule_time: null,
    ...patch,
  };

  // Keep existing schedule if it exists
  if (
    !Object.prototype.hasOwnProperty.call(
      patch,
      'schedule_date'
    ) &&
    schedule[id]
  ) {
    payload.schedule_date =
      schedule[id].date;

    payload.schedule_time =
      schedule[id].time || null;
  }

  const res = await fetch(
    sb(
      'watchlist_state?on_conflict=user_id,title_id'
    ),
    {
      method: 'POST',

      headers: sbHeaders({
        Prefer:
          'resolution=merge-duplicates,return=minimal',
      }),

      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const text = await res.text();

    throw new Error(
      `Supabase save failed (${res.status}): ${text}`
    );
  }
}


async function deleteState(id) {
  if (!currentUser) return;

  const res = await fetch(
    sb(
      `watchlist_state?user_id=eq.${encodeURIComponent(
        currentUser.id
      )}&title_id=eq.${encodeURIComponent(id)}`
    ),
    {
      method: 'DELETE',

      headers: sbHeaders(),
    }
  );

  if (!res.ok) {
    throw new Error(
      `Supabase delete failed (${res.status})`
    );
  }
}


async function resetSupabaseState() {
  if (!currentUser) return;

  const res = await fetch(
    sb(
      `watchlist_state?user_id=eq.${encodeURIComponent(
        currentUser.id
      )}`
    ),
    {
      method: 'DELETE',

      headers: sbHeaders(),
    }
  );

  if (!res.ok) {
    throw new Error(
      `Supabase reset failed (${res.status})`
    );
  }
}


// ============================================================
// LOAD MARVEL TITLES
// ============================================================

async function loadTitles() {
  const data = await fetchJson(
    `${API_URL}/api/titles`
  );

  titles = Array.isArray(data)
    ? data
    : [];
}


// ============================================================
// WATCH STATUS
// ============================================================

async function toggleWatch(id) {
  if (!currentUser) {
    openAuthModal('login');
    return;
  }

  const wasWatched = watched.has(id);

  if (wasWatched) {
    watched.delete(id);
  } else {
    watched.add(id);
  }

  renderAll();

  try {
    await saveState(id, {
      watched: watched.has(id),
    });

  } catch (error) {
    console.error(
      'Failed to save watch status:',
      error
    );

    // Roll back if database save fails
    if (wasWatched) {
      watched.add(id);
    } else {
      watched.delete(id);
    }

    renderAll();

    alert(
      'Could not save your progress. Please try again.'
    );
  }
}


// ============================================================
// SCHEDULE
// ============================================================

function openScheduleModal(id) {
  if (!currentUser) {
    openAuthModal('login');
    return;
  }

  activeScheduleId = id;

  const title = titles.find(
    item => item.id === id
  );

  if (el.scheduleTitle) {
    el.scheduleTitle.textContent =
      title
        ? `Schedule ${title.name}`
        : 'Schedule';
  }

  const existing = schedule[id];

  el.scheduleDate.value =
    existing?.date || '';

  el.scheduleTime.value =
    existing?.time || '';

  el.scheduleBackdrop.hidden = false;
}


function closeScheduleModal() {
  if (el.scheduleBackdrop) {
    el.scheduleBackdrop.hidden = true;
  }

  activeScheduleId = null;
}


async function saveScheduleFromModal() {
  if (!currentUser) {
    closeScheduleModal();

    openAuthModal('login');

    return;
  }

  if (!activeScheduleId) return;

  const date = el.scheduleDate.value;
  const time = el.scheduleTime.value;

  if (!date) {
    alert('Please choose a date.');

    return;
  }

  const id = activeScheduleId;

  schedule[id] = {
    date,
    time,
  };

  renderAll();

  closeScheduleModal();

  try {
    await saveState(id, {
      watched: watched.has(id),
      schedule_date: date,
      schedule_time: time || null,
    });

  } catch (error) {
    console.error(
      'Failed to save schedule:',
      error
    );

    alert(
      'Could not save the schedule.'
    );
  }
}


async function deleteScheduleFromModal() {
  if (!currentUser) return;

  if (!activeScheduleId) return;

  const id = activeScheduleId;

  delete schedule[id];

  renderAll();

  closeScheduleModal();

  try {
    await saveState(id, {
      watched: watched.has(id),
      schedule_date: null,
      schedule_time: null,
    });

  } catch (error) {
    console.error(
      'Failed to delete schedule:',
      error
    );
  }
}


// ============================================================
// FILTERING
// ============================================================

function getFilteredTitles() {
  const query =
    el.searchInput?.value
      .trim()
      .toLowerCase() || '';

  const type =
    el.typeFilter?.value || 'all';

  const phase =
    el.phaseFilter?.value || 'all';

  return titles.filter(title => {

    const matchesSearch =
      !query ||
      title.name
        .toLowerCase()
        .includes(query);

    const matchesType =
      type === 'all' ||
      title.type === type;

    const matchesPhase =
      phase === 'all' ||
      String(title.phase) === String(phase);

    return (
      matchesSearch &&
      matchesType &&
      matchesPhase
    );
  });
}


// ============================================================
// POSTER PLACEHOLDER
// ============================================================

function posterGlyph(name = '') {
  const first =
    name
      .trim()
      .charAt(0)
      .toUpperCase();

  return first || 'M';
}


function buildPoster(title) {
  const poster =
    document.createElement('div');

  poster.className = 'poster';

  // Future-ready:
  // If backend later sends posterUrl,
  // this automatically uses it.
  if (title.posterUrl) {
    const img =
      document.createElement('img');

    img.src = title.posterUrl;
    img.alt = `${title.name} poster`;

    img.loading = 'lazy';

    poster.appendChild(img);

  } else {
    const glyph =
      document.createElement('span');

    glyph.className =
      'poster-glyph';

    glyph.textContent =
      posterGlyph(title.name);

    poster.appendChild(glyph);
  }

  return poster;
}


// ============================================================
// BUILD CARD
// ============================================================

function buildCard(title) {
  const card =
    document.createElement('article');

  card.className =
    'timeline-card';

  card.dataset.id =
    title.id;

  if (watched.has(title.id)) {
    card.classList.add('watched');
  }


  const poster =
    buildPoster(title);


  const content =
    document.createElement('div');

  content.className =
    'card-content';


  const heading =
    document.createElement('div');

  heading.className =
    'card-heading';


  const titleName =
    document.createElement('h3');

  titleName.textContent =
    title.name;


  const meta =
    document.createElement('p');

  meta.className =
    'card-meta';

  meta.textContent = [
    title.year,
    title.type,
    title.phase
      ? `Phase ${title.phase}`
      : null,
  ]
    .filter(Boolean)
    .join(' • ');


  heading.appendChild(titleName);

  heading.appendChild(meta);


  const actions =
    document.createElement('div');

  actions.className =
    'card-actions';


  const watchBtn =
    document.createElement('button');

  watchBtn.type =
    'button';

  watchBtn.className =
    'watch-btn';

  watchBtn.textContent =
    watched.has(title.id)
      ? '✓ Watched'
      : 'Mark Watched';

  watchBtn.addEventListener(
    'click',
    () => toggleWatch(title.id)
  );


  const scheduleBtn =
    document.createElement('button');

  scheduleBtn.type =
    'button';

  scheduleBtn.className =
    'schedule-btn';

  scheduleBtn.textContent =
    schedule[title.id]
      ? 'Edit Schedule'
      : 'Schedule';

  scheduleBtn.addEventListener(
    'click',
    () => openScheduleModal(title.id)
  );


  actions.appendChild(watchBtn);

  actions.appendChild(scheduleBtn);


  if (schedule[title.id]) {
    const scheduleText =
      document.createElement('p');

    scheduleText.className =
      'schedule-text';

    const item =
      schedule[title.id];

    scheduleText.textContent =
      `Scheduled: ${item.date}` +
      (item.time
        ? ` at ${item.time}`
        : '');

    content.appendChild(
      scheduleText
    );
  }


  content.appendChild(heading);

  content.appendChild(actions);


  card.appendChild(poster);

  card.appendChild(content);


  return card;
}


// ============================================================
// RENDER TIMELINE
// ============================================================

function renderTimeline() {
  if (!el.timeline) return;

  const filtered =
    getFilteredTitles();

  el.timeline.innerHTML = '';

  if (!filtered.length) {
    el.timeline.innerHTML = `
      <div class="empty-state">
        No titles found.
      </div>
    `;

    return;
  }

  filtered.forEach(title => {
    el.timeline.appendChild(
      buildCard(title)
    );
  });
}


// ============================================================
// PROGRESS
// ============================================================

function renderProgress() {
  const total =
    titles.length;

  const count =
    watched.size;

  const percentage =
    total
      ? Math.round(
          (count / total) * 100
        )
      : 0;


  if (el.watchedCount) {
    el.watchedCount.textContent =
      count;
  }

  if (el.totalCount) {
    el.totalCount.textContent =
      total;
  }

  if (el.progressText) {
    el.progressText.textContent =
      `${percentage}%`;
  }

  if (el.progressFill) {
    el.progressFill.style.width =
      `${percentage}%`;
  }
}


// ============================================================
// RENDER ALL
// ============================================================

function renderAll() {
  renderProgress();

  renderTimeline();
}


// ============================================================
// RESET
// ============================================================

async function resetProgress() {
  if (!currentUser) {
    openAuthModal('login');
    return;
  }

  const confirmed =
    confirm(
      'Are you sure you want to clear all watched titles and schedules?'
    );

  if (!confirmed) return;

  try {
    await resetSupabaseState();

    watched = new Set();
    schedule = {};

    renderAll();

  } catch (error) {
    console.error(
      'Reset failed:',
      error
    );

    alert(
      'Could not reset your progress.'
    );
  }
}


// ============================================================
// EVENT LISTENERS
// ============================================================

function wireControls() {

  // AUTH BUTTONS
  el.loginBtn?.addEventListener(
    'click',
    () => openAuthModal('login')
  );


  el.signupBtn?.addEventListener(
    'click',
    () => openAuthModal('signup')
  );


  el.logoutBtn?.addEventListener(
    'click',
    logOut
  );


  el.authClose?.addEventListener(
    'click',
    closeAuthModal
  );


  el.authBackdrop?.addEventListener(
    'click',
    event => {
      if (
        event.target ===
        el.authBackdrop
      ) {
        closeAuthModal();
      }
    }
  );


  el.authSwitchBtn?.addEventListener(
    'click',
    () => {
      openAuthModal(
        authMode === 'login'
          ? 'signup'
          : 'login'
      );
    }
  );


  el.authSubmitBtn?.addEventListener(
    'click',
    () => {
      if (
        authMode === 'login'
      ) {
        logIn();
      } else {
        signUp();
      }
    }
  );


  // ENTER KEY IN PASSWORD FIELD
  el.authPassword?.addEventListener(
    'keydown',
    event => {
      if (event.key === 'Enter') {
        if (
          authMode === 'login'
        ) {
          logIn();
        } else {
          signUp();
        }
      }
    }
  );


  // SEARCH
  el.searchInput?.addEventListener(
    'input',
    renderTimeline
  );


  // TYPE FILTER
  el.typeFilter?.addEventListener(
    'change',
    renderTimeline
  );


  // PHASE FILTER
  el.phaseFilter?.addEventListener(
    'change',
    renderTimeline
  );


  // RESET
  el.resetBtn?.addEventListener(
    'click',
    resetProgress
  );


  // SCHEDULE
  el.scheduleClose?.addEventListener(
    'click',
    closeScheduleModal
  );


  el.scheduleBackdrop?.addEventListener(
    'click',
    event => {
      if (
        event.target ===
        el.scheduleBackdrop
      ) {
        closeScheduleModal();
      }
    }
  );


  el.scheduleSave?.addEventListener(
    'click',
    saveScheduleFromModal
  );


  el.scheduleDelete?.addEventListener(
    'click',
    deleteScheduleFromModal
  );
}


// ============================================================
// INITIALIZE
// ============================================================

async function init() {
  try {

    // Restore logged-in user first
    await restoreSession();

    updateAuthUI();


    // Load Marvel titles
    await loadTitles();


    // Only load database data
    // if a user is logged in
    if (currentUser) {
      await loadSupabaseState();
    }


    renderAll();

    wireControls();

  } catch (error) {

    console.error(
      'Initialization error:',
      error
    );

    if (el.timeline) {
      el.timeline.innerHTML = `
        <div class="empty-state">
          <h3>Something went wrong</h3>
          <p>
            Please check your API and Supabase configuration.
          </p>
        </div>
      `;
    }
  }
}


// ============================================================
// START APP
// ============================================================

document.addEventListener(
  'DOMContentLoaded',
  init
);
