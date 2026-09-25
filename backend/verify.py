"""
دعویٰ کی تصدیق: یہ ماڈیول کسی دعوے کو خود "درست" یا "غلط" قرار نہیں دیتا۔
یہ صرف بتائی گئی آیت کا اصل متن اور ترجمہ دکھاتا ہے، اور اس دعوے میں
استعمال ہونے والے الفاظ کا اس آیت کے متن سے میل جانچتا ہے — تاکہ
صارف خود موازنہ کر سکے۔ AI کوئی فیصلہ نہیں سناتا۔
"""


def verify_claim(db, surah: int, ayah: int, claim: str, lang: str = "ur"):
    verse = db.get(surah, ayah)
    if not verse:
        return None

    claim_words = [w for w in claim.strip().lower().split() if len(w) > 2]

    verse_text_for_match = " ".join(
        filter(None, [verse.get("ur", ""), verse.get("en", "").lower()])
    )

    matched = [w for w in claim_words if w in verse_text_for_match.lower()]
    match_ratio = (len(matched) / len(claim_words)) if claim_words else 0.0

    if match_ratio >= 0.5:
        note = "دعوے کے کئی الفاظ اس آیت کے ترجمے میں ملتے ہیں۔ نیچے اصل متن پڑھ کر خود موازنہ کریں۔"
    elif match_ratio > 0:
        note = "دعوے کے کچھ الفاظ اس آیت سے ملتے ہیں، مگر مکمل میل نہیں۔ نیچے اصل متن پڑھ کر خود فیصلہ کریں۔"
    else:
        note = "دعوے کے الفاظ اس آیت کے ترجمے سے براہ راست نہیں ملتے۔ ممکن ہے حوالہ درست نہ ہو، یا معنی مختلف زاویے سے بیان ہوا ہو۔ نیچے اصل متن پڑھیں۔"

    return {
        "surah": surah,
        "ayah": ayah,
        "arabic": verse["text"],
        "ur": verse.get("ur", ""),
        "en": verse.get("en", ""),
        "claim": claim,
        "match_ratio": round(match_ratio, 2),
        "note": note,
        "disclaimer": "یہ خودکار لفظی موازنہ ہے، مذہبی فتویٰ نہیں۔ درست فہم کے لیے اصل عربی متن اور معتبر ترجمہ ہی حتمی حوالہ ہیں۔",
    }
