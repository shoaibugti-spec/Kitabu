import { describe, expect, it } from "vitest";
import { parseBookShelf, toggleBookInShelf, type Shelf } from "../client/src/lib/libraryShelf";
import type { BookSummary } from "../shared/books";

const book: BookSummary = {
  id: "pg:134", source: "gutenberg", title: "Pride and Prejudice", author: "Jane Austen", year: null,
  languages: ["en"], coverUrl: null, subjects: ["Fiction"], access: "public-domain-us",
  sourceUrl: "https://www.gutenberg.org/ebooks/134", archiveId: null, summary: null, popularity: 35000,
};

describe("saved-book shelf", () => {
  it("round trips a valid shelf and discards malformed or unsafe rows", () => {
    const value = JSON.stringify({
      [book.id]: { book, savedAt: 1710000000 },
      "javascript:bad": { book: { ...book, id: "javascript:bad" }, savedAt: 4 },
      invalidTime: { book, savedAt: "yesterday" },
    });
    expect(parseBookShelf(value)).toEqual({ [book.id]: { book, savedAt: 1710000000 } });
  });

  it("returns an empty shelf for absent, malformed, scalar, or array storage", () => {
    expect(parseBookShelf(null)).toEqual({});
    expect(parseBookShelf("not-json")).toEqual({});
    expect(parseBookShelf("null")).toEqual({});
    expect(parseBookShelf("[]")).toEqual({});
  });

  it("adds/removes the selected title without mutating the prior shelf", () => {
    const empty: Shelf = {};
    const saved = toggleBookInShelf(empty, book, 1710000000);
    expect(saved[book.id]).toEqual({ book, savedAt: 1710000000 });
    expect(empty).toEqual({});
    expect(toggleBookInShelf(saved, book)).toEqual({});
    expect(saved[book.id]).toBeDefined();
  });
});
