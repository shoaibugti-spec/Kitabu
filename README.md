# کِتٰبُ — Kitabu

**پورا قرآن، صرف قرآن**

قرآن پڑھنے، سننے، سیکھنے اور آیات کے حوالوں سے سوال پوچھنے کے لیے اردو-first مطالعہ گاہ۔

## موجودہ ویب ایپ

- **Full-stack preview:** https://3000-izrsz9ipsidevtk9i8h8j-a5468c2f.us4.manus.computer/
- **GitHub Pages URL:** https://shoaibugti-spec.github.io/Kitabu/ — Pages workflow/hosting دستیاب ہونے کے بعد اسی public path پر static fallback دکھایا جا سکتا ہے۔

`fullstack-app/` موجودہ full-stack ایپ کا canonical source ہے۔ WebDev preview میں frontend، backend اور Manus-hosted language model ایک ہی origin کے تحت چلتے ہیں؛ repository میں API keys یا user secrets شامل نہیں کیے گئے۔ مستقل custom domain اور مستقل backend publication کے لیے الگ hosting پر project publish/configure کرنا ہوگا۔

## چار بنیادی حصے

1. **قرآن پڑھیں** — 114 سورتیں؛ عثمانی رسم الخط، اردو ترجمۂ فتح محمد جالندھری اور Saheeh International کا انگریزی ترجمہ۔
2. **تلاوت سنیں** — EveryAyah کے آڈیو سے چار قراء، آیت بہ آیت اور اختیاری مسلسل پلے بیک۔
3. **قرآن سیکھیں** — ابتدائی حرکات کی مختصر مشق اور منتخب سورت کے ساتھ سننے/پڑھنے کی مشق۔ یہ مکمل تجوید کورس یا استاد کا بدل نہیں۔
4. **قرآن سے پوچھیں** — GPT-5-mini متعلقہ حاصل شدہ آیات، عربی متن اور معلوم تراجم کی بنیاد پر مختصر جواب دیتا ہے؛ citations صرف retrieved verse IDs میں سے منتخب اور server-side validate ہوتے ہیں۔ کوئی متعلقہ آیت نہ ملے تو غیرمصدقہ جواب بنانے کے بجائے اس کی وضاحت کی جاتی ہے۔ یہ AI مطالعہ رہنمائی ہے، تفسیر یا فتویٰ نہیں۔

## Full-stack project میں کام

```bash
cd fullstack-app
pnpm install
pnpm check
pnpm test
pnpm build
pnpm dev
```

Node.js 22 اور pnpm درکار ہیں۔ `pnpm test` قرآن data checks، 114 سورت/6236 آیات کی integrity، Urdu/Arabic topic retrieval اور audio path کو verify کرتا ہے۔ `pnpm build` web assets اور server bundle بناتا ہے اور validated Quran corpus کو `dist/data/quran.json` میں package کرتا ہے۔

### Quran dataset refresh

```bash
cd fullstack-app
node scripts/fetch-quran.mjs
pnpm test
pnpm build
```

Download script AlQuran.Cloud کے تین aligned editions استعمال کرتا ہے، 114 سورتوں/6236 آیات کی alignment اور آخری آیت کی جانچ کے بعد ایک تقریباً 4 MiB corpus بناتا ہے۔ وہ raw Quran corpus GitHub Pages کے `frontend/` میں نہیں ڈالتا۔

### WebDev environment اور AI

Production-style AI answer Manus WebDev server پر Manus کا server-side language-model integration استعمال کرتا ہے۔ API credentials یا Manus secrets GitHub میں شامل نہ کریں۔ صرف static GitHub Pages اس backend یا secret فراہم نہیں کر سکتا۔ Code کو WebDev سے باہر چلانے پر AI جواب فعال نہیں ہوگا، جب تک backend کو server-side model provider credentials اور hosting میں نہ دیا جائے۔

## Source attribution and use

- **Arabic/Quran text:** [AlQuran.Cloud](https://alquran.cloud/api) — Uthmani edition؛ upstream terms میں Arabic text کے sources، بشمول Tanzil.net اور Quran Academy، کا acknowledgment دیا گیا ہے۔
- **Urdu translation:** [Fateh Muhammad Jalandhry](https://alquran.cloud/edition/ur.jalandhry).
- **English translation:** Saheeh International.
- **Recitation audio:** [EveryAyah.com](https://everyayah.com/). Reciters/rightsholders retain their respective audio rights; audio is linked for personal and educational listening.
- Upstream terms and source attribution: [AlQuran.Cloud terms](https://alquran.cloud/terms-and-conditions).

Arabic text کو اسی Uthmani صورت، حرکات اور املاء کے ساتھ دکھانے کی کوشش کی جاتی ہے۔ ترجمہ قرآن کے اصل عربی متن کا بدل نہیں۔

## Original static prototype

`frontend/` اور `backend/` original static/Python prototype محفوظ رکھتے ہیں۔ انہیں موجودہ AI website نہ سمجھیں: GitHub Pages پر Python چل نہیں سکتا، browser-only copy کا AI حقیقی language model نہیں ہے، اور اس prototype کے data schema/build instructions اب اس full-stack implementation سے مختلف ہیں۔

## Copyright

Application code: MIT — `LICENSE` دیکھیے۔ Qur’anic text, translations اور recitations پر ان کے متعلقہ source/rights-holders کی attribution اور شرائط لاگو ہوتی ہیں۔
