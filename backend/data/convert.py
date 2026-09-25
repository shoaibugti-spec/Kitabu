"""
raw/ میں موجود خام JSON فائلوں کو ملا کر ایک صاف ڈیٹا بیس بناتا ہے:
data/quran_ar.json — لسٹ آف {id, surah, ayah, text(ar), ur, en}

چلانے سے پہلے download.py چلائیں۔
"""

import json
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent
RAW_DIR = DATA_DIR / "raw"
OUT_PATH = DATA_DIR / "quran_ar.json"


def load_verses(path: Path):
    """fawazahmed0 quran-api format: {"quran": [{"chapter":1,"verse":1,"text":"..."}]}
    Handles a couple of alternate key names defensively."""
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    items = data.get("quran") or data.get("data") or data
    if isinstance(items, dict):
        items = items.get("verses") or items.get("ayahs") or []

    out = {}
    for item in items:
        surah = item.get("chapter") or item.get("sura") or item.get("surah")
        ayah = item.get("verse") or item.get("ayah") or item.get("aya")
        text = item.get("text") or item.get("translation") or ""
        if surah is None or ayah is None:
            continue
        out[f"{int(surah)}:{int(ayah)}"] = text.strip()
    return out


def main():
    ar_path = RAW_DIR / "arabic.json"
    ur_path = RAW_DIR / "urdu.json"
    en_path = RAW_DIR / "english.json"

    for p in (ar_path, ur_path, en_path):
        if not p.exists():
            raise FileNotFoundError(f"{p} نہیں ملی — پہلے download.py چلائیں۔")

    print("🔄 عربی متن پروسیس ہو رہا ہے...")
    arabic = load_verses(ar_path)
    print(f"   {len(arabic)} آیات")

    print("🔄 اردو ترجمہ پروسیس ہو رہا ہے...")
    urdu = load_verses(ur_path)
    print(f"   {len(urdu)} آیات")

    print("🔄 انگریزی ترجمہ پروسیس ہو رہا ہے...")
    english = load_verses(en_path)
    print(f"   {len(english)} آیات")

    merged = []
    for key, ar_text in sorted(
        arabic.items(), key=lambda kv: tuple(map(int, kv[0].split(":")))
    ):
        surah, ayah = map(int, key.split(":"))
        merged.append(
            {
                "id": key,
                "surah": surah,
                "ayah": ayah,
                "text": ar_text,
                "ur": urdu.get(key, ""),
                "en": english.get(key, ""),
            }
        )

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(merged, f, ensure_ascii=False, indent=None)

    print(f"\n✅ مکمل! {len(merged)} آیات {OUT_PATH} میں محفوظ ہو گئیں۔")

    # Optional: empty roots.json placeholder (root-word search enhancement, off by default)
    roots_path = DATA_DIR / "roots.json"
    if not roots_path.exists():
        with open(roots_path, "w", encoding="utf-8") as f:
            json.dump({}, f)


if __name__ == "__main__":
    main()
