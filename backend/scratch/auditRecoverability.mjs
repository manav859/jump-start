import 'dotenv/config';
import mongoose from 'mongoose';
await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:8000});
const users = mongoose.connection.collection('users');
const findSub = (p,key)=>{ for(const s of p?.sectionBreakdown||[]) for(const sub of s?.subsections||[]) if(sub?.key===key) return sub; return null; };
const rows=[];
for await (const u of users.find({ 'assessmentReports.0': { $exists: true } })){
  const tpCount = Object.keys(u.testProgress?.answers || {}).length;
  for (const r of (u.assessmentReports||[])){
    const p=r.profile||{};
    const ocean=findSub(p,'big_five_ocean');
    const eq=findSub(p,'self_awareness');
    const lead=findSub(p,'leadership_social_interaction');
    const hasOcean=!!(ocean?.factorResults||[]).some(f=>f.average!=null);
    const hasEq = (p.eqProfile && Object.keys(p.eqProfile).length>0) || !!eq;
    rows.push({
      jumpstartId:u.jumpstartId||'(none)', name:u.name||u.email||'?', demo:!!r.isDemo,
      code:p.personalityType?.code||'?', overall:p.overallScore??null,
      raw:tpCount, ocean:hasOcean, eq:hasEq, leadPct:lead?.percentage??null,
    });
  }
}
const C=(s,n)=>String(s).slice(0,n).padEnd(n);
console.log('jumpstartId    | name           | demo | code   | ovr | rawAns | OCEAN | EQ  | re-scorable(full) | partial-update');
console.log('-'.repeat(118));
for(const r of rows){
  const full = r.raw>50 ? 'YES' : 'NO';
  const partial = (r.ocean && !r.demo) ? 'YES (MBTI+leadership)' : (r.demo?'n/a (demo)':'limited');
  console.log(C(r.jumpstartId,14),'|',C(r.name,14),'|',(r.demo?'yes':'no').padEnd(4),'|',C(r.code,6),'|',String(r.overall).padEnd(3),'|',String(r.raw).padEnd(6),'|',(r.ocean?'yes':'no').padEnd(5),'|',(r.eq?'yes':'no').padEnd(3),'|',full.padEnd(17),'|',partial);
}
console.log('');
console.log('SUMMARY: total='+rows.length+' | full-rescorable='+rows.filter(r=>r.raw>50).length+' | partial-eligible(non-demo,storedOCEAN)='+rows.filter(r=>r.ocean&&!r.demo).length);
await mongoose.disconnect();
