import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "server/data/quran.json");
const BASE = "https://api.alquran.cloud/v1/quran";
const EDITIONS = ["quran-uthmani", "ur.jalandhry", "en.sahih"];

async function fetchEdition(identifier) {
  const response = await fetch(`${BASE}/${identifier}`, {
    headers: { "user-agent": "KitabuQuran/1.0 (educational Quran reader)" },
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) throw new Error(`${identifier}: HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.status !== "OK" || !Array.isArray(payload.data?.surahs)) {
    throw new Error(`${identifier}: unexpected Quran API response`);
  }
  return payload.data;
}

const editions = {};
for (const id of EDITIONS) {
  console.log(`Fetching ${id}…`);
  editions[id] = await fetchEdition(id);
}

const arabic = editions["quran-uthmani"];
const urdu = editions["ur.jalandhry"];
const english = editions["en.sahih"];
if ([urdu, english].some((edition) => edition.surahs.length !== 114)) {
  throw new Error("A translation edition is missing one or more surahs");
}

const surahs = arabic.surahs.map((surah) => ({
  number: surah.number,
  arabicName: surah.name,
  englishName: surah.englishName,
  englishNameTranslation: surah.englishNameTranslation,
  ayahCount: surah.numberOfAyahs,
  revelationType: surah.revelationType,
}));
const verses = [];
for (let s = 0; s < 114; s += 1) {
  const a = arabic.surahs[s];
  const u = urdu.surahs[s];
  const e = english.surahs[s];
  if (a.ayahs.length !== u.ayahs.length || a.ayahs.length !== e.ayahs.length) {
    throw new Error(`Edition verse-count mismatch in surah ${s + 1}`);
  }
  for (let i = 0; i < a.ayahs.length; i += 1) {
    const av = a.ayahs[i];
    const uv = u.ayahs[i];
    const ev = e.ayahs[i];
    if (av.number !== uv.number || av.number !== ev.number ||
        av.numberInSurah !== uv.numberInSurah || av.numberInSurah !== ev.numberInSurah) {
      throw new Error(`Edition alignment mismatch at ${s + 1}:${i + 1}`);
    }
    verses.push({
      id: `${av.numberInSurah === 1 && s === 0 ? 1 : s + 1}:${av.numberInSurah}`,
      globalNumber: av.number,
      surah: s + 1,
      ayah: av.numberInSurah,
      text: av.text.replace(/^\uFEFF/, ""),
      ur: uv.text,
      en: ev.text,
    });
  }
}

if (surahs.length !== 114 || verses.length !== 6236 ||
    verses[0]?.id !== "1:1" || verses.at(-1)?.id !== "114:6") {
  throw new Error(`Corpus validation failed: ${surahs.length} surahs, ${verses.length} verses`);
}

const corpus = {
  source: {
    api: "AlQuran.Cloud",
    apiUrl: "https://alquran.cloud/api",
    arabicEdition: "quran-uthmani (Uthmani text)",
    urduEdition: "ur.jalandhry — Fateh Muhammad Jalandhry",
    englishEdition: "en.sahih — Saheeh International",
    audio: "EveryAyah.com; recitations retain their respective rights",
  },
  surahs,
  verses,
};
await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(corpus));
console.log(`Validated ${surahs.length} surahs and ${verses.length} aligned verses.`);
console.log(`Wrote ${OUT} (${(Buffer.byteLength(JSON.stringify(corpus)) / 1024 / 1024).toFixed(2)} MiB).`);
