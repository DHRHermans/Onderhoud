const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs/promises');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8000/Onderhoud/compressor.html');
 await page.locator('#start-date').fill('2026-01-05');await page.locator('#reset-history').click();
 const matrix=page.locator('#checklist-table');await matrix.waitFor();
 assert.equal(await matrix.locator('thead tr').count(),3);
 assert.equal(await matrix.locator('.matrix-week').count(),53); // 2026 ISO week 53 exists.
 assert.ok((await matrix.locator('.matrix-week').allTextContents()).includes('53'));
 assert.ok((await page.locator('#checklist-caption').innerText()).includes('40 uur/week'));
 assert.ok((await matrix.innerText()).includes('Luchtfilter vervangen'));
 assert.ok(!(await matrix.innerText()).includes('Riemspanning'));
 // The 600-hour LE5 replacement appears in week 16, as in the precise schedule.
 const filterRow=matrix.locator('tbody tr').filter({hasText:'LE5-P05'});
 assert.ok((await filterRow.locator('.matrix-check').first().getAttribute('title')).includes('2026-04-17'));
 const box=matrix.locator('input[type=checkbox]').first();await box.check();assert.equal(await box.isChecked(),true);
 await page.locator('#checklist-status').getByText('1 taak-weekvakjes',{exact:false}).waitFor();
 const downloadPending=page.waitForEvent('download');await page.locator('#export-checklist').click();const download=await downloadPending;
 const csv=await fs.readFile(await download.path(),'utf8');assert.ok(csv.includes('afgevinkt (lesregistratie)'));assert.ok(csv.includes('2026-04-17'));assert.ok(csv.includes('W53'));
 await page.locator('#hours-per-day').fill('16');assert.equal(await matrix.locator('input:checked').count(),0);
 assert.ok((await page.locator('#checklist-caption').innerText()).includes('80 uur/week'));
 await page.locator('#checklist-strategy').selectOption('predictief');assert.ok((await matrix.innerText()).includes('LE5-D01'));assert.ok(!(await matrix.innerText()).includes('LE5-P01'));
 await page.locator('#checklist-strategy').selectOption('correctief');assert.equal(await matrix.locator('input[type=checkbox]').count(),0);assert.ok((await matrix.innerText()).includes('Op melding'));
 await page.locator('#checklist-strategy').selectOption('preventief');await page.locator('#model').selectOption('LE10');const unknown=matrix.locator('tbody tr').filter({hasText:'LE10-P05'});assert.ok((await unknown.innerText()).includes('Te bevestigen'));assert.equal(await unknown.locator('input').count(),0);
 await page.locator('#model').selectOption('LE5');await page.locator('#horizon').fill('730');await page.locator('#checklist-year').selectOption('2027');assert.equal(await matrix.locator('.matrix-week').count(),53); // partial ISO week 53 from 2026, then 1–52.
 await page.locator('#horizon').fill('365');await page.locator('#checklist-year').selectOption('2026');
 await page.locator('#hours-per-day').fill('25');assert.equal(await page.locator('#checklist-content').isVisible(),false);assert.equal(await page.locator('#checklist-unavailable').isVisible(),true);await page.locator('#hours-per-day').fill('8');
 await page.locator('#compact-checklist').scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/checklist-desktop.png'});
 await page.setViewportSize({width:375,height:812});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.locator('#compact-checklist').scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/checklist-mobile.png'});
 // Exercise the actual print control; intercept only the native dialog.
 await page.evaluate(()=>{window.print=()=>window.__printed=true;});await page.locator('#print-checklist').click();assert.equal(await page.evaluate(()=>window.__printed),true);
 await page.emulateMedia({media:'print'});assert.equal(await page.locator('#machine').isVisible(),false);assert.equal(await matrix.isVisible(),true);
 await page.pdf({path:'/tmp/compressor-weekchecklist.pdf',preferCSSPageSize:true,printBackground:true});
 await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('printing-checklist')),false);
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: month/week matrix, ISO week 53 and year boundaries, simulation-linked task dates, checkboxes and reset, CSV with checks, all plan filters, LE10 open task, invalid-input protection, mobile layout and printable PDF.');
})().catch(e=>{console.error(e);process.exit(1);});
