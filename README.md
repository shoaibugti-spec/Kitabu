# کِتٰٰبُ — Kitabu

**پورا قرآن، صرف قرآن**

Pure Quran AI — Read, Listen, Learn, Ask. Only Quran, no tafsir, no hadith.

---

## کیا ہے یہ؟

ایک ایسی ایپ جو صرف قرآن کو بنیاد بناتی ہے۔ کوئی تفسیر، حدیث، بخاری، یا انسانی رائے شامل نہیں۔ صرف عربی قرآن، اس کے تراجم، اور آیات کا حوالہ۔

## 4 بٹن

- 📖 **پڑھنا** — قرآن پڑھنا، عربی + ترجمہ
- 🎧 **سننا** — تلاوت سننا
- 🎓 **سیکھنا** — قاعدہ، تجوید، عربی، حفظ
- 💬 **پوچھنا** — قرآن سے سوال، دعویٰ کی تصدیق

## اصول

- صرف قرآن، کوئی تفسیر نہیں
- عربی متن صرف Tanzil (verified) سے
- AI خود جواب نہیں لکھتا — صرف ڈیٹا بیس سے دکھاتا ہے
- نہ ملے تو کہے: "اس مخصوص موضوع پر صریح آیت نہیں ملی"

## فوری آغاز

### 1. ضروریات
- Python 3.11+
- Git

### 2. ڈیٹا ڈاؤن لوڈ

```bash
cd backend/data
python download.py
python convert.py
```

### 3. بیک اینڈ چلائیں

```bash
pip install -r requirements.txt
cd backend
python -m uvicorn main:app --reload
```

### 4. فرنٹ اینڈ کھولیں

براؤزر میں کھولیں: `frontend/index.html`

یا:

```bash
cd frontend
python -m http.server 5500
```

پھر: http://localhost:5500

## API Endpoints

| Method | Endpoint | تفصیل |
|---|---|---|
| GET | /health | صحت چیک |
| GET | /menu | 4 بٹن |
| POST | /ask | قرآن سے سوال |
| POST | /verify | دعویٰ کی تصدیق |
| GET | /surah/{n} | پوری سورہ |
| GET | /audio/{s}/{a} | تلاوت URL |

## ڈیٹا کے ماخذ

- عربی متن: Tanzil.net
- تراجم: Tanzil.net / fawazahmed0/quran-api
- تلاوت: EveryAyah.com
- روٹس: Quranic Arabic Corpus

## لائسنس

MIT — کوڈ کے لیے۔
قرآن کا متن: Tanzil terms (غیر تجارتی، بغیر ترمیم کے تقسیم کی شرائط لاگو ہوتی ہیں — از راہ کرم https://tanzil.net/docs/quran_text_license ملاحظہ کریں)۔

---

نیت: صرف قرآن کی خدمت۔
