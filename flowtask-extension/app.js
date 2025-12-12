// FlowTask - Productivity Dashboard
const STORAGE_KEYS = {
  TODOS: 'flowtask_todos',
  TIMELINE: 'flowtask_timeline',
  NOTES: 'flowtask_notes',
  COLORS: 'flowtask_colors',
  STREAK: 'flowtask_streak',
  HISTORY: 'flowtask_history',
  THEME: 'flowtask_theme',
  QUOTES: 'flowtask_quotes',
  LAST_ACTIVE: 'flowtask_last_active',
  STATS: 'flowtask_stats',
  VAULT: 'flowtask_vault'
};

const defaultQuotes = [
  { id: 1, text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { id: 2, text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { id: 3, text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { id: 4, text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { id: 5, text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { id: 6, text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { id: 7, text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { id: 8, text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { id: 9, text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
  { id: 10, text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" }
];

// State
let todos = [];
let timeline = [];
let notes = [];
let quotes = [];
let currentQuoteIndex = 0;
let streak = 0;
let history = { tasks: [], timeline: [], notes: [] };
let currentHistoryTab = 'tasks';
let isEditingQuote = false;
let draggedItem = null;
let editingTaskId = null;
let stats = { daily: {} };
let vault = [];
let currentVaultType = 'text';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  initTheme();
  initTodos();
  initTimeline();
  initNotes();
  initQuotes();
  initDateTime();
  initSettings();
  initHistory();
  initStats();
  initTaskModal();
  initVault();
  localStorage.setItem(STORAGE_KEYS.LAST_ACTIVE, Date.now().toString());
});

function loadData() {
  const savedTodos = localStorage.getItem(STORAGE_KEYS.TODOS);
  const savedTimeline = localStorage.getItem(STORAGE_KEYS.TIMELINE);
  const savedNotes = localStorage.getItem(STORAGE_KEYS.NOTES);
  const savedColors = localStorage.getItem(STORAGE_KEYS.COLORS);
  const savedStreak = localStorage.getItem(STORAGE_KEYS.STREAK);
  const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
  const savedQuotes = localStorage.getItem(STORAGE_KEYS.QUOTES);

  const savedStats = localStorage.getItem(STORAGE_KEYS.STATS);

  if (savedTodos) todos = JSON.parse(savedTodos);
  if (savedTimeline) timeline = JSON.parse(savedTimeline);
  if (savedNotes) notes = JSON.parse(savedNotes);
  if (savedColors) applyColors(JSON.parse(savedColors));
  if (savedStreak) streak = parseInt(savedStreak);
  if (savedHistory) history = JSON.parse(savedHistory);
  if (savedQuotes) quotes = JSON.parse(savedQuotes);
  else quotes = [...defaultQuotes];
  if (savedStats) stats = JSON.parse(savedStats);
  
  const savedVault = localStorage.getItem(STORAGE_KEYS.VAULT);
  if (savedVault) vault = JSON.parse(savedVault);
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ============ THEME ============
function initTheme() {
  const toggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
  if (savedTheme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  toggle.addEventListener('click', toggleTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  if (newTheme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
  localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
}

// ============ GAMIFICATION ============
function showAchievement(message) {
  const popup = document.getElementById('achievementPopup');
  popup.querySelector('.achievement-text').textContent = message;
  popup.classList.add('show');
  setTimeout(() => popup.classList.remove('show'), 2000);
}

function createConfetti() {
  const container = document.getElementById('confetti');
  const colors = ['#ff3500', '#ff4929', '#ff6b47', '#ffa07a', '#01614a'];
  for (let i = 0; i < 50; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = Math.random() * 0.5 + 's';
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    if (Math.random() > 0.5) piece.style.borderRadius = '50%';
    container.appendChild(piece);
    setTimeout(() => piece.remove(), 3000);
  }
}

function updateStreak() {
  streak++;
  localStorage.setItem(STORAGE_KEYS.STREAK, streak);
  document.getElementById('streakCount').textContent = streak;
}

function updateProgress() {
  const total = todos.length;
  const completed = todos.filter(t => t.completed).length;
  const percent = total > 0 ? (completed / total) * 100 : 0;
  document.getElementById('progressFill').style.width = percent + '%';
}

// ============ TASK MODAL ============
function initTaskModal() {
  const modal = document.getElementById('taskModal');
  const closeBtn = document.getElementById('taskModalClose');
  const saveBtn = document.getElementById('taskModalSave');
  const textarea = document.getElementById('taskModalText');
  
  closeBtn.addEventListener('click', closeTaskModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeTaskModal(); });
  saveBtn.addEventListener('click', saveTaskModal);
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveTaskModal(); }
    if (e.key === 'Escape') closeTaskModal();
  });
}

function openTaskModal(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;
  editingTaskId = id;
  const modal = document.getElementById('taskModal');
  const textarea = document.getElementById('taskModalText');
  const number = document.getElementById('taskModalNumber');
  const index = todos.findIndex(t => t.id === id);
  number.textContent = `Task #${index + 1}`;
  textarea.value = todo.text;
  modal.classList.add('active');
  textarea.focus();
  textarea.select();
}

function closeTaskModal() {
  document.getElementById('taskModal').classList.remove('active');
  editingTaskId = null;
}

function saveTaskModal() {
  const textarea = document.getElementById('taskModalText');
  const text = textarea.value.trim();
  if (editingTaskId && text) {
    updateTodoText(editingTaskId, text);
    renderTodos();
  }
  closeTaskModal();
}

// ============ TODOS ============
function initTodos() {
  renderTodos();
  updateProgress();
  document.getElementById('streakCount').textContent = streak;
  const input = document.getElementById('todoInput');
  const addBtn = document.getElementById('addTodo');
  addBtn.addEventListener('click', () => addTodo());
  input.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTodo(); });
}

function addTodo() {
  const input = document.getElementById('todoInput');
  const text = input.value.trim();
  if (text) {
    todos.unshift({ id: Date.now(), text: text, completed: false });
    input.value = '';
    saveData(STORAGE_KEYS.TODOS, todos);
    trackStat('added');
    renderTodos();
    updateProgress();
    const btn = document.getElementById('addTodo');
    btn.style.transform = 'scale(0.9)';
    setTimeout(() => btn.style.transform = '', 150);
  }
}

function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (todo) {
    const wasCompleted = todo.completed;
    todo.completed = !todo.completed;
    saveData(STORAGE_KEYS.TODOS, todos);
    if (!wasCompleted && todo.completed) {
      trackStat('completed');
      const item = document.querySelector(`[data-id="${id}"]`);
      if (item) item.classList.add('completing');
      updateStreak();
      const completedCount = todos.filter(t => t.completed).length;
      if (completedCount === 1) { showAchievement('First task done!'); createConfetti(); }
      else if (completedCount === 5) { showAchievement('5 tasks completed!'); createConfetti(); }
      else if (completedCount === 10) { showAchievement('10 tasks! You\'re on fire!'); createConfetti(); }
      else if (completedCount % 10 === 0) { showAchievement(`${completedCount} tasks! Amazing!`); createConfetti(); }
      setTimeout(() => renderTodos(), 500);
    } else renderTodos();
    updateProgress();
  }
}

function deleteTodo(id) {
  const item = document.querySelector(`[data-id="${id}"]`);
  const todo = todos.find(t => t.id === id);
  if (item && todo) {
    addToHistory('tasks', { ...todo, deletedAt: Date.now() });
    item.style.transform = 'translateX(100%)';
    item.style.opacity = '0';
    setTimeout(() => {
      todos = todos.filter(t => t.id !== id);
      saveData(STORAGE_KEYS.TODOS, todos);
      renderTodos();
      updateProgress();
    }, 300);
  }
}

function updateTodoText(id, text) {
  const todo = todos.find(t => t.id === id);
  if (todo) { todo.text = text; saveData(STORAGE_KEYS.TODOS, todos); }
}

// ============ DRAG AND DROP ============
function handleDragStart(e, id) {
  draggedItem = id;
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
  e.target.classList.remove('dragging');
  document.querySelectorAll('.todo-item').forEach(item => {
    item.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
  });
  draggedItem = null;
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const item = e.target.closest('.todo-item');
  if (item && draggedItem) {
    const rect = item.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    document.querySelectorAll('.todo-item').forEach(i => i.classList.remove('drag-over-top', 'drag-over-bottom'));
    if (e.clientY < midY) item.classList.add('drag-over-top');
    else item.classList.add('drag-over-bottom');
  }
}

function handleDrop(e, targetId) {
  e.preventDefault();
  if (!draggedItem || draggedItem === targetId) return;
  
  const draggedIndex = todos.findIndex(t => t.id === draggedItem);
  const targetIndex = todos.findIndex(t => t.id === targetId);
  if (draggedIndex === -1 || targetIndex === -1) return;
  
  const item = e.target.closest('.todo-item');
  const rect = item.getBoundingClientRect();
  const midY = rect.top + rect.height / 2;
  const insertAfter = e.clientY > midY;
  
  const [removed] = todos.splice(draggedIndex, 1);
  let newIndex = todos.findIndex(t => t.id === targetId);
  if (insertAfter) newIndex++;
  todos.splice(newIndex, 0, removed);
  
  saveData(STORAGE_KEYS.TODOS, todos);
  renderTodos();
}

function renderTodos() {
  const list = document.getElementById('todoList');
  const count = document.getElementById('taskCount');
  count.textContent = todos.filter(t => !t.completed).length;
  
  list.innerHTML = todos.map((todo, index) => `
    <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}" draggable="true">
      <span class="todo-number">${index + 1}</span>
      <div class="todo-drag-handle" title="Drag to reorder">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="5" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="19" cy="5" r="2"/>
          <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
          <circle cx="5" cy="19" r="2"/><circle cx="12" cy="19" r="2"/><circle cx="19" cy="19" r="2"/>
        </svg>
      </div>
      <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" data-todo-id="${todo.id}"></div>
      <span class="todo-text" data-todo-view="${todo.id}" title="Click to view/edit">${escapeHtml(todo.text)}</span>
      <button class="todo-delete" data-todo-delete="${todo.id}">✕</button>
    </li>
  `).join('');
  
  // Attach event listeners
  list.querySelectorAll('.todo-checkbox').forEach(cb => {
    cb.addEventListener('click', (e) => { e.stopPropagation(); toggleTodo(parseInt(cb.dataset.todoId)); });
  });
  list.querySelectorAll('.todo-text').forEach(span => {
    span.addEventListener('click', () => openTaskModal(parseInt(span.dataset.todoView)));
  });
  list.querySelectorAll('.todo-delete').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); deleteTodo(parseInt(btn.dataset.todoDelete)); });
  });
  
  // Drag and drop
  list.querySelectorAll('.todo-item').forEach(item => {
    const id = parseInt(item.dataset.id);
    item.addEventListener('dragstart', (e) => handleDragStart(e, id));
    item.addEventListener('dragend', handleDragEnd);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('drop', (e) => handleDrop(e, id));
  });
}

// ============ TIMELINE ============
function initTimeline() {
  if (timeline.length === 0) {
    const today = new Date().getDate();
    timeline = [
      { id: 1, time: '09:00', title: 'Morning routine', dayStart: today, dayEnd: today, current: false },
      { id: 2, time: '10:00', title: 'Deep work session', dayStart: today, dayEnd: today, current: false },
      { id: 3, time: '12:00', title: 'Lunch break', dayStart: today, dayEnd: today, current: false },
      { id: 4, time: '14:00', title: 'Meetings & calls', dayStart: today, dayEnd: today, current: false },
      { id: 5, time: '16:00', title: 'Review & wrap up', dayStart: today, dayEnd: today, current: false }
    ];
    saveData(STORAGE_KEYS.TIMELINE, timeline);
  }
  // Migrate old timeline items without date fields
  timeline = timeline.map(item => ({
    ...item,
    dayStart: item.dayStart || new Date().getDate(),
    dayEnd: item.dayEnd || new Date().getDate(),
    current: item.current || false
  }));
  renderTimeline();
  document.getElementById('addTimelineItem').addEventListener('click', addTimelineItem);
}

function addTimelineItem() {
  const today = new Date().getDate();
  timeline.push({ id: Date.now(), time: '00:00', title: 'New task', dayStart: today, dayEnd: today, current: false });
  saveData(STORAGE_KEYS.TIMELINE, timeline);
  renderTimeline();
}

function deleteTimelineItem(id) {
  const item = timeline.find(t => t.id === id);
  if (item) addToHistory('timeline', { ...item, deletedAt: Date.now() });
  timeline = timeline.filter(t => t.id !== id);
  saveData(STORAGE_KEYS.TIMELINE, timeline);
  renderTimeline();
}

function updateTimelineItem(id, field, value) {
  const item = timeline.find(t => t.id === id);
  if (item) { item[field] = value; saveData(STORAGE_KEYS.TIMELINE, timeline); }
}

function toggleTimelineCurrent(id) {
  timeline.forEach(item => { item.current = item.id === id ? !item.current : false; });
  saveData(STORAGE_KEYS.TIMELINE, timeline);
  renderTimeline();
}

function renderTimeline() {
  const container = document.getElementById('timeline');
  container.innerHTML = timeline.map(item => `
    <div class="timeline-item ${item.current ? 'is-current' : ''}" data-id="${item.id}">
      <div class="timeline-dot" data-timeline-dot="${item.id}" title="Click to mark as current">
        ${item.current ? '<svg class="timeline-flag" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M4 21V4h16v10l-8 3.5L4 21z"/></svg>' : ''}
      </div>
      <div class="timeline-content">
        <div class="timeline-date-range">
          <input type="number" class="timeline-day-input" value="${item.dayStart}" min="1" max="31" data-timeline-daystart="${item.id}" title="Start day">
          <span>-</span>
          <input type="number" class="timeline-day-input" value="${item.dayEnd}" min="1" max="31" data-timeline-dayend="${item.id}" title="End day">
        </div>
        <input type="text" class="timeline-title-input" value="${escapeHtml(item.title)}" data-timeline-title="${item.id}">
        <button class="timeline-delete" data-timeline-delete="${item.id}">✕</button>
      </div>
    </div>
  `).join('');
  
  container.querySelectorAll('.timeline-dot').forEach(dot => {
    dot.addEventListener('click', () => toggleTimelineCurrent(parseInt(dot.dataset.timelineDot)));
  });
  container.querySelectorAll('.timeline-day-input[data-timeline-daystart]').forEach(input => {
    input.addEventListener('change', () => updateTimelineItem(parseInt(input.dataset.timelineDaystart), 'dayStart', parseInt(input.value) || 1));
  });
  container.querySelectorAll('.timeline-day-input[data-timeline-dayend]').forEach(input => {
    input.addEventListener('change', () => updateTimelineItem(parseInt(input.dataset.timelineDayend), 'dayEnd', parseInt(input.value) || 1));
  });
  container.querySelectorAll('.timeline-title-input').forEach(input => {
    input.addEventListener('change', () => updateTimelineItem(parseInt(input.dataset.timelineTitle), 'title', input.value));
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') input.blur(); });
  });
  container.querySelectorAll('.timeline-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteTimelineItem(parseInt(btn.dataset.timelineDelete)));
  });
}

// ============ NOTES ============
function initNotes() {
  if (notes.length === 0) {
    notes = [{ id: 1, text: '' }, { id: 2, text: '' }, { id: 3, text: '' }, { id: 4, text: '' }];
    saveData(STORAGE_KEYS.NOTES, notes);
  }
  renderNotes();
  document.getElementById('addNote').addEventListener('click', addNote);
}

function addNote() {
  notes.push({ id: Date.now(), text: '' });
  saveData(STORAGE_KEYS.NOTES, notes);
  renderNotes();
  setTimeout(() => { document.getElementById('notesScroll').scrollTop = document.getElementById('notesScroll').scrollHeight; }, 100);
}

function deleteNote(id) {
  if (notes.length <= 1) return;
  const note = notes.find(n => n.id === id);
  if (note && note.text.trim()) addToHistory('notes', { ...note, deletedAt: Date.now() });
  notes = notes.filter(n => n.id !== id);
  saveData(STORAGE_KEYS.NOTES, notes);
  renderNotes();
}

function updateNote(id, text) {
  const note = notes.find(n => n.id === id);
  if (note) { note.text = text; saveData(STORAGE_KEYS.NOTES, notes); }
}

function renderNotes() {
  const grid = document.getElementById('notesGrid');
  grid.innerHTML = notes.map(note => `
    <div class="sticky-note" data-note="${note.id}">
      <button class="note-delete" data-note-delete="${note.id}">✕</button>
      <textarea placeholder="Write something..." data-note-text="${note.id}">${escapeHtml(note.text)}</textarea>
    </div>
  `).join('');
  grid.querySelectorAll('.note-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteNote(parseInt(btn.dataset.noteDelete)));
  });
  grid.querySelectorAll('textarea').forEach(ta => {
    ta.addEventListener('input', () => updateNote(parseInt(ta.dataset.noteText), ta.value));
  });
}

// ============ QUOTES ============
function initQuotes() {
  showRandomQuote();
  document.getElementById('newQuote').addEventListener('click', () => {
    if (quotes.length === 0) return;
    const card = document.getElementById('quoteCard');
    card.style.transform = 'scale(0.95)'; card.style.opacity = '0.5';
    setTimeout(() => { showRandomQuote(); card.style.transform = ''; card.style.opacity = ''; }, 200);
  });
  document.getElementById('addQuote').addEventListener('click', () => { isEditingQuote = false; showQuoteForm(); });
  document.getElementById('editQuote').addEventListener('click', () => {
    if (quotes.length === 0) return;
    isEditingQuote = true;
    const quote = quotes[currentQuoteIndex];
    document.getElementById('quoteTextInput').value = quote.text;
    document.getElementById('quoteAuthorInput').value = quote.author;
    showQuoteForm();
  });
  document.getElementById('deleteQuote').addEventListener('click', deleteCurrentQuote);
  document.getElementById('saveQuote').addEventListener('click', saveQuoteForm);
  document.getElementById('cancelQuote').addEventListener('click', hideQuoteForm);
  document.getElementById('quoteAuthorInput').addEventListener('keypress', (e) => { if (e.key === 'Enter') saveQuoteForm(); });
}

function showQuoteForm() {
  if (!isEditingQuote) { document.getElementById('quoteTextInput').value = ''; document.getElementById('quoteAuthorInput').value = ''; }
  document.getElementById('quoteEditForm').classList.add('active');
  document.getElementById('quoteCard').style.display = 'none';
  document.getElementById('quoteTextInput').focus();
}

function hideQuoteForm() {
  document.getElementById('quoteEditForm').classList.remove('active');
  document.getElementById('quoteCard').style.display = 'block';
}

function saveQuoteForm() {
  const text = document.getElementById('quoteTextInput').value.trim();
  const author = document.getElementById('quoteAuthorInput').value.trim() || 'Unknown';
  if (!text) return;
  if (isEditingQuote && quotes.length > 0) { quotes[currentQuoteIndex].text = text; quotes[currentQuoteIndex].author = author; }
  else { quotes.push({ id: Date.now(), text, author }); currentQuoteIndex = quotes.length - 1; }
  saveData(STORAGE_KEYS.QUOTES, quotes);
  hideQuoteForm(); displayCurrentQuote();
}

function deleteCurrentQuote() {
  if (quotes.length <= 1) return;
  quotes.splice(currentQuoteIndex, 1);
  if (currentQuoteIndex >= quotes.length) currentQuoteIndex = 0;
  saveData(STORAGE_KEYS.QUOTES, quotes); displayCurrentQuote();
}

function showRandomQuote() {
  if (quotes.length === 0) { quotes = [...defaultQuotes]; saveData(STORAGE_KEYS.QUOTES, quotes); }
  currentQuoteIndex = Math.floor(Math.random() * quotes.length);
  displayCurrentQuote();
}

function displayCurrentQuote() {
  if (quotes.length === 0) return;
  const quote = quotes[currentQuoteIndex];
  document.getElementById('quoteText').textContent = `"${quote.text}"`;
  document.getElementById('quoteAuthor').textContent = `— ${quote.author}`;
}

// ============ DATE & TIME ============
function initDateTime() { updateDateTime(); setInterval(updateDateTime, 1000); }

function updateDateTime() {
  const now = new Date();
  document.getElementById('currentTime').textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const hour = now.getHours();
  document.getElementById('greeting').textContent = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

// ============ SETTINGS ============
function initSettings() {
  const toggle = document.getElementById('settingsToggle');
  const panel = document.getElementById('settingsPanel');
  toggle.addEventListener('click', () => panel.classList.toggle('active'));
  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && !toggle.contains(e.target)) panel.classList.remove('active');
  });
  const colorInputs = { primaryColor: '--primary', bgColor: '--bg', cardBgColor: '--card-bg', textColor: '--text' };
  Object.keys(colorInputs).forEach(inputId => {
    document.getElementById(inputId).addEventListener('input', (e) => {
      document.documentElement.style.setProperty(colorInputs[inputId], e.target.value);
      saveColors();
    });
  });
  document.getElementById('resetColors').addEventListener('click', resetColors);
  const savedColors = localStorage.getItem(STORAGE_KEYS.COLORS);
  if (savedColors) { const colors = JSON.parse(savedColors); applyColors(colors); updateColorInputs(colors); }
}

function saveColors() {
  saveData(STORAGE_KEYS.COLORS, {
    primary: document.getElementById('primaryColor').value,
    bg: document.getElementById('bgColor').value,
    cardBg: document.getElementById('cardBgColor').value,
    text: document.getElementById('textColor').value
  });
}

function applyColors(c) {
  if (c.primary) document.documentElement.style.setProperty('--primary', c.primary);
  if (c.bg) document.documentElement.style.setProperty('--bg', c.bg);
  if (c.cardBg) document.documentElement.style.setProperty('--card-bg', c.cardBg);
  if (c.text) document.documentElement.style.setProperty('--text', c.text);
}

function updateColorInputs(c) {
  if (c.primary) document.getElementById('primaryColor').value = c.primary;
  if (c.bg) document.getElementById('bgColor').value = c.bg;
  if (c.cardBg) document.getElementById('cardBgColor').value = c.cardBg;
  if (c.text) document.getElementById('textColor').value = c.text;
}

function resetColors() {
  const d = { primary: '#ff3500', bg: '#fffbfa', cardBg: '#ffffff', text: '#212121' };
  applyColors(d); updateColorInputs(d); localStorage.removeItem(STORAGE_KEYS.COLORS);
}

// ============ HISTORY ============
function initHistory() {
  const toggle = document.getElementById('historyToggle');
  const modal = document.getElementById('historyModal');
  toggle.addEventListener('click', () => { modal.classList.add('active'); renderHistory(); });
  document.getElementById('historyClose').addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
  document.getElementById('historyClear').addEventListener('click', () => {
    history = { tasks: [], timeline: [], notes: [] };
    saveData(STORAGE_KEYS.HISTORY, history); renderHistory();
  });
  document.querySelectorAll('.history-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.history-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentHistoryTab = tab.dataset.tab;
      renderHistory();
    });
  });
}

function addToHistory(type, item) {
  history[type].unshift(item);
  if (history[type].length > 50) history[type] = history[type].slice(0, 50);
  saveData(STORAGE_KEYS.HISTORY, history);
}

function restoreFromHistory(type, index) {
  const item = history[type][index];
  if (!item) return;
  const { deletedAt, ...restoredItem } = item;
  restoredItem.id = Date.now();
  if (type === 'tasks') { todos.unshift(restoredItem); saveData(STORAGE_KEYS.TODOS, todos); renderTodos(); updateProgress(); }
  else if (type === 'timeline') { timeline.push(restoredItem); saveData(STORAGE_KEYS.TIMELINE, timeline); renderTimeline(); }
  else if (type === 'notes') { notes.push(restoredItem); saveData(STORAGE_KEYS.NOTES, notes); renderNotes(); }
  history[type].splice(index, 1);
  saveData(STORAGE_KEYS.HISTORY, history); renderHistory();
}

function formatHistoryDate(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return new Date(ts).toLocaleDateString();
}

function renderHistory() {
  const list = document.getElementById('historyList');
  const items = history[currentHistoryTab] || [];
  
  if (items.length === 0) {
    list.innerHTML = `<div class="history-empty"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg><p>No deleted ${currentHistoryTab} yet</p></div>`;
    return;
  }
  
  list.innerHTML = items.map((item, index) => {
    let text = '', icon = '';
    if (currentHistoryTab === 'tasks') {
      text = item.text;
      icon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>';
    } else if (currentHistoryTab === 'timeline') {
      text = `${item.time} - ${item.title}`;
      icon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';
    } else if (currentHistoryTab === 'notes') {
      text = item.text.substring(0, 100) + (item.text.length > 100 ? '...' : '');
      icon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>';
    }
    return `<div class="history-item"><div class="history-item-icon">${icon}</div><div class="history-item-content"><div class="history-item-text">${escapeHtml(text)}</div><div class="history-item-date">${formatHistoryDate(item.deletedAt)}</div></div><button class="history-item-restore" data-restore-type="${currentHistoryTab}" data-restore-index="${index}">Restore</button></div>`;
  }).join('');
  
  list.querySelectorAll('.history-item-restore').forEach(btn => {
    btn.addEventListener('click', () => restoreFromHistory(btn.dataset.restoreType, parseInt(btn.dataset.restoreIndex)));
  });
}

// ============ UTILITIES ============
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}


// ============ STATS ============
function initStats() {
  const toggle = document.getElementById('statsToggle');
  const modal = document.getElementById('statsModal');
  const closeBtn = document.getElementById('statsClose');
  
  toggle.addEventListener('click', () => {
    modal.classList.add('active');
    renderStats();
  });
  closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
}

function getDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function trackStat(type) {
  const key = getDateKey();
  if (!stats.daily[key]) stats.daily[key] = { added: 0, completed: 0 };
  stats.daily[key][type]++;
  saveData(STORAGE_KEYS.STATS, stats);
}

function renderStats() {
  const totalTasks = todos.length;
  const completedTasks = todos.filter(t => t.completed).length;
  const rate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  document.getElementById('statsTotalTasks').textContent = totalTasks;
  document.getElementById('statsCompletedTasks').textContent = completedTasks;
  document.getElementById('statsCompletionRate').textContent = rate + '%';
  document.getElementById('statsCurrentStreak').textContent = streak;
  
  renderMonthChart();
  renderWeekBars();
}

function renderMonthChart() {
  const chart = document.getElementById('statsChart');
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();
  
  let html = '<div class="chart-grid">';
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayStats = stats.daily[key] || { added: 0, completed: 0 };
    const isToday = day === today;
    const hasActivity = dayStats.added > 0 || dayStats.completed > 0;
    const intensity = Math.min(dayStats.completed, 5);
    
    html += `<div class="chart-day ${isToday ? 'today' : ''} ${hasActivity ? 'has-activity' : ''}" 
      data-intensity="${intensity}" title="Day ${day}: ${dayStats.completed} completed, ${dayStats.added} added">
      <span class="chart-day-num">${day}</span>
    </div>`;
  }
  html += '</div>';
  chart.innerHTML = html;
}

function renderWeekBars() {
  const bars = document.getElementById('statsBars');
  const days = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = getDateKey(date);
    const dayStats = stats.daily[key] || { added: 0, completed: 0 };
    days.push({ name: dayNames[date.getDay()], ...dayStats, isToday: i === 0 });
  }
  
  const maxVal = Math.max(...days.map(d => Math.max(d.added, d.completed)), 1);
  
  bars.innerHTML = days.map(day => `
    <div class="bar-group ${day.isToday ? 'today' : ''}">
      <div class="bar-container">
        <div class="bar completed" style="height: ${(day.completed / maxVal) * 100}%"></div>
        <div class="bar added" style="height: ${(day.added / maxVal) * 100}%"></div>
      </div>
      <span class="bar-label">${day.name}</span>
      <span class="bar-value">${day.completed}/${day.added}</span>
    </div>
  `).join('');
}

// ============ VAULT ============
let pendingImageData = null;

function initVault() {
  const toggle = document.getElementById('vaultToggle');
  const modal = document.getElementById('vaultModal');
  const closeBtn = document.getElementById('vaultClose');
  const addBtn = document.getElementById('vaultAddBtn');
  const tabs = document.querySelectorAll('.vault-add-tab');
  
  toggle.addEventListener('click', () => {
    modal.classList.add('active');
    renderVault();
  });
  
  closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentVaultType = tab.dataset.vaultType;
      updateVaultInputs();
    });
  });
  
  addBtn.addEventListener('click', addToVault);
  
  // Enter key to save
  document.getElementById('vaultLinkInput').addEventListener('keypress', (e) => { if (e.key === 'Enter') addToVault(); });
  
  // Image upload handling
  initVaultImageUpload();
}

function initVaultImageUpload() {
  const dropzone = document.getElementById('vaultDropzone');
  const fileInput = document.getElementById('vaultImageFile');
  const previewRemove = document.getElementById('vaultPreviewRemove');
  
  // Click to browse
  dropzone.addEventListener('click', () => fileInput.click());
  
  // File input change
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
  });
  
  // Drag and drop
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add('drag-over');
  });
  
  dropzone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove('drag-over');
  });
  
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type.startsWith('image/')) {
      handleImageFile(files[0]);
    }
  });
  
  // Remove preview
  previewRemove.addEventListener('click', clearImagePreview);
}

function handleImageFile(file) {
  if (!file.type.startsWith('image/')) {
    showAchievement('Please select an image file');
    return;
  }
  
  // Max 5MB
  if (file.size > 5 * 1024 * 1024) {
    showAchievement('Image too large (max 5MB)');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    pendingImageData = e.target.result;
    showImagePreview(pendingImageData);
  };
  reader.readAsDataURL(file);
}

function showImagePreview(dataUrl) {
  const dropzone = document.getElementById('vaultDropzone');
  const preview = document.getElementById('vaultImagePreview');
  const previewImg = document.getElementById('vaultPreviewImg');
  
  previewImg.src = dataUrl;
  dropzone.classList.add('vault-hidden');
  preview.classList.remove('vault-hidden');
}

function clearImagePreview() {
  const dropzone = document.getElementById('vaultDropzone');
  const preview = document.getElementById('vaultImagePreview');
  const previewImg = document.getElementById('vaultPreviewImg');
  const fileInput = document.getElementById('vaultImageFile');
  
  previewImg.src = '';
  pendingImageData = null;
  fileInput.value = '';
  preview.classList.add('vault-hidden');
  dropzone.classList.remove('vault-hidden');
}

function updateVaultInputs() {
  const textInput = document.getElementById('vaultTextInput');
  const linkInput = document.getElementById('vaultLinkInput');
  const imageArea = document.getElementById('vaultImageArea');
  
  textInput.classList.add('vault-hidden');
  linkInput.classList.add('vault-hidden');
  imageArea.classList.add('vault-hidden');
  
  if (currentVaultType === 'text') {
    textInput.classList.remove('vault-hidden');
    textInput.focus();
  } else if (currentVaultType === 'link') {
    linkInput.classList.remove('vault-hidden');
    linkInput.focus();
  } else if (currentVaultType === 'image') {
    imageArea.classList.remove('vault-hidden');
    clearImagePreview();
  }
}

function addToVault() {
  let content = '';
  
  if (currentVaultType === 'text') {
    content = document.getElementById('vaultTextInput').value.trim();
    if (!content) return;
    document.getElementById('vaultTextInput').value = '';
  } else if (currentVaultType === 'link') {
    content = document.getElementById('vaultLinkInput').value.trim();
    if (!content) return;
    document.getElementById('vaultLinkInput').value = '';
  } else if (currentVaultType === 'image') {
    if (!pendingImageData) {
      showAchievement('Please select an image first');
      return;
    }
    content = pendingImageData;
    clearImagePreview();
  }
  
  vault.unshift({
    id: Date.now(),
    type: currentVaultType,
    content: content,
    createdAt: Date.now()
  });
  
  saveData(STORAGE_KEYS.VAULT, vault);
  renderVault();
  showAchievement('Saved to vault!');
}

function deleteVaultItem(id) {
  vault = vault.filter(item => item.id !== id);
  saveData(STORAGE_KEYS.VAULT, vault);
  renderVault();
}

function copyVaultItem(id) {
  const item = vault.find(v => v.id === id);
  if (item) {
    navigator.clipboard.writeText(item.content).then(() => {
      showAchievement('Copied to clipboard!');
    });
  }
}

function formatVaultDate(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return new Date(ts).toLocaleDateString();
}

function renderVault() {
  const list = document.getElementById('vaultList');
  
  if (vault.length === 0) {
    list.innerHTML = `
      <div class="vault-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
        <p>Your vault is empty</p>
        <p style="font-size: 0.8rem; margin-top: 4px;">Save text, links, or images here</p>
      </div>
    `;
    return;
  }
  
  list.innerHTML = vault.map(item => {
    let typeIcon = '';
    let contentHtml = '';
    
    if (item.type === 'text') {
      typeIcon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>';
      contentHtml = `<div class="vault-item-content text-content">${escapeHtml(item.content)}</div>`;
    } else if (item.type === 'link') {
      typeIcon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>';
      contentHtml = `<div class="vault-item-content link-content"><a href="${escapeHtml(item.content)}" target="_blank" rel="noopener">${escapeHtml(item.content)}</a></div>`;
    } else if (item.type === 'image') {
      typeIcon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
      // Handle both base64 and URL images
      const imgSrc = item.content.startsWith('data:') ? item.content : escapeHtml(item.content);
      contentHtml = `<div class="vault-item-content image-content"><img src="${imgSrc}" alt="Saved image" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"><span style="display:none; color: var(--text-muted); font-size: 0.8rem;">Image failed to load</span></div>`;
    }
    
    return `
      <div class="vault-item" data-vault-id="${item.id}">
        <div class="vault-item-header">
          <span class="vault-item-type">${typeIcon} ${item.type}</span>
          <div class="vault-item-actions">
            <button class="vault-item-copy" data-vault-copy="${item.id}" title="Copy">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
            <button class="vault-item-delete" data-vault-delete="${item.id}" title="Delete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <span class="vault-item-date">${formatVaultDate(item.createdAt)}</span>
        </div>
        ${contentHtml}
      </div>
    `;
  }).join('');
  
  // Attach event listeners
  list.querySelectorAll('.vault-item-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteVaultItem(parseInt(btn.dataset.vaultDelete)));
  });
  list.querySelectorAll('.vault-item-copy').forEach(btn => {
    btn.addEventListener('click', () => copyVaultItem(parseInt(btn.dataset.vaultCopy)));
  });
}
