import { $, esc, getDomain, catIcon, copyToClipboard, showToast, showConfirm } from './utils.js';
import { KEYS, save } from './data.js';

export function renderBookmarks(bookmarks, filter, searchQuery, updateStatsFn) {
    let data = [...bookmarks];

    if (filter === 'fav') data = data.filter(b => b.fav);
    else if (filter === 'unread') data = data.filter(b => !b.read);
    else if (filter === 'high') data = data.filter(b => b.priority === 'high');
    else if (filter !== 'all') data = data.filter(b => b.cat === filter || b.tags.includes(filter));

    if (searchQuery) {
        data = data.filter(b =>
            b.title.toLowerCase().includes(searchQuery) ||
            b.desc.toLowerCase().includes(searchQuery) ||
            b.url.toLowerCase().includes(searchQuery) ||
            b.tags.some(t => t.includes(searchQuery))
        );
    }

    // Sort by priority
    const pMap = { high: 0, medium: 1, low: 2 };
    data.sort((a, b) => pMap[a.priority] - pMap[b.priority]);

    $('#secBmCount').textContent = `${data.length} lien${data.length !== 1 ? 's' : ''}`;

    if (!data.length) {
        $('#bookmarkList').innerHTML = '';
        $('#emptyBookmarks').classList.add('visible');
        return;
    }

    $('#emptyBookmarks').classList.remove('visible');

    $('#bookmarkList').innerHTML = data.map(b => {
        const domain = getDomain(b.url);
        return `<div class="bm-card" style="opacity:${b.read ? 0.65 : 1}" data-id="${b.id}">
            <div class="bm-top">
                <div class="bm-icon-wrap s-card-icon ${b.cat}">
                    <span class="material-symbols-outlined">${catIcon(b.cat)}</span>
                </div>
                <div class="bm-content">
                    <div class="bm-title">${esc(b.title)}</div>
                    <span class="bm-url">${domain}</span>
                    ${b.desc ? `<div class="bm-desc">${esc(b.desc)}</div>` : ''}
                </div>
                <div class="priority-dot ${b.priority}"></div>
            </div>
            <div class="bm-bottom">
                <div class="bm-tags">
                    <span class="s-tag ${b.cat}">${b.cat.toUpperCase()}</span>
                    ${b.tags.slice(0, 3).map(t => `<span class="s-tag read">${t}</span>`).join('')}
                </div>
                <div class="bm-actions">
                    <button class="s-action ${b.fav ? 'fav-active' : ''}" data-bm-fav="${b.id}">
                        <span class="material-symbols-outlined">${b.fav ? 'favorite' : 'favorite_border'}</span>
                    </button>
                    <button class="s-action" data-bm-read="${b.id}" title="${b.read ? 'Non lu' : 'Lu'}">
                        <span class="material-symbols-outlined">${b.read ? 'visibility' : 'visibility_off'}</span>
                    </button>
                    <button class="s-action" data-bm-copy="${b.id}">
                        <span class="material-symbols-outlined">content_copy</span>
                    </button>
                    <button class="s-action" data-bm-share="${b.id}">
                        <span class="material-symbols-outlined">share</span>
                    </button>
                    <button class="s-action" data-bm-del="${b.id}">
                        <span class="material-symbols-outlined">delete_outline</span>
                    </button>
                </div>
            </div>
            <a href="${esc(b.url)}" target="_blank" rel="noopener" class="bm-open-btn">
                <span class="material-symbols-outlined">open_in_new</span>Ouvrir le lien
            </a>
        </div>`;
    }).join('');

    bindBookmarkEvents(bookmarks, updateStatsFn);
}

function bindBookmarkEvents(bookmarks, updateStatsFn) {
    // Favorite
    document.querySelectorAll('[data-bm-fav]').forEach(btn => {
        btn.addEventListener('click', () => {
            const b = bookmarks.find(x => x.id === btn.dataset.bmFav);
            if (b) { b.fav = !b.fav; save(KEYS.bookmarks, bookmarks); updateStatsFn(); document.dispatchEvent(new CustomEvent('dv:render')); }
        });
    });

    // Read/Unread
    document.querySelectorAll('[data-bm-read]').forEach(btn => {
        btn.addEventListener('click', () => {
            const b = bookmarks.find(x => x.id === btn.dataset.bmRead);
            if (b) {
                b.read = !b.read;
                save(KEYS.bookmarks, bookmarks);
                updateStatsFn();
                document.dispatchEvent(new CustomEvent('dv:render'));
                showToast(b.read ? 'Marqué lu ✓' : 'Marqué non lu');
            }
        });
    });

    // Copy URL
    document.querySelectorAll('[data-bm-copy]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const b = bookmarks.find(x => x.id === btn.dataset.bmCopy);
            if (b) { await copyToClipboard(b.url); showToast('URL copiée 📋'); }
        });
    });

    // Share
    document.querySelectorAll('[data-bm-share]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const b = bookmarks.find(x => x.id === btn.dataset.bmShare);
            if (!b) return;
            if (navigator.share) {
                try { await navigator.share({ title: b.title, url: b.url, text: b.desc || '' }); }
                catch { /* cancelled */ }
            } else {
                await copyToClipboard(b.url);
                showToast('URL copiée (partage non dispo)');
            }
        });
    });

    // Delete
    document.querySelectorAll('[data-bm-del]').forEach(btn => {
        btn.addEventListener('click', () => {
            showConfirm('Supprimer ce lien ?', 'Il sera perdu définitivement.', () => {
                const idx = bookmarks.findIndex(x => x.id === btn.dataset.bmDel);
                if (idx > -1) {
                    bookmarks.splice(idx, 1);
                    save(KEYS.bookmarks, bookmarks);
                    updateStatsFn();
                    document.dispatchEvent(new CustomEvent('dv:render'));
                    showToast('Lien supprimé');
                }
            });
        });
    });
}