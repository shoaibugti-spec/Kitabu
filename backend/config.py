from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
QURAN_JSON = DATA_DIR / "quran_ar.json"
ROOTS_JSON = DATA_DIR / "roots.json"

SUPPORTED_LANGS = ["ur", "en", "ar", "hi", "bn", "tr", "id", "fa"]
DEFAULT_LANG = "ur"
CORS_ORIGINS = ["*"]

EVERYAYAH_CDN = "https://everyayah.com/data"
DEFAULT_RECITER = "Alafasy_128kbps"

# Available reciters on EveryAyah (folder names on their CDN)
RECITERS = {
    "alafasy": "Alafasy_128kbps",
    "husary": "Husary_128kbps",
    "sudais": "Abdurrahmaan_As-Sudais_192kbps",
    "minshawi": "Minshawy_Murattal_128kbps",
    "abdulbasit": "Abdul_Basit_Murattal_192kbps",
}

TANZIL_BASE = "https://tanzil.net/pub/download/index.php"

# Total counts, used for validation
TOTAL_SURAHS = 114
AYAH_COUNTS = {  # surah -> number of ayahs, filled at runtime from data if missing
}
