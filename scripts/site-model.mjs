/**
 * Return every non-overlapping match for a regular expression.
 * @param {string} text
 * @param {RegExp} expression
 */
export function countMatches(text, expression) {
  if (!(expression instanceof RegExp) || !expression.global) {
    throw new TypeError("expression must be a global regular expression");
  }
  return [...text.matchAll(expression)].length;
}

/**
 * Remove markup and collapse whitespace for stable text comparisons.
 * @param {string} value
 */
export function stripTags(value) {
  return value
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parse quoted HTML attributes from one opening tag.
 * @param {string} tag
 * @returns {Record<string, string>}
 */
export function attributesOf(tag) {
  /** @type {Record<string, string>} */
  const attributes = {};
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(["'])([\s\S]*?)\2/g)) {
    attributes[match[1].toLowerCase()] = match[3];
  }
  return attributes;
}

/** @param {string} html */
export function collectIds(html) {
  /** @type {string[]} */
  const ids = [];
  for (const match of html.matchAll(/\sid\s*=\s*(["'])(.*?)\1/gi)) ids.push(match[2]);
  return ids;
}

/** @param {string} html */
export function collectAnchors(html) {
  /** @type {{href: string, label: string, target: string}[]} */
  const anchors = [];
  for (const match of html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)) {
    const openTag = match[0].slice(0, match[0].indexOf(">") + 1);
    const attrs = attributesOf(openTag);
    anchors.push({ href: attrs.href ?? "", label: stripTags(match[0]), target: attrs.target ?? "" });
  }
  return anchors;
}

/** @param {string} html */
export function collectSections(html) {
  /** @type {{id: string, heading: string}[]} */
  const sections = [];
  for (const match of html.matchAll(/<section\b([^>]*)>([\s\S]*?)<\/section>/gi)) {
    const attrs = attributesOf(`<section${match[1]}>`);
    const heading = match[2].match(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/i);
    sections.push({ id: attrs.id ?? "", heading: heading ? stripTags(heading[1]) : "" });
  }
  return sections;
}

/** @param {string} html */
export function auditDocument(html) {
  const ids = collectIds(html);
  const anchors = collectAnchors(html);
  const internalTargets = anchors.filter(({ href }) => href.startsWith("#") && href.length > 1);
  const missingTargets = [...new Set(internalTargets.map(({ href }) => href.slice(1)).filter((id) => !ids.includes(id)))];
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "";
  const description = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1] ?? "";
  const cards = countMatches(html, /<article\b[^>]*class=["'][^"']*\blive-card\b[^"']*["']/gi);
  const researchCards = countMatches(html, /<article\b[^>]*class=["'][^"']*\br-card\b[^"']*["']/gi);
  const externalLinks = anchors.filter(({ href }) => /^https:\/\//.test(href));
  return {
    title,
    description,
    ids,
    sections: collectSections(html),
    anchors,
    internalTargetCount: internalTargets.length,
    missingTargets,
    duplicateIds,
    liveProjectCards: cards,
    researchCards,
    externalLinkCount: externalLinks.length,
    githubLinkCount: externalLinks.filter(({ href }) => href.includes("github.com/" )).length,
    mailtoCount: anchors.filter(({ href }) => href.startsWith("mailto:")).length,
    imageCount: countMatches(html, /<img\b/gi),
    hasMain: /<main\b[^>]*id=["']main["']/i.test(html),
    hasSkipLink: /class=["'][^"']*\bskip-link\b/i.test(html),
    hasCanonical: /<link\b[^>]*rel=["']canonical["']/i.test(html),
    hasStructuredData: /type=["']application\/ld\+json["']/i.test(html)
  };
}

/**
 * @param {ReturnType<typeof auditDocument>} audit
 * @param {number} htmlBytes
 * @param {number} cvBytes
 */
export function publicSummary(audit, htmlBytes, cvBytes) {
  return {
    sourceDate: "2026-09-16",
    page: {
      title: audit.title,
      htmlBytes,
      sectionCount: audit.sections.length,
      liveProjectCards: audit.liveProjectCards,
      researchCards: audit.researchCards,
      externalLinkCount: audit.externalLinkCount,
      githubLinkCount: audit.githubLinkCount,
      imageCount: audit.imageCount,
      cvBytes
    },
    integrity: {
      duplicateIds: audit.duplicateIds,
      missingInternalTargets: audit.missingTargets,
      hasMain: audit.hasMain,
      hasSkipLink: audit.hasSkipLink,
      hasCanonical: audit.hasCanonical,
      hasStructuredData: audit.hasStructuredData
    }
  };
}
