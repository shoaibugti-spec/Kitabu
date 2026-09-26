"""
quran-cloud CDN سے ڈیٹا ڈاؤن لوڈ اور merge کریں
تین فائلیں: عربی، اردو، انگریزی
نتیجہ: quran_ar.json (flat format)
"""
import json
import httpx
from pathlib import Path

CDN = "https://cdn.jsdelivr.net/npm/quran-cloud@1.0.0/dist"

SOURCES = {
    "ar": f"{CDN}/quran.json",
    "ur": f"{CDN}/quran_ur.json",
    "en": f"{CDN}/quran_en.json",
}


def download(url: str) -> list:
    print(f"📥 ڈاؤن لوڈ: {url}")
    r = httpx.get(url, timeout=120.0, follow_redirects=True)
    r.raise_for_status()
    data = r.json()
    print(f"   ✅ {len(data)} سورتیں")
    return data


def merge(ar_data, ur_data, en_data):
    """تینوں فائلوں کو flat format میں merge کریں"""
    # Urdu اور English کو id سے map کریں
    ur_map = {s["id"]: s for s in ur_data}
    en_map = {s["id"]: s for s in en_data}

    verses = []
    for surah in ar_data:
        sid = surah["id"]
        ur_verses = {v["id"]: v.get("translation", "") for v in ur_map.get(sid, {}).get("verses", [])}
        en_verses = {v["id"]: v.get("translation", "") for v in en_map.get(sid, {}).get("verses", [])}

        for verse in surah["verses"]:
            vid = verse["id"]
            verses.append({
                "surah": sid,
                "ayah": vid,
                "id": f"{sid}:{vid}",
                "text": verse["text"],
                "ur": ur_verses.get(vid, ""),
                "en": en_verses.get(vid, ""),
            })

    return verses


def main():
    print("🕌 Kitabu — quran-cloud ڈیٹا حاصل کر رہا ہے...")
    print()

    ar = download(SOURCES["ar"])
    ur = download(SOURCES["ur"])
    en = download(SOURCES["en"])

    print()
    print("🔀 Merge ہو رہا ہے...")
    verses = merge(ar, ur, en)

    out = Path("quran_ar.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(verses, f, ensure_ascii=False)

    size_mb = out.stat().st_size / (1024 * 1024)
    print()
    print(f"✅ {len(verses)} آیات محفوظ → {out}")
    print(f"   فائل کا سائز: {size_mb:.1f} MB")
    print()
    print("📋 نمونہ (پہلی آیت):")
    print(f"   سورہ: {verses[0]['surah']}")
    print(f"   آیت: {verses[0]['ayah']}")
    print(f"   عربی: {verses[0]['text'][:50]}...")
    print(f"   اردو: {verses[0]['ur'][:50]}...")
    print(f"   انگریزی: {verses[0]['en'][:50]}...")


if __name__ == "__main__":
    main()
