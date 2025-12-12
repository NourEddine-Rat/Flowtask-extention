// FlowTask Popup Script
const STORAGE_KEYS = {
  TODOS: 'flowtask_todos',
  NOTES: 'flowtask_notes',
  STREAK: 'flowtask_streak',
  THEME: 'flowtask_theme',
  LAST_ACTIVE: 'flowtask_last_active'
};

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadStats();
  checkStatus();
  initButtons();
});

function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    updateThemeText();
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  if (newTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
  updateThemeText();
}

function updateThemeText() {
  const themeText = document.getElementById('themeText');
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  themeText.textContent = isDark ? 'Light Mode' : 'Dark Mode';
}

function loadStats() {
  const savedTodos = localStorage.getItem(STORAGE_KEYS.TODOS);
  let todos = [];
  if (savedTodos) {
    try { todos = JSON.parse(savedTodos); } catch (e) { todos = []; }
  }
  document.getElementById('taskCount').textContent = todos.length;
  document.getElementById('completedCount').textContent = todos.filter(t => t.completed).length;
  document.getElementById('streakCount').textContent = localStorage.getItem(STORAGE_KEYS.STREAK) || '0';
  
  const savedNotes = localStorage.getItem(STORAGE_KEYS.NOTES);
  let notes = [];
  if (savedNotes) {
    try { notes = JSON.parse(savedNotes); } catch (e) { notes = []; }
  }
  document.getElementById('notesCount').textContent = notes.length;
}

function checkStatus() {
  const statusIcon = document.getElementById('statusIcon');
  const statusValue = document.getElementById('statusValue');
  const infoText = document.getElementById('infoText');
  
  // Check last active timestamp from dashboard
  const lastActive = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVE);
  const now = Date.now();
  const isRecentlyActive = lastActive && (now - parseInt(lastActive)) < 86400000; // 24 hours
  const hasData = localStorage.getItem(STORAGE_KEYS.TODOS) || localStorage.getItem(STORAGE_KEYS.STREAK);
  
  if (isRecentlyActive) {
    statusIcon.classList.remove('inactive', 'warning');
    statusValue.classList.remove('inactive', 'warning');
    statusValue.textContent = 'Active';
    infoText.textContent = 'FlowTask is your new tab page';
    statusIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
  } else if (hasData) {
    statusIcon.classList.add('warning');
    statusValue.classList.add('warning');
    statusValue.textContent = 'May be overridden';
    infoText.textContent = 'Click "Open Dashboard" to use FlowTask';
    statusIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
  } else {
    statusIcon.classList.add('inactive');
    statusValue.classList.add('inactive');
    statusValue.textContent = 'Ready';
    infoText.textContent = 'Open a new tab to start using FlowTask';
    statusIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
  }
}

function initButtons() {
  document.getElementById('openDashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    window.close();
  });
  document.getElementById('toggleTheme').addEventListener('click', toggleTheme);
  document.getElementById('settingsLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'chrome://extensions' });
    window.close();
  });
}
