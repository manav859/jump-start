# Manual Review System

## TL;DR

**Manual review catches the few questions where the algorithm genuinely cannot grade an answer — for example, if an answer key were missing or marked ambiguous. With the current question bank (all 160 Section 4 questions have valid answer keys), manual review never triggers. Admins can approve every submission directly. The system is in place for future safety, not for routine use.**

---

## For Admins

### What manual review is

A safety net. When the scoring algorithm runs and finds a Section 4 (Aptitude Battery) question it cannot grade — typically because the answer key field is empty or marked ambiguous — it flags that question for manual review. The student's submission enters the queue with a `Review Required` badge, and the admin sees the flagged question with the student's answer + the missing answer key in the review UI. The admin marks it correct/incorrect, finalises, and only then can approve the report.

### Current state

All 160 Section 4 objective questions in the current question bank have a valid `correctOption`. **Manual review does not trigger in normal operation.** Every submission today produces an empty `manualReviewItems` list and an immediately approvable report. If you're reviewing a current submission and see the "All aptitude questions were graded automatically" green panel, that's the expected state.

### If manual review does trigger in the future

If an answer key gets blanked or a question is intentionally marked ambiguous, here's the step-by-step process:

1. **Find the flagged submission.** In `/admin/testsubmissions`, look for a row with an amber `⚠ Review Required` badge in the Status column. The "Approve & Publish" button is hidden until the review is complete.

2. **Open the submission.** Click "View / Process". The review page opens; scroll to the **Manual Review** section below the score breakdown.

3. **Review each flagged question.** For every flagged item you'll see:
   - The question text
   - The question image (if it has one)
   - The student's answer (highlighted)
   - The algorithm's expected answer (blank or "ambiguous" — that's why it's flagged)
   - Two buttons: **✓ Mark Correct** / **✗ Mark Incorrect**
   - An optional text field for an admin note (e.g., "answer key updated post-print, B is now correct")

4. **Make a decision on each flagged question.** Click ✓ or ✗. Your decision saves immediately to the database — you can leave the page and come back without losing progress. To change your mind, click Undo and re-decide.

5. **Finalise the review.** Once every flagged question has a decision, the **"Finalize Review & Recalculate Scores"** button activates. Clicking it triggers `POST /api/v1/admin/results/:reportId/manual-review/complete`. The system:
   - Recomputes Section 4's subsection scores using your decisions
   - Updates the aptitude bucket the career matcher uses
   - Recomputes the overall score (weighted formula)
   - Re-runs the career matcher with the corrected aptitude profile
   - Sets `manualReviewCompletedAt` to the current timestamp
   - Sets `hasUnreviewedItems` to `false`

6. **Approve as normal.** With `hasUnreviewedItems` now `false`, the standard "Approve & Publish" button is unblocked. Click it. The report transitions to `approved` and the student can view it.

### What "finalize" does and doesn't do

| Recalculated | Untouched |
|---|---|
| Section 4 subsection percentages (verbal, numerical, abstract, spatial, mechanical, clerical) | Sections 1, 2, 3, 5 — they don't depend on the flagged items |
| `aptitudeScores` named bucket (8 keys) | `hollandProfile`, `multipleIntelligences`, `eqProfile` |
| Overall score (weighted formula) | Personality type (depends on personality + EQ, not aptitude) |
| Career recommendations (re-runs `matchCareers`) | Strengths summary (uses signals that don't include the flagged aptitude items) |
| `manualReviewCompletedAt` | The student's raw answers (the report only carries `studentAnswer` on the flagged items) |

### Why approval is blocked until review complete

The whole point of flagging is that the algorithm couldn't grade those questions. If the admin approved the report without making a decision, the affected aptitude subsections would carry incomplete data, the overall score would be calculated from a partial answer set, and the career recommendations would be based on the same partial data. The block forces the admin to provide the missing decisions before any of those numbers are committed to the student's record.

---

## For Developers

### Trigger condition: `isManualReviewRequired(question)`

[backend/utils/scoring/specs/career500qEvaluationSpec.js](../backend/utils/scoring/specs/career500qEvaluationSpec.js)

Returns `true` ONLY when:

1. `correctAnswer` / `correctOption` is `null`, `undefined`, or empty string after trim
2. `correctAnswer` is explicitly flagged ambiguous (case-insensitive match against `"ambiguous"`, `"review"`, or `"?"`)
3. `evaluationType` / `type` is set to a value not in `["objective", "single", "multiple_choice", "likert"]`

Returns `false` in every other case. The presence or absence of an image is **irrelevant** — image rendering is a UI concern, not a grading concern.

```js
export const isManualReviewRequired = (questionSpec) => {
  if (!questionSpec) return false;

  const answer =
    questionSpec.correctAnswer !== undefined
      ? questionSpec.correctAnswer
      : questionSpec.correctOption;

  if (answer === null || answer === undefined || String(answer).trim() === "") {
    return true;
  }
  if (isAmbiguousAnswer(answer)) return true;

  const evalType = String(
    questionSpec.evaluationType || questionSpec.type || ""
  ).trim().toLowerCase();

  if (evalType && !SUPPORTED_EVALUATION_TYPES.has(evalType)) {
    return true;
  }
  return false;
};
```

### Question IDs currently flagged

**0.** Every Section 4 question has a valid answer key. The exact audit:

```
Section 4 answer key audit (full 500Q package):
  Total objective questions:     160
  Has valid answer key:          160
  Missing answer key (-> review): 0
```

Subsection breakdown:

| Subsection | Range | With key | Missing |
|---|---|---:|---:|
| Verbal Reasoning | Q291-Q315 | 25/25 | 0 |
| Numerical Ability | Q316-Q340 | 25/25 | 0 |
| Abstract Reasoning | Q341-Q365 | 25/25 | 0 |
| Spatial Relations | Q366-Q390 | 25/25 | 0 |
| Mechanical Reasoning | Q391-Q410 | 20/20 | 0 |
| Clerical Accuracy | Q411-Q430 | 20/20 | 0 |
| Critical Thinking | Q431-Q440 | 10/10 | 0 |
| Problem Solving | Q441-Q450 | 10/10 | 0 |

If a future question-bank edit blanks a `correctOption`, the audit will pick that up automatically — the smoke test prints the count on every run.

### API routes

All three are admin-only (`protect + adminOnly` middleware):

| Method | Path | Handler | Purpose |
|---|---|---|---|
| GET | `/api/v1/admin/results/:reportId/manual-review` | `getManualReviewItems` | List the report's manualReviewItems + flags |
| PATCH | `/api/v1/admin/results/:reportId/manual-review/:questionId` | `submitManualDecision` | Save admin's decision for one item (`{decision, note?}`) |
| POST | `/api/v1/admin/results/:reportId/manual-review/complete` | `finalizeManualReview` | Run the recompute path; clears `hasUnreviewedItems` |

The PATCH endpoint records the decision but does NOT re-run scoring. Re-scoring is intentionally deferred to the explicit "Finalize" action so the admin can make all decisions first, then trigger a single recompute.

### `recomputeReportWithManualDecisions` — what it changes

The recompute is scoped to Section 4 only. Pseudocode:

```
1. For each manualReviewItem with adminDecision != null:
   - Treat the item as correct if decision === "correct", else incorrect
2. For each aptitude subsection key affected by those items
   (verbal_reasoning, numerical_ability, abstract_reasoning,
    spatial_relations, mechanical_reasoning, clerical_accuracy,
    critical_thinking, problem_solving):
   - Iterate the original section data
   - Replace the algorithm's grading with the admin's decision for flagged items
   - Recompute correctCount / scorableCount
   - Recompute percentage = (correctCount / scorableCount) × 100
   - Replace the subsection's score, percentage, band
3. Recompute Section 4's percentage = mean of subsection percentages
4. Rebuild aptitudeScores named bucket from updated subsection percentages
5. Recompute overallScore via weighted formula (S1×0.20 + S2×0.20 + S3×0.15 + S4×0.30 + S5×0.15)
6. Re-run matchCareers with updated namedProfile (topN=6 for demo, 10 for full)
7. Update report.profile in-place with all recalculated fields
8. Set report.manualReviewCompletedAt = Date.now()
9. Set report.hasUnreviewedItems = false
10. Save user document
```

What it does NOT change:

- Sections 1, 2, 3, 5 — their subsection scores, percentages, and statuses are untouched
- Personality type — derived from Big Five + EQ, neither of which is affected
- Strengths summary — uses signals that don't include the flagged aptitude items
- Holland profile, multiple intelligences, EQ profile — same as above
- `publication.status` — stays `pending_approval`. Admin must separately approve.

### Demo compatibility

The demo wrapper (`scoreCareer500QDemoPackage`) applies its own percentage-based aptitude bands on top of the full scorer's output. After manual-review recompute, those demo bands need to be re-applied so the displayed band labels stay consistent with the demo's smaller question set. The recompute path checks `report.isDemo === true` and re-bands aptitude subsections using `DEMO_APTITUDE_BANDS` from [backend/utils/scoring/configs/career500qDemo.config.js](../backend/utils/scoring/configs/career500qDemo.config.js).

### Approval gate

[backend/controllers/adminController.js](../backend/controllers/adminController.js) — `approveAdminResult`

```js
if (report.hasUnreviewedItems === true) {
  return res.status(400).json({
    success: false,
    error: "MANUAL_REVIEW_PENDING",
    message: "Complete manual review of flagged questions before approving this report."
  });
}
```

This guard fires before the `publication.status` transition. If `hasUnreviewedItems` is `false` (the common case), the gate is a no-op and approval proceeds normally.

### Submissions-list flag

`GET /api/v1/admin/submissions` includes `hasUnreviewedItems: Boolean` on each row. The frontend ([TestSubmissions.jsx](../frontend/src/pages/admin/TestSubmissions.jsx)) renders an amber `⚠ Review Required` chip when the flag is `true`, drawing the admin's attention to submissions that need attention before they can be approved.

### Smoke contract

The three-scenario smoke probe asserts:

- `manualReviewItems.length === <count of Section 4 questions missing an answer key>` (currently 0)
- `hasUnreviewedItems === true` iff there are flagged items
- Every flagged item has `requiresManualReview: true` and a `null`/empty `correctAnswer`
- The audit line is printed: `Section 4 answer key audit: Has valid answer key: 160 / Missing answer key: 0`

If a future edit accidentally blanks a `correctOption`, the smoke will fail loudly with a count mismatch — that's the canary.

### Key files

| File | Purpose |
|---|---|
| [backend/utils/scoring/specs/career500qEvaluationSpec.js](../backend/utils/scoring/specs/career500qEvaluationSpec.js) | `isManualReviewRequired`, `getQuestionMediaUrl`, `getAptitudeSubsectionKeyForQuestionId` |
| [backend/utils/scoring/packageScoring/career500q.js](../backend/utils/scoring/packageScoring/career500q.js) — `buildManualReviewItems` | Emits items only for questions where `isManualReviewRequired` is true |
| [backend/controllers/adminController.js](../backend/controllers/adminController.js) — `getManualReviewItems`, `submitManualDecision`, `finalizeManualReview`, `approveAdminResult` | Manual-review API + approval gate |
| [backend/models/User.js](../backend/models/User.js) — `manualReviewItemSchema` and additions to `assessmentReportSchema` | Persistence schema |
| [frontend/src/pages/admin/ReviewSubmission.jsx](../frontend/src/pages/admin/ReviewSubmission.jsx) — Manual Review section | Item-by-item review UI + Finalize button |
| [frontend/src/pages/admin/TestSubmissions.jsx](../frontend/src/pages/admin/TestSubmissions.jsx) | Amber "Review Required" chip in submissions list |
