const {test}=require('node:test');
const assert=require('node:assert/strict');
const data=require('../content/compressors.js');
const planner=require('../planner.js');
const task=(id,interval,extra={})=>({id,interval,title:id,strategy:'preventief',outage:true,bundle:true,...extra});
function input(tasks,overrides={}){return{start:'2026-01-05',hoursPerDay:8,workdays:[1,2,3,4,5],horizon:365,meter:0,window:14,setupMinutes:30,history:Object.fromEntries(tasks.filter(t=>t.interval).map(t=>[t.id,{date:'2026-01-05',meter:0}])),...overrides};}
function first(tasks,overrides={}){return planner.simulate(tasks,input(tasks,overrides),0).visits[0];}
test('all seven types: inventory links resolve for every strategy and option set',()=>{
 assert.equal(data.models.length,7);
 for(const model of data.models)for(const variant of ['base','tank','full'])for(const oil of ['piston','mineral']){
  const m=data.build(model.id,{variant,oil});const assets=new Set(m.inventory.map(i=>i.id));
  assert.equal(assets.size,m.inventory.length);assert.equal(new Set(m.tasks.map(t=>t.id)).size,m.tasks.length);
  for(const t of m.tasks)assert.ok(assets.has(t.asset),`${model.id} ${t.id} ${t.asset}`);
  for(const strategy of ['preventief','predictief','correctief'])assert.ok(m.tasks.some(t=>t.strategy===strategy));
  if(variant==='full'){assert.ok(m.tasks.some(t=>t.id.endsWith('P11')));assert.ok(m.inventory.some(i=>i.id.endsWith('-DR')));}
  if(variant==='base')assert.ok(!m.inventory.some(i=>i.id.endsWith('-AR')));
 }
});
test('verified filter, valve and oil intervals; LE 10 remains unresolved',()=>{
 for(const m of data.models){const built=data.build(m.id);const filter=built.tasks.find(t=>t.id.endsWith('P05'));assert.equal(filter.interval?.hours??null,m.filterHours);assert.equal(built.tasks.find(t=>t.id.endsWith('P09')).interval.hours,m.valveHours);assert.deepEqual(built.tasks.find(t=>t.id.endsWith('P07')).interval,{hours:3000,months:24});assert.deepEqual(data.build(m.id,{oil:'mineral'}).tasks.find(t=>t.id.endsWith('P07')).interval,{hours:2000,months:12});}
 assert.equal(data.build('LE10').tasks.find(t=>t.id==='LE10-P05').missing,true);
});
test('annual manufacturer vessel check and pre-start controls remain visible',()=>{const m=data.build('LE5');assert.deepEqual(m.tasks.find(t=>t.id==='LE5-P13').interval,{months:12});assert.ok(m.tasks.find(t=>t.id==='LE5-P14').trigger.includes('start'));assert.ok(m.tasks.find(t=>t.id==='LE5-P16').missing);});
test('options remove optional tasks and components',()=>{const m=data.build('LE5',{silencer:false,variant:'base',autoDrain:true});assert.ok(!m.tasks.some(t=>t.id.endsWith('P06')));assert.ok(!m.tasks.some(t=>t.id.endsWith('P10')));assert.ok(!m.inventory.some(i=>i.id.endsWith('-US')));});
test('hour limit uses weekdays and service before production that would reach the limit',()=>{const tasks=[task('t',{hours:100,months:12})],v=first(tasks);assert.equal(v.date,'2026-01-21');assert.equal(v.meter,96);assert.equal(v.jobs[0].reason,'draaiuren');});
test('more daily hours or more operating days advance hour-based maintenance',()=>{const tasks=[task('t',{hours:100})];assert.ok(first(tasks,{hoursPerDay:16}).date<first(tasks).date);assert.ok(first(tasks,{workdays:[0,1,2,3,4,5,6]}).date<first(tasks).date);});
test('calendar comes first when hours are low, including zero hours and weekends',()=>{const tasks=[task('t',{hours:2000,months:1})];assert.equal(first(tasks,{hoursPerDay:0}).date,'2026-02-05');const sat=[task('t',{days:5})];assert.equal(first(sat).date,'2026-01-10');});
test('calendar-month arithmetic clips end of month and preserves leap years',()=>{assert.equal(planner.iso(planner.plusMonths(planner.parseDate('2028-01-31'),1)),'2028-02-29');assert.equal(planner.iso(planner.plusMonths(planner.parseDate('2026-01-31'),1)),'2026-02-28');assert.equal(planner.iso(planner.plusMonths(planner.parseDate('2028-02-29'),12)),'2029-02-28');});
test('calendar calculations have no daylight-saving shift',()=>{const tasks=[task('t',{days:7})];const h={t:{date:'2026-03-23',meter:0}};assert.equal(first(tasks,{start:'2026-03-23',history:h}).date,'2026-03-30');});
test('hour-only tasks stay unscheduled with zero production; calendar routine still runs',()=>{const tasks=[task('t',{hours:100}),task('daily',{days:1},{outage:false})];const r=planner.simulate(tasks,input(tasks,{hoursPerDay:0,horizon:30}));assert.equal(r.visits.length,0);assert.equal(r.routine[0].count,29);assert.equal(r.hours,0);});
test('existing meter and task-specific history affect the first deadline',()=>{const tasks=[task('t',{hours:100})];const v=first(tasks,{meter:90,history:{t:{date:'2026-01-01',meter:0}}});assert.equal(v.date,'2026-01-06');assert.equal(v.meter,98);});
test('overdue dates and hours are flagged at start, not silently shifted away',()=>{const tasks=[task('t',{days:7}),task('h',{hours:100})];const r=planner.simulate(tasks,input(tasks,{meter:200,history:{t:{date:'2025-12-01',meter:0},h:{date:'2026-01-01',meter:0}}}));assert.equal(r.visits[0].date,'2026-01-05');assert.ok(r.visits[0].jobs.every(j=>j.overdue));});
test('bundling only advances eligible jobs, and resets their next deadlines',()=>{
 const tasks=[task('a',{days:30}),task('b',{days:35}),task('test',{days:38},{bundle:false})];const r=planner.compare(tasks,input(tasks,{horizon:100,window:7}));
 const visit=r.bundled.visits[0];assert.equal(visit.date,'2026-02-04');assert.equal(visit.jobs.length,2);assert.equal(visit.jobs.find(j=>j.task.id==='b').advance,5);
 assert.equal(r.bundled.visits.find(v=>v.jobs.some(j=>j.task.id==='test')).date,'2026-02-12');
 const nextB=r.bundled.visits.filter(v=>v.jobs.some(j=>j.task.id==='b'))[1];assert.ok(nextB.date<='2026-03-11');
 for(const v of r.bundled.visits)for(const j of v.jobs)assert.ok(v.date<=j.date);
});
test('zero bundling window exactly reproduces separate scenario',()=>{const tasks=data.build('LE5').tasks;const r=planner.compare(tasks,input(tasks,{window:0}));assert.deepEqual(r.baseline,r.bundled);assert.equal(r.savedVisits,0);});
test('real model simulation remains bounded, respects hour deadlines, and flags absent LE10 task',()=>{
 for(const m of data.models){const tasks=data.build(m.id,{variant:'full',oil:'mineral'}).tasks;const r=planner.compare(tasks,input(tasks,{hoursPerDay:24,workdays:[0,1,2,3,4,5,6],horizon:1095,window:30}));
  assert.equal(r.bundled.hours,24*1095);assert.ok(r.bundled.visits.length<1095);
  for(const v of r.bundled.visits)for(const j of v.jobs){assert.ok(v.date<=j.date||j.overdue);if(j.limit!==null)assert.ok(v.meter<=j.limit);}
  if(m.id==='LE10')assert.ok(!r.bundled.visits.some(v=>v.jobs.some(j=>j.task.id==='LE10-P05')));
 }
});
test('invalid, future or impossible history and inputs are rejected',()=>{
 const tasks=[task('t',{hours:100})];
 for(const override of [{hoursPerDay:25},{horizon:0},{window:31},{workdays:[1,1]},{start:'2026-02-30'},{history:{t:{date:'2027-01-01',meter:0}}},{history:{t:{date:'2026-01-01',meter:10}}},{history:{t:{date:'',meter:0}}},{history:{}}])assert.throws(()=>planner.compare(tasks,input(tasks,override)));
});
