import test from "node:test";
import assert from "node:assert/strict";
import {
  attributesOf,
  auditDocument,
  collectAnchors,
  collectIds,
  collectSections,
  countMatches,
  publicSummary,
  stripTags
} from "../../scripts/site-model.mjs";

const fixture = `<!doctype html><html><head>
<title>Test Portfolio</title>
<meta name="description" content="A useful portfolio">
<link rel="canonical" href="https://example.com/">
<script type="application/ld+json">{"@type":"Person"}</script>
</head><body><a class="skip-link" href="#main">Skip</a><main id="main">
<section id="work"><h2>Selected <span>work</span></h2>
<article class="live-card"></article><article class="r-card"></article></section>
<a href="#work">Work</a><a href="https://github.com/example/repo" target="_blank">Source</a>
<a href="mailto:test@example.com">Email</a><img src="work.png" alt="Work"></main></body></html>`;

test("countMatches counts all global matches", () => assert.equal(countMatches("aaaa", /a/g), 4));
test("countMatches returns zero", () => assert.equal(countMatches("abc", /z/g), 0));
test("countMatches rejects non-global expressions", () => assert.throws(() => countMatches("a", /a/), /global/));
test("countMatches rejects non-RegExp values", () => assert.throws(() => {
  // @ts-expect-error Runtime validation rejects non-RegExp input.
  countMatches("a", "a");
}, /global/));
test("stripTags removes elements", () => assert.equal(stripTags("<b>Hello</b> world"), "Hello world"));
test("stripTags removes scripts", () => assert.equal(stripTags("A<script>alert(1)</script>B"), "A B"));
test("stripTags removes styles", () => assert.equal(stripTags("A<style>b{}</style>B"), "A B"));
test("stripTags decodes supported entities", () => assert.equal(stripTags("A&amp;B&nbsp;C"), "A&B C"));
test("stripTags collapses whitespace", () => assert.equal(stripTags("  A\n  B "), "A B"));
test("attributesOf reads double quotes", () => assert.deepEqual(attributesOf('<a href="/" id="x">'), { href: "/", id: "x" }));
test("attributesOf reads single quotes", () => assert.deepEqual(attributesOf("<a data-x='y'>"), { "data-x": "y" }));
test("attributesOf lowercases names", () => assert.deepEqual(attributesOf('<a HREF="/">'), { href: "/" }));
test("collectIds preserves document order", () => assert.deepEqual(collectIds('<p id="a"></p><p id="b"></p>'), ["a", "b"]));
test("collectIds handles single quotes", () => assert.deepEqual(collectIds("<p id='a'></p>"), ["a"]));
test("collectAnchors reads href", () => assert.equal(collectAnchors('<a href="/x">X</a>')[0].href, "/x"));
test("collectAnchors reads text label", () => assert.equal(collectAnchors('<a href="/x"><span>X</span> Y</a>')[0].label, "X Y"));
test("collectAnchors reads target", () => assert.equal(collectAnchors('<a href="/" target="_blank">X</a>')[0].target, "_blank"));
test("collectAnchors defaults missing attributes", () => assert.deepEqual(collectAnchors("<a>X</a>")[0], { href: "", label: "X", target: "" }));
test("collectSections reads IDs", () => assert.equal(collectSections(fixture)[0].id, "work"));
test("collectSections flattens heading markup", () => assert.equal(collectSections(fixture)[0].heading, "Selected work"));
test("collectSections permits unnamed sections", () => assert.deepEqual(collectSections("<section>Body</section>"), [{ id: "", heading: "" }]));
test("auditDocument extracts title", () => assert.equal(auditDocument(fixture).title, "Test Portfolio"));
test("auditDocument extracts description", () => assert.equal(auditDocument(fixture).description, "A useful portfolio"));
test("auditDocument validates internal targets", () => assert.deepEqual(auditDocument(fixture).missingTargets, []));
test("auditDocument reports missing targets once", () => assert.deepEqual(auditDocument(fixture + '<a href="#absent">A</a><a href="#absent">B</a>').missingTargets, ["absent"]));
test("auditDocument reports duplicate IDs", () => assert.deepEqual(auditDocument(fixture.replace("</main>", '<p id="main"></p></main>')).duplicateIds, ["main"]));
test("auditDocument counts card types", () => assert.deepEqual([auditDocument(fixture).liveProjectCards, auditDocument(fixture).researchCards], [1, 1]));
test("auditDocument counts external and GitHub links", () => assert.deepEqual([auditDocument(fixture).externalLinkCount, auditDocument(fixture).githubLinkCount], [1, 1]));
test("auditDocument counts mail and image elements", () => assert.deepEqual([auditDocument(fixture).mailtoCount, auditDocument(fixture).imageCount], [1, 1]));
test("auditDocument finds semantic and metadata features", () => {
  const audit = auditDocument(fixture);
  assert.equal(audit.hasMain, true);
  assert.equal(audit.hasSkipLink, true);
  assert.equal(audit.hasCanonical, true);
  assert.equal(audit.hasStructuredData, true);
});
test("auditDocument defaults absent title and description", () => {
  const audit = auditDocument("<html></html>");
  assert.equal(audit.title, "");
  assert.equal(audit.description, "");
});
test("publicSummary creates a stable evidence envelope", () => {
  const summary = publicSummary(auditDocument(fixture), 1000, 2000);
  assert.equal(summary.sourceDate, "2026-09-16");
  assert.equal(summary.page.htmlBytes, 1000);
  assert.equal(summary.page.cvBytes, 2000);
  assert.deepEqual(summary.integrity.missingInternalTargets, []);
});
