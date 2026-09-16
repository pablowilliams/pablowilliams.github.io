from __future__ import annotations

import json
from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
RESULTS = json.loads((ROOT / "reports" / "results.json").read_text())
OUTPUT = ROOT / "reports" / "pablowilliams-github-io-one-page-report.pdf"


def wrap(text: str, font: str, size: float, width: float) -> list[str]:
    lines: list[str] = []
    current = ""
    for word in text.split():
        candidate = f"{current} {word}".strip()
        if stringWidth(candidate, font, size) <= width:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def paragraph(pdf: canvas.Canvas, text: str, x: float, y: float, width: float, size: float = 8.3, leading: float = 10.8) -> float:
    pdf.setFont("Helvetica", size)
    pdf.setFillColor(HexColor("#33423a"))
    for line in wrap(text, "Helvetica", size, width):
        pdf.drawString(x, y, line)
        y -= leading
    return y


pdf = canvas.Canvas(str(OUTPUT), pagesize=A4, invariant=1)
pdf.setTitle("Pablo Williams Portfolio: One-page project report")
pdf.setAuthor("Pablo Williams")
pdf.setSubject("Reproducible portfolio engineering evidence")
page_width, page_height = A4
margin = 42
accent = HexColor("#168765")
ink = HexColor("#15231d")
muted = HexColor("#64736b")
paper = HexColor("#f4f1e9")

pdf.setFillColor(paper)
pdf.rect(0, 0, page_width, page_height, stroke=0, fill=1)
pdf.setFillColor(ink)
pdf.setFont("Helvetica-Bold", 22)
pdf.drawString(margin, page_height - 50, "Pablo Williams Portfolio")
pdf.setFont("Helvetica", 9)
pdf.setFillColor(accent)
pdf.drawString(margin, page_height - 67, "This Output is produced by Claude")
pdf.setFillColor(muted)
pdf.drawRightString(page_width - margin, page_height - 50, "Pablo Williams | 16 September 2026")
pdf.drawRightString(page_width - margin, page_height - 64, "pablowilliams.github.io")
pdf.setStrokeColor(HexColor("#bdc9c1"))
pdf.line(margin, page_height - 78, page_width - margin, page_height - 78)

gap = 22
column_width = (page_width - 2 * margin - gap) / 2
left_x = margin
right_x = margin + column_width + gap
left_y = right_y = page_height - 100


def heading(text: str, x: float, y: float) -> float:
    pdf.setFillColor(ink)
    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawString(x, y, text)
    return y - 15


left_y = heading("The question", left_x, left_y)
left_y = paragraph(
    pdf,
    "Can a busy interviewer move from a concise account of my experience to working projects, source code and research evidence without an artificial landing gate or hidden navigation?",
    left_x,
    left_y,
    column_width,
)
left_y -= 9
left_y = heading("What I built", left_x, left_y)
for item in [
    "A static portfolio for applied AI work, research, experience and credentials.",
    "Progressive navigation, filtering and search that leave the core document readable.",
    "A deterministic HTML inventory producing JSON and SVG evidence.",
    "Unit and browser gates for desktop, mobile, reduced motion and downloadable evidence.",
]:
    pdf.setFillColor(accent)
    pdf.circle(left_x + 2, left_y - 3, 1.7, stroke=0, fill=1)
    left_y = paragraph(pdf, item, left_x + 10, left_y, column_width - 10, 8.1, 10.4) - 4
left_y -= 4
left_y = heading("Skills evidenced", left_x, left_y)
paragraph(
    pdf,
    "Semantic HTML; responsive CSS; JavaScript; accessibility; structured metadata; static deployment; browser testing; CI/CD; Docker; reproducible reporting; technical writing.",
    left_x,
    left_y,
    column_width,
)

page = RESULTS["page"]
right_y = heading("Published inventory", right_x, right_y)
metrics = [
    (str(page["sectionCount"]), "semantic sections"),
    (str(page["liveProjectCards"]), "project or demo cards"),
    (str(page["researchCards"]), "research cards"),
    (str(page["githubLinkCount"]), "GitHub links"),
]
box_width = (column_width - 8) / 2
for index, (value, label) in enumerate(metrics):
    x = right_x + (index % 2) * (box_width + 8)
    y = right_y - (index // 2) * 48
    pdf.setFillColor(HexColor("#ffffff"))
    pdf.rect(x, y - 36, box_width, 39, stroke=0, fill=1)
    pdf.setFillColor(accent)
    pdf.setFont("Helvetica-Bold", 15)
    pdf.drawString(x + 8, y - 13, value)
    pdf.setFillColor(muted)
    pdf.setFont("Helvetica", 7.3)
    pdf.drawString(x + 8, y - 27, label)

right_y -= 110
right_y = heading("Integrity checks", right_x, right_y)
for label, passed in [
    ("No duplicate IDs", not RESULTS["integrity"]["duplicateIds"]),
    ("No missing internal targets", not RESULTS["integrity"]["missingInternalTargets"]),
    ("Main landmark and skip link", RESULTS["integrity"]["hasMain"] and RESULTS["integrity"]["hasSkipLink"]),
    ("Canonical and structured metadata", RESULTS["integrity"]["hasCanonical"] and RESULTS["integrity"]["hasStructuredData"]),
]:
    pdf.setFillColor(accent if passed else HexColor("#a63d2f"))
    pdf.setFont("Helvetica-Bold", 8.2)
    pdf.drawString(right_x, right_y, "PASS" if passed else "FAIL")
    pdf.setFillColor(HexColor("#33423a"))
    pdf.setFont("Helvetica", 8.2)
    pdf.drawString(right_x + 34, right_y, label)
    right_y -= 16

right_y -= 7
right_y = heading("Limitations and next steps", right_x, right_y)
paragraph(
    pdf,
    "External demos can move independently. The current single document remains large, even after removing two visitor-blocking intro systems. The next design phase should split long collections into static detail pages and remove unused legacy media. Project-level quantitative claims must be verified in their own repositories.",
    right_x,
    right_y,
    column_width,
)

pdf.setStrokeColor(HexColor("#bdc9c1"))
pdf.line(margin, 52, page_width - margin, 52)
pdf.setFillColor(muted)
pdf.setFont("Helvetica", 7.2)
pdf.drawString(margin, 38, "Source: index.html | Method: scripts/site-model.mjs | Results: reports/results.json")
pdf.drawRightString(page_width - margin, 38, "Structural inventory, not an external-link availability claim")
pdf.save()
print(OUTPUT)
