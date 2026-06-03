import 'dotenv/config';
import mongoose from 'mongoose';
import { buildPersonalityType } from '../utils/scoring/packageScoring/career500q.js';
import { reconcileLeadershipClaim } from '../utils/resultProfiling.js';

const DRY = process.argv.includes('--dry');
await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
const users = mongoose.connection.collection('users');

const findSub = (p, key) => {
  for (const s of p?.sectionBreakdown || []) for (const sub of s?.subsections || []) if (sub?.key === key) return sub;
  return null;
};
const likertToPercent = (a) => (a == null ? null : Math.max(0, Math.min(100, Math.round(((Number(a) - 1) / 4) * 100))));
const pct = (ocean, key) => {
  const f = (ocean?.factorResults || []).find((x) => x.key === key);
  const v = likertToPercent(f?.average);
  return v == null ? 'na' : String(v);
};

const SIG = 'Leadership & Social Interaction section for your self-reported';
const rows = [];

for await (const u of users.find({ 'assessmentReports.0': { $exists: true } })) {
  let dirty = false;
  (u.assessmentReports || []).forEach((r) => {
    const p = r.profile || {};
    if (r.isDemo) return;
    const ocean = findSub(p, 'big_five_ocean');
    const hasOcean = !!(ocean?.factorResults || []).some((f) => f.average != null);
    if (!hasOcean) return; // limited reports excluded — the 8 partial-eligible only

    // Reconstruct the inputs buildPersonalityType expects from stored data.
    const eqKeys = ['self_awareness', 'self_regulation', 'motivation', 'empathy', 'social_skills'];
    const emotionalSection = { subsections: eqKeys.map((k) => findSub(p, k)).filter(Boolean) };
    const recomputed = buildPersonalityType({ bigFiveSection: ocean, emotionalSection });

    const lead = findSub(p, 'leadership_social_interaction');
    const rec = reconcileLeadershipClaim({
      code: recomputed.code, title: recomputed.title, description: recomputed.description,
      leadershipPercentage: lead?.percentage, leadershipBand: lead?.band,
    });

    const oldCode = p.personalityType?.code || '(none)';
    const newPT = {
      code: recomputed.code,
      title: recomputed.title,
      description: rec ? rec.description : recomputed.description,
      traits: recomputed.traits,
    };
    // refresh consistency notes
    p.consistencyNotes = (Array.isArray(p.consistencyNotes) ? p.consistencyNotes : []).filter((n) => !String(n).includes(SIG));
    if (rec) p.consistencyNotes.push(rec.consistencyNote);
    if (p.reviewSummary && Array.isArray(p.reviewSummary.observations)) {
      p.reviewSummary.observations = p.reviewSummary.observations.filter((o) => !String(o).includes(SIG));
      if (rec) p.reviewSummary.observations.push(rec.consistencyNote);
    }

    rows.push({
      jumpstartId: u.jumpstartId || '(none)', name: u.name || u.email || '?',
      ocean: `${pct(ocean,'extraversion')}/${pct(ocean,'openness')}/${pct(ocean,'conscientiousness')}/${pct(ocean,'agreeableness')}/${pct(ocean,'neuroticism')}`,
      oldCode, newCode: newPT.code, changed: oldCode !== newPT.code,
      leadReconciled: !!rec,
    });
    p.personalityType = newPT;
    dirty = true;
  });
  if (dirty && !DRY) await users.updateOne({ _id: u._id }, { $set: { assessmentReports: u.assessmentReports } });
}

const C = (s, n) => String(s).slice(0, n).padEnd(n);
console.log(DRY ? '=== DRY RUN ===' : '=== MIGRATION APPLIED & PERSISTED ===');
console.log('');
console.log('PERSONALITY RE-EVALUATION — BEFORE / AFTER');
console.log('='.repeat(78));
console.log(C('Student',16),'|',C('OCEAN E/O/C/A/N',22),'|',C('Old',8),'|',C('New',8),'|','Changed');
console.log('-'.repeat(78));
for (const r of rows) console.log(C(r.name,16),'|',C(r.ocean,22),'|',C(r.oldCode,8),'|',C(r.newCode,8),'|',r.changed?'YES':'no');
console.log('');
console.log('Summary:', rows.filter(r=>r.changed).length, 'of', rows.length, 'reports changed personality type');
console.log('Distinct types before:', new Set(rows.map(r=>r.oldCode)).size, '['+[...new Set(rows.map(r=>r.oldCode))].join(', ')+']');
console.log('Distinct types after: ', new Set(rows.map(r=>r.newCode)).size, '['+[...new Set(rows.map(r=>r.newCode))].join(', ')+']');
console.log('Leadership reconciliations applied:', rows.filter(r=>r.leadReconciled).length);
await mongoose.disconnect();
