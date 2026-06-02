import pkgMod from '../config/comprehensive500Package.generated.js';
import cfgMod from '../utils/scoring/configs/career500q.config.js';
import { scoreCareer500QPackage } from '../utils/scoring/packageScoring/career500q.js';
const P = pkgMod.default || pkgMod;
const CFG = cfgMod.default || cfgMod;
const ocean = CFG.sections[0].subsections.find(s=>s.key==='big_five_ocean');
const reverseSet = new Set();
for(const f of ocean.factors) for(const q of (f.reverseQuestions||[])) reverseSet.add(q);
const factorOf = new Map();
for(const f of ocean.factors) for(const q of f.questionNumbers) factorOf.set(q,f.key);
function buildAnswers(valueFor){
  const a={};
  for(const sec of P.sections) sec.questions.forEach((q,idx)=>{ const v=valueFor(Number(q.questionId),q); if(v!=null) a[`${sec.sectionId}-${idx}`]=v; });
  return a;
}
function run(label, valueFor){
  const res = scoreCareer500QPackage(buildAnswers(valueFor), P.sections);
  const per=res.sectionBreakdown.find(s=>s.key==='personality');
  const lead=per.subsections.find(s=>s.key==='leadership_social_interaction');
  const oceanSub=per.subsections.find(s=>s.key==='big_five_ocean');
  const fm=Object.fromEntries(oceanSub.factorResults.map(f=>[f.key,f.percentage]));
  console.log('\n===== '+label+' =====');
  console.log('OCEAN %:', 'E='+fm.extraversion,'O='+fm.openness,'C='+fm.conscientiousness,'A='+fm.agreeableness,'N='+fm.neuroticism);
  console.log('=> CODE:', res.personalityType.code, '| TITLE:', res.personalityType.title);
  console.log('   DESC:', res.personalityType.description);
  console.log('Leadership:', lead.percentage+'%', lead.band);
  console.log('consistencyNote:', res.consistencyNotes.length ? res.consistencyNotes[0] : '(none)');
}
run('CASE 1: all = 1 (disagree)', (n,q)=> q.type==='likert'?1:(q.type==='single'?'A':null));
run('CASE 2: all = 5 (agree)', (n,q)=> q.type==='likert'?5:(q.type==='single'?'A':null));
run('CASE 3: genuine leader', (n,q)=>{ if(q.type!=='likert') return q.type==='single'?'A':null; if(reverseSet.has(n)) return 1; return 5; });
run('CASE 4: genuine non-leader', (n,q)=>{ if(q.type!=='likert') return q.type==='single'?'A':null; if(reverseSet.has(n)) return 5; return 1; });
run('CASE 5: ENTJ-ish + LOW leadership (flagged scenario)', (n,q)=>{
  if(q.type!=='likert') return q.type==='single'?'A':null;
  if(n>=97 && n<=120) return 1;
  const fk=factorOf.get(n);
  if(fk==='extraversion') return reverseSet.has(n)?3:4;
  if(fk==='openness') return reverseSet.has(n)?1:5;
  if(fk==='conscientiousness') return reverseSet.has(n)?1:5;
  if(fk==='agreeableness') return reverseSet.has(n)?5:1;
  if(fk==='neuroticism') return reverseSet.has(n)?5:1;
  if(n>=471&&n<=480) return 5;
  if(n>=461&&n<=470) return 4;
  if(n>=451&&n<=500) return 2;
  return 3;
});
