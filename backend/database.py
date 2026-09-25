import json
from pathlib import Path

try:
    from config import QURAN_JSON
except ImportError:
    from backend.config import QURAN_JSON


class QuranDB:
    def __init__(self, path: Path = QURAN_JSON):
        if not Path(path).exists():
            raise FileNotFoundError(
                f"ڈیٹا فائل نہیں ملی: {path}\n"
                "پہلے چلائیں: cd backend/data && python download.py && python convert.py"
            )
        with open(path, encoding="utf-8") as f:
            self.verses = json.load(f)

        self.by_id = {v["id"]: v for v in self.verses}
        self.by_surah_map = {}
        for v in self.verses:
            self.by_surah_map.setdefault(v["surah"], []).append(v)

        # Sort each surah's ayahs in order
        for s in self.by_surah_map:
            self.by_surah_map[s].sort(key=lambda x: x["ayah"])

    def get(self, surah: int, ayah: int):
        return self.by_id.get(f"{surah}:{ayah}")

    def by_surah(self, surah: int):
        return self.by_surah_map.get(surah, [])

    def surah_count(self, surah: int) -> int:
        return len(self.by_surah_map.get(surah, []))

    def all(self):
        return self.verses

    def count(self):
        return len(self.verses)

    def total_surahs(self):
        return len(self.by_surah_map)
