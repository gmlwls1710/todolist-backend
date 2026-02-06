/**
 * My Todos - タスク管理アプリ
 * ハンバーガーメニュー、FAB、タスク操作
 */

document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initFab();
    initCheckbox();
    initCardMenu();
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

    // ウィンドウリサイズでデスクトップに戻ったらサイドバーを閉じる
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });
}

// FAB（タスク追加ボタン）
function initFab() {
    const fabBtn = document.getElementById('fabBtn');

    fabBtn.addEventListener('click', () => {
        const ongoingColumn = document.querySelector('[data-status="ongoing"] .task-cards');
        const newId = getNextTaskId();

        const card = document.createElement('article');
        card.className = 'task-card';
        card.dataset.id = newId;
        card.innerHTML = `
            <div class="card-left">
                <button class="checkbox unchecked" aria-label="完了"></button>
                <div class="card-content">
                    <h4 class="card-title">新しいタスク</h4>
                    <p class="card-desc">説明を追加してください</p>
                    <div class="card-tags"></div>
                </div>
            </div>
            <button class="card-menu">⋮</button>
        `;

        ongoingColumn.prepend(card);
        updateTaskCounts();
    });
}

function getNextTaskId() {
    const cards = document.querySelectorAll('.task-card');
    let maxId = 0;
    cards.forEach(card => {
        const id = parseInt(card.dataset.id, 10);
        if (id > maxId) maxId = id;
    });
    return maxId + 1;
}

// チェックボックス（完了/未完了切り替え - イベント委譲）
function initCheckbox() {
    document.addEventListener('click', (e) => {
        if (!e.target.classList.contains('checkbox')) return;
        const card = e.target.closest('.task-card');
        if (!card || card.classList.contains('trashed')) return;

        e.stopPropagation();
        const ongoingColumn = document.querySelector('[data-status="ongoing"] .task-cards');
        const completedColumn = document.querySelector('[data-status="completed"] .task-cards');
        const checkbox = e.target;

        if (card.classList.contains('completed')) {
            // 未完了に戻す
            card.classList.remove('completed');
            checkbox.classList.remove('checked');
            checkbox.classList.add('unchecked');
            checkbox.textContent = '';
            checkbox.setAttribute('aria-label', '完了');
            ongoingColumn.prepend(card);
        } else {
            // 完了にする
            card.classList.add('completed');
            checkbox.classList.remove('unchecked');
            checkbox.classList.add('checked');
            checkbox.textContent = '✓';
            checkbox.setAttribute('aria-label', '未完了に戻す');
            completedColumn.appendChild(card);
        }
        updateTaskCounts();
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
    const panel = document.getElementById('cardMenuPanel');
    const overlay = document.getElementById('cardMenuOverlay');
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
            if (card) {
                openCardMenuPanel(card);
            }
        }
    });

    closeBtn.addEventListener('click', closeCardMenuPanel);
    overlay.addEventListener('click', closeCardMenuPanel);

    document.getElementById('cardMenuTags').addEventListener('click', (e) => {
        if (e.target.classList.contains('card-menu-tag-btn')) {
            e.target.classList.toggle('selected');
        }
    });

    saveBtn.addEventListener('click', () => {
        if (currentCardForMenu) {
            const titleInput = document.getElementById('cardMenuEditTitle');
            const descInput = document.getElementById('cardMenuEditDesc');
            const titleEl = currentCardForMenu.querySelector('.card-title');
            const descEl = currentCardForMenu.querySelector('.card-desc');
            if (titleEl) titleEl.textContent = titleInput.value || '無題';
            if (descEl) descEl.textContent = descInput.value || '';
            applySelectedTagsToCard(currentCardForMenu);
            closeCardMenuPanel();
        }
    });

    trashBtn.addEventListener('click', () => {
        if (currentCardForMenu) {
            const trashedColumn = document.querySelector('[data-status="trashed"] .task-cards');
            moveToTrash(currentCardForMenu, trashedColumn);
            closeCardMenuPanel();
        }
    });

    deleteBtn.addEventListener('click', () => {
        if (currentCardForMenu && confirm('このタスクを完全に削除しますか？')) {
            currentCardForMenu.remove();
            updateTaskCounts();
            closeCardMenuPanel();
        }
    });

    restoreBtn.addEventListener('click', () => {
        if (currentCardForMenu && currentCardForMenu.classList.contains('trashed')) {
            restoreToOngoing(currentCardForMenu);
            closeCardMenuPanel();
        }
    });

    deleteTrashedBtn.addEventListener('click', () => {
        if (currentCardForMenu && currentCardForMenu.classList.contains('trashed')) {
            if (confirm('このタスクを完全に削除しますか？')) {
                currentCardForMenu.remove();
                updateTaskCounts();
                closeCardMenuPanel();
            }
        }
    });
}

function openCardMenuPanel(card) {
    currentCardForMenu = card;
    const titleEl = card.querySelector('.card-title');
    const descEl = card.querySelector('.card-desc');
    const isTrashed = card.classList.contains('trashed');

    document.getElementById('cardMenuId').textContent = '#' + card.dataset.id;
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

function applySelectedTagsToCard(card) {
    const tagsContainer = card.querySelector('.card-tags');
    if (!tagsContainer) return;
    const selected = Array.from(document.querySelectorAll('.card-menu-tag-btn.selected')).map(btn => btn.dataset.tag);
    const optMap = Object.fromEntries(TAG_OPTIONS.map(o => [o.id, o]));
    tagsContainer.innerHTML = selected.map(id => {
        const opt = optMap[id];
        return opt ? `<span class="tag ${opt.class}">${opt.label}</span>` : '';
    }).filter(Boolean).join('');
}

function closeCardMenuPanel() {
    currentCardForMenu = null;
    document.getElementById('cardMenuPanel').classList.remove('open');
    document.getElementById('cardMenuOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

function restoreToOngoing(card) {
    const ongoingColumn = document.querySelector('[data-status="ongoing"] .task-cards');

    card.classList.remove('trashed');
    const indicator = card.querySelector('.trash-indicator');
    if (indicator) {
        const checkbox = document.createElement('button');
        checkbox.className = 'checkbox unchecked';
        checkbox.setAttribute('aria-label', '完了');
        checkbox.type = 'button';
        indicator.replaceWith(checkbox);
    }
    const menu = card.querySelector('.card-menu');
    if (!menu) {
        const menuBtn = document.createElement('button');
        menuBtn.className = 'card-menu';
        menuBtn.textContent = '⋮';
        card.appendChild(menuBtn);
    }
    ongoingColumn.prepend(card);
    updateTaskCounts();
}

function moveToTrash(card, trashedColumn) {
    card.classList.add('trashed');
    card.classList.remove('completed');
    const checkbox = card.querySelector('.checkbox');
    if (checkbox) {
        const indicator = document.createElement('span');
        indicator.className = 'trash-indicator';
        checkbox.replaceWith(indicator);
    }
    const menu = card.querySelector('.card-menu');
    if (!menu) {
        const menuBtn = document.createElement('button');
        menuBtn.className = 'card-menu';
        menuBtn.textContent = '⋮';
        card.appendChild(menuBtn);
    }
    trashedColumn.appendChild(card);
    updateTaskCounts();
}
