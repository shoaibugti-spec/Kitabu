import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, Bookmark, BookmarkCheck, BookOpen, BookOpenText, Check,
  ChevronLeft, CircleHelp, GraduationCap, Headphones, LoaderCircle, Menu,
  MessageCircleQuestion, Pause, Play, Search, Send, ShieldCheck, Sparkles,
  Volume2, X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { filterSurahs, parseSavedSurahs, toggleSavedSurah } from "@/lib/surahCatalog";

type View = "home" | "read" | "listen" | "learn" | "ask";
type Verse = {
  id: string;
  globalNumber: number;
  surah: number;
  ayah: number;
  text: string;
  ur: string;
  en: string;
};
type Surah = {
  number: number;
  arabicName: string;
  englishName: string;
  englishNameTranslation: string;
  ayahCount: number;
  revelationType: string;
};
type Reciter = { id: "alafasy" | "husary" | "minshawi" | "abdulbasit"; name: string };

type QuranAnswer = {
  answer: string;
  references: string[];
  citations: Verse[];
  aiAvailable: boolean;
  notice: string;
};

const RECITERS: Reciter[] = [
  { id: "alafasy", name: "مشاری العفاسی" },
  { id: "husary", name: "محمود خلیل الحصری" },
  { id: "minshawi", name: "محمد صدیق المنشاوی" },
  { id: "abdulbasit", name: "عبدالباسط عبدالصمد" },
];
const AUDIO_FOLDERS: Record<Reciter["id"], string> = {
  alafasy: "Alafasy_128kbps",
  husary: "Husary_128kbps",
  minshawi: "Minshawy_Murattal_128kbps",
  abdulbasit: "Abdul_Basit_Murattal_192kbps",
};

function iconFor(view: View) {
  if (view === "read") return <BookOpen aria-hidden="true" />;
  if (view === "listen") return <Headphones aria-hidden="true" />;
  if (view === "learn") return <GraduationCap aria-hidden="true" />;
  return <MessageCircleQuestion aria-hidden="true" />;
}

function VerseCard({
  verse,
  onPlay,
  showPlay = false,
}: {
  verse: Verse;
  onPlay?: (verse: Verse) => void;
  showPlay?: boolean;
}) {
  return (
    <article className="verse-card" dir="rtl">
      <div className="verse-card-top">
        <span className="verse-reference">سورہ {verse.surah} · آیت {verse.ayah}</span>
        {showPlay && onPlay ? (
          <button className="icon-button verse-play" type="button" aria-label={`آیت ${verse.id} سنیں`} onClick={() => onPlay(verse)}>
            <Play size={16} fill="currentColor" />
          </button>
        ) : null}
      </div>
      <p className="verse-arabic" lang="ar">{verse.text}</p>
      {verse.ur ? <p className="verse-urdu">{verse.ur}</p> : null}
      {verse.en ? <p className="verse-english" lang="en" dir="ltr">{verse.en}</p> : null}
    </article>
  );
}

function SurahPicker({
  surahs,
  value,
  onChange,
  label = "سورہ منتخب کریں",
}: {
  surahs: Surah[];
  value: number;
  onChange: (value: number) => void;
  label?: string;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <select value={value} onChange={(event) => onChange(Number(event.target.value))}>
        {surahs.map((surah) => (
          <option key={surah.number} value={surah.number}>
            {surah.number}. {surah.arabicName} — {surah.englishName}
          </option>
        ))}
      </select>
    </label>
  );
}

function PageHeading({
  icon,
  eyebrow,
  title,
  description,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-heading">
      <div className="page-heading-icon">{icon}</div>
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

function LoadingState({ label = "قرآن کا ڈیٹا لوڈ ہو رہا ہے" }: { label?: string }) {
  return <div className="state-box" role="status"><LoaderCircle className="spin" size={20} />{label}</div>;
}

function ErrorState({ message }: { message: string }) {
  return <div className="state-box error-state" role="alert"><CircleHelp size={19} />{message}</div>;
}

function HomePage({
  onOpen,
  onSelectSurah,
  surahs,
  verseCount,
}: {
  onOpen: (view: View) => void;
  onSelectSurah: (number: number) => void;
  surahs: Surah[];
  verseCount: number;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "meccan" | "medinan" | "saved">("all");
  const [savedSurahs, setSavedSurahs] = useState<number[]>([]);
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    try {
      setSavedSurahs(parseSavedSurahs(window.localStorage.getItem("kitabu-saved-surahs")));
    } catch {
      setSavedSurahs([]);
    }
  }, []);

  const toggleSaved = (number: number) => {
    const next = toggleSavedSurah(savedSurahs, number);
    setSavedSurahs(next);
    try { window.localStorage.setItem("kitabu-saved-surahs", JSON.stringify(next)); } catch { /* Browser storage may be unavailable. */ }
  };

  const visibleSurahs = filterSurahs(surahs, query, filter, savedSurahs);
  const shownSurahs = visibleSurahs.slice(0, visibleCount);

  const cards: Array<{ view: View; label: string; English: string; detail: string; tone: string }> = [
    { view: "read", label: "قرآن پڑھیں", English: "READ", detail: "عربی متن، اردو اور انگریزی ترجمہ", tone: "sage" },
    { view: "listen", label: "تلاوت سنیں", English: "LISTEN", detail: "چار معروف قراء، آیت بہ آیت", tone: "sand" },
    { view: "learn", label: "قرآن سیکھیں", English: "LEARN", detail: "ابتدائی مطالعہ اور بنیادی رہنمائی", tone: "clay" },
    { view: "ask", label: "قرآن سے پوچھیں", English: "ASK", detail: "قرآنی آیات کے حوالوں کے ساتھ AI جواب", tone: "moss" },
  ];
  return (
    <>
      <section className="catalog-hero">
        <div className="hero-copy">
          <span className="hero-kicker"><span className="live-dot" /> قرآنِ کریم · آپ کی مطالعہ گاہ</span>
          <h1>قرآن پڑھیں،<br /><em>اپنی رفتار سے۔</em></h1>
          <p className="hero-text">114 سورتیں، مستند عربی متن اور تراجم۔ اپنی اگلی سورت تلاش کریں یا چاروں مطالعاتی راستوں میں سے انتخاب کریں۔</p>
          <label className="catalog-search">
            <Search size={19} aria-hidden="true" />
            <span className="sr-only">سورت تلاش کریں</span>
            <input value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(12); }} placeholder="سورت کا نام یا نمبر تلاش کریں" aria-label="سورتوں میں تلاش" />
            {query ? <button type="button" onClick={() => setQuery("")} aria-label="تلاش صاف کریں"><X size={16} /></button> : null}
          </label>
        </div>
        <div className="hero-verse catalog-verse" aria-label="قرآن کی آیت">
          <span className="verse-ornament">۞</span>
          <p className="hero-arabic" lang="ar" dir="rtl">وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ</p>
          <p className="hero-translation">اور ہم نے قرآن کو نصیحت حاصل کرنے کے لیے آسان کر دیا ہے، تو کوئی ہے نصیحت حاصل کرنے والا؟</p>
          <span className="hero-reference">سورۃ القمر · 54:17</span>
          <span className="verse-ornament ornament-bottom">۞</span>
        </div>
      </section>

      <section className="features-section">
        <div className="section-title-row">
          <div><span className="eyebrow">چار آسان راستے</span><h2>آپ کیا کرنا چاہتے ہیں؟</h2></div>
          <span className="section-arabic" lang="ar">اقْرَأْ</span>
        </div>
        <div className="feature-grid">
          {cards.map((card, index) => (
            <button key={card.view} type="button" className={`feature-card ${card.tone}`} onClick={() => onOpen(card.view)}>
              <span className="feature-card-number">0{index + 1}</span>
              <span className="feature-icon">{iconFor(card.view)}</span>
              <span className="feature-english">{card.English}</span>
              <span className="feature-title">{card.label}</span>
              <span className="feature-detail">{card.detail}</span>
              <span className="feature-arrow"><ChevronLeft size={18} /></span>
            </button>
          ))}
        </div>
      </section>

      <section className="surah-catalog" aria-labelledby="surah-catalog-heading">
        <div className="catalog-heading-row">
          <div><span className="eyebrow">قرآن کا ذخیرہ</span><h2 id="surah-catalog-heading">سورتوں کا انتخاب</h2></div>
          <span className="catalog-count">{visibleSurahs.length} سورتیں</span>
        </div>
        <div className="catalog-filters" role="group" aria-label="سورتوں کی قسم منتخب کریں">
          {([
            ["all", "تمام سورتیں"], ["meccan", "مکی"], ["medinan", "مدنی"], ["saved", `محفوظ (${savedSurahs.length})`],
          ] as const).map(([value, label]) => (
            <button key={value} type="button" className={filter === value ? "catalog-filter active" : "catalog-filter"} aria-pressed={filter === value} onClick={() => { setFilter(value); setVisibleCount(12); }}>{label}</button>
          ))}
        </div>
        {visibleSurahs.length ? (
          <div className="surah-grid">
            {shownSurahs.map((surah, index) => {
              const saved = savedSurahs.includes(surah.number);
              return (
                <article className="surah-tile" key={surah.number}>
                  <div className={`surah-cover cover-tone-${index % 6}`}>
                    <span className="surah-cover-number">{String(surah.number).padStart(2, "0")}</span>
                    <span className="surah-cover-ornament" aria-hidden="true">۞</span>
                    <span className="surah-cover-arabic" lang="ar">{surah.arabicName}</span>
                    <span className="surah-cover-english">{surah.englishName}</span>
                    <button type="button" className={saved ? "save-surah saved" : "save-surah"} onClick={() => toggleSaved(surah.number)} aria-label={saved ? `${surah.arabicName} محفوظ فہرست سے ہٹائیں` : `${surah.arabicName} بعد کے لیے محفوظ کریں`} aria-pressed={saved}>
                      {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                    </button>
                  </div>
                  <div className="surah-tile-meta">
                    <div className="surah-tile-title"><h3>{surah.arabicName}</h3><span>{surah.englishNameTranslation}</span></div>
                    <span className="surah-ayah-count">{surah.ayahCount} آیات · {surah.revelationType === "Meccan" ? "مکی" : "مدنی"}</span>
                    <button type="button" className="surah-open-button" onClick={() => { onSelectSurah(surah.number); onOpen("read"); }}>پڑھنا شروع کریں <ChevronLeft size={16} /></button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="catalog-empty"><BookOpen size={21} /><span>{filter === "saved" && !query ? "ابھی کوئی سورت محفوظ نہیں۔ پسندیدہ سورت پر نشان لگائیں۔" : "اس تلاش سے کوئی سورت نہیں ملی۔"}</span></div>
        )}
        {visibleCount < visibleSurahs.length ? <button type="button" className="catalog-more" onClick={() => setVisibleCount((count) => count + 12)}>مزید سورتیں دکھائیں <span>({visibleSurahs.length - visibleCount} باقی)</span><ChevronLeft size={16} /></button> : null}
      </section>

      <section className="stats-strip" aria-label="قرآن کے اعداد و شمار">
        <div><span className="stat-number">{surahs.length || 114}</span><span>سورتیں</span></div>
        <i />
        <div><span className="stat-number">{verseCount || "6,236"}</span><span>آیات</span></div>
        <i />
        <div><span className="stat-number">۳</span><span>متن و تراجم</span></div>
        <span className="stats-source">متن: عثمانی · ترجمہ: جالندھری و Saheeh International</span>
      </section>
    </>
  );
}

function LearnPage({
  surahs,
  selectedSurah,
  onSelectSurah,
  verses,
  loading,
  onPlay,
}: {
  surahs: Surah[];
  selectedSurah: number;
  onSelectSurah: (value: number) => void;
  verses: Verse[];
  loading: boolean;
  onPlay: (verse: Verse) => void;
}) {
  return (
    <div className="feature-page">
      <PageHeading icon={<GraduationCap />} eyebrow="LEARN · سیکھنا" title="آہستہ، سمجھ کر سیکھیں" description="ابتدا حروف اور حرکات سے کریں، پھر قرآن کی آیات سن کر ساتھ پڑھیں۔ تجوید و مخارج کے لیے مستند استاد سے بالمشافہ رہنمائی بھی حاصل کریں۔" />
      <div className="lesson-grid">
        <article className="lesson-card lesson-main">
          <span className="lesson-index">سبق 01 · بنیادی حرکات</span>
          <h3>ایک حرف، تین آوازیں</h3>
          <div className="haraka-row" lang="ar" dir="rtl">
            <div><b>بَ</b><span>زبر · بَ</span></div>
            <div><b>بِ</b><span>زیر · بِ</span></div>
            <div><b>بُ</b><span>پیش · بُ</span></div>
          </div>
          <p>حرکت کی آواز کو پہچانیے اور ہر مثال کو اطمینان سے دہرائیے۔ یہ مختصر تحریری مشق صرف آغاز ہے؛ درست ادائیگی سن کر سیکھنے کے لیے استاد سے تصحیح کرائیں۔</p>
        </article>
        <article className="lesson-card lesson-note">
          <span className="lesson-index">یاد دہانی</span>
          <h3>سنیں، پھر دہرائیں</h3>
          <p>ایک چھوٹی سورت منتخب کریں، پہلے تلاوت سنیں، پھر عربی عبارت کے ساتھ آیت بہ آیت پڑھیں۔ رفتار نہیں، درستگی اور تسلسل اہم ہیں۔</p>
          <span className="lesson-callout"><Volume2 size={17} /> آیت کے ساتھ موجود پلے بٹن استعمال کریں</span>
        </article>
      </div>
      <div className="reader-toolbar learning-toolbar">
        <div><span className="eyebrow">آج کی مشق</span><h3>منتخب سورت کے ساتھ پڑھیں</h3></div>
        <SurahPicker surahs={surahs} value={selectedSurah} onChange={onSelectSurah} />
      </div>
      {loading ? <LoadingState /> : <div className="verses-list">{verses.slice(0, 8).map((verse) => <VerseCard key={verse.id} verse={verse} showPlay onPlay={onPlay} />)}</div>}
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [audioAyah, setAudioAyah] = useState(1);
  const [reciter, setReciter] = useState<Reciter["id"]>("alafasy");
  const [continuous, setContinuous] = useState(true);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<QuranAnswer | null>(null);
  const [verifySurah, setVerifySurah] = useState(1);
  const [verifyAyah, setVerifyAyah] = useState(1);
  const [claim, setClaim] = useState("");
  const [verifyResult, setVerifyResult] = useState<{
    verse: Verse | null; verdict: string; confidence: number; explanation: string;
  } | null>(null);
  const [pendingPlay, setPendingPlay] = useState<Verse | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const catalog = trpc.quran.catalog.useQuery(undefined, { staleTime: 60 * 60 * 1000, retry: 1 });
  const surahs = (catalog.data?.surahs ?? []) as Surah[];
  const surahQuery = trpc.quran.surah.useQuery({ number: selectedSurah }, { enabled: view === "read" || view === "learn" || view === "listen", staleTime: 60 * 60 * 1000, retry: 1 });
  const askMutation = trpc.quran.ask.useMutation();
  const verifyMutation = trpc.quran.verify.useMutation();
  const selectedVerses = (surahQuery.data?.verses ?? []) as Verse[];
  const currentSurah = surahQuery.data?.surah as Surah | undefined;
  const currentAudioVerse = selectedVerses.find((verse) => verse.ayah === audioAyah);

  useEffect(() => {
    if (!pendingPlay || !audioRef.current) return;
    const folder = AUDIO_FOLDERS[reciter];
    const pad = (value: number) => String(value).padStart(3, "0");
    audioRef.current.src = `https://everyayah.com/data/${folder}/${pad(pendingPlay.surah)}${pad(pendingPlay.ayah)}.mp3`;
    audioRef.current.play().catch(() => setContinuous(false));
    setPendingPlay(null);
  }, [pendingPlay, reciter, view]);

  const openView = (next: View) => {
    setView(next);
    setMobileMenuOpen(false);
    if (next !== "listen" && audioRef.current) audioRef.current.pause();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectSurah = (number: number) => {
    setSelectedSurah(number);
    setAudioAyah(1);
  };

  const playVerse = (verse: Verse) => {
    setSelectedSurah(verse.surah);
    setAudioAyah(verse.ayah);
    if (view !== "listen") setView("listen");
    setPendingPlay(verse);
  };

  const playSelected = () => {
    const verse = selectedVerses.find((item) => item.ayah === audioAyah);
    if (verse) playVerse(verse);
  };

  const submitQuestion = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = question.trim();
    if (text.length < 3) return;
    setAnswer(null);
    try {
      const result = await askMutation.mutateAsync({ question: text });
      setAnswer(result as QuranAnswer);
    } catch (error) {
      setAnswer({
        answer: error instanceof Error ? error.message : "سوال بھیجنے میں مسئلہ پیش آیا۔ دوبارہ کوشش کریں۔",
        references: [], citations: [], aiAvailable: false, notice: "",
      });
    }
  };

  const submitClaim = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (claim.trim().length < 3) return;
    try {
      const result = await verifyMutation.mutateAsync({ surah: verifySurah, ayah: verifyAyah, claim: claim.trim() });
      setVerifyResult(result as typeof verifyResult);
    } catch {
      setVerifyResult({ verse: null, verdict: "تصدیق ممکن نہیں", confidence: 0, explanation: "اس وقت دعوے کی جانچ نہ ہو سکی۔" });
    }
  };

  const titleForView: Partial<Record<View, string>> = {
    read: "قرآن پڑھیں", listen: "تلاوت سنیں", learn: "قرآن سیکھیں", ask: "قرآن سے پوچھیں",
  };

  return (
    <div className="app-shell" dir="rtl">
      <header className="site-header">
        <button type="button" className="menu-toggle" onClick={() => setMobileMenuOpen((open) => !open)} aria-label={mobileMenuOpen ? "مینو بند کریں" : "مینو کھولیں"} aria-expanded={mobileMenuOpen}>
          {mobileMenuOpen ? <X size={21} /> : <Menu size={22} />}
        </button>
          <button type="button" className="brand-lockup" onClick={() => openView("home")} aria-label="قرآن مطالعہ گاہ">
          <span className="brand-mark">ک</span>
          <span className="brand-text"><b>کِتٰبُ</b><small>قرآن مطالعہ گاہ</small></span>
        </button>
        <nav className="desktop-nav" aria-label="مرکزی نیویگیشن">
          {(["read", "listen", "learn", "ask"] as View[]).map((item) => (
            <button key={item} type="button" className={view === item ? "nav-active" : ""} onClick={() => openView(item)}>{titleForView[item]}</button>
          ))}
        </nav>
        <div className="header-actions">
          <Link href="/" className="book-catalog-link"><BookOpen size={15} /> کتابوں کا catalog</Link>
          <button type="button" className="quick-listen" onClick={() => openView("listen")} aria-label="تلاوت سنیں"><Play size={18} fill="currentColor" /></button>
          <button type="button" className="header-cta" onClick={() => openView("ask")}><Sparkles size={15} /> سوال پوچھیں</button>
        </div>
        {mobileMenuOpen ? <nav className="mobile-menu-popover" aria-label="موبائل مینو">{(["read", "listen", "learn", "ask"] as View[]).map((item) => <button key={item} type="button" onClick={() => openView(item)}>{iconFor(item)}<span>{titleForView[item]}</span></button>)}</nav> : null}
      </header>

      <main className="main-content">
        {view === "home" ? (
          <HomePage onOpen={openView} onSelectSurah={selectSurah} surahs={surahs} verseCount={catalog.data?.verseCount ?? 0} />
        ) : (
          <>
            <button type="button" className="back-link" onClick={() => openView("home")}><ArrowLeft size={16} /> مرکزی صفحہ</button>
            {view === "read" ? (
              <section className="feature-page">
                <PageHeading icon={<BookOpenText />} eyebrow="READ · پڑھنا" title="قرآنِ کریم" description="عثمانی رسم الخط، جالندھری اردو ترجمہ، اور Saheeh International کا انگریزی ترجمہ۔" />
                <div className="reader-toolbar">
                  <div><span className="eyebrow">سورت</span><h3>{currentSurah?.arabicName ?? "سورہ منتخب کریں"}</h3></div>
                  <SurahPicker surahs={surahs} value={selectedSurah} onChange={selectSurah} />
                </div>
                {surahQuery.isLoading ? <LoadingState /> : surahQuery.error ? <ErrorState message="آیات لوڈ نہ ہو سکیں۔ دوبارہ کوشش کریں۔" /> : (
                  <>
                    {currentSurah && selectedSurah !== 1 && selectedSurah !== 9 ? <div className="bismillah" lang="ar" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div> : null}
                    <div className="verses-list">{selectedVerses.map((verse) => <VerseCard key={verse.id} verse={verse} showPlay onPlay={playVerse} />)}</div>
                  </>
                )}
              </section>
            ) : null}

            {view === "listen" ? (
              <section className="feature-page">
                <PageHeading icon={<Headphones />} eyebrow="LISTEN · سننا" title="تلاوت کے ساتھ وقت گزاریں" description="قراء میں سے انتخاب کریں۔ آیت بہ آیت سنیں، یا مسلسل تلاوت کے لیے اگلی آیت خود چلنے دیں۔" />
                <div className="listen-panel">
                  <div className="listen-controls">
                    <SurahPicker surahs={surahs} value={selectedSurah} onChange={selectSurah} />
                    <label className="field"><span className="field-label">قاری</span><select value={reciter} onChange={(event) => setReciter(event.target.value as Reciter["id"])}>{RECITERS.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
                    <label className="field ayah-field"><span className="field-label">آیت نمبر</span><input type="number" min={1} max={currentSurah?.ayahCount ?? 286} value={audioAyah} onChange={(event) => setAudioAyah(Math.max(1, Number(event.target.value)))} /></label>
                  </div>
                  <div className="audio-card">
                    <div className="audio-art"><Volume2 size={24} /></div>
                    <div className="audio-info"><span className="eyebrow">ابھی منتخب</span><h3>{currentSurah?.arabicName ? `سورہ ${currentSurah.arabicName} · آیت ${audioAyah}` : `سورہ ${selectedSurah} · آیت ${audioAyah}`}</h3><p>{RECITERS.find((item) => item.id === reciter)?.name}</p></div>
                    <button type="button" className="button button-primary play-button" onClick={playSelected} disabled={surahQuery.isLoading || !currentAudioVerse}><Play size={18} fill="currentColor" /> چلائیں</button>
                  </div>
                  <audio ref={audioRef} className="native-audio" controls preload="none" onEnded={() => {
                    if (!continuous || !currentSurah || audioAyah >= currentSurah.ayahCount) return;
                    const next = selectedVerses.find((verse) => verse.ayah === audioAyah + 1);
                    if (next) playVerse(next);
                  }} />
                  <label className="check-row"><input type="checkbox" checked={continuous} onChange={(event) => setContinuous(event.target.checked)} /> مسلسل تلاوت — اگلی آیت خود چلائیں</label>
                  {surahQuery.isLoading ? <LoadingState /> : currentAudioVerse ? <VerseCard verse={currentAudioVerse} /> : <ErrorState message="اس سورہ میں یہ آیت موجود نہیں۔" />}
                  <p className="source-note">آڈیو: EveryAyah.com · تلاوت کے حقوق قاری/حقوقِ داران کے ہیں؛ ذاتی و تعلیمی استعمال کے لیے۔</p>
                </div>
              </section>
            ) : null}

            {view === "learn" ? <LearnPage surahs={surahs} selectedSurah={selectedSurah} onSelectSurah={selectSurah} verses={selectedVerses} loading={surahQuery.isLoading} onPlay={playVerse} /> : null}

            {view === "ask" ? (
              <section className="feature-page">
                <PageHeading icon={<MessageCircleQuestion />} eyebrow="ASK · پوچھنا" title="قرآن سے کیا پوچھنا ہے؟" description="آپ کا سوال متعلقہ آیات سے ملایا جائے گا۔ AI انہی حوالوں کی بنیاد پر مختصر اردو رہنمائی دے گا۔" />
                <div className="qa-layout">
                  <div className="qa-main">
                    <div className="ask-card">
                      <span className="ask-card-kicker"><Sparkles size={15} /> قرآنی حوالوں پر مبنی سوال جواب</span>
                      <form onSubmit={submitQuestion}>
                        <label htmlFor="quran-question" className="field-label">اپنا سوال لکھیے</label>
                        <textarea id="quran-question" className="question-input" rows={4} maxLength={500} placeholder="مثلاً: قرآن وضو کے بارے میں کیا کہتا ہے؟" value={question} onChange={(event) => setQuestion(event.target.value)} />
                        <div className="form-bottom"><span>{question.length}/500</span><button type="submit" className="button button-primary" disabled={askMutation.isPending || question.trim().length < 3}>{askMutation.isPending ? <LoaderCircle className="spin" size={17} /> : <Send size={16} />} {askMutation.isPending ? "آیات کا مطالعہ جاری ہے" : "جواب حاصل کریں"}</button></div>
                      </form>
                      <div className="suggestion-row"><span>مثالیں:</span>{["وضو کا طریقہ", "سجدے کے نشان کا ذکر", "صبر کے بارے میں"].map((item) => <button key={item} type="button" onClick={() => setQuestion(item)}>{item}</button>)}</div>
                    </div>
                    {askMutation.isPending ? <LoadingState label="متعلقہ آیات تلاش کرکے جواب ترتیب دیا جا رہا ہے…" /> : null}
                    {answer ? (
                      <div className="answer-section" aria-live="polite">
                        <article className={`ai-answer ${answer.aiAvailable ? "" : "answer-fallback"}`}>
                          <div className="answer-label"><Sparkles size={16} /> {answer.aiAvailable ? "قرآنی حوالوں کے ساتھ AI جواب" : "متعلقہ قرآنی آیات"}</div>
                          <p>{answer.answer}</p>
                          {answer.notice ? <span className="answer-notice"><ShieldCheck size={14} />{answer.notice}</span> : null}
                        </article>
                        {answer.citations?.length ? <>
                          <h3 className="citations-heading">جواب میں استعمال شدہ آیات <span>{answer.citations.length}</span></h3>
                          <div className="verses-list">{answer.citations.map((verse) => <VerseCard key={verse.id} verse={verse} showPlay onPlay={playVerse} />)}</div>
                        </> : null}
                      </div>
                    ) : null}
                  </div>
                  <aside className="qa-aside">
                    <div className="trust-card"><span className="trust-icon"><ShieldCheck size={19} /></span><h3>جواب کا اصول</h3><p>AI صرف نیچے دکھائی گئی آیات سے جواب بناتا ہے۔ ہر حوالہ اصل قرآنی ڈیٹا سے چیک کیا جاتا ہے۔</p><div className="trust-divider" /><span className="trust-foot"><Check size={15} /> آیت نہ ملے تو قیاس سے جواب نہیں</span></div>
                    <div className="language-card"><span className="eyebrow">متن کے ماخذ</span><p>عربی: عثمانی رسم الخط</p><p>اردو: فتح محمد جالندھری</p><p>English: Saheeh International</p></div>
                  </aside>
                </div>
                <details className="verify-details">
                  <summary>کیا کسی خاص آیت سے ایک دعوے کی مطابقت دیکھنی ہے؟ <ChevronLeft size={17} /></summary>
                  <form className="verify-form" onSubmit={submitClaim}>
                    <div className="verify-fields"><label className="field"><span className="field-label">سورہ نمبر</span><input type="number" min={1} max={114} value={verifySurah} onChange={(event) => setVerifySurah(Number(event.target.value))} /></label><label className="field"><span className="field-label">آیت نمبر</span><input type="number" min={1} value={verifyAyah} onChange={(event) => setVerifyAyah(Number(event.target.value))} /></label></div>
                    <label htmlFor="quran-claim" className="field-label">دعوے کا متن</label><textarea id="quran-claim" className="question-input" rows={2} maxLength={500} placeholder="وہ بات لکھیں جسے آیت سے ملانا ہے" value={claim} onChange={(event) => setClaim(event.target.value)} />
                    <button type="submit" className="button button-secondary" disabled={verifyMutation.isPending || claim.trim().length < 3}>{verifyMutation.isPending ? "جانچ جاری ہے…" : "لفظی مطابقت دیکھیں"}</button>
                    {verifyResult ? <div className="verify-result"><strong>{verifyResult.verdict}{verifyResult.confidence ? ` · ${verifyResult.confidence}% لفظی مطابقت` : ""}</strong><p>{verifyResult.explanation}</p>{verifyResult.verse ? <VerseCard verse={verifyResult.verse} /> : null}</div> : null}
                  </form>
                  <p className="verify-disclaimer">یہ صرف خودکار لفظی مماثلت ہے، قطعی معنوی تصدیق یا فتویٰ نہیں۔</p>
                </details>
              </section>
            ) : null}
          </>
        )}
      </main>

      <footer className="site-footer">
        <button type="button" className="footer-brand" onClick={() => openView("home")}><span className="brand-mark">ک</span><b>کِتٰبُ</b></button>
        <p>عربی متن: AlQuran.Cloud · عثمانی رسم الخط<br />اردو ترجمہ: فتح محمد جالندھری · انگریزی: Saheeh International</p>
        <span className="footer-mission">پورا قرآن، صرف قرآن</span>
      </footer>

      <nav className="mobile-nav" aria-label="موبائل نیویگیشن">
        {(["read", "listen", "learn", "ask"] as View[]).map((item) => <button key={item} type="button" className={view === item ? "mobile-nav-active" : ""} onClick={() => openView(item)}>{iconFor(item)}<span>{titleForView[item]}</span></button>)}
      </nav>
    </div>
  );
}
