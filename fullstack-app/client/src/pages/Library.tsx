import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown, ArrowLeft, Bookmark, BookmarkCheck, BookOpen, BookOpenCheck, ChevronDown,
  ChevronLeft, ChevronRight, ExternalLink, Headphones, LibraryBig, LoaderCircle, Moon,
  Play, Search, Sun, Volume2, X,
} from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { BOOK_GENRE_LABELS, BOOK_LANGUAGE_LABELS, canEmbedFullBookReader, type BookGenre, type BookLanguage, type BookSearchResult, type BookSource, type BookSummary } from "../../../shared/books";
import { parseBookShelf, toggleBookInShelf, type Shelf } from "@/lib/libraryShelf";

const STORAGE_KEY = "varq-library-v1";
const languageOptions: BookLanguage[] = ["all", "en", "ur", "ar", "es", "fr", "de", "hi", "ru", "zh"];
const genreOptions: BookGenre[] = ["all", "fiction", "history", "religion", "children", "science", "poetry"];
const sourceLabels: Record<BookSource, string> = { openlibrary: "Open Library", gutenberg: "Project Gutenberg" };

function loadShelf(): Shelf {
  try { return parseBookShelf(window.localStorage.getItem(STORAGE_KEY)); }
  catch { return {}; }
}

function formatCount(value: number | null): string {
  if (value === null) return "";
  return new Intl.NumberFormat("en", { notation: value > 9999 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

function BookCover({ book, large = false }: { book: BookSummary; large?: boolean }) {
  const [broken, setBroken] = useState(false);
  const artIndex = book.id.split("").reduce((total, char) => total + char.charCodeAt(0), 0) % 7;
  return (
    <span className={`world-cover cover-palette-${artIndex}${large ? " world-cover-large" : ""}`}>
      {book.coverUrl && !broken
        ? <img src={book.coverUrl} alt="" loading="lazy" onError={() => setBroken(true)} />
        : <span className="cover-fallback" aria-hidden="true"><BookOpen size={large ? 42 : 30} strokeWidth={1.2} /><b>{book.title}</b><small>{book.author}</small></span>}
    </span>
  );
}

function accessText(book: BookSummary): string {
  if (book.access === "open") return "آن لائن دستیاب";
  if (book.access === "borrow") return "ادھار پر دستیاب";
  if (book.access === "accessible") return "قابلِ رسائی ایڈیشن";
  if (book.access === "public-domain-us") return "Project Gutenberg · US status";
  return "کتابی معلومات";
}

function languageText(language: string): string {
  const codes: Record<string, string> = { en: "English", ur: "اردو", ar: "العربية", es: "Español", fr: "Français", de: "Deutsch", hi: "हिन्दी", ru: "Русский", zh: "中文" };
  return codes[language] ?? language.toUpperCase();
}

function BookReader({ book, onClose, onToggleSaved, saved, onOpenSource }: {
  book: BookSummary; onClose: () => void; onToggleSaved: () => void; saved: boolean;
  onOpenSource: (url: string) => void;
}) {
  const [fontSize, setFontSize] = useState(16);
  const [speaking, setSpeaking] = useState(false);
  const reader = trpc.books.readerUrl.useQuery({ id: book.id, source: book.source }, {
    enabled: book.source === "openlibrary",
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
  const readable = canEmbedFullBookReader(book.source, book.access, Boolean(reader.data?.readable), reader.data?.readerUrl);
  const detail = reader.data;

  useEffect(() => {
    document.body.classList.add("book-dialog-open");
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      document.body.classList.remove("book-dialog-open");
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [onClose]);

  const readAloud = () => {
    if (!("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.pause();
      setSpeaking(false);
      return;
    }
    const text = [book.title, book.author, book.summary].filter(Boolean).join(". ");
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  const openSource = () => onOpenSource(detail?.sourceUrl ?? book.sourceUrl);

  return (
    <div className="reader-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="world-reader" role="dialog" aria-modal="true" aria-labelledby="reader-title">
        <header className="reader-head">
          <button className="reader-icon-button" type="button" onClick={onClose} aria-label="واپس جائیں"><ArrowLeft size={20} /></button>
          <div className="reader-head-title"><b id="reader-title">{book.title}</b><small>{book.author}</small></div>
          <button className={saved ? "reader-icon-button saved" : "reader-icon-button"} type="button" onClick={onToggleSaved} aria-label={saved ? "محفوظ فہرست سے ہٹائیں" : "میری لائبریری میں محفوظ کریں"}><Bookmark size={19} fill={saved ? "currentColor" : "none"} /></button>
          <button className="reader-icon-button" type="button" onClick={onClose} aria-label="بند کریں"><X size={20} /></button>
        </header>

        <div className="reader-tools" aria-label="کتاب کے اوزار">
          <button type="button" onClick={() => setFontSize((size) => Math.max(14, size - 1))} aria-label="حروف چھوٹے کریں">A−</button>
          <button type="button" onClick={() => setFontSize((size) => Math.min(22, size + 1))} aria-label="حروف بڑے کریں">A+</button>
          <button type="button" onClick={readAloud} aria-label={speaking ? "خلاصے کی آواز روکیں" : "کتاب کا خلاصہ سنیں"}><Volume2 size={17} />{speaking ? "روکیں" : "خلاصہ سنیں"}</button>
        </div>

        {reader.isLoading ? <div className="reader-state" role="status"><LoaderCircle className="spin" size={20} />کتاب کی دستیابی دیکھی جا رہی ہے…</div> : null}
        {reader.isError ? <div className="reader-state reader-state-error" role="alert">کتابی ماخذ سے رابطہ نہیں ہو سکا۔ اصل کتاب کی فہرست کھولی جا سکتی ہے۔</div> : null}

        {readable && detail?.readerUrl ? (
          <iframe className="archive-reader-frame" title={`${book.title} — Internet Archive BookReader`} src={detail.readerUrl} allow="fullscreen" />
        ) : (
          <div className="reader-detail-scroll">
            <div className="reader-detail-grid">
              <div className="reader-detail-cover"><BookCover book={{ ...book, coverUrl: detail?.coverUrl ?? book.coverUrl }} large /></div>
              <div className="reader-detail-copy">
                <span className="book-source-pill">{sourceLabels[book.source]}</span>
                <h2>{book.title}</h2>
                <p className="detail-author">{book.author}{book.year ? ` · ${book.year}` : ""}</p>
                <p className="detail-access">{accessText(book)}</p>
                <p className="detail-summary" style={{ fontSize }}>{detail?.summary || book.summary || "اس کتاب کے لیے ماخذ نے تعارف فراہم نہیں کیا۔ کتاب منتخب کرنے سے اس کی تصدیق شدہ ماخذ فہرست سامنے آ گئی ہے۔"}</p>
                {book.languages.length ? <p className="detail-languages">زبان: {book.languages.slice(0, 4).map(languageText).join("، ")}</p> : null}
                {reader.data?.readable === false ? <p className="reader-notice">یہ ریکارڈ اس وقت اس ماخذ میں پڑھنے کے لیے کھلا نہیں۔ ادھار یا دستیابی دیکھنے کے لیے اصل لائبریری میں جائیں۔</p> : null}
                {book.source === "gutenberg" ? <p className="reader-notice">Project Gutenberg کی حقوق کی معلومات امریکی catalog کے مطابق ہے؛ اپنے ملک کے copyright قوانین بھی دیکھیں۔</p> : null}
                <button type="button" className="button button-primary source-open-button" onClick={openSource}>اصل کتابی ماخذ کھولیں <ExternalLink size={16} /></button>
                <a className="source-attribution" href={detail?.sourceUrl ?? book.sourceUrl} target="_blank" rel="noreferrer">ماخذ: {sourceLabels[book.source]} · الگ کھولیں</a>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default function Library() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [source, setSource] = useState<BookSource>("openlibrary");
  const [language, setLanguage] = useState<BookLanguage>("all");
  const [genre, setGenre] = useState<BookGenre>("all");
  const [page, setPage] = useState(1);
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [resultCount, setResultCount] = useState<number | null>(null);
  const [shelf, setShelf] = useState<Shelf>(loadShelf);
  const [selectedBook, setSelectedBook] = useState<BookSummary | null>(null);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [dark, setDark] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    try { setDark(window.localStorage.getItem("varq-theme-v1") === "dark"); } catch { setDark(false); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setSubmittedQuery(query.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPage(1);
    setBooks([]);
    setHasNext(false);
  }, [submittedQuery, source, language, genre]);

  const input = useMemo(() => ({ query: submittedQuery, source, language, genre, page }), [submittedQuery, source, language, genre, page]);
  const result = trpc.books.search.useQuery(input, {
    staleTime: 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!result.data) return;
    setSearchError("");
    setBooks((current) => {
      const combined = page === 1 ? result.data.books : [...current, ...result.data.books];
      return Array.from(new Map(combined.map((book) => [book.id, book])).values());
    });
    setHasNext(result.data.hasNext);
    if (typeof result.data.count === "number") {
      setResultCount(result.data.count);
    } else if (page === 1) setResultCount(null);
  }, [result.data, page]);

  useEffect(() => {
    if (result.error) setSearchError("کتابوں کے catalog سے رابطہ نہیں ہو سکا۔ چند لمحوں بعد دوبارہ کوشش کریں۔");
  }, [result.error]);

  const persistShelf = (next: Shelf) => {
    setShelf(next);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* Private browsing can block storage. */ }
  };

  const toggleSaved = (book: BookSummary) => {
    const next = toggleBookInShelf(shelf, book);
    persistShelf(next);
  };

  const closeSelectedBook = useCallback(() => setSelectedBook(null), []);
  const openSource = (url: string) => window.open(url, "_blank", "noopener,noreferrer");
  const visibleBooks = showSavedOnly ? Object.values(shelf).sort((a, b) => b.savedAt - a.savedAt).map((item) => item.book) : books;
  const savedCount = Object.keys(shelf).length;
  const setTheme = () => {
    const next = !dark;
    setDark(next);
    try { window.localStorage.setItem("varq-theme-v1", next ? "dark" : "light"); } catch { /* Browser storage may be unavailable. */ }
  };

  return (
    <div className={dark ? "world-app world-dark" : "world-app"} dir="rtl">
      <header className="world-header">
        <Link href="/" className="world-brand" aria-label="ورق — کتابوں کی لائبریری"><span className="world-brand-mark">و</span><span><b>وَرَق</b><small>دنیا کی کتابیں، ایک مطالعہ گاہ</small></span></Link>
        <label className="world-search">
          <Search size={19} aria-hidden="true" />
          <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setShowSavedOnly(false); }} placeholder="کتاب، مصنف یا موضوع تلاش کریں…" aria-label="دنیا بھر کی کتابوں میں تلاش" />
          {query ? <button type="button" aria-label="تلاش صاف کریں" onClick={() => setQuery("")}><X size={16} /></button> : null}
        </label>
        <nav className="world-actions" aria-label="کتب خانے کے اختیارات">
          <button type="button" className={showSavedOnly ? "world-nav-button active" : "world-nav-button"} onClick={() => setShowSavedOnly((value) => !value)}><LibraryBig size={17} /> میری لائبریری <span>{savedCount}</span></button>
          <button type="button" className="world-theme-button" onClick={setTheme} aria-label={dark ? "لائٹ موڈ" : "ڈارک موڈ"}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
        </nav>
      </header>

      <main className="world-main">
        <section className="world-hero">
          <div className="world-hero-copy">
            <span className="world-kicker"><span className="world-kicker-dot" /> مختلف ملکوں، زبانوں اور زمانوں کی کتابیں</span>
            <h1>ایک کتاب منتخب کریں،<br /><em>اور اسی لمحے کھل جائے۔</em></h1>
            <p>کتابی تلاش Open Library اور Project Gutenberg کے catalog سے۔ پڑھنے کی سہولت ہر کتاب کے اصل ماخذ اور دستیابی پر منحصر ہے۔</p>
          <div className="world-hero-tags"><span><BookOpenCheck size={15} /> لاکھوں کتابوں کی تلاش</span><span><Headphones size={15} /> خلاصہ سننے کی سہولت</span></div>
          </div>
          <div className="world-hero-art" aria-hidden="true">
            <div className="hero-book hero-book-back"><b>Stories<br />of the world</b></div>
            <div className="hero-book hero-book-mid"><BookOpen size={30} strokeWidth={1.2} /><b>كتب<br />書籍<br />BOOKS</b></div>
            <div className="hero-book hero-book-front"><span>و</span><b>ہر زبان<br />کی ایک دنیا</b><small>وَرَق · VARQ</small></div>
            <span className="hero-orbit orbit-one" /><span className="hero-orbit orbit-two" />
          </div>
        </section>

        <section className="world-discovery" aria-labelledby="catalog-title">
          <div className="world-section-heading">
            <div><span className="world-eyebrow">کُتب خانہ</span><h2 id="catalog-title">{showSavedOnly ? "آپ کی محفوظ کتابیں" : "مطالعے کے لیے دریافت کریں"}</h2></div>
            <span className="world-count">{showSavedOnly ? savedCount : resultCount !== null ? `${formatCount(resultCount)}+ نتائج` : "عالمی catalog"}</span>
          </div>

          {!showSavedOnly ? <>
            <div className="source-tabs" role="group" aria-label="کتابوں کا ماخذ">
              {(["openlibrary", "gutenberg"] as const).map((item) => (
                <button key={item} type="button" className={source === item ? "source-tab active" : "source-tab"} onClick={() => setSource(item)} aria-pressed={source === item}>{sourceLabels[item]}</button>
              ))}
              <span className="source-help">{source === "openlibrary" ? "وسیع عالمی catalog؛ کچھ کتابیں ادھار یا صرف فہرست کی صورت میں" : "متعدد زبانوں کی مفت کلاسیکی کتابیں؛ حقوق ملک کے لحاظ سے بدل سکتے ہیں"}</span>
            </div>
            <div className="world-filters">
              <label><span>زبان</span><select value={language} onChange={(event) => setLanguage(event.target.value as BookLanguage)}>{languageOptions.map((item) => <option value={item} key={item}>{BOOK_LANGUAGE_LABELS[item]}</option>)}</select></label>
              <label><span>موضوع</span><select value={genre} onChange={(event) => setGenre(event.target.value as BookGenre)}>{genreOptions.map((item) => <option value={item} key={item}>{BOOK_GENRE_LABELS[item]}</option>)}</select></label>
              <span className="result-source-note"><span className="source-dot" /> {sourceLabels[source]} سے تازہ معلومات</span>
            </div>
          </> : <div className="saved-info-row">کتاب کا cover منتخب کریں تو وہ اسی صفحے پر کھلے گی؛ نشان لگا کر اسے یہاں محفوظ رکھیں۔</div>}

          {searchError ? <div className="catalog-state catalog-error" role="alert">{searchError}<button type="button" onClick={() => { setSearchError(""); void result.refetch(); }}>دوبارہ کوشش <ChevronLeft size={15} /></button></div> : null}
          {!showSavedOnly && result.isLoading && page === 1 ? <div className="catalog-state" role="status"><LoaderCircle className="spin" size={21} /> کتابوں کا catalog تلاش ہو رہا ہے…</div> : null}
          {!showSavedOnly && result.isFetching && page > 1 ? <div className="catalog-loading-more" role="status"><LoaderCircle className="spin" size={17} /> مزید کتابیں لوڈ ہو رہی ہیں…</div> : null}

          {visibleBooks.length ? <div className="world-book-grid">
            {visibleBooks.map((book, index) => {
              const saved = Boolean(shelf[book.id]);
              return (
                <button type="button" className="world-book-card" key={book.id} onClick={() => setSelectedBook(book)} aria-label={`${book.title}، ${book.author} — کتاب کھولیں`}>
                  <span className="world-cover-wrap">
                    <BookCover book={book} />
                    {index < 3 && !showSavedOnly && !submittedQuery ? <span className="world-rank">{index === 0 ? "مقبول" : `0${index + 1}`}</span> : null}
                    <span className={`access-dot access-${book.access}`} title={accessText(book)} aria-label={accessText(book)} />
                    {saved ? <span className="cover-saved-mark" aria-label="محفوظ"><BookmarkCheck size={17} fill="currentColor" /></span> : null}
                  </span>
                  <span className="world-book-title">{book.title}</span>
                  <span className="world-book-author">{book.author}</span>
                  <span className="world-book-meta">{book.year ? `${book.year} · ` : ""}{book.languages.slice(0, 2).map(languageText).join(" · ") || sourceLabels[book.source]}</span>
                </button>
              );
            })}
          </div> : null}

          {!result.isLoading && !showSavedOnly && !searchError && !visibleBooks.length ? <div className="catalog-state catalog-empty"><BookOpen size={23} />اس تلاش کے لیے کوئی نتیجہ نہیں ملا۔ کوئی دوسرا عنوان یا مصنف آزمائیں۔</div> : null}
          {showSavedOnly && !visibleBooks.length ? <div className="catalog-state catalog-empty"><Bookmark size={22} />آپ کی لائبریری ابھی خالی ہے۔ کسی کتاب کو کھول کر bookmark نشان لگائیں۔</div> : null}
          {!showSavedOnly && hasNext ? <button className="world-more-button" type="button" onClick={() => setPage((current) => Math.min(current + 1, 250))} disabled={result.isFetching}><ArrowDown size={16} /> مزید کتابیں دیکھیں <span>{source === "gutenberg" ? "اگلے 32 نتائج" : "اگلا صفحہ"}</span></button> : null}
        </section>

        <section className="quran-shelf">
          <div><span className="world-eyebrow">خصوصی مجموعہ</span><h2>قرآنِ کریم</h2><p>پہلے والا قرآن مطالعہ، تلاوت، سیکھنے اور آیات کے حوالوں کے ساتھ سوال جواب یہاں موجود ہے۔</p></div>
          <Link href="/quran" className="quran-shelf-link">قرآن کا صفحہ کھولیں <ChevronLeft size={18} /></Link>
        </section>
        <p className="world-footnote">کتابی metadata: {sourceLabels[source]}. Covers اور پڑھنے کی سہولت ہر ریکارڈ کے اصل ماخذ کے تابع ہیں۔ “Public domain” کی حیثیت خطے کے قانون کے مطابق مختلف ہو سکتی ہے۔</p>
      </main>

      <footer className="world-footer"><span>وَرَق · مطالعے کے لیے ایک جگہ</span><a href="https://openlibrary.org/developers/api" target="_blank" rel="noreferrer">Open Library API</a><a href="https://www.gutenberg.org/policy/terms_of_use.html" target="_blank" rel="noreferrer">Project Gutenberg · حقوق و شرائط</a></footer>

      {selectedBook ? <BookReader book={selectedBook} onClose={closeSelectedBook} saved={Boolean(shelf[selectedBook.id])} onToggleSaved={() => toggleSaved(selectedBook)} onOpenSource={openSource} /> : null}
    </div>
  );
}
