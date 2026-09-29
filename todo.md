# وَرَق / Varq — Feature and bug tracker

## Implemented and verified
- [x] Replace the Quran-only root catalog with a multilingual books discovery page; keep the existing Quran experience separately accessible at `/quran`.
- [x] Search Open Library across title/author, language, subject and pagination; browse classic Project Gutenberg metadata filtered to U.S.-public-domain records.
- [x] Let users select book cards to open the same-page details/reader view without a separate “Read” button.
- [x] Embed a full Archive BookReader only when the source says public/readable and a strict archive URL passes an allowlist; otherwise explain access and link to the official catalog/book page.
- [x] Save/remove books in a browser-local shelf; validate corrupted localStorage and persisted metadata.
- [x] CSS-generated low-cost visual book covers, missing-cover fallbacks, mobile catalog and retained Quran shelf navigation.
- [x] Backend rate spacing + short-term caching for Open Library, search input limits, provider normalizers and access-status checks.
- [x] Test normalized metadata and source-aware reading eligibility, language/provider mapping, query schema, safe reader IDs and local bookmarks.
- [x] Browser end-to-end: select book card → verified Archive full-text reader opens → save → open My Library → reopen saved card → remove bookmark; count and empty state update correctly.
- [x] TypeScript, all 24 Vitest tests, mobile-sized catalog/Quran screenshots and production bundling passed; packaged Quran corpus includes 114 surahs and 6,236 verses.

## Deliberate limits / follow-up
- The Open Library catalog is large but not every book or edition on Earth; Project Gutenberg is a subset of classics. State this honestly.
- Progress/resume remains deliberately **not implemented**; we cannot infer scroll position inside the cross-origin Archive BookReader. A provider-authorized progress callback or first-party reader is required before this can be added honestly.
- App embeds only records confirmed currently readable via Internet Archive BookReader. Loan/borrow items and records without readable text go to the source; the app does not circumvent login/loan restrictions.
- Project Gutenberg copyright flag is about U.S. terms; outside the U.S., check local law. Link official book pages; no bulk ebook download or copied full text.
- “My Library” and theme are saved locally in this browser only, not synced to accounts/devices.
- TTS speaks metadata/summary provided for the book, **not** the entire full text.
- Book-reading progress/resume and full-title synthesized narration are not claimed; cross-origin reader progress is unavailable here.
- Public app domain will show this state only after the WebDev Publish action is completed. This session has a checkpoint tool but exposes no publish tool; GitHub Pages/static hosting cannot run tRPC, server-side AI or the archive proxy.
- Credit-sensitive work used no AI generation, speech generation, or new LLM call.

## Validation commands
```bash
pnpm check
pnpm test --reporter=dot
pnpm build
```

## Official source notes
- Gutendex API/schema: https://gutendex.com/ and https://github.com/garethbjohnson/gutendex
- Project Gutenberg rights vary by country: https://www.gutenberg.org/policy/terms_of_use.html
- Open Library search API: https://openlibrary.org/dev/docs/api/search
- Open Library API usage policy / request etiquette: https://openlibrary.org/developers/api
- Internet Archive BookReader: https://openlibrary.org/dev/docs/bookreader
- API shape was checked live on 2026-09-28; Open Library and Gutendex are remote services subject to availability, rate limits and catalog changes.
