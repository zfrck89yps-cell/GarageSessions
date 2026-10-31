const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('index.html','utf8');const dom=new JSDOM(html,{url:'https://garage.test/',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,ctx=dom.getInternalVMContext();
w.structuredClone=structuredClone;w.confirm=()=>true;w.HTMLDialogElement.prototype.showModal=function(){this.open=true};
let now=1_800_000_000_000,serial=0;const timers=new Map();w.Date.now=()=>now;w.setInterval=fn=>{timers.set(++serial,fn);return serial};w.clearInterval=id=>timers.delete(id);
const sound={contexts:0,resumes:0,tones:0,silent:0};
class AudioContext{
 constructor(){sound.contexts++;this.state='suspended';this.destination={};this.currentTime=0;}
 resume(){sound.resumes++;this.state='running';return Promise.resolve()}
 close(){this.state='closed';return Promise.resolve()}
 createBuffer(){return {}}
 createBufferSource(){return {connect(){},start(){sound.silent++}}}
 createOscillator(){return {frequency:{},connect(){},disconnect(){},start(){sound.tones++},stop(){}}}
 createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}}}
}
w.AudioContext=AudioContext;
for(const m of html.matchAll(/<script(?: src="([^"]+)")?>([\s\S]*?)<\/script>/g))vm.runInContext(m[1]?fs.readFileSync(m[1],'utf8'):m[2],ctx);
const ev=s=>vm.runInContext(s,ctx),tick=ms=>{now+=ms;ev('gsRestTick()')},button=key=>[...w.document.querySelectorAll('[data-rest-key]')].find(b=>b.dataset.restKey===key);
ev(`db.plans.push({id:'rest-test',name:'Rest test',type:'strength',ex:[['squat',8,12],['flatpress',8,12],['row',8,12]]});start('rest-test')`);
ev(`setField(0,0,'done',true)`);
assert.match(button('ex-0').textContent,/REST 60s/);assert.equal(sound.contexts,1);assert.equal(sound.resumes,1);assert.equal(sound.tones,0,'No audible alarm on Done');assert.equal(ev('restEnds'),0,'Legacy hidden timer must not start');
tick(1000);assert.match(button('ex-0').textContent,/REST 59s/);
ev('render()');assert.match(button('ex-0').textContent,/REST 59s/,'Countdown survives a rerender');
ev(`setField(0,0,'done',true)`);assert.match(button('ex-0').textContent,/59s/,'Already-done updates must not restart');
ev(`setField(0,0,'done',false)`);assert.match(button('ex-0').textContent,/59s/,'Unchecking does not start a new countdown');
ev(`setField(1,0,'done',true)`);assert.equal(button('ex-0').textContent,'START 60s');assert.match(button('ex-1').textContent,/60s/);
tick(60000);assert.equal(button('ex-1').textContent,'DONE · RESTART');assert.equal(sound.tones,3);assert.equal(sound.contexts,1,'Alarm reuses the gesture-unlocked context');tick(1000);assert.equal(sound.tones,3,'Alarm sounds only once');
ev(`gsStartRest(document.querySelector('[data-rest-key="ex-1"]'),60)`);tick(1000);assert.match(button('ex-1').textContent,/59s/);
ev(`gsRemoveExercise(0)`);tick(1000);assert.match(button('ex-0').textContent,/58s/,'Timer follows its exercise when indices change');
ev(`gsRemoveExercise(0)`);tick(60000);assert.equal(sound.tones,3,'Removing the owner cancels its alarm');assert.equal(ev('gsRestState'),null);
// No rest between the two exercises of a superset; rest after the whole round.
ev(`db.draft=null;db.plans.push({id:'superset-rest',name:'Grouped test',type:'strength',ex:[['squat',8,12],['flatpress',8,12],['row',8,12]],groups:{0:'A',1:'A'}});start('superset-rest')`);
ev(`setField(0,0,'done',true)`);assert.equal(ev('gsRestState'),null);ev(`setField(1,0,'done',true)`);assert.match(button('superset-A').textContent,/60s/);tick(1000);ev('render()');assert.match(button('superset-A').textContent,/59s/);
ev('db.draft=null');tick(60000);assert.equal(sound.tones,3,'Finishing or discarding a workout cancels its rest alarm');
// Cardio completion remains separate from strength rest timers.
ev(`db.plans.push({id:'cardio-rest',name:'Cardio test',type:'cardio',ex:[['bike',10,20]]});start('cardio-rest');setField(0,0,'done',true)`);assert.equal(ev('gsRestState'),null);
console.log('PASS: Done auto-start, audio gesture/resume and reuse, one alarm, rerenders, rest ownership, manual restart, supersets and cardio');dom.window.close();
