"""
قرآن کا ڈیٹا ڈاؤن لوڈ کرنے کے لیے اسکرپٹ۔

ماخذ (تمام مفت اور کھلے):
  - عربی متن (Uthmani, Tanzil-based): fawazahmed0/quran-api CDN
  - اردو ترجمہ: fawazahmed0/quran-api CDN (Ahmed Ali)
  - انگریزی ترجمہ: fawazahmed0/quran-api CDN (Saheeh International)

یہ اسکرپٹ صرف خام JSON فائلیں data/raw/ میں محفوظ کرتا ہے۔
اصل ڈیٹا بیس بنانے کے لیے اس کے بعد convert.py چلائیں۔
"""

import json
import urllib.request
import urllib.error
from pathlib import Path

RAW_DIR = Path(__file__).resolve().parent / "raw"
RAW_DIR.mkdir(exist_ok=True)

# fawazahmed0/quran-api — v1 CDN edition files
BASE = "https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions"

SOURCES = {
    "arabic": f"{BASE}/ara-quranuthmani.json",
    "urdu": f"{BASE}/urd-ahmedali.json",
    "english": f"{BASE}/eng-saheeh.json",
}

# Fallback edition names in case the primary one changes/moves
FALLBACKS = {
    "arabic": [f"{BASE}/ara-quransimple.json"],
    "urdu": [f"{BASE}/urd-jalandhry.json"],
    "english": [f"{BASE}/eng-mustafakhattaba.json", f"{BASE}/eng-yusufali.json"],
}


def fetch(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "Kitabu/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def download_one(key: str, url: str):
    out_path = RAW_DIR / f"{key}.json"
    urls_to_try = [url] + FALLBACKS.get(key, [])
    last_err = None
    for u in urls_to_try:
        try:
            print(f"📥 {key}: {u}")
            data = fetch(u)
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False)
            print(f"✅ محفوظ ہوا: {out_path}")
            return
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
            last_err = e
            print(f"⚠️  ناکام ({u}): {e} — اگلا ذریعہ آزما رہے ہیں...")
    raise RuntimeError(f"{key} ڈاؤن لوڈ نہیں ہو سکا: {last_err}")


def main():
    print("🕌 Kitabu — قرآن کا ڈیٹا ڈاؤن لوڈ ہو رہا ہے...\n")
    for key, url in SOURCES.items():
        download_one(key, url)
    print("\n✅ تمام فائلیں ڈاؤن لوڈ ہو گئیں۔ اب چلائیں: python convert.py")


if __name__ == "__main__":
    main()
