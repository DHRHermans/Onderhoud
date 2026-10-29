// Run a server from /workspace, then: node tests/browser.cjs
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const page = await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const response=await page.goto('http://127.0.0.1:8000/Onderhoud/');assert.equal(response.status(),200);
 assert.equal(await page.locator('.strategy-card').count(),3);
 await page.getByRole('tab',{name:'Predictief',exact:true}).click();
 await page.getByRole('tabpanel').getByText('Meten is het begin.',{exact:false}).waitFor();
 await page.getByRole('tab',{name:'Predictief',exact:true}).press('ArrowRight');
 assert.equal(await page.getByRole('tab',{name:'Correctief',exact:true}).getAttribute('aria-selected'),'true');
 const answers=[0,1,2,1,2];
 for(let i=0;i<5;i++){
   await page.locator('.quiz-options button').nth(answers[i]).click();
   await page.getByText('Dat klopt.',{exact:true}).waitFor();
   assert.equal(await page.locator('.quiz-options button:disabled').count(),3);
   await page.locator('.feedback button').click();
 }
 await page.getByRole('heading',{name:'5 van de 5 goed.'}).waitFor();
 assert.equal(await page.locator('#quiz-card details').count(),5);
 await page.locator('#restart').click();
 await page.locator('.quiz-options button').nth(2).click();
 await page.getByText('Een leermoment.',{exact:true}).waitFor();
 assert.equal(await page.locator('.quiz-options .correct').count(),1);
 assert.equal(await page.locator('.quiz-options .incorrect').count(),1);
 await page.locator('#restart').click();
 for(const width of [375,768,1440]){
  await page.setViewportSize({width,height:900});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),`overflow at ${width}`);
 }
 const missingAnchors=await page.evaluate(()=>[...document.querySelectorAll('a[href^="#"]')].filter(a=>a.hash&&!document.getElementById(a.hash.slice(1))).map(a=>a.hash));assert.deepEqual(missingAnchors,[]);
 await page.setViewportSize({width:1440,height:1000});await page.goto('http://127.0.0.1:8000/Onderhoud/');
 await page.screenshot({path:'/tmp/onderhoud-desktop.png',fullPage:true});
 await page.setViewportSize({width:375,height:812});await page.screenshot({path:'/tmp/onderhoud-mobile.png',fullPage:true});
 const noJs=await browser.newPage({javaScriptEnabled:false});await noJs.goto('http://127.0.0.1:8000/Onderhoud/');await noJs.getByRole('heading',{name:'Kies met een reden.'}).waitFor();
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: project path, 3 lesson tabs + keyboard, 5 correct quiz answers, wrong answer feedback, result review, restart, 3 viewport widths, internal anchors, no-JS fallback, no browser errors.');
})().catch(error=>{console.error(error);process.exit(1);});
