/* Datum- en urensimulatie zonder DOM; kalenderdagen in UTC, lokale datumvelden zonder tijd. */
(function(root){
 const DAY=86400000;
 function parseDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))throw Error('Ongeldige datum');const date=new Date(value+'T00:00:00Z');if(!Number.isFinite(+date)||date.toISOString().slice(0,10)!==value)throw Error('Ongeldige datum');return +date;}
 function iso(value){return new Date(value).toISOString().slice(0,10);}
 function plusMonths(value,months){const d=new Date(value),day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+months);const end=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(day,end));return +d;}
 function calendarDeadline(task,lastDate){const dates=[];if(task.interval.days)dates.push(lastDate+task.interval.days*DAY);if(task.interval.months)dates.push(plusMonths(lastDate,task.interval.months));return dates.length?Math.min(...dates):Infinity;}
 function validate(input,tasks){
  const start=parseDate(input.start);if(!Number.isInteger(input.horizon)||input.horizon<1||input.horizon>1095)throw Error('Kies 1 tot 1095 kalenderdagen.');
  if(!Number.isFinite(input.hoursPerDay)||input.hoursPerDay<0||input.hoursPerDay>24)throw Error('Draaiuren per dag moeten tussen 0 en 24 liggen.');
  if(!Number.isFinite(input.meter)||input.meter<0||input.meter>10000000)throw Error('Ongeldige beginstand van de urenteller.');
  if(!Array.isArray(input.workdays)||input.workdays.some(d=>!Number.isInteger(d)||d<0||d>6)||new Set(input.workdays).size!==input.workdays.length)throw Error('Ongeldige werkdagen.');
  if(!Number.isInteger(input.window)||input.window<0||input.window>30)throw Error('Bundelvenster moet 0 tot 30 dagen zijn.');
  if(!Number.isFinite(input.setupMinutes)||input.setupMinutes<0||input.setupMinutes>1440)throw Error('Kies 0 tot 1440 minuten voorbereiding per bezoek.');
  for(const task of tasks.filter(t=>t.interval)){
   const history=input.history[task.id];if(!history)throw Error('Ontbrekende onderhoudshistoriek.');
   const date=parseDate(history.date);if(date>start)throw Error('De laatste uitvoering mag niet na de startdatum liggen.');
   if(!Number.isFinite(history.meter)||history.meter<0||history.meter>input.meter)throw Error('De tellerstand bij de laatste uitvoering moet tussen 0 en de beginstand liggen.');
  }
  return start;
 }
 function simulate(tasks,input,window=input.window){
  const start=validate(input,tasks);const workdays=new Set(input.workdays);const length=input.horizon+window+2;
  const meter=[input.meter];for(let day=0;day<length;day++)meter[day+1]=meter[day]+(workdays.has(new Date(start+day*DAY).getUTCDay())?input.hoursPerDay:0);
  const active=tasks.filter(t=>t.interval),state=new Map();
  function deadline(task,lastDate,lastMeter,from){
   const calendar=calendarDeadline(task,lastDate);let hourDay=Infinity;
   if(task.interval.hours){const limit=lastMeter+task.interval.hours;
    if(meter[from]>=limit-1e-8)hourDay=from;
    else for(let d=from;d<length;d++){if(meter[d+1]>=limit-1e-8){hourDay=d;break;}}
   }
   const calDay=Number.isFinite(calendar)?Math.round((calendar-start)/DAY):Infinity;
   const day=Math.min(calDay,hourDay);
   const reason=calDay===hourDay?'kalender en uren':calDay<hourDay?'kalender':'draaiuren';
   return {day,date:Number.isFinite(day)?iso(start+day*DAY):null,reason,calendar: Number.isFinite(calendar)?iso(calendar):null,limit:task.interval.hours?lastMeter+task.interval.hours:null,overdue:calDay<from||(task.interval.hours&&meter[from]>lastMeter+task.interval.hours+1e-8)};
  }
  active.forEach(task=>{const h=input.history[task.id];state.set(task.id,deadline(task,parseDate(h.date),h.meter,0));});
  const visits=[],routine=new Map(),next=new Map(state);
  for(let day=0;day<input.horizon;day++){
   const due=active.filter(t=>state.get(t.id).day<=day);
   const jobs=due.filter(t=>t.outage);
   if(jobs.length&&window){for(const task of active){const target=state.get(task.id);if(task.outage&&task.bundle&&!jobs.includes(task)&&target.day>day&&target.day<=day+window)jobs.push(task);}}
   if(jobs.length){visits.push({date:iso(start+day*DAY),meter:meter[day],jobs:jobs.map(task=>({task,...state.get(task.id),advance:Math.max(0,state.get(task.id).day-day)}))});}
   const executed=[...due.filter(t=>!t.outage),...jobs];
   for(const task of executed){const target=state.get(task.id);if(!task.outage){const summary=routine.get(task.id)||{task,count:0,first:iso(start+day*DAY),last:'',overdue:false};summary.count++;summary.last=iso(start+day*DAY);summary.overdue ||=target.overdue;routine.set(task.id,summary);}
    state.set(task.id,deadline(task,start+day*DAY,meter[day],day+1));
   }
  }
  return {visits,routine:[...routine.values()],next:[...next].map(([id,due])=>({id,...due})),meterEnd:meter[input.horizon],hours:meter[input.horizon]-input.meter,end:iso(start+(input.horizon-1)*DAY)};
 }
 function compare(tasks,input){const baseline=simulate(tasks,input,0),bundled=simulate(tasks,input,input.window);return {baseline,bundled,savedVisits:baseline.visits.length-bundled.visits.length,baselineJobs:baseline.visits.reduce((n,v)=>n+v.jobs.length,0),bundledJobs:bundled.visits.reduce((n,v)=>n+v.jobs.length,0)};}
 const api={parseDate,iso,plusMonths,simulate,compare};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CompressorPlanner=api;
})(globalThis);
