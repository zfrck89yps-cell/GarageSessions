const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const html=fs.readFileSync('index.html','utf8'),dom=new JSDOM(html,{url:'https://garage.test/',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,ctx=dom.getInternalVMContext();w.structuredClone=structuredClone;w.confirm=()=>true;w.alert=msg=>{throw Error(msg)};w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};let now=1800000000000;w.Date.now=()=>now;w.setInterval=()=>1;w.clearInterval=()=>{};
for(const m of html.matchAll(/<script(?: src="([^"]+)")?>([\s\S]*?)<\/script>/g))vm.runInContext(m[1]?fs.readFileSync(m[1],'utf8'):m[2],ctx);const ev=s=>vm.runInContext(s,ctx);
ev(`openWorkoutBuilder();builder.name='Cardio test';builder.type='cardio';builder.ex=[['bike',10,20],['walking',10,20]];cgOpen('builder',0);cgEditor.blocks=[{repeat:2,stages:[{label:'Work',seconds:2,intensity:'high',cue:'Pedal',rpmMin:'70',rpmMax:'90'},{label:'Recovery',seconds:3,intensity:'low',cue:'Easy',rpmMin:'',rpmMax:''}]}];cgSave();saveWorkoutBuilder();start(db.plans.at(-1).id)`);
assert.equal(ev('db.draft.exercises[0].cardioGuide[0].repeat'),2);assert.equal(ev('cgExpand(db.draft.exercises[0].cardioGuide).length'),4);
assert.equal(ev('cgEligible("walking")'),true);assert.equal(ev('cgEligible("yoga")'),false);
let dings=0;w.cgTestDing=()=>dings++;ev('gsDing=cgTestDing;cgGo(0)');assert.match(w.document.querySelector('#cg-player').textContent,/HIGH INTENSITY/);assert.equal(ev('db.draft.clockStarted'),true);
now+=2000;ev('cgTick()');assert.equal(ev('cgRun().stage'),1);assert.equal(dings,1);ev('cgPause()');now+=60000;ev('cgTick()');assert.equal(ev('cgRun().stage'),1);ev('cgPause()');now+=3000;ev('cgTick()');assert.equal(ev('cgRun().stage'),2);assert.equal(dings,2);
ev('cgShown=false;render()');assert.ok(w.document.querySelector('.cg-mini'));now+=5000;ev('cgTick()');assert.equal(ev('cgRun().complete'),true);assert.equal(ev('db.draft.exercises[0].sets[0].minutes'),10/60);assert.equal(ev('db.draft.exercises[0].sets[0].done'),true);assert.equal(dings,3);ev('cgTick()');assert.equal(dings,3);
// Draft edits leave the saved plan untouched; old records keep distance and load.
ev(`cgOpen('draft',0);cgEditor.blocks[0].stages[0].seconds=4;cgSave()`);assert.equal(ev('plan(db.draft.plan).ex[0][3].cardioGuide[0].stages[0].seconds'),2);
ev(`db.draft.exercises[0].sets[0].km=2;db.draft.exercises[0].sets[0].extra=5;cgGo(0)`);now+=14000;ev('cgTick()');assert.equal(ev('db.draft.exercises[0].sets[0].km'),2);assert.equal(ev('db.draft.exercises[0].sets[0].extra'),5);
// Validation must reject malformed repeat/duration/cadence without saving.
assert.throws(()=>ev(`cgValidate([{repeat:0,stages:[cgBlank()]}],true)`));assert.throws(()=>ev(`cgValidate([{repeat:1,stages:[{...cgBlank(),seconds:0}]}],true)`));assert.throws(()=>ev(`cgValidate([{repeat:1,stages:[{...cgBlank(),rpmMin:90,rpmMax:70}]}],true)`));
ev('cgGo(0);cgStop(false)');assert.equal(ev('cgRun()'),undefined);assert.equal(w.document.querySelector('#cg-player'),null);
// Full export naturally preserves tuples and independent draft guides.
assert.ok(ev('JSON.stringify(db)').includes('cardioGuide'));ev('finish()');assert.equal(ev('db.draft'),null);
console.log('PASS: cardio planner persistence, cloning, repeats, validation, automatic transitions, pause, delayed ticks, single ding, completion logging, metadata preservation and stop');dom.window.close();
