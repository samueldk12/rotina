/* =============================================
   MINHA ROTINA — APP LOGIC
   ============================================= */

// ---- STATE ----
const state = {
  currentView: 'home',
  selectedDay: new Date().getDay(),
  selectedSheet: 'ficha1',
  workoutProgress: {},
  studyProgress: {},
  activeTimer: null,
  timerSeconds: 0,
  timerRunning: false,
  modalExercise: null,
  modalTab: 'video',
  filterCategory: 'all',
  searchQuery: '',
  deferredInstallPrompt: null,
};

function saveState() {
  try {
    localStorage.setItem('rotina_workout', JSON.stringify(state.workoutProgress));
    localStorage.setItem('rotina_study', JSON.stringify(state.studyProgress));
  } catch(e) {}
}

function loadState() {
  try {
    const w = localStorage.getItem('rotina_workout');
    const s = localStorage.getItem('rotina_study');
    if (w) state.workoutProgress = JSON.parse(w);
    if (s) state.studyProgress = JSON.parse(s);
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
  const sheet = WORKOUT_SHEETS[routine.workout.sheetId];
  const isToday = dayNum === new Date().getDay();
  const workP = countWorkoutProgress(routine.workout.sheetId);

  const studiesHtml = routine.studies.map(s => `
    <div class="subject-item">
      <div class="subject-icon-sm" style="color:${s.color}">${icon(s.iconKey, 16)}</div>
      <span class="subject-name">${s.subject}</span>
      <span class="subject-time">${s.duration}</span>
    </div>
  `).join('');

  const focusChips = routine.workout.focus.split(', ').map(f =>
    `<span class="focus-chip">${f}</span>`
  ).join('');

  document.getElementById('week-day-detail').innerHTML = `
    <div class="day-detail-header">
      <div class="day-detail-title">${routine.dayName}${isToday ? ' <span style="color:var(--cyan);font-size:14px;">· Hoje</span>' : ''}</div>
    </div>

    <!-- Day overview image -->
    <div class="day-img-wrap">
      <img src="${routine.dayImage}" alt="${routine.dayName}" class="day-overview-img" />
      <div class="day-img-overlay">
        <span>${routine.workout.label}</span>
      </div>
    </div>

    <div class="subject-block">
      <div class="subject-block-title">${icon('book', 14)} Estudos do Dia</div>
      ${studiesHtml}
    </div>

    <div class="workout-detail-card">
      <div class="workout-detail-title">${icon('dumbbell', 14)} Treino do Dia</div>
      <div class="workout-sheet-info">
        <div class="sheet-badge" style="background:${sheet.color}22;color:${sheet.color}">
          ${sheet.id.replace('ficha','F')}
        </div>
        <div>
          <div class="sheet-name">${sheet.name} · ${sheet.subtitle}</div>
          <div class="sheet-label">${routine.workout.label}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-muted);margin-bottom:8px;">
        ${icon('box', 12)} ${routine.workout.module}
      </div>
      <div class="focus-chips">${focusChips}</div>
      ${workP.total > 0 ? `
        <div style="margin-top:12px;font-size:12px;color:var(--text-muted);">
          Progresso: <span style="color:var(--cyan);font-weight:700;">${workP.done}/${workP.total}</span> exercícios
        </div>` : ''}
      <button class="start-day-btn" onclick="startDayWorkout(${dayNum})">
        ${icon('play', 14)} Ir para o Treino
      </button>
    </div>
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
  loadState();
  navigateTo('home');

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
}

document.addEventListener('DOMContentLoaded', init);
