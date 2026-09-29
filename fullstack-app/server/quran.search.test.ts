import { beforeAll, describe, expect, it } from "vitest";
import { getAudioUrl, getAyah, getCorpus, getSurah, normalizeArabic, searchVerses } from "./quran";

beforeAll(async () => {
  const corpus = await getCorpus();
  expect(corpus.surahs).toHaveLength(114);
  expect(corpus.verses).toHaveLength(6236);
});

describe("Quran corpus", () => {
  it("preserves the complete first and last verse references", async () => {
    expect((await getAyah(1, 1))?.id).toBe("1:1");
    expect((await getAyah(114, 6))?.id).toBe("114:6");
    expect(await getAyah(115, 1)).toBeNull();
    expect(await getAyah(1, 8)).toBeNull();
  });

  it("returns metadata and ayahs for all surahs", async () => {
    const fatiha = await getSurah(1);
    const baqarah = await getSurah(2);
    expect(fatiha?.surah.arabicName).toBeTruthy();
    expect(fatiha?.surah.ayahCount).toBe(7);
    expect(fatiha?.verses).toHaveLength(7);
    expect(baqarah?.surah.ayahCount).toBe(286);
    expect(baqarah?.verses).toHaveLength(286);
    expect(await getSurah(0)).toBeNull();
  });

  it("normalizes Arabic without losing the original stored text", async () => {
    expect(normalizeArabic("أَللّٰهُ" )).toBe("الله");
    expect((await getAyah(1, 1))?.text).toContain("بِسْمِ");
  });

  it("retrieves ablution evidence from the relevant Quran passage", async () => {
    const matches = await searchVerses("وضو کے بارے میں قرآن کیا کہتا ہے؟");
    expect(matches.some((verse) => verse.id === "5:6")).toBe(true);
    expect(matches.some((verse) => verse.id === "4:43")).toBe(true);
    expect(matches.some((verse) => verse.id === "5:33")).toBe(false);
  });

  it("retrieves the face-mark/sujud passage for conceptual search", async () => {
    const matches = await searchVerses("سجدے کے نشان کا ذکر");
    expect(matches.some((verse) => verse.id === "48:29")).toBe(true);
  });

  it("retrieves Quran references in English questions", async () => {
    const matches = await searchVerses("What does the Quran say about patience?");
    expect(matches.length).toBeGreaterThan(0);
  });

  it("builds a known EveryAyah file path for the selected reciter", () => {
    expect(getAudioUrl(1, 1, "alafasy")).toBe("https://everyayah.com/data/Alafasy_128kbps/001001.mp3");
  });
});
