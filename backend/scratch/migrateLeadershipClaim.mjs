import 'dotenv/config';
import mongoose from 'mongoose';
import { reconcileLeadershipClaim } from '../utils/resultProfiling.js';
const DRY = process.argv.includes('--dry');
await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
const users = mongoose.connection.collection('users');
const findLeadership = (p) => {
  for (const sec of p?.sectionBreakdown || []) for (const sub of sec?.subsections || [])
    if (sub?.key === 'leadership_social_interaction') return sub;
  return null;
};
const SIG = 'Leadership & Social Interaction section for your self-reported';
let scanned = 0, updated = 0, usersUpdated = 0; const details = [];
for await (const u of users.find({ 'assessmentReports.0': { $exists: true } })) {
  let dirty = false;
  for (const r of (u.assessmentReports || [])) {
    const p = r.profile; const code = p?.personalityType?.code;
    if (!code) continue; scanned += 1;
    const lead = findLeadership(p);
    const rec = reconcileLeadershipClaim({ code, title: p.personalityType.title,
      description: p.personalityType.description, leadershipPercentage: lead?.percentage, leadershipBand: lead?.band });
    if (!rec) continue;
    p.consistencyNotes = (Array.isArray(p.consistencyNotes) ? p.consistencyNotes : []).filter((n) => !String(n).includes(SIG));
    if (p.reviewSummary && Array.isArray(p.reviewSummary.observations))
      p.reviewSummary.observations = p.reviewSummary.observations.filter((o) => !String(o).includes(SIG));
    const desiredDesc = rec.description;
    const before = p.personalityType.description;
    const changed = before !== desiredDesc || true; // notes always refreshed to canonical text
    p.personalityType.description = desiredDesc;
    p.consistencyNotes.push(rec.consistencyNote);
    if (p.reviewSummary && Array.isArray(p.reviewSummary.observations)) p.reviewSummary.observations.push(rec.consistencyNote);
    if (changed) { updated += 1; dirty = true;
      details.push({ email: u.email, code, leadPct: lead?.percentage, note: rec.consistencyNote.match(/scored ([^.]+?\))/)?.[1] }); }
  }
  if (dirty) { usersUpdated += 1; if (!DRY) await users.updateOne({ _id: u._id }, { $set: { assessmentReports: u.assessmentReports } }); }
}
console.log(DRY ? '=== DRY ===' : '=== APPLIED ===', '| scanned:', scanned, '| updated:', updated, '| users:', usersUpdated);
console.log(JSON.stringify(details, null, 2));
await mongoose.disconnect();
