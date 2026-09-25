// Kitabu — API client
// Backend مقامی طور پر چل رہا ہو تو یہ localhost:8000 استعمال کرتا ہے۔
// GitHub Pages یا کسی اور جگہ ہوسٹ کرتے وقت یہ URL بدل دیں۔
const API_BASE = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "http://localhost:8000"
  : "http://localhost:8000"; // ← اپنا ڈپلائے شدہ بیک اینڈ URL یہاں لکھیں

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "نامعلوم خرابی" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "نامعلوم خرابی" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

const KitabuAPI = {
  health: () => apiGet("/health"),
  surah: (n) => apiGet(`/surah/${n}`),
  ayah: (s, a) => apiGet(`/ayah/${s}/${a}`),
  ask: (question, lang = "ur") => apiPost("/ask", { question, lang }),
  verify: (surah, ayah, claim, lang = "ur") =>
    apiPost("/verify", { surah, ayah, claim, lang }),
  audioUrl: (s, a, reciter = "alafasy") =>
    apiGet(`/audio/${s}/${a}?reciter=${reciter}`),
};
