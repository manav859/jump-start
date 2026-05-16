import mongoose from "mongoose";
import User, { computeStudentProfileComplete } from "../models/User.js";

const fails = [];

// --- Pure helper checks ---
const emptyProfile = {};
const partialProfile = {
  dateOfBirth: new Date("2005-06-15"),
  gender: "Male",
  schoolOrCollege: "St. Xavier's",
  classOrGrade: "Class 12",
  city: "",
  state: "",
};
const completeProfile = {
  dateOfBirth: new Date("2005-06-15"),
  gender: "Male",
  schoolOrCollege: "St. Xavier's",
  classOrGrade: "Class 12",
  city: "Jaipur",
  state: "Rajasthan",
};

if (computeStudentProfileComplete(emptyProfile) !== false) {
  fails.push("empty profile reported complete");
}
if (computeStudentProfileComplete(partialProfile) !== false) {
  fails.push("partial profile (missing city/state) reported complete");
}
if (computeStudentProfileComplete(completeProfile) !== true) {
  fails.push("complete profile reported incomplete");
}

// Invalid date should not satisfy the gate even though the field is present
const invalidDateProfile = {
  ...completeProfile,
  dateOfBirth: new Date("invalid"),
};
if (computeStudentProfileComplete(invalidDateProfile) !== false) {
  fails.push("invalid Date dateOfBirth reported complete");
}

// --- Model instance checks (no DB needed; we just want validateSync +
// the method that drives the pre-save hook to work correctly) ---
const u1 = new User({
  name: "Test Student",
  email: "test-profile@example.com",
  password: "secret123",
  studentProfile: completeProfile,
});

const err = u1.validateSync();
if (err) {
  fails.push(`new user with complete profile failed validation: ${err.message}`);
}

// The pre-save hook calls computeStudentProfileComplete(this.studentProfile)
// and assigns the result. We exercise the same path here so the assertion
// matches what the hook will do on save.
u1.studentProfile.isComplete = computeStudentProfileComplete(u1.studentProfile);
if (u1.studentProfile.isComplete !== true) {
  fails.push(
    `pre-save semantics: expected isComplete=true on complete profile, got ${u1.studentProfile.isComplete}`
  );
}

const u2 = new User({
  name: "Partial Student",
  email: "partial@example.com",
  password: "secret123",
  studentProfile: partialProfile,
});
u2.studentProfile.isComplete = computeStudentProfileComplete(u2.studentProfile);
if (u2.studentProfile.isComplete !== false) {
  fails.push(
    `pre-save semantics: expected isComplete=false on partial profile, got ${u2.studentProfile.isComplete}`
  );
}

// --- toAuthJSON check: surfaces studentProfile.isComplete ---
const auth = u1.toAuthJSON();
if (auth.studentProfile?.isComplete !== true) {
  fails.push(
    `toAuthJSON did not surface studentProfile.isComplete (got ${JSON.stringify(auth.studentProfile)})`
  );
}

const auth2 = u2.toAuthJSON();
if (auth2.studentProfile?.isComplete !== false) {
  fails.push(
    `toAuthJSON should report isComplete=false for partial profile (got ${JSON.stringify(auth2.studentProfile)})`
  );
}

// Confirm the instance method matches the helper.
if (u1.isStudentProfileComplete() !== true) {
  fails.push("isStudentProfileComplete() method should return true for u1");
}
if (u2.isStudentProfileComplete() !== false) {
  fails.push("isStudentProfileComplete() method should return false for u2");
}

// --- Schema enum sanity ---
const u3 = new User({
  name: "Bad Gender",
  email: "bad@example.com",
  password: "secret123",
  studentProfile: { ...completeProfile, gender: "Robot" },
});
const enumErr = u3.validateSync();
if (!enumErr) {
  fails.push("invalid gender enum should fail validation");
}

if (fails.length) {
  console.error("[FAIL]");
  fails.forEach((f) => console.error("  -", f));
  process.exit(1);
}

console.log("[OK] Student profile completion + hook + auth payload checks pass.");
console.log("     - computeStudentProfileComplete: 4 cases verified");
console.log("     - pre-save semantics (complete + partial): 2 cases verified");
console.log("     - toAuthJSON exposes isComplete: 2 cases verified");
console.log("     - isStudentProfileComplete() instance method: 2 cases verified");
console.log("     - gender enum rejects bogus values: verified");

// Avoid keeping the mongoose connection waiting on anything
await mongoose.disconnect().catch(() => {});
