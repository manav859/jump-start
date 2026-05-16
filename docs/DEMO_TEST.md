# Client Demo Test (50 Questions)

## Purpose

The Demo Test is a 50-question version of the full 500-question Career Aptitude Test. It exists for three audiences:

- **Prospective clients** who want a hands-on preview before committing to the full assessment
- **Internal sales and demos** — a fully functional end-to-end walkthrough in under 25 minutes
- **Algorithm verification** — running the exact same scoring engine on a smaller question set to confirm the pipeline is working

The demo runs the **same scoring engine** as the full test. It does not use a simplified or "lite" algorithm. The difference is question coverage, not algorithm depth.

---

## How to take the Demo Test

1. **Sign up** at `/signup` (or log in to an existing account)
2. **Complete the student profile** if you haven't already — the test won't start without it. The form collects date of birth, gender, school/college, class/grade, city, and state at minimum.
3. From your **Dashboard**, click the gold "**Try Demo Test (50 Questions)**" card at the top.
4. The system creates a new test session and routes you through the pretest instructions to the live test.
5. **Answer all 50 questions across 5 sections.** Auto-save fires every few seconds so you can pause and resume.
6. **Submit** when the final section completes. The result is created with `status: pending_approval`.
7. The result enters the admin queue — an admin can see it at `/admin/testsubmissions` with a "Demo" chip next to the test name.
8. After **admin approval**, the report appears in the student's results hub at `/result`. Open it to see the full breakdown with a small "Demo result — based on 50 questions" banner at the top.

---

## Question distribution

The 50 questions are a **curated subset** of the canonical 500-question bank — not random, not synthesized. Each ID is a real question with a real answer key, hand-picked to give the scoring engine enough signal to produce a meaningful profile across all five sections.

| # | Section | Demo Q | Full Q | What it covers |
|---:|---|---:|---:|---|
| 1 | Personality Assessment | 10 | 120 | 3 OCEAN (Extraversion, Openness, Conscientiousness) + 3 HSPQ (Warmth, Reasoning, Dominance) + 2 Work Style + 2 Leadership |
| 2 | Multiple Intelligence & EQ | 10 | 80 (+50 EQ) | 1 question per intelligence (8) + 2 EQ seeds (Self-Awareness, Empathy) |
| 3 | Interest Assessment | 9 | 90 | RIASEC: 2 Realistic + 1 Investigative + 2 Artistic + 1 Social + 2 Enterprising + 1 Conventional |
| 4 | Aptitude Battery | 14 | 160 | 3 Verbal + 3 Numerical + 2 Abstract + 2 Spatial + 2 Mechanical + 2 Clerical |
| 5 | Personality & Values | 7 | (drawn from EQ) | EQ across Self-Awareness (extra), Self-Regulation, Motivation, Empathy (extra), Social Skills |
| | **Total** | **50** | **500** | |

The exact question IDs live in [backend/utils/scoring/configs/career500qDemo.config.js](../backend/utils/scoring/configs/career500qDemo.config.js) — `DEMO_SECTION_BLUEPRINT`.

---

## How demo scoring works

Every answered question flows into the **same scoring engine** that the full test uses. The only differences:

1. The demo wrapper ([career500qDemo.js](../backend/utils/scoring/packageScoring/career500qDemo.js)) re-bands aptitude subsection scores using percentage-based thresholds (Excellent ≥ 80%, Good ≥ 60%, Average ≥ 40%, Developing < 40%) so a 2/2 demo result reads as "Excellent" rather than getting pinned to "Developing" by the full-test 23/25 raw-count thresholds.
2. The career matcher is called with `topN = 6` instead of `topN = 10`.
3. The result's `metadata.algorithmKey` is stamped `"career-500q-demo-v1"` and `metadata.packageId` is `"demo-aptitude-50q"`.
4. The report sub-document carries `isDemo: true`, which drives the demo-specific UI badges.

Everything else — section weights, weighted overall formula, career matching weights, reverse scoring, band copy — is identical to the full test.

---

## How to interpret demo results vs full

| | Demo | Full |
|---|---|---|
| Overall score | Valid 0-100, same weighted formula | Valid 0-100, same weighted formula |
| Section scores | Valid, but produced from 7-14 questions per section | Produced from 50-160 questions per section |
| Subsection scores | **Directional** — 1-3 questions per subsection means a single answer flips an entire signal | **Precise** — 5-30 questions per subsection means individual answers don't dominate |
| Personality type (e.g., ENFJ-A) | Computed but lower-confidence | Computed with more evidence |
| Career recommendations | Top 6, valid but less differentiated | Top 10, more nuanced ordering |
| Strengths / observations | Generated from the same signals | Generated from the same signals |

The right way to read a demo result is **as a starting point**: it shows whether the platform recognises you as more analytical or more social, more verbal or more spatial, more interest-driven or more aptitude-driven. It does **not** give you the same fidelity as the full test on individual subsection patterns.

---

## What the admin sees

When an admin opens the submissions list (`/admin/testsubmissions`), a demo submission is visually distinct:

- A small amber **"Demo"** chip appears next to the test type
- The standard completion chip ("Complete" or "Incomplete") and section count ("5/5 Sections") render the same way

When the admin opens a demo submission for review (`/admin/testsubmissions/:reportId`), they see:

- An amber banner at the top: **"Demo Test — 50 questions. Scores are proportional to the assigned question set, not the full 500-question bank."**
- The Overall Score card reads `{score} / 100 (Demo)` instead of `{score} / 100`
- Every other section (section breakdown, manual review, student profile, career recommendations) renders the same as a full-test report

The admin review flow is identical to the full-test flow — same Approve button, same manual-review gate, same career card layout. The difference is purely contextual: the banner reminds the admin that scores reflect the demo's smaller question set.

---

## How to identify demo reports in the database

| Where | What |
|---|---|
| `user.assessmentReports[].isDemo` | `true` for every demo submission |
| `user.assessmentReports[].packageId` | `"demo-aptitude-50q"` |
| `user.assessmentReports[].profile.metadata.algorithmKey` | `"career-500q-demo-v1"` |
| `user.assessmentReports[].profile.metadata.packageId` | `"demo-aptitude-50q"` |

Any one of those four fields is sufficient to identify a demo report. The frontend reads `report.isDemo`; backend admin queries use `assessmentReports.packageId` for filtering.

---

## Limitations to communicate to clients

These are the honest truths about what the demo can and can't tell you. Be upfront about them with prospective clients.

1. **Individual subsection scores are directional, not precise.** With 1-3 questions per subsection, one accidental misread on a verbal reasoning question can swing your Verbal score from "Excellent" to "Average". This is unavoidable with fewer questions; the full 500-question test eliminates it by asking many more questions per construct.

2. **Career recommendations are valid but less differentiated.** The matcher still scores all 125 careers against your profile, but with fewer subsection data points your top 6 may include some "tied" careers that the full test would have separated.

3. **The demo is not a substitute for the full assessment for actual career guidance.** It's a preview. Anyone making a real decision about academic stream selection, career planning, or counselling outcomes should take the full 500-question version — that's what the algorithm is designed for.

4. **Section 4 aptitude scoring is intentionally lenient.** The demo uses percentage-based bands (any 80% correct = Excellent) rather than the full test's raw-count bands (23/25 = Excellent). This is mathematically correct for a 2-question demo subsection — you can't ask someone to answer 23 of 2 questions — but it does mean an "Excellent" demo aptitude reading is easier to achieve than an "Excellent" full-test reading.

5. **Some subsections aren't probed at all.** The full test has a "Subject Preferences" subsection in Section 3 and "Critical Thinking" / "Problem Solving" subsections in Section 4. The demo skips these to stay at 50 questions. Their absence doesn't break scoring — those subsections are recorded as "not applicable" — but it does mean the demo can't comment on, e.g., a strong preference for STEM subjects.

---

## Pricing context

The demo is **free** for any logged-in user. No purchase record is required. The full 500-question test is priced at ₹2,499 (configurable). The selectPackage gate enforces this distinction: the demo bypasses the purchase check, the full test does not.

---

## Key files

| File | Purpose |
|---|---|
| [backend/utils/scoring/configs/career500qDemo.config.js](../backend/utils/scoring/configs/career500qDemo.config.js) | The 50 curated question IDs + demo aptitude band thresholds |
| [backend/utils/scoring/packageScoring/career500qDemo.js](../backend/utils/scoring/packageScoring/career500qDemo.js) | Demo wrapper around the full scorer |
| [backend/scripts/seedDemoPackage.mjs](../backend/scripts/seedDemoPackage.mjs) | Idempotent seed script — adds the demo package to AssessmentConfig |
| [frontend/src/pages/Dashboard.jsx](../frontend/src/pages/Dashboard.jsx) | Gold "Try Demo Test" CTA card + click handler |
| [frontend/src/pages/admin/ReviewSubmission.jsx](../frontend/src/pages/admin/ReviewSubmission.jsx) | Amber demo banner + demo summary card annotation |
| [frontend/src/pages/admin/TestSubmissions.jsx](../frontend/src/pages/admin/TestSubmissions.jsx) | "Demo" chip in submissions list |
| [frontend/src/pages/StudentReport.jsx](../frontend/src/pages/StudentReport.jsx) | "Demo result" banner on published report |
