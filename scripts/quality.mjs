import { execFileSync } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import { auditDocument } from "./site-model.mjs";

const required = [
  "README.md", "LICENSE", "CITATION.cff", "Dockerfile", "compose.yaml",
  ".env.example", "docs/ARCHITECTURE.md", "docs/METHODOLOGY.md",
  "docs/DATA.md", "reports/results.json", "reports/figures/portfolio-inventory.svg"
];
for (const file of required) await access(file);

const tracked = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" })
  .trim().split("\n").filter(Boolean);
const textExtensions = /\.(?:md|mjs|js|html|css|json|ya?ml|cff|txt|svg)$/;
const textFiles = tracked.filter((file) => textExtensions.test(file) || ["Dockerfile", "LICENSE", ".env.example"].includes(file));
for (const file of textFiles) {
  if ((await readFile(file, "utf8")).includes("\u2014")) throw new Error(`${file}: em dash is not allowed`);
}

for (const file of tracked.filter((name) => /\.(?:mjs|js)$/.test(name))) {
  execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
}

const html = await readFile("index.html", "utf8");
const audit = auditDocument(html);
if (!audit.title || !audit.description) throw new Error("Page title and description are required");
if (audit.duplicateIds.length) throw new Error(`Duplicate IDs: ${audit.duplicateIds.join(", ")}`);
if (audit.missingTargets.length) throw new Error(`Missing internal targets: ${audit.missingTargets.join(", ")}`);
if (!audit.hasMain || !audit.hasSkipLink) throw new Error("Main landmark and skip link are required");
if (!audit.hasCanonical || !audit.hasStructuredData) throw new Error("Canonical URL and structured data are required");
if (/id=["'](?:pwintro-root|jarvis-boot)["']/.test(html)) throw new Error("Visitors must not be blocked by a cinematic intro");

const readmeLines = (await readFile("README.md", "utf8")).split(/\r?\n/);
if (readmeLines[1] !== "This Output is produced by Claude") throw new Error("README disclosure must be line two");
console.log(`Quality checks passed for ${tracked.length} tracked and untracked files.`);
