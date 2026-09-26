// Kitabu — UI logic (client-side)

function showView(name) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(`view-${name}`).classList.add("active");
}

function verseCard(v) {
  const ar = v.arabic || v.text || "";
  const surah = v.surah ?? "?";
  const ayah = v.ayah ?? "?";
  return `
    <div class="verse-card">
      <div class="verse-ref">سورہ ${surah} — آیت ${ayah}</div>
      <div class="verse-ar">${ar}</div>
      ${v.ur ? `<div class="verse-ur">${v.ur}</div>` : ""}
      ${v.en ? `<div class="verse-en">${v.en}</div>` : ""}
    </div>`;
}

function errorBox(msg) {
  return `<div class="error-box">⚠️ ${msg}</div>`;
}

document.querySelectorAll(".menu-btn").forEach(btn => {
  if (btn.dataset.view) {
    btn.addEventListener("click", () => showView(btn.dataset.view));
  }
});
document.querySelectorAll("[data-back]").forEach(btn => {
  btn.addEventListener("click", () => showView("menu"));
});

window.addEventListener("DOMContentLoaded", async () => {
  const status = document.getElementById("status-line");
  if (!status) return;
  status.textContent = "⏳ قرآن کا ڈیٹا لوڈ ہو رہا ہے...";
  try {
    const h = await KitabuAPI.health();
    status.textContent = `✅ تیار — ${h.verses} آیات لوڈ ہیں`;
  } catch (e) {
    status.textContent = `⚠️ ڈیٹا لوڈ نہیں ہو سکا: ${e.message}`;
  }
});

const playBtn = document.getElementById("play-btn");
if (playBtn) {
  playBtn.addEventListener("click", async () => {
    const s = +document.getElementById("listen-surah").value;
    const a = +document.getElementById("listen-ayah").value;
    const reciter = document.getElementById("reciter-select").value;
    const out = document.getElementById("listen-verse");
    const player = document.getElementById("audio-player");
    out.innerHTML = "⏳ لوڈ ہو رہا ہے...";
    try {
      const url = KitabuAPI.audioUrl(s, a, reciter);
      player.src = url;
      player.play().catch(() => {});
      const verse = await KitabuAPI.ayah(s, a);
      out.innerHTML = verse
        ? verseCard({ surah: verse.surah, ayah: verse.ayah,
            arabic: verse.text, ur: verse.ur, en: verse.en })
        : errorBox("یہ آیت نہیں ملی۔");
    } catch (e) { out.innerHTML = errorBox(e.message); }
  });
}

const learnLoadBtn = document.getElementById("learn-load-btn");
if (learnLoadBtn) {
  learnLoadBtn.addEventListener("click", async () => {
    const n = document.getElementById("learn-surah").value;
    const out = document.getElementById("learn-result");
    out.innerHTML = "⏳ لوڈ ہو رہا ہے...";
    try {
      const data = await KitabuAPI.surah(n);
      out.innerHTML = data.verses.length
        ? data.verses.map(verseCard).join("")
        : errorBox("یہ سورہ نہیں ملی۔");
    } catch (e) { out.innerHTML = errorBox(e.message); }
  });
}

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

const askBtn = document.getElementById("ask-btn");
if (askBtn) {
  askBtn.addEventListener("click", async () => {
    const q = document.getElementById("question-input").value.trim();
    const out = document.getElementById("ask-result");
    if (!q) return;
    out.innerHTML = "⏳ تلاش ہو رہی ہے...";
    try {
      const data = await KitabuAPI.ask(q);
      if (data.type === "claim_detected") {
        out.innerHTML = `<div class="note-box">📌 ${data.message}</div>`;
        return;
      }
      const verses = data.verses || [];
      out.innerHTML = data.found
        ? `<div class="note-box">✅ ${data.message}</div>${verses.map(verseCard).join("")}`
        : `<div class="note-box">❌ ${data.message}</div>`;
    } catch (e) { out.innerHTML = errorBox(e.message); }
  });
}

const verifyBtn = document.getElementById("verify-btn");
if (verifyBtn) {
  verifyBtn.addEventListener("click", async () => {
    const s = +document.getElementById("verify-surah").value;
    const a = +document.getElementById("verify-ayah").value;
    const claim = document.getElementById("claim-input").value.trim();
    const out = document.getElementById("verify-result");
    if (!claim) return;
    out.innerHTML = "⏳ تصدیق ہو رہی ہے...";
    try {
      const data = await KitabuAPI.verify(s, a, claim);
      if (!data) {
        out.innerHTML = errorBox("یہ آیت قرآن میں موجود نہیں۔");
        return;
      }
      const cls = data.verdict === "موجود ہے" ? "verdict-yes" : "verdict-no";
      out.innerHTML = `
        ${verseCard({ surah: data.surah, ayah: data.ayah,
          arabic: data.arabic, ur: data.ur, en: data.en })}
        <div class="note-box">
          <strong class="${cls}">نتیجہ: ${data.verdict}</strong><br>
          <span>${data.explanation}</span>
        </div>`;
    } catch (e) { out.innerHTML = errorBox(e.message); }
  });
}
