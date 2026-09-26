import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type SurahMeta = {
  number: number;
  arabicName: string;
  englishName: string;
  englishNameTranslation: string;
  ayahCount: number;
  revelationType: string;
};

export type QuranVerse = {
  id: string;
  globalNumber: number;
  surah: number;
  ayah: number;
  text: string;
  ur: string;
  en: string;
};

type QuranCorpus = {
  source: Record<string, string>;
  surahs: SurahMeta[];
  verses: QuranVerse[];
};

const DATA_PATH = resolve(dirname(fileURLToPath(import.meta.url)), "data/quran.json");
let corpusPromise: Promise<QuranCorpus> | undefined;

export async function getCorpus(): Promise<QuranCorpus> {
  if (!corpusPromise) {
    corpusPromise = readFile(DATA_PATH, "utf8").then((raw) => {
      const data = JSON.parse(raw) as QuranCorpus;
      if (data.surahs?.length !== 114 || data.verses?.length !== 6236) {
        throw new Error("Quran corpus failed validation (expected 114 surahs and 6236 ayahs).");
      }
      return data;
    }).catch((error) => {
      corpusPromise = undefined;
      throw error;
    });
  }
  return corpusPromise;
}

const DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;
const PUNCTUATION = /[،؛؟!.,:;()[\]{}"'`“”‘’]/g;
export function normalizeArabic(input: string): string {
  return input.normalize("NFKC").replace(DIACRITICS, "")
    .replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي").replace(/ة/g, "ه").replace(PUNCTUATION, " ")
    .replace(/\s+/g, " ").trim().toLocaleLowerCase();
}

const CONCEPTS: Array<{ terms: string[]; roots: string[] }> = [
  { terms: ["وضو", "وضوء", "wudu", "ablution", "purification", "طہارت"], roots: ["وضا", "غسل", "امسح", "وجوه", "ايدي", "ارجل", "رؤوس", "صعيدا", "طهر"] },
  { terms: ["نماز", "صلو", "صلاه", "salah", "salat", "prayer", "نماز پڑھ", "نماز قائم"], roots: ["صلو", "اقيموا", "ركع", "سجد", "قبله", "صلاه"] },
  { terms: ["سجد", "سجود", "سجدہ", "سجدے", "prostration", "sujud", "sajdah", "mathe ka nishan", "سجدے کا نشان"], roots: ["سجد", "ساجدين", "سجود", "سيماهم", "اثر السجود"] },
  { terms: ["صبر", "patience", "sabr", "آزمائش", "مشکل"], roots: ["صبر", "صابرين", "ابتلا", "فتنه"] },
  { terms: ["علم", "knowledge", "ilm", "سیکھنا", "seek knowledge"], roots: ["علم", "يعلم", "عليم", "حكمه", "اقرأ"] },
  { terms: ["روزہ", "روزه", "fast", "fasting", "رمضان", "sawm"], roots: ["صوم", "صيام", "كتب عليكم الصيام", "رمضان"] },
  { terms: ["زکات", "زکوٰۃ", "صدقہ", "charity", "zakat", "sadaqah"], roots: ["زكو", "صدقه", "انفق", "مسكين", "يتيم"] },
  { terms: ["والدین", "والدين", "ماں باپ", "parents", "mother", "father"], roots: ["والدين", "والد", "احسانا", "امك", "ابوي"] },
  { terms: ["جنت", "paradise", "heaven", "jannah"], roots: ["جنه", "جنات", "فردوس", "نعيم"] },
  { terms: ["جہنم", "دوزخ", "hell", "jahannam", "آگ"], roots: ["جهنم", "نار", "سعير", "حطمه"] },
  { terms: ["ایمان", "ايمان", "faith", "belief", "مومن"], roots: ["امنوا", "مؤمنون", "ايمان", "بالله"] },
  { terms: ["اللہ", "الله", "خدا", "allah", "god", "رب"], roots: ["الله", "رب", "الرحمن"] },
  { terms: ["دعا", "prayer request", "supplication", "dua", "مانگنا"], roots: ["دعو", "ادعوا", "استجب", "ربنا"] },
  { terms: ["انصاف", "عدل", "justice", "fairness"], roots: ["عدل", "قسط", "بالقسط", "اعدلوا"] },
  { terms: ["موت", "death", "وفات", "مرنا"], roots: ["موت", "يموت", "ميت", "اجل"] },
  { terms: ["رزق", "wealth", "مال", "دولت", "livelihood"], roots: ["رزق", "مال", "انفق", "اموال"] },
  { terms: ["محبت", "love", "رحمت", "mercy"], roots: ["رحمه", "رحمن", "يحب", "محبه"] },
  { terms: ["توبہ", "توبه", "repentance", "forgiveness", "معافی"], roots: ["توب", "استغفر", "غفور", "غفر"] },
  { terms: ["حج", "hajj", "pilgrimage", "کعبہ", "کعبه"], roots: ["حج", "البيت", "كعبه", "صفا", "مروه"] },
];

const STOP_WORDS = new Set([
  "کیا", "ہے", "ہیں", "کے", "کی", "کا", "میں", "سے", "پر", "اور", "یہ", "وہ", "جو", "کہ", "قرآن", "قران", "بتائیں", "بتاؤ", "بارے", "متعلق", "براہ", "کرم", "مجھے", "ہمیں", "کون", "کس", "تھے", "تھا", "ہو", "ہوتا", "رہا", "رہے", "نے", "یا", "بھی", "کچھ", "کب", "کیسے", "کیوں", "کبھی", "تمام", "کےمتعلق", "what", "does", "the", "quran", "about", "tell", "me", "please", "is", "are", "in", "of", "and", "on", "to", "how", "can", "do", "we", "it", "for", "with", "says", "say", "regarding", "according",
]);

export async function searchVerses(question: string, limit = 12): Promise<Array<QuranVerse & { score: number }>> {
  const corpus = await getCorpus();
  const query = normalizeArabic(question);
  const words = query.split(" ").filter((word) => word.length > 2 && !STOP_WORDS.has(word));
  const expanded = new Set<string>();
  for (const concept of CONCEPTS) {
    if (concept.terms.some((term) => query.includes(normalizeArabic(term)))) {
      for (const root of concept.roots) expanded.add(normalizeArabic(root));
    }
  }

  const matches: Array<QuranVerse & { score: number }> = [];
  for (const verse of corpus.verses) {
    const arabic = normalizeArabic(verse.text);
    const urdu = normalizeArabic(verse.ur);
    const english = normalizeArabic(verse.en);
    let score = 0;
    for (const root of Array.from(expanded)) {
      if (root && arabic.includes(root)) score += root.includes(" ") ? 7 : 5;
      if (root && urdu.includes(root)) score += 2;
      if (root && english.includes(root)) score += 1;
    }
    for (const word of words) {
      if (arabic.includes(word)) score += 4;
      if (urdu.includes(word)) score += 3;
      if (english.includes(word)) score += 2;
    }
    if (score > 0) matches.push({ ...verse, score });
  }
  matches.sort((a, b) => b.score - a.score || a.globalNumber - b.globalNumber);
  if (!matches.length) return [];
  const minimumScore = Math.max(4, Math.ceil(matches[0].score * 0.4));
  return matches.filter((verse) => verse.score >= minimumScore).slice(0, limit);
}

export async function listSurahs(): Promise<SurahMeta[]> {
  return (await getCorpus()).surahs;
}

export async function getSurah(number: number): Promise<{ surah: SurahMeta; verses: QuranVerse[] } | null> {
  const corpus = await getCorpus();
  const surah = corpus.surahs[number - 1];
  if (!surah || surah.number !== number) return null;
  return { surah, verses: corpus.verses.filter((verse) => verse.surah === number) };
}

export async function getAyah(surah: number, ayah: number): Promise<QuranVerse | null> {
  const corpus = await getCorpus();
  return corpus.verses.find((verse) => verse.surah === surah && verse.ayah === ayah) ?? null;
}

export function getAudioUrl(surah: number, ayah: number, reciter: string): string {
  const folders: Record<string, string> = {
    alafasy: "Alafasy_128kbps",
    husary: "Husary_128kbps",
    minshawi: "Minshawy_Murattal_128kbps",
    abdulbasit: "Abdul_Basit_Murattal_192kbps",
  };
  const folder = folders[reciter] ?? folders.alafasy;
  return `https://everyayah.com/data/${folder}/${String(surah).padStart(3, "0")}${String(ayah).padStart(3, "0")}.mp3`;
}
