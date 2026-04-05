# Result Profiling Algorithm

This document explains how Jumpstart turns submitted assessment answers into:

- section scores
- strengths
- personality type
- career recommendations
- summary data shown on the results pages

The implementation lives in [utils/resultProfiling.js](./utils/resultProfiling.js).

## Entry Point

The backend computes the result profile in:

- `POST /api/v1/user/test-submit`

That route calls:

- `computeResultFromAnswers(answers, sections)`

The returned object is stored on `user.resultProfile` and partially copied into `user.topCareers`.

## Input Shape

The algorithm expects:

- `answers`: an object keyed by `sectionId-questionIndex`
- `sections`: the enabled package sections from the assessment config

Example answer keys:

- `1-0`
- `3-12`
- `5-41`

Likert answers are expected to be numeric values from `1` to `5`.
Single-choice answers are expected to be option letters like `A`, `B`, `C`, etc.

## High-Level Flow

`computeResultFromAnswers()` runs these stages:

1. Score each section individually.
2. Derive grouped signals from Multiple Intelligence, Interest, Aptitude, Personality, and Emotional Intelligence sections.
3. Flatten those signals into one normalized signal map.
4. Build top strengths from the strongest signal combinations.
5. Score each career archetype against the flattened signal map.
6. Build an MBTI-style personality label from personality and EQ signals.
7. Return a result profile used by `/result`, `/careerdetail`, and dashboard summary cards.

## Section Scoring

All section-level scores start with `scoreSection(section, answers)`.

### Single-choice questions

For objective questions:

- `possible += weight`
- if selected option matches `correctOption`, then `earned += weight`

Section score:

- `score = round((earned / possible) * 100)`

### Likert questions

For Likert questions:

- values are normalized from `1..5`
- reverse-scored items use `6 - value`

Weighted total:

- `earned += normalizedLikert * weight`
- `possible += 5 * weight`

Section score:

- `score = round((earned / possible) * 100)`
- `avgOutOf5 = ((earned / possible) * 5).toFixed(2)`

### Result

Each section produces a `testResults` item with:

- `sectionId`
- `sectionName`
- `score`
- `avgOutOf5`
- `interpretation`
- `completedAt`

## Grouped Subscales

### 1. Multiple Intelligence

Source section:

- `Multiple Intelligence Assessment`

This section is divided into 8 fixed 10-question blocks by question index:

- `0-9`: `logicalMathematical`
- `10-19`: `linguistic`
- `20-29`: `visualSpatial`
- `30-39`: `musical`
- `40-49`: `bodilyKinesthetic`
- `50-59`: `interpersonal`
- `60-69`: `intrapersonal`
- `70-79`: `naturalistic`

Each group score is:

- average normalized Likert response
- converted to a percentage using `((avg - 1) / 4) * 100`

### 2. Emotional Intelligence

Source section:

- `Emotional Intelligence Assessment`

This section is divided into 5 fixed 10-question blocks:

- `0-9`: `selfAwareness`
- `10-19`: `selfRegulation`
- `20-29`: `motivation`
- `30-39`: `empathy`
- `40-49`: `socialSkills`

Scoring uses the same grouped Likert average approach as Multiple Intelligence.

### 3. Aptitude Battery

Source section:

- `Aptitude Battery`

This section is split by question id ranges:

- `291-299`: `logicalReasoning`
- `300-308`: `verbalReasoning`
- `309-317`: `quantitativeReasoning`

Each subgroup score is:

- `round(correct / total * 100)`

### 4. Interest Assessment

Source section:

- `Interest Assessment`

This section mixes:

- single-choice preference questions
- a few Likert work-preference questions

The algorithm maps answer text into Holland-style interest themes:

- `realistic`
- `investigative`
- `artistic`
- `social`
- `enterprising`
- `conventional`

It does this with text classification rules in `INTEREST_THEME_RULES`.

#### Single-choice items

For a selected option:

- get the option text from the chosen letter
- match that text against regex theme rules
- add theme counts directly

#### Likert work-preference items

For question text:

- classify the question text into one or more themes
- multiply theme weight by `likertValue / 5`

#### Normalization

After all interest items are processed:

- the highest theme becomes `100`
- all other themes are scaled relative to that highest theme

The top 3 themes also create an interest code, for example:

- `ISA`
- `SEC`

This is inspired by RIASEC-style interest grouping, but implemented as a heuristic text-matching layer over the repo's own question wording.

## Personality Type

Source sections:

- `Personality Assessment`
- `Emotional Intelligence Assessment`

The algorithm does not use a formal MBTI questionnaire. Instead, it estimates an MBTI-style label from:

- Big Five-like personality statements in section 1
- emotional intelligence traits in section 5

### Base personality axes from section 1

The algorithm now prefers explicit `subscale` metadata on section 1 questions.

That metadata can come from:

- the `subscale` column in [section-1-personality.csv](./reference/section-1-personality.csv)
- the same field persisted into assessment config questions
- a backend fallback inference layer for older questions that still have blank metadata

The supported personality axis keys are:

- `extraversion`
- `openness`
- `agreeableness`
- `conscientiousness`
- `emotionalStability`

For each axis score:

- matching section 1 responses are collected by `subscale`
- reverse-scored items use the question's `reverseScored` flag
- the average is converted to a percentage

If a question does not yet have usable metadata, the older regex-based fallback is still used so legacy configs continue to score.

### Derived axes

The final displayed MBTI-style poles are derived as follows:

- `E/I` from `extraversion`
- `N/S` from `openness`
- `F/T` from a weighted blend of `agreeableness + empathy + socialSkills`
- `J/P` from a weighted blend of `conscientiousness + selfRegulation`
- `A/T` from a weighted blend of `emotionalStability + selfRegulation + motivation`

### Final label

The code is built as:

- `baseCode = [E/I][N/S][F/T][J/P]`
- final display code = `baseCode-[A/T]`

Examples:

- `ENFJ-A`
- `INTJ-T`

The title and description come from the internal `PERSONALITY_ARCHETYPES` map.

Important:

- this is an inferred personality style label
- it is not a clinical diagnosis
- it is not a certified MBTI assessment

## Flattened Signal Map

Before building strengths and careers, the algorithm merges all section outputs into one normalized signal object.

Examples:

- interests: `investigative`, `social`, `conventional`
- intelligences: `logicalMathematical`, `linguistic`, `visualSpatial`
- EQ: `selfRegulation`, `empathy`, `socialSkills`
- aptitude: `logicalReasoning`, `verbalReasoning`, `quantitativeReasoning`
- personality: `extraversion`, `introversion`, `intuition`, `sensing`, `feeling`, `thinking`, `judging`, `perceiving`, `assertive`, `turbulent`

Most values are percentages from `0..100`.

## Strength Scoring

Strengths are not read from one section directly. They are composites built from multiple signals.

Examples:

- `Analytical Thinking`
  - logicalMathematical
  - logicalReasoning
  - quantitativeReasoning
  - investigative

- `Creative Problem Solving`
  - artistic
  - visualSpatial
  - intuition
  - openness

- `Empathy & Collaboration`
  - interpersonal
  - empathy
  - feeling
  - social

Each strength is:

- the average of its contributing signals
- rounded to a percentage

The top 5 strengths are returned.

## Career Recommendation Scoring

Career matching is handled by `CAREER_ARCHETYPES`.

Each career has:

- `title`
- `summary`
- `salaryRange`
- `skills`
- `weights`

### Weight model

Each career archetype defines how important each signal is.

Example career signals:

- `Data Scientist`
  - investigative
  - logicalMathematical
  - logicalReasoning
  - quantitativeReasoning
  - intuition

- `Psychologist / Counsellor`
  - social
  - interpersonal
  - intrapersonal
  - empathy
  - socialSkills

- `UX Designer`
  - artistic
  - visualSpatial
  - social
  - empathy
  - intuition

### Raw match

For each career:

- `weightedScore += signalValue * weight`
- `totalWeight += weight`
- `rawMatch = weightedScore / totalWeight`

### Displayed match %

The raw match is converted to a user-facing percentage:

- `matchPercent = clamp(round(52 + rawMatch * 0.43), 58, 96)`

This keeps results in a realistic recommendation range instead of showing extremely low values for top-ranked matches.

### Recommendation description

The algorithm also extracts the top contributing signals for each career and uses them to generate the explanatory sentence shown in the UI.

Example:

- "Strong alignment with your empathy, collaboration skill, and self-awareness."

The top 6 careers are returned.

## Overall Score

The current overall score is:

- the average of all scored section scores

Formula:

- `overallScore = round(avg(testResults.score))`

The percentile string is currently a presentation heuristic:

- `Top ${max(8, 100 - overallScore)}% profile strength`

## Output Shape

`computeResultFromAnswers()` returns:

- `overallScore`
- `overallPercentile`
- `completedTestsCount`
- `totalTestsCount`
- `careerPathwaysCount`
- `testResults`
- `strengths`
- `careerRecommendations`
- `personalityType`

This is stored on `user.resultProfile`.

## Current Limitations

This version is intentionally heuristic and product-friendly rather than psychometrically validated.

Known limitations:

- interest classification relies on regex matching against current question wording
- grouped subscales depend on fixed question ordering in the seed config
- MBTI-style labels are inferred from Big Five-like signals and EQ, not measured directly
- section 1 personality metadata is only partially backfilled for non-core work-style/leadership items, so some legacy questions still rely on fallback inference
- salary ranges are static product content, not market-live data
- recommendation weights are hand-tuned and should be recalibrated using real user outcomes

## How To Tune It

If results feel off, start here:

1. Update `INTEREST_THEME_RULES` when section 3 wording changes.
2. Rebalance `CAREER_ARCHETYPES[*].weights` to improve career ranking.
3. Adjust derived personality formulas for `feeling`, `judging`, and `assertive`.
4. Revisit grouped ranges if question ordering in the seed changes.
5. Add telemetry or counselor review data to validate recommendation quality.

## Suggested Future Improvements

- move archetypes, salary ranges, and weights into a config file or admin-managed collection
- persist intermediate subscale outputs for explainability and analytics
- add per-career "why this matched" cards with exact contributing scores
- support package-specific scoring maps instead of relying on fixed section names
- validate the mapping with counselor feedback and anonymized outcome data

## Reference Inspiration

These ideas informed the current approach:

- Holland / RIASEC-style interest grouping for career interests
- Big Five-style trait extraction from personality statements
- EQ competency grouping for self-awareness, regulation, empathy, and social skills

This implementation is still a custom Jumpstart recommendation layer built on top of the repo's own questions and scoring rules.
