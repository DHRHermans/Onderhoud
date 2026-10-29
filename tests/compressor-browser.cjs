// Server: python3 -m http.server 8000 --bind 127.0.0.1 --directory /workspace
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs/promises');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const response=await page.goto('http://127.0.0.1:8000/Onderhoud/compressor.html');assert.equal(response.status(),200);
 const start=page.locator('#start-date');await start.fill('2026-01-05');await page.locator('#reset-history').click();
 await page.getByRole('heading',{name:'Preventief onderhoudsplan',exact:true}).waitFor();
 await page.getByRole('heading',{name:'Predictief onderhoudsplan',exact:true}).waitFor();
 await page.getByRole('heading',{name:'Correctief onderhoudsplan',exact:true}).waitFor();
 for(const model of ['LE2','LE3','LE5','LE7','LE10','LE15','LE20']){
  await page.locator('#model').selectOption(model);
  assert.ok(await page.locator('#inventory-body tr').count()>=10);
  for(const strategy of ['preventief','predictief','correctief'])assert.ok(await page.locator(`#plan-${strategy} tbody tr`).count()>0);
  const broken=await page.evaluate(()=>[...document.querySelectorAll('a.asset-link')].filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash));assert.deepEqual(broken,[]);
  assert.equal(await page.locator('#case-error').isVisible(),false);
 }
 await page.locator('#model').selectOption('LE10');
 await page.locator('#model-warnings').getByText('LE 10:',{exact:false}).waitFor();
 assert.ok((await page.locator('#plan-preventief').innerText()).includes('te bevestigen'));
 assert.ok(!(await page.locator('#schedule-body').innerText()).includes('LE10-P05'));
 await page.locator('#model').selectOption('LE5');await page.locator('#variant').selectOption('full');
 assert.ok((await page.locator('#inventory-body').innerText()).includes('Koeldroger'));
 assert.ok((await page.locator('#plan-preventief').innerText()).includes('LE5-P11'));
 assert.equal(await page.locator('#auto-drain').isDisabled(),true);
 await page.locator('#variant').selectOption('base');
 assert.ok(!(await page.locator('#inventory-body').innerText()).includes('Koeldroger'));
 assert.ok((await page.locator('#inventory-body').innerText()).includes('Pulsatiedemper'));
 await page.locator('#variant').selectOption('tank');
 await page.locator('#oil').selectOption('mineral');
 assert.ok((await page.locator('#plan-preventief').innerText()).includes('2.000 draaiuren óf 12 maanden'));
 await page.locator('#horizon').fill('1095');await page.locator('#hours-per-day').fill('24');await page.locator('#days-per-week').selectOption('7');await page.locator('#reset-history').click();
 const manyHours=await page.locator('#schedule-body tr').count();assert.ok(manyHours>0);
 await page.locator('#hours-per-day').fill('0');
 assert.ok((await page.locator('#simulation-metrics').innerText()).includes('0 uur'));
 assert.ok(await page.locator('#schedule-body tr').count()<manyHours);
 assert.ok((await page.locator('#schedule-body').innerText()).includes('kalender'));
 await page.locator('#hours-per-day').fill('8');await page.locator('#days-per-week').selectOption('5');await page.locator('#horizon').fill('365');
 await page.locator('#bundle-window').fill('0');const noBundle=await page.locator('#schedule-body tr').count();
 await page.locator('#bundle-window').fill('14');assert.ok(await page.locator('#schedule-body tr').count()<=noBundle);
 await page.getByRole('textbox',{name:'Laatste datum LE5-P03',exact:true}).fill('2025-01-01');
 assert.ok((await page.locator('#simulation-warnings').innerText()).includes('Achterstallige'));
 await page.locator('#hours-per-day').fill('25');assert.equal(await page.locator('#case-error').isVisible(),true);assert.equal(await page.locator('#simulation-output').isVisible(),false);
 await page.locator('#hours-per-day').fill('8');await page.locator('#reset-history').click();assert.equal(await page.locator('#case-error').isVisible(),false);
 await page.locator('#history-body input[type=date]').first().fill('2027-01-01');assert.equal(await page.locator('#case-error').isVisible(),true);await page.locator('#reset-history').click();
 // Downloads contain actual visible identities and plans, including all seven models.
 for(const [id,check]of [['export-inventory','C-LE5-001'],['export-plans','correctief'],['export-all','LE 20'],['export-schedule','Ingevoerde historiek']]){
  const pending=page.waitForEvent('download');await page.locator('#'+id).click();const download=await pending;const text=await fs.readFile(await download.path(),'utf8');assert.ok(text.includes(check),id);assert.ok(text.includes(';'),id);
 }
 // Invalid asset IDs cannot export or leave a seemingly valid simulation.
 await page.locator('#asset-id').fill('<invalid>');assert.equal(await page.locator('#case-error').isVisible(),true);await page.locator('#asset-id').fill('COMP-ATELIER-01');assert.equal(await page.locator('#case-error').isVisible(),false);
 assert.ok((await page.locator('#inventory-body').innerText()).includes('COMP-ATELIER-01-AF'));
 for(const width of [375,768,1440]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`);}
 await page.setViewportSize({width:1440,height:1100});await page.screenshot({path:'/tmp/compressor-desktop.png',fullPage:true});
 await page.locator('#simulator').scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/compressor-simulator.png'});
 await page.setViewportSize({width:375,height:812});await page.locator('#simulator').scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/compressor-mobile.png'});
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: 7 models, visible inventory + 3 plans, component links, LE10 open interval, options, calendar/hour simulation, bundling, overdue and invalid history, 4 CSV exports, 3 viewport widths, no browser errors.');
})().catch(error=>{console.error(error);process.exit(1);});
