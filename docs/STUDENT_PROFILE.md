# Student Profile

The student profile is a mandatory form a logged-in user must complete before starting **any** test (including the free demo). It captures the academic, demographic, and contact context that the admin reviewer and the result report need.

---

## For Clients

### Why we collect the profile before the test

Three reasons:

1. **Result personalisation.** Your report needs to know your class/grade and stream context to be useful. A "Class 10" student is in a different decision moment than a "B.Com 1st Year" student, even with the same career profile.

2. **Counsellor context.** When an admin or counsellor reviews your submission, they read the profile alongside the scores. Knowing your city, school/college, and current academic stage helps them frame the feedback you receive.

3. **Follow-up.** If you book a counselling session or request a copy of your report, we need a phone number and school name on file. Asking for them once, at the start, is less disruptive than asking later.

### Fields collected

| Field | Required | Why we ask |
|---|---|---|
| Full Name | (pre-filled) | Already on your account — shown here read-only for confirmation. |
| **Date of Birth** | ✓ | Calibrates your report against age-appropriate career pathways. |
| **Gender** | ✓ | Demographic context only. Choices: Male / Female / Other / Prefer not to say. |
| Phone Number | — | Used for counselling follow-up. Stored as digits only, max 15 characters. |
| **School / College Name** | ✓ | The institution you're currently attending. |
| **Class / Grade** | ✓ | e.g. "Class 10", "Class 12", "B.Com 1st Year". Free-text so it fits any system. |
| Stream | — | Science / Commerce / Arts / Not Applicable / Other. Optional because not every grade has a stream yet. |
| Board / University | — | e.g. CBSE, ICSE, Rajasthan Board, University of Delhi. |
| **City** | ✓ | For local counselling matching and result contextualisation. |
| **State** | ✓ | Dropdown of all 28 Indian states + 8 union territories. |

✓ = required to unlock the assessment. Six fields are required; phone, stream, and board are optional.

### How to complete or update the profile

You can reach the profile form three ways:

1. **First-time interception** — clicking any test CTA on your dashboard before completing the profile redirects you to the form automatically.
2. **Direct edit** — go to **My Profile**, scroll to the **Student Details** section, click **Edit** (or **Complete now** if not yet complete).
3. **Direct URL** — `/profile/student`.

Fill the required fields and click **Save & Continue**. If you were redirected from a test CTA, the system remembers which test you were trying to start and routes you straight there after saving — no need to click again.

You can update the profile any time after it's complete. Changes save immediately and apply to future submissions; reports already submitted with older profile data aren't retroactively updated.

---

## For Developers

### Schema

[backend/models/User.js](../backend/models/User.js) — `studentProfileSchema` and the `STUDENT_PROFILE_REQUIRED_FIELDS` constant.

```js
studentProfile: {
  dateOfBirth:     { type: Date, default: null },
  gender:          { type: String, enum: ["Male", "Female", "Other", "Prefer not to say", ""], default: "" },
  phone:           { type: String, trim: true, default: "" },
  schoolOrCollege: { type: String, trim: true, default: "" },
  classOrGrade:    { type: String, trim: true, default: "" },
  stream:          { type: String, enum: ["Science", "Commerce", "Arts", "Not Applicable", "Other", ""], default: "" },
  board:           { type: String, trim: true, default: "" },
  city:            { type: String, trim: true, default: "" },
  state:           { type: String, trim: true, default: "" },
  isComplete:      { type: Boolean, default: false }
}
```

`isComplete` is **derived state** — never set it manually. The `pre("save")` hook recomputes it on every save by running `computeStudentProfileComplete(this.studentProfile)`. That helper checks the six required fields in `STUDENT_PROFILE_REQUIRED_FIELDS`:

```js
export const STUDENT_PROFILE_REQUIRED_FIELDS = Object.freeze([
  "dateOfBirth",
  "gender",
  "schoolOrCollege",
  "classOrGrade",
  "city",
  "state",
]);
```

This constant is the **single source of truth** for required fields. The model uses it in the pre-save hook; the controller uses it in the re-validation step; the frontend mirrors it locally. If you need to add or remove a required field, change the constant — the rest follows.

### Gate implementation: `selectPackage` returns `PROFILE_INCOMPLETE`

[backend/controllers/userController.js](../backend/controllers/userController.js) — `selectPackage`

```js
// Mandatory student-profile gate. Applies to every package, including
// the free demo — demo users still have to complete the form first.
if (!user.studentProfile?.isComplete) {
  return res.status(400).json({
    success: false,
    error:   "PROFILE_INCOMPLETE",
    message: "Please complete your student profile before starting a test.",
  });
}
```

The gate fires **before** the purchase check, so the demo (which bypasses purchase) still hits it. The error shape is structured (not just `msg`) so the frontend can recognise it and redirect to the form instead of showing a generic error toast.

### `pendingPackageId` handoff

When the Dashboard intercepts a test CTA and routes the user to `/profile/student`, it includes the intended package in `location.state`:

```js
// frontend/src/pages/Dashboard.jsx
navigate("/profile/student", {
  state: {
    returnTo:          "/dashboard",
    pendingPackageId:  "demo-aptitude-50q",
  },
});
```

On form submit, the form ([StudentProfileForm.jsx](../frontend/src/pages/StudentProfileForm.jsx)) checks `pendingPackageId` and, if present, **resumes the original flow**:

```js
if (pendingPackageId) {
  await api.patch("/v1/user/package/select", { packageId: pendingPackageId, resetProgress: false });
  navigate("/pretest", { replace: true });
  return;
}
navigate(returnTo, { replace: true });
```

This means a new user can click "Try Demo Test", complete the profile, and land directly on the pretest screen — one continuous flow instead of two clicks separated by a redirect.

If the post-save `selectPackage` call fails for an unrelated reason (e.g., the package became inactive between clicks), the form falls back to `returnTo` with a notice instead of getting the user stuck.

### Defence-in-depth on the gate

Three layers protect against profile-incomplete test attempts:

1. **Backend `selectPackage`** rejects with `400 PROFILE_INCOMPLETE` if `studentProfile.isComplete === false`.
2. **Frontend Dashboard** checks `stats.student_profile_complete` locally before calling the API — saves a round-trip in the happy path.
3. **Frontend Dashboard catch-block** also handles a `PROFILE_INCOMPLETE` response from the server. This catches the stale-flag case: a user who logged in before the profile feature shipped has a cached "complete" flag in localStorage but the server-side check now applies.

All three layers point to the same destination: `/profile/student?returnTo=...&pendingPackageId=...`.

### Admin payload: `buildAdminStudentProfileSnapshot`

[backend/controllers/adminController.js](../backend/controllers/adminController.js) — `buildAdminStudentProfileSnapshot`

Serialises a `studentProfile` sub-document into the wire shape the admin review UI expects:

```js
const buildAdminStudentProfileSnapshot = (profile) => {
  const plain = profile?.toObject ? profile.toObject() : profile || {};
  // dateOfBirth is normalised to YYYY-MM-DD so the review block can display
  // it without re-parsing.
  return {
    dateOfBirth:     formatDateOnly(plain.dateOfBirth),
    gender:          plain.gender || "",
    phone:           plain.phone || "",
    schoolOrCollege: plain.schoolOrCollege || "",
    classOrGrade:    plain.classOrGrade || "",
    stream:          plain.stream || "",
    board:           plain.board || "",
    city:            plain.city || "",
    state:           plain.state || "",
    isComplete:      Boolean(plain.isComplete),
  };
};
```

The snapshot is attached to the admin review payload at `student.profile` so the frontend's `StudentProfileReviewBlock` component can render it without additional database lookups.

### Frontend touchpoints

| File | Purpose |
|---|---|
| [frontend/src/pages/StudentProfileForm.jsx](../frontend/src/pages/StudentProfileForm.jsx) | The form itself — 3 grouped sections, 36-entry Indian states/UTs select, inline error rendering, `pendingPackageId` handoff |
| [frontend/src/App.jsx](../frontend/src/App.jsx) | Adds `/profile/student` route under `MainLayout`, lazy-loaded, protected |
| [frontend/src/pages/Profile.jsx](../frontend/src/pages/Profile.jsx) | Yellow warning banner when `isComplete: false`; "Student Details" card showing all 9 fields with Edit link |
| [frontend/src/pages/Dashboard.jsx](../frontend/src/pages/Dashboard.jsx) | Intercept handlers for demo + purchased-package CTAs; reads `student_profile_complete` from `/init` |
| [frontend/src/pages/admin/ReviewSubmission.jsx](../frontend/src/pages/admin/ReviewSubmission.jsx) | `StudentProfileReviewBlock` component renders the admin-facing snapshot |

### Backend endpoints

| Method | Path | Handler | Purpose |
|---|---|---|---|
| GET | `/api/v1/user/profile/student` | `getStudentProfile` | Read the user's current studentProfile |
| PUT | `/api/v1/user/profile/student` | `updateStudentProfile` | Save updates; phone digits-only, DOB-not-future validation, gender/stream enum check; returns `errors` map on validation failure |

Plus the existing `GET /api/v1/user/profile` and `/api/v1/user/init` endpoints now include `studentProfile` and `studentProfile.isComplete` so the frontend gets the data it needs without extra calls.

### Verification

[backend/scratch/verifyStudentProfile.mjs](../backend/scratch/verifyStudentProfile.mjs) is a no-database probe that exercises:

- `computeStudentProfileComplete` against 4 fixture cases (empty, partial-missing-city-state, full, invalid-Date)
- The pre-save semantics (assigning `isComplete` to the result of the helper)
- `toAuthJSON` surfaces `isComplete` correctly for both complete and partial profiles
- The `isStudentProfileComplete()` instance method matches the helper
- The gender enum rejects bogus values via `validateSync()`

Run with `node scratch/verifyStudentProfile.mjs` from `backend/`. Expected output ends with `[OK] Student profile completion + hook + auth payload checks pass.`
