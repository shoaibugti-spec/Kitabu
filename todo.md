# Kitabu feature and release checklist

## Implemented in `fullstack-app/`
- [x] Arabic Uthmani Quran, Jalandhry Urdu, and Saheeh International English corpus; validate 114 surahs / 6,236 aligned ayahs.
- [x] Read and listen modes; 4 EveryAyah reciters; verse-level playback controls.
- [x] Urdu learning starter exercises and surah practice.
- [x] AI Quran Q&A with retrieved-verse context, restricted citation IDs, validated verse cards, fallback behavior, and request rate limit.
- [x] Arabic/Urdu concept retrieval for ablution, sujud, and common Quran topics.
- [x] Responsive RTL UI; source/rights attribution; production corpus packaging.
- [x] Unit tests, TypeScript check, and production build passed in this workspace.

## Before the GitHub Pages link is live
- [ ] Resolve the GitHub account billing lock and grant the GitHub integration Pages-write/admin permissions.
- [ ] In repository Settings → Pages, select **Deploy from a branch**, then choose `main` / `/docs` and save.
- [ ] Verify `https://shoaibugti-spec.github.io/Kitabu/` opens the hosted app via `docs/index.html`.

## Known boundaries
- Manus-hosted AI is available in the WebDev app runtime; a static GitHub Pages site cannot run the AI backend itself.
- The current WebDev preview URL is temporary; publishing a permanent backend/custom domain is still pending hosting authorization/setup.
- The claim verifier is a lexical relevance check, not a fatwa, tafsir, or authoritative semantic verification.
