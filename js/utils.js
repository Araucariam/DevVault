// ==================== UTILITIES ====================

export const $ = s => document.querySelector(s);
export const $$ = s => document.querySelectorAll(s);

export function uid() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
}

export function esc(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

export function getDomain(url) {
    try { return new URL(url).hostname; }
    catch { return url; }
}

export function timeAgo(d) {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "À l'instant";
    if (mins < 60) return `il y a ${mins}min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `il y a ${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `il y a ${days}j`;
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function catIcon(c) {
    const map = {
        html: 'code', css: 'palette', js: 'javascript',
        full: 'layers', rust: 'memory', go: 'terminal',
        docker: 'deployed_code', ai: 'smart_toy', other: 'link',
        python: 'data_object', typescript: 'javascript'
    };
    return map[c] || 'code';
}

export function catLabel(c) {
    const map = {
        html: 'HTML', css: 'CSS', js: 'JavaScript',
        full: 'Full Stack', rust: 'Rust', go: 'Go',
        docker: 'Docker', ai: 'AI', other: 'Autre',
        python: 'Python', typescript: 'TypeScript'
    };
    return map[c] || c;
}

export function highlight(code, cat) {
    let s = esc(code);

    // Comments
    s = s.replace(/(\/\/.*$)/gm, '<span class="hl-cmt">$1</span>');
    s = s.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-cmt">$1</span>');
    s = s.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="hl-cmt">$1</span>');
    s = s.replace(/(#[^{}\n]*$)/gm, '<span class="hl-cmt">$1</span>');

    // HTML tags
    if (['html', 'full'].includes(cat)) {
        s = s.replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="hl-tag">$2</span>');
    }

    // Keywords
    const kws = [
        'const', 'let', 'var', 'function', 'return', 'if', 'else',
        'for', 'while', 'class', 'import', 'export', 'from', 'default',
        'async', 'await', 'try', 'catch', 'throw', 'new', 'this',
        'true', 'false', 'null', 'undefined', 'typeof', 'instanceof',
        'fn', 'mut', 'pub', 'struct', 'enum', 'impl', 'match', 'use', 'mod',
        'println', 'macro_rules',
        'package', 'func', 'type', 'defer', 'go', 'chan', 'interface', 'range',
        'FROM', 'RUN', 'COPY', 'WORKDIR', 'EXPOSE', 'CMD', 'ENV', 'ARG',
        'AS', 'ENTRYPOINT', 'ADD', 'VOLUME', 'USER', 'LABEL',
        'version', 'services', 'image', 'ports', 'volumes',
        'environment', 'depends_on', 'build', 'networks',
        'def', 'elif', 'lambda', 'with', 'as', 'yield', 'pass', 'break', 'continue'
    ];
    kws.forEach(k => {
        s = s.replace(new RegExp(`\\b(${k})\\b`, 'g'), '<span class="hl-kw">$1</span>');
    });

    // Strings
    s = s.replace(/(&quot;[^&]*?&quot;)/g, '<span class="hl-str">$1</span>');
    s = s.replace(/(&#39;[^&]*?&#39;)/g, '<span class="hl-str">$1</span>');
    s = s.replace(/(`[^`]*`)/gs, '<span class="hl-str">$1</span>');

    // Numbers
    s = s.replace(/\b(\d+\.?\d*)(px|em|rem|%|vh|vw|s|ms)?\b/g, '<span class="hl-num">$1$2</span>');

    return s;
}

// ==================== CLIPBOARD ====================
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0;top:-9999px';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
    }
}

// ==================== TOAST ====================
let toastTimer;
export function showToast(msg) {
    const toast = $('#toast');
    const toastMsg = $('#toastMsg');
    clearTimeout(toastTimer);
    toastMsg.textContent = msg;
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ==================== CONFIRM ====================
let confirmCb = null;

export function showConfirm(title, msg, callback) {
    $('#confirmTitle').textContent = title;
    $('#confirmMsg').textContent = msg;
    $('#confirmDialog').classList.add('active');
    confirmCb = callback;
}

export function initConfirm() {
    $('#confirmCancel').addEventListener('click', () => {
        $('#confirmDialog').classList.remove('active');
    });
    $('#confirmOk').addEventListener('click', () => {
        $('#confirmDialog').classList.remove('active');
        if (confirmCb) confirmCb();
    });
}

// ==================== TAGS INPUT ====================
export function setupTagsInput(inputId, wrapId) {
    const input = $(`#${inputId}`);
    const wrap = $(`#${wrapId}`);
    let tags = [];

    input.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const val = input.value.trim().toLowerCase().replace(',', '');
            if (val && !tags.includes(val) && tags.length < 10) {
                tags.push(val);
                renderPills();
            }
            input.value = '';
        }
        if (e.key === 'Backspace' && !input.value && tags.length) {
            tags.pop();
            renderPills();
        }
    });

    function renderPills() {
        wrap.querySelectorAll('.tag-pill').forEach(p => p.remove());
        tags.forEach(t => {
            const pill = document.createElement('span');
            pill.className = 'tag-pill';
            pill.innerHTML = `${t}<button>×</button>`;
            pill.querySelector('button').addEventListener('click', () => {
                tags = tags.filter(x => x !== t);
                renderPills();
            });
            wrap.insertBefore(pill, input);
        });
    }

    // Return getter and reset
    return {
        getTags: () => [...tags],
        reset: () => { tags = []; renderPills(); }
    };
}

// ==================== GREETING ====================
export function setGreeting() {
    const h = new Date().getHours();
    let t;
    if (h >= 5 && h < 12) t = '☀️ Bonjour';
    else if (h < 18) t = '🌤️ Bon après-midi';
    else if (h < 22) t = '🌙 Bonsoir';
    else t = '🌌 Bonne nuit';
    $('#greeting').textContent = t;
}