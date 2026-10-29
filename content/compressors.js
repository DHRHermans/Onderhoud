/* In eigen woorden verwerkt uit de aangeleverde handleiding, §§2, 5–9.
   Zie docs/compressor-bronnen.md voor bronplaatsen en onzekerheden. */
(function(root){
 const models=[
  {id:'LE2',name:'LE 2',filterHours:800,valveHours:4000,oilLitres:0.8},
  {id:'LE3',name:'LE 3',filterHours:800,valveHours:4000,oilLitres:0.8},
  {id:'LE5',name:'LE 5',filterHours:600,valveHours:4000,oilLitres:0.8},
  {id:'LE7',name:'LE 7',filterHours:600,valveHours:5000,oilLitres:1.4},
  {id:'LE10',name:'LE 10',filterHours:null,valveHours:5000,oilLitres:1.4},
  {id:'LE15',name:'LE 15',filterHours:500,valveHours:4000,oilLitres:5.4},
  {id:'LE20',name:'LE 20',filterHours:500,valveHours:4000,oilLitres:5.4}
 ];
 function build(modelId,config={}){
  const model=models.find(m=>m.id===modelId); if(!model)throw Error('Onbekend compressortype');
  const c={variant:'tank',oil:'piston',silencer:true,autoDrain:false,asset:`C-${model.id}-001`,location:'Didactisch atelier (voorbeeld)',...config};
  if(c.variant==='full')c.autoDrain=true;
  if(!['tank','base','full'].includes(c.variant)||!['piston','mineral'].includes(c.oil))throw Error('Onbekende uitvoering of olie');
  const parent=c.asset,inventory=[],tasks=[];
  function part(code,name,energy,notes){const id=code?`${parent}-${code}`:parent;inventory.push({id,parent:code?parent:'',name,model:model.name,location:c.location,serial:'Te registreren op typeplaat',energy,notes});return id;}
  part('',`Atlas Copco ${model.name} · elektrische ${c.variant==='base'?'frame-uitvoering':c.variant==='full'?'tankuitvoering met koeldroger':'tankuitvoering'}`,'Elektrisch · pneumatisch · mechanisch · thermisch',`Fictief asset. Olie-inhoud volgens §8.3: ${model.oilLitres} l; geen navuladvies. Druk en tankvolume: typeplaat controleren.`);
  const oil=part('OL','Oliesysteem en kijkglas','Thermisch',`Gekozen olie: ${c.oil==='piston'?'Piston Fluid':'minerale olie'}. Oliesoort eerst controleren.`);
  const filter=part('AF','Luchtinlaatfilter','Aanzuiging · bewegende delen','Bij stof vaker inspecteren; heavy-duty-filter volgens fabrikant.');
  const valve=part('VD','Inlaat- en uitlaatklepschijven','Druk · thermisch','Onderdelen en pakkingen selecteren uit de juiste onderdelenlijst.');
  const check=part('CVUA','Terugslagklep of ontlastventiel','Pneumatisch', 'Werkelijk gemonteerde variant identificeren.');
  const motor=part('M','Elektrische motor en schakelinrichting','Elektrisch · mechanisch','Spanning, beveiligingen en serienummer te registreren.');
  const safety=part('SV','Veiligheidsventiel','Pneumatisch','Kritieke veiligheidsfunctie; niet bijstellen. Test alleen door bevoegde personen.');
  const control=part('MDR','Drukregeling en manometer','Elektrisch · pneumatisch','Instellingen en grenzen volgens typeplaat en bevoegde procedure.');
  const cooling=part('COOL','Ventilator en koelleidingen','Mechanisch · thermisch','Afschermingen en warme oppervlakken opnemen in risicoanalyse.');
  const receiver=part(c.variant==='base'?'PD':'AR',c.variant==='base'?'Pulsatiedemper / drukhoudend gedeelte':'Persluchtvat','Pneumatisch',c.variant==='base'?'Werkelijk aanwezige drukhoudende delen inventariseren.':'Vatnummer, inhoud, keuringsdocumenten en wettelijke inspectietermijn invullen.');
  let dryer=null,auto=null;
  if(c.silencer)part('US','Afblaasgeluiddemper','Pneumatisch','Alleen opnemen als werkelijk aanwezig.');
  if(c.autoDrain&&c.variant!=='base')auto=part('AD','Automatische condensafvoer','Pneumatisch','Automatische werking vervangt de voorgeschreven controle niet.');
  if(c.variant==='full')dryer=part('DR','Koeldroger met condensafvoer en DD/PD-filters','Elektrisch · druk · koude','Extra componenthandleidingen en filterintervallen nog controleren; deze PDF geeft geen compleet DD/PD-vervangingsplan.');
  function task(id,strategy,component,title,interval,source,detail,extra={}){tasks.push({id:`${model.id}-${id}`,strategy,asset:component,title,interval,source,detail,outage:false,bundle:false,...extra});}
  task('P01','preventief',receiver,'Condensaat afvoeren / afvoer controleren',{days:1},'§5.2, p.56; §9, p.71','Dagelijks. Ook bij stilstand kan condensaat aanwezig zijn; geen automatisch uitstel tot een werkdag. Veilige afvoermethode volgens procedure.');
  task('P02','preventief',oil,'Oliepeil controleren',{days:7},'§5.2, p.56','Wekelijks; peil volgens kijkglas en voorschrift beoordelen. Niet blind bijvullen.');
  task('P03','preventief',safety,'Veiligheidsventiel laten testen',{months:6},'§5.2, p.56; §6.7, p.65–66','Door bevoegde personen met een afzonderlijke goedgekeurde testprocedure. Niet uitstellen bij vermoeden van defect.',{outage:true,bundle:false});
  task('P04','preventief',filter,'Luchtfilter inspecteren',{months:6},'§5.2, p.56–57','Normale schone omgeving; bij stof vaker. Bevestig lokaal de verkorte termijnen.',{outage:true,bundle:true});
  task('P05','preventief',filter,'Luchtfilter vervangen',model.filterHours?{hours:model.filterHours,months:12}:null,'§5.2, p.56',model.filterHours?'Eerst bereikte grens geldt. Een beschadigd/verstopt element vraagt eerder actie.':'LE 10 ontbreekt in de drie vervangingsregels van de aangeleverde tabel. Geen uren- of jaartermijn afleiden van een ander type; laat Atlas Copco het interval bevestigen.',{outage:true,bundle:true,missing:!model.filterHours});
  if(c.silencer)task('P06','preventief',`${parent}-US`,'Afblaasgeluiddemper vervangen',{hours:2000,months:12},'§5.2, p.56','Alleen indien gemonteerd.',{outage:true,bundle:true});
  task('P07','preventief',oil,'Compressorolie verversen',c.oil==='piston'?{hours:3000,months:24}:{hours:2000,months:12},'§5.2–5.3, p.56–58','Eerst bereikte grens geldt. Werkelijke oliesoort en lokale serviceafspraken verifiëren.',{outage:true,bundle:true});
  task('P08','preventief',check,'Terugslagklep of ontlastventiel vervangen',{hours:3000},'§5.2, p.56; §6.1, p.59','Fabrikant geeft 3.000–4.000 uur. Simulator plant conservatief op 3.000 uur; een afwijking vraagt bevestiging van de bevoegde serviceorganisatie.',{outage:true,bundle:true});
  task('P09','preventief',valve,'Klepschijven vervangen',{hours:model.valveHours},'§5.2, p.56; §6.2, p.59–61','Bij langere service ook de kortere controles meenemen. Verstoorde pakkingen/O-ringen volgens voorschrift vervangen.',{outage:true,bundle:true});
  if(auto)task('P10','preventief',auto,'Automatische condensafvoer op werking controleren',{days:7},'§9, p.71','Wekelijkse functieverificatie volgens veilige procedure.');
  if(dryer){
   task('P11','preventief',dryer,'Filter van condensafvoer koeldroger inspecteren en reinigen',{days:1},'§5.2 Full Feature, p.57','Dagelijks; geldt voor de koeldroger. Controleer ook of condensaat wordt afgevoerd.');
   task('P12','preventief',dryer,'Lamellen van de condensor reinigen',{days:7},'§5.2 Full Feature, p.57','Wekelijks volgens goedgekeurde reinigings- en veiligstelprocedure.');
  }
  if(c.variant!=='base'){
   task('P13','preventief',receiver,'Jaarlijkse wanddiktecontrole luchtvat laten uitvoeren',{months:12},'Pictogram §3.6, p.51; §9, p.71','Het fabrikantlabel vraagt jaarlijkse wanddiktecontrole door een bevoegde instantie, met registratie. Methode en inzetbaarheid laten beoordelen; dit is niet automatisch de wettelijke keuringsdatum.',{outage:true,bundle:false});
   task('P16','preventief',receiver,'Lokale drukvatkeuring en vatdocumentatie vastleggen',null,'§9, p.71','De plaatselijk verplichte keuringen, termijnen en vatgrenzen moeten door de bevoegde instantie worden bevestigd. Aanvullend op de ingeplande jaarlijkse fabrikantcontrole.',{missing:true});
  }
  task('P14','preventief',oil,'Oliepeil controleren vóór iedere start',null,'§4.2, p.52–53','Deze startcontrole is aanvullend op de wekelijkse controle. Volg de startprocedure; aantal starts wordt niet door de draaiurensimulator afgeleid.',{trigger:'Vóór iedere start · niet als kalenderherhaling berekend'});
  task('P15','preventief',parent,'Heringebruikname na langdurige stilstand beoordelen',null,'§4.1, p.52; §6.7, p.65','Na meer dan zes maanden niet draaien vraagt de bron extra aandacht voor smering en heringebruikname; het veiligheidsventiel heeft aanvullende testvoorwaarden na langdurig niet-gebruik. Laat de bevoegde serviceorganisatie dit beoordelen. De simulator kent geen echte stilstandhistoriek.',{trigger:'Bij herstart na meer dan 6 maanden stilstand / niet-gebruik'});
  task('D01','predictief',control,'Trend van vultijd, druk en starts volgen',{days:7},'Educatief voorstel; signalen uit §7, p.67–68','Meet steeds bij vergelijkbare afname en omstandigheden. Leg de referentie vast. Bij een onverklaarde verslechtering: valideer meting en laat diagnose uitvoeren. Geen fabrikantgrenswaarde of levensduurprognose.',{proposed:true});
  task('D02','predictief',oil,'Trend van olieverbruik en bijvulling volgen',{days:7},'Educatief voorstel; §7, p.67','Registreer bijvulvolume, draaiuren en omstandigheden; vergelijk verbruik per draaiuur met een gevalideerde referentie. Afwijking laten beoordelen.',{proposed:true});
  task('D03','predictief',motor,'Trilling, geluid en temperatuurtrend beoordelen',{days:30},'Educatief voorstel; geen interval in deze PDF','Geschikte veilige meetmethode door opgeleide personen. Eerst referentie en alarmcriteria valideren; sensoren mogen geen afschermingen of veiligstelling omzeilen.',{proposed:true});
  if(dryer)task('D04','predictief',dryer,'Dauwpunt en afvoertrend beoordelen',{days:7},'Educatief voorstel; §2 en §5.2','Vergelijk met gevalideerde specificaties van de koeldroger en procesbehoefte; geen numerieke alarmgrenzen uitvinden.',{proposed:true});
  task('C01','correctief',filter,'Onvoldoende druk / vervuild filter',null,'§7, p.67','Melding registreren en oorzaak laten bevestigen; mogelijke lekkage, te grote afname, verstopt filter of klepdefect onderscheiden. Na veiligstellen defect herstellen en drukopbouw controleren.');
  task('C02','correctief',check,'Drukverlies of foutieve ontlasting',null,'§7, p.67–68','Diagnose van lekkage, terugslagklep en ontlasting door bevoegde technicus. Drukloos en geïsoleerd herstellen; gecontroleerde functietest en vrijgave.');
  task('C03','correctief',safety,'Overdruk of veiligheidsventiel spreekt aan',null,'§6.7; §7, p.65–68','Stop veilig en neem de installatie buiten gebruik voor beoordeling. Niet wachten op een bundelmoment, beveiliging niet overbruggen en ventiel niet bijstellen. Bevoegde diagnose en vrijgave noodzakelijk.',{urgent:true});
  task('C04','correctief',motor,'Niet starten of herhaalde overbelasting',null,'§7, p.67–68','Laat elektrische voeding, aandrijving en ontlasting onderzoeken. Niet herhaald resetten of beveiligingen overbruggen. Na herstel veilige test en vrijgave.');
  task('C05','correctief',valve,'Defecte klep of abnormaal olieverbruik',null,'§6.2, p.59; §7, p.67','Defecte klep onmiddellijk laten vervangen; olieverbruik kan ook op peil of zuigerveren wijzen. Eerst diagnose; geen blinde onderdelenwissel.');
  task('C06','correctief',receiver,'Verdachte corrosie, lekkage of vatschade',null,'§9, p.71','Buiten gebruik en bevoegde beoordeling; geen lassen, boren of eigen reparatie aan het drukvat. Documenteer de bevinding en vrijgave.',{urgent:true});
  if(dryer)task('C07','correctief',dryer,'Droger werkt niet of voert geen condensaat af',null,'§5.2 en componenthandleiding','Beoordeel de afvoer en droger volgens hun eigen handleiding. Koelmiddelcircuit uitsluitend door bevoegde specialist.');
  return {model,config:c,inventory,tasks};
 }
 const api={models,build}; if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CompressorData=api;
})(globalThis);
