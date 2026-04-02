import { $, $$, uid, cap, setGreeting, showToast, showConfirm, initConfirm, setupTagsInput, initTheme, toggleTheme, generateQR, fetchUrlTitle } from './utils.js';
import { KEYS, load, save, getCopyCount, getDefaultSnippets, getDefaultBookmarks, getDefaultNotes, exportAll, getHistory, clearHistory, addToHistory, incrementCopyCount } from './data.js';
import { renderSnippets } from './snippets.js';
import { renderBookmarks } from './bookmarks.js';
import { renderNotes } from './notes.js';
import { copyToClipboard } from './utils.js';

let snippets = load(KEYS.snippets, getDefaultSnippets());
let bookmarks = load(KEYS.bookmarks, getDefaultBookmarks());
let notes = load(KEYS.notes, getDefaultNotes());

if (!localStorage.getItem(KEYS.snippets)) save(KEYS.snippets, snippets);
if (!localStorage.getItem(KEYS.bookmarks)) save(KEYS.bookmarks, bookmarks);
if (!localStorage.getItem(KEYS.notes)) save(KEYS.notes, notes);

let currentTab = 'snippets';
let filters = { snippets: 'all', bookmarks: 'all', notes: 'all' };
let sortBy = 'default';
let searchQuery = '';
let searchOpen = false;
let editingId = null;

function init() {
    initTheme();
    setGreeting();
    initConfirm();
    handleURLParams();
    registerSW();
    setupSidebar();
    setupTabs();
    setupSearch();
    setupSort();
    setupFAB();
    setupModals();
    setupEditListeners();
    setupQRListener();
    setupHistoryListener();
    setupInstallBanner();
    render();
    document.addEventListener('dv:render', render);
}

function registerSW() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(r => console.log('[SW] OK:', r.scope))
            .catch(e => console.warn('[SW] Fail:', e));
    }
}

function handleURLParams() {
    const p = new URLSearchParams(window.location.search);
    const tab = p.get('tab');
    if (tab && ['snippets', 'bookmarks', 'notes'].includes(tab)) currentTab = tab;
}

function render() {
    renderSnippets(snippets, filters.snippets, searchQuery, updateStats, sortBy);
    renderBookmarks(bookmarks, filters.bookmarks, searchQuery, updateStats, sortBy);
    renderNotes(notes, filters.notes, searchQuery, updateStats, sortBy);
    updateStats();
    updateChips();
}

function updateStats() {
    $('#stSnippets').textContent = snippets.length;
    $('#stBookmarks').textContent = bookmarks.length;
    $('#stNotes').textContent = notes.length;
    $('#stCopied').textContent = getCopyCount();
    $('#badgeSnippets').textContent = snippets.length;
    $('#badgeBookmarks').textContent = bookmarks.length;
    $('#badgeNotes').textContent = notes.length;
    $('#dotBookmarks').classList.toggle('visible', bookmarks.some(b => !b.read));
}

function updateChips() {
    const c = { snippets: 'snippetChips', bookmarks: 'bookmarkChips', notes: 'noteChips' };
    Object.entries(c).forEach(([k, id]) => { $$(`#${id} .chip`).forEach(ch => ch.classList.toggle('active', ch.dataset.f === filters[k])); });
}

// ==================== SIDEBAR ====================
function setupSidebar() {
    const sb = $('#sidebar'), ov = $('#overlay');
    const close = () => { sb.classList.remove('open'); ov.classList.remove('active'); };

    $('#menuBtn').addEventListener('click', () => { sb.classList.add('open'); ov.classList.add('active'); });
    ov.addEventListener('click', close);

    let sx = 0;
    sb.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    sb.addEventListener('touchmove', e => { if (sx - e.touches[0].clientX > 60) close(); }, { passive: true });

    // Theme toggle
    $('#themeToggle')?.addEventListener('click', toggleTheme);

    // Nav
    $$('.nav-item[data-nav]').forEach(item => {
        item.addEventListener('click', () => {
            const n = item.dataset.nav;
            if (['snippets', 'bookmarks', 'notes'].includes(n)) { switchTab(n); filters[n] = 'all'; }
            else if (n === 'favorites') { filters[currentTab] = 'fav'; }
            else if (n === 'unread') { switchTab('bookmarks'); filters.bookmarks = 'unread'; }
            else if (n === 'priority') { filters[currentTab] = 'high'; }
            else if (n === 'history') { document.dispatchEvent(new CustomEvent('dv:show-history')); close(); return; }
            render(); close();
        });
    });

    $$('.nav-item[data-tag]').forEach(item => {
        item.addEventListener('click', () => {
            const tag = item.dataset.tag;
            if (bookmarks.some(b => b.cat === tag || b.tags.includes(tag))) { switchTab('bookmarks'); filters.bookmarks = tag; }
            else if (snippets.some(s => s.cat === tag)) { switchTab('snippets'); filters.snippets = tag; }
            render(); close();
        });
    });

    $$('.nav-item[data-action]').forEach(item => {
        item.addEventListener('click', () => {
            if (item.dataset.action === 'export') { exportAll(snippets, bookmarks, notes); showToast('Export réussi 📦'); }
            if (item.dataset.action === 'import') $('#importFile').click();
            close();
        });
    });

    $('#importFile').addEventListener('change', e => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                const d = JSON.parse(ev.target.result); let c = 0;
                if (d.snippets) { d.snippets.forEach(s => { if (!snippets.find(x => x.id === s.id)) { snippets.push(s); c++; } }); save(KEYS.snippets, snippets); }
                if (d.bookmarks) { d.bookmarks.forEach(b => { if (!bookmarks.find(x => x.id === b.id)) { bookmarks.push(b); c++; } }); save(KEYS.bookmarks, bookmarks); }
                if (d.notes) { d.notes.forEach(n => { if (!notes.find(x => x.id === n.id)) { notes.push(n); c++; } }); save(KEYS.notes, notes); }
                render(); showToast(`${c} éléments importés 🎉`);
            } catch { showToast('Fichier invalide ❌'); }
        };
        reader.readAsText(file); $('#importFile').value = '';
    });
}

// ==================== TABS ====================
function setupTabs() {
    $$('.bottom-nav-item').forEach(btn => btn.addEventListener('click', () => { switchTab(btn.dataset.tab); render(); }));
    $$('#snippetChips .chip').forEach(c => c.addEventListener('click', () => { filters.snippets = c.dataset.f; render(); }));
    $$('#bookmarkChips .chip').forEach(c => c.addEventListener('click', () => { filters.bookmarks = c.dataset.f; render(); }));
    $$('#noteChips .chip').forEach(c => c.addEventListener('click', () => { filters.notes = c.dataset.f; render(); }));
}

function switchTab(tab) {
    currentTab = tab;
    $$('.page').forEach(p => p.classList.remove('active'));
    $(`#page${cap(tab)}`).classList.add('active');
    $$('.bottom-nav-item').forEach(b => b.classList.remove('active'));
    $(`.bottom-nav-item[data-tab="${tab}"]`).classList.add('active');
    $('#headerTitle').textContent = { snippets: 'Snippets', bookmarks: 'Bookmarks', notes: 'Notes' }[tab];
}

// ==================== SEARCH ====================
function setupSearch() {
    $('#searchBtn').addEventListener('click', () => {
        searchOpen = !searchOpen;
        $('#searchBar').classList.toggle('active', searchOpen);
        $('#main').classList.toggle('search-open', searchOpen);
        if (searchOpen) $('#searchInput').focus();
        else { $('#searchInput').value = ''; searchQuery = ''; render(); }
    });
    $('#searchInput').addEventListener('input', e => { searchQuery = e.target.value.toLowerCase().trim(); render(); });
    $('#searchClear').addEventListener('click', () => { $('#searchInput').value = ''; searchQuery = ''; render(); $('#searchInput').focus(); });
}

// ==================== SORT ====================
function setupSort() {
    const menu = $('#sortMenu');
    $('#sortBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('active');
    });
    document.addEventListener('click', () => menu?.classList.remove('active'));

    $$('.sort-option').forEach(opt => {
        opt.addEventListener('click', () => {
            sortBy = opt.dataset.sort;
            $$('.sort-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            menu.classList.remove('active');
            render();
            showToast(`Tri : ${opt.textContent.trim()}`);
        });
    });
}

// ==================== FAB ====================
function setupFAB() {
    $('#fab').addEventListener('click', () => {
        editingId = null;
        const modals = { snippets: 'modalSnippet', bookmarks: 'modalBookmark', notes: 'modalNote' };
        const modal = $(`#${modals[currentTab]}`);
        // Reset form title
        modal.querySelector('.modal-head h2').textContent = currentTab === 'snippets' ? 'Nouveau snippet' : currentTab === 'bookmarks' ? 'Nouveau lien' : 'Nouvelle note';
        modal.classList.add('active');
    });
}

// ==================== MODALS ====================
const bmTags = { ref: null };
const noteTags = { ref: null };

function setupModals() {
    $$('.modal-x').forEach(btn => btn.addEventListener('click', () => { $(`#${btn.dataset.close}`).classList.remove('active'); editingId = null; }));
    $$('.modal-overlay').forEach(mo => mo.addEventListener('click', e => { if (e.target === mo) { mo.classList.remove('active'); editingId = null; } }));

    bmTags.ref = setupTagsInput('inBmTags', 'bmTagsWrap');
    noteTags.ref = setupTagsInput('inNoteTags', 'noteTagsWrap');

    // Snippet submit
    $('#submitSnippet').addEventListener('click', () => {
        const name = $('#inSnipName').value.trim();
        const code = $('#inSnipCode').value.trim();
        if (!name || !code) { showToast('Remplissez tout'); return; }

        if (editingId) {
            const s = snippets.find(x => x.id === editingId);
            if (s) { s.name = name; s.cat = $('#inSnipCat').value; s.code = code; }
            showToast('Snippet modifié ✏️');
        } else {
            snippets.unshift({ id: uid(), name, cat: $('#inSnipCat').value, fav: false, pinned: false, lastCopied: null, createdAt: new Date().toISOString(), code });
            showToast('Snippet ajouté ✨');
        }
        save(KEYS.snippets, snippets);
        $('#modalSnippet').classList.remove('active');
        $('#inSnipName').value = ''; $('#inSnipCode').value = '';
        editingId = null; render();
    });

    // Bookmark submit
    $('#submitBookmark').addEventListener('click', () => {
        const title = $('#inBmTitle').value.trim();
        let url = $('#inBmUrl').value.trim();
        if (!title || !url) { showToast('Titre et URL requis'); return; }
        if (!url.startsWith('http')) url = 'https://' + url;

        if (editingId) {
            const b = bookmarks.find(x => x.id === editingId);
            if (b) { b.title = title; b.url = url; b.desc = $('#inBmDesc').value.trim(); b.cat = $('#inBmCat').value; b.tags = bmTags.ref.getTags(); b.priority = $('#inBmPrio').value; }
            showToast('Lien modifié ✏️');
        } else {
            bookmarks.unshift({ id: uid(), title, url, desc: $('#inBmDesc').value.trim(), cat: $('#inBmCat').value, tags: bmTags.ref.getTags(), priority: $('#inBmPrio').value, fav: false, pinned: false, read: false, createdAt: new Date().toISOString() });
            showToast('Lien sauvegardé 🔗');
        }
        save(KEYS.bookmarks, bookmarks);
        $('#modalBookmark').classList.remove('active');
        $('#inBmTitle').value = ''; $('#inBmUrl').value = ''; $('#inBmDesc').value = '';
        bmTags.ref.reset(); editingId = null; render();
    });

    // Note submit
    $('#submitNote').addEventListener('click', () => {
        const title = $('#inNoteTitle').value.trim();
        const body = $('#inNoteBody').value.trim();
        if (!title || !body) { showToast('Titre et contenu requis'); return; }

        if (editingId) {
            const n = notes.find(x => x.id === editingId);
            if (n) { n.title = title; n.body = body; n.tags = noteTags.ref.getTags(); n.priority = $('#inNotePrio').value; }
            showToast('Note modifiée ✏️');
        } else {
            notes.unshift({ id: uid(), title, body, tags: noteTags.ref.getTags(), priority: $('#inNotePrio').value, fav: false, pinned: false, createdAt: new Date().toISOString() });
            showToast('Note sauvegardée 📝');
        }
        save(KEYS.notes, notes);
        $('#modalNote').classList.remove('active');
        $('#inNoteTitle').value = ''; $('#inNoteBody').value = '';
        noteTags.ref.reset(); editingId = null; render();
    });

    // Auto-fetch title on URL blur
    $('#inBmUrl').addEventListener('blur', async () => {
        const url = $('#inBmUrl').value.trim();
        const titleInput = $('#inBmTitle');
        if (url && !titleInput.value.trim()) {
            titleInput.placeholder = 'Chargement du titre...';
            const title = await fetchUrlTitle(url);
            if (title && !titleInput.value.trim()) {
                titleInput.value = title;
                titleInput.placeholder = 'Titre';
                showToast('Titre récupéré auto ✨');
            } else {
                titleInput.placeholder = 'Ex: GPT-5 annoncé';
            }
        }
    });
}

// ==================== EDIT LISTENERS ====================
function setupEditListeners() {
    document.addEventListener('dv:edit-snippet', e => {
        const s = e.detail;
        editingId = s.id;
        $('#inSnipName').value = s.name;
        $('#inSnipCat').value = s.cat;
        $('#inSnipCode').value = s.code;
        $('#modalSnippet').querySelector('.modal-head h2').textContent = '✏️ Modifier snippet';
        $('#modalSnippet').classList.add('active');
    });

    document.addEventListener('dv:edit-bookmark', e => {
        const b = e.detail;
        editingId = b.id;
        $('#inBmTitle').value = b.title;
        $('#inBmUrl').value = b.url;
        $('#inBmDesc').value = b.desc || '';
        $('#inBmCat').value = b.cat;
        $('#inBmPrio').value = b.priority;
        bmTags.ref.reset();
        bmTags.ref.setTags(b.tags || []);
        $('#modalBookmark').querySelector('.modal-head h2').textContent = '✏️ Modifier lien';
        $('#modalBookmark').classList.add('active');
    });

    document.addEventListener('dv:edit-note', e => {
        const n = e.detail;
        editingId = n.id;
        $('#inNoteTitle').value = n.title;
        $('#inNoteBody').value = n.body;
        $('#inNotePrio').value = n.priority;
        noteTags.ref.reset();
        noteTags.ref.setTags(n.tags || []);
        $('#modalNote').querySelector('.modal-head h2').textContent = '✏️ Modifier note';
        $('#modalNote').classList.add('active');
    });
}

// ==================== QR CODE ====================
function setupQRListener() {
    document.addEventListener('dv:show-qr', e => {
        const { url, title } = e.detail;
        const qrImg = generateQR(url);
        $('#qrModal').classList.add('active');
        $('#qrImage').src = qrImg;
        $('#qrTitle').textContent = title;
        $('#qrUrl').textContent = url;
    });
}

// ==================== HISTORY ====================
function setupHistoryListener() {
    document.addEventListener('dv:show-history', () => {
        const history = getHistory();
        const list = $('#historyList');

        if (!history.length) {
            list.innerHTML = '<div class="empty-state visible" style="padding:30px"><span class="material-symbols-outlined">history</span><h3>Aucun historique</h3><p>Vos copies apparaîtront ici</p></div>';
        } else {
            list.innerHTML = history.map(h => `
                <div class="history-item">
                    <div class="s-card-icon ${h.type === 'snippet' ? 'css' : 'link'}" style="width:30px;height:30px">
                        <span class="material-symbols-outlined" style="font-size:16px">${h.type === 'snippet' ? 'code' : 'link'}</span>
                    </div>
                    <div class="history-item-info">
                        <h4>${h.name || h.title || 'Sans nom'}</h4>
                        <small>${new Date(h.copiedAt).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small>
                    </div>
                    <button class="history-recopy" data-history-text="${(h.preview || '').replace(/"/g, '&quot;')}">Recopier</button>
                </div>
            `).join('');
        }

        $('#historyModal').classList.add('active');

        // Bind recopy buttons
        document.querySelectorAll('[data-history-text]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const text = btn.dataset.historyText;
                // Find the full snippet
                const item = history.find(h => h.preview === text);
                if (item && item.type === 'snippet') {
                    const s = snippets.find(x => x.id === item.id);
                    if (s) { await copyToClipboard(s.code); showToast('Recopié ! 🚀'); return; }
                }
                await copyToClipboard(text);
                showToast('Recopié !');
            });
        });
    });

    $('#clearHistory')?.addEventListener('click', () => {
        clearHistory();
        showToast('Historique vidé');
        $('#historyModal').classList.remove('active');
    });
}

// ==================== INSTALL ====================
let deferredPrompt;
function setupInstallBanner() {
    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault(); deferredPrompt = e;
        setTimeout(() => $('#installBanner')?.classList.add('visible'), 3000);
    });
    $('#installBtn')?.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        $('#installBanner').classList.remove('visible');
        if (outcome === 'accepted') showToast('Installé 🎉');
    });
    $('#installDismiss')?.addEventListener('click', () => $('#installBanner').classList.remove('visible'));
}

document.addEventListener('DOMContentLoaded', init);