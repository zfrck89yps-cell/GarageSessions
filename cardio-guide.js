/* Cardio stages live in the exercise tuple's fourth slot; draft progress is independent. */
const cgCycling=new Set(['bike','uprightcycle','recumbentcycle','airbike']);
let cgEditor=null,cgWake=null,cgWakePending=false,cgShown=false;
function cgEligible(id){return isCardioExercise(id)&&!timeOnlyExercise(id)}
function cgTime(seconds){seconds=Math.max(0,Math.ceil(seconds));return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')}
function cgExpand(blocks){return (blocks||[]).flatMap(b=>Array.from({length:b.repeat},(_,round)=>b.stages.map(s=>({...s,round:round+1,repeat:b.repeat}))).flat())}
function cgTotal(blocks){return cgExpand(blocks).reduce((n,s)=>n+Number(s.seconds),0)}
function cgValidate(blocks,cycling){
 if(!Array.isArray(blocks)||!blocks.length)throw Error('Add at least one stage.');
 let count=0,total=0;
 for(const b of blocks){if(!Number.isInteger(b.repeat)||b.repeat<1||b.repeat>50||!Array.isArray(b.stages)||!b.stages.length)throw Error('Each block needs stages and 1–50 repeats.');
 for(const s of b.stages){if(!Number.isInteger(s.seconds)||s.seconds<1||s.seconds>7200)throw Error('Stage duration must be 1 second to 120 minutes.');if(!['low','medium','high'].includes(s.intensity))throw Error('Choose low, medium or high intensity.');if(cycling&&((s.rpmMin!==''||s.rpmMax!=='')&&(!Number.isFinite(Number(s.rpmMin))||!Number.isFinite(Number(s.rpmMax))||Number(s.rpmMin)<1||Number(s.rpmMax)>250||Number(s.rpmMin)>Number(s.rpmMax))))throw Error('Enter both cadence values, from 1 to 250 RPM, with the lower value first.');total+=s.seconds*b.repeat;count+=b.repeat;}}
 if(count>1000||total>86400)throw Error('Keep guides within 1,000 stages and 24 hours.');
}
function cgBlank(){return {label:'',seconds:60,intensity:'low',cue:'',rpmMin:'',rpmMax:''}}
function cgOpen(context,index){
 const e=context==='builder'?builder?.ex[index]:db.draft?.exercises[index];if(!e)return;
 if(context==='draft'&&db.draft.cardioRun?.index===index&&!db.draft.cardioRun.complete)return alert('Stop the active guide before editing its stages.');
 cgEditor={context,index,id:context==='builder'?e[0]:e.id,blocks:structuredClone((context==='builder'?e[3]?.cardioGuide:e.cardioGuide)||[])};cgEditRender();
}
function cgEditRender(){
 const x=cgEditor;if(!x)return;const cycle=cgCycling.has(x.id),m=document.querySelector('#modal');
 document.querySelector('#modalbody').innerHTML='<h2>PLAN CARDIO GUIDE</h2><p>'+esc(names[x.id]||x.id)+'</p><p class="muted">Add stages in order. Repeat a block to alternate work and recovery. Cadence is an optional pedal-speed target, not resistance.</p>'+x.blocks.map((b,i)=>'<section class="card"><label>Block repeats <input aria-label="Block repeats" type="number" min="1" max="50" value="'+esc(b.repeat)+'" oninput="cgEditor.blocks['+i+'].repeat=Number(this.value)"></label>'+b.stages.map((s,j)=>'<div class="cg-stage"><label>Stage name <input aria-label="Stage name" value="'+esc(s.label)+'" placeholder="e.g. Warm up" oninput="cgField('+i+','+j+',\'label\',this.value)"></label><label>Duration in seconds <input aria-label="Duration in seconds" type="number" min="1" max="7200" value="'+esc(s.seconds)+'" oninput="cgField('+i+','+j+',\'seconds\',Number(this.value))"></label><label>Intensity <select aria-label="Intensity" onchange="cgField('+i+','+j+',\'intensity\',this.value)">'+['low','medium','high'].map(v=>'<option '+(v===s.intensity?'selected':'')+'>'+v+'</option>').join('')+'</select></label><label>Instructions <textarea aria-label="Stage instructions" oninput="cgField('+i+','+j+',\'cue\',this.value)">'+esc(s.cue)+'</textarea></label>'+(cycle?'<div class="grid">'+['rpmMin','rpmMax'].map((k,n)=>'<label>'+(n?'Maximum':'Minimum')+' RPM<input aria-label="'+(n?'Maximum':'Minimum')+' RPM" type="number" min="1" max="250" value="'+esc(s[k])+'" placeholder="Optional" oninput="cgField('+i+','+j+',\''+k+'\',this.value)"></label>').join('')+'</div>':'')+'<button class="ghost" onclick="cgMove('+i+','+j+',-1)">↑</button><button class="ghost" onclick="cgMove('+i+','+j+',1)">↓</button><button class="ghost" onclick="cgEditor.blocks['+i+'].stages.splice('+j+',1);cgEditRender()">Remove stage</button></div>').join('')+'<button class="ghost" onclick="cgEditor.blocks['+i+'].stages.push(cgBlank());cgEditRender()">+ Stage in block</button><button class="ghost" onclick="cgEditor.blocks.splice('+i+',1);cgEditRender()">Remove block</button></section>').join('')+'<button class="btn secondary" onclick="cgEditor.blocks.push({repeat:1,stages:[cgBlank()]});cgEditRender()">+ ADD BLOCK / STAGE</button><p id="cg-error" role="alert"></p><button class="btn" onclick="cgSave()">SAVE GUIDE</button><button class="ghost" onclick="cgClear()">REMOVE GUIDE</button>';
 if(!m.open)m.showModal();
}
function cgField(i,j,k,v){cgEditor.blocks[i].stages[j][k]=v}
function cgMove(i,j,delta){const a=cgEditor.blocks[i].stages,k=j+delta;if(k>=0&&k<a.length)[a[j],a[k]]=[a[k],a[j]];cgEditRender()}
function cgSave(clear=false){const x=cgEditor;if(!x)return;try{if(!clear)cgValidate(x.blocks,cgCycling.has(x.id));}catch(e){document.querySelector('#cg-error').textContent=e.message;return}
 const e=x.context==='builder'?builder?.ex[x.index]:db.draft?.exercises[x.index];if(!e)return;
 if(x.context==='builder'){e[3]={...(e[3]||{})};if(clear)delete e[3].cardioGuide;else e[3].cardioGuide=structuredClone(x.blocks)}else{if(clear)delete e.cardioGuide;else e.cardioGuide=structuredClone(x.blocks);save()}
 cgEditor=null;document.querySelector('#modal').close();render();
}
function cgClear(){cgSave(true)}
const cgBuilderPage=workoutBuilderPage;
workoutBuilderPage=function(){let h=cgBuilderPage();if(builder)h+='<div class="card"><h2>CARDIO GUIDES</h2>'+builder.ex.map((e,i)=>cgEligible(e[0])?'<p>'+esc(names[e[0]]||e[0])+' · '+cgTime(cgTotal(e[3]?.cardioGuide))+' <button class="ghost" onclick="cgOpen(\'builder\','+i+')">PLAN GUIDE</button></p>':'').join('')+'</div>';return h};
const cgStartWorkout=start;
start=function(id){const old=db.draft;cgStartWorkout(id);if(db.draft&&db.draft!==old&&db.draft.plan===id){db.draft.exercises.forEach((e,i)=>{const g=plan(id)?.ex[i]?.[3]?.cardioGuide;if(g)e.cardioGuide=structuredClone(g)});save();render()}};
const cgExerciseCard=gsExerciseCard;
gsExerciseCard=function(e,i,round=null){if(!cgEligible(e.id))return cgExerciseCard(e,i,round);const s=e.sets[0]||{},run=db.draft.cardioRun;return '<div class="card" id="exercise-'+i+'"><div class="split"><h3>'+esc(names[e.id]||e.id)+'</h3><button class="ghost" aria-label="Exercise instructions" onclick="showInfo(\''+e.id+'\')">ⓘ</button></div><div class="grid"><label>Minutes<input aria-label="Cardio minutes" type="number" min="0" step=".1" value="'+esc(s.minutes??s.reps??0)+'" onchange="setCardioField('+i+',\'minutes\',this.value)"></label><label>Distance (km)<input aria-label="Cardio distance" type="number" min="0" step=".01" value="'+esc(s.km??'')+'" onchange="setCardioField('+i+',\'km\',this.value)"></label></div><label>Resistance / load (optional)<input type="number" min="0" step=".5" value="'+esc(s.extra??'')+'" onchange="setCardioField('+i+',\'extra\',this.value)"></label><label><input type="checkbox" '+(s.done?'checked':'')+' onchange="setCardioField('+i+',\'done\',this.checked)"> Completed</label><p>'+cgExpand(e.cardioGuide).length+' stages · '+cgTime(cgTotal(e.cardioGuide))+'</p><button class="ghost" onclick="cgOpen(\'draft\','+i+')">PLAN GUIDE</button> '+(e.cardioGuide?.length?'<button class="btn" onclick="cgGo('+i+')">'+(run?.index===i&&!run.complete?'OPEN GUIDE':'GO')+'</button>':'')+'<button class="ghost" onclick="gsRemoveExercise('+i+')">REMOVE EXERCISE</button></div>'};
function cgRun(){return db.draft?.cardioRun}
async function cgKeepAwake(){if(cgWake||cgWakePending||!cgRun()||cgRun().pausedAt||cgRun().complete||document.visibilityState==='hidden')return;cgWakePending=true;try{cgWake=await navigator.wakeLock?.request('screen');if(!cgRun()||cgRun().complete||cgRun().pausedAt){cgRelease();return}cgWake?.addEventListener('release',()=>{cgWake=null})}catch{}finally{cgWakePending=false}}
function cgRelease(){const w=cgWake;cgWake=null;try{w?.release()?.catch(()=>{})}catch{}}
function cgGo(index){const d=db.draft,e=d?.exercises[index];if(!e)return;let r=d.cardioRun;
 if(r&&!r.complete){if(r.index===index){cgShown=true;cgKeepAwake();cgPaint();return}if(!confirm('Stop the current guide and start this one?'))return;cgStop(false)}
 try{cgValidate(e.cardioGuide,cgCycling.has(e.id))}catch(err){return alert(err.message)}
 gsStopRest();gsEnableRestAudio();if(!d.clockStarted)beginSessionClock();else if(d.pausedAt)toggleSessionPause();
 d.cardioRun={index,id:e.id,stages:cgExpand(e.cardioGuide),stage:0,ends:Date.now()+e.cardioGuide[0].stages[0].seconds*1000,elapsed:0,complete:false,pausedAt:null};save();cgShown=true;cgKeepAwake();cgPaint();
}
function cgTick(){const d=db.draft,r=cgRun();if(!r){cgRelease();document.querySelector('#cg-player')?.remove();return}if(d.exercises[r.index]?.id!==r.id){cgStop(false);return}if(r.complete||r.pausedAt)return;
 let changed=false;const now=Date.now();while(now>=r.ends&&!r.complete){r.elapsed+=r.stages[r.stage].seconds;r.stage++;changed=true;if(r.stage>=r.stages.length){r.complete=true;r.finishedAt=r.ends;const e=d.exercises[r.index];e.sets[0]??={kg:0};Object.assign(e.sets[0],{minutes:r.elapsed/60,reps:r.elapsed/60,done:true});cgRelease()}else r.ends+=r.stages[r.stage].seconds*1000;}
 if(changed){gsDing();save()}cgPaint();
}
function cgPause(){const r=cgRun();if(!r||r.complete)return;gsEnableRestAudio();if(r.pausedAt){r.ends+=Date.now()-r.pausedAt;r.pausedAt=null;cgKeepAwake()}else{cgTick();if(r.complete)return;r.pausedAt=Date.now();cgRelease()}save();cgPaint()}
function cgStop(ask=true){if(ask&&!confirm('Stop this guide? Completed guides are logged automatically; this incomplete attempt will not be marked done.'))return;const d=db.draft;if(d)delete d.cardioRun;cgShown=false;cgRelease();save();document.querySelector('#cg-player')?.remove();render()}
function cgPaint(){let el=document.querySelector('#cg-player');const r=cgRun();if(!r){el?.remove();return}if(!el){el=document.createElement('section');el.id='cg-player';document.body.append(el)}const s=r.stages[r.stage],next=r.stages[r.stage+1];
 const signature=JSON.stringify([cgShown,r.stage,r.pausedAt,r.complete,r.id]);
 const remaining=cgTime((r.ends-(r.pausedAt||Date.now()))/1000);
 if(el.dataset.view===signature){const timer=el.querySelector('[role=timer]');if(timer&&!r.complete)timer.textContent=remaining;const mini=el.querySelector('.btn');if(!cgShown&&mini&&!r.complete&&!r.pausedAt)mini.textContent=(s.label||s.intensity)+' · '+remaining+' ↑';return}
 el.dataset.view=signature;
 el.className=cgShown?'cg-player':'cg-mini';el.innerHTML=cgShown?'<div class="cg-content"><button class="ghost" onclick="cgShown=false;cgPaint()">MINIMISE ↓</button><p>'+esc(names[r.id]||r.id)+'</p><small>'+(r.complete?'GUIDE COMPLETE':'STAGE '+(r.stage+1)+' OF '+r.stages.length+(s.repeat>1?' · ROUND '+s.round+' / '+s.repeat:''))+'</small><h1>'+(r.complete?'DONE':esc(s.label||'Stage '+(r.stage+1)))+'</h1><div class="cg-count" role="timer">'+(r.complete?'✓':cgTime((r.ends-(r.pausedAt||Date.now()))/1000))+'</div>'+(r.complete?'<p>Duration logged and exercise marked complete.</p>':'<h2>'+esc(s.intensity.toUpperCase())+' INTENSITY</h2>'+(cgCycling.has(r.id)&&s.rpmMin!==''&&s.rpmMin!=null?'<p class="lime">'+esc(s.rpmMin)+'–'+esc(s.rpmMax)+' RPM</p>':'')+'<p>'+esc(s.cue||'')+'</p><p class="muted">NEXT: '+(next?esc(next.label||next.intensity+' intensity')+' · '+cgTime(next.seconds):'Finish')+'</p><button class="btn" onclick="cgPause()">'+(r.pausedAt?'RESUME':'PAUSE')+'</button>')+'<button class="ghost" onclick="'+(r.complete?'cgShown=false;cgPaint();render()':'cgStop()')+'">'+(r.complete?'BACK TO WORKOUT':'STOP GUIDE')+'</button></div>':'<button class="btn" onclick="cgShown=true;gsEnableRestAudio();cgKeepAwake();cgPaint()">'+(r.complete?'CARDIO COMPLETE':r.pausedAt?'GUIDE PAUSED':esc(s.label||s.intensity)+' · '+cgTime((r.ends-Date.now())/1000))+' ↑</button>';
}
const cgRender=render;render=function(){cgRender();if(!cgRun())cgRelease();cgPaint()};
const cgRemove=gsRemoveExercise;gsRemoveExercise=function(i){const owner=cgRun()?db.draft.exercises[cgRun().index]:null;cgRemove(i);if(owner&&cgRun()){const n=db.draft.exercises.indexOf(owner);if(n<0)cgStop(false);else{cgRun().index=n;save()}}};
const cgSessionPause=toggleSessionPause;toggleSessionPause=function(){const r=cgRun(),was=db.draft?.pausedAt;cgSessionPause();if(r&&!r.complete&&!!was!==!!db.draft?.pausedAt&&!!r.pausedAt!==!!db.draft?.pausedAt)cgPause()};
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){cgTick();cgKeepAwake()}});
setInterval(cgTick,250);
if(cgRun()&&!cgRun().complete){const r=cgRun();if(!r.pausedAt){cgTick();if(!r.complete){r.pausedAt=Date.now();save()}}cgShown=true;}
const cgStyle=document.createElement('style');cgStyle.textContent='.cg-stage{border-top:1px solid #444;margin-top:16px;padding-top:12px}.cg-stage input,.cg-stage select,.cg-stage textarea{width:100%;box-sizing:border-box}.cg-player{position:fixed;inset:0;z-index:1000;background:#101010;overflow:auto;padding:env(safe-area-inset-top) 20px env(safe-area-inset-bottom);box-sizing:border-box}.cg-content{max-width:500px;margin:24px auto;text-align:center}.cg-count{font-size:clamp(72px,22vw,110px);font-weight:850;color:#c6ff00;font-variant-numeric:tabular-nums}.cg-mini{position:fixed;bottom:85px;left:12px;right:12px;z-index:100}.cg-mini button{width:100%;box-shadow:0 4px 24px #000}';document.head.append(cgStyle);
