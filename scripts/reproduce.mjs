import { readFile, writeFile, mkdir } from "node:fs/promises";
import { auditDocument, publicSummary } from "./site-model.mjs";

const htmlBuffer = await readFile("index.html");
const cvBuffer = await readFile("PWCV.pdf");
const html = htmlBuffer.toString("utf8");
const results = publicSummary(auditDocument(html), htmlBuffer.length, cvBuffer.length);

await mkdir("reports/figures", { recursive: true });
await writeFile("reports/results.json", `${JSON.stringify(results, null, 2)}\n`);

/** @type {Array<[string, number]>} */
const rows = [
  ["Portfolio sections", results.page.sectionCount],
  ["Live project cards", results.page.liveProjectCards],
  ["Research cards", results.page.researchCards],
  ["GitHub links", results.page.githubLinkCount]
];
const maximum = Math.max(...rows.map(([, value]) => value));
const bars = rows.map(([label, value], index) => {
  const y = 42 + index * 42;
  const width = Math.round((value / maximum) * 340);
  return `<text x="16" y="${y}" fill="#b6cabf" font-family="Arial" font-size="13">${label}</text><rect x="154" y="${y - 14}" width="340" height="16" rx="3" fill="#1b2c24"/><rect x="154" y="${y - 14}" width="${width}" height="16" rx="3" fill="#2fd79a"/><text x="508" y="${y}" fill="#ecf4ef" font-family="Arial" font-size="13">${value}</text>`;
}).join("");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="550" height="205" viewBox="0 0 550 205" role="img" aria-labelledby="title desc"><title id="title">Published portfolio inventory</title><desc id="desc">Counts extracted from index.html on 16 September 2026.</desc><rect width="550" height="205" fill="#07100c"/><text x="16" y="20" fill="#ecf4ef" font-family="Arial" font-weight="700" font-size="15">Published portfolio inventory</text>${bars}<text x="16" y="195" fill="#7e988b" font-family="Arial" font-size="10">Source: index.html. Method: deterministic HTML inventory.</text></svg>`;
await writeFile("reports/figures/portfolio-inventory.svg", `${svg}\n`);
console.log(JSON.stringify(results, null, 2));
