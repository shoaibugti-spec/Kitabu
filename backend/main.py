from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

try:
    from config import CORS_ORIGINS, EVERYAYAH_CDN, DEFAULT_RECITER, RECITERS
    from models import AskRequest, VerifyRequest
    from database import QuranDB
    from search import QuranSearch
    from verify import verify_claim
except ImportError:
    from backend.config import CORS_ORIGINS, EVERYAYAH_CDN, DEFAULT_RECITER, RECITERS
    from backend.models import AskRequest, VerifyRequest
    from backend.database import QuranDB
    from backend.search import QuranSearch
    from backend.verify import verify_claim

app = FastAPI(
    title="Kitabu API",
    description="پورا قرآن، صرف قرآن — Pure Quran API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
if FRONTEND_DIR.exists():
    app.mount("/app", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")

db = None
search_engine = None


@app.on_event("startup")
def load_data():
    global db, search_engine
    try:
        db = QuranDB()
        search_engine = QuranSearch(db)
        print(f"✅ ڈیٹا لوڈ ہوا: {db.count()} آیات، {db.total_surahs()} سورتیں")
    except FileNotFoundError as e:
        print(f"⚠️  {e}")
        db = None
        search_engine = None


def ensure_loaded():
    if db is None:
        raise HTTPException(
            status_code=503,
            detail="ڈیٹا ابھی لوڈ نہیں ہوا۔ پہلے backend/data/download.py اور convert.py چلائیں۔",
        )


@app.get("/")
def root():
    return {
        "name": "کِتٰٰبُ",
        "description": "پورا قرآن، صرف قرآن",
        "verses_loaded": db.count() if db else 0,
        "frontend": "/app",
    }


@app.get("/health")
def health():
    return {
        "status": "ok" if db else "no_data",
        "verses_loaded": db.count() if db else 0,
    }


@app.get("/menu")
def menu():
    return {
        "buttons": [
            {"id": "read", "label_ur": "پڑھنا", "icon": "📖"},
            {"id": "listen", "label_ur": "سننا", "icon": "🎧"},
            {"id": "learn", "label_ur": "سیکھنا", "icon": "🎓"},
            {"id": "ask", "label_ur": "پوچھنا", "icon": "💬"},
        ]
    }


@app.get("/surah/{surah_num}")
def get_surah(surah_num: int):
    ensure_loaded()
    if not (1 <= surah_num <= 114):
        raise HTTPException(status_code=400, detail="سورہ نمبر 1 سے 114 کے درمیان ہونا چاہیے")
    verses = db.by_surah(surah_num)
    if not verses:
        raise HTTPException(status_code=404, detail="سورہ نہیں ملی")
    return {"surah": surah_num, "ayah_count": len(verses), "verses": verses}


@app.get("/ayah/{surah_num}/{ayah_num}")
def get_ayah(surah_num: int, ayah_num: int):
    ensure_loaded()
    verse = db.get(surah_num, ayah_num)
    if not verse:
        raise HTTPException(status_code=404, detail="آیت نہیں ملی")
    return verse


@app.post("/ask")
def ask(req: AskRequest):
    ensure_loaded()
    results = search_engine.find(req.question, lang=req.lang)
    if not results:
        return {
            "found": False,
            "message": "اس مخصوص موضوع پر صریح آیت نہیں ملی۔",
            "results": [],
        }
    return {"found": True, "results": results}


@app.post("/verify")
def verify(req: VerifyRequest):
    ensure_loaded()
    result = verify_claim(db, req.surah, req.ayah, req.claim, req.lang)
    if not result:
        raise HTTPException(status_code=404, detail="بتائی گئی آیت نہیں ملی")
    return result


@app.get("/reciters")
def reciters():
    return {"default": DEFAULT_RECITER, "options": RECITERS}


@app.get("/audio/{surah_num}/{ayah_num}")
def audio_url(surah_num: int, ayah_num: int, reciter: str = "alafasy"):
    ensure_loaded()
    if not db.get(surah_num, ayah_num):
        raise HTTPException(status_code=404, detail="آیت نہیں ملی")
    reciter_folder = RECITERS.get(reciter, DEFAULT_RECITER)
    url = f"{EVERYAYAH_CDN}/{reciter_folder}/{surah_num:03d}{ayah_num:03d}.mp3"
    return {"surah": surah_num, "ayah": ayah_num, "reciter": reciter_folder, "url": url}
