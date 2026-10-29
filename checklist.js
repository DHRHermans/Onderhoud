'use strict';
(() => {
 const $=id=>document.getElementById(id),DAY=86400000;
 let context=null,signature='',checks=new Set(),columns=[],rows=[];
 const make=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const iso=t=>new Date(t).toISOString().slice(0,10);
 const parse=s=>Date.parse(s+'T00:00:00Z');
 const format=s=>new Intl.DateTimeFormat('nl-BE',{timeZone:'UTC',day:'2-digit',month:'2-digit'}).format(new Date(parse(s)));
 function weekNumber(t){const d=new Date(t);d.setUTCDate(d.getUTCDate()+3-(d.getUTCDay()+6)%7);const year=d.getUTCFullYear(),jan4=Date.UTC(year,0,4);return{year,week:1+Math.round((+d-jan4)/DAY/7)};}
 function weeks(year){const first=Date.UTC(year,0,1),last=Date.UTC(year,11,31),monday=first-((new Date(first).getUTCDay()+6)%7)*DAY,result=[];for(let t=monday;t<=last;t+=7*DAY){const start=Math.max(first,t),end=Math.min(last,t+6*DAY);result.push({start,end,...weekNumber(t),month:new Date(start).getUTCMonth()});}return result;}
 function kind(task){return /vervangen|verversen/i.test(task.title)?'V':/reinigen/i.test(task.title)?'O':'C';}
 function compact(task){if(task.trigger)return task.id.endsWith('P14')?'Iedere start':'Na lange stilstand';if(!task.interval)return task.strategy==='correctief'?'Bij storing':'Te bevestigen';const i=task.interval;return [i.days?(i.days===1?'Dagelijks':`${i.days} d`):'',i.months?`${i.months} M`:'',i.hours?`${i.hours} h`:''].filter(Boolean).join(' / ');}
 function key(task,col){return `${task.id}|${iso(col.start)}`;}
 function status(){const visible=rows.reduce((n,row)=>n+columns.filter(c=>checks.has(key(row.task,c))).length,0);$('checklist-status').textContent=`${visible} taak-weekvakjes afgevinkt in deze weergave. Afvinken wijzigt geen onderhoudshistoriek en is geen technische vrijgave.`;}
 function render(){
  if(!context)return;
  const {machine,input,result}=context,year=Number($('checklist-year').value),filter=$('checklist-strategy').value;
  columns=weeks(year);
  const events=new Map(machine.tasks.map(t=>[t.id,[]]));
  result.bundled.visits.forEach(v=>v.jobs.forEach(j=>events.get(j.task.id).push({date:v.date,advance:j.advance,overdue:j.overdue})));
  result.bundled.routine.forEach(r=>{for(let t=parse(r.first);t<=parse(r.last);t+=r.task.interval.days*DAY)events.get(r.task.id).push({date:iso(t),advance:0,overdue:r.overdue&&t===parse(r.first)});});
  rows=machine.tasks.filter(t=>filter==='all'||t.strategy===filter).map(task=>({task,events:events.get(task.id),kind:kind(task)}));
  $('checklist-caption').textContent=`${machine.model.name} · ${machine.config.asset} · ${year} · ${input.hoursPerDay} uur/dag × ${input.workdays.length} dagen/week = ${input.hoursPerDay*input.workdays.length} uur/week`;
  $('checklist-period').textContent=`Simulatie ${input.start} t/m ${result.bundled.end} · bundelvenster ${input.window} dagen · kalenderjaar ${year}. Grijs = buiten de simulatie; lege witte vakken = geen geplande taak. Weeknummers zijn ISO-weken; grensweken horen gedeeltelijk bij een ander ISO-jaar.`;
  const table=$('checklist-table');table.replaceChildren();
  const caption=make('caption',`Beknopte onderhoudschecklist ${machine.model.name}, ${machine.config.asset}, ${year}`);table.append(caption);
  const head=make('thead'),yearRow=make('tr'),monthRow=make('tr'),weekRow=make('tr');
  for(const [label,cls]of [['Taak / component','matrix-task'],['Interval¹','matrix-interval']]){const th=make('th',label,cls);th.scope='col';th.rowSpan=3;yearRow.append(th);}
  const yearHead=make('th',`${year} · educatieve planning, dhr. Hermans`);yearHead.colSpan=columns.length;yearHead.scope='colgroup';yearRow.append(yearHead);
  const monthNames=['JAN','FEB','MRT','APR','MEI','JUN','JUL','AUG','SEP','OKT','NOV','DEC'];let current=-1,monthCell;
  for(const col of columns){if(current!==col.month){monthCell=make('th',monthNames[col.month]);monthCell.colSpan=1;monthCell.scope='colgroup';monthRow.append(monthCell);current=col.month;}else monthCell.colSpan++;const th=make('th',String(col.week),'matrix-week');th.scope='col';th.title=`Week ${col.week} (${col.year}): ${format(iso(col.start))}–${format(iso(col.end))}`;weekRow.append(th);}
  head.append(yearRow,monthRow,weekRow);table.append(head);const body=make('tbody'),counts=columns.map(()=>0);
  rows.forEach(row=>{
   const task=row.task,tr=make('tr'),title=make('th',undefined,'matrix-task');title.scope='row';
   title.append(make('span',task.title),make('small',`${task.id} · ${task.asset}`));tr.append(title);const interval=make('td',compact(task),'matrix-interval');interval.title=context.intervalText(task);tr.append(interval);
   if(!task.interval){const td=make('td',task.strategy==='correctief'?'Op melding / vastgesteld defect — niet vooraf in weekvakken gepland':task.trigger||'Interval / verplichting eerst bevestigen; geen automatische weekplanning','matrix-event-only');td.colSpan=columns.length;tr.append(td);}
   else columns.forEach((col,index)=>{
    const events=row.events.filter(e=>parse(e.date)>=col.start&&parse(e.date)<=col.end),td=make('td',undefined,'matrix-cell');
    if(col.end<parse(input.start)||col.start>parse(result.bundled.end))td.classList.add('matrix-outside');
    if(events.length){counts[index]+=events.length;td.classList.add(`matrix-${row.kind}`);if(events.some(e=>e.overdue))td.classList.add('matrix-overdue');
     const label=make('label',undefined,'matrix-check'),box=make('input');box.type='checkbox';box.checked=checks.has(key(task,col));box.setAttribute('aria-label',`${task.id}, week ${col.week} van ${col.year}, ${events.length} geplande uitvoering(en) afvinken`);
     box.addEventListener('change',()=>{if(box.checked)checks.add(key(task,col));else checks.delete(key(task,col));status();});
     const symbol=make('span',events.length>1?`${row.kind}×${events.length}`:row.kind);symbol.setAttribute('aria-hidden','true');label.title=`${task.title}: ${events.map(e=>`${e.date}${e.advance?' ('+e.advance+' d vervroegd)':''}${e.overdue?' — achterstallig op start':''}`).join(', ')}. Afvinken betreft alle ${events.length} geplande uitvoering(en) in dit weekvak.`;label.append(box,symbol);td.append(label);
    }tr.append(td);
   });body.append(tr);
  });table.append(body);
  const foot=make('tfoot'),total=make('tr'),totalTitle=make('th','Geplande uitvoeringen');totalTitle.colSpan=2;totalTitle.scope='row';total.append(totalTitle);counts.forEach(count=>total.append(make('td',String(count))));foot.append(total);table.append(foot);status();
 }
 window.addEventListener('compressor-plan-change',event=>{
  context=event.detail;$('checklist-content').hidden=!context;$('checklist-unavailable').hidden=Boolean(context);
  if(!context)return;
  const next=JSON.stringify({config:context.machine.config,model:context.machine.model.id,input:context.input});if(next!==signature){checks.clear();signature=next;}
  const old=$('checklist-year').value,start=Number(context.input.start.slice(0,4)),end=Number(context.result.bundled.end.slice(0,4));$('checklist-year').replaceChildren();for(let y=start;y<=end;y++){const option=make('option',String(y));option.value=y;$('checklist-year').append(option);}if(Number(old)>=start&&Number(old)<=end)$('checklist-year').value=old;render();
 });
 $('checklist-year').addEventListener('change',render);$('checklist-strategy').addEventListener('change',render);
 $('clear-checklist').addEventListener('click',()=>{checks.clear();render();});
 $('export-checklist').addEventListener('click',()=>{
  if(!context)return;
  const year=$('checklist-year').value,{machine,input}=context;
  const csvRows=[['Asset','Type','Jaar','Draaiuren per dag','Productiedagen per week','Bundelvenster (dagen)','Taak-ID','Onderdeel','Taak','Interval',...columns.map(c=>`W${c.week} (${iso(c.start)} t/m ${iso(c.end)})`)]];
  rows.forEach(row=>csvRows.push([machine.config.asset,machine.model.name,year,input.hoursPerDay,input.workdays.length,input.window,row.task.id,row.task.asset,row.task.title,context.intervalText(row.task),...columns.map(col=>{
   if(!row.task.interval)return row.task.strategy==='correctief'?'Bij storing':row.task.trigger||'Te bevestigen';const events=row.events.filter(e=>parse(e.date)>=col.start&&parse(e.date)<=col.end);
   return events.length?`${row.kind} × ${events.length}: ${events.map(e=>e.date+(e.overdue?' achterstallig':'')+(e.advance?` ${e.advance}d vervroegd`:'')).join(', ')}${checks.has(key(row.task,col))?' · afgevinkt (lesregistratie)':''}`:'';
  })]));
  const text='\uFEFF'+csvRows.map(row=>row.map(value=>{let s=String(value??'');if(/^\s*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}).join(';')).join('\r\n');
  const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'})),a=make('a');a.href=url;a.download=`${machine.config.asset}-weekchecklist-${year}.csv`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 $('print-checklist').addEventListener('click',()=>{if(!context)return;document.body.classList.add('printing-checklist');window.print();});window.addEventListener('afterprint',()=>document.body.classList.remove('printing-checklist'));
})();
