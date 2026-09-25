"""دعویٰ کی تصدیق — صرف قرآن کے متن اور تراجم سے لفظی موازنہ۔"""

import re

AR_DIACRITICS = re.compile(r"[\u0617-\u061A\u064B-\u0652\u0670\u0640]")


def normalize(text: str) -> str:
    text = AR_DIACRITICS.sub("", text or "").lower()
    return (
        text.replace("أ", "ا")
        .replace("إ", "ا")
        .replace("آ", "ا")
        .replace("ى", "ي")
        .replace("ة", "ه")
        .replace("ؤ", "و")
        .replace("ئ", "ي")
        .replace("ٱ", "ا")
    )


def verify_claim(db, surah: int, ayah: int, claim: str, lang: str = "ur"):
    verse = db.get(surah, ayah)
    if not verse:
        return {
            "found_verse": False,
            "surah": surah,
            "ayah": ayah,
            "claim": claim,
            "verdict": "آیت موجود نہیں",
            "explanation": (
                "یہ آیت قرآن میں موجود نہیں ہے۔ "
                f"سورہ {surah} میں آیت {ayah} موجود نہیں ہے۔ "
                "براہ کرم صحیح آیت نمبر دیں۔"
            ),
        }

    words = [w for w in claim.strip().split() if len(w) > 2]
    if not words:
        return {
            "found_verse": True,
            "surah": surah,
            "ayah": ayah,
            "arabic": verse["text"],
            "ur": verse.get("ur", ""),
            "en": verse.get("en", ""),
            "claim": claim,
            "verdict": "غیر واضح",
            "explanation": "دعویٰ بہت مختصر ہے، موازنہ نہیں ہو سکا۔",
            "confidence": 0.0,
            "matched_words": [],
        }

    text_ar = normalize(verse["text"])
    text_ur = normalize(verse.get("ur", ""))
    text_en = verse.get("en", "").lower()
    matched_words = [
        word for word in words
        if normalize(word) in text_ar
        or normalize(word) in text_ur
        or word.lower() in text_en
    ]
    confidence = len(matched_words) / len(words)

    if confidence >= 0.5:
        verdict = "موجود ہے"
        explanation = (
            "جی ہاں، اس آیت میں آپ کے دعوے کے مطابق بات پائی گئی۔\n"
            f"ملنے والے الفاظ: {', '.join(matched_words)}"
        )
    else:
        verdict = "موجود نہیں ہے"
        explanation = (
            "نہیں، اس آیت میں آپ کے دعوے کے مطابق بات نہیں پائی گئی۔\n"
            "آپ نے جو کہا وہ اس آیت میں نہیں ہے۔ خود دیکھ لیں۔"
        )

    return {
        "found_verse": True,
        "surah": surah,
        "ayah": ayah,
        "arabic": verse["text"],
        "ur": verse.get("ur", ""),
        "en": verse.get("en", ""),
        "claim": claim,
        "verdict": verdict,
        "explanation": explanation,
        "confidence": round(confidence, 2),
        "matched_words": matched_words,
    }
