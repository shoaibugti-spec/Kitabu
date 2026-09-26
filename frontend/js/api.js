// Kitabu — Client-side data (no backend)

let QURAN_DATA = null;
let QURAN_BY_ID = null;
let QURAN_BY_SURAH = null;
let LOADING = null;

const AR_DIACRITICS = /[\u0617-\u061A\u064B-\u0652\u0670\u0640]/g;

function normalizeAr(text) {
  return text
    .replace(AR_DIACRITICS, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه");
}

async function loadQuran() {
  if (QURAN_DATA) return QURAN_DATA;
  if (LOADING) return LOADING;
  LOADING = (async () => {
    const res = await fetch("data/quran_ar.json");
    if (!res.ok) throw new Error("قرآن کا ڈیٹا نہیں ملا (data/quran_ar.json)");
    QURAN_DATA = await res.json();
    QURAN_BY_ID = {};
    QURAN_BY_SURAH = {};
    for (const v of QURAN_DATA) {
      QURAN_BY_ID[v.id] = v;
      if (!QURAN_BY_SURAH[v.surah]) QURAN_BY_SURAH[v.surah] = [];
      QURAN_BY_SURAH[v.surah].push(v);
    }
    return QURAN_DATA;
  })();
  return LOADING;
}

const TOPIC_MAP = {
  "صبر": ["صبر","صابر","اصبر","تصبر","صابرين"],
  "patience": ["صبر","صابر","اصبر"],
  "نماز": ["صلو","صلاه","اقم","صلات"],
  "prayer": ["صلو","صلاه","اقم","صلات"],
  "روزہ": ["صوم","صيام","صم"],
  "fasting": ["صوم","صيام","صم"],
  "زکات": ["زكو","زكاه","ينفق"],
  "حج": ["حج","يحج","بيت"],
  "والدین": ["والد","ابوي","ام"],
  "parents": ["والد","ابوي","ام"],
  "موت": ["موت","يموت","ميت"],
  "death": ["موت","يموت","ميت"],
  "جنت": ["جنت","جنات"],
  "paradise": ["جنت","جنات"],
  "جہنم": ["جهنم","نار"],
  "hell": ["جهنم","نار"],
  "علم": ["علم","يعلم","عالم","عليم"],
  "knowledge": ["علم","يعلم","عالم"],
  "انصاف": ["عدل","قسط"],
  "justice": ["عدل","قسط"],
  "ایمان": ["امن","يومن","مومن"],
  "faith": ["امن","يومن","مومن"],
  "دعا": ["دعو","دعا","يدع"],
  "اللہ": ["الله","رب"],
  "allah": ["الله","رب"],
};

function searchQuran(question, limit = 10) {
  const qn = normalizeAr(question);
  const keywords = qn.split(/\s+/).filter(w => w.length > 1);
  for (const [key, roots] of Object.entries(TOPIC_MAP)) {
    if (question.includes(key) || qn.includes(key)) keywords.push(...roots);
  }
  const results = [];
  const seen = new Set();
  for (const v of QURAN_DATA) {
    let score = 0;
    const arNorm = normalizeAr(v.text);
    for (const kw of keywords) {
      if (kw && arNorm.includes(kw)) score += 3;
      if (kw && v.ur && v.ur.includes(kw)) score += 2;
      if (kw && v.en && v.en.toLowerCase().includes(kw.toLowerCase())) score += 1;
    }
    if (score > 0 && !seen.has(v.id)) {
      seen.add(v.id);
      results.push({ id: v.id, surah: v.surah, ayah: v.ayah,
        arabic: v.text, ur: v.ur || "", en: v.en || "", score });
    }
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

function verifyClaim(surah, ayah, claim) {
  const verse = QURAN_BY_ID[`${surah}:${ayah}`];
  if (!verse) return null;
  const words = claim.trim().split(/\s+/).filter(w => w.length > 2);
  if (words.length === 0) {
    return { surah, ayah, arabic: verse.text, ur: verse.ur || "", en: verse.en || "",
      claim, verdict: "غیر واضح", explanation: "دعویٰ بہت مختصر ہے۔", confidence: 0 };
  }
  const textAr = normalizeAr(verse.text);
  const textUr = normalizeAr(verse.ur || "");
  const textEn = (verse.en || "").toLowerCase();
  let matches = 0;
  for (const w of words) {
    const wn = normalizeAr(w);
    if (textAr.includes(wn) || textUr.includes(wn) || textEn.includes(w.toLowerCase())) matches++;
  }
  const conf = matches / words.length;
  const found = conf >= 0.5;
  return {
    surah, ayah, arabic: verse.text, ur: verse.ur || "", en: verse.en || "", claim,
    verdict: found ? "موجود ہے" : "موجود نہیں ہے",
    explanation: found
      ? "اس آیت میں آپ کے دعوے کے مطابق بات پائی گئی۔"
      : "اس آیت میں آپ کے دعوے کے مطابق بات نہیں پائی گئی۔",
    confidence: Math.round(conf * 100) / 100,
  };
}

function askQuranAI(question) {
  const claimMarkers = ["قرآن میں یہ ہے", "قرآن میں ہے", "اسلام میں", "اللہ نے کہا", "نبی نے کہا", "حدیث میں"];
  if (claimMarkers.some(m => question.includes(m))) {
    return { type: "claim_detected", found: false,
      message: "لگتا ہے آپ قرآن کے بارے میں کوئی بات کہہ رہے ہیں۔ براہ کرم آیت نمبر دیں تاکہ میں تصدیق کر سکوں۔",
      verses: [] };
  }
  const results = searchQuran(question);
  if (results.length === 0) {
    return { type: "not_found", found: false,
      message: "اس مخصوص موضوع پر قرآن میں کوئی صریح آیت نہیں ملی۔", verses: [] };
  }
  return { type: "found", found: true,
    message: `قرآن میں ${results.length} متعلقہ آیات ملیں۔`, verses: results };
}

const KitabuAPI = {
  load: loadQuran,
  async health() {
    await loadQuran();
    return { status: "ok", verses: QURAN_DATA.length };
  },
  async surah(n) {
    await loadQuran();
    const verses = QURAN_BY_SURAH[n] || [];
    return { surah: n, count: verses.length, verses };
  },
  async ayah(s, a) {
    await loadQuran();
    return QURAN_BY_ID[`${s}:${a}`] || null;
  },
  async ask(q) { await loadQuran(); return askQuranAI(q); },
  async verify(s, a, c) { await loadQuran(); return verifyClaim(s, a, c); },
  audioUrl(s, a, reciter = "Alafasy_128kbps") {
    const pad = x => String(x).padStart(3, "0");
    return `https://everyayah.com/data/${reciter}/${pad(s)}${pad(a)}.mp3`;
  },
};
