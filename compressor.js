'use strict';
(() => {
 const $=id=>document.getElementById(id),data=window.CompressorData,planner=window.CompressorPlanner;
 const make=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;};
 const number=value=>new Intl.NumberFormat('nl-BE',{maximumFractionDigits:2}).format(value);
 const date=value=>value?new Intl.DateTimeFormat('nl-BE',{timeZone:'UTC',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(value+'T00:00:00Z')):'Niet bereikt binnen de berekening';
 const todayParts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Brussels',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const part=type=>todayParts.find(p=>p.type===type).value;
 $('start-date').value=`${part('year')}-${part('month')}-${part('day')}`;
 const history=new Map();let machine,result,lastInput,previousModel=$('model').value;
 const strategyName={preventief:'Preventief',predictief:'Predictief',correctief:'Correctief'};
 function intervalText(task){if(task.trigger)return task.trigger;if(!task.interval)return task.strategy==='correctief'?'Bij vastgesteld defect / melding':task.missing?'Open punt: te bevestigen':'Geen vast interval';const i=task.interval,parts=[];if(i.hours)parts.push(`${number(i.hours)} draaiuren`);if(i.months)parts.push(`${i.months} maanden`);if(i.days)parts.push(i.days===1?'dagelijks':`elke ${i.days} kalenderdagen`);return parts.join(' óf ') + (parts.length>1?' — wat eerst komt':'');}
 function refLink(asset){const a=make('a',asset,'asset-link');a.href=`#inv-${asset}`;return a;}
 function cell(row,text,cls){const td=make('td',text,cls);row.append(td);return td;}
 function showError(message){$('case-error').textContent=message;$('case-error').hidden=false;$('simulation-output').hidden=true;$('simulation-status').textContent='Geen geldige planning: corrigeer de invoer.';result=null;}
 function config(){return{variant:$('variant').value,oil:$('oil').value,silencer:$('silencer').checked,autoDrain:$('auto-drain').checked,asset:$('asset-id').value.trim(),location:$('location').value.trim()};}
 function renderMachine(){
  if(!$('machine-form').checkValidity()||!/^[-A-Za-z0-9_]{1,40}$/.test($('asset-id').value)||!$('location').value.trim()){showError('Controleer de machinevelden: een geldig asset-ID en een locatie zijn verplicht.');return;}
  machine=data.build($('model').value,config());
  $('model-facts').replaceChildren(...[machine.model.name,`${machine.inventory.length} inventarisobjecten`,`${machine.tasks.length} gekoppelde taken`,`Olie-inhoud §8.3: ${number(machine.model.oilLitres)} l`].map(t=>make('span',t)));
  const warnings=$('model-warnings');warnings.replaceChildren();
  if(!machine.model.filterHours)warnings.append(make('p','LE 10: de bron vermeldt geen vervangingsinterval voor het luchtfilter. De vervanging wordt niet automatisch ingepland. Laat de termijn bevestigen; de zesmaandelijkse inspectie blijft wel gelden.'));
  warnings.append(make('p','Open voor deze voorbeeldmachine: typeplaat, serienummers, echte servicehistoriek, actuele handleiding en drukvat-/componentdocumentatie. Bij stof en zware omstandigheden de termijnen door de serviceorganisatie laten beoordelen.'));
  if(machine.config.variant==='full')warnings.append(make('p','Full Feature: koeldrogercontroles zijn toegevoegd. De eigen droger- en DD/PD-filterdocumentatie is nodig om het operationele plan aan te vullen.'));
  renderInventory();renderPlans();renderHistory();calculate();
 }
 function renderInventory(){
  $('inventory-caption').textContent=`${machine.config.asset} · ${machine.model.name} · ${machine.config.location} · fictief inventarisvoorbeeld`;
  $('inventory-body').replaceChildren();
  for(const item of machine.inventory){const row=make('tr');row.id=`inv-${item.id}`;const id=cell(row);id.append(make('strong',item.id),make('small',item.parent?`Hoofdasset: ${item.parent}`:'Hoofdinstallatie'));cell(row,item.name);cell(row,item.energy);const notes=cell(row);notes.append(make('span',item.notes),make('small',`Serienummer: ${item.serial}. Verantwoordelijke: te registreren.`));$('inventory-body').append(row);}
 }
 function renderPlans(){
  const container=$('plan-tables');container.replaceChildren();
  const descriptions={preventief:'Bronintervallen met eerst-bereikte-grensregel. Open punten blijven zichtbaar en worden niet stilzwijgend ingevuld.',predictief:'Educatieve voorstellen voor meettrends. Frequenties zijn geen fabrikantvoorschrift. Een trend wordt pas predictief bruikbaar met gevalideerde referenties en een prognose.',correctief:'Storingsgestuurd: melden, risico beoordelen, oorzaak bevestigen, veilig herstellen, testen en vrijgeven. Geen automatische correctieve kalender.'};
  for(const strategy of ['preventief','predictief','correctief']){
   const section=make('section',undefined,'plan-table-block');section.id=`plan-${strategy}`;section.append(make('h3',`${strategyName[strategy]} onderhoudsplan`),make('p',descriptions[strategy],'plan-description'));
   const wrap=make('div',undefined,'table-wrap');wrap.tabIndex=0;wrap.role='region';wrap.setAttribute('aria-label',`${strategyName[strategy]} onderhoudsplan`);
   const table=make('table',undefined,'case-table'),thead=make('thead'),head=make('tr');['Taak / inventariskoppeling','Onderhoud en interval','Werkinhoud / reactie','Bron en status'].forEach(title=>{const th=make('th',title);th.scope='col';head.append(th);});thead.append(head);table.append(thead);const body=make('tbody');
   machine.tasks.filter(t=>t.strategy===strategy).forEach(task=>{const row=make('tr'),identity=cell(row);identity.append(make('strong',task.id,'task-id'),refLink(task.asset));const title=cell(row);title.append(make('strong',task.title),make('p',intervalText(task)));cell(row,task.detail);const source=cell(row);source.append(make('span',task.source),make('p',task.proposed?'Educatief voorstel':task.missing?'Bevestiging / documentatie nodig':strategy==='correctief'?'Storingsgestuurd':'Handleiding / expliciete planningskeuze',`source-badge${task.proposed?' proposed':''}`));body.append(row);});table.append(body);wrap.append(table);section.append(wrap);container.append(section);
  }
 }
 function renderHistory(){
  const body=$('history-body');body.replaceChildren();
  machine.tasks.filter(t=>t.interval).forEach(task=>{
   if(!history.has(task.id))history.set(task.id,{date:$('start-date').value,meter:Number($('meter').value)});
   const h=history.get(task.id),row=make('tr'),title=cell(row);title.append(make('strong',task.id,'task-id'),make('span',task.title));
   const dateInput=make('input');dateInput.type='date';dateInput.value=h.date;dateInput.required=true;dateInput.setAttribute('aria-label',`Laatste datum ${task.id}`);
   const meterInput=make('input');meterInput.type='number';meterInput.min='0';meterInput.max='10000000';meterInput.step='0.25';meterInput.required=true;meterInput.value=h.meter;meterInput.setAttribute('aria-label',`Laatste tellerstand ${task.id}`);
   dateInput.addEventListener('input',()=>{h.date=dateInput.value;calculate();});meterInput.addEventListener('input',()=>{h.meter=meterInput.value===''?NaN:Number(meterInput.value);calculate();});
   cell(row).append(dateInput);cell(row).append(meterInput);body.append(row);
  });
 }
 function input(){const days=Number($('days-per-week').value);return{start:$('start-date').value,hoursPerDay:Number($('hours-per-day').value),workdays:Array.from({length:days},(_,i)=>(i+1)%7),horizon:Number($('horizon').value),meter:Number($('meter').value),window:Number($('bundle-window').value),setupMinutes:Number($('setup-minutes').value),history:Object.fromEntries(history)};}
 function calculate(){
  if(!machine||!$('machine-form').checkValidity()){showError('Controleer eerst de machinegegevens.');return;}
  if(!$('simulation-form').checkValidity()){showError('Controleer de simulatievelden en hun toegestane waarden.');return;}
  try{
   lastInput=input();result=planner.compare(machine.tasks,lastInput);
   $('case-error').hidden=true;$('simulation-output').hidden=false;
   $('simulation-status').textContent=`Bijgewerkt: ${machine.model.name} · ${number(lastInput.hoursPerDay)} uur/dag · ${lastInput.workdays.length} productiedagen/week · ${date(lastInput.start)} t/m ${date(result.bundled.end)}. Historiek is invoer, geen bevestiging van uitgevoerd onderhoud.`;
   renderSimulation();
  }catch(error){showError(error.message);}
 }
 function renderSimulation(){
  const metrics=$('simulation-metrics');metrics.replaceChildren();
  const saved=result.savedVisits,minutes=saved*lastInput.setupMinutes;
  const items=[[`${number(result.bundled.hours)} uur`,'Gesimuleerde productie',`Eindteller ${number(result.bundled.meterEnd)} uur`],[`${result.baseline.visits.length} → ${result.bundled.visits.length}`,'Servicebezoeken: los → gebundeld','Routinecontroles niet als servicebezoek geteld'],[saved>=0?`${saved} minder`:`${-saved} meer`,'Bezoeken binnen deze periode','Vervroegen kan extra onderhoud veroorzaken'],[`${number(Math.abs(minutes))} min`,minutes>=0?'Minder vaste voorbereiding':'Meer vaste voorbereiding',`${number(lastInput.setupMinutes)} min/bezoek · aanname, geen totale stilstand`]];
  for(const [value,label,note]of items){const card=make('div',undefined,'metric');card.append(make('strong',value),make('span',label),make('small',note));metrics.append(card);}
  const warnings=$('simulation-warnings');warnings.replaceChildren();
  const overdue=result.bundled.visits.some(v=>v.jobs.some(j=>j.overdue))||result.bundled.routine.some(r=>r.overdue);
  if(overdue)warnings.append(make('p','Achterstallige taken op de startdatum: laat de inzetbaarheid eerst beoordelen. Een voorgesteld bezoek op de startdatum geeft geen toestemming om verder te draaien.','case-warning overdue'));
  warnings.append(make('p',`Uitgevoerde interventietaken in de simulatie: ${result.baselineJobs} zonder bundeling, ${result.bundledJobs} met bundeling. Vervroegde taken tellen als uitgevoerd op hun eerdere datum en verschuiven dus ook de volgende termijn. Onderdelen- en arbeidskosten worden niet berekend.`,'small'));
  const missing=machine.tasks.filter(t=>t.missing);if(missing.length)warnings.append(make('p',`${missing.length} open documentatie-/intervalpunt(en) staan buiten de automatische kalender: ${missing.map(t=>t.title).join('; ')}. Zie het preventieve plan.`,'case-warning'));
  $('schedule-intro').textContent=`${result.bundled.visits.length} servicebezoeken in ${lastInput.horizon} kalenderdagen. Urenlimieten worden vóór de dagproductie gepland. Elke taak behoudt hieronder haar eigen deadline. Kalenderdeadlines kunnen ook buiten productiedagen vallen.`;
  const body=$('schedule-body');body.replaceChildren();
  if(!result.bundled.visits.length){const row=make('tr'),td=cell(row,'Geen service-interventies binnen deze periode. Bekijk ook de routinecontroles en open punten.');td.colSpan=3;body.append(row);}
  for(const visit of result.bundled.visits){const row=make('tr'),when=cell(row);when.append(make('strong',date(visit.date)),make('small',`${number(visit.meter)} uur vóór productie`));const jobs=cell(row),deadlines=cell(row);
   visit.jobs.forEach(job=>{const item=make('div',undefined,'schedule-job');item.append(make('strong',job.task.id,'task-id'),make('span',job.task.title),make('br'),refLink(job.task.asset));jobs.append(item);
    const deadline=make('div',undefined,'schedule-job');deadline.append(make('strong',job.task.id,'task-id'),make('span',`${date(job.date)} · ${job.reason}`),make('small',job.limit===null?'Geen urengrens':`Urenlimiet: ${number(job.limit)} uur`));
    deadline.append(make('p',job.overdue?'Achterstallig op start — beoordeling nodig':job.advance?`${job.advance} dagen eerder meegenomen`:'Op tijd gepland',job.overdue?'overdue':job.advance?'advanced':'schedule-deadline'));deadlines.append(deadline);
   });jobs.append(make('small','Ook toepasselijke kortere controles meenemen; testfasen veilig scheiden.'));body.append(row);
  }
  const routine=$('routine-body');routine.replaceChildren();
  for(const task of machine.tasks.filter(t=>t.interval&&!t.outage)){const r=result.bundled.routine.find(r=>r.task.id===task.id),next=result.bundled.next.find(n=>n.id===task.id);const row=make('tr'),id=cell(row);id.append(make('strong',task.id,'task-id'),make('span',task.title),make('br'),refLink(task.asset));cell(row,`${strategyName[task.strategy]}${task.proposed?' · educatief voorstel':''} · ${r?r.count:0} keer`);const dates=cell(row);dates.append(make('span',r?`${date(r.first)} → ${date(r.last)}`:`Eerstvolgende vanaf de ingevoerde historiek: ${date(next.date)}`));if(r&&r.overdue)dates.append(make('p','Achterstallig bij start','overdue'));routine.append(row);}
 }
 function csv(rows){return '\uFEFF'+rows.map(row=>row.map(value=>{let text=String(value??'');if(/^[\s]*[=+@-]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';}).join(';')).join('\r\n');}
 function download(name,rows){const blob=new Blob([csv(rows)],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=make('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 const inventoryRows=m=>m.inventory.map(i=>[m.model.name,i.id,i.parent,i.name,i.location,i.serial,'Te registreren',i.energy,i.notes]);
 const taskRows=m=>m.tasks.map(t=>[m.model.name,t.id,t.strategy,t.asset,t.title,intervalText(t),t.source,t.detail,t.proposed?'Educatief voorstel':t.missing?'Open punt':'Bron / zie detail','LO TO TO, werkvergunning en machineprocedure verifiëren']);
 const inventoryHeader=['Type','Component-ID','Hoofdasset','Object','Locatie','Serienummer','Verantwoordelijke','Energiebronnen','Opmerking'];
 const taskHeader=['Type','Taak-ID','Strategie','Component-ID','Taak','Interval / aanleiding','Bron','Werkinhoud / reactie','Status','Veiligstelling'];
 function exportReady(){if(!$('machine-form').checkValidity()){$('machine-form').reportValidity();return false;}return Boolean(machine);}
 $('export-inventory').addEventListener('click',()=>{if(exportReady())download(`${machine.config.asset}-inventaris.csv`,[inventoryHeader,...inventoryRows(machine)]);});
 $('export-plans').addEventListener('click',()=>{if(exportReady())download(`${machine.config.asset}-onderhoudsplannen.csv`,[taskHeader,...taskRows(machine)]);});
 $('export-all').addEventListener('click',()=>{
  if(!exportReady())return;
  const rows=[['Record','Type','ID','Hoofdasset / component','Naam / taak','Locatie / strategie','Serienummer / interval','Verantwoordelijke / bron','Energie / werkinhoud','Opmerking / status']];
  for(const model of data.models){const m=data.build(model.id,{...config(),asset:`C-${model.id}-001`});m.inventory.forEach(i=>rows.push(['Inventaris',m.model.name,i.id,i.parent,i.name,i.location,i.serial,'Te registreren',i.energy,i.notes]));m.tasks.forEach(t=>rows.push(['Onderhoud',m.model.name,t.id,t.asset,t.title,t.strategy,intervalText(t),t.source,t.detail,t.proposed?'Educatief voorstel':t.missing?'Open punt':'Bron / zie detail']));}
  download('atlas-copco-alle-7-types-inventaris-en-plannen.csv',rows);
 });
 $('export-schedule').addEventListener('click',()=>{
  if(!result||!exportReady())return;
  const rows=[['Record','Datum / eerste datum','Teller / herhalingen','Asset','Taak-ID','Taak','Uiterste datum / laatste datum','Dagen vervroegd','Grens / status','Instellingen / bron']];
  rows.push(['Scenario',lastInput.start,lastInput.meter,machine.config.asset,'','Educatieve simulatie',result.bundled.end,'','Geen bevestiging van uitgevoerd werk',`${lastInput.hoursPerDay} uur/dag; ${lastInput.workdays.length} dagen/week; ${lastInput.horizon} kalenderdagen; ${lastInput.window} dagen bundeling; ${lastInput.setupMinutes} min voorbereiding/bezoek`]);
  for(const task of machine.tasks.filter(t=>t.interval)){const h=lastInput.history[task.id];rows.push(['Ingevoerde historiek',h.date,h.meter,task.asset,task.id,task.title,'','','Invoer: te verifiëren',task.source]);}
  result.bundled.visits.forEach(v=>v.jobs.forEach(j=>rows.push(['Servicebezoek',v.date,v.meter,j.task.asset,j.task.id,j.task.title,j.date,j.advance,j.overdue?'Achterstallig':j.reason,j.task.source])));
  result.bundled.routine.forEach(r=>rows.push(['Controlelijst',r.first,r.count,r.task.asset,r.task.id,r.task.title,r.last,'',r.overdue?'Achterstallig bij start':'Herhaalde kalendercontrole',r.task.source]));
  machine.tasks.filter(t=>t.missing).forEach(t=>rows.push(['Open punt','','',t.asset,t.id,t.title,'','','Niet ingepland',t.detail]));
  rows.push(['Werkordercheck','','',machine.config.asset,'','Identiteit, risicoanalyse, LO TO TO, kortere controles, uitvoering, testfase, vrijgave en historiek registreren','','','','Elke service vraagt eigen bevoegde beoordeling']);
  download(`${machine.config.asset}-simulatie.csv`,rows);
 });
 $('print-case').addEventListener('click',()=>{document.querySelectorAll('.compressor-main details:not(.history-details)').forEach(d=>d.open=true);window.print();});
 $('reset-history').addEventListener('click',()=>{if(!$('simulation-form').checkValidity()){$('simulation-form').reportValidity();return;}for(const task of machine.tasks.filter(t=>t.interval))history.set(task.id,{date:$('start-date').value,meter:Number($('meter').value)});renderHistory();calculate();});
 $('machine-form').addEventListener('submit',event=>event.preventDefault());$('simulation-form').addEventListener('submit',event=>event.preventDefault());
 $('machine-form').addEventListener('input',event=>{
  if(event.target.id==='model'){if($('asset-id').value===`C-${previousModel}-001`)$('asset-id').value=`C-${$('model').value}-001`;previousModel=$('model').value;}
  const full=$('variant').value==='full',base=$('variant').value==='base';$('auto-drain').disabled=full||base;if(full)$('auto-drain').checked=true;if(base)$('auto-drain').checked=false;
  renderMachine();
 });
 $('simulation-form').addEventListener('input',calculate);renderMachine();
})();
