/**
 * My Todos - タスク管理アプリ
 * バックエンド (localhost:5000) でタスクを永続化
 */

const API_BASE = 'http://localhost:5001/tasks';

document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initFab();
  initCheckbox();
  initCardMenu();
  loadTasksFromBackend();
});

// サイドバー（モバイル用ハンバーガーメニュー）
function initSidebar() {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  function toggleSidebar() {
    if (sidebar.classList.contains('open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }

  hamburgerBtn.addEventListener('click', toggleSidebar);
  overlay.addEventListener('click', closeSidebar);

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      closeSidebar();
    }
  });
}

// バックエンド API 呼び出し
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || `HTTP ${res.status}`);
  }
  return data;
}

// バックエンドからタスクを読み込み
async function loadTasksFromBackend() {
  const ongoingCards = document.querySelector('[data-status="ongoing"] .task-cards');
  const completedCards = document.querySelector('[data-status="completed"] .task-cards');
  const trashedCards = document.querySelector('[data-status="trashed"] .task-cards');

  ongoingCards.innerHTML = '';
  completedCards.innerHTML = '';
  trashedCards.innerHTML = '';

  try {
    const [tasksRes, trashedRes] = await Promise.all([
      fetch(`${API_BASE}`).then(r => r.json()),
      fetch(`${API_BASE}/trashed`).then(r => r.json()),
    ]);

    const tasks = Array.isArray(tasksRes) ? tasksRes : [];
    const trashed = Array.isArray(trashedRes) ? trashedRes : [];

    tasks.forEach((task) => {
      const status = task.status === 'DONE' ? 'completed' : 'ongoing';
      const card = createTaskCard(task._id, { ...task, status });
      if (status === 'ongoing') ongoingCards.appendChild(card);
      else completedCards.appendChild(card);
    });

    trashed.forEach((task) => {
      const card = createTaskCard(task._id, { ...task, status: 'trashed' });
      trashedCards.appendChild(card);
    });

    updateTaskCounts();
  } catch (err) {
    console.error('タスク読み込みエラー:', err);
    alert('タスクの読み込みに失敗しました。バックエンドが起動しているか確認してください。');
  }
}

// タスクカードのDOMを作成
function createTaskCard(id, data) {
  const card = document.createElement('article');
  card.className = 'task-card';
  if (data.status === 'completed') card.classList.add('completed');
  if (data.status === 'trashed') card.classList.add('trashed');
  card.dataset.id = id;

  const tagsHtml = (data.tags || []).map(tagId => {
    const opt = TAG_OPTIONS.find(o => o.id === tagId);
    return opt ? `<span class="tag ${opt.class}">${opt.label}</span>` : '';
  }).filter(Boolean).join('');

  const desc = data.description ? `<p class="card-desc">${escapeHtml(data.description)}</p>` : '';
  const leftContent = data.status === 'trashed'
    ? `<span class="trash-indicator"></span><div class="card-content"><h4 class="card-title">${escapeHtml(data.title)}</h4>${desc}</div>`
    : `<button class="checkbox ${data.status === 'completed' ? 'checked' : 'unchecked'}" aria-label="${data.status === 'completed' ? '未完了に戻す' : '完了'}">${data.status === 'completed' ? '✓' : ''}</button><div class="card-content"><h4 class="card-title">${escapeHtml(data.title)}</h4>${desc}<div class="card-tags">${tagsHtml}</div></div>`;

  const menuBtn = '<button class="card-menu">⋮</button>';
  card.innerHTML = `<div class="card-left">${leftContent}</div>${menuBtn}`;
  return card;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// FAB（タスク追加ボタン）- バックエンドに保存
function initFab() {
  const fabBtn = document.getElementById('fabBtn');

  fabBtn.addEventListener('click', async () => {
    try {
      await apiFetch(API_BASE, {
        method: 'POST',
        body: JSON.stringify({
          title: '新しいタスク',
          description: '説明を追加してください',
          status: 'PENDING',
        }),
      });
      loadTasksFromBackend();
    } catch (error) {
      console.error('タスク追加エラー:', error);
      alert('タスクの追加に失敗しました。');
    }
  });
}

// チェックボックス（完了/未完了切り替え）
function initCheckbox() {
  document.addEventListener('click', async (e) => {
    if (!e.target.classList.contains('checkbox')) return;
    const card = e.target.closest('.task-card');
    if (!card || card.classList.contains('trashed')) return;

    e.stopPropagation();
    const taskId = card.dataset.id;
    const newStatus = card.classList.contains('completed') ? 'PENDING' : 'DONE';

    try {
      await apiFetch(`${API_BASE}/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      loadTasksFromBackend();
    } catch (error) {
      console.error('ステータス更新エラー:', error);
    }
  });
}

// タスク数を更新
function updateTaskCounts() {
  document.querySelectorAll('.task-column').forEach(column => {
    const count = column.querySelectorAll('.task-card').length;
    column.querySelector('.task-count').textContent = count;
  });
}

// タグオプション
const TAG_OPTIONS = [
  { id: 'urgent', label: 'urgent', class: 'tag-red' },
  { id: 'coding', label: 'coding', class: 'tag-blue' },
  { id: 'personal', label: 'personal', class: 'tag-orange' },
  { id: 'health', label: 'health', class: 'tag-green' },
  { id: 'important', label: 'important', class: 'tag-dark-green' }
];

// カードメニュー（スライドパネル）
let currentCardForMenu = null;

function initCardMenu() {
  const closeBtn = document.getElementById('cardMenuClose');
  const saveBtn = document.getElementById('cardMenuSave');
  const trashBtn = document.getElementById('cardMenuTrash');
  const deleteBtn = document.getElementById('cardMenuDelete');
  const restoreBtn = document.getElementById('cardMenuRestore');
  const deleteTrashedBtn = document.getElementById('cardMenuDeleteTrashed');

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('card-menu')) {
      e.stopPropagation();
      const card = e.target.closest('.task-card');
      if (card) openCardMenuPanel(card);
    }
  });

  closeBtn.addEventListener('click', closeCardMenuPanel);
  document.getElementById('cardMenuOverlay').addEventListener('click', closeCardMenuPanel);

  document.getElementById('cardMenuTags').addEventListener('click', (e) => {
    if (e.target.classList.contains('card-menu-tag-btn')) {
      e.target.classList.toggle('selected');
    }
  });

  saveBtn.addEventListener('click', async () => {
    if (!currentCardForMenu) return;
    const taskId = currentCardForMenu.dataset.id;
    const title = document.getElementById('cardMenuEditTitle').value || '無題';
    const description = document.getElementById('cardMenuEditDesc').value || '';

    try {
      await apiFetch(`${API_BASE}/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title, description }),
      });
      closeCardMenuPanel();
      loadTasksFromBackend();
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました。');
    }
  });

  trashBtn.addEventListener('click', async () => {
    if (!currentCardForMenu) return;
    try {
      await apiFetch(`${API_BASE}/${currentCardForMenu.dataset.id}`, { method: 'DELETE' });
      closeCardMenuPanel();
      loadTasksFromBackend();
    } catch (error) {
      console.error('ゴミ箱への移動エラー:', error);
      alert('ゴミ箱への移動に失敗しました。');
    }
  });

  deleteBtn.addEventListener('click', async () => {
    if (!currentCardForMenu || !confirm('このタスクを完全に削除しますか？')) return;
    try {
      await apiFetch(`${API_BASE}/${currentCardForMenu.dataset.id}/permanent`, { method: 'DELETE' });
      closeCardMenuPanel();
      loadTasksFromBackend();
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました。');
    }
  });

  restoreBtn.addEventListener('click', async () => {
    if (!currentCardForMenu || !currentCardForMenu.classList.contains('trashed')) return;
    try {
      await apiFetch(`${API_BASE}/${currentCardForMenu.dataset.id}/restore`, { method: 'POST' });
      closeCardMenuPanel();
      loadTasksFromBackend();
    } catch (error) {
      console.error('復元エラー:', error);
      alert('復元に失敗しました。');
    }
  });

  deleteTrashedBtn.addEventListener('click', async () => {
    if (!currentCardForMenu || !currentCardForMenu.classList.contains('trashed') || !confirm('このタスクを完全に削除しますか？')) return;
    try {
      await apiFetch(`${API_BASE}/${currentCardForMenu.dataset.id}/permanent`, { method: 'DELETE' });
      closeCardMenuPanel();
      loadTasksFromBackend();
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました。');
    }
  });
}

function openCardMenuPanel(card) {
  currentCardForMenu = card;
  const titleEl = card.querySelector('.card-title');
  const descEl = card.querySelector('.card-desc');
  const isTrashed = card.classList.contains('trashed');

  document.getElementById('cardMenuId').textContent = '#' + (card.dataset.id || '').slice(-6);
  document.getElementById('cardMenuPreviewTitle').textContent = titleEl ? titleEl.textContent : '';

  if (isTrashed) {
    document.getElementById('cardMenuContentNormal').style.display = 'none';
    document.getElementById('cardMenuContentTrashed').style.display = 'block';
    document.querySelector('.card-menu-title').textContent = 'ゴミ箱のタスク';
  } else {
    document.getElementById('cardMenuContentNormal').style.display = 'block';
    document.getElementById('cardMenuContentTrashed').style.display = 'none';
    document.querySelector('.card-menu-title').textContent = 'タスクの操作';
    document.getElementById('cardMenuEditTitle').value = titleEl ? titleEl.textContent : '';
    document.getElementById('cardMenuEditDesc').value = descEl ? descEl.textContent : '';
    updateTagButtonsFromCard(card);
  }

  document.getElementById('cardMenuPanel').classList.add('open');
  document.getElementById('cardMenuOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function updateTagButtonsFromCard(card) {
  const tagsContainer = card.querySelector('.card-tags');
  const currentTags = tagsContainer ? Array.from(tagsContainer.querySelectorAll('.tag')).map(t => t.textContent.trim()) : [];
  document.querySelectorAll('.card-menu-tag-btn').forEach(btn => {
    btn.classList.toggle('selected', currentTags.includes(btn.dataset.tag));
  });
}

function closeCardMenuPanel() {
  currentCardForMenu = null;
  document.getElementById('cardMenuPanel').classList.remove('open');
  document.getElementById('cardMenuOverlay').classList.remove('active');
  document.body.style.overflow = '';
}
