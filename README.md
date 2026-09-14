# Pathwise — Career Intelligence Platform

Pathwise is an **AI career decision engine** for students and early-career job seekers. It isn't a job board — it's a system that reads a resume, builds a structured model of the candidate, and continuously answers one question:

> *Given this profile and the current market, which roles and companies should I target right now, which are realistic stretch goals, what's missing, and what should I learn next to open the most doors?*

Every score the app shows is deterministic and explainable — it can always show its work (which skills matched, which are missing, why a company ranks where it does). AI is used only where it genuinely helps — reading an unstructured resume, and answering open-ended questions grounded in the candidate's own computed data — never to invent a number.

---

## What it does

### 1. Resume Intelligence
Upload a PDF, DOCX, or TXT resume. Text is extracted in-browser (PDF.js / mammoth.js), then structured into education, experience, internships, projects, certifications, achievements, domains, and skills — either by an LLM (when available) under a strict "don't invent anything not in the text" instruction, or by a deterministic keyword/section parser as a fallback. Every extracted field is editable afterward.

### 2. Candidate Skill Graph
Skills aren't a flat checklist. Each one carries **proficiency, evidence (which project/role it came from), years of experience, recency, and a confidence score** — derived from how and where it actually appears in the resume, not just whether it's listed.

### 3. Career Fit Engine
A fully deterministic scoring model — skill match, experience match, project match, education match, certification match, market demand, and growth signal, combined with **configurable weights** (tune them yourself in the Profile screen). Every score comes with a plain-language breakdown of strong signals and gaps, and a classification: **Strong Match / Target / Reach / Low Fit** — never presented as a guaranteed outcome.

### 4. Company & Market Intelligence
14 mock companies across SaaS, Fintech, E-commerce, Healthtech, and more, each with hiring trend, open roles, and layoff signals — combined with candidate fit into a single ranked opportunity list, with a "why this opportunity" explanation for every entry. A separate Market Intelligence screen tracks skill demand trends (rising / stable / declining / emerging), role demand, industry health, and geographic demand — filterable by city and industry.

*(This market and company data is simulated for demonstration, clearly labeled in-app, and built behind a swappable provider interface — see [Data & AI features](#data--ai-features) for what it would take to make it live.)*

### 5. Skill Gap & Skill ROI Engine
Skill gaps are prioritized by more than just "how big is the gap" — importance, market demand, and how many target roles a skill unlocks all factor in. The **Skill Opportunity Impact** view is the sharpest differentiator: for every skill you don't have, it simulates acquiring it and reports exactly how many additional roles and companies you'd become competitive for.

### 6. Career What-If Simulator
Pick skills to simulate learning and see projected fit scores for your target roles, side by side with your current scores — always labeled as a projection, never an outcome.

### 7. AI Career Copilot
A chat assistant grounded entirely in the candidate's own computed data (fit scores, gaps, ROI rankings, ranked opportunities) — it answers questions like *"why am I a better fit for backend than ML?"* or *"what happens if I learn AWS?"* using only what's already been calculated, never inventing context.

### 8. Resume Optimization
Pick a target role and get an ATS-style breakdown (skill alignment, project relevance, keyword coverage, structure) plus actionable, grounded suggestions — with a downloadable report.

### 9. Application Tracker
Track applications through Saved → Applied → Assessment → Interview → Offer → Rejected → Withdrawn, with basic conversion analytics.

---

## Screens

| Screen | Purpose |
|---|---|
| **Home** | The decision surface — career readiness score, top role, best opportunities, skills to prioritize, one market alert. |
| **Career** | Full readiness breakdown, best-fit roles chart, target-role picker, skill gaps table, what-if simulator. |
| **Opportunities** | Ranked companies × roles with full score breakdowns and reasoning, plus the application tracker. |
| **Insights** | Market overview, skill trend table, and the skill-ROI table. |
| **Profile** | Resume upload, editable structured profile, skill graph editor, resume optimizer, scoring-weight configuration, data deletion. |

---

## Tech stack

- **Vanilla JavaScript (ES modules)** — no framework, no bundler, no build step
- **Hand-written CSS** — no Tailwind/UI kit. Google Fonts: Instrument Serif (display) + Instrument Sans (body) + IBM Plex Mono (data/tabular numbers)
- **Hand-rolled inline SVG** for every chart (bar charts, radial score gauge) — no charting library
- **[PDF.js](https://mozilla.github.io/pdf.js/)** and **[mammoth.js](https://github.com/mwilliamson/mammoth.js)**, loaded from cdnjs at runtime, for resume text extraction

## Architecture

The **deterministic engine layer** (`js/engine/`) never calls an LLM — every score is reproducible from stored inputs. The **AI layer** (`resumeParser.js`, `copilot.js`) only handles language understanding and explanation, and is always optional: the app runs fully without it, just with a simpler resume parser and no chat assistant.

## Run locally

Any static file server works (this app uses ES module imports, which browsers block under the `file://` protocol, so you can't just double-click `index.html`).

```bash
python -m http.server 8000
# or
npx serve .
