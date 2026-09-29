export type CatalogSurah = {
  number: number;
  arabicName: string;
  englishName: string;
  englishNameTranslation: string;
  ayahCount: number;
  revelationType: string;
};

export type SurahFilter = "all" | "meccan" | "medinan" | "saved";

export function parseSavedSurahs(serialized: string | null): number[] {
  if (!serialized) return [];
  try {
    const values: unknown = JSON.parse(serialized);
    if (!Array.isArray(values)) return [];
    return Array.from(new Set(values.filter((value): value is number => Number.isInteger(value) && value >= 1 && value <= 114)))
      .sort((a, b) => a - b);
  } catch {
    return [];
  }
}

export function toggleSavedSurah(saved: number[], surahNumber: number): number[] {
  if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) return saved;
  return saved.includes(surahNumber)
    ? saved.filter((number) => number !== surahNumber)
    : [...saved, surahNumber].sort((a, b) => a - b);
}

export function filterSurahs(
  surahs: CatalogSurah[],
  query: string,
  filter: SurahFilter,
  saved: number[],
): CatalogSurah[] {
  const search = query.trim().toLocaleLowerCase();
  return surahs.filter((surah) => {
    const matchesSearch = !search || [
      surah.arabicName,
      surah.englishName,
      surah.englishNameTranslation,
      String(surah.number),
    ].some((value) => value.toLocaleLowerCase().includes(search));
    const place = surah.revelationType.toLocaleLowerCase();
    const matchesFilter = filter === "all"
      || (filter === "saved" && saved.includes(surah.number))
      || (filter === "meccan" && place.includes("mecc"))
      || (filter === "medinan" && (place.includes("medin") || place.includes("madin")));
    return matchesSearch && matchesFilter;
  });
}
