// ==================== DATA LAYER ====================

export const KEYS = {
    snippets: 'dv_snippets',
    bookmarks: 'dv_bookmarks',
    notes: 'dv_notes',
    copies: 'dv_copies',
    settings: 'dv_settings'
};

export function load(key, fallback = []) {
    try {
        const d = localStorage.getItem(key);
        return d ? JSON.parse(d) : fallback;
    } catch {
        return fallback;
    }
}

export function save(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.warn('Storage full or unavailable:', e);
    }
}

export function getCopyCount() {
    return parseInt(localStorage.getItem(KEYS.copies) || '0');
}

export function incrementCopyCount() {
    const c = getCopyCount() + 1;
    localStorage.setItem(KEYS.copies, c.toString());
    return c;
}

// ==================== DEFAULT DATA ====================
export function getDefaultSnippets() {
    const uid = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
    return [
        { id: uid(), name: 'Boilerplate HTML5', cat: 'html', fav: false, lastCopied: null,
          code: '<!DOCTYPE html>\n<html lang="fr">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Projet</title>\n    <style>\n        * { margin: 0; padding: 0; box-sizing: border-box; }\n        body { font-family: system-ui, sans-serif; }\n    </style>\n</head>\n<body>\n\n    <h1>Hello World</h1>\n\n    <script><\/script>\n</body>\n</html>' },
        { id: uid(), name: 'Flexbox Center', cat: 'css', fav: true, lastCopied: null,
          code: '.container {\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    min-height: 100vh;\n    gap: 16px;\n    flex-wrap: wrap;\n}' },
        { id: uid(), name: 'Grid Responsive', cat: 'css', fav: false, lastCopied: null,
          code: '.grid {\n    display: grid;\n    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));\n    gap: 20px;\n    padding: 20px;\n}' },
        { id: uid(), name: 'Fetch API', cat: 'js', fav: false, lastCopied: null,
          code: 'async function fetchData(url) {\n    try {\n        const res = await fetch(url);\n        if (!res.ok) throw new Error(res.status);\n        const data = await res.json();\n        console.log(data);\n        return data;\n    } catch (err) {\n        console.error(\'Fetch error:\', err);\n    }\n}\n\nfetchData(\'https://jsonplaceholder.typicode.com/posts\');' },
        { id: uid(), name: 'LocalStorage Helper', cat: 'js', fav: true, lastCopied: null,
          code: 'const Store = {\n    get(key, fb = null) {\n        try { return JSON.parse(localStorage.getItem(key)) ?? fb; }\n        catch { return fb; }\n    },\n    set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },\n    remove(key) { localStorage.removeItem(key); }\n};' },
        { id: uid(), name: 'Card Component', cat: 'full', fav: false, lastCopied: null,
          code: '<div class="card">\n    <img src="https://picsum.photos/400/200" alt="">\n    <div class="card-body">\n        <h3>Titre</h3>\n        <p>Description.</p>\n        <button>Action</button>\n    </div>\n</div>\n\n<style>\n.card {\n    max-width: 360px;\n    border-radius: 12px;\n    overflow: hidden;\n    box-shadow: 0 4px 20px rgba(0,0,0,0.15);\n    background: #fff;\n}\n.card img { width: 100%; height: 200px; object-fit: cover; }\n.card-body { padding: 20px; }\n.card-body button {\n    padding: 10px 24px;\n    background: #7c6aff;\n    color: #fff;\n    border: none;\n    border-radius: 8px;\n    cursor: pointer;\n}\n</style>' },
        { id: uid(), name: 'Docker Compose', cat: 'docker', fav: false, lastCopied: null,
          code: 'version: \'3.8\'\n\nservices:\n  app:\n    build: .\n    ports:\n      - "3000:3000"\n    volumes:\n      - .:/app\n    depends_on:\n      - db\n\n  db:\n    image: postgres:15-alpine\n    environment:\n      POSTGRES_DB: mydb\n      POSTGRES_USER: user\n      POSTGRES_PASSWORD: pass\n    volumes:\n      - pgdata:/var/lib/postgresql/data\n\nvolumes:\n  pgdata:' },
        { id: uid(), name: 'Rust Basics', cat: 'rust', fav: false, lastCopied: null,
          code: 'fn main() {\n    let name = "World";\n    println!("Hello, {}!", name);\n\n    let numbers: Vec<i32> = vec![1, 2, 3, 4, 5];\n    let sum: i32 = numbers.iter().sum();\n    println!("Sum: {}", sum);\n\n    enum Color { Red, Green, Blue }\n    let c = Color::Green;\n    match c {\n        Color::Red => println!("Rouge"),\n        Color::Green => println!("Vert"),\n        Color::Blue => println!("Bleu"),\n    }\n}' },
        { id: uid(), name: 'Go HTTP Server', cat: 'go', fav: false, lastCopied: null,
          code: 'package main\n\nimport (\n    "encoding/json"\n    "fmt"\n    "log"\n    "net/http"\n)\n\ntype Response struct {\n    Message string `json:"message"`\n}\n\nfunc handler(w http.ResponseWriter, r *http.Request) {\n    json.NewEncoder(w).Encode(Response{Message: "Hello Go!"})\n}\n\nfunc main() {\n    http.HandleFunc("/api", handler)\n    fmt.Println("Server :8080")\n    log.Fatal(http.ListenAndServe(":8080", nil))\n}' },
        { id: uid(), name: 'CSS Animations', cat: 'css', fav: false, lastCopied: null,
          code: '@keyframes fadeInUp {\n    from { opacity: 0; transform: translateY(20px); }\n    to { opacity: 1; transform: translateY(0); }\n}\n\n@keyframes pulse {\n    0%, 100% { transform: scale(1); }\n    50% { transform: scale(1.05); }\n}\n\n@keyframes spin {\n    to { transform: rotate(360deg); }\n}\n\n.animated { animation: fadeInUp 0.5s ease both; }\n.pulsing { animation: pulse 2s infinite; }\n.spinning { animation: spin 1s linear infinite; }' },
        { id: uid(), name: 'DOM Manipulation', cat: 'js', fav: false, lastCopied: null,
          code: 'const el = document.querySelector(\'.class\');\nconst div = document.createElement(\'div\');\ndiv.className = \'card\';\ndiv.textContent = \'Hello\';\n\nel.classList.add(\'active\');\nel.classList.toggle(\'open\');\n\ndiv.setAttribute(\'data-id\', \'42\');\ndiv.dataset.id; // \'42\'\n\nparent.appendChild(div);\nparent.prepend(div);\nel.before(div);\nel.remove();' },
        { id: uid(), name: 'Media Queries', cat: 'css', fav: false, lastCopied: null,
          code: '/* Mobile first */\n@media (min-width: 640px) { /* sm */ }\n@media (min-width: 768px) { /* md */ }\n@media (min-width: 1024px) { /* lg */ }\n@media (min-width: 1280px) { /* xl */ }\n\n@media (prefers-color-scheme: dark) { }\n@media (prefers-reduced-motion: reduce) {\n    * { animation: none !important; }\n}' }
    ];
}

export function getDefaultBookmarks() {
    const uid = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
    const now = new Date().toISOString();
    return [
        { id: uid(), title: "OpenAI GPT-4o — What's New", url: 'https://openai.com/index/hello-gpt-4o/', desc: 'Nouveau modèle multimodal', cat: 'ai', tags: ['gpt', 'openai'], priority: 'high', fav: true, read: false, createdAt: now },
        { id: uid(), title: 'CSS :has() Selector', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:has', desc: 'Le sélecteur parent enfin disponible', cat: 'css', tags: ['css', 'selectors'], priority: 'medium', fav: false, read: false, createdAt: now },
        { id: uid(), title: 'Rust by Example', url: 'https://doc.rust-lang.org/rust-by-example/', desc: 'Apprendre Rust par la pratique', cat: 'rust', tags: ['rust', 'learning'], priority: 'medium', fav: false, read: false, createdAt: now },
        { id: uid(), title: 'Docker Best Practices', url: 'https://docs.docker.com/develop/develop-images/dockerfile_best-practices/', desc: 'Bonnes pratiques Dockerfile', cat: 'docker', tags: ['docker', 'devops'], priority: 'low', fav: false, read: true, createdAt: now },
        { id: uid(), title: 'Go Tour', url: 'https://go.dev/tour/', desc: 'Tour interactif officiel de Go', cat: 'go', tags: ['go', 'tutorial'], priority: 'low', fav: false, read: false, createdAt: now },
        { id: uid(), title: 'Claude AI by Anthropic', url: 'https://www.anthropic.com/claude', desc: 'Assistant IA concurrent de GPT', cat: 'ai', tags: ['claude', 'anthropic', 'llm'], priority: 'high', fav: false, read: false, createdAt: now },
    ];
}

export function getDefaultNotes() {
    const uid = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
    const now = new Date().toISOString();
    return [
        { id: uid(), title: 'Commandes Docker', body: 'docker ps -a → lister tous les containers\ndocker logs -f <id> → suivre les logs\ndocker exec -it <id> sh → entrer dans un container\ndocker system prune -a → tout nettoyer\ndocker compose up -d → lancer en background', tags: ['docker', 'commandes'], priority: 'high', fav: true, createdAt: now },
        { id: uid(), title: 'Idées projets', body: '- CLI tool en Rust\n- API REST en Go avec GORM\n- PWA avec notifications push\n- Dashboard real-time SSE\n- Extension VS Code', tags: ['idées', 'projets'], priority: 'medium', fav: false, createdAt: now },
        { id: uid(), title: 'CSS Tips', body: 'aspect-ratio: 16/9 → sans padding hack\ncontainer queries → @container\nscroll-snap → scroll natif\n:has() → sélecteur parent\nnesting natif → bye SASS', tags: ['css', 'tips'], priority: 'low', fav: false, createdAt: now },
    ];
}

// ==================== EXPORT / IMPORT ====================
export function exportAll(snippets, bookmarks, notes) {
    const data = {
        version: '2.1',
        exportedAt: new Date().toISOString(),
        snippets,
        bookmarks,
        notes
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `devvault_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
}