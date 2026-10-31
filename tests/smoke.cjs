const {chromium}=require('playwright');
const fs=require('fs'),http=require('http'),path=require('path'),assert=require('node:assert/strict');
const server=http.createServer((req,res)=>{const pathname=decodeURIComponent(req.url.split('?')[0]);const p=path.resolve(process.cwd(),'.'+(pathname==='/'?'/index.html':pathname));if(!p.startsWith(process.cwd()+path.sep)){res.writeHead(403);return res.end()}fs.readFile(p,(err,data)=>{if(err){res.writeHead(404);return res.end()}res.setHeader('Content-Type',p.endsWith('.js')?'application/javascript':p.endsWith('.webmanifest')?'application/manifest+json':'text/html');res.end(data)})});
(async()=>{
 await new Promise(r=>server.listen(0,r));
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
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
  await page.locator('input[type=checkbox]').first().check();
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
  console.log('PASS: 393x852 mobile touch, exercise details, workout completion, body weight and persistence');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
