# Methodology

The portfolio evidence describes the document that is actually published. `npm run results` reads `index.html` and records structural counts in `reports/results.json`. It also renders the SVG from those same values. No count in the report is manually maintained.

## What is measured

- Semantic sections and project cards in the HTML.
- Research cards, external links, GitHub links and local images.
- Internal-link integrity, duplicate IDs, the main landmark, skip navigation, canonical metadata and structured data.
- The byte sizes of the HTML document and downloadable CV.

## Verification strategy

Pure parsing functions have branch, function and line coverage thresholds. Browser tests exercise the rendered interface at desktop and mobile widths, including navigation, filtering, the command palette, the CV response, contact paths, reduced motion and horizontal overflow. The checks deliberately avoid treating external project availability as a unit-test concern because those destinations are owned and deployed separately.

## Reproducibility

Run `npm ci && npm run results`. The output is deterministic for a fixed `index.html` and `PWCV.pdf`. The source date is pinned so repeated runs do not create meaningless timestamp changes.
