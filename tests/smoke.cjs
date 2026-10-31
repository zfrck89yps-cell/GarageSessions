const {chromium,webkit}=require('playwright');
const fs=require('fs'),http=require('http'),path=require('path'),assert=require('node:assert/strict');
const server=http.createServer((req,res)=>{const pathname=decodeURIComponent(req.url.split('?')[0]);const p=path.resolve(process.cwd(),'.'+(pathname==='/'?'/index.html':pathname));if(!p.startsWith(process.cwd()+path.sep)){res.writeHead(403);return res.end()}fs.readFile(p,(err,data)=>{if(err){res.writeHead(404);return res.end()}res.setHeader('Content-Type',p.endsWith('.js')?'application/javascript':p.endsWith('.svg')?'image/svg+xml':p.endsWith('.webmanifest')?'application/manifest+json':'text/html');res.end(data)})});
(async()=>{
 await new Promise(r=>server.listen(0,r));
 const browserType=process.env.GS_BROWSER==='webkit'?webkit:chromium;
 const browser=await browserType.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
  await page.addInitScript(()=>{
   window.__restToneEnds=0;
   for(const C of new Set([window.AudioContext,window.webkitAudioContext].filter(Boolean))){
    const original=C.prototype.createOscillator;
    C.prototype.createOscillator=function(...args){const o=original.apply(this,args);o.addEventListener('ended',()=>window.__restToneEnds++);return o};
   }
  });
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.waitForFunction(()=>typeof resolveExerciseDetails==='function'&&document.querySelector('#app').children.length>0);
  assert.equal(errors.length,0,errors.join('\n'));
  // Seed a clean fixture: a fresh installation intentionally has no saved plans.
  await page.evaluate(()=>{db.plans.push({id:'smoke-test',name:'Smoke test',type:'strength',ex:[['squat',8,12],['flatpress',8,12],['row',8,12]]});save();render()});
  await page.getByRole('button',{name:'START WORKOUT',exact:true}).click();
  await page.getByRole('button',{name:'START SESSION',exact:true}).click();
  await page.getByRole('button',{name:'Exercise instructions'}).first().click();
  await page.getByRole('heading',{name:'How to perform',exact:true}).waitFor();
  await page.getByRole('heading',{name:'Form guidance',exact:true}).waitFor();
  assert.ok(await page.locator('#modalbody svg').count());
  assert.equal(await page.locator('#modalbody').evaluate(e=>e.scrollWidth<=e.clientWidth+1),true,'Details overflow mobile width');
  await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.evaluate(()=>showInfo('bike'));
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('#modalbody img')).every(i=>i.complete&&i.naturalWidth>0));
  assert.equal(await page.locator('#modalbody').evaluate(e=>e.scrollWidth<=e.clientWidth+1),true,'Added illustrations overflow mobile width');
  await page.getByText('Sources for added content',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.evaluate(()=>showInfo('staple35'));
  assert.equal(await page.locator('#modalbody h3').filter({hasText:'How to perform'}).count(),1);
  assert.ok(await page.locator('#modalbody ol li').count()>=3,'Added neck instructions missing');
  await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.locator('input[type=checkbox]').first().check();
  const rest=page.locator('[data-rest-key="ex-0"]');
  assert.match(await rest.textContent(),/REST 60s/,'Done must start the visible exercise timer');
  await page.waitForFunction(()=>gsRestAudio?.state==='running');
  await page.evaluate(()=>render());
  assert.match(await rest.textContent(),/REST \d+s/,'Rerender must preserve countdown');
  // Use a short real countdown so Web Audio, rather than a mocked clock, runs.
  await rest.evaluate(b=>b.setAttribute('onclick','gsStartRest(this,0.15)'));
  await rest.click();
  await page.waitForFunction(()=>window.__restToneEnds===3);
  assert.equal(await rest.textContent(),'DONE · RESTART');
  await page.getByRole('button',{name:'END & SAVE',exact:true}).click();
  await page.waitForFunction(()=>db.sessions.length===1&&!db.draft);
  await page.getByRole('button',{name:'Progress',exact:true}).click();
  await page.locator('#bweight').fill('105.9');
  await page.getByRole('button',{name:'LOG WEIGHT',exact:true}).click();
  assert.equal(await page.evaluate(()=>db.body.at(-1).kg),105.9);
  await page.reload();await page.waitForFunction(()=>typeof resolveExerciseDetails==='function');
  assert.equal(await page.evaluate(()=>db.sessions.length),1);
  assert.equal(await page.evaluate(()=>db.body.at(-1).kg),105.9);
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('PASS: '+browserType.name()+' 393x852 touch, Done auto-rest, gesture-unlocked real audio completion, exercise details, workout completion and persistence');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
