/* ============ DARK / LIGHT MODE TOGGLE ============ */
const themeToggleBtn = document.getElementById('themeToggle');
const THEME_KEY = 'sb-theme';

function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}

// Initial state already set by the early inline script in <head>;
// just wire up the toggle button here.
if(themeToggleBtn){
  themeToggleBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
}

// Follow OS-level changes only if the user hasn't manually chosen a theme
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if(!localStorage.getItem(THEME_KEY)){
    document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
  }
});

/* ============ NAVIGATION ============ */
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const mobileTitle = document.getElementById('mobileTitle');
const titleMap = {home:'Động Phủ', planner:'Tu Luyện Nhật Trình', focus:'Bế Quan', wellness:'Dưỡng Sinh', progress:'Cảnh Giới', contact:'Truyền Âm'};

function goTo(pageId){
  navItems.forEach(n => n.classList.toggle('active', n.dataset.page === pageId));
  pages.forEach(p => p.classList.toggle('active', p.id === pageId));
  mobileTitle.textContent = titleMap[pageId] || '';
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarBackdrop').classList.remove('open');
  window.scrollTo({top:0, behavior:'smooth'});
  if(pageId === 'progress'){ initCharts(); }
}
navItems.forEach(item => item.addEventListener('click', () => goTo(item.dataset.page)));

/* Mobile sidebar toggle */
const sidebar = document.getElementById('sidebar');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');
document.getElementById('sidebarToggle').addEventListener('click', () => {
  sidebar.classList.toggle('open');
  sidebarBackdrop.classList.toggle('open');
});
sidebarBackdrop.addEventListener('click', () => {
  sidebar.classList.remove('open');
  sidebarBackdrop.classList.remove('open');
});

/* Profile dropdown */
const profileBtn = document.getElementById('profileBtn');
const profileDropdown = document.getElementById('profileDropdown');
profileBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  profileDropdown.classList.toggle('open');
});
document.addEventListener('click', () => profileDropdown.classList.remove('open'));

/* Toast helper */
function showToast(msg){
  const toast = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}

/* ============ CALENDAR ============ */
function buildCalendar(){
  const grid = document.getElementById('calGrid');
  const dows = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  let html = dows.map(d => `<div class="dow">${d}</div>`).join('');
  const daysInMonth = 31, startOffset = 0; // July 2024 starts on Monday
  const deadlineDays = [20,22,25];
  const today = 16;
  for(let i=0;i<startOffset;i++) html += `<div></div>`;
  for(let d=1; d<=daysInMonth; d++){
    let cls = 'day';
    if(d === today) cls += ' today';
    else if(deadlineDays.includes(d)) cls += ' deadline';
    html += `<div class="${cls}">${d}</div>`;
  }
  grid.innerHTML = html;
}
buildCalendar();

/* ============ STUDY PLANNER — TASKS ============ */
let tasks = [
  {name:'Web Application Project', priority:'high', done:false},
  {name:'JavaScript Practice', priority:'medium', done:false},
  {name:'English Reading', priority:'low', done:true},
  {name:'Discrete Math Homework', priority:'high', done:false},
];
let totalTasks = 25;
let completedBase = 17;

function renderTasks(){
  const list = document.getElementById('taskList');
  list.innerHTML = tasks.map((t,i) => `
    <div class="task-item">
      <div class="checkbox ${t.done ? 'checked' : ''}" onclick="toggleTask(${i})">${t.done ? '<i class="fa-solid fa-check"></i>' : ''}</div>
      <span class="task-name ${t.done ? 'done' : ''}">${t.name}</span>
      <span class="tag ${t.priority}">${t.priority.charAt(0).toUpperCase()+t.priority.slice(1)}</span>
      <i class="fa-solid fa-trash task-del" onclick="deleteTask(${i})" style="cursor:pointer;"></i>
    </div>
  `).join('');
  updateStats();
}

function toggleTask(i){
  tasks[i].done = !tasks[i].done;
  renderTasks();
}

function deleteTask(i){
  tasks.splice(i,1);
  renderTasks();
  showToast('Task removed');
}

function updateStats(){
  const doneCount = tasks.filter(t => t.done).length;
  const completed = completedBase + doneCount;
  document.getElementById('tasksCompletedStat').textContent = completed;
  document.getElementById('tasksTotalStat').textContent = `/${totalTasks} tasks`;
  const pct = Math.round((completed/totalTasks)*100);
  document.getElementById('completionStat').textContent = pct + '%';
}
renderTasks();

/* Add task modal */
const taskModal = document.getElementById('taskModal');
document.getElementById('openTaskModal').addEventListener('click', () => taskModal.classList.add('open'));
document.getElementById('closeTaskModal').addEventListener('click', () => taskModal.classList.remove('open'));
document.getElementById('cancelTaskModal').addEventListener('click', () => taskModal.classList.remove('open'));

let selectedPriority = 'medium';
document.querySelectorAll('.priority-choice').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('.priority-choice').forEach(p => p.classList.remove('selected'));
    el.classList.add('selected');
    selectedPriority = el.dataset.p;
  });
});

document.getElementById('confirmAddTask').addEventListener('click', () => {
  const subject = document.getElementById('modalSubject').value.trim();
  const taskTxt = document.getElementById('modalTask').value.trim();
  const name = [subject, taskTxt].filter(Boolean).join(': ') || 'New Task';
  tasks.unshift({name, priority:selectedPriority, done:false});
  renderTasks();
  taskModal.classList.remove('open');
  document.getElementById('modalSubject').value = '';
  document.getElementById('modalTask').value = '';
  document.getElementById('modalDate').value = '';
  showToast('Task added successfully');
});

/* Quick add study time */
function addStudyTime(hours){
  showToast(`Added ${hours}h to today's study goal`);
}

/* ============ FOCUS CENTER LOGIC (NEW IMPLEMENTATION) ============ */
// 1. Pomodoro Logic
let pomoTotalTime = 25 * 60;
let pomoTime = 25 * 60;
let pomoTimer = null;
let isPomoRunning = false;
const pomoCircle = document.getElementById('pomo-circle-fill');
const pomoCircleMax = 251.2;

function updatePomoDisplay() {
  const m = Math.floor(pomoTime / 60).toString().padStart(2, '0');
  const s = (pomoTime % 60).toString().padStart(2, '0');
  const display = document.getElementById('pomo-display');
  if(display) display.textContent = `${m}:${s}`;
  
  if(pomoCircle) {
    const offset = pomoCircleMax * (1 - pomoTime / pomoTotalTime);
    pomoCircle.style.strokeDashoffset = offset;
  }
}

document.querySelectorAll('.pomo-preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.pomo-preset-btn').forEach(b => {
      b.classList.remove('bg-blue-50', 'text-blue-600', 'border-blue-100');
      b.classList.add('bg-slate-50', 'text-slate-600', 'border-slate-200');
    });
    btn.classList.remove('bg-slate-50', 'text-slate-600', 'border-slate-200');
    btn.classList.add('bg-blue-50', 'text-blue-600', 'border-blue-100');
    
    const mins = parseInt(btn.dataset.time);
    pomoTotalTime = mins * 60;
    pomoTime = pomoTotalTime;
    resetPomo();
  });
});

const pomoStartBtn = document.getElementById('pomo-start-btn');
const pomoResetBtn = document.getElementById('pomo-reset-btn');

if(pomoStartBtn) {
  pomoStartBtn.addEventListener('click', () => {
    if(isPomoRunning) { pausePomo(); } 
    else { startPomo(); }
  });
}
if(pomoResetBtn) { pomoResetBtn.addEventListener('click', resetPomo); }

function startPomo() {
  isPomoRunning = true;
  if(pomoStartBtn) pomoStartBtn.innerHTML = '<i class="fa-solid fa-pause text-xs"></i> Tạm dừng';
  document.getElementById('pomo-status').textContent = 'Đang tập trung...';
  
  pomoTimer = setInterval(() => {
    if(pomoTime > 0) {
      pomoTime--;
      updatePomoDisplay();
    } else {
      pausePomo();
      showPomoOverlay();
    }
  }, 1000);
}

function pausePomo() {
  isPomoRunning = false;
  clearInterval(pomoTimer);
  if(pomoStartBtn) pomoStartBtn.innerHTML = '<i class="fa-solid fa-play text-xs"></i> Bắt đầu tập trung';
  document.getElementById('pomo-status').textContent = 'Đã tạm dừng';
}

function resetPomo() {
  pausePomo();
  pomoTime = pomoTotalTime;
  document.getElementById('pomo-status').textContent = 'Thời gian tập trung';
  updatePomoDisplay();
}

let pomoRestTimer = null;
let pomoRestTime = 5 * 60;

function showPomoOverlay() {
  const overlay = document.getElementById('pomo-overlay');
  if(!overlay) return;
  overlay.classList.remove('hidden');
  setTimeout(() => overlay.classList.remove('opacity-0'), 10);
  
  pomoRestTime = 5 * 60;
  updatePomoRestDisplay();
  
  pomoRestTimer = setInterval(() => {
    if(pomoRestTime > 0) {
      pomoRestTime--;
      updatePomoRestDisplay();
    } else {
      clearInterval(pomoRestTimer);
    }
  }, 1000);
}

function updatePomoRestDisplay() {
  const m = Math.floor(pomoRestTime / 60).toString().padStart(2, '0');
  const s = (pomoRestTime % 60).toString().padStart(2, '0');
  const el = document.getElementById('pomo-overlay-countdown');
  if(el) el.textContent = `${m}:${s}`;
}

document.getElementById('close-pomo-overlay-btn')?.addEventListener('click', () => {
  const overlay = document.getElementById('pomo-overlay');
  if(overlay) {
    overlay.classList.add('opacity-0');
    setTimeout(() => overlay.classList.add('hidden'), 300);
  }
  clearInterval(pomoRestTimer);
  resetPomo();
});

// 2. Focus Music Logic — Discord-bot style YouTube/Spotify link player
const musicUrlInput   = document.getElementById('music-url-input');
const musicLoadBtn    = document.getElementById('music-load-btn');
const musicClearBtn   = document.getElementById('music-clear-btn');
const musicStatusDot  = document.getElementById('music-status-dot');
const musicStatusText = document.getElementById('music-status-text');
const musicStatusSub  = document.getElementById('music-status-sub');
const musicEmbedWrap  = document.getElementById('music-embed-wrap');
const musicEmbedBox   = document.getElementById('music-embed-container');
const musicPresets    = document.getElementById('music-presets');
const musicRecentWrap = document.getElementById('music-recent-wrap');
const musicRecentList = document.getElementById('music-recent-list');

const MUSIC_LAST_KEY   = 'sb-music-last';
const MUSIC_RECENT_KEY = 'sb-music-recent';
const MAX_RECENTS = 5;

/* ---- URL parsing helpers ---- */
function parseYouTubeId(url){
  // Covers: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/live/ID,
  // youtube.com/embed/ID, youtube.com/shorts/ID
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/live\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/
  ];
  for(const re of patterns){
    const m = url.match(re);
    if(m) return m[1];
  }
  return null;
}

function parseSpotify(url){
  // Covers: open.spotify.com/track/ID, /playlist/ID, /album/ID, /episode/ID
  const m = url.match(/open\.spotify\.com\/(track|playlist|album|episode)\/([a-zA-Z0-9]+)/);
  if(m) return { type: m[1], id: m[2] };
  return null;
}

/* ---- Render helpers ---- */
function setStatus(state, title, sub){
  // state: 'idle' | 'youtube' | 'spotify'
  musicStatusDot.className = 'music-status-dot' + (state !== 'idle' ? ' live' : '');
  musicStatusText.textContent = title;
  musicStatusSub.textContent = sub;
}

function renderYouTube(videoId, label){
  musicEmbedBox.innerHTML = `
    <iframe
      width="100%" height="180"
      src="https://www.youtube.com/embed/${videoId}?autoplay=1"
      title="YouTube player"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen>
    </iframe>`;
  musicEmbedWrap.classList.remove('hidden');
  setStatus('youtube', label || 'Now Playing', 'Now Playing from YouTube');
}

function renderSpotify(type, id, label){
  const height = type === 'track' ? 152 : 352;
  musicEmbedBox.innerHTML = `
    <iframe
      style="border-radius:12px" width="100%" height="${height}"
      src="https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0"
      frameborder="0"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture">
    </iframe>`;
  musicEmbedWrap.classList.remove('hidden');
  setStatus('spotify', label || 'Now Playing', 'Now Playing from Spotify');
}

function clearPlayer(){
  musicEmbedBox.innerHTML = '';
  musicEmbedWrap.classList.add('hidden');
  setStatus('idle', 'No track loaded', 'Paste a link or pick a preset to start');
  localStorage.removeItem(MUSIC_LAST_KEY);
}

/* ---- Core: load a URL into the player ---- */
function loadMusicUrl(url, labelOverride){
  url = (url || '').trim();
  if(!url) return;

  const ytId = parseYouTubeId(url);
  if(ytId){
    const label = labelOverride || 'YouTube Stream';
    renderYouTube(ytId, label);
    saveLastAndRecent(url, 'youtube', label);
    return;
  }

  const sp = parseSpotify(url);
  if(sp){
    const label = labelOverride || `Spotify ${sp.type.charAt(0).toUpperCase() + sp.type.slice(1)}`;
    renderSpotify(sp.type, sp.id, label);
    saveLastAndRecent(url, 'spotify', label);
    return;
  }

  setStatus('idle', 'Link not recognized', 'Please paste a valid YouTube or Spotify link');
}

/* ---- localStorage persistence ---- */
function saveLastAndRecent(url, source, label){
  const entry = { url, source, label, ts: Date.now() };
  localStorage.setItem(MUSIC_LAST_KEY, JSON.stringify(entry));

  let recents = [];
  try { recents = JSON.parse(localStorage.getItem(MUSIC_RECENT_KEY)) || []; } catch(e){ recents = []; }
  recents = recents.filter(r => r.url !== url); // dedupe
  recents.unshift(entry);
  recents = recents.slice(0, MAX_RECENTS);
  localStorage.setItem(MUSIC_RECENT_KEY, JSON.stringify(recents));
  renderRecents(recents);
}

function renderRecents(recents){
  if(!recents || recents.length === 0){
    musicRecentWrap.classList.add('hidden');
    musicRecentList.innerHTML = '';
    return;
  }
  musicRecentWrap.classList.remove('hidden');
  musicRecentList.innerHTML = recents.map(r => `
    <button class="recent-track-item" data-url="${r.url}" data-label="${r.label}">
      <i class="${r.source === 'youtube' ? 'fa-brands fa-youtube' : 'fa-brands fa-spotify'}"></i>
      <span class="truncate">${r.label}</span>
    </button>
  `).join('');
}

/* ---- Wire up events ---- */
if(musicLoadBtn){
  musicLoadBtn.addEventListener('click', () => loadMusicUrl(musicUrlInput.value));
}
if(musicUrlInput){
  musicUrlInput.addEventListener('keydown', (e) => {
    if(e.key === 'Enter') loadMusicUrl(musicUrlInput.value);
  });
}
if(musicClearBtn){
  musicClearBtn.addEventListener('click', clearPlayer);
}
if(musicPresets){
  musicPresets.querySelectorAll('.preset-tag').forEach(btn => {
    btn.addEventListener('click', () => {
      musicUrlInput.value = btn.dataset.url;
      loadMusicUrl(btn.dataset.url, btn.dataset.label);
    });
  });
}
if(musicRecentList){
  musicRecentList.addEventListener('click', (e) => {
    const item = e.target.closest('.recent-track-item');
    if(!item) return;
    musicUrlInput.value = item.dataset.url;
    loadMusicUrl(item.dataset.url, item.dataset.label);
  });
}

/* ---- Restore last session on load ---- */
(function restoreMusicState(){
  try {
    const recents = JSON.parse(localStorage.getItem(MUSIC_RECENT_KEY)) || [];
    renderRecents(recents);

    const last = JSON.parse(localStorage.getItem(MUSIC_LAST_KEY));
    if(last && last.url){
      musicUrlInput.value = last.url;
      // Don't force-autoplay embeds on load without a click in some browsers,
      // but pre-fill the input and status so the user can resume with one tap.
      setStatus('idle', last.label, `Tap Load to resume from ${last.source === 'youtube' ? 'YouTube' : 'Spotify'}`);
    }
  } catch(e){ /* ignore corrupt storage */ }
})();

// 3. Break Reminder Logic
const breakSelect = document.getElementById('break-time-select');
const breakToggle = document.getElementById('break-toggle');
const breakCircle = document.getElementById('break-circle-fill');
const breakText = document.getElementById('break-text-center');
const breakStatusLbl = document.getElementById('break-status-lbl');

let breakTotalTime = 60 * 60;
let breakTime = 60 * 60;
let breakTimer = null;

function updateBreakDisplay() {
  const m = Math.floor(breakTime / 60).toString().padStart(2, '0');
  const s = (breakTime % 60).toString().padStart(2, '0');
  if(breakText) breakText.textContent = `${m}:${s}`;

  if(breakCircle) {
    const offset = 251.2 * (1 - breakTime / breakTotalTime);
    breakCircle.style.strokeDashoffset = offset;
  }
}

function startBreakTracking() {
  clearInterval(breakTimer);
  if(!breakToggle || !breakToggle.checked) {
    if(breakStatusLbl) breakStatusLbl.textContent = 'Đã tắt nhắc nhở';
    return;
  }

  if(breakStatusLbl) breakStatusLbl.textContent = 'Đang theo dõi...';
  breakTimer = setInterval(() => {
    if(breakTime > 0) {
      breakTime--;
      updateBreakDisplay();
    } else {
      showToast('Đã đến lúc nghỉ giải lao nhẹ nhàng! ☕');
      breakTime = breakTotalTime;
      updateBreakDisplay();
    }
  }, 1000);
}

if(breakSelect) {
  breakSelect.addEventListener('change', (e) => {
    breakTotalTime = parseInt(e.target.value) * 60;
    breakTime = breakTotalTime;
    updateBreakDisplay();
    startBreakTracking();
  });
}

if(breakToggle) {
  breakToggle.addEventListener('change', () => {
    if(breakToggle.checked) {
      startBreakTracking();
    } else {
      clearInterval(breakTimer);
      if(breakStatusLbl) breakStatusLbl.textContent = 'Đã tắt nhắc nhở';
    }
  });
}
startBreakTracking();

// 4. Eye Care Logic (Quy tắc 20-20-20)
let eyeTotalTime = 20 * 60;
let eyeTime = 20 * 60;
let eyeTimer = null;
const eyeCircle = document.getElementById('eye-circle-fill');
const eyeText = document.getElementById('eye-text-center');
const eyeRelaxBtn = document.getElementById('eye-relax-btn');

function updateEyeDisplay() {
  const m = Math.floor(eyeTime / 60).toString().padStart(2, '0');
  const s = (eyeTime % 60).toString().padStart(2, '0');
  if(eyeText) eyeText.textContent = `${m}:${s}`;

  if(eyeCircle) {
    const offset = 251.2 * (1 - eyeTime / eyeTotalTime);
    eyeCircle.style.strokeDashoffset = offset;
  }
}

function startEyeTimer() {
  clearInterval(eyeTimer);
  eyeTimer = setInterval(() => {
    if(eyeTime > 0) {
      eyeTime--;
      updateEyeDisplay();
    } else {
      triggerEyeRelaxation();
    }
  }, 1000);
}

if(eyeRelaxBtn) {
  eyeRelaxBtn.addEventListener('click', triggerEyeRelaxation);
}

let eyeOverlayTimer = null;
let eyeOverlaySeconds = 20;

function triggerEyeRelaxation() {
  const overlay = document.getElementById('eye-overlay');
  if(!overlay) return;
  overlay.classList.remove('hidden');
  setTimeout(() => overlay.classList.remove('opacity-0'), 10);

  eyeOverlaySeconds = 20;
  const cd = document.getElementById('overlay-countdown');
  if(cd) cd.textContent = `${eyeOverlaySeconds}s`;

  clearInterval(eyeOverlayTimer);
  eyeOverlayTimer = setInterval(() => {
    if(eyeOverlaySeconds > 0) {
      eyeOverlaySeconds--;
      if(cd) cd.textContent = `${eyeOverlaySeconds}s`;
    } else {
      clearInterval(eyeOverlayTimer);
    }
  }, 1000);
}

document.getElementById('close-overlay-btn')?.addEventListener('click', () => {
  const overlay = document.getElementById('eye-overlay');
  if(overlay) {
    overlay.classList.add('opacity-0');
    setTimeout(() => overlay.classList.add('hidden'), 300);
  }
  clearInterval(eyeOverlayTimer);
  eyeTime = eyeTotalTime;
  updateEyeDisplay();
  startEyeTimer();
});
startEyeTimer();

/* ============ WELLNESS ============ */
document.querySelectorAll('.mood-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    showToast(`Mood logged: ${btn.dataset.mood}`);
  });
});

const quotes = [
  { text: "Dưỡng thân trước dưỡng tâm, tâm tĩnh thì thân tự an.", author: "— Vô Danh Đạo Nhân" },
  { text: "Một khắc tịnh tọa, hơn mười năm khổ luyện.", author: "— Thanh Vân Tử" },
  { text: "Nghỉ ngơi chẳng phải lười biếng, mà là tích góp linh khí cho chặng đường tu luyện còn dài.", author: "— Cổ Nguyệt Tiên Sinh" },
  { text: "Muốn chế ngự vọng niệm, trước phải học buông bỏ chấp niệm.", author: "— Huyền Không Đạo Trưởng" },
  { text: "Sức khỏe là đạo cơ, đạo cơ không vững thì đạo quả khó thành.", author: "— Bạch Vân Lão Tổ" }
];
const todayQuote = quotes[new Date().getDate() % quotes.length];
document.getElementById('dailyQuoteText').textContent = todayQuote.text;
document.getElementById('dailyQuoteAuthor').textContent = todayQuote.author;

let waterCount = 4;
function addWater(){
  if(waterCount < 8){
    waterCount++;
    document.getElementById('waterCount').textContent = waterCount;
    showToast('Nice! Stay hydrated 💧');
  } else {
    showToast('Daily goal reached! 🎉');
  }
}

/* ============ PROGRESS CHARTS ============ */
let chartsInitialized = false;
function initCharts(){
  if(chartsInitialized) return;
  chartsInitialized = true;

  const barCtx = document.getElementById('barChart').getContext('2d');
  new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      datasets: [{
        label:'Study Hours',
        data:[3, 4.5, 2.5, 5, 3.5, 6, 4],
        backgroundColor:'#4318FF',
        borderRadius:8,
        maxBarThickness:34
      }]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false}},
      scales:{
        y:{beginAtZero:true, grid:{color:'#F0F2FA'}, ticks:{color:'#A3AED0'}},
        x:{grid:{display:false}, ticks:{color:'#A3AED0'}}
      }
    }
  });

  const donutCtx = document.getElementById('donutChart').getContext('2d');
  new Chart(donutCtx, {
    type:'doughnut',
    data:{
      labels:['Completed','Pending'],
      datasets:[{data:[85,15], backgroundColor:['#4318FF','#E9EDF7'], borderWidth:0}]
    },
    options:{
      responsive:true, maintainAspectRatio:false, cutout:'75%',
      plugins:{legend:{display:false}}
    }
  });
}

/* ============ CONTACT FORM VALIDATION ============ */
document.getElementById('contactForm').addEventListener('submit', function(e){
  e.preventDefault();
  let valid = true;

  const nameGroup = document.getElementById('nameGroup');
  const nameInput = document.getElementById('nameInput');
  if(nameInput.value.trim().length < 2){ nameGroup.classList.add('invalid'); valid = false; } else nameGroup.classList.remove('invalid');

  const emailGroup = document.getElementById('emailGroup');
  const emailInput = document.getElementById('emailInput');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if(!emailRegex.test(emailInput.value.trim())){ emailGroup.classList.add('invalid'); valid = false; } else emailGroup.classList.remove('invalid');

  const msgGroup = document.getElementById('messageGroup');
  const msgInput = document.getElementById('messageInput');
  if(msgInput.value.trim().length < 10){ msgGroup.classList.add('invalid'); valid = false; } else msgGroup.classList.remove('invalid');

  if(valid){
    document.getElementById('formSuccess').classList.add('show');
    this.reset();
    setTimeout(() => document.getElementById('formSuccess').classList.remove('show'), 4000);
  }
});
