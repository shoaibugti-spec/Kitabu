import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const source = resolve("server/data/quran.json");
const destination = resolve("dist/data/quran.json");
const corpus = JSON.parse(await readFile(source, "utf8"));
if (corpus.surahs?.length !== 114 || corpus.verses?.length !== 6236) {
  throw new Error("Refusing to package an incomplete Quran corpus.");
}
await mkdir(resolve("dist/data"), { recursive: true });
await writeFile(destination, JSON.stringify(corpus));
console.log(`Packaged ${corpus.surahs.length} surahs and ${corpus.verses.length} ayahs at ${destination}.`);
