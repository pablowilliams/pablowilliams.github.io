import { cp, mkdir, rm } from "node:fs/promises";

const entries = ["index.html", "PWCV.pdf", "assets", "reports"];
await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
for (const entry of entries) await cp(entry, `dist/${entry}`, { recursive: true });
console.log(`Built dist/ from ${entries.length} published entries.`);
