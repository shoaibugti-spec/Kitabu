import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import {
  normalizeGutendexBook,
  normalizeOpenLibraryBook,
  openLibraryLanguageCode,
  gutendexLanguageCode,
  type BookGenre,
  type BookLanguage,
  type BookSearchResult,
  type BookSummary,
} from "../shared/books";

export const bookSearchInputSchema = z.object({
  query: z.string().trim().max(120).default(""),
  source: z.enum(["openlibrary", "gutenberg"]).default("openlibrary"),
  language: z.enum(["all", "en", "ur", "ar", "es", "fr", "de", "hi", "ru", "zh"]).default("all"),
  genre: z.enum(["all", "fiction", "history", "religion", "children", "science", "poetry"]).default("all"),
  page: z.number().int().min(1).max(250).default(1),
});

export type SearchInput = z.infer<typeof bookSearchInputSchema>;
type JsonRecord = Record<string, unknown>;
const PAGE_SIZE = 24;
const CACHE_MS = 60_000;
const CACHE_MAX = 250;
const cache = new Map<string, { expiresAt: number; value: BookSearchResult }>();
let lastOpenLibraryRequestAt = 0;
let openLibraryQueue: Promise<void> = Promise.resolve();

function genreTerm(genre: BookGenre): string {
  const terms: Record<BookGenre, string> = {
    all: "", fiction: "subject:fiction", history: "subject:history", religion: "subject:religion",
    children: "subject:juvenile fiction", science: "subject:science", poetry: "subject:poetry",
  };
  return terms[genre];
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function paceOpenLibraryRequest(): Promise<void> {
  const slot = openLibraryQueue.then(async () => {
    const delay = Math.max(0, 1000 - (Date.now() - lastOpenLibraryRequestAt));
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    lastOpenLibraryRequestAt = Date.now();
  });
  openLibraryQueue = slot.catch(() => undefined);
  return slot;
}

async function readJson(url: URL, source: SearchInput["source"]) {
  if (source === "openlibrary") await paceOpenLibraryRequest();
  let response: Response;
  try {
    response = await fetch(url, {
      headers: source === "openlibrary"
        ? { "User-Agent": "VarqBookLibrary/1.0 (https://quranai-ke782ssy.manus.space)", Accept: "application/json" }
        : { Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    throw new TRPCError({ code: "BAD_GATEWAY", message: "کتابوں کے ماخذ سے رابطہ نہ ہو سکا؛ تھوڑی دیر بعد دوبارہ کوشش کریں۔" });
  }
  if (!response.ok) {
    const code = response.status === 429 ? "TOO_MANY_REQUESTS" : "BAD_GATEWAY";
    throw new TRPCError({ code, message: response.status === 429 ? "کتابوں کا ماخذ عارضی طور پر مصروف ہے؛ چند لمحوں بعد دوبارہ کوشش کریں۔" : "کتابوں کی فہرست اس وقت دستیاب نہیں۔" });
  }
  try {
    return await response.json() as JsonRecord;
  } catch {
    throw new TRPCError({ code: "BAD_GATEWAY", message: "کتابوں کے ماخذ سے درست جواب نہیں ملا۔" });
  }
}

async function searchOpenLibrary(input: SearchInput): Promise<BookSearchResult> {
  const language = openLibraryLanguageCode(input.language as BookLanguage);
  const phrase = input.query.trim().replace(/[\u0000-\u001f]/g, " ");
  const topic = genreTerm(input.genre as BookGenre);
  let url: URL;

  if (!phrase && !language && !topic && input.page === 1) {
    url = new URL("https://openlibrary.org/trending/now.json");
    url.searchParams.set("limit", String(PAGE_SIZE));
  } else {
    const terms = [phrase, language ? `language:${language}` : "", topic].filter(Boolean);
    url = new URL("https://openlibrary.org/search.json");
    url.searchParams.set("q", terms.join(" ") || "book");
    url.searchParams.set("page", String(input.page));
    url.searchParams.set("limit", String(PAGE_SIZE));
    url.searchParams.set("fields", "key,title,author_name,cover_i,first_publish_year,language,subject,edition_count,ebook_access,ia,availability,description");
  }

  const data = await readJson(url, "openlibrary");
  const rows = Array.isArray(data.works) ? data.works : Array.isArray(data.docs) ? data.docs : [];
  const books = rows.map(normalizeOpenLibraryBook).filter((book): book is BookSummary => Boolean(book));
  const count = typeof data.num_found === "number" ? data.num_found : typeof data.numFound === "number" ? data.numFound : null;
  const hasNext = typeof data.next === "string" ? Boolean(data.next) : count !== null ? input.page * PAGE_SIZE < count : rows.length >= PAGE_SIZE;
  return { books, page: input.page, hasNext, ...(count !== null ? { count } : {}), sourceErrors: [] };
}

async function searchGutenberg(input: SearchInput): Promise<BookSearchResult> {
  const url = new URL("https://gutendex.com/books/");
  url.searchParams.set("page", String(input.page));
  url.searchParams.set("copyright", "false");
  url.searchParams.set("mime_type", "text/");
  if (input.query) url.searchParams.set("search", input.query);
  const language = gutendexLanguageCode(input.language as BookLanguage);
  if (language) url.searchParams.set("languages", language);
  const topic = genreTerm(input.genre as BookGenre).replace(/^subject:/, "");
  if (topic) url.searchParams.set("topic", topic);

  const data = await readJson(url, "gutenberg");
  const rows = Array.isArray(data.results) ? data.results : [];
  const books = rows.map(normalizeGutendexBook).filter((book): book is BookSummary => Boolean(book));
  const count = typeof data.count === "number" ? data.count : undefined;
  return { books, page: input.page, hasNext: typeof data.next === "string" && Boolean(data.next), ...(count !== undefined ? { count } : {}), sourceErrors: [] };
}

export const booksRouter = router({
  search: publicProcedure.input(bookSearchInputSchema).query(async ({ input }) => {
    const key = JSON.stringify(input);
    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const result = input.source === "openlibrary" ? await searchOpenLibrary(input) : await searchGutenberg(input);
    if (cache.size >= CACHE_MAX) {
      for (const [cacheKey, entry] of Array.from(cache.entries())) {
        if (entry.expiresAt <= Date.now() || cache.size >= CACHE_MAX - 40) cache.delete(cacheKey);
        if (cache.size < CACHE_MAX - 40) break;
      }
    }
    cache.set(key, { value: result, expiresAt: Date.now() + CACHE_MS });
    return result;
  }),

  readerUrl: publicProcedure.input(z.object({
    source: z.enum(["openlibrary", "gutenberg"]),
    id: z.string().trim().min(3).max(24),
  })).query(async ({ input }) => {
    if (input.source === "openlibrary") {
      const match = input.id.match(/^ol:(OL\d+W)$/);
      if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "یہ کتاب کا درست حوالہ نہیں۔" });
      const url = new URL(`https://openlibrary.org/works/${match[1]}.json`);
      const work = await readJson(url, "openlibrary");
      const ids = Array.isArray(work.covers) ? work.covers.filter((id): id is number => typeof id === "number" && id > 0) : [];
      const workKey = `/works/${match[1]}`;
      const searchUrl = new URL("https://openlibrary.org/search.json");
      searchUrl.searchParams.set("q", `key:${workKey}`);
      searchUrl.searchParams.set("limit", "1");
      searchUrl.searchParams.set("fields", "key,title,author_name,cover_i,first_publish_year,language,ebook_access,ia,availability,description");
      const search = await readJson(searchUrl, "openlibrary");
      const row = Array.isArray(search.docs) ? search.docs[0] : undefined;
      const normalized = normalizeOpenLibraryBook(row);
      const summary = typeof work.description === "string" ? work.description : typeof asRecord(work.description).value === "string" ? asRecord(work.description).value as string : normalized?.summary ?? "";
      const readable = normalized?.access === "open" && Boolean(normalized.archiveId);
      return {
        source: "openlibrary" as const,
        readerUrl: readable && normalized?.archiveId ? `https://www.archive.org/stream/${encodeURIComponent(normalized.archiveId)}?ui=embed` : null,
        sourceUrl: `https://openlibrary.org/works/${match[1]}`,
        coverUrl: ids[0] ? `https://covers.openlibrary.org/b/id/${ids[0]}-L.jpg` : normalized?.coverUrl ?? null,
        summary: summary.slice(0, 1200),
        readable,
      };
    }

    const match = input.id.match(/^pg:(\d{1,8})$/);
    if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "یہ کتاب کا درست حوالہ نہیں۔" });
    const book = normalizeGutendexBook(await readJson(new URL(`https://gutendex.com/books/${match[1]}`), "gutenberg"));
    if (!book) throw new TRPCError({ code: "NOT_FOUND", message: "یہ کتاب نہیں ملی۔" });
    return {
      source: "gutenberg" as const,
      readerUrl: null,
      sourceUrl: book.sourceUrl,
      coverUrl: null,
      summary: book.summary ?? "اس کتاب کے لیے ماخذ نے خلاصہ فراہم نہیں کیا۔",
      readable: false,
    };
  }),
});
