const App = {
    currentUser: null,
    notes: [],
    currentFilter: 'all',
    editingNoteId: null,

    init() {
        this.checkLogin();
        this.bindEvents();
    },

    checkLogin() {
        const user = localStorage.getItem('currentUser');
        if (user) {
            this.currentUser = user;
            this.showMainPage();
        }
    },

    bindEvents() {
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleLogout();
        });

        document.getElementById('save-note-btn').addEventListener('click', () => {
            this.saveNote();
        });

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });
    },

    handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (username && password) {
            this.currentUser = username;
            localStorage.setItem('currentUser', username);
            this.loadNotes();
            this.showMainPage();
        }
    },

    handleLogout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        this.showLoginPage();
    },

    showLoginPage() {
        document.getElementById('login-page').classList.add('active');
        document.getElementById('main-page').classList.remove('active');
    },

    showMainPage() {
        document.getElementById('login-page').classList.remove('active');
        document.getElementById('main-page').classList.add('active');
        document.getElementById('user-display').textContent = `欢迎, ${this.currentUser}`;
        this.loadNotes();
        this.renderNotes();
        this.updateStats();
    },

    getStorageKey() {
        return `notes_${this.currentUser}`;
    },

    loadNotes() {
        const key = this.getStorageKey();
        const data = localStorage.getItem(key);
        this.notes = data ? JSON.parse(data) : [];
    },

    saveNotes() {
        const key = this.getStorageKey();
        localStorage.setItem(key, JSON.stringify(this.notes));
    },

    saveNote() {
        const titleInput = document.getElementById('note-title');
        const contentInput = document.getElementById('note-content');
        const importantInput = document.getElementById('note-important');

        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        const important = importantInput.checked;

        if (!title && !content) {
            alert('请输入笔记标题或内容');
            return;
        }

        if (this.editingNoteId) {
            const noteIndex = this.notes.findIndex(n => n.id === this.editingNoteId);
            if (noteIndex !== -1) {
                this.notes[noteIndex].title = title || '无标题';
                this.notes[noteIndex].content = content;
                this.notes[noteIndex].important = important;
                this.notes[noteIndex].updatedAt = new Date().toISOString();
            }
            this.editingNoteId = null;
            document.getElementById('save-note-btn').textContent = '保存笔记';
        } else {
            const note = {
                id: Date.now().toString(),
                title: title || '无标题',
                content: content,
                important: important,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.notes.unshift(note);
        }

        this.saveNotes();
        this.renderNotes();
        this.updateStats();

        titleInput.value = '';
        contentInput.value = '';
        importantInput.checked = false;
    },

    editNote(id) {
        const note = this.notes.find(n => n.id === id);
        if (note) {
            document.getElementById('note-title').value = note.title;
            document.getElementById('note-content').value = note.content;
            document.getElementById('note-important').checked = note.important;
            this.editingNoteId = id;
            document.getElementById('save-note-btn').textContent = '更新笔记';
            document.getElementById('note-title').focus();
        }
    },

    deleteNote(id) {
        if (confirm('确定要删除这条笔记吗？')) {
            this.notes = this.notes.filter(n => n.id !== id);
            this.saveNotes();
            this.renderNotes();
            this.updateStats();
        }
    },

    toggleImportant(id) {
        const note = this.notes.find(n => n.id === id);
        if (note) {
            note.important = !note.important;
            note.updatedAt = new Date().toISOString();
            this.saveNotes();
            this.renderNotes();
            this.updateStats();
        }
    },

    setFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.renderNotes();
    },

    getFilteredNotes() {
        if (this.currentFilter === 'important') {
            return this.notes.filter(n => n.important);
        }
        return this.notes;
    },

    renderNotes() {
        const container = document.getElementById('notes-list');
        const filteredNotes = this.getFilteredNotes();

        if (filteredNotes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span>📝</span>
                    <p>${this.currentFilter === 'important' ? '暂无重要笔记' : '还没有笔记，开始写第一条吧！'}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredNotes.map(note => this.createNoteHTML(note)).join('');

        container.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => this.editNote(btn.dataset.id));
        });

        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => this.deleteNote(btn.dataset.id));
        });
    },

    createNoteHTML(note) {
        const date = new Date(note.createdAt);
        const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

        return `
            <div class="note-card ${note.important ? 'important' : ''}">
                <div class="note-header">
                    <div class="note-title">
                        ${this.escapeHtml(note.title)}
                        ${note.important ? '<span class="important-badge">重要</span>' : ''}
                    </div>
                    <div class="note-actions">
                        <button class="edit-btn" data-id="${note.id}">编辑</button>
                        <button class="delete-btn" data-id="${note.id}">删除</button>
                    </div>
                </div>
                <div class="note-content">${this.escapeHtml(note.content)}</div>
                <div class="note-date">创建于 ${formattedDate}</div>
            </div>
        `;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    updateStats() {
        const total = this.notes.length;
        const important = this.notes.filter(n => n.important).length;

        const today = new Date().toDateString();
        const todayNotes = this.notes.filter(n => {
            return new Date(n.createdAt).toDateString() === today;
        }).length;

        document.getElementById('total-notes').textContent = total;
        document.getElementById('today-notes').textContent = todayNotes;
        document.getElementById('important-notes').textContent = important;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
