import { $, esc, highlight, catIcon, catLabel, copyToClipboard, showToast, showConfirm, sortItems } from './utils.js';
import { KEYS, save, incrementCopyCount, addToHistory } from './data.js';

export function renderSnippets(snippets, filter, searchQuery, updateStatsFn, sortBy = 'default') {
    let data = [...snippets];

    if (filter === 'fav') data = data.filter(s => s.fav);
    else if (filter !== 'all') data = data.filter(s => s.cat === filter);

    if (searchQuery) {
        data = data.filter(s =>
            s.name.toLowerCase().includes(searchQuery) ||
            s.code.toLowerCase().includes(searchQuery) ||
            s.cat.includes(searchQuery)
        );
    }

    if (sortBy !== 'default') data = sortItems(data, sortBy);

    // Pinned first
    data.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

    $('#secSnippetCount').textContent = `${data.length} snippet${data.length !== 1 ? 's' : ''}`;

    if (!data.length) {
        $('#snippetList').innerHTML = '';
        $('#emptySnippets').classList.add('visible');
        return;
    }
    $('#emptySnippets').classList.remove('visible');

    $('#snippetList').innerHTML = data.map(s => {
        const hl = highlight(s.code, s.cat);
        const long = s.code.split('\n').length > 7;
        const lines = s.code.split('\n').length;

        return `<div class="s-card ${s.pinned ? 'pinned' : ''}" data-id="${s.id}">
            <span class="pin-badge">📌 Épinglé</span>
            <div class="s-card-head">
                <div class="s-card-meta">
                    <div class="s-card-icon ${s.cat}"><span class="material-symbols-outlined">${catIcon(s.cat)}</span></div>
                    <div class="s-card-info">
                        <h3>${esc(s.name)}</h3>
                        <small>${catLabel(s.cat)} · ${lines} lignes${s.lastCopied ? ' · copié ' + new Date(s.lastCopied).toLocaleDateString('fr') : ''}</small>
                    </div>
                </div>
                <div class="s-card-actions">
                    <button class="s-action ${s.pinned ? 'pin-active' : ''}" data-pin="${s.id}" title="Épingler">
                        <span class="material-symbols-outlined">push_pin</span>
                    </button>
                    <button class="s-action ${s.fav ? 'fav-active' : ''}" data-fav="${s.id}">
                        <span class="material-symbols-outlined">${s.fav ? 'favorite' : 'favorite_border'}</span>
                    </button>
                    <button class="s-action" data-edit-snippet="${s.id}" title="Éditer">
                        <span class="material-symbols-outlined">edit</span>
                    </button>
                    <button class="s-action" data-share="${s.id}">
                        <span class="material-symbols-outlined">share</span>
                    </button>
                    <button class="s-action" data-del-snippet="${s.id}">
                        <span class="material-symbols-outlined">delete_outline</span>
                    </button>
                </div>
            </div>
            <div class="s-card-tags"><span class="s-tag ${s.cat}">${s.cat.toUpperCase()}</span></div>
            <div class="s-code ${long ? 'collapsed' : ''}" id="sc-${s.id}">
                <div class="s-code-bar">
                    <span class="s-code-lang">${catLabel(s.cat)}</span>
                    <button class="copy-btn" data-copy="${s.id}">
                        <span class="material-symbols-outlined">content_copy</span>Copier
                    </button>
                </div>
                <pre><code>${hl}</code></pre>
                ${long ? `<button class="expand-btn" data-expand="${s.id}"><span class="material-symbols-outlined">expand_more</span><span>Voir tout</span></button>` : ''}
            </div>
            <button class="s-copy-full" data-copy-full="${s.id}"><span class="material-symbols-outlined">content_copy</span>Copier le code complet</button>
        </div>`;
    }).join('');

    bindSnippetEvents(snippets, updateStatsFn);
}

function bindSnippetEvents(snippets, updateStatsFn) {
    // Copy
    document.querySelectorAll('[data-copy], [data-copy-full]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.copy || btn.dataset.copyFull;
            const s = snippets.find(x => x.id === id);
            if (!s) return;
            const ok = await copyToClipboard(s.code);
            if (ok) {
                s.lastCopied = new Date().toISOString();
                save(KEYS.snippets, snippets);
                incrementCopyCount();
                addToHistory({ type: 'snippet', id: s.id, name: s.name, preview: s.code.substring(0, 80) });
                updateStatsFn();
                const orig = btn.innerHTML;
                btn.classList.add('copied');
                btn.innerHTML = '<span class="material-symbols-outlined">check</span>Copié !';
                setTimeout(() => { btn.classList.remove('copied'); btn.innerHTML = orig; }, 2000);
                showToast('Code copié ! 🚀');
            }
        });
    });

    // Pin
    document.querySelectorAll('[data-pin]').forEach(btn => {
        btn.addEventListener('click', () => {
            const s = snippets.find(x => x.id === btn.dataset.pin);
            if (s) { s.pinned = !s.pinned; save(KEYS.snippets, snippets); updateStatsFn(); document.dispatchEvent(new CustomEvent('dv:render')); showToast(s.pinned ? 'Épinglé 📌' : 'Désépinglé'); }
        });
    });

    // Favorite
    document.querySelectorAll('[data-fav]').forEach(btn => {
        btn.addEventListener('click', () => {
            const s = snippets.find(x => x.id === btn.dataset.fav);
            if (s) { s.fav = !s.fav; save(KEYS.snippets, snippets); updateStatsFn(); document.dispatchEvent(new CustomEvent('dv:render')); }
        });
    });

    // Edit
    document.querySelectorAll('[data-edit-snippet]').forEach(btn => {
        btn.addEventListener('click', () => {
            const s = snippets.find(x => x.id === btn.dataset.editSnippet);
            if (!s) return;
            document.dispatchEvent(new CustomEvent('dv:edit-snippet', { detail: s }));
        });
    });

    // Delete
    document.querySelectorAll('[data-del-snippet]').forEach(btn => {
        btn.addEventListener('click', () => {
            showConfirm('Supprimer ?', 'Ce snippet sera perdu.', () => {
                const idx = snippets.findIndex(x => x.id === btn.dataset.delSnippet);
                if (idx > -1) { snippets.splice(idx, 1); save(KEYS.snippets, snippets); updateStatsFn(); document.dispatchEvent(new CustomEvent('dv:render')); showToast('Supprimé'); }
            });
        });
    });

    // Expand
    document.querySelectorAll('[data-expand]').forEach(btn => {
        btn.addEventListener('click', () => {
            const block = $(`#sc-${btn.dataset.expand}`);
            if (block) { block.classList.toggle('collapsed'); btn.querySelector('span:last-child').textContent = block.classList.contains('collapsed') ? 'Voir tout' : 'Réduire'; }
        });
    });

    // Share
    document.querySelectorAll('[data-share]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const s = snippets.find(x => x.id === btn.dataset.share);
            if (!s) return;
            if (navigator.share) { try { await navigator.share({ title: s.name, text: s.code }); } catch {} }
            else { await copyToClipboard(s.code); showToast('Code copié'); }
        });
    });
}