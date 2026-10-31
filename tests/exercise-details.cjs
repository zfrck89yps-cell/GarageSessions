const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('index.html','utf8');
const dom=new JSDOM(html,{url:'https://garage.test/',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,ctx=dom.getInternalVMContext();
w.structuredClone=structuredClone;
w.HTMLDialogElement.prototype.showModal=function(){this.open=true};
w.HTMLDialogElement.prototype.close=function(){this.open=false};
const before=()=>JSON.stringify([...Array(w.localStorage.length)].map((_,i)=>{const k=w.localStorage.key(i);return [k,w.localStorage.getItem(k)]}));
for(const m of html.matchAll(/<script(?: src="([^"]+)")?>([\s\S]*?)<\/script>/g)){
 const code=m[1]?fs.readFileSync(m[1],'utf8'):m[2];
 vm.runInContext(code,ctx,{filename:m[1]||'index.html'});
}
const evaluate=x=>vm.runInContext(x,ctx);
assert.deepEqual(Array.from(evaluate(`detailLines('first\\nsecond\\\\nthird')`)),['first','second','third']);
const baseline=before(),rows=[];
for(const id of evaluate('Object.keys(names)')){
 const d=evaluate(`resolveExerciseDetails(${JSON.stringify(id)})`);
 const base=evaluate(`resolveBaseExerciseDetails(${JSON.stringify(id)})`);
 // Fill-only means existing text and images win byte-for-byte, not merely that
 // their replacements happen to contain similar words.
 for(const key of Object.keys(base)){
  const value=base[key];
  if(Array.isArray(value)&&value.length||typeof value==='string'&&value||typeof value==='boolean'){
   assert.equal(JSON.stringify(d[key]),JSON.stringify(value),id+' overwrote '+key);
  }
 }
 assert.equal(JSON.stringify(d.tips),JSON.stringify(base.tips),id+' modified tips');
 assert.ok(d.steps.length,id+' missing written instructions');
 assert.ok(d.form.length,id+' missing form guidance');
 assert.ok(d.images.length,id+' missing demonstration pictures');
 if(d.addedSources)assert.ok(d.addedSources.every(s=>s.url.startsWith('https://')),id+' invalid source');
 w.showInfo(id);
 const body=w.document.querySelector('#modalbody');
 assert.equal(body.querySelectorAll('h2').length,1,id+' duplicate rendering');
 assert.equal(body.querySelector('h2').textContent,d.name);
 assert.ok(body.querySelector('a[href^="https://www.youtube.com/results"]'),id+' video missing');
 assert.ok([...body.querySelectorAll('h3')].some(x=>x.textContent==='Form guidance'));
 assert.ok([...body.querySelectorAll('h3')].some(x=>x.textContent==='Tips'));
 assert.ok(!body.textContent.includes('Set up with stable equipment and a manageable load.'),id+' generic fallback');
 rows.push(JSON.parse(JSON.stringify({...d,mapHighlighted:!!body.querySelector('svg path[fill="#c6ff00"]')})));
}
assert.equal(before(),baseline,'Opening details must not modify stored workouts');
evaluate(`db.plans.push({id:'details-test',name:'Details regression',type:'strength',ex:[['squat',8,12],['flatpress',8,12],['row',8,12]]});start('details-test');db.draft.notes='Preserve this session';db.draft.exercises[0].sets[0]={kg:12,reps:10,done:true};save()`);
const activeSession=before();
w.showInfo('squat');w.showInfo('flatpress');
assert.equal(before(),activeSession,'Details must preserve active sets, notes and profile data');
assert.ok(evaluate(`['deadbug','pallof','bandrow'].every(id=>exerciseCatalog.some(e=>e[0]===id))`));
assert.deepEqual(Array.from(evaluate(`resolveExerciseDetails('calfraise').main`)),['calves']);
w.showInfo('squat');assert.ok(w.document.body.textContent.includes('Breathing'));assert.ok(w.document.body.textContent.includes('Tempo'));
for(const id of evaluate('cardioMachines.map(e=>e[0])')){
 const d=evaluate(`resolveExerciseDetails(${JSON.stringify(id)})`);assert.ok(d.steps.length);assert.equal(d.form.some(x=>x.includes('Record duration')),false);
}
w.showInfo('flatpress');const picture=w.document.querySelector('#modalbody img');assert.ok(picture);w.exerciseDetailImageFailed(picture);assert.ok(w.document.querySelector('#modalbody [role="status"]'));assert.equal(w.document.querySelector('#modalbody').textContent.includes('could not load'),true);
evaluate(`ownExercises().push({id:'own-test',name:'<img src=x onerror=alert(1)>',instructions:'My personal instructions',tips:'My tip',form:'My form',muscles:['abs']})`);
w.showInfo('own-test');
assert.equal(w.document.querySelector('#modalbody h2').textContent,'<img src=x onerror=alert(1)>');
assert.equal(w.document.querySelectorAll('#modalbody img').length,0,'Custom content must be escaped');
assert.ok(w.document.querySelector('#modalbody').textContent.includes('My personal instructions'));
assert.ok(w.document.querySelector('#modalbody').textContent.includes('My tip'));
assert.ok(w.document.querySelector('#modalbody').textContent.includes('My form'));
assert.equal(w.document.querySelector('#modalbody').textContent.includes('My tip'),true);
// Exercise resolution also tolerates saved IDs missing from the catalogue.
w.showInfo('unknown-saved-id');assert.ok(w.document.querySelector('#modalbody').textContent.includes('have not been added'));
if(process.env.AUDIT_OUTPUT)fs.writeFileSync(process.env.AUDIT_OUTPUT,JSON.stringify(rows,null,2));
console.log('PASS: '+rows.length+' detail screens, complete instructions/form/images, fill-only preservation, unchanged tips, newline parsing, maps, aliases, image errors, cardio, coaching, video links and storage preservation.');
dom.window.close();
