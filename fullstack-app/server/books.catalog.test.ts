import { describe, expect, it } from "vitest";
import {
  archiveReaderUrl,
  canEmbedFullBookReader,
  gutendexLanguageCode,
  normalizeGutendexBook,
  normalizeOpenLibraryBook,
  openLibraryLanguageCode,
  savedBookIsValid,
} from "../shared/books";

describe("world-books metadata normalization", () => {
  it("normalizes a readable Open Library work without guessing its text rights", () => {
    const book = normalizeOpenLibraryBook({
      key: "/works/OL66554W", title: "Pride and Prejudice", author_name: ["Jane Austen"],
      first_publish_year: 1813, language: ["eng"], cover_i: 123, ia: ["prideprejudice0000jane"],
      ebook_access: "public", availability: { is_readable: true }, subjects: ["Fiction"],
    });
    expect(book).toMatchObject({
      id: "ol:OL66554W", title: "Pride and Prejudice", access: "open", archiveId: "prideprejudice0000jane",
      coverUrl: "https://covers.openlibrary.org/b/id/123-M.jpg", sourceUrl: "https://openlibrary.org/works/OL66554W",
    });
  });

  it("does not label restricted or non-readable items as open", () => {
    expect(normalizeOpenLibraryBook({ key: "/works/OL1W", title: "Book", ebook_access: "borrowable", ia: ["valid"] })?.access).toBe("borrow");
    expect(normalizeOpenLibraryBook({ key: "/works/OL1W", title: "Book", ebook_access: "public", availability: { is_readable: false }, ia: ["valid"] })?.access).toBe("metadata");
    expect(normalizeOpenLibraryBook({ key: "/works/OL1W", title: "Book", ebook_access: "public" })?.access).toBe("metadata");
  });

  it("accepts Project Gutenberg copyright metadata only as U.S.-public-domain status", () => {
    expect(normalizeGutendexBook({ id: 134, title: "Pride and Prejudice", authors: [{ name: "Jane Austen" }], copyright: false, languages: ["en"] })).toMatchObject({
      id: "pg:134", source: "gutenberg", access: "public-domain-us", sourceUrl: "https://www.gutenberg.org/ebooks/134",
    });
    expect(normalizeGutendexBook({ id: 35, title: "Book", copyright: true })?.access).toBe("metadata");
    expect(normalizeGutendexBook({ id: 35, title: "Book", copyright: null })?.access).toBe("metadata");
  });

  it("provides safe language mappings and rejects unsafe archive reader identifiers", () => {
    expect(openLibraryLanguageCode("ur")).toBe("urd");
    expect(gutendexLanguageCode("ur")).toBe("ur");
    expect(archiveReaderUrl("a-good_book.1")).toBe("https://www.archive.org/stream/a-good_book.1?ui=embed");
    expect(archiveReaderUrl("javascript:alert(1)")).toBeNull();
  });

  it("embeds only source-approved readable Open Library Archive URLs", () => {
    const archive = "https://www.archive.org/stream/austen_work?ui=embed";
    expect(canEmbedFullBookReader("openlibrary", "open", true, archive)).toBe(true);
    expect(canEmbedFullBookReader("openlibrary", "borrow", true, archive)).toBe(false);
    expect(canEmbedFullBookReader("gutenberg", "public-domain-us", true, archive)).toBe(false);
    expect(canEmbedFullBookReader("openlibrary", "open", false, archive)).toBe(false);
    expect(canEmbedFullBookReader("openlibrary", "open", true, "https://example.com/book")).toBe(false);
    expect(canEmbedFullBookReader("openlibrary", "open", true, "javascript:alert(1)")).toBe(false);
  });

  it("validates locally saved book rows before rendering", () => {
    expect(savedBookIsValid({ id: "ol:OL66554W", source: "openlibrary", title: "Pride and Prejudice", author: "Jane Austen" })).toBe(true);
    expect(savedBookIsValid({ id: "javascript:alert(1)", source: "openlibrary", title: "x", author: "y" })).toBe(false);
  });
});


describe("world-books search request validation", () => {
  it("defaults an empty query to worldwide Open Library discovery", async () => {
    const { bookSearchInputSchema } = await import("./booksRouter");
    expect(bookSearchInputSchema.parse({})).toEqual({ query: "", source: "openlibrary", language: "all", genre: "all", page: 1 });
  });

  it("trims a title query and preserves supported source/language/topic/page filters", async () => {
    const { bookSearchInputSchema } = await import("./booksRouter");
    expect(bookSearchInputSchema.parse({ query: "  Pride and Prejudice ", source: "gutenberg", language: "en", genre: "fiction", page: 2 })).toMatchObject({
      query: "Pride and Prejudice", source: "gutenberg", language: "en", genre: "fiction", page: 2,
    });
  });

  it("rejects overlong queries, unsupported language/source, and unbounded pages", async () => {
    const { bookSearchInputSchema } = await import("./booksRouter");
    expect(bookSearchInputSchema.safeParse({ query: "a".repeat(121) }).success).toBe(false);
    expect(bookSearchInputSchema.safeParse({ language: "xx" }).success).toBe(false);
    expect(bookSearchInputSchema.safeParse({ source: "unknown" }).success).toBe(false);
    expect(bookSearchInputSchema.safeParse({ page: 251 }).success).toBe(false);
  });
});
