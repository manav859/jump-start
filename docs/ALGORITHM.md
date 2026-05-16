# How Jumpstart Scores Your Assessment

This document explains how the test you take becomes a career profile — first in plain English (for students, parents, counsellors, and anyone evaluating the platform), then in technical detail (for developers maintaining the system).

---

## For Clients: How Your Score Is Calculated

### The 5 Sections — what each one measures

Every Jumpstart assessment is built from five distinct sections. Each one measures something different about you, and each one tells the career algorithm something different about which paths suit you.

| # | Section | What it measures | Why it matters for career guidance |
|---|---|---|---|
| 1 | **Personality Assessment** | How you think, behave, and prefer to work — based on the Big Five (OCEAN), HSPQ, work-style, and leadership traits | A surgeon and a graphic designer can both be brilliant, but they need different temperaments. Personality predicts day-to-day fit. |
| 2 | **Multiple Intelligence** | Eight types of intelligence — logical-mathematical, linguistic, spatial, musical, bodily-kinesthetic, interpersonal, intrapersonal, naturalistic | A natural strength in one type points to fields that lean on that strength every day. |
| 3 | **Interest Assessment** | Your Holland Code (Realistic, Investigative, Artistic, Social, Enterprising, Conventional) plus subject and activity preferences | Interest predicts what you'll stay engaged with over a 30-year career, not just what you're good at today. |
| 4 | **Aptitude Battery** | Verbal, numerical, abstract, spatial, mechanical, and clerical reasoning — measured objectively, not self-reported | These are the closest thing to a "skill ceiling" we can measure on paper. A lawyer needs strong verbal aptitude; an engineer needs strong spatial and numerical. |
| 5 | **Emotional Intelligence** | Self-awareness, self-regulation, motivation, empathy, social skills | EQ is the single biggest predictor of long-term career success across most fields. |

### How scores come together

The process happens in three stages:

1. **Each question is graded.** Likert questions (the "Strongly agree → Strongly disagree" ones) are scored on a 1-5 scale and averaged. Objective questions (multiple-choice with one right answer) are graded as correct or incorrect against an answer key. Questions you didn't answer are skipped — they don't count for or against you.

2. **Each subsection produces a score.** Big Five OCEAN, Holland Codes, and so on each get their own 0-100 score. If you only answered some of a subsection, the score reflects only what you actually answered — not a penalty for the rest.

3. **Each section produces a 0-100 score.** The subsection scores are averaged within each section.

4. **Your overall score is a weighted average** of the five section scores:

   | Section | Weight |
   |---|---:|
   | Personality | 20% |
   | Multiple Intelligence | 20% |
   | Interest | 15% |
   | **Aptitude Battery** | **30%** |
   | Emotional Intelligence | 15% |

### Why aptitude carries the most weight

Sections 1, 2, 3, and 5 ask you to **describe yourself** ("I enjoy taking initiative when working with others — Strongly Agree / Disagree"). You might be a little too generous, or a little too modest, or simply not see yourself clearly yet. That's normal — self-perception is a real signal, but it can drift.

Section 4 — the **Aptitude Battery** — is the only section where you can't talk yourself up or down. Either you can solve the verbal reasoning question or you can't. Either the gear rotates clockwise or it doesn't. That makes Aptitude the most reliable signal in the test, which is why it carries the heaviest weight (30%) in the overall score.

### How career matching works

After your scores are computed, the algorithm compares your profile against a database of **125 careers**. Each career has a "fingerprint" — primary and secondary Holland codes, the intelligences it draws on most, the aptitudes it depends on, and the EQ competencies it rewards.

The match score for each career is calculated across four dimensions:

| Dimension | Weight | What it asks |
|---|---:|---|
| **Holland Codes** (Realistic / Investigative / Artistic / Social / Enterprising / Conventional) | 35% | Does this career sit in interest areas you scored high on? |
| **Multiple Intelligences** (Logical-Math, Linguistic, Spatial, Musical, Bodily-Kinesthetic, Interpersonal, Intrapersonal, Naturalistic) | 25% | Does this career lean on intelligences you're strong in? |
| **Aptitudes** (Verbal, Numerical, Abstract, Spatial Relations, Mechanical, Clerical, Critical Thinking, Problem Solving) | 25% | Does the career need aptitudes where you scored well? |
| **EQ Competencies** (Empathy, Motivation, Self-Regulation, Social Skills, Self-Awareness) | 15% | Does the career reward the EQ areas where you're strongest? |

For Holland codes, the **primary** code in a career's fingerprint counts at full weight; **secondary** codes count at 60% weight. That's because a career like "Architect" is principally Artistic (A) but also draws on Investigative (I) and Realistic (R) — the secondary codes shape it but don't define it.

### What a match percentage means

When a career card says "87% match", it means:

> Your profile aligns strongly with this career across all four dimensions — your dominant interests, intelligences, aptitudes, and EQ traits all point in this direction.

A match in the **80-100%** range is a strong fit — worth exploring seriously. **60-79%** is a solid alignment worth considering. **Below 60%** suggests a career where you'd have to work against your natural grain on at least one dimension.

The "Why this matched you" section under each career card lists the specific signals that lifted it to the top — so you can see exactly which of your strengths the algorithm latched onto.

### How the demo differs from the full test

| | Demo Test | Full 500Q Test |
|---|---|---|
| Questions | 50 | 500 |
| Sections | 5 (curated subset) | 5 (full bank) |
| Algorithm | **Identical** | Identical |
| Career database | Same 125 | Same 125 |
| Match weights | Same | Same |
| Section weights | Same (20/20/15/30/15) | Same |

The demo is **not** a different algorithm — it's the same scoring engine running on a smaller question set. With fewer questions per subsection (1-3 instead of 10-30), individual subsections give a **directional** rather than **precise** read on you. The overall score and career recommendations are valid, but a full 500Q result gives a noticeably more nuanced picture.

### Manual review

For a small number of questions where the algorithm can't make a confident call — for example, if an answer key were missing or marked ambiguous — the system flags those for **manual admin review** before the result is published. Currently every Section 4 question has a definitive answer key, so manual review doesn't trigger in normal operation. If it ever does, the admin reviews each flagged question, makes a decision, and only then is the result released to the student.

---

## For Developers: Scoring Architecture

### Scoring dispatch flow

Every assessment submission flows through one entry point:

```
POST /api/v1/user/test-submit                       (userController.js)
  └─→ computeAssessmentResult({ answers, sections, packageId })
        ↓
        backend/utils/scoring/index.js dispatches by packageId:
          ├─ "demo-aptitude-50q"      → scoreCareer500QDemoPackage(answers, sections)
          ├─ "complete-aptitude-500q" → scoreCareer500QPackage(answers, sections)
          └─ else                     → computeGenericResultFromAnswers (heuristic fallback)
```

The demo wrapper internally delegates to `scoreCareer500QPackage` and then post-processes the result (re-bands aptitude, recomputes overall, re-runs the career matcher with `topN=6`, stamps demo-specific metadata).

### Section weights — rationale

| sectionId | Section | Weight | Why this weight |
|---:|---|---:|---|
| 1 | Personality Assessment | 0.20 | Self-reported; describes day-to-day fit. Important but susceptible to bias. |
| 2 | Multiple Intelligence | 0.20 | Self-reported; broad strengths signal. |
| 3 | Interest Assessment | 0.15 | Self-reported; interests are mutable over time. Lower weight than personality. |
| 4 | **Aptitude Battery** | **0.30** | Objective. Hardest to manipulate. Strongest predictor of skill ceiling. |
| 5 | Emotional Intelligence | 0.15 | Self-reported and partially developmental. Lower weight to avoid double-counting with personality. |

Weights live in `SECTION_WEIGHTS` in [career500q.js](../backend/utils/scoring/packageScoring/career500q.js) and mirrored in [career500qDemo.js](../backend/utils/scoring/packageScoring/career500qDemo.js). Sections with null percentages are dropped from the weighted average and the remaining weights are renormalised — partial completions don't get penalised.

### Likert scoring

- Scale: 1 (strongly disagree) to 5 (strongly agree)
- Reverse-scored items use `invertedValue = 6 - rawValue` before averaging (e.g., a "1" on a reverse item is treated as a "5")
- Subsection average: `sum(answered values) / answeredCount` — unanswered items skipped from both numerator and denominator
- Percentage normalisation: `((average - 1) / 4) * 100` → maps 1-5 to 0-100
- Band thresholds (applied to the 1-5 average, which is mathematically equivalent to applying to the 0-100 percentage):

  | Band | Average | Percentage equivalent |
  |---|---|---|
  | High | 4.0-5.0 | 75-100% |
  | Moderate | 3.0-3.99 | 50-74% |
  | Low | 1.0-2.99 | 0-49% |

Reverse-question IDs are defined per factor in [career500q.config.js](../backend/utils/scoring/configs/career500q.config.js). Verified against the source PDF answer key.

### Objective scoring

- Both student answer and answer key are trimmed and upper-cased before comparison (`normalizeAnswerLetter`)
- Unanswered questions are skipped from the correct count — they neither help nor hurt
- Questions without an answer key (`!correctOption` OR `isManualReviewRequired(question) === true`) are excluded from BOTH the numerator AND the scorable denominator — they flow into `manualReviewItems` instead
- Percentage: `(correctCount / scorableCount) * 100`
- Band thresholds (percentage-based, applied uniformly to demo and full):

  | Band | Percentage |
  |---|---|
  | Excellent | 80-100% |
  | Good | 60-79% |
  | Average | 40-59% |
  | Developing | 0-39% |

Per-subsection interpretation strings ("Excellent verbal reasoning. Law, journalism, literature.") are pulled from the config bands by label and overlaid on the percentage-derived band.

### Career matching formula

Implemented in [careerMatcher.js](../backend/utils/scoring/careerMatcher.js). One function: `matchCareers(profile, topN = 10)`.

**Input profile shape** (any missing field defaults to neutral score 50):

```js
{
  hollandProfile:        { R, I, A, S, E, C },              // 0-100 each
  multipleIntelligences: { "Logical-Math", "Linguistic", ... }, // 8 keys, 0-100 each
  aptitudeScores:        { "Verbal", "Numerical", ... },         // 8 keys, 0-100 each
  eqProfile:             { "Empathy", "Motivation", ... }        // 5 keys, 0-100 each
}
```

**Per-career score:**

```
careerScore =   hollandMatch       × 0.35
              + intelligenceMatch  × 0.25
              + aptitudeMatch      × 0.25
              + eqMatch            × 0.15
```

**Holland match** — primary code at 1.0× weight, secondary codes at 0.6× weight, averaged across the matched values:

```js
const SECONDARY_HOLLAND_WEIGHT = 0.6;
const weighted = career.hollandCodes.map((code, idx) => {
  const raw = profile.hollandProfile[code] ?? 50;
  return idx === 0 ? raw : raw * SECONDARY_HOLLAND_WEIGHT;
});
return clamp(average(weighted));
```

**Intelligence/Aptitude/EQ match** — straight average over the names the career references:

```js
const values = career.intelligenceTypes.map(
  (name) => profile.multipleIntelligences[name] ?? 50
);
return clamp(average(values));
```

**Output per career:**

```js
{
  title:        "Astronomer",
  category:     "Science & Research",
  score:        91.2,                    // 0-100, one decimal
  matchPercent: 91,                      // legacy field, equals Math.round(score)
  hollandCodes:        ["I"],
  intelligenceTypes:   ["Logical-Math", "Spatial"],
  aptitudeStrengths:   ["Numerical", "Abstract", "Spatial Relations"],
  eqCompetencies:      ["Motivation"],
  breakdown: {
    hollandMatch:       88,
    intelligenceMatch:  88,
    aptitudeMatch:     100,
    eqMatch:            88
  },
  matchReasons: {
    holland:      "Your dominant interest code I (Investigative) aligns with this path.",
    intelligence: "Strong intelligence signals in Logical-Math and Spatial.",
    aptitude:     "Strong aptitude scores in Numerical, Abstract, and Spatial Relations.",
    eq:           "High EQ in Motivation."
  }
}
```

**matchReasons generation** — for each dimension, the matcher checks which of the career's required signals scored ≥ 60% on the student's profile. If at least one signal cleared the bar, the reason reads as "Strong/High … in X and Y". Otherwise it reads as "this career leans on X, Y — partial match on your current profile."

### Manual review trigger

Implemented as `isManualReviewRequired(question)` in [career500qEvaluationSpec.js](../backend/utils/scoring/specs/career500qEvaluationSpec.js). Returns true ONLY when:

1. `correctAnswer` / `correctOption` is `null`, `undefined`, or empty string
2. `correctAnswer` is explicitly flagged ambiguous (string equals "ambiguous", "review", or "?")
3. `evaluationType` / `type` is set to a value not in `["objective", "single", "multiple_choice", "likert"]`

The presence or absence of an image is **irrelevant** — image rendering is a UI concern, not a grading concern.

Currently every one of the 160 Section-4 questions has a valid `correctOption`, so `manualReviewItems` is empty for every submission and `hasUnreviewedItems` is `false`. Approval is never blocked unless a future edit blanks an answer key.

### Demo scorer — 5-step recompute order

[career500qDemo.js](../backend/utils/scoring/packageScoring/career500qDemo.js) runs the full scorer then post-processes:

```
1. Re-band aptitude subsection scores using demo percentage bands
   (DEMO_APTITUDE_BANDS from career500qDemo.config.js)
2. Recompute Section 4 percentage from re-banded subsections
3. Recompute overallScore using the weighted formula
4. Recompute completedSections + completionStatus
5. Re-run matchCareers with topN = 6
6. Stamp metadata LAST:
   - algorithmKey:    "career-500q-demo-v1"
   - packageId:       "demo-aptitude-50q"
   - overallMaxScore: 100
```

Stamping last ensures nothing downstream can clobber the demo identity.

### Algorithm versioning

Every result records its algorithm version in `metadata.algorithmKey`:

| Key | Source |
|---|---|
| `career-500q-v1` | Full 500-question scorer |
| `career-500q-demo-v1` | Demo wrapper (50-question curated subset) |
| `generic-profile` | Heuristic fallback for non-500Q packages |

If the scoring logic changes in a way that affects stored results, increment the version (`-v2`) so old reports remain identifiable for migration/comparison.

### Key files

| File | Purpose |
|---|---|
| [utils/scoring/index.js](../backend/utils/scoring/index.js) | Dispatch by packageId |
| [utils/scoring/packageScoring/career500q.js](../backend/utils/scoring/packageScoring/career500q.js) | Full 500Q scorer (1500+ lines — Likert + objective + categorical paths, weighted overall, manualReviewItems builder) |
| [utils/scoring/packageScoring/career500qDemo.js](../backend/utils/scoring/packageScoring/career500qDemo.js) | Demo wrapper (5-step recompute) |
| [utils/scoring/configs/career500q.config.js](../backend/utils/scoring/configs/career500q.config.js) | Factor definitions, reverse-question ids, per-subsection band copy |
| [utils/scoring/configs/career500qDemo.config.js](../backend/utils/scoring/configs/career500qDemo.config.js) | Demo question curation (50 ids) + demo aptitude bands |
| [utils/scoring/specs/career500qEvaluationSpec.js](../backend/utils/scoring/specs/career500qEvaluationSpec.js) | `isManualReviewRequired`, media-URL parity helper, subsection-key-by-id |
| [utils/scoring/interpreters/bandInterpreter.js](../backend/utils/scoring/interpreters/bandInterpreter.js) | Numeric-to-band resolution |
| [utils/scoring/interpreters/subsectionInterpretationRegistry.js](../backend/utils/scoring/interpreters/subsectionInterpretationRegistry.js) | Per-subsection narrative templates |
| [utils/scoring/careerMatcher.js](../backend/utils/scoring/careerMatcher.js) | 125-career weighted matcher |
| [data/careerMappingData.js](../backend/data/careerMappingData.js) | 125-career source-of-truth (title, category, holland, intelligences, aptitudes, EQ) |
| [scripts/smokeCareer500qScoring.mjs](../backend/scripts/smokeCareer500qScoring.mjs) | Three-scenario contract probe; run before any scoring change |

### Smoke test

Run before shipping any scoring change:

```bash
cd backend
npm run smoke:career-500q
```

The smoke runs six scenarios (full+demo × all-correct/all-wrong/mixed) and asserts: completion is `Complete` and `5/5`, all-correct overall > 70, all-wrong overall < 40, all-correct vs all-wrong spread ≥ 30 points, `manualReviewItems.length` equals the count of Section-4 questions missing an answer key (0 currently), `hasUnreviewedItems` matches whether items exist, top recommendations are distinct. Output ends with `[OK] All scoring contracts pass.`
