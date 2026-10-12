/**
 * Parses the committed index.html into a canonical project manifest.
 *
 * The revamp brief forbids rewriting the inventory from memory, so every
 * project in the new page is migrated from this file rather than retyped.
 * Run: node scripts/extract-inventory.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { stripTags, attributesOf } from "./site-model.mjs";

const html = readFileSync("index.html", "utf8");

/** @param {string} block @param {RegExp} re */
const first = (block, re) => block.match(re)?.[1]?.trim() ?? "";

/** @param {string} block */
function links(block) {
  /** @type {{href: string, label: string}[]} */
  const out = [];
  for (const m of block.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const attrs = attributesOf(`<a${m[1]}>`);
    const href = attrs.href ?? "";
    if (!/^https?:/.test(href)) continue;
    out.push({ href, label: stripTags(m[2]).replace(/\s+/g, " ").trim() });
  }
  return out;
}

/** @param {string} block */
/** @param {string} block @param {string} cls */
function chips(block, cls) {
  return [...block.matchAll(new RegExp(`<span class="${cls}[^"]*"[^>]*>([^<]*)</span>`, "gi"))]
    .map((m) => m[1].trim())
    .filter((t) => t && !/^\+/.test(t));
}

/** @param {string} block */
function kpis(block) {
  /** @type {{label: string, value: string}[]} */
  const out = [];
  for (const cell of block.matchAll(/<div class="kpi-cell">([\s\S]*?)<\/div>/gi)) {
    const label = first(cell[1], /<dt class="kpi-label">([\s\S]*?)<\/dt>/i);
    const value = stripTags(first(cell[1], /<dd class="kpi-value"[^>]*>([\s\S]*?)<\/dd>/i));
    if (label) out.push({ label, value });
  }
  return out;
}

/** @param {string} s */
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** @type {any[]} */
const projects = [];

for (const m of html.matchAll(/<article\b([^>]*class="[^"]*\blive-card\b[^"]*"[^>]*)>([\s\S]*?)<\/article>/gi)) {
  const block = m[2];
  const title = stripTags(first(block, /<h3\b[^>]*>([\s\S]*?)<\/h3>/i));
  const idLine = stripTags(first(block, /<span class="id">([\s\S]*?)<\/span>/i));
  const all = links(block);
  projects.push({
    key: slug(title),
    ref: idLine.split("·")[0].trim(),
    title,
    kind: "live",
    category: stripTags(first(block, /<span class="cat-tag">([\s\S]*?)<\/span>/i)),
    isLive: /class="cat-live"/.test(block),
    summary: stripTags(first(block, /<h3\b[^>]*>[\s\S]*?<\/h3>\s*<p>([\s\S]*?)<\/p>/i)).replace(/\s+/g, " "),
    kpis: kpis(block),
    flow: stripTags(first(block, /<p class="arch-flow[^"]*"[^>]*>([\s\S]*?)<\/p>/i)).replace(/→/g, "->").replace(/\s+/g, " ").trim(),
    stack: chips(block, "chip"),
    live: all.find((l) => !/github\.com/.test(l.href))?.href ?? "",
    source: all.find((l) => /github\.com/.test(l.href))?.href ?? ""
  });
}

for (const m of html.matchAll(/<article\b([^>]*class="[^"]*\br-card\b[^"]*"[^>]*)>([\s\S]*?)<\/article>/gi)) {
  const attrs = attributesOf(`<article${m[1]}>`);
  const block = m[2];
  const title = stripTags(first(block, /<h3\b[^>]*>([\s\S]*?)<\/h3>/i));
  const all = links(block);
  projects.push({
    key: attrs.id || slug(title),
    ref: stripTags(first(block, /<span class="r-id">([\s\S]*?)<\/span>/i)),
    title,
    kind: "research",
    category: stripTags(first(block, /<span class="tag">([\s\S]*?)<\/span>/i)),
    theme: attrs["data-theme"] ?? "",
    tags: (attrs["data-tags"] ?? "").split(/\s+/).filter(Boolean),
    subtitle: stripTags(first(block, /<p class="sub">([\s\S]*?)<\/p>/i)),
    summary: stripTags(first(block, /<\/p>\s*<p>([\s\S]*?)<\/p>/i)).replace(/\s+/g, " "),
    stack: [...block.matchAll(/<div class="stack">([\s\S]*?)<\/div>/gi)]
      .flatMap((s) => [...s[1].matchAll(/<span>([^<]*)<\/span>/g)].map((x) => x[1].trim())),
    live: all.find((l) => !/github\.com/.test(l.href))?.href ?? "",
    source: all.find((l) => /github\.com/.test(l.href))?.href ?? ""
  });
}

const dupes = projects.map((p) => p.key).filter((k, i, a) => a.indexOf(k) !== i);
const manifest = {
  generatedFrom: "index.html",
  counts: {
    total: projects.length,
    live: projects.filter((p) => p.kind === "live").length,
    research: projects.filter((p) => p.kind === "research").length,
    withLiveUrl: projects.filter((p) => p.live).length,
    withSource: projects.filter((p) => p.source).length
  },
  duplicateKeys: [...new Set(dupes)],
  projects
};

writeFileSync("reports/inventory.json", `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest.counts, null, 2));
console.log("duplicate keys:", manifest.duplicateKeys);
console.log("missing title:", projects.filter((p) => !p.title).length);
console.log("missing summary:", projects.filter((p) => !p.summary).length);

// --- credentials -----------------------------------------------------------
const credSection = html.match(/<section[^>]*id="credentials"[\s\S]*?<\/section>/i)?.[0] ?? "";
const credentials = [...credSection.matchAll(/<article\b([^>]*class="[^"]*\bcert\b[^"]*"[^>]*)>([\s\S]*?)<\/article>/gi)].map((m) => {
  const attrs = attributesOf(`<article${m[1]}>`);
  const b = m[2];
  const issuerLine = stripTags(first(b, /<span class="issuer">([\s\S]*?)<\/span>/i));
  return {
    issuer: attrs["data-issuer"] ?? "",
    title: stripTags(first(b, /<h3\b[^>]*>([\s\S]*?)<\/h3>/i)),
    organisation: issuerLine.split("·")[0].trim(),
    date: issuerLine.split("·")[1]?.trim() ?? "",
    id: stripTags(first(b, /<span class="date">ID ([\s\S]*?)<\/span>/i)),
    verify: first(b, /<a class="verify" href="([^"]+)"/i)
  };
});

const full = JSON.parse(readFileSync("reports/inventory.json", "utf8"));
full.credentials = credentials;
full.counts.credentials = credentials.length;
full.counts.issuers = new Set(credentials.map((c) => c.organisation)).size;
writeFileSync("reports/inventory.json", `${JSON.stringify(full, null, 2)}\n`);
console.log("credentials:", credentials.length, "issuers:", full.counts.issuers);
