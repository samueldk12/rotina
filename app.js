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

function saveState() {
  try {
    localStorage.setItem('rotina_workout', JSON.stringify(state.workoutProgress));
    localStorage.setItem('rotina_study', JSON.stringify(state.studyProgress));
    localStorage.setItem('rotina_studytime', JSON.stringify(state.studyTimeLog));
  } catch(e) {}
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
  const sheet = WORKOUT_SHEETS[routine.workout.sheetId];
  const isToday = dayNum === new Date().getDay();
  const workP = countWorkoutProgress(routine.workout.sheetId);
  const wf = state.weekFilter;

  // ---- Time forecast calculation ----
  const studyTotalMin = routine.studies.reduce((acc, s) => acc + (s.durationMin || 0), 0);
  const workoutMin = routine.workout.estimatedMin || 40;
  const volleyballMin = routine.workout.volleyballMin || 0;
  const totalActivityMin = studyTotalMin + workoutMin + volleyballMin;

  function fmtMin(m) {
    if (m <= 0) return '0 min';
    const h = Math.floor(m / 60), r = m % 60;
    return h > 0 ? (r > 0 ? `${h}h${r}min` : `${h}h`) : `${r}min`;
  }

  // Time forecast badge
  const forecastHtml = `
    <div class="day-time-forecast">
      <div class="dtf-item">
        <span class="dtf-icon" style="color:var(--cyan)">${icon('book', 14)}</span>
        <span class="dtf-label">Estudos</span>
        <span class="dtf-val">${fmtMin(studyTotalMin)}</span>
      </div>
      ${volleyballMin > 0 ? `
      <div class="dtf-item">
        <span class="dtf-icon" style="color:var(--blue)">${icon('volleyball', 14)}</span>
        <span class="dtf-label">Vôlei</span>
        <span class="dtf-val">${fmtMin(volleyballMin)}</span>
      </div>` : ''}
      <div class="dtf-item">
        <span class="dtf-icon" style="color:var(--purple)">${icon('dumbbell', 14)}</span>
        <span class="dtf-label">Treino</span>
        <span class="dtf-val">${fmtMin(workoutMin)}</span>
      </div>
      <div class="dtf-item dtf-total">
        <span class="dtf-icon">${icon('timer', 14)}</span>
        <span class="dtf-label">Total</span>
        <span class="dtf-val">${fmtMin(totalActivityMin)}</span>
      </div>
    </div>
  `;

  // Studies block
  const studiesHtml = wf !== 'workout' ? `
    <div class="subject-block">
      <div class="subject-block-title">${icon('book', 14)} Estudos do Dia</div>
      ${routine.studies.map(s => `
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
  const focusChips = routine.workout.focus.split(', ').map(f =>
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
          <div class="sheet-label">${routine.workout.label}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-muted);margin-bottom:8px;">
        ${icon('box', 12)} ${routine.workout.module}
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
      <div class="day-detail-title">${routine.dayName}${isToday ? ' <span style="color:var(--cyan);font-size:14px;">· Hoje</span>' : ''}</div>
    </div>
    <div class="day-img-wrap">
      <img src="${routine.dayImage}" alt="${routine.dayName}" class="day-overview-img" />
      <div class="day-img-overlay"><span>${routine.workout.label}</span></div>
    </div>
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

  // Close study panel on overlay click
  document.getElementById('study-panel')?.addEventListener('click', function(e) {
    if (e.target === this) closeStudyPanel();
  });
}

document.addEventListener('DOMContentLoaded', init);

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
        const logged = state.studyTimeLog?.[s.subject] || 0;
        const goal = s.goalHours || 0;
        const pct = goal > 0 ? Math.min(100, (logged / 60) / goal * 100) : 0;
        return `
          <div class="study-ov-item ${done ? 'done' : ''}" onclick="openStudyPanel(${JSON.stringify(s).replace(/"/g,'&quot;')})">
            <div class="study-ov-icon" style="background:${s.color}22;color:${s.color}">${icon(s.iconKey, 18)}</div>
            <div class="study-ov-info">
              <div class="study-ov-name">${s.subject}</div>
              <div class="study-ov-meta">${s.duration} · Meta: ${goal}h · ${Math.round(logged/60*10)/10}h registrado</div>
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
    const logged = state.studyTimeLog?.[s.subject] || 0;
    const goal = s.goalHours || 0;
    const remaining = Math.max(0, goal * 60 - logged);
    const pct = goal > 0 ? Math.min(100, logged / (goal * 60) * 100) : 0;
    return `
      <div class="study-card-big" onclick="openStudyPanel(${JSON.stringify(s).replace(/"/g,'&quot;')})">
        <div class="scb-top">
          <div class="scb-icon" style="background:${s.color}22;color:${s.color}">${icon(s.iconKey, 22)}</div>
          <div class="scb-info">
            <div class="scb-name">${s.subject}</div>
            <div class="scb-meta">${Math.round(logged/60*10)/10}h / ${goal}h estudado</div>
          </div>
          <div class="scb-play">${icon('play', 16)}</div>
        </div>
        <div class="scb-bar-wrap"><div class="scb-bar-fill" style="width:${pct}%;background:${s.color}"></div></div>
        <div class="scb-remaining">${icon('hourglass', 11)} Faltam ${Math.floor(remaining/60)}h${remaining%60 > 0 ? remaining%60+'min' : ''} para a meta</div>
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
  const logged = state.studyTimeLog?.[s.subject] || 0;
  const goal = s.goalHours || 0;
  const sessionMin = Math.floor(state.studyTotalSeconds / 60);
  const total = logged + sessionMin;
  const remaining = Math.max(0, goal * 60 - total);
  const pct = goal > 0 ? Math.min(100, total / (goal * 60) * 100) : 0;

  const goalInfo = document.getElementById('sp-goal-info');
  const goalBar = document.getElementById('sp-goal-bar-fill');
  const goalRem = document.getElementById('sp-goal-remaining');

  if (goalInfo) goalInfo.innerHTML = `
    <span style="color:var(--cyan);font-weight:700;">${Math.round(total / 60 * 10) / 10}h</span>
    <span style="color:var(--text-muted)"> de </span>
    <span style="font-weight:700;">${goal}h</span>
    <span style="color:var(--text-muted)"> estudado</span>
  `;
  if (goalBar) goalBar.style.width = `${pct}%`;
  if (goalRem) {
    if (remaining <= 0) {
      goalRem.innerHTML = `${icon('trophy', 14)} <span style="color:var(--green)">Meta atingida! 🎉</span>`;
    } else {
      const remH = Math.floor(remaining / 60);
      const remM = remaining % 60;
      goalRem.innerHTML = `${icon('hourglass', 12)} Faltam <strong>${remH > 0 ? remH + 'h' : ''}${remM > 0 ? remM + 'min' : ''}</strong> para completar a meta`;
    }
  }
}

// =============================================
//   HEALTH TRACKING (Água, Frutas, Remédios)
// =============================================

const HEALTH_MEDICINES = [
  { key: 'omega3', label: 'Ômega-3', icon: 'pill' },
  { key: 'vit_d', label: 'Vitamina D', icon: 'pill' },
  { key: 'vit_c', label: 'Vitamina C', icon: 'pill' },
  { key: 'magnesio', label: 'Magnésio', icon: 'pill' },
  { key: 'creatina', label: 'Creatina', icon: 'pill' },
];

const FRUITS_LIST = [
  { key: 'banana', label: 'Banana', emoji: '🍌' },
  { key: 'maca', label: 'Maçã', emoji: '🍎' },
  { key: 'laranja', label: 'Laranja', emoji: '🍊' },
  { key: 'uva', label: 'Uva', emoji: '🍇' },
  { key: 'morango', label: 'Morango', emoji: '🍓' },
  { key: 'abacate', label: 'Abacate', emoji: '🥑' },
  { key: 'mamao', label: 'Mamão', emoji: '🍈' },
  { key: 'melancia', label: 'Melancia', emoji: '🍉' },
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
  const waterGoalMl = 2400;
  const waterPct = Math.min(100, totalMl / waterGoalMl * 100);

  const fruitCount = Object.values(h.fruits).reduce((a, b) => a + b, 0);
  const medsDone = Object.values(h.meds).filter(Boolean).length;

  document.getElementById('home-health').innerHTML = `
    <!-- Water -->
    <div class="health-card">
      <div class="health-card-title">${icon('droplets', 16)} Hidratação</div>
      <div class="water-total">${totalMl}ml <span>/ ${waterGoalMl}ml</span></div>
      <div class="water-bar-wrap"><div class="water-bar-fill" style="width:${waterPct}%;"></div></div>
      <div class="water-btns">
        <button class="water-btn" onclick="addWater(400)">
          ${icon('droplets', 14)} +400ml
          <span class="water-count">${h.water400}×</span>
        </button>
        <button class="water-btn water-btn-lg" onclick="addWater(500)">
          ${icon('droplets', 16)} +500ml
          <span class="water-count">${h.water500}×</span>
        </button>
        ${totalMl > 0 ? `<button class="water-btn water-btn-undo" onclick="undoWater()" title="Desfazer último">${icon('refresh', 13)}</button>` : ''}
      </div>
    </div>

    <!-- Fruits -->
    <div class="health-card">
      <div class="health-card-title">${icon('leaf', 16)} Frutas <span class="health-count-badge">${fruitCount}</span></div>
      <div class="fruits-grid">
        ${FRUITS_LIST.map(f => {
          const count = h.fruits[f.key] || 0;
          return `
            <button class="fruit-btn ${count > 0 ? 'active' : ''}" onclick="addFruit('${f.key}')">
              <span class="fruit-emoji">${f.emoji}</span>
              <span class="fruit-label">${f.label}</span>
              ${count > 0 ? `<span class="fruit-badge">${count}</span>` : ''}
            </button>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Medicines / Vitamins -->
    <div class="health-card">
      <div class="health-card-title">${icon('pill', 16)} Remédios & Vitaminas <span class="health-count-badge">${medsDone}/${HEALTH_MEDICINES.length}</span></div>
      <div class="meds-list">
        ${HEALTH_MEDICINES.map(m => {
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

    <!-- Export -->
    <button class="export-btn" onclick="exportData()">
      ${icon('download', 16)} Exportar Dados (JSON)
    </button>
  `;
}

function addWater(ml) {
  const h = loadTodayHealth();
  if (ml === 400) h.water400++;
  else h.water500++;
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

function toggleMed(key) {
  const h = loadTodayHealth();
  h.meds[key] = !h.meds[key];
  saveTodayHealth(h);
  renderHealth();
}

// =============================================
//   EXPORT DATA
// =============================================

function exportData() {
  const exportObj = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    studyProgress: state.studyProgress,
    workoutProgress: state.workoutProgress,
    studyTimeLog: state.studyTimeLog,
    healthToday: loadTodayHealth(),
    // collect all health days from localStorage
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

