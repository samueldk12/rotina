/* =============================================
   MINHA ROTINA — APP LOGIC
   ============================================= */

// ─── API BASE (null when served locally with Python) ───────────────────────
const API_BASE = (function() {
  const h = window.location.hostname;
  return (h === 'localhost' || h === '127.0.0.1' || h === '') ? null : '/api';
})();

// ---- STATE ----
const state = {
  currentView: 'home',
  selectedDay: new Date().getDay(),
  selectedSheet: 'ficha1',
  workoutProgress: {},
  studyProgress: {},
  studyTimeLog: {},   // { 'Subject Key': totalMinutesStudied }
  activeTimer: null,
  timerSeconds: 0,
  timerRunning: false,
  modalExercise: null,
  modalTab: 'video',
  filterCategory: 'all',
  weekFilter: 'all',  // 'all' | 'study' | 'workout'
  searchQuery: '',
  deferredInstallPrompt: null,
  // Study mode
  studyMode: 'continuous',  // 'continuous' | 'pomodoro'
  studySubject: null,       // selected subject object
  studyTimer: null,
  studyTimerRunning: false,
  studyTimerSeconds: 0,
  studyTotalSeconds: 0,     // accumulated seconds in this session
  pomodoroFocusMin: 25,
  pomodoroBreakMin: 5,
  pomodoroPhase: 'focus',   // 'focus' | 'break'
  pomodoroCount: 0,
};

// =============================================
//   AUTH & SYNC SYSTEM
// =============================================

/** Returns the stored JWT token, or null */
function authGetToken() {
  return localStorage.getItem('rotina_token') || null;
}

/** Returns stored user info object, or null */
function authGetUser() {
  try {
    const raw = localStorage.getItem('rotina_user');
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}

/** Saves auth data and updates the header badge */
function authSaveSession(token, user) {
  localStorage.setItem('rotina_token', token);
  localStorage.setItem('rotina_user', JSON.stringify(user));
  _authUpdateBadge(user);
}

/** Clears auth data and shows login screen */
function authClearSession() {
  localStorage.removeItem('rotina_token');
  localStorage.removeItem('rotina_user');
  _authUpdateBadge(null);
  document.getElementById('app').style.display = 'none';
  document.getElementById('auth-overlay')?.classList.remove('hidden');
}

/** Updates the header user badge */
function _authUpdateBadge(user) {
  const avatar = document.getElementById('header-user-avatar');
  const name   = document.getElementById('header-user-name');
  if (!avatar || !name) return;
  if (user) {
    const initials = (user.username || '?').slice(0,2).toUpperCase();
    avatar.textContent = initials;
    name.textContent   = user.username;
  } else {
    avatar.textContent = '?';
    name.textContent   = '';
  }
}

/** On startup: check stored token, then sync or show login */
async function authInitSession() {
  const token = authGetToken();
  const user  = authGetUser();

  if (!token || !user) {
    // No session → show login screen
    document.getElementById('auth-overlay')?.classList.remove('hidden');
    return;
  }

  // Verify token with server (only if API is available)
  if (API_BASE) {
    try {
      const res = await fetch(`${API_BASE}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        // Token expired or invalid
        authClearSession();
        return;
      }
    } catch(e) {
      // Offline — trust stored token
      console.log('📴 Offline — using stored session');
    }
  }

  // Session valid → update badge, sync data, show app
  _authUpdateBadge(user);
  document.getElementById('auth-overlay')?.classList.add('hidden');
  document.getElementById('app').style.display = 'block';
  loadState();
  navigateTo('home');

  if (API_BASE) {
    syncFromServer();
  }
}

// ── Auth UI functions ─────────────────────────────────────────────────────

function authSwitchTab(tab) {
  const loginForm = document.getElementById('auth-form-login');
  const regForm   = document.getElementById('auth-form-register');
  const tabLogin  = document.getElementById('auth-tab-login');
  const tabReg    = document.getElementById('auth-tab-register');
  _authClearMsg();
  if (tab === 'login') {
    loginForm.style.display = '';
    regForm.style.display   = 'none';
    tabLogin.classList.add('active');
    tabReg.classList.remove('active');
  } else {
    loginForm.style.display = 'none';
    regForm.style.display   = '';
    tabReg.classList.add('active');
    tabLogin.classList.remove('active');
  }
}

function _authMsg(msg, type = 'error') {
  const el = document.getElementById('auth-msg');
  if (!el) return;
  el.textContent = msg;
  el.className   = `auth-msg ${type}`;
}

function _authClearMsg() {
  const el = document.getElementById('auth-msg');
  if (el) el.className = 'auth-msg';
}

function _authSetLoading(btnId, labelId, loading, label) {
  const btn   = document.getElementById(btnId);
  const lbl   = document.getElementById(labelId);
  if (!btn || !lbl) return;
  btn.disabled = loading;
  if (loading) {
    lbl.innerHTML = '<span class="auth-spinner"></span>';
  } else {
    lbl.textContent = label;
  }
}

async function authLogin(e) {
  e.preventDefault();
  _authClearMsg();
  const username = document.getElementById('auth-login-username')?.value.trim();
  const password = document.getElementById('auth-login-password')?.value;

  if (!username || !password) return;

  if (!API_BASE) {
    _authMsg('Servidor não disponível no modo local. Faça deploy no Vercel.', 'error');
    return;
  }

  _authSetLoading('auth-login-btn', 'auth-login-btn-label', true);

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      _authMsg(data.error || 'Erro ao fazer login');
      return;
    }

    authSaveSession(data.token, data.user);
    document.getElementById('auth-overlay')?.classList.add('hidden');
    document.getElementById('app').style.display = 'block';
    loadState();
    navigateTo('home');
    syncFromServer();
  } catch(err) {
    _authMsg('Erro de conexão. Verifique sua internet.');
  } finally {
    _authSetLoading('auth-login-btn', 'auth-login-btn-label', false, 'Entrar');
  }
}

async function authRegister(e) {
  e.preventDefault();
  _authClearMsg();
  const username = document.getElementById('auth-reg-username')?.value.trim();
  const email    = document.getElementById('auth-reg-email')?.value.trim();
  const password = document.getElementById('auth-reg-password')?.value;
  const confirm  = document.getElementById('auth-reg-confirm')?.value;

  if (!username || !password) return;
  if (password !== confirm) {
    _authMsg('As senhas não coincidem');
    return;
  }
  if (password.length < 6) {
    _authMsg('Senha deve ter ao menos 6 caracteres');
    return;
  }

  if (!API_BASE) {
    _authMsg('Servidor não disponível no modo local. Faça deploy no Vercel.', 'error');
    return;
  }

  _authSetLoading('auth-register-btn', 'auth-register-btn-label', true);

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      _authMsg(data.error || 'Erro ao criar conta');
      return;
    }

    _authMsg('Conta criada! Entrando...', 'success');
    authSaveSession(data.token, data.user);
    setTimeout(() => {
      document.getElementById('auth-overlay')?.classList.add('hidden');
      document.getElementById('app').style.display = 'block';
      loadState();
      navigateTo('home');
    }, 800);
  } catch(err) {
    _authMsg('Erro de conexão. Verifique sua internet.');
  } finally {
    _authSetLoading('auth-register-btn', 'auth-register-btn-label', false, 'Criar Conta');
  }
}

function authShowLogout() {
  const user = authGetUser();
  if (!user) return;
  if (confirm(`Sair da conta de "${user.username}"?`)) {
    authClearSession();
    // Reset local state
    state.workoutProgress = {};
    state.studyProgress   = {};
    state.studyTimeLog    = {};
  }
}

// ── Sync functions ────────────────────────────────────────────────────────

function _syncSetIndicator(status) {
  // status: 'syncing' | 'done' | 'error' | ''
  const el = document.getElementById('sync-indicator');
  if (!el) return;
  el.className = `sync-indicator ${status ? 'visible' : ''}${status === 'syncing' ? ' syncing' : ''}${status === 'error' ? ' error' : ''}`;
  if (status === 'syncing') el.textContent = '↻ Sync';
  else if (status === 'error') el.textContent = '✕ Offline';
  else if (status === 'done') {
    el.textContent = '✓ Salvo';
    setTimeout(() => { el.className = 'sync-indicator'; }, 2000);
  } else { el.textContent = ''; }
}

async function syncFromServer() {
  if (!API_BASE) return;
  const token = authGetToken();
  if (!token) return;

  _syncSetIndicator('syncing');
  try {
    const res = await fetch(`${API_BASE}/data`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { _syncSetIndicator('error'); return; }

    const data = await res.json();

    // Merge server data (server wins over empty, client wins over equal)
    if (data.workoutProgress && Object.keys(data.workoutProgress).length > 0) {
      state.workoutProgress = data.workoutProgress;
      localStorage.setItem('rotina_workout', JSON.stringify(state.workoutProgress));
    }
    if (data.studyProgress && Object.keys(data.studyProgress).length > 0) {
      state.studyProgress = data.studyProgress;
      localStorage.setItem('rotina_study', JSON.stringify(state.studyProgress));
    }
    if (data.studyTimeLog && Object.keys(data.studyTimeLog).length > 0) {
      state.studyTimeLog = data.studyTimeLog;
      localStorage.setItem('rotina_studytime', JSON.stringify(state.studyTimeLog));
    }
    if (data.dayOverrides) {
      localStorage.setItem('rotina_overrides', JSON.stringify(data.dayOverrides));
    }
    if (data.generalOverrides) {
      localStorage.setItem('rotina_general_overrides', JSON.stringify(data.generalOverrides));
    }
    if (data.customSheets) {
      localStorage.setItem('rotina_custom_sheets', JSON.stringify(data.customSheets));
    }

    _syncSetIndicator('done');

    // Re-render current view with fresh data
    if (state.currentView === 'home')    renderHome();
    else if (state.currentView === 'week')    renderWeek();
    else if (state.currentView === 'workout') renderWorkout();
    else if (state.currentView === 'study')   renderStudyView();
  } catch(e) {
    console.log('📴 Sync failed (offline?):', e.message);
    _syncSetIndicator('error');
  }
}

async function syncToServer() {
  if (!API_BASE) return;
  const token = authGetToken();
  if (!token) return;

  try {
    await fetch(`${API_BASE}/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        workoutProgress:  state.workoutProgress,
        studyProgress:    state.studyProgress,
        studyTimeLog:     state.studyTimeLog,
        dayOverrides:     loadDayOverrides(),
        generalOverrides: loadGeneralOverrides(),
      }),
    });
    _syncSetIndicator('done');
  } catch(e) {
    // Silently fail — data is safe in localStorage
  }
}

async function syncSheetToServer(sheet) {
  if (!API_BASE) return;
  const token = authGetToken();
  if (!token) return;
  try {
    await fetch(`${API_BASE}/sheets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ sheet }),
    });
  } catch(e) {}
}

async function deleteSheetFromServer(sheetId) {
  if (!API_BASE) return;
  const token = authGetToken();
  if (!token) return;
  try {
    await fetch(`${API_BASE}/sheets?sheetId=${encodeURIComponent(sheetId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch(e) {}
}


function saveState() {
  try {
    localStorage.setItem('rotina_workout', JSON.stringify(state.workoutProgress));
    localStorage.setItem('rotina_study', JSON.stringify(state.studyProgress));
    localStorage.setItem('rotina_studytime', JSON.stringify(state.studyTimeLog));
  } catch(e) {}
  // Sync to server in background (non-blocking)
  syncToServer();
}

function loadState() {
  try {
    const w = localStorage.getItem('rotina_workout');
    const s = localStorage.getItem('rotina_study');
    const t = localStorage.getItem('rotina_studytime');
    if (w) state.workoutProgress = JSON.parse(w);
    if (s) state.studyProgress = JSON.parse(s);
    if (t) state.studyTimeLog = JSON.parse(t);
  } catch(e) {}
}

// ---- UTILS ----
function dayKey(dayNum) { return `day_${dayNum}`; }

function todayGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function formatDate(d) {
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function getIntensityBadge(sheet) {
  return `<span class="workout-badge" style="background:${sheet.color}22;color:${sheet.color};border:1px solid ${sheet.color}44">
    <span class="icon" style="width:12px;height:12px;display:inline-flex;">${ICONS[sheet.intensityIcon] || ''}</span>
    ${sheet.intensityLabel}
  </span>`;
}

function getBlockTypeBadge(type) {
  const map = {
    warmup:   ['AQUEC.', '#f59e0b'],
    circuit:  ['CIRCUITO', '#06b6d4'],
    superset: ['SUPER-SET', '#8b5cf6'],
    bisset:   ['BI-SET', '#a855f7'],
    triset:   ['TRI-SET', '#ec4899'],
    giantset: ['GIANT-SET', '#ef4444'],
    finisher: ['FINISH', '#ef4444'],
    normal:   ['NORMAL', '#64748b'],
    stretch:  ['ALONG.', '#22c55e'],
  };
  const [label, color] = map[type] || ['', '#64748b'];
  return `<span class="block-type-badge" style="background:${color}22;color:${color}">${label}</span>`;
}

function getExerciseProgress(sheetId, blockIdx, exIdx) {
  return state.workoutProgress[sheetId]?.[blockIdx]?.[exIdx] || {};
}

function setExerciseProgress(sheetId, blockIdx, exIdx, data) {
  if (!state.workoutProgress[sheetId]) state.workoutProgress[sheetId] = {};
  if (!state.workoutProgress[sheetId][blockIdx]) state.workoutProgress[sheetId][blockIdx] = {};
  state.workoutProgress[sheetId][blockIdx][exIdx] = data;
  saveState();
}

function isExerciseDone(sheetId, blockIdx, exIdx, totalSets) {
  const p = getExerciseProgress(sheetId, blockIdx, exIdx);
  if (!p.sets) return false;
  return p.sets.filter(Boolean).length >= totalSets && p.sets.length >= totalSets;
}

function countWorkoutProgress(sheetId) {
  const sheet = WORKOUT_SHEETS[sheetId];
  if (!sheet) return { done: 0, total: 0 };
  let done = 0, total = 0;
  sheet.blocks.forEach((block, bi) => {
    block.exercises.forEach((ex, ei) => {
      const sets = typeof ex.sets === 'number' ? ex.sets : 1;
      total++;
      if (isExerciseDone(sheetId, bi, ei, sets)) done++;
    });
  });
  return { done, total };
}

function countStudyProgress(dayNum) {
  const routine = WEEKLY_ROUTINE[dayNum];
  if (!routine) return { done: 0, total: 0 };
  const key = dayKey(dayNum);
  const total = routine.studies.length;
  const done = routine.studies.filter((_, i) => state.studyProgress[key]?.[i]).length;
  return { done, total };
}

// ---- TIMER ----
function startTimer(seconds) {
  clearInterval(state.activeTimer);
  state.timerSeconds = seconds;
  state.timerRunning = true;
  updateTimerDisplay();
  showTimerBar();
  state.activeTimer = setInterval(() => {
    if (state.timerRunning && state.timerSeconds > 0) {
      state.timerSeconds--;
      updateTimerDisplay();
    } else if (state.timerSeconds <= 0) {
      clearInterval(state.activeTimer);
      state.timerRunning = false;
      hideTimerBar();
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
  }, 1000);
}

function updateTimerDisplay() {
  const m = Math.floor(state.timerSeconds / 60).toString().padStart(2, '0');
  const s = (state.timerSeconds % 60).toString().padStart(2, '0');
  const el = document.getElementById('timer-display');
  if (el) el.textContent = `${m}:${s}`;
}

function showTimerBar() {
  document.getElementById('timer-bar')?.classList.add('show');
}
function hideTimerBar() {
  document.getElementById('timer-bar')?.classList.remove('show');
}

function toggleTimer() {
  state.timerRunning = !state.timerRunning;
  const btn = document.getElementById('timer-pause-btn');
  if (btn) btn.innerHTML = state.timerRunning ? ICONS.pause : ICONS.play;
}

// ---- NAVIGATION ----
function navigateTo(view) {
  state.currentView = view;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`view-${view}`)?.classList.add('active');
  document.getElementById(`nav-${view}`)?.classList.add('active');
  document.getElementById('main-content').scrollTop = 0;

  if (view === 'home') renderHome();
  else if (view === 'week') renderWeek();
  else if (view === 'study') renderStudyView();
  else if (view === 'workout') renderWorkout();
  else if (view === 'library') renderLibrary();
}

// ---- RENDER: HOME ----
function renderHome() {
  const todayNum = new Date().getDay();
  const routine = WEEKLY_ROUTINE[todayNum];
  const sheet = WORKOUT_SHEETS[routine.workout.sheetId];

  document.getElementById('greeting-text').innerHTML =
    `${todayGreeting()}, <span>Atleta!</span>`;
  document.getElementById('header-date').textContent = formatDate(new Date());

  // Progress rings
  const studyP = countStudyProgress(todayNum);
  const workP = countWorkoutProgress(routine.workout.sheetId);
  renderRing('study-ring', studyP.done, studyP.total, '#00d4ff');
  renderRing('workout-ring', workP.done, workP.total, '#7c3aed');
  document.getElementById('study-ring-label').textContent = `${studyP.done}/${studyP.total}`;
  document.getElementById('workout-ring-label').textContent = `${workP.done}/${workP.total}`;

  // Day image
  document.getElementById('day-overview-img').src = routine.dayImage || 'images/lower_body.png';

  // Studies
  document.getElementById('home-studies').innerHTML = routine.studies.map((s, i) => {
    const key = dayKey(todayNum);
    const done = state.studyProgress[key]?.[i];
    return `
      <div class="study-card ${done ? 'done' : ''}" onclick="toggleStudy(${todayNum}, ${i})">
        <div class="study-icon-wrap" style="background:${s.color}22;color:${s.color}">
          ${icon(s.iconKey, 20)}
        </div>
        <div class="study-info">
          <div class="study-name">${s.subject}</div>
          <div class="study-duration">${s.duration}</div>
        </div>
        <div class="study-check ${done ? 'checked' : ''}">
          ${icon('check', 12)}
        </div>
      </div>
    `;
  }).join('');

  // Workout card
  document.getElementById('home-workout-card').innerHTML = `
    <div class="workout-card-header">${getIntensityBadge(sheet)}</div>
    <div class="workout-card-title">${sheet.name} · ${sheet.subtitle}</div>
    <div class="workout-card-sub">${sheet.description}</div>
    <div class="workout-card-focus">
      ${icon('target', 14)} Foco: ${routine.workout.focus}
    </div>
    <button class="start-workout-btn" onclick="startWorkoutToday()">
      ${icon('play', 18)} Iniciar Treino de Hoje
    </button>
  `;

  // Tips
  document.getElementById('home-tips').innerHTML = OPTIMIZATION_TIPS.map(t => `
    <div class="tip-card">
      <div class="tip-icon-wrap">${icon(t.iconKey, 24)}</div>
      <div class="tip-title">${t.title}</div>
      <div class="tip-text">${t.text}</div>
    </div>
  `).join('');

  // Health
  renderHealth();
}

function renderRing(id, done, total, stroke) {
  const pct = total > 0 ? done / total : 0;
  const r = 25, circ = 2 * Math.PI * r;
  const fill = document.getElementById(id)?.querySelector('.ring-fill');
  if (fill) {
    fill.setAttribute('stroke-dasharray', circ);
    fill.setAttribute('stroke-dashoffset', circ * (1 - pct));
    fill.setAttribute('stroke', stroke);
  }
}

function toggleStudy(dayNum, idx) {
  const key = dayKey(dayNum);
  if (!state.studyProgress[key]) state.studyProgress[key] = {};
  state.studyProgress[key][idx] = !state.studyProgress[key][idx];
  saveState();
  renderHome();
}

function startWorkoutToday() {
  state.selectedSheet = WEEKLY_ROUTINE[new Date().getDay()].workout.sheetId;
  navigateTo('workout');
}

// ---- WEEK FILTER ----
function setWeekFilter(f) {
  state.weekFilter = f;
  document.querySelectorAll('.week-filter-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`wf-${f}`)?.classList.add('active');
  renderWeekDayDetail(state.selectedDay);
}

// ---- RENDER: WEEK ----
function renderWeek() {
  const todayNum = new Date().getDay();

  document.getElementById('week-day-pills').innerHTML = [0,1,2,3,4,5,6].map(d => {
    const routine = WEEKLY_ROUTINE[d];
    const date = new Date();
    date.setDate(date.getDate() - todayNum + d);
    return `
      <div class="day-pill ${d === state.selectedDay ? 'active' : ''} ${d === todayNum ? 'today' : ''}"
           onclick="selectWeekDay(${d})">
        <span class="day-pill-name">${routine.dayShort}</span>
        <span class="day-pill-num">${date.getDate()}</span>
        ${d === todayNum ? '<div class="day-dot"></div>' : ''}
      </div>
    `;
  }).join('');

  renderWeekDayDetail(state.selectedDay);
}

function selectWeekDay(dayNum) {
  state.selectedDay = dayNum;
  renderWeek();
}

function renderWeekDayDetail(dayNum) {
  const routine = WEEKLY_ROUTINE[dayNum];
  // Use effective routine (with overrides applied)
  const effective = typeof getEffectiveRoutine === 'function' ? getEffectiveRoutine(dayNum) : routine;
  const sheet = WORKOUT_SHEETS[effective.workout.sheetId];
  const isToday = dayNum === new Date().getDay();
  const workP = countWorkoutProgress(effective.workout.sheetId);
  const wf = state.weekFilter;

  // Override badges
  const hasDay = typeof hasDayOverride === 'function' && hasDayOverride(dayNum);
  const hasGen = typeof hasGeneralOverride === 'function' && hasGeneralOverride(dayNum);
  const overrideBadge = hasDay
    ? `<span class="day-override-badge">✦ Personalizado</span>`
    : hasGen
    ? `<span class="day-override-badge">✦ Rotina Editada</span>`
    : '';

  // ---- Time forecast calculation ----
  const studyTotalMin = effective.studies.reduce((acc, s) => acc + (s.durationMin || 0), 0);
  const workoutMin = effective.workout.estimatedMin || 40;
  const volleyballMin = effective.workout.volleyballMin || 0;
  const totalActivityMin = studyTotalMin + workoutMin + volleyballMin;

  function fmtMin(m) {
    if (m <= 0) return '0 min';
    const h = Math.floor(m / 60), r = m % 60;
    return h > 0 ? (r > 0 ? `${h}h${r}min` : `${h}h`) : `${r}min`;
  }

  // Time forecast — filter-aware
  const showStudy = wf !== 'workout';
  const showWorkout = wf !== 'study';
  const filteredTotal = (showStudy ? studyTotalMin : 0) + (showWorkout ? workoutMin + volleyballMin : 0);

  const forecastItems = [
    showStudy ? `
      <div class="dtf-item">
        <span class="dtf-icon" style="color:var(--cyan)">${icon('book', 14)}</span>
        <span class="dtf-label">Estudos</span>
        <span class="dtf-val">${fmtMin(studyTotalMin)}</span>
      </div>` : '',
    showWorkout && volleyballMin > 0 ? `
      <div class="dtf-item">
        <span class="dtf-icon" style="color:var(--blue)">${icon('volleyball', 14)}</span>
        <span class="dtf-label">Vôlei</span>
        <span class="dtf-val">${fmtMin(volleyballMin)}</span>
      </div>` : '',
    showWorkout ? `
      <div class="dtf-item">
        <span class="dtf-icon" style="color:var(--purple)">${icon('dumbbell', 14)}</span>
        <span class="dtf-label">Treino</span>
        <span class="dtf-val">${fmtMin(workoutMin)}</span>
      </div>` : '',
    `<div class="dtf-item dtf-total">
        <span class="dtf-icon">${icon('timer', 14)}</span>
        <span class="dtf-label">Total</span>
        <span class="dtf-val">${fmtMin(filteredTotal)}</span>
      </div>`,
  ].filter(Boolean).join('');

  const forecastHtml = `<div class="day-time-forecast">${forecastItems}</div>`;

  // Extra activities note from override
  const extras = (typeof loadDayOverrides === 'function' && loadDayOverrides()[dayNum]?.extras) || [];
  const extrasMap = { walk: '🚶 Caminhada', bike: '🚴 Ciclismo', swim: '🏊 Natação', volley: '🏐 Vôlei', rest: '🌙 Descanso' };
  const extrasHtml = extras.length > 0 ? `
    <div style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.2);border-radius:var(--radius-sm);padding:10px 14px;margin-bottom:12px;">
      <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px;">Atividades Extras</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">${extras.map(e => `<span style="font-size:12px;font-weight:600;color:#c4b5fd">${extrasMap[e] || e}</span>`).join('')}</div>
    </div>` : '';

  // Notes from override
  const notes = effective.notes || '';
  const notesHtml = notes ? `
    <div style="background:rgba(234,179,8,0.07);border:1px solid rgba(234,179,8,0.18);border-radius:var(--radius-sm);padding:10px 14px;margin-bottom:12px;">
      <div style="font-size:11px;font-weight:700;color:var(--yellow);margin-bottom:4px;">${icon('pen',11)} Observações</div>
      <div style="font-size:13px;color:var(--text-secondary);line-height:1.5;">${_escHtml ? _escHtml(notes) : notes}</div>
    </div>` : '';

  // Studies block
  const studiesHtml = wf !== 'workout' ? `
    <div class="subject-block">
      <div class="subject-block-title">${icon('book', 14)} Estudos do Dia</div>
      ${effective.studies.map(s => `
        <div class="subject-item">
          <div class="subject-icon-sm" style="color:${s.color}">${icon(s.iconKey, 16)}</div>
          <span class="subject-name">${s.subject}</span>
          <span class="subject-time">${s.duration}</span>
          <button class="study-start-mini" onclick="openStudyPanel(${JSON.stringify(s).replace(/"/g,'&quot;')})">${icon('play', 12)}</button>
        </div>
      `).join('')}
    </div>
  ` : '';

  // Workout block
  const focusChips = (effective.workout.focus || '').split(', ').map(f =>
    `<span class="focus-chip">${f}</span>`
  ).join('');

  const workoutHtml = wf !== 'study' ? `
    ${volleyballMin > 0 ? `
    <div class="volleyball-card">
      <div class="vc-icon">${icon('volleyball', 28)}</div>
      <div class="vc-info">
        <div class="vc-title">Vôlei</div>
        <div class="vc-sub">2 horas de jogo</div>
      </div>
      <div class="vc-badge">2h</div>
    </div>` : ''}
    <div class="workout-detail-card">
      <div class="workout-detail-title">${icon('dumbbell', 14)} Treino do Dia</div>
      <div class="workout-sheet-info">
        <div class="sheet-badge" style="background:${sheet.color}22;color:${sheet.color}">
          ${sheet.id.replace('ficha','F')}
        </div>
        <div>
          <div class="sheet-name">${sheet.name} · ${sheet.subtitle}</div>
          <div class="sheet-label">${effective.workout.label || ''}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-muted);margin-bottom:8px;">
        ${icon('box', 12)} ${effective.workout.module || ''}
      </div>
      <div class="focus-chips">${focusChips}</div>
      <div class="workout-est-time">
        ${icon('timer', 12)} Tempo estimado: <strong>${fmtMin(workoutMin)}</strong>
      </div>
      ${workP.total > 0 ? `
        <div style="margin-top:8px;font-size:12px;color:var(--text-muted);">
          Progresso: <span style="color:var(--cyan);font-weight:700;">${workP.done}/${workP.total}</span> exercícios
        </div>` : ''}
      <button class="start-day-btn" onclick="startDayWorkout(${dayNum})">
        ${icon('play', 14)} Ir para o Treino
      </button>
    </div>
  ` : '';

  document.getElementById('week-day-detail').innerHTML = `
    <div class="day-detail-header">
      <div class="day-detail-title">
        ${routine.dayName}${isToday ? ' <span style="color:var(--cyan);font-size:14px;">· Hoje</span>' : ''}
        ${overrideBadge}
        <button class="day-edit-trigger" onclick="openDayEditModal(${dayNum})">
          ${icon('pen', 11)} Editar
        </button>
      </div>
    </div>
    <div class="day-img-wrap">
      <img src="${routine.dayImage}" alt="${routine.dayName}" class="day-overview-img" />
      <div class="day-img-overlay"><span>${effective.workout.label || ''}</span></div>
    </div>
    ${notesHtml}
    ${extrasHtml}
    ${forecastHtml}
    ${studiesHtml}
    ${workoutHtml}
  `;
}

function startDayWorkout(dayNum) {
  state.selectedSheet = WEEKLY_ROUTINE[dayNum].workout.sheetId;
  navigateTo('workout');
}

// ---- RENDER: WORKOUT ----
function renderWorkout() {
  // Sheet tabs
  document.getElementById('workout-sheet-tabs').innerHTML = Object.values(WORKOUT_SHEETS).map(s => `
    <div class="sheet-tab ${s.id === state.selectedSheet ? 'active' : ''}"
         onclick="selectSheet('${s.id}')"
         style="${s.id === state.selectedSheet ? `border-color:${s.color};color:${s.color};background:${s.color}22` : ''}">
      <span style="display:inline-flex;align-items:center;gap:6px;">
        <span style="width:10px;height:10px;display:inline-flex;">${ICONS[s.intensityIcon]||''}</span>
        ${s.name}
      </span>
    </div>
  `).join('');

  const sheet = WORKOUT_SHEETS[state.selectedSheet];
  const progress = countWorkoutProgress(state.selectedSheet);
  const pct = progress.total > 0 ? (progress.done / progress.total) * 100 : 0;

  document.getElementById('workout-view-title').innerHTML =
    `${sheet.name} <span style="color:${sheet.color}">${sheet.intensityLabel}</span>`;
  document.getElementById('workout-view-sub').textContent = sheet.description;
  document.getElementById('workout-progress-fill').style.width = `${pct}%`;
  document.getElementById('workout-progress-text').textContent =
    `${progress.done} / ${progress.total} exercícios`;
  document.getElementById('rest-time-hint').textContent = `Descanso: ${sheet.restTime}s`;

  // Blocks
  const completeHtml = (progress.done === progress.total && progress.total > 0) ? `
    <div class="workout-complete" style="display:block">
      <div style="font-size:40px;margin-bottom:8px;">${icon('trophy', 40)}</div>
      <h2>TREINO COMPLETO!</h2>
      <p>Parabéns! Você concluiu o ${sheet.name}.<br>Descanse e hidrate-se bem.</p>
      <button onclick="resetWorkout('${state.selectedSheet}')"
              style="margin-top:16px;padding:10px 20px;border:1px solid var(--border);border-radius:8px;background:none;color:var(--text-secondary);font-size:13px;cursor:pointer;font-family:'Inter',sans-serif;display:inline-flex;align-items:center;gap:6px;">
        ${icon('refresh', 14)} Reiniciar Treino
      </button>
    </div>` : '';

  const blocksHtml = sheet.blocks.map((block, bi) => {
    const exHtml = block.exercises.map((ex, ei) => {
      const exData = EXERCISE_LIBRARY[ex.key] || {};
      const sets = typeof ex.sets === 'number' ? ex.sets : 1;
      const prog = getExerciseProgress(state.selectedSheet, bi, ei);
      const doneSets = prog.sets ? prog.sets.filter(Boolean).length : 0;
      const allDone = isExerciseDone(state.selectedSheet, bi, ei, sets);

      const setsHtml = Array.from({ length: sets }, (_, si) => `
        <div class="set-dot ${prog.sets?.[si] ? 'done' : ''}"
             onclick="toggleSet('${state.selectedSheet}', ${bi}, ${ei}, ${si}, ${sets})">${si + 1}</div>
      `).join('');

      const repsLabel = ex.reps !== undefined
        ? (typeof ex.reps === 'number' ? `${ex.reps} reps` : ex.reps) : '';
      const setsLabel = sets > 1 ? `${sets} séries` : '1 série';

      return `
        <div class="exercise-row ${allDone ? 'completed' : ''}" id="ex-${bi}-${ei}">
          <div class="exercise-main" onclick="toggleExpandEx(${bi}, ${ei})">
            <button class="exercise-check-btn ${allDone ? 'checked' : ''}"
                    onclick="event.stopPropagation(); toggleAllSets('${state.selectedSheet}', ${bi}, ${ei}, ${sets})">
              ${icon('check', 14)}
            </button>
            <div class="exercise-info">
              <div class="exercise-name">${exData.name || ex.key}</div>
              <div class="exercise-meta">${setsLabel} · ${repsLabel}${doneSets > 0 && !allDone ? ` · <span style="color:var(--cyan)">${doneSets}/${sets}</span>` : ''}</div>
              ${ex.note ? `<div class="exercise-note">${icon('bolt',11)} ${ex.note}</div>` : ''}
            </div>
            ${exData.videoId || exData.image ? `
              <button class="exercise-media-btn"
                      onclick="event.stopPropagation(); openMediaModal('${ex.key}')"
                      title="Ver referência">
                ${icon('video', 16)}
              </button>
            ` : ''}
          </div>
          <div class="set-tracker">${setsHtml}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="workout-block">
        <div class="block-header">
          ${getBlockTypeBadge(block.type)}
          <div>
            <div class="block-name">${block.name}</div>
            ${block.note ? `<div class="block-note">${icon('timer',11)} ${block.note}</div>` : ''}
          </div>
        </div>
        ${exHtml}
      </div>
    `;
  }).join('');

  document.getElementById('workout-blocks').innerHTML = completeHtml + blocksHtml;
}

function selectSheet(sheetId) {
  state.selectedSheet = sheetId;
  renderWorkout();
}

function toggleExpandEx(bi, ei) {
  document.getElementById(`ex-${bi}-${ei}`)?.classList.toggle('expanded');
}

function toggleSet(sheetId, bi, ei, si, totalSets) {
  const prog = getExerciseProgress(sheetId, bi, ei);
  if (!prog.sets) prog.sets = Array(totalSets).fill(false);
  prog.sets[si] = !prog.sets[si];
  setExerciseProgress(sheetId, bi, ei, prog);
  if (prog.sets[si]) startTimer(WORKOUT_SHEETS[sheetId].restTime);
  renderWorkout();
}

function toggleAllSets(sheetId, bi, ei, totalSets) {
  const prog = getExerciseProgress(sheetId, bi, ei);
  const allDone = prog.sets && prog.sets.filter(Boolean).length >= totalSets;
  prog.sets = Array(totalSets).fill(!allDone);
  if (!allDone) startTimer(WORKOUT_SHEETS[sheetId].restTime);
  setExerciseProgress(sheetId, bi, ei, prog);
  renderWorkout();
}

function resetWorkout(sheetId) {
  delete state.workoutProgress[sheetId];
  saveState();
  renderWorkout();
}

// ---- RENDER: LIBRARY ----
function renderLibrary() {
  const exercises = Object.entries(EXERCISE_LIBRARY);
  const query = state.searchQuery.toLowerCase();
  const cat = state.filterCategory;

  const filtered = exercises.filter(([key, ex]) => {
    const matchCat = cat === 'all' || ex.category === cat;
    const matchQ = !query || ex.name.toLowerCase().includes(query) || ex.muscles.join(' ').toLowerCase().includes(query);
    return matchCat && matchQ;
  });

  document.getElementById('exercise-grid').innerHTML = filtered.length > 0 ? filtered.map(([key, ex]) => `
    <div class="exercise-card" onclick="openMediaModal('${key}')">
      <img class="exercise-card-img" src="${ex.image}" alt="${ex.name}" loading="lazy" />
      <div class="exercise-card-body">
        <div class="exercise-card-name">${ex.name}</div>
        <div class="exercise-card-muscles">${ex.muscles.join(' · ')}</div>
        <div class="exercise-card-actions">
          ${ex.videoId ? `
            <button class="action-btn video" onclick="event.stopPropagation(); openVideoModal('${key}')">
              ${icon('video', 14)} YouTube
            </button>
          ` : ''}
          <button class="action-btn image" onclick="event.stopPropagation(); openImageModal('${key}')">
            ${icon('image', 14)} Imagem
          </button>
        </div>
      </div>
    </div>
  `).join('') : `
    <div class="empty-state">
      <div class="empty-icon">${icon('search', 48)}</div>
      <div class="empty-state-text">Nenhum exercício encontrado</div>
    </div>
  `;
}

function setLibraryFilter(cat) {
  state.filterCategory = cat;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-cat="${cat}"]`)?.classList.add('active');
  renderLibrary();
}

function onSearchInput(val) {
  state.searchQuery = val;
  renderLibrary();
}

// ---- MODAL ----
function openMediaModal(key, tab = 'video') {
  const ex = EXERCISE_LIBRARY[key];
  if (!ex) return;
  state.modalExercise = key;
  document.getElementById('modal-title').textContent = ex.name;
  document.getElementById('modal-muscles').textContent = ex.muscles.join(' · ');
  document.getElementById('modal-tips-text').textContent = ex.tips;
  renderModalContent(key, tab);
  setModalTab(tab);
  document.getElementById('media-modal').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function openVideoModal(key) { openMediaModal(key, 'video'); }
function openImageModal(key) { openMediaModal(key, 'image'); }

function renderModalContent(key, tab) {
  const ex = EXERCISE_LIBRARY[key];
  const mediaEl = document.getElementById('modal-media-content');
  if (tab === 'video' && ex.videoId) {
    mediaEl.innerHTML = `
      <div class="modal-video-wrap">
        <iframe src="https://www.youtube-nocookie.com/embed/${ex.videoId}?rel=0&modestbranding=1"
                allowfullscreen loading="lazy" title="${ex.name}"></iframe>
      </div>`;
  } else if (ex.image) {
    mediaEl.innerHTML = `<img class="modal-img" src="${ex.image}" alt="${ex.name}" />`;
  } else {
    mediaEl.innerHTML = `<div class="empty-state"><div class="empty-icon">${icon('video', 48)}</div><div class="empty-state-text">Vídeo não disponível offline</div></div>`;
  }
}

function setModalTab(tab) {
  state.modalTab = tab;
  document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
  if (state.modalExercise) renderModalContent(state.modalExercise, tab);
}

function closeModal() {
  document.getElementById('media-modal').classList.remove('show');
  document.body.style.overflow = '';
  const iframe = document.querySelector('#media-modal iframe');
  if (iframe) iframe.src = iframe.src;
}

// ---- INSTALL BANNER ----
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  state.deferredInstallPrompt = e;
  document.getElementById('install-banner')?.classList.add('show');
});

function installApp() {
  if (!state.deferredInstallPrompt) return;
  state.deferredInstallPrompt.prompt();
  state.deferredInstallPrompt.userChoice.then(r => {
    if (r.outcome === 'accepted') document.getElementById('install-banner')?.classList.remove('show');
    state.deferredInstallPrompt = null;
  });
}

function dismissInstall() {
  document.getElementById('install-banner')?.classList.remove('show');
}

// ---- INIT ----
function init() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
  // Auth session check — renders app if valid, shows login otherwise
  authInitSession();

  document.getElementById('timer-pause-btn').addEventListener('click', toggleTimer);
  document.getElementById('timer-stop-btn').addEventListener('click', () => {
    clearInterval(state.activeTimer);
    state.timerRunning = false;
    hideTimerBar();
  });
  document.getElementById('timer-reset-btn').addEventListener('click', () => {
    startTimer(WORKOUT_SHEETS[state.selectedSheet].restTime);
  });

  document.getElementById('media-modal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });

  document.getElementById('library-search').addEventListener('input', e => onSearchInput(e.target.value));

  // Close study panel on overlay click
  document.getElementById('study-panel')?.addEventListener('click', function(e) {
    if (e.target === this) closeStudyPanel();
  });
}

document.addEventListener('DOMContentLoaded', init);

// =============================================
//   STUDY GOALS HELPER
// =============================================

/**
 * Computes per-subject goals derived purely from WEEKLY_ROUTINE.
 * Returns { dailyMin, weeklyMin, monthlyMin, weeklyH, monthlyH }
 * goalHours in data.js is treated as the MONTHLY target (total hrs to study)
 */
function getSubjectGoals(subjectName) {
  // Daily: sum of durationMin for today
  const todayNum = new Date().getDay();
  const todayStudies = WEEKLY_ROUTINE[todayNum]?.studies || [];
  const todayEntry = todayStudies.find(s => s.subject === subjectName);
  const dailyMin = todayEntry?.durationMin || 0;

  // Weekly: sum of durationMin across all days
  let weeklyMin = 0;
  let firstEntry = null;
  Object.values(WEEKLY_ROUTINE).forEach(r => {
    const found = r.studies.find(s => s.subject === subjectName);
    if (found) {
      weeklyMin += found.durationMin || 0;
      if (!firstEntry) firstEntry = found;
    }
  });

  // Monthly: goalHours * 60 (this is the true monthly target set by user)
  const monthlyMin = (firstEntry?.goalHours || 0) * 60;

  return { dailyMin, weeklyMin, monthlyMin };
}

function fmtMin(m) {
  if (!m || m <= 0) return '0min';
  const h = Math.floor(m / 60), r = m % 60;
  if (h === 0) return `${r}min`;
  if (r === 0) return `${h}h`;
  return `${h}h${r}min`;
}

// =============================================
//   STUDY VIEW
// =============================================

function renderStudyView() {
  const todayNum = new Date().getDay();
  const routine = WEEKLY_ROUTINE[todayNum];
  const key = dayKey(todayNum);
  const studyP = countStudyProgress(todayNum);

  // Today overview card
  const todayHtml = `
    <div class="study-ov-header">
      <div>
        <div class="study-ov-title">Estudos de Hoje</div>
        <div class="study-ov-sub">${routine.dayName}</div>
      </div>
      <div class="study-ov-progress">
        <span style="color:var(--cyan);font-weight:800;font-size:20px;">${studyP.done}</span>
        <span style="color:var(--text-muted);font-size:14px;">/${studyP.total}</span>
      </div>
    </div>
    <div class="study-ov-subjects">
      ${routine.studies.map((s, i) => {
        const done = state.studyProgress[key]?.[i];
        const logged = state.studyTimeLog?.[s.subject] || 0; // minutes
        const goals = getSubjectGoals(s.subject);
        const pct = goals.weeklyMin > 0 ? Math.min(100, logged / goals.weeklyMin * 100) : 0;
        return `
          <div class="study-ov-item ${done ? 'done' : ''}" onclick="openStudyPanel(${JSON.stringify(s).replace(/"/g,'&quot;')})">
            <div class="study-ov-icon" style="background:${s.color}22;color:${s.color}">${icon(s.iconKey, 18)}</div>
            <div class="study-ov-info">
              <div class="study-ov-name">${s.subject}</div>
              <div class="study-ov-meta">Hoje: ${fmtMin(goals.dailyMin)} &middot; Semana: ${fmtMin(goals.weeklyMin)} &middot; Registrado: ${fmtMin(logged)}</div>
              <div class="study-ov-bar-wrap"><div class="study-ov-bar-fill" style="width:${pct}%;background:${s.color}"></div></div>
            </div>
            <div class="study-ov-play">${icon('play', 14)}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  document.getElementById('study-overview-today').innerHTML = todayHtml;

  // All subjects (deduplicated across week)
  const allSubjects = {};
  Object.values(WEEKLY_ROUTINE).forEach(r => {
    r.studies.forEach(s => { allSubjects[s.subject] = s; });
  });

  document.getElementById('study-subject-grid').innerHTML = Object.values(allSubjects).map(s => {
    const logged = state.studyTimeLog?.[s.subject] || 0; // minutes
    const goals = getSubjectGoals(s.subject);
    const pct = goals.monthlyMin > 0 ? Math.min(100, logged / goals.monthlyMin * 100) : 0;
    const remaining = Math.max(0, goals.monthlyMin - logged);
    return `
      <div class="study-card-big" onclick="openStudyPanel(${JSON.stringify(s).replace(/"/g,'&quot;')})">
        <div class="scb-top">
          <div class="scb-icon" style="background:${s.color}22;color:${s.color}">${icon(s.iconKey, 22)}</div>
          <div class="scb-info">
            <div class="scb-name">${s.subject}</div>
            <div class="scb-meta">${fmtMin(logged)} registrado de ${fmtMin(goals.monthlyMin)} (meta mensal)</div>
          </div>
          <div class="scb-play">${icon('play', 16)}</div>
        </div>
        <div class="scb-goal-chips">
          <span class="scb-chip">${icon('sun', 10)} Hoje: ${fmtMin(goals.dailyMin)}</span>
          <span class="scb-chip">${icon('calendar', 10)} Semana: ${fmtMin(goals.weeklyMin)}</span>
          <span class="scb-chip">${icon('timer', 10)} Mês: ${fmtMin(goals.monthlyMin)}</span>
        </div>
        <div class="scb-bar-wrap"><div class="scb-bar-fill" style="width:${pct}%;background:${s.color}"></div></div>
        <div class="scb-remaining">${icon('hourglass', 11)} Faltam ${fmtMin(remaining)} para a meta mensal</div>
      </div>
    `;
  }).join('');
}

// =============================================
//   STUDY PANEL
// =============================================

function openStudyPanel(subjectObj) {
  // subjectObj may come from HTML as &quot; encoded → decode
  let s = subjectObj;
  if (typeof s === 'string') {
    try { s = JSON.parse(s.replace(/&quot;/g, '"')); } catch(e) { return; }
  }
  state.studySubject = s;
  resetStudyTimer();

  document.getElementById('sp-title').textContent = s.subject;
  document.getElementById('sp-sub').textContent = `Sessão hoje: ${s.duration}`;

  // Populate subjects list
  const todayNum = new Date().getDay();
  const routine = WEEKLY_ROUTINE[todayNum];
  document.getElementById('sp-subject-list').innerHTML = routine.studies.map(sub => `
    <div class="sp-subject-item ${sub.subject === s.subject ? 'active' : ''}"
         onclick="switchStudySubject(${JSON.stringify(sub).replace(/"/g,'&quot;')})"
         style="border-color:${sub.subject === s.subject ? sub.color : 'var(--border)'}">
      <span style="color:${sub.color}">${icon(sub.iconKey, 14)}</span>
      <span>${sub.subject}</span>
      <span style="color:var(--text-muted);font-size:11px;">${sub.duration}</span>
    </div>
  `).join('');

  renderGoalProgress(s);
  document.getElementById('study-panel').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function switchStudySubject(subjectObj) {
  let s = subjectObj;
  if (typeof s === 'string') {
    try { s = JSON.parse(s.replace(/&quot;/g, '"')); } catch(e) { return; }
  }
  resetStudyTimer();
  state.studySubject = s;
  document.getElementById('sp-title').textContent = s.subject;
  document.getElementById('sp-sub').textContent = `Sessão hoje: ${s.duration}`;
  document.querySelectorAll('.sp-subject-item').forEach((el, i) => {
    const match = el.querySelector('span:nth-child(2)')?.textContent === s.subject;
    el.classList.toggle('active', match);
    if (match) el.style.borderColor = s.color;
    else el.style.borderColor = 'var(--border)';
  });
  renderGoalProgress(s);
}

function closeStudyPanel() {
  // Save any continuous time
  if (state.studyTimerRunning) stopStudyTimer();
  document.getElementById('study-panel').classList.remove('show');
  document.body.style.overflow = '';
  if (state.currentView === 'study') renderStudyView();
}

function setStudyMode(mode) {
  state.studyMode = mode;
  resetStudyTimer();
  document.getElementById('sp-mode-continuous').classList.toggle('active', mode === 'continuous');
  document.getElementById('sp-mode-pomodoro').classList.toggle('active', mode === 'pomodoro');
  const cfg = document.getElementById('sp-pomodoro-config');
  if (cfg) cfg.style.display = mode === 'pomodoro' ? 'block' : 'none';
}

function adjustPomodoro(field, delta) {
  if (field === 'focus') {
    state.pomodoroFocusMin = Math.max(5, state.pomodoroFocusMin + delta);
    document.getElementById('sp-focus-val').textContent = state.pomodoroFocusMin;
  } else {
    state.pomodoroBreakMin = Math.max(1, state.pomodoroBreakMin + delta);
    document.getElementById('sp-break-val').textContent = state.pomodoroBreakMin;
  }
  if (!state.studyTimerRunning) resetStudyTimer();
}

function toggleStudyTimer() {
  if (state.studyTimerRunning) {
    stopStudyTimer();
  } else {
    startStudyTimer();
  }
}

function startStudyTimer() {
  state.studyTimerRunning = true;
  document.getElementById('sp-btn-start').textContent = 'Pausar';
  document.getElementById('sp-btn-start').classList.add('running');

  // Set initial seconds if 0
  if (state.studyTimerSeconds <= 0) {
    if (state.studyMode === 'pomodoro') {
      state.pomodoroPhase = 'focus';
      state.studyTimerSeconds = state.pomodoroFocusMin * 60;
    } else {
      state.studyTimerSeconds = 0; // count up in continuous
    }
  }

  state.studyTimer = setInterval(() => {
    if (state.studyMode === 'continuous') {
      state.studyTimerSeconds++;
      state.studyTotalSeconds++;
      updateStudyTimerDisplay();
    } else {
      // Pomodoro: count down
      if (state.studyTimerSeconds > 0) {
        state.studyTimerSeconds--;
        if (state.pomodoroPhase === 'focus') state.studyTotalSeconds++;
        updateStudyTimerDisplay();
      } else {
        // Phase complete
        clearInterval(state.studyTimer);
        state.studyTimerRunning = false;
        if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
        if (state.pomodoroPhase === 'focus') {
          state.pomodoroCount++;
          logStudyTime();
          state.pomodoroPhase = 'break';
          state.studyTimerSeconds = state.pomodoroBreakMin * 60;
          document.getElementById('sp-phase-label').textContent = 'Pausa ☕';
          document.getElementById('sp-btn-start').textContent = 'Iniciar Pausa';
          document.getElementById('sp-btn-start').classList.remove('running');
          renderGoalProgress(state.studySubject);
        } else {
          state.pomodoroPhase = 'focus';
          state.studyTimerSeconds = state.pomodoroFocusMin * 60;
          document.getElementById('sp-phase-label').textContent = 'Foco 🎯';
          document.getElementById('sp-btn-start').textContent = 'Iniciar Foco';
          document.getElementById('sp-btn-start').classList.remove('running');
        }
        updateStudyTimerDisplay();
      }
    }
  }, 1000);
}

function stopStudyTimer() {
  clearInterval(state.studyTimer);
  state.studyTimerRunning = false;
  document.getElementById('sp-btn-start').textContent = 'Continuar';
  document.getElementById('sp-btn-start').classList.remove('running');
  if (state.studyMode === 'continuous') logStudyTime();
}

function resetStudyTimer() {
  stopStudyTimer();
  state.studyTimerSeconds = state.studyMode === 'pomodoro' ? state.pomodoroFocusMin * 60 : 0;
  state.studyTotalSeconds = 0;
  state.pomodoroPhase = 'focus';
  state.pomodoroCount = 0;
  document.getElementById('sp-btn-start').textContent = 'Iniciar';
  document.getElementById('sp-btn-start').classList.remove('running');
  const pl = document.getElementById('sp-phase-label');
  if (pl) pl.textContent = state.studyMode === 'pomodoro' ? 'Foco 🎯' : 'Pronto';
  updateStudyTimerDisplay();
}

function logStudyTime() {
  if (!state.studySubject || state.studyTotalSeconds < 10) return;
  const subj = state.studySubject.subject;
  if (!state.studyTimeLog) state.studyTimeLog = {};
  state.studyTimeLog[subj] = (state.studyTimeLog[subj] || 0) + Math.floor(state.studyTotalSeconds / 60);
  state.studyTotalSeconds = 0;
  saveState();
  renderGoalProgress(state.studySubject);
}

function updateStudyTimerDisplay() {
  const s = state.studyTimerSeconds;
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  const display = `${m}:${sec}`;
  const inner = document.getElementById('sp-timer-inner');
  if (inner) inner.textContent = display;

  // Circular progress
  const fill = document.getElementById('sp-circle-fill');
  if (fill) {
    const totalSec = state.studyMode === 'pomodoro'
      ? (state.pomodoroPhase === 'focus' ? state.pomodoroFocusMin : state.pomodoroBreakMin) * 60
      : Math.max(state.studyTimerSeconds, 1);
    const pct = state.studyMode === 'pomodoro'
      ? 1 - (s / totalSec)
      : 1; // continuous: full ring
    const circ = 2 * Math.PI * 50;
    fill.setAttribute('stroke-dashoffset', circ * (1 - pct));
    fill.setAttribute('stroke', state.pomodoroPhase === 'break' ? '#22c55e' : 'var(--cyan)');
  }

  // Phase label for pomodoro
  const pl = document.getElementById('sp-phase-label');
  if (pl && state.studyMode === 'pomodoro') {
    pl.textContent = state.pomodoroPhase === 'focus'
      ? `Foco 🎯 · #${state.pomodoroCount + 1}`
      : 'Pausa ☕';
  }
}

function renderGoalProgress(s) {
  if (!s) return;
  const logged = state.studyTimeLog?.[s.subject] || 0; // in minutes
  const sessionMin = Math.floor(state.studyTotalSeconds / 60);
  const total = logged + sessionMin; // total minutes logged + this session

  const goals = getSubjectGoals(s.subject);

  // Use weekly goal as the target for the panel progress bar
  const target = goals.weeklyMin || 1;
  const pct = Math.min(100, total / target * 100);
  const remaining = Math.max(0, target - total);

  function fmtTime(min) {
    if (min <= 0) return '0min';
    const h = Math.floor(min / 60), m = min % 60;
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h${m}min`;
  }

  const goalInfo = document.getElementById('sp-goal-info');
  const goalBar = document.getElementById('sp-goal-bar-fill');
  const goalRem = document.getElementById('sp-goal-remaining');

  if (goalInfo) goalInfo.innerHTML = `
    <div class="sp-goal-stats">
      <div class="sp-goal-stat">
        <span class="sp-goal-stat-label">${icon('sun', 11)} Hoje</span>
        <span class="sp-goal-stat-val">${fmtTime(goals.dailyMin)}</span>
      </div>
      <div class="sp-goal-stat">
        <span class="sp-goal-stat-label">${icon('calendar', 11)} Semana</span>
        <span class="sp-goal-stat-val">${fmtTime(goals.weeklyMin)}</span>
      </div>
      <div class="sp-goal-stat">
        <span class="sp-goal-stat-label">${icon('timer', 11)} Mês</span>
        <span class="sp-goal-stat-val">${fmtTime(goals.monthlyMin)}</span>
      </div>
      <div class="sp-goal-stat sp-goal-stat-done">
        <span class="sp-goal-stat-label">${icon('check', 11)} Registrado</span>
        <span class="sp-goal-stat-val" style="color:var(--cyan)">${fmtTime(total)}</span>
      </div>
    </div>
  `;
  if (goalBar) goalBar.style.width = `${pct}%`;
  if (goalRem) {
    if (remaining <= 0) {
      goalRem.innerHTML = `${icon('trophy', 14)} <span style="color:var(--green)">Meta semanal atingida! 🎉</span>`;
    } else {
      goalRem.innerHTML = `${icon('hourglass', 12)} Faltam <strong>${fmtTime(remaining)}</strong> para a meta semanal`;
    }
  }
}

// =============================================
//   HEALTH TRACKING (Água, Frutas, Remédios)
// =============================================

// B12 only on Sunday (0) and Wednesday (3)
const HEALTH_MEDICINES = [
  { key: 'vellana',   label: 'Vellana',      alwaysShow: true },
  { key: 'creatina',  label: 'Creatina',     alwaysShow: true },
  { key: 'vitaminico',label: 'Vitamínico',   alwaysShow: true },
  { key: 'whey',      label: 'Whey Protein', alwaysShow: true },
  { key: 'omega3',    label: 'Ômega-3',      alwaysShow: true },
  { key: 'b12',       label: 'B12',          alwaysShow: false, days: [0, 3] },
];

const FRUITS_LIST = [
  { key: 'banana',   label: 'Banana',   iconKey: 'fruitBanana',   color: '#f59e0b' },
  { key: 'goiaba',   label: 'Goiaba',   iconKey: 'fruitGoiaba',   color: '#f97316' },
  { key: 'maca',     label: 'Maçã',     iconKey: 'fruitMaca',     color: '#ef4444' },
  { key: 'melancia', label: 'Melancia', iconKey: 'fruitMelancia', color: '#22c55e' },
  { key: 'laranja',  label: 'Laranja',  iconKey: 'fruitLaranja',  color: '#fb923c' },
  { key: 'abacate',  label: 'Abacate',  iconKey: 'fruitAbacate',  color: '#84cc16' },
  { key: 'uva',      label: 'Uva',      iconKey: 'fruitUva',      color: '#a855f7' },
  { key: 'mamao',    label: 'Mamão',    iconKey: 'fruitMamao',    color: '#f97316' },
];

function getTodayHealthKey() {
  const d = new Date();
  return `health_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
}

function loadTodayHealth() {
  try {
    const raw = localStorage.getItem(getTodayHealthKey());
    return raw ? JSON.parse(raw) : { water400: 0, water500: 0, fruits: {}, meds: {} };
  } catch(e) {
    return { water400: 0, water500: 0, fruits: {}, meds: {} };
  }
}

function saveTodayHealth(data) {
  try { localStorage.setItem(getTodayHealthKey(), JSON.stringify(data)); } catch(e) {}
}

function renderHealth() {
  const h = loadTodayHealth();
  const totalMl = h.water400 * 400 + h.water500 * 500;
  const waterGoalMl = 2000;
  const waterPct = Math.min(100, totalMl / waterGoalMl * 100);
  const todayDay = new Date().getDay();

  const fruitCount = Object.values(h.fruits).reduce((a, b) => a + b, 0);

  // Filter medicines: always show alwaysShow, show day-specific ones only on their days
  const todayMeds = HEALTH_MEDICINES.filter(m => m.alwaysShow || (m.days && m.days.includes(todayDay)));
  const medsDone = todayMeds.filter(m => h.meds[m.key]).length;

  document.getElementById('home-health').innerHTML = `
    <!-- Water -->
    <div class="health-card">
      <div class="health-card-title">${icon('droplets', 16)} Hidratação</div>
      <div class="water-total">${totalMl}ml <span>/ ${waterGoalMl}ml</span></div>
      <div class="water-bar-wrap"><div class="water-bar-fill" style="width:${waterPct}%;"></div></div>
      <div class="water-btns">
        <div class="water-group">
          <button class="water-btn" onclick="addWater(400)">
            ${icon('droplets', 14)} +400ml
            <span class="water-count">${h.water400}×</span>
          </button>
          ${h.water400 > 0 ? `<button class="water-btn water-btn-minus" onclick="removeWater(400)" title="Remover 1 copo 400ml">−400ml</button>` : ''}
        </div>
        <div class="water-group">
          <button class="water-btn water-btn-lg" onclick="addWater(500)">
            ${icon('droplets', 16)} +500ml
            <span class="water-count">${h.water500}×</span>
          </button>
          ${h.water500 > 0 ? `<button class="water-btn water-btn-minus water-btn-minus-lg" onclick="removeWater(500)" title="Remover 1 garrafa 500ml">−500ml</button>` : ''}
        </div>
      </div>
    </div>

    <!-- Fruits -->
    <div class="health-card">
      <div class="health-card-title">${icon('leaf', 16)} Frutas <span class="health-count-badge">${fruitCount}</span></div>
      <div class="fruits-grid">
        ${FRUITS_LIST.map(f => {
          const count = h.fruits[f.key] || 0;
          return `
            <button class="fruit-btn ${count > 0 ? 'active' : ''}" onclick="addFruit('${f.key}')" style="--fruit-color:${f.color}">
              <span class="fruit-icon" style="color:${count > 0 ? f.color : 'var(--text-muted)'}">${icon(f.iconKey, 22)}</span>
              <span class="fruit-label">${f.label}</span>
              ${count > 0 ? `<span class="fruit-badge" onclick="event.stopPropagation(); removeFruit('${f.key}')" title="Remover 1">${count}</span>` : ''}
            </button>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Medicines / Vitamins -->
    <div class="health-card">
      <div class="health-card-title">${icon('pill', 16)} Remédios & Vitaminas <span class="health-count-badge">${medsDone}/${todayMeds.length}</span></div>
      ${todayDay === 0 || todayDay === 3 ? `<div style="font-size:11px;color:var(--cyan);margin-bottom:10px;">${icon('info',11)} B12 incluído hoje (Dom/Qua)</div>` : ''}
      <div class="meds-list">
        ${todayMeds.map(m => {
          const done = h.meds[m.key] || false;
          return `
            <div class="med-item ${done ? 'done' : ''}" onclick="toggleMed('${m.key}')">
              <div class="med-check ${done ? 'checked' : ''}">${done ? icon('check', 12) : ''}</div>
              <span class="med-label">${m.label}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Export / Import -->
    <div class="export-import-row">
      <button class="export-btn" onclick="exportData()">
        ${icon('download', 16)} Exportar JSON
      </button>
      <button class="export-btn import-btn" onclick="triggerImport()">
        ${icon('upload', 16)} Importar JSON
      </button>
    </div>
  `;
}

function addWater(ml) {
  const h = loadTodayHealth();
  if (ml === 400) h.water400++;
  else h.water500++;
  saveTodayHealth(h);
  renderHealth();
}

function removeWater(ml) {
  const h = loadTodayHealth();
  if (ml === 400 && h.water400 > 0) h.water400--;
  else if (ml === 500 && h.water500 > 0) h.water500--;
  saveTodayHealth(h);
  renderHealth();
}

function undoWater() {
  const h = loadTodayHealth();
  if (h.water500 > 0) h.water500--;
  else if (h.water400 > 0) h.water400--;
  saveTodayHealth(h);
  renderHealth();
}

function addFruit(key) {
  const h = loadTodayHealth();
  h.fruits[key] = (h.fruits[key] || 0) + 1;
  saveTodayHealth(h);
  renderHealth();
}

function removeFruit(key) {
  const h = loadTodayHealth();
  if (h.fruits[key] > 1) h.fruits[key]--;
  else delete h.fruits[key];
  saveTodayHealth(h);
  renderHealth();
}

function toggleMed(key) {
  const h = loadTodayHealth();
  h.meds[key] = !h.meds[key];
  saveTodayHealth(h);
  renderHealth();
}

// =============================================
//   EXPORT / IMPORT DATA
// =============================================

function exportData() {
  const exportObj = {
    exportedAt: new Date().toISOString(),
    version: '2.0',
    studyProgress: state.studyProgress,
    workoutProgress: state.workoutProgress,
    studyTimeLog: state.studyTimeLog,
    healthToday: loadTodayHealth(),
    healthHistory: (() => {
      const hist = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('health_')) {
          try { hist[k] = JSON.parse(localStorage.getItem(k)); } catch(e) {}
        }
      }
      return hist;
    })(),
  };

  const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rotina_backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function triggerImport() {
  let input = document.getElementById('_import-file-input');
  if (!input) {
    input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.id = '_import-file-input';
    input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', e => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target.result);
          importData(data);
        } catch(err) {
          showToast('Arquivo inválido — JSON malformado', 'error');
        }
        input.value = ''; // reset so same file can be imported again
      };
      reader.readAsText(file);
    });
  }
  input.click();
}

function importData(data) {
  let imported = 0;

  if (data.studyProgress) {
    state.studyProgress = data.studyProgress;
    localStorage.setItem('rotina_study', JSON.stringify(state.studyProgress));
    imported++;
  }
  if (data.workoutProgress) {
    state.workoutProgress = data.workoutProgress;
    localStorage.setItem('rotina_workout', JSON.stringify(state.workoutProgress));
    imported++;
  }
  if (data.studyTimeLog) {
    state.studyTimeLog = data.studyTimeLog;
    localStorage.setItem('rotina_studytime', JSON.stringify(state.studyTimeLog));
    imported++;
  }
  // Restore all health days
  if (data.healthHistory) {
    Object.entries(data.healthHistory).forEach(([k, v]) => {
      try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) {}
    });
    imported++;
  } else if (data.healthToday) {
    saveTodayHealth(data.healthToday);
    imported++;
  }

  if (imported > 0) {
    showToast(`✅ Dados importados com sucesso!`, 'success');
    // Refresh current view
    navigateTo(state.currentView);
  } else {
    showToast('Nenhum dado reconhecido no arquivo', 'error');
  }
}

function showToast(msg, type = 'success') {
  let toast = document.getElementById('_app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = '_app-toast';
    toast.style.cssText = [
      'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);',
      'padding:12px 20px;border-radius:12px;font-size:13px;font-weight:700;',
      'font-family:Inter,sans-serif;z-index:9999;transition:opacity 0.3s;',
      'box-shadow:0 4px 20px rgba(0,0,0,0.4);pointer-events:none;',
    ].join('');
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.background = type === 'error' ? '#ef4444' : '#22c55e';
  toast.style.color = '#fff';
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

// =============================================
//   DAY ROUTINE EDIT SYSTEM
// =============================================

/**
 * dayOverrides is stored in localStorage as 'rotina_overrides'
 * Structure: { dayNum: { studies: [...], workout: {...}, notes: '', extras: [...] } }
 *
 * generalOverrides is stored as 'rotina_general_overrides'
 * Structure: { dayNum: { studies: [...], workout: {...}, notes: '' } }
 */

const _deState = {
  dayNum: null,
  scope: 'day',       // 'day' | 'general'
  activeTab: 'studies',
  studies: [],        // array of {subject, duration, durationMin, color, iconKey}
  sheetId: null,
  workoutFocus: '',
  workoutMin: 0,
  extras: [],         // active extra activities
  notes: '',
};

// ---- Override storage ----

function loadDayOverrides() {
  try {
    const raw = localStorage.getItem('rotina_overrides');
    return raw ? JSON.parse(raw) : {};
  } catch(e) { return {}; }
}

function saveDayOverrides(data) {
  try { localStorage.setItem('rotina_overrides', JSON.stringify(data)); } catch(e) {}
}

function loadGeneralOverrides() {
  try {
    const raw = localStorage.getItem('rotina_general_overrides');
    return raw ? JSON.parse(raw) : {};
  } catch(e) { return {}; }
}

function saveGeneralOverrides(data) {
  try { localStorage.setItem('rotina_general_overrides', JSON.stringify(data)); } catch(e) {}
}

/**
 * Returns the effective routine for a day, merging overrides on top of defaults.
 */
function getEffectiveRoutine(dayNum) {
  const base = WEEKLY_ROUTINE[dayNum];
  const genOverrides = loadGeneralOverrides();
  const dayOverrides = loadDayOverrides();

  let effective = { ...base,
    studies: [...base.studies],
    workout: { ...base.workout }
  };

  // Apply general override first
  if (genOverrides[dayNum]) {
    const g = genOverrides[dayNum];
    if (g.studies) effective.studies = g.studies;
    if (g.workout?.sheetId) effective.workout.sheetId = g.workout.sheetId;
    if (g.workout?.focus) effective.workout.focus = g.workout.focus;
    if (g.workout?.estimatedMin) effective.workout.estimatedMin = g.workout.estimatedMin;
    if (g.notes) effective.notes = g.notes;
  }

  // Day-specific override on top (higher priority)
  if (dayOverrides[dayNum]) {
    const d = dayOverrides[dayNum];
    if (d.studies) effective.studies = d.studies;
    if (d.workout?.sheetId) effective.workout.sheetId = d.workout.sheetId;
    if (d.workout?.focus) effective.workout.focus = d.workout.focus;
    if (d.workout?.estimatedMin) effective.workout.estimatedMin = d.workout.estimatedMin;
    if (d.extras) effective.extras = d.extras;
    if (d.notes) effective.notes = d.notes;
  }

  return effective;
}

function hasDayOverride(dayNum) {
  const overrides = loadDayOverrides();
  return !!overrides[dayNum];
}

function hasGeneralOverride(dayNum) {
  const overrides = loadGeneralOverrides();
  return !!overrides[dayNum];
}

// ---- Open / Close ----

function openDayEditModal(dayNum) {
  _deState.dayNum = dayNum;
  _deState.scope = 'day';
  _deState.activeTab = 'studies';

  const routine = WEEKLY_ROUTINE[dayNum];
  const effective = getEffectiveRoutine(dayNum);

  // Load existing override or current effective
  const dayOverrides = loadDayOverrides();
  const existing = dayOverrides[dayNum] || {};

  _deState.studies = JSON.parse(JSON.stringify(effective.studies));
  _deState.sheetId = effective.workout.sheetId;
  _deState.workoutFocus = effective.workout.focus || '';
  _deState.workoutMin = effective.workout.estimatedMin || 0;
  _deState.extras = existing.extras || [];
  _deState.notes = existing.notes || '';

  // Update header
  document.getElementById('day-edit-title').textContent = 'Editar Rotina';
  document.getElementById('day-edit-subtitle').textContent = routine.dayName;

  setEditScope('day');
  setEditTab('studies');
  _renderDeStudies();
  _renderDeSheetPicker();
  _renderDeExtras();
  document.getElementById('de-workout-focus').value = _deState.workoutFocus;
  document.getElementById('de-workout-min').value = _deState.workoutMin;
  document.getElementById('de-notes-input').value = _deState.notes;

  document.getElementById('day-edit-modal').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeDayEditModal() {
  document.getElementById('day-edit-modal').classList.remove('show');
  document.body.style.overflow = '';
}

// ---- Scope & Tab controls ----

function setEditScope(scope) {
  _deState.scope = scope;
  document.getElementById('de-scope-day').classList.toggle('active', scope === 'day');
  document.getElementById('de-scope-general').classList.toggle('active', scope === 'general');
  const hint = document.getElementById('de-scope-hint');
  if (hint) {
    hint.textContent = scope === 'day'
      ? 'Alterações aplicadas apenas a este dia específico'
      : 'Alterações aplicadas à rotina padrão deste dia da semana (todos os ' + WEEKLY_ROUTINE[_deState.dayNum]?.dayName + 's futuros)';
  }
  // In general scope, load existing general override if any
  if (scope === 'general') {
    const genOverrides = loadGeneralOverrides();
    const existing = genOverrides[_deState.dayNum] || {};
    const routine = WEEKLY_ROUTINE[_deState.dayNum];
    if (existing.studies) _deState.studies = JSON.parse(JSON.stringify(existing.studies));
    else _deState.studies = JSON.parse(JSON.stringify(routine.studies));
    if (existing.workout?.sheetId) _deState.sheetId = existing.workout.sheetId;
    else _deState.sheetId = routine.workout.sheetId;
    if (existing.workout?.focus) _deState.workoutFocus = existing.workout.focus;
    else _deState.workoutFocus = routine.workout.focus || '';
    if (existing.workout?.estimatedMin) _deState.workoutMin = existing.workout.estimatedMin;
    else _deState.workoutMin = routine.workout.estimatedMin || 0;
    _deState.notes = existing.notes || '';
    _deState.extras = [];
    document.getElementById('de-extras-row') && (_deState.extras = []);
    _renderDeStudies();
    _renderDeSheetPicker();
    _renderDeExtras();
    document.getElementById('de-workout-focus').value = _deState.workoutFocus;
    document.getElementById('de-workout-min').value = _deState.workoutMin;
    document.getElementById('de-notes-input').value = _deState.notes;
  } else {
    // Reload day override
    const dayOverrides = loadDayOverrides();
    const existing = dayOverrides[_deState.dayNum] || {};
    const effective = getEffectiveRoutine(_deState.dayNum);
    _deState.studies = JSON.parse(JSON.stringify(effective.studies));
    _deState.sheetId = effective.workout.sheetId;
    _deState.workoutFocus = effective.workout.focus || '';
    _deState.workoutMin = effective.workout.estimatedMin || 0;
    _deState.extras = existing.extras || [];
    _deState.notes = existing.notes || '';
    _renderDeStudies();
    _renderDeSheetPicker();
    _renderDeExtras();
    document.getElementById('de-workout-focus').value = _deState.workoutFocus;
    document.getElementById('de-workout-min').value = _deState.workoutMin;
    document.getElementById('de-notes-input').value = _deState.notes;
  }
}

function setEditTab(tab) {
  _deState.activeTab = tab;
  ['studies', 'workout', 'notes'].forEach(t => {
    document.getElementById(`de-tab-${t}`)?.classList.toggle('active', t === tab);
    document.getElementById(`de-content-${t}`)?.classList.toggle('active', t === tab);
  });
}

// ---- Studies rendering ----

const DE_SUBJECT_COLORS = ['#00d4ff','#7c3aed','#f59e0b','#22c55e','#ef4444','#06b6d4','#a855f7','#f97316','#8b5cf6','#ec4899'];
const DE_SUBJECT_ICONS = ['book','brain','ruler','pen','monitor','globe','database','gear','lock','cpu','building','barChart','ai','scale'];

function _renderDeStudies() {
  const list = document.getElementById('de-studies-list');
  if (!list) return;
  if (_deState.studies.length === 0) {
    list.innerHTML = `<div style="text-align:center;color:var(--text-muted);font-size:13px;padding:20px;">Nenhuma matéria. Adicione uma com o botão acima.</div>`;
    return;
  }
  list.innerHTML = _deState.studies.map((s, i) => `
    <div class="de-study-item">
      <div class="de-study-color" style="background:${s.color || DE_SUBJECT_COLORS[i % DE_SUBJECT_COLORS.length]}"></div>
      <div class="de-study-fields">
        <div class="de-study-name-row">
          <input class="de-study-name-inp" type="text" value="${_escHtml(s.subject)}"
                 oninput="updateStudyField(${i}, 'subject', this.value)"
                 placeholder="Matéria..." />
          <input class="de-study-dur-inp" type="text" value="${_escHtml(s.duration || '')}"
                 oninput="updateStudyField(${i}, 'duration', this.value)"
                 placeholder="1h30" />
        </div>
      </div>
      <button class="de-study-remove" onclick="removeStudyItem(${i})" title="Remover">×</button>
    </div>
  `).join('');
}

function _escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function updateStudyField(idx, field, value) {
  if (!_deState.studies[idx]) return;
  _deState.studies[idx][field] = value;
  if (field === 'duration') {
    // Parse duration to minutes
    const parsed = _parseDurationToMin(value);
    if (parsed > 0) _deState.studies[idx].durationMin = parsed;
  }
}

function _parseDurationToMin(str) {
  if (!str) return 0;
  str = str.trim().toLowerCase();
  // Match patterns like "1h30", "1h30min", "2h", "45min", "45"
  const hMatch = str.match(/(\d+)\s*h(?:oras?)?[\s,]*(\d+)?\s*(?:min)?/);
  if (hMatch) {
    const h = parseInt(hMatch[1]) || 0;
    const m = parseInt(hMatch[2]) || 0;
    return h * 60 + m;
  }
  const mMatch = str.match(/^(\d+)\s*(?:min)?$/);
  if (mMatch) return parseInt(mMatch[1]) || 0;
  return 0;
}

function addStudyItem() {
  const idx = _deState.studies.length;
  _deState.studies.push({
    subject: 'Nova Matéria',
    duration: '1h',
    durationMin: 60,
    iconKey: DE_SUBJECT_ICONS[idx % DE_SUBJECT_ICONS.length],
    color: DE_SUBJECT_COLORS[idx % DE_SUBJECT_COLORS.length],
    goalHours: 10,
  });
  _renderDeStudies();
  // Focus the new input
  setTimeout(() => {
    const inputs = document.querySelectorAll('.de-study-name-inp');
    if (inputs.length > 0) inputs[inputs.length - 1].focus();
  }, 50);
}

function removeStudyItem(idx) {
  _deState.studies.splice(idx, 1);
  _renderDeStudies();
}

// ---- Workout rendering ----

function _renderDeSheetPicker() {
  const picker = document.getElementById('de-sheet-picker');
  if (!picker) return;
  const allSheets = typeof getAllSheets === 'function' ? getAllSheets() : WORKOUT_SHEETS;
  picker.innerHTML = Object.values(allSheets).map(s => `
    <button class="de-sheet-option ${_deState.sheetId === s.id ? 'active' : ''}"
            style="color:${_deState.sheetId === s.id ? s.color : 'var(--text-secondary)'}"
            onclick="selectDeSheet('${s.id}')">
      <div class="de-sheet-dot" style="background:${s.color}"></div>
      <div>
        <div style="font-weight:700">${s.name}</div>
        <div style="font-size:10px;color:var(--text-muted);font-weight:500">${s.description || s.subtitle || ''}</div>
      </div>
    </button>
  `).join('');
}

function selectDeSheet(sheetId) {
  _deState.sheetId = sheetId;
  _renderDeSheetPicker();
}

// ---- Extras ----

function _renderDeExtras() {
  const extras = ['walk','bike','swim','volley','rest'];
  extras.forEach(key => {
    document.getElementById(`de-extra-${key}`)?.classList.toggle('active', _deState.extras.includes(key));
  });
}

function toggleExtra(key) {
  const idx = _deState.extras.indexOf(key);
  if (idx >= 0) _deState.extras.splice(idx, 1);
  else _deState.extras.push(key);
  _renderDeExtras();
}

// ---- Save ----

function saveDayEdit() {
  // Sync live input values
  const focusEl = document.getElementById('de-workout-focus');
  const minEl = document.getElementById('de-workout-min');
  const notesEl = document.getElementById('de-notes-input');
  if (focusEl) _deState.workoutFocus = focusEl.value.trim();
  if (minEl) _deState.workoutMin = parseInt(minEl.value) || 0;
  if (notesEl) _deState.notes = notesEl.value;

  const overrideData = {
    studies: _deState.studies,
    workout: {
      sheetId: _deState.sheetId,
      focus: _deState.workoutFocus,
      estimatedMin: _deState.workoutMin,
    },
    notes: _deState.notes,
  };

  if (_deState.scope === 'day') {
    const overrides = loadDayOverrides();
    if (_deState.extras.length > 0) overrideData.extras = _deState.extras;
    overrides[_deState.dayNum] = overrideData;
    saveDayOverrides(overrides);
    showToast(`✅ Rotina de ${WEEKLY_ROUTINE[_deState.dayNum].dayName} personalizada!`);
  } else {
    const genOverrides = loadGeneralOverrides();
    genOverrides[_deState.dayNum] = overrideData;
    saveGeneralOverrides(genOverrides);
    showToast(`✅ Rotina geral de ${WEEKLY_ROUTINE[_deState.dayNum].dayName} atualizada!`);
  }

  closeDayEditModal();
  syncToServer(); // sync edits to database
  
  // Refresh visible view
  if (state.currentView === 'week') renderWeek();
  else if (state.currentView === 'home') renderHome();
}

function resetDayOverride() {
  if (!confirm(`Restaurar a rotina padrão de ${WEEKLY_ROUTINE[_deState.dayNum]?.dayName}?`)) return;

  if (_deState.scope === 'day') {
    const overrides = loadDayOverrides();
    delete overrides[_deState.dayNum];
    saveDayOverrides(overrides);
  } else {
    const genOverrides = loadGeneralOverrides();
    delete genOverrides[_deState.dayNum];
    saveGeneralOverrides(genOverrides);
  }

  showToast('🔄 Rotina restaurada ao padrão!', 'success');
  closeDayEditModal();
  syncToServer(); // sync deletion to database
  
  if (state.currentView === 'week') renderWeek();
  else if (state.currentView === 'home') renderHome();
}

// ---- Close on overlay click ----
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('day-edit-modal')?.addEventListener('click', function(e) {
    if (e.target === this) closeDayEditModal();
  });
  document.getElementById('sheet-manager-modal')?.addEventListener('click', function(e) {
    if (e.target === this) closeSheetManager();
  });
  document.getElementById('sheet-editor-modal')?.addEventListener('click', function(e) {
    if (e.target === this) closeSheetEditor();
  });
});

// =============================================
//   SHEET MANAGER & EDITOR SYSTEM
// =============================================

const SE_COLORS = [
  '#00d4ff','#7c3aed','#f59e0b','#22c55e','#ef4444',
  '#06b6d4','#a855f7','#f97316','#ec4899','#8b5cf6',
  '#14b8a6','#6366f1','#84cc16','#fb923c','#e879f9',
];

const SE_INTENSITY_MAP = {
  high:   { label: 'Intenso',   icon: 'flame'    },
  medium: { label: 'Moderado',  icon: 'dumbbell' },
  low:    { label: 'Leve',      icon: 'leaf'     },
};

const SE_BLOCK_TYPES = ['circuit','normal','superset','bisset','triset','giantset','warmup','finisher','stretch'];

// Internal editor state (prefix se_ to avoid conflicts)
const _seState = {
  editingId: null,    // null = new sheet
  color: SE_COLORS[0],
  blocks: [],         // [{type, exercises:[{name,sets,reps,rest}]}]
};

// ---- Custom sheet persistence ----

function loadCustomSheets() {
  try {
    const raw = localStorage.getItem('rotina_custom_sheets');
    return raw ? JSON.parse(raw) : {};
  } catch(e) { return {}; }
}

function saveCustomSheets(data) {
  try { localStorage.setItem('rotina_custom_sheets', JSON.stringify(data)); } catch(e) {}
}

/** Returns merged WORKOUT_SHEETS + custom sheets */
function getAllSheets() {
  const custom = loadCustomSheets();
  return { ...WORKOUT_SHEETS, ...custom };
}

// ---- Sheet Manager ----

function openSheetManager() {
  _renderSheetManagerList();
  document.getElementById('sheet-manager-modal').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeSheetManager() {
  document.getElementById('sheet-manager-modal').classList.remove('show');
  document.body.style.overflow = '';
  // Refresh the picker in the day-edit modal
  _renderDeSheetPicker();
}

function _renderSheetManagerList() {
  const list = document.getElementById('sm-sheet-list');
  if (!list) return;
  const all = getAllSheets();
  const custom = loadCustomSheets();

  const cards = Object.values(all).map(s => {
    const isCustom = !!custom[s.id];
    const label = s.id.replace('ficha','F');
    return `
      <div class="sm-sheet-card">
        <div class="sm-sheet-dot" style="background:${s.color}">${label}</div>
        <div class="sm-sheet-info">
          <div class="sm-sheet-name">${s.name}</div>
          <div class="sm-sheet-sub">${s.subtitle || ''} ${s.focus ? '· ' + s.focus : ''}</div>
        </div>
        ${isCustom ? `
          <div class="sm-sheet-actions">
            <button class="sm-action-btn" onclick="openSheetEditor('${s.id}')" title="Editar">✎</button>
            <button class="sm-action-btn del" onclick="deleteCustomSheet('${s.id}')" title="Deletar">✕</button>
          </div>
        ` : `<span class="sm-sheet-builtin">Padrão</span>`}
      </div>
    `;
  }).join('');

  list.innerHTML = cards || '<div style="text-align:center;color:var(--text-muted);padding:20px;font-size:13px;">Nenhuma ficha encontrada.</div>';
}

function deleteCustomSheet(id) {
  const sheets = loadCustomSheets();
  const name = sheets[id]?.name || id;
  if (!confirm(`Deletar a ficha "${name}"?`)) return;
  delete sheets[id];
  saveCustomSheets(sheets);
  deleteSheetFromServer(id); // async background sync
  _renderSheetManagerList();
  showToast(`🗑 Ficha "${name}" deletada.`);
}

// ---- Sheet Editor ----

function openSheetEditor(sheetId) {
  _seState.editingId = sheetId;

  if (sheetId) {
    // Load existing (custom only — built-in sheets can be duplicated/cloned)
    const all = getAllSheets();
    const s = all[sheetId];
    if (!s) return;
    document.getElementById('se-title').textContent = 'Editar Ficha';
    document.getElementById('se-subtitle').textContent = s.name;
    document.getElementById('se-name').value = s.name;
    document.getElementById('se-subtitle-inp').value = s.subtitle || '';
    document.getElementById('se-focus').value = s.focus || '';
    document.getElementById('se-estmin').value = s.estimatedMin || 60;
    document.getElementById('se-intensity').value = s.intensityLevel || 'medium';
    _seState.color = s.color || SE_COLORS[0];
    _seState.blocks = JSON.parse(JSON.stringify(s.blocks || []));
    // Convert built-in block format if needed
    _seState.blocks = _seState.blocks.map(b => ({
      type: b.type || 'normal',
      exercises: (b.exercises || []).map(e => ({
        name: e.name || '',
        sets: e.sets || 3,
        reps: e.reps || '10',
        rest: e.restTime || e.rest || 60,
      })),
    }));
  } else {
    document.getElementById('se-title').textContent = 'Nova Ficha';
    document.getElementById('se-subtitle').textContent = 'Crie sua ficha personalizada';
    document.getElementById('se-name').value = '';
    document.getElementById('se-subtitle-inp').value = '';
    document.getElementById('se-focus').value = '';
    document.getElementById('se-estmin').value = 60;
    document.getElementById('se-intensity').value = 'medium';
    _seState.color = SE_COLORS[Math.floor(Math.random() * SE_COLORS.length)];
    _seState.blocks = [];
  }

  _renderSeColorPicker();
  _renderSeBlocks();
  // Close manager if open, open editor
  document.getElementById('sheet-manager-modal').classList.remove('show');
  document.getElementById('sheet-editor-modal').classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeSheetEditor() {
  document.getElementById('sheet-editor-modal').classList.remove('show');
  document.body.style.overflow = '';
  // Reopen manager
  openSheetManager();
}

// ---- Color picker ----

function _renderSeColorPicker() {
  const el = document.getElementById('se-color-picker');
  if (!el) return;
  el.innerHTML = SE_COLORS.map(c =>
    `<div class="se-color-dot ${c === _seState.color ? 'active' : ''}"
          style="background:${c}" onclick="sePickColor('${c}')"></div>`
  ).join('');
}

function sePickColor(c) {
  _seState.color = c;
  _renderSeColorPicker();
}

// ---- Blocks & Exercises ----

function _renderSeBlocks() {
  const el = document.getElementById('se-blocks-list');
  if (!el) return;
  if (_seState.blocks.length === 0) {
    el.innerHTML = `<div style="text-align:center;color:var(--text-muted);font-size:13px;padding:16px;border:1px dashed rgba(255,255,255,0.1);border-radius:8px;">
      Nenhum bloco. Clique em "+ Bloco" para adicionar.
    </div>`;
    return;
  }
  el.innerHTML = _seState.blocks.map((block, bi) => `
    <div class="se-block">
      <div class="se-block-header">
        <select class="se-block-type" onchange="seBlockTypeChange(${bi}, this.value)">
          ${SE_BLOCK_TYPES.map(t => `<option value="${t}" ${block.type===t?'selected':''}>${_seBlockLabel(t)}</option>`).join('')}
        </select>
        <span style="font-size:11px;color:var(--text-muted);font-weight:600;">Bloco ${bi+1}</span>
        <button class="se-block-remove" onclick="seRemoveBlock(${bi})">×</button>
      </div>
      <div class="se-exercise-list" id="se-ex-list-${bi}">
        ${_renderSeExerciseRows(bi, block.exercises)}
      </div>
      <button class="se-add-ex-btn" onclick="seAddExercise(${bi})">+ Exercício</button>
    </div>
  `).join('');
}

function _seBlockLabel(t) {
  const labels = {
    circuit:'Circuito', normal:'Normal', superset:'Super-Set',
    bisset:'Bi-Set', triset:'Tri-Set', giantset:'Giant-Set',
    warmup:'Aquecimento', finisher:'Finisher', stretch:'Alongamento',
  };
  return labels[t] || t;
}

function _renderSeExerciseRows(bi, exercises) {
  if (!exercises || exercises.length === 0) return `<div style="text-align:center;color:var(--text-muted);font-size:11px;padding:8px;">Sem exercícios</div>`;
  return exercises.map((ex, ei) => `
    <div class="se-exercise-row">
      <input class="se-ex-inp" type="text" value="${_escHtml(ex.name)}" placeholder="Exercício"
             onchange="seUpdateEx(${bi},${ei},'name',this.value)" />
      <input class="se-ex-inp" type="number" value="${ex.sets||3}" placeholder="Séries" title="Séries"
             onchange="seUpdateEx(${bi},${ei},'sets',+this.value)" style="text-align:center;" />
      <input class="se-ex-inp" type="text" value="${ex.reps||'10'}" placeholder="Reps" title="Repetições"
             onchange="seUpdateEx(${bi},${ei},'reps',this.value)" style="text-align:center;" />
      <input class="se-ex-inp" type="number" value="${ex.rest||60}" placeholder="Des" title="Descanso (s)"
             onchange="seUpdateEx(${bi},${ei},'rest',+this.value)" style="text-align:center;" />
      <button class="se-ex-remove" onclick="seRemoveExercise(${bi},${ei})">×</button>
    </div>
  `).join('');
}

function seBlockTypeChange(bi, val) {
  if (_seState.blocks[bi]) _seState.blocks[bi].type = val;
}

function seRemoveBlock(bi) {
  _seState.blocks.splice(bi, 1);
  _renderSeBlocks();
}

function seAddBlock() {
  _seState.blocks.push({ type: 'normal', exercises: [] });
  _renderSeBlocks();
}

function seAddExercise(bi) {
  if (!_seState.blocks[bi]) return;
  _seState.blocks[bi].exercises.push({ name: '', sets: 3, reps: '10', rest: 60 });
  _renderSeBlocks();
}

function seRemoveExercise(bi, ei) {
  if (!_seState.blocks[bi]) return;
  _seState.blocks[bi].exercises.splice(ei, 1);
  _renderSeBlocks();
}

function seUpdateEx(bi, ei, field, val) {
  if (_seState.blocks[bi]?.exercises[ei]) {
    _seState.blocks[bi].exercises[ei][field] = val;
  }
}

// ---- Save sheet ----

function saveSheetEdit() {
  const name = document.getElementById('se-name').value.trim();
  if (!name) { showToast('Digite um nome para a ficha!', 'error'); return; }

  const subtitle = document.getElementById('se-subtitle-inp').value.trim();
  const focus = document.getElementById('se-focus').value.trim();
  const estmin = parseInt(document.getElementById('se-estmin').value) || 60;
  const intensity = document.getElementById('se-intensity').value;
  const intMap = SE_INTENSITY_MAP[intensity] || SE_INTENSITY_MAP.medium;

  // Build ID (keep existing if editing)
  const id = _seState.editingId && loadCustomSheets()[_seState.editingId]
    ? _seState.editingId
    : 'custom_' + Date.now();

  const sheetData = {
    id,
    name,
    subtitle: subtitle || name,
    description: subtitle || 'Ficha personalizada',
    focus,
    color: _seState.color,
    estimatedMin: estmin,
    intensityLevel: intensity,
    intensityLabel: intMap.label,
    intensityIcon: intMap.icon,
    isCustom: true,
    blocks: _seState.blocks.map(b => ({
      type: b.type,
      exercises: b.exercises.map(e => ({
        name: e.name,
        sets: e.sets,
        reps: e.reps,
        restTime: e.rest,
        muscles: [],
        tips: '',
        videoUrl: '',
        imageKey: '',
      })),
    })),
  };

  const custom = loadCustomSheets();
  custom[id] = sheetData;
  saveCustomSheets(custom);
  syncSheetToServer(sheetData); // async background sync

  showToast(`✅ Ficha "${name}" salva!`);

  // Close editor, go back to manager
  document.getElementById('sheet-editor-modal').classList.remove('show');
  document.body.style.overflow = '';
  openSheetManager();
}
