"""قرآن میں تلاش — صرف قرآن، کوئی AI generation نہیں۔"""

import json
import re
from pathlib import Path

try:
    from config import ROOTS_JSON
except ImportError:
    from backend.config import ROOTS_JSON

AR_DIACRITICS = re.compile(r"[\u0617-\u061A\u064B-\u0652\u0670\u0640]")


def normalize_ar(text: str) -> str:
    text = AR_DIACRITICS.sub("", text or "")
    return (
        text.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا")
        .replace("ى", "ي").replace("ة", "ه").replace("ؤ", "و")
        .replace("ئ", "ي").replace("ٱ", "ا")
    )


TOPIC_MAP = {
    "صبر": ["صبر", "صابر", "اصبر", "تصبر", "صابرين", "الصابرين", "يصبر"],
    "patience": ["صبر", "صابر", "اصبر", "تصبر", "صابرين"],
    "نماز": ["صلو", "صلاه", "اقم", "صلات", "يسجد", "سجد", "ركع"],
    "prayer": ["صلو", "صلاه", "اقم", "صلات"],
    "روزہ": ["صوم", "صيام", "صم", "يصوم"],
    "fasting": ["صوم", "صيام", "صم"],
    "زکات": ["زكو", "زكاه", "زكات", "ينفق", "صدق"],
    "charity": ["زكو", "زكاه", "انفق", "صدق"],
    "حج": ["حج", "يحج", "بيت", "كعبه"],
    "hajj": ["حج", "يحج", "بيت", "كعبه"],
    "دعا": ["دعو", "دعا", "يدع", "ادعوا", "اجب"],
    "supplication": ["دعو", "دعا", "يدع"],
    "اللہ": ["الله", "رب", "ربك", "ربنا", "اله"],
    "allah": ["الله", "رب", "اله"],
    "ایمان": ["امن", "يومن", "مومن", "ايمان"],
    "faith": ["امن", "يومن", "مومن"],
    "توحید": ["وحد", "احد", "اله", "شريك"],
    "جنت": ["جنت", "جنات", "فردوس", "نعيم"],
    "paradise": ["جنت", "جنات", "فردوس"],
    "جہنم": ["جهنم", "نار", "سعير", "لظى", "حطمه"],
    "hell": ["جهنم", "نار", "سعير"],
    "انصاف": ["عدل", "قسط", "عدلوا", "يقسط"],
    "justice": ["عدل", "قسط", "عدلوا"],
    "والدین": ["والد", "ابوي", "ام", "والدين"],
    "parents": ["والد", "ابوي", "ام"],
    "یتمی": ["يتم", "يتيم", "يتاما"],
    "orphan": ["يتم", "يتيم"],
    "صدق": ["صدق", "صادق", "يصدق"],
    "truth": ["صدق", "صادق"],
    "جھوٹ": ["كذب", "كاذب", "يكذب"],
    "lie": ["كذب", "كاذب"],
    "علم": ["علم", "يعلم", "عالم", "عليم", "حكمه"],
    "knowledge": ["علم", "يعلم", "عالم", "عليم"],
    "موت": ["موت", "يموت", "ميت", "اموت", "اجل"],
    "death": ["موت", "يموت", "ميت"],
    "حیات": ["حيو", "حي", "حياه", "يحي"],
    "life": ["حيو", "حي", "حياه"],
    "شادی": ["نكح", "زوج", "ازواج"],
    "marriage": ["نكح", "زوج"],
    "طلاق": ["طلق", "طلاق", "مطلق"],
    "divorce": ["طلق", "طلاق"],
    "مال": ["مال", "اموال", "رزق", "كنز"],
    "wealth": ["مال", "اموال", "رزق"],
    "صحت": ["شفا", "مرض", "سقم"],
    "health": ["شفا", "مرض"],
}


class QuranSearch:
    def __init__(self, db):
        self.db = db
        self.roots = {}
        if Path(ROOTS_JSON).exists():
            with open(ROOTS_JSON, encoding="utf-8") as f:
                self.roots = json.load(f)

    def find(self, question: str, lang: str = "ur", limit: int = 10):
        q_norm = normalize_ar(question.strip())
        keywords = [word for word in re.split(r"\s+", q_norm) if len(word) > 1]
        for key, roots in TOPIC_MAP.items():
            if key in question or key in q_norm:
                keywords.extend(roots)
        if not keywords:
            return []

        results, seen = [], set()
        for verse in self.db.all():
            score = 0
            arabic = normalize_ar(verse["text"])
            for keyword in keywords:
                if keyword and keyword in arabic:
                    score += 3
            for field in ("ur", "en"):
                text = verse.get(field, "")
                text = text if field == "ur" else text.lower()
                for keyword in keywords:
                    comparable = keyword if field == "ur" else keyword.lower()
                    if comparable and comparable in text:
                        score += 2 if field == "ur" else 1
            if score > 0 and verse["id"] not in seen:
                seen.add(verse["id"])
                results.append({
                    "id": verse["id"], "surah": verse["surah"], "ayah": verse["ayah"],
                    "arabic": verse["text"], "ur": verse.get("ur", ""),
                    "en": verse.get("en", ""), "score": score,
                })
        results.sort(key=lambda item: -item["score"])
        return results[:limit]
