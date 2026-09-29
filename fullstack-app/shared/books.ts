export type BookSource = "openlibrary" | "gutenberg";
export type BookAccess = "open" | "borrow" | "accessible" | "public-domain-us" | "metadata";
export type BookLanguage = "all" | "en" | "ur" | "ar" | "es" | "fr" | "de" | "hi" | "ru" | "zh";
export type BookGenre = "all" | "fiction" | "history" | "religion" | "children" | "science" | "poetry";

export interface BookSummary {
  id: string;
  source: BookSource;
  title: string;
  author: string;
  year: number | null;
  languages: string[];
  coverUrl: string | null;
  subjects: string[];
  access: BookAccess;
  sourceUrl: string;
  archiveId: string | null;
  summary: string | null;
  popularity: number | null;
}

export interface BookSearchResult {
  books: BookSummary[];
  page: number;
  hasNext: boolean;
  count?: number;
  sourceErrors: string[];
}

const OPEN_LIBRARY_LANGUAGES: Record<Exclude<BookLanguage, "all">, string> = {
  en: "eng", ur: "urd", ar: "ara", es: "spa", fr: "fre", de: "ger", hi: "hin", ru: "rus", zh: "chi",
};

export const BOOK_LANGUAGE_LABELS: Record<BookLanguage, string> = {
  all: "تمام زبانیں", en: "English", ur: "اردو", ar: "العربية", es: "Español", fr: "Français", de: "Deutsch", hi: "हिन्दी", ru: "Русский", zh: "中文",
};

export const BOOK_GENRE_LABELS: Record<BookGenre, string> = {
  all: "تمام موضوعات", fiction: "افسانہ", history: "تاریخ", religion: "مذہب", children: "بچوں کی کتابیں", science: "سائنس", poetry: "شاعری",
};

export function openLibraryLanguageCode(language: BookLanguage): string | null {
  return language === "all" ? null : OPEN_LIBRARY_LANGUAGES[language];
}

export function gutendexLanguageCode(language: BookLanguage): string | null {
  return language === "all" ? null : language;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 8);
}

function safeArchiveId(value: unknown): string | null {
  const id = text(value);
  return /^[a-zA-Z0-9._-]{1,120}$/.test(id) ? id : null;
}

export function archiveReaderUrl(identifier: string): string | null {
  const safe = safeArchiveId(identifier);
  return safe ? `https://www.archive.org/stream/${encodeURIComponent(safe)}?ui=embed` : null;
}

export function canEmbedFullBookReader(source: BookSource, access: BookAccess, isReadable: boolean, readerUrl: string | null | undefined): readerUrl is string {
  return source === "openlibrary" && access === "open" && isReadable
    && typeof readerUrl === "string"
    && /^https:\/\/www\.archive\.org\/stream\/[A-Za-z0-9._%-]+\?ui=embed$/.test(readerUrl);
}

function accessFromOpenLibrary(value: unknown): BookAccess {
  if (value === "public") return "open";
  if (value === "borrowable") return "borrow";
  if (value === "printdisabled") return "accessible";
  return "metadata";
}

export function normalizeOpenLibraryBook(value: unknown): BookSummary | null {
  const raw = record(value);
  const key = text(raw.key);
  const keyMatch = key.match(/^\/works\/(OL\d+W)$/);
  const title = text(raw.title);
  if (!keyMatch || !title) return null;

  const authorList = stringList(raw.author_name);
  const rawLanguages = stringList(raw.language);
  const editions = record(raw.editions);
  const editionDocs = Array.isArray(editions.docs) ? editions.docs.map(record) : [];
  const languageFromEdition = editionDocs.flatMap((edition) => stringList(edition.language));
  const archiveId = safeArchiveId(stringList(raw.ia)[0] ?? editionDocs.map((edition) => edition.ocaid).find(Boolean));
  const availability = record(raw.availability);
  const accessValue = raw.ebook_access ?? editionDocs[0]?.ebook_access;
  const access = accessValue === "public" && availability.is_readable === false
    ? "metadata"
    : accessFromOpenLibrary(accessValue);
  const coverId = typeof raw.cover_i === "number" && Number.isInteger(raw.cover_i) && raw.cover_i > 0 ? raw.cover_i : null;
  const year = typeof raw.first_publish_year === "number" && Number.isFinite(raw.first_publish_year) ? raw.first_publish_year : null;
  const summaryValue = raw.description;
  const summary = typeof summaryValue === "string" ? summaryValue.slice(0, 1200) : text(record(summaryValue).value).slice(0, 1200);
  const workId = keyMatch[1];

  return {
    id: `ol:${workId}`,
    source: "openlibrary",
    title,
    author: authorList.join(", ") || "نامعلوم مصنف",
    year,
    languages: Array.from(new Set([...rawLanguages, ...languageFromEdition])).slice(0, 8),
    coverUrl: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null,
    subjects: stringList(raw.subject ?? raw.subjects),
    access: archiveId ? access : "metadata",
    sourceUrl: `https://openlibrary.org${key}`,
    archiveId,
    summary: summary || null,
    popularity: typeof raw.edition_count === "number" ? raw.edition_count : null,
  };
}

export function normalizeGutendexBook(value: unknown): BookSummary | null {
  const raw = record(value);
  const id = typeof raw.id === "number" && Number.isInteger(raw.id) && raw.id > 0 ? raw.id : null;
  const title = text(raw.title);
  if (!id || !title) return null;
  const authors = Array.isArray(raw.authors) ? raw.authors.map((item) => text(record(item).name)).filter(Boolean) : [];
  const firstSummary = stringList(raw.summaries)[0] ?? "";
  const copyright = raw.copyright;
  return {
    id: `pg:${id}`,
    source: "gutenberg",
    title,
    author: authors.join(", ") || "نامعلوم مصنف",
    year: null,
    languages: stringList(raw.languages),
    coverUrl: null,
    subjects: stringList(raw.subjects),
    access: copyright === false ? "public-domain-us" : "metadata",
    sourceUrl: `https://www.gutenberg.org/ebooks/${id}`,
    archiveId: null,
    summary: firstSummary.slice(0, 1200) || null,
    popularity: typeof raw.download_count === "number" ? raw.download_count : null,
  };
}

export function savedBookIsValid(value: unknown): value is BookSummary {
  const raw = record(value);
  return typeof raw.id === "string" && (raw.id.startsWith("ol:OL") || raw.id.startsWith("pg:"))
    && typeof raw.title === "string" && typeof raw.author === "string"
    && (raw.source === "openlibrary" || raw.source === "gutenberg");
}
