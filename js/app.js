import { $, $$, uid, cap, setGreeting, showToast, showConfirm, initConfirm, setupTagsInput } from './utils.js';
import { KEYS, load, save, getCopyCount, getDefaultSnippets, getDefaultBookmarks, getDefaultNotes, exportAll } from './data.js';
import { renderSnippets } from './snippets.js';
import { renderBookmarks } from './bookmarks.js';
import { renderNotes } from './notes.js';

// ==================== STATE ====================
let snippets = load(KEYS.snippets, getDefaultSnippets());
let bookmarks = load(KEYS.bookmarks, getDefaultBookmarks());
let notes = load(KEYS.notes, getDefaultNotes());

if (!localStorage.getItem(KEYS.snippets)) save(KEYS.snippets, snippets);
if (!localStorage.getItem(KEYS.bookmarks)) save(KEYS.bookmarks, bookmarks);
if (!localStorage.getItem(KEYS.notes)) save(KEYS.notes, notes);

let currentTab = 'snippets';
let filters = { snippets: 'all', bookmarks: 'all', notes: 'all' };
let searchQuery = '';
let searchOpen = false;

// ==================== INIT ====================
function init() {
    setGreeting();
    initConfirm();
    handleURLParams();
    registerSW();
    setupSidebar();
    setupTabs();
    setupSearch();
    setupFAB();
    setupModals();
    setupInstallBanner();
    render();
    document.addEventListener('dv:render', render);
}

// ==================== SERVICE WORKER ====================
function registerSW() {
    if ('serviceWorker' in navigator) {
        // Chemin RELATIF — fonctionne partout
        navigator.serviceWorker.register('./sw.js')
            .then(reg => {
                console.log('[App] SW registered, scope:', reg.scope);
                reg.addEventListener('updatefound', () => {
                    const nw = reg.installing;
                    nw.addEventListener('statechange', () => {
                        if (nw.state === 'activated') {
                            showToast('Mise à jour installée ! 🎉');
                        }
                    });
                });
            })
            .catch(err => console.warn('[App] SW failed:', err));
    }
}

// ==================== URL PARAMS ====================
function handleURLParams() {
    const p = new URLSearchParams(window.location.search);
    const tab = p.get('tab');
    if (tab && ['snippets', 'bookmarks', 'notes'].includes(tab)) {
        currentTab = tab;
    }
}

// ==================== RENDER ====================
function render() {
    renderSnippets(snippets, filters.snippets, searchQuery, updateStats);
    renderBookmarks(bookmarks, filters.bookmarks, searchQuery, updateStats);
    renderNotes(notes, filters.notes, searchQuery, updateStats);
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
    const unread = bookmarks.filter(b => !b.read).length;
    $('#dotBookmarks').classList.toggle('visible', unread > 0);
}

function updateChips() {
    const containers = { snippets: 'snippetChips', bookmarks: 'bookmarkChips', notes: 'noteChips' };
    Object.entries(containers).forEach(([key, id]) => {
        $$(`#${id} .chip`).forEach(c => {
            c.classList.toggle('active', c.dataset.f === filters[key]);
        });
    });
}

// ==================== SIDEBAR ====================
function setupSidebar() {
    const sidebar = $('#sidebar');
    const overlay = $('#overlay');

    const closeSB = () => { sidebar.classList.remove('open'); overlay.classList.remove('active'); };

    $('#menuBtn').addEventListener('click', () => { sidebar.classList.add('open'); overlay.classList.add('active'); });
    overlay.addEventListener('click', closeSB);

    let sx = 0;
    sidebar.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    sidebar.addEventListener('touchmove', e => { if (sx - e.touches[0].clientX > 60) closeSB(); }, { passive: true });

    $$('.nav-item[data-nav]').forEach(item => {
        item.addEventListener('click', () => {
            const nav = item.dataset.nav;
            if (['snippets', 'bookmarks', 'notes'].includes(nav)) { switchTab(nav); filters[nav] = 'all'; }
            else if (nav === 'favorites') { filters[currentTab] = 'fav'; }
            else if (nav === 'unread') { switchTab('bookmarks'); filters.bookmarks = 'unread'; }
            else if (nav === 'priority') { filters[currentTab] = 'high'; }
            render(); closeSB();
        });
    });

    $$('.nav-item[data-tag]').forEach(item => {
        item.addEventListener('click', () => {
            const tag = item.dataset.tag;
            const hasBm = bookmarks.some(b => b.cat === tag || b.tags.includes(tag));
            const hasSnip = snippets.some(s => s.cat === tag);
            if (hasBm) { switchTab('bookmarks'); filters.bookmarks = tag; }
            else if (hasSnip) { switchTab('snippets'); filters.snippets = tag; }
            render(); closeSB();
        });
    });

    $$('.nav-item[data-action]').forEach(item => {
        item.addEventListener('click', () => {
            if (item.dataset.action === 'export') { exportAll(snippets, bookmarks, notes); showToast('Export réussi 📦'); }
            if (item.dataset.action === 'import') { $('#importFile').click(); }
            closeSB();
        });
    });

    $('#importFile').addEventListener('change', e => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                const d = JSON.parse(ev.target.result);
                let count = 0;
                if (d.snippets) { d.snippets.forEach(s => { if (!snippets.find(x => x.id === s.id)) { snippets.push(s); count++; } }); save(KEYS.snippets, snippets); }
                if (d.bookmarks) { d.bookmarks.forEach(b => { if (!bookmarks.find(x => x.id === b.id)) { bookmarks.push(b); count++; } }); save(KEYS.bookmarks, bookmarks); }
                if (d.notes) { d.notes.forEach(n => { if (!notes.find(x => x.id === n.id)) { notes.push(n); count++; } }); save(KEYS.notes, notes); }
                render(); showToast(`${count} éléments importés 🎉`);
            } catch { showToast('Fichier invalide ❌'); }
        };
        reader.readAsText(file);
        $('#importFile').value = '';
    });
}

// ==================== TABS ====================
function setupTabs() {
    $$('.bottom-nav-item').forEach(btn => { btn.addEventListener('click', () => { switchTab(btn.dataset.tab); render(); }); });
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
    const titles = { snippets: 'Snippets', bookmarks: 'Bookmarks', notes: 'Notes' };
    $('#headerTitle').textContent = titles[tab];
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

// ==================== FAB ====================
function setupFAB() {
    $('#fab').addEventListener('click', () => {
        const modals = { snippets: 'modalSnippet', bookmarks: 'modalBookmark', notes: 'modalNote' };
        $(`#${modals[currentTab]}`).classList.add('active');
    });
}

// ==================== MODALS ====================
function setupModals() {
    $$('.modal-x').forEach(btn => { btn.addEventListener('click', () => $(`#${btn.dataset.close}`).classList.remove('active')); });
    $$('.modal-overlay').forEach(mo => { mo.addEventListener('click', e => { if (e.target === mo) mo.classList.remove('active'); }); });

    const bmTags = setupTagsInput('inBmTags', 'bmTagsWrap');
    const noteTags = setupTagsInput('inNoteTags', 'noteTagsWrap');

    $('#submitSnippet').addEventListener('click', () => {
        const name = $('#inSnipName').value.trim();
        const code = $('#inSnipCode').value.trim();
        if (!name || !code) { showToast('Remplissez tous les champs'); return; }
        snippets.unshift({ id: uid(), name, cat: $('#inSnipCat').value, fav: false, lastCopied: null, code });
        save(KEYS.snippets, snippets);
        $('#modalSnippet').classList.remove('active');
        $('#inSnipName').value = ''; $('#inSnipCode').value = '';
        render(); showToast('Snippet ajouté ✨');
    });

    $('#submitBookmark').addEventListener('click', () => {
        const title = $('#inBmTitle').value.trim();
        let url = $('#inBmUrl').value.trim();
        if (!title || !url) { showToast('Titre et URL requis'); return; }
        if (!url.startsWith('http')) url = 'https://' + url;
        bookmarks.unshift({ id: uid(), title, url, desc: $('#inBmDesc').value.trim(), cat: $('#inBmCat').value, tags: bmTags.getTags(), priority: $('#inBmPrio').value, fav: false, read: false, createdAt: new Date().toISOString() });
        save(KEYS.bookmarks, bookmarks);
        $('#modalBookmark').classList.remove('active');
        $('#inBmTitle').value = ''; $('#inBmUrl').value = ''; $('#inBmDesc').value = '';
        bmTags.reset(); render(); showToast('Lien sauvegardé 🔗');
    });

    $('#submitNote').addEventListener('click', () => {
        const title = $('#inNoteTitle').value.trim();
        const body = $('#inNoteBody').value.trim();
        if (!title || !body) { showToast('Titre et contenu requis'); return; }
        notes.unshift({ id: uid(), title, body, tags: noteTags.getTags(), priority: $('#inNotePrio').value, fav: false, createdAt: new Date().toISOString() });
        save(KEYS.notes, notes);
        $('#modalNote').classList.remove('active');
        $('#inNoteTitle').value = ''; $('#inNoteBody').value = '';
        noteTags.reset(); render(); showToast('Note sauvegardée 📝');
    });
}

// ==================== INSTALL BANNER ====================
let deferredPrompt;

function setupInstallBanner() {
    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        deferredPrompt = e;
        setTimeout(() => { $('#installBanner')?.classList.add('visible'); }, 3000);
    });

    $('#installBtn')?.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        $('#installBanner').classList.remove('visible');
        if (outcome === 'accepted') showToast('DevVault installé 🎉');
    });

    $('#installDismiss')?.addEventListener('click', () => { $('#installBanner').classList.remove('visible'); });

    window.addEventListener('appinstalled', () => {
        showToast('DevVault installé 🎉');
        $('#installBanner')?.classList.remove('visible');
    });
}

// ==================== GO ====================
document.addEventListener('DOMContentLoaded', init);