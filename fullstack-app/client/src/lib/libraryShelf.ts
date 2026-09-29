import { savedBookIsValid, type BookSummary } from "../../../shared/books";

export type ShelfEntry = { book: BookSummary; savedAt: number };
export type Shelf = Record<string, ShelfEntry>;

export function parseBookShelf(raw: string | null): Shelf {
  if (!raw) return {};
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([, entry]) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
      const candidate = entry as Partial<ShelfEntry>;
      return savedBookIsValid(candidate.book) && typeof candidate.savedAt === "number" && Number.isFinite(candidate.savedAt);
    })) as Shelf;
  } catch {
    return {};
  }
}

export function toggleBookInShelf(shelf: Shelf, book: BookSummary, now = Date.now()): Shelf {
  const next = { ...shelf };
  if (next[book.id]) delete next[book.id];
  else next[book.id] = { book, savedAt: now };
  return next;
}
