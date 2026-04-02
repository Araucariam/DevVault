export const KEYS = {
    snippets: 'dv_snippets', bookmarks: 'dv_bookmarks',
    notes: 'dv_notes', copies: 'dv_copies', history: 'dv_history'
};

export function load(key, fallback = []) {
    try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : fallback; }
    catch { return fallback; }
}

export function save(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { console.warn('Storage:', e); }
}

export function getCopyCount() { return parseInt(localStorage.getItem(KEYS.copies) || '0'); }
export function incrementCopyCount() { const c = getCopyCount() + 1; localStorage.setItem(KEYS.copies, c.toString()); return c; }

// Copy history
export function addToHistory(item) {
    let history = load(KEYS.history, []);
    history.unshift({ ...item, copiedAt: new Date().toISOString() });
    if (history.length > 50) history = history.slice(0, 50);
    save(KEYS.history, history);
}

export function getHistory() { return load(KEYS.history, []); }
export function clearHistory() { save(KEYS.history, []); }

// ==================== DEFAULTS ====================
export function getDefaultSnippets() {
    const u = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
    const now = new Date().toISOString();
    return [
        { id: u(), name: 'Boilerplate HTML5', cat: 'html', fav: false, pinned: true, lastCopied: null, createdAt: now, code: '<!DOCTYPE html>\n<html lang="fr">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Projet</title>\n    <style>\n        * { margin: 0; padding: 0; box-sizing: border-box; }\n        body { font-family: system-ui, sans-serif; }\n    </style>\n</head>\n<body>\n\n    <h1>Hello World</h1>\n\n    <script><\/script>\n</body>\n</html>' },
        { id: u(), name: 'Flexbox Center', cat: 'css', fav: true, pinned: false, lastCopied: null, createdAt: now, code: '.container {\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    min-height: 100vh;\n    gap: 16px;\n    flex-wrap: wrap;\n}' },
        { id: u(), name: 'Grid Responsive', cat: 'css', fav: false, pinned: false, lastCopied: null, createdAt: now, code: '.grid {\n    display: grid;\n    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));\n    gap: 20px;\n    padding: 20px;\n}' },
        { id: u(), name: 'Fetch API', cat: 'js', fav: false, pinned: false, lastCopied: null, createdAt: now, code: 'async function fetchData(url) {\n    try {\n        const res = await fetch(url);\n        if (!res.ok) throw new Error(res.status);\n        return await res.json();\n    } catch (err) {\n        console.error(err);\n    }\n}\n\nfetchData(\'https://jsonplaceholder.typicode.com/posts\');' },
        { id: u(), name: 'LocalStorage Helper', cat: 'js', fav: true, pinned: false, lastCopied: null, createdAt: now, code: 'const Store = {\n    get(key, fb = null) {\n        try { return JSON.parse(localStorage.getItem(key)) ?? fb; }\n        catch { return fb; }\n    },\n    set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },\n    remove(key) { localStorage.removeItem(key); }\n};' },
        { id: u(), name: 'Card Component', cat: 'full', fav: false, pinned: false, lastCopied: null, createdAt: now, code: '<div class="card">\n    <img src="https://picsum.photos/400/200" alt="">\n    <div class="card-body">\n        <h3>Titre</h3>\n        <p>Description.</p>\n        <button>Action</button>\n    </div>\n</div>\n\n<style>\n.card { max-width: 360px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }\n.card img { width: 100%; height: 200px; object-fit: cover; }\n.card-body { padding: 20px; }\n.card-body button { padding: 10px 24px; background: #7c6aff; color: #fff; border: none; border-radius: 8px; }\n</style>' },
        { id: u(), name: 'Docker Compose', cat: 'docker', fav: false, pinned: false, lastCopied: null, createdAt: now, code: 'version: \'3.8\'\n\nservices:\n  app:\n    build: .\n    ports:\n      - "3000:3000"\n    volumes:\n      - .:/app\n    depends_on:\n      - db\n\n  db:\n    image: postgres:15-alpine\n    environment:\n      POSTGRES_DB: mydb\n      POSTGRES_USER: user\n      POSTGRES_PASSWORD: pass\n    volumes:\n      - pgdata:/var/lib/postgresql/data\n\nvolumes:\n  pgdata:' },
        { id: u(), name: 'Rust Basics', cat: 'rust', fav: false, pinned: false, lastCopied: null, createdAt: now, code: 'fn main() {\n    let name = "World";\n    println!("Hello, {}!", name);\n\n    let nums: Vec<i32> = vec![1, 2, 3, 4, 5];\n    let sum: i32 = nums.iter().sum();\n    println!("Sum: {}", sum);\n}' },
        { id: u(), name: 'Go HTTP Server', cat: 'go', fav: false, pinned: false, lastCopied: null, createdAt: now, code: 'package main\n\nimport (\n    "encoding/json"\n    "fmt"\n    "log"\n    "net/http"\n)\n\nfunc handler(w http.ResponseWriter, r *http.Request) {\n    json.NewEncoder(w).Encode(map[string]string{"msg": "Hello Go!"})\n}\n\nfunc main() {\n    http.HandleFunc("/api", handler)\n    fmt.Println("Server :8080")\n    log.Fatal(http.ListenAndServe(":8080", nil))\n}' },
        { id: u(), name: 'CSS Animations', cat: 'css', fav: false, pinned: false, lastCopied: null, createdAt: now, code: '@keyframes fadeInUp {\n    from { opacity: 0; transform: translateY(20px); }\n    to { opacity: 1; transform: translateY(0); }\n}\n\n@keyframes pulse {\n    0%, 100% { transform: scale(1); }\n    50% { transform: scale(1.05); }\n}\n\n.animated { animation: fadeInUp 0.5s ease both; }\n.pulsing { animation: pulse 2s infinite; }' },
    ];
}

export function getDefaultBookmarks() {
    const u = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
    const now = new Date().toISOString();
    return [
        { id: u(), title: "GPT-4o — What's New", url: 'https://openai.com/index/hello-gpt-4o/', desc: 'Nouveau modèle multimodal', cat: 'ai', tags: ['gpt', 'openai'], priority: 'high', fav: true, pinned: true, read: false, createdAt: now },
        { id: u(), title: 'CSS :has() Selector', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:has', desc: 'Le sélecteur parent', cat: 'css', tags: ['css', 'selectors'], priority: 'medium', fav: false, pinned: false, read: false, createdAt: now },
        { id: u(), title: 'Rust by Example', url: 'https://doc.rust-lang.org/rust-by-example/', desc: 'Apprendre Rust par la pratique', cat: 'rust', tags: ['rust', 'learning'], priority: 'medium', fav: false, pinned: false, read: false, createdAt: now },
        { id: u(), title: 'Docker Best Practices', url: 'https://docs.docker.com/develop/develop-images/dockerfile_best-practices/', desc: 'Bonnes pratiques Dockerfile', cat: 'docker', tags: ['docker', 'devops'], priority: 'low', fav: false, pinned: false, read: true, createdAt: now },
        { id: u(), title: 'Go Tour', url: 'https://go.dev/tour/', desc: 'Tour interactif officiel', cat: 'go', tags: ['go', 'tutorial'], priority: 'low', fav: false, pinned: false, read: false, createdAt: now },
    ];
}

export function getDefaultNotes() {
    const u = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
    const now = new Date().toISOString();
    return [
        { id: u(), title: 'Commandes Docker', body: 'docker ps -a → lister tous les containers\ndocker logs -f <id> → suivre les logs\ndocker exec -it <id> sh → shell dans container\ndocker system prune -a → tout nettoyer\ndocker compose up -d → background', tags: ['docker', 'commandes'], priority: 'high', fav: true, pinned: true, createdAt: now },
        { id: u(), title: 'Idées projets', body: '- CLI tool en Rust\n- API REST en Go\n- PWA avec push notifications\n- Dashboard real-time SSE\n- Extension VS Code', tags: ['idées', 'projets'], priority: 'medium', fav: false, pinned: false, createdAt: now },
        { id: u(), title: 'CSS Tips', body: 'aspect-ratio: 16/9\ncontainer queries → @container\nscroll-snap → scroll natif\n:has() → sélecteur parent\nnesting natif → bye SASS', tags: ['css', 'tips'], priority: 'low', fav: false, pinned: false, createdAt: now },
    ];
}

export function exportAll(snippets, bookmarks, notes) {
    const data = { version: '3.0', exportedAt: new Date().toISOString(), snippets, bookmarks, notes };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `devvault_${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(a.href);
}