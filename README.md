# وَرَق — Kitabu

**دنیا کی کتابیں، ایک مطالعہ گاہ**

Urdu-first کتابی catalog، جہاں cover منتخب کرنے سے اسی صفحے میں کتاب کی تفصیل کھلتی ہے؛ الگ “Read” button نہیں۔ دستیابی اور مکمل مطالعہ ہر اصل ماخذ کے rights/access پر منحصر ہے۔

## Current full-stack preview

- **Development preview:** https://3000-izrsz9ipsidevtk9i8h8j-a5468c2f.us4.manus.computer/
- **Configured app domain (publish from WebDev UI before calling it live):** https://quranai-ke782ssy.manus.space/
- **GitHub Pages:** https://shoaibugti-spec.github.io/Kitabu/ — static-only; it cannot serve the WebDev API or protected AI backend.

> The development preview is accessible inside the workspace but may not be a permanent public deployment. The configured `manus.space` site must be published via the WebDev Publish action. This session exposes the checkpoint workflow, not the publish action.

## What the full-stack app provides

1. **Global discovery:** title/author/topic search, multilingual metadata, language and genre filters, two catalog sources, and paging.
2. **Direct card open:** click a book cover to open its detail/reader view; there is no separate per-book “Read” button. Embed Internet Archive BookReader only when the provider confirms public readability. Borrow-only, metadata-only and Gutenberg records remain on their official source/loan path.
3. **My Library:** save and remove book covers in local browser storage; no account sync is claimed.
4. **Reader controls:** font-size controls and `Esc`/backdrop close. Browser speech synthesis reads available catalog summary/title metadata, not the entire book.
5. **Special Quran collection:** `/quran` keeps the original 114-surah reader, recitation, beginner lessons and citation-grounded AI Q&A.
6. **Credit discipline:** CSS-drawn covers and fallbacks; the all-books catalog makes no generated-image/speech/new-LLM calls.

## Catalog sources and rights

- **Open Library:** [Search API](https://openlibrary.org/dev/docs/api/search), [usage guidance](https://openlibrary.org/developers/api), covers at `covers.openlibrary.org`. Its catalog is broad, but is not literally every book. Requests are short-cached and serialized to follow its one-request-per-second guideline.
- **Project Gutenberg:** [Gutendex](https://gutendex.com/) supplies catalog metadata; titles are filtered to records marked U.S.-public-domain. That status is not a global rights grant. The app links to the official book page instead of bulk-copying or embedding Gutenberg text files.
- A catalog item/cover is not proof of readable full text. Open Library reader/loan availability can change; we use the Archive BookReader only for works currently marked readable, and otherwise link to the source.
- This is a wide, multi-source catalog selection, not a claim that every title/edition or full text is available.

## Source and tests

Canonical WebDev project in the workspace: `kitabu-quran-ai/`. This repository keeps a reproducible snapshot under `fullstack-app/`.

```bash
cd fullstack-app
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm dev
```

Node.js 22 and pnpm are required. Automated checks include the Quran corpus tests, external-book metadata and reader-rights tests, query schema validation and saved-book shelf tests. Tests do not invoke generative models or use AI credits.

## Quran source notes

- Arabic/Uthmani text and aligned translations: [AlQuran.Cloud API](https://alquran.cloud/api); upstream attribution/terms: [AlQuran.Cloud terms](https://alquran.cloud/terms-and-conditions).
- Recitation audio: [EveryAyah.com](https://everyayah.com/); audio rights remain with relevant rights-holders.
- Quran Q&A remains server-side, verse-grounded and citation-validated; it is not tafsir or a fatwa.

## Historic prototype

`frontend/` and `backend/` are the original static/Python prototype, not the current full-stack web app. GitHub Pages cannot run the Python service or provide the protected server-side model credentials.

## Licensing

Repository application code is MIT-licensed (`LICENSE`). External catalog metadata, cover images, book contents, translations, Quran text and audio retain their original provider's license, access terms and territorial rules.
