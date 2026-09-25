import re
import json
from pathlib import Path

try:
    from config import ROOTS_JSON
except ImportError:
    from backend.config import ROOTS_JSON

AR_DIACRITICS = re.compile(r"[\u0617-\u061A\u064B-\u0652\u0670\u0640]")


def normalize_ar(text: str) -> str:
    text = AR_DIACRITICS.sub("", text or "")
    return (
        text.replace("أ", "ا")
        .replace("إ", "ا")
        .replace("آ", "ا")
        .replace("ى", "ي")
        .replace("ة", "ه")
    )


# Urdu/English keyword -> Arabic root fragments, used to expand a query
TOPIC_MAP = {
    "صبر": ["صبر", "صابر", "اصبر", "تصبر", "صابرين"],
    "patience": ["صبر", "صابر", "اصبر", "تصبر"],
    "نماز": ["صلو", "صلاه", "اقم", "صلات", "يسجد"],
    "prayer": ["صلو", "صلاه", "اقم", "صلات"],
    "روزہ": ["صوم", "صيام", "صم", "يصوم"],
    "fasting": ["صوم", "صيام", "صم"],
    "زکات": ["زكو", "زكاه", "زكات", "ينفق"],
    "charity": ["زكو", "زكاه", "انفق", "صدق"],
    "حج": ["حج", "يحج", "بيت", "كعبه"],
    "hajj": ["حج", "يحج", "بيت"],
    "والدین": ["والد", "ابوي", "ام", "والدين"],
    "parents": ["والد", "ابوي", "ام"],
    "موت": ["موت", "يموت", "ميت", "اموت"],
    "death": ["موت", "يموت", "ميت"],
    "جنت": ["جنت", "جنات", "فردوس"],
    "paradise": ["جنت", "جنات", "فردوس"],
    "جہنم": ["جهنم", "نار", "سعير"],
    "hell": ["جهنم", "نار", "سعير"],
    "علم": ["علم", "يعلم", "عالم", "عليم", "حكمه"],
    "knowledge": ["علم", "يعلم", "عالم", "عليم"],
    "انصاف": ["عدل", "قسط", "عدلوا", "يقسط"],
    "justice": ["عدل", "قسط", "عدلوا"],
    "ایمان": ["امن", "يومن", "مومن", "ايمان"],
    "faith": ["امن", "يومن", "مومن"],
    "دعا": ["دعو", "دعا", "يدع", "ادعوا"],
    "supplication": ["دعو", "دعا", "يدع"],
    "اللہ": ["الله", "رب", "ربك", "ربنا"],
    "allah": ["الله", "رب", "ربك"],
    "قرآن": ["قران", "كتاب", "ايات", "ذكر"],
    "quran": ["قران", "كتاب", "ايات"],
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
        keywords = [w for w in re.split(r"\s+", q_norm) if len(w) > 1]

        for key, roots in TOPIC_MAP.items():
            if key in question or key in q_norm:
                keywords.extend(roots)

        if not keywords:
            return []

        results, seen = [], set()
        for v in self.db.all():
            score = 0
            ar_norm = normalize_ar(v["text"])
            for kw in keywords:
                if kw and kw in ar_norm:
                    score += 3
            for field in ("ur", "en"):
                t = v.get(field, "")
                if not t:
                    continue
                t_norm = t if field == "ur" else t.lower()
                for kw in keywords:
                    kw_cmp = kw if field == "ur" else kw.lower()
                    if kw_cmp and kw_cmp in t_norm:
                        score += 1
            if score > 0 and v["id"] not in seen:
                seen.add(v["id"])
                results.append(
                    {
                        "id": v["id"],
                        "surah": v["surah"],
                        "ayah": v["ayah"],
                        "arabic": v["text"],
                        "ur": v.get("ur", ""),
                        "en": v.get("en", ""),
                        "score": score,
                    }
                )

        results.sort(key=lambda x: -x["score"])
        return results[:limit]
