import { describe, expect, it } from "vitest";
import { filterSurahs, parseSavedSurahs, toggleSavedSurah, type CatalogSurah } from "../client/src/lib/surahCatalog";

const surahs: CatalogSurah[] = [
  { number: 1, arabicName: "الفاتحة", englishName: "Al-Faatiha", englishNameTranslation: "The Opening", ayahCount: 7, revelationType: "Meccan" },
  { number: 2, arabicName: "البقرة", englishName: "Al-Baqara", englishNameTranslation: "The Cow", ayahCount: 286, revelationType: "Medinan" },
  { number: 112, arabicName: "الإخلاص", englishName: "Al-Ikhlaas", englishNameTranslation: "The Sincerity", ayahCount: 4, revelationType: "Meccan" },
];

describe("Quran surah catalog", () => {
  it("filters by Arabic, English, translation, or surah number", () => {
    expect(filterSurahs(surahs, "البقرة", "all", []).map((surah) => surah.number)).toEqual([2]);
    expect(filterSurahs(surahs, "opening", "all", []).map((surah) => surah.number)).toEqual([1]);
    expect(filterSurahs(surahs, "112", "all", []).map((surah) => surah.number)).toEqual([112]);
  });

  it("keeps Meccan, Medinan, and saved filters separate", () => {
    expect(filterSurahs(surahs, "", "meccan", []).map((surah) => surah.number)).toEqual([1, 112]);
    expect(filterSurahs(surahs, "", "medinan", []).map((surah) => surah.number)).toEqual([2]);
    expect(filterSurahs(surahs, "", "saved", [2]).map((surah) => surah.number)).toEqual([2]);
  });

  it("loads only unique, valid surah bookmarks and safely handles bad storage", () => {
    expect(parseSavedSurahs("[2,1,2,114,0,115,\"3\"]")).toEqual([1, 2, 114]);
    expect(parseSavedSurahs("not-json")).toEqual([]);
    expect(parseSavedSurahs("{} ")).toEqual([]);
  });

  it("adds and removes bookmarks without allowing invalid surah numbers", () => {
    expect(toggleSavedSurah([2], 1)).toEqual([1, 2]);
    expect(toggleSavedSurah([1, 2], 2)).toEqual([1]);
    expect(toggleSavedSurah([1], 115)).toEqual([1]);
  });
});
