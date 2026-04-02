import { $, esc, timeAgo, copyToClipboard, showToast, showConfirm, sortItems } from './utils.js';
import { KEYS, save } from './data.js';

export function renderNotes(notes, filter, searchQuery, updateStatsFn, sortBy = 'default') {
    let data = [...notes];

    if (filter === 'fav') data = data.filter(n => n.fav);
    else if (['high', 'medium', 'low'].includes(filter)) data = data.filter(n => n.priority === filter);

    if (searchQuery) {
        data = data.filter(n => n.title.toLowerCase().includes(searchQuery) || n.body.toLowerCase().includes(searchQuery) || n.tags.some(t => t.includes(searchQuery)));
    }

    if (sortBy !== 'default') data = sortItems(data, sortBy);
    else { const p = { high: 0, medium: 1, low: 2 }; data.sort((a, b) => p[a.priority] - p[b.priority]); }

    data.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

    $('#secNoteCount').textContent = `${data.length} note${data.length !== 1 ? 's' : ''}`;

    if (!data.length) { $('#noteList').innerHTML = ''; $('#emptyNotes').classList.add('visible'); return; }
    $('#emptyNotes').classList.remove('visible');

    $('#noteList').innerHTML = data.map(n => {
        const long = n.body.split('\n').length > 5;
        return `<div class="note-card ${n.pinned ? 'pinned' : ''}" data-id="${n.id}">
            <div class="note-card-head">
                <div style="display:flex;align-items:center;gap:8px">
                    <div class="priority-dot ${n.priority}"></div>
                    <h3>${esc(n.title)}</h3>
                </div>
                <div class="s-card-actions">
                    <button class="s-action ${n.pinned ? 'pin-active' : ''}" data-note-pin="${n.id}"><span class="material-symbols-outlined">push_pin</span></button>
                    <button class="s-action ${n.fav ? 'fav-active' : ''}" data-note-fav="${n.id}"><span class="material-symbols-outlined">${n.fav ? 'favorite' : 'favorite_border'}</span></button>
                    <button class="s-action" data-edit-note="${n.id}"><span class="material-symbols-outlined">edit</span></button>
                    <button class="s-action" data-note-copy="${n.id}"><span class="material-symbols-outlined">content_copy</span></button>
                    <button class="s-action" data-note-del="${n.id}"><span class="material-symbols-outlined">delete_outline</span></button>
                </div>
            </div>
            <div class="note-card-body ${long ? 'clamped' : ''}" data-note-toggle="${n.id}">${esc(n.body)}</div>
            <div class="note-card-foot">
                <div class="bm-tags">${n.tags.map(t => `<span class="s-tag note-tag">${t}</span>`).join('')}</div>
                <span class="note-date">${timeAgo(n.createdAt)}</span>
            </div>
        </div>`;
    }).join('');

    bindNoteEvents(notes, updateStatsFn);
}

function bindNoteEvents(notes, updateStatsFn) {
    document.querySelectorAll('[data-note-toggle]').forEach(el => { el.addEventListener('click', () => el.classList.toggle('clamped')); });

    document.querySelectorAll('[data-note-pin]').forEach(btn => {
        btn.addEventListener('click', () => {
            const n = notes.find(x => x.id === btn.dataset.notePin);
            if (n) { n.pinned = !n.pinned; save(KEYS.notes, notes); updateStatsFn(); document.dispatchEvent(new CustomEvent('dv:render')); showToast(n.pinned ? 'Épinglé 📌' : 'Désépinglé'); }
        });
    });

    document.querySelectorAll('[data-note-fav]').forEach(btn => {
        btn.addEventListener('click', () => {
            const n = notes.find(x => x.id === btn.dataset.noteFav);
            if (n) { n.fav = !n.fav; save(KEYS.notes, notes); updateStatsFn(); document.dispatchEvent(new CustomEvent('dv:render')); }
        });
    });

    document.querySelectorAll('[data-edit-note]').forEach(btn => {
        btn.addEventListener('click', () => {
            const n = notes.find(x => x.id === btn.dataset.editNote);
            if (n) document.dispatchEvent(new CustomEvent('dv:edit-note', { detail: n }));
        });
    });

    document.querySelectorAll('[data-note-copy]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const n = notes.find(x => x.id === btn.dataset.noteCopy);
            if (n) { await copyToClipboard(`${n.title}\n\n${n.body}`); showToast('Note copiée 📝'); }
        });
    });

    document.querySelectorAll('[data-note-del]').forEach(btn => {
        btn.addEventListener('click', () => {
            showConfirm('Supprimer ?', 'Irréversible.', () => {
                const idx = notes.findIndex(x => x.id === btn.dataset.noteDel);
                if (idx > -1) { notes.splice(idx, 1); save(KEYS.notes, notes); updateStatsFn(); document.dispatchEvent(new CustomEvent('dv:render')); showToast('Supprimée'); }
            });
        });
    });
}