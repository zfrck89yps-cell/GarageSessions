/* One resolver and one renderer for every exercise details entry point. */
const detailAliases={...gsSourceAliases,
 'Bent-over dumbbell row':'Bent Over Two-Dumbbell Row',
 'Dumbbell bench pullover':'Straight-Arm Dumbbell Pullover',
 'Incline dumbbell bench press':'Incline Dumbbell Press',
 'Flat dumbbell bench press':'Dumbbell Bench Press',
 'Bench-supported one-arm dumbbell row':'One-Arm Dumbbell Row',
 'Standard-bar Romanian deadlift':'Romanian Deadlift',
 'Incline dumbbell curl':'Incline Dumbbell Curl',
 'Dumbbell lateral raise':'Side Lateral Raise',
 'Dumbbell hammer curl':'Hammer Curls',
 'Two-hand dumbbell overhead extension':'Standing Dumbbell Triceps Extension',
 'Forearm plank':'Plank',
 'Glute bridge':'Butt Lift (Bridge)',
 'Incline DB press':'Incline Dumbbell Press',
 'Flat DB press':'Dumbbell Bench Press',
 'Seated DB shoulder press':'Seated Dumbbell Press',
 'Overhead press':'Standing Military Press',
 'Chest-supported row':'Dumbbell Incline Row',
 'Single-arm DB row':'One-Arm Dumbbell Row',
 'Seated cable row (close grip)':'Seated Cable Rows',
 'Rear delt flye':'Seated Bent-Over Rear Delt Raise',
 'DB shrugs':'Dumbbell Shrug',
 'Tricep rope pushdown':'Triceps Pushdown - Rope Attachment',
 'Skull crusher':'Lying Triceps Press',
 'Machine chest press':'Machine Bench Press',
 'Machine chest flye (pec deck)':'Butterfly',
 'Lat pulldown (V-grip)':'V-Bar Pulldown',
 'Lat pulldown (wide grip)':'Wide-Grip Lat Pulldown',
 'Single-arm cable pulldown':'One Arm Lat Pulldown',
 'Reverse pec deck':'Reverse Machine Flyes',
 'Overhead tricep extension':'Standing Dumbbell Triceps Extension',
 'Close-grip bench':'Close-Grip Barbell Bench Press',
 'Wrist curl':'Palms-Up Dumbbell Wrist Curl Over A Bench',
 'Wrist extension':'Palms-Down Dumbbell Wrist Curl Over A Bench',
 'Side plank':'Side Bridge',
 'Ab wheel rollout':'Ab Roller',
 'Back squat':'Barbell Squat',
 'Reverse lunge':'Dumbbell Rear Lunge',
 'Barbell RDL':'Romanian Deadlift',
 'Adductor machine':'Thigh Adductor',
 'Abductor machine':'Thigh Abductor',
 'Reverse curl':'Reverse Barbell Curl'
};
const detailMuscles={
 press:[['chest'],['triceps','delt_front']],rdl:[['hamstrings','glutes'],['lower_back']],
 pallof:[['obliques','abs'],[]],push:[['chest'],['triceps','delt_front','abs']],
 bandrow:[['lats','upper_back'],['biceps','delt_rear']],inclinecurl:[['biceps'],['brachialis']],
 calfraise:[['calves'],[]],bike:[['quads'],['glutes','hamstrings','calves']],
 treadmill:[['quads','glutes','hamstrings','calves'],['abs']],elliptical:[['quads','glutes'],['hamstrings','calves']],
 rowerg:[['quads','glutes','lats'],['hamstrings','biceps','abs']],stairclimber:[['quads','glutes'],['calves']],
 uprightcycle:[['quads'],['glutes','hamstrings','calves']],recumbentcycle:[['quads'],['glutes','hamstrings']],
 airbike:[['quads','glutes'],['chest','lats','triceps','biceps']],skierg:[['lats','triceps','abs'],['glutes','hamstrings']],
 arc:[['quads','glutes'],['hamstrings','calves']],walking:[['glutes','quads','calves'],['hamstrings']],
 running:[['glutes','quads','hamstrings','calves'],['abs']],rucking:[['glutes','quads','calves'],['abs','traps_upper']]
};
// Restore native IDs without changing saved workout references or imported IDs.
for(const [id,category,equipment] of [['deadbug','Core','Mat'],['pallof','Core','Resistance band'],['bandrow','Pull','Resistance band']]){
 if(!exerciseCatalog.some(e=>e[0]===id))exerciseCatalog.push([id,category,equipment]);
}
extraExercises.calfraise[3]=['calves'];
const detailNormalize=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const detailLines=x=>(Array.isArray(x)?x:String(x||'').split(/\r?\n|\\n/)).map(s=>String(s).trim()).filter(Boolean);
const detailUnique=x=>[...new Set(x.filter(Boolean))];
function resolveExerciseDetails(id){
 const own=ownExercises().find(e=>e.id===id),name=own?.name||names[id]||id;
 const entry=importedById[id],coach=coaching[id],extra=extraExercises[id],custom=gsTechnique[name.toLowerCase()];
 const target=detailAliases[name]||name;
 const source=importedExercises.find(e=>e.folder&&e.imageCount&&detailNormalize(e.name)===detailNormalize(target));
 const photo=entry?.folder&&entry.imageCount?entry:source;
 const isPlaceholder=x=>!x||x.startsWith('Use controlled form, a manageable load');
 const sourceSteps=detailLines(!isPlaceholder(entry?.instructions)?entry.instructions:source?.instructions);
 const isCardio=cardioIds.has(id),isYoga=id===yogaId;
 let steps=own?detailLines(own.instructions):gsImportedCorrections[entry?.name]||gsExerciseGuides[name]||gsDetailSteps[id]||custom?.steps||coach?.steps||sourceSteps;
 if(!steps.length&&!own&&info[id]?.[0])steps=detailLines(info[id][0]);
 if(isCardio)steps=coach?.steps||detailLines(cardioDefaults[id]||info[id]?.[0]);
 if(isYoga)steps=['Follow the instructions for your chosen yoga practice. Yoga is a session category; its poses use different techniques and muscle groups.'];
 let form=own?detailLines(own.form):detailUnique([...(coach?.cues||[]),...(extra?.[2]?[extra[2]]:[]),...(!isCardio&&info[id]?.[1]?[info[id][1]]:[])]);
 // Preserve source-authored form sentences, rather than inventing generic cues.
 if(!form.length&&!isCardio&&!own)form=detailUnique(sourceSteps.flatMap(s=>s.split(/(?<=[.!?])\s+/)).filter(s=>/\b(keep|avoid|do not|don't|make sure|ensure)\b/i.test(s)));
 const tips=own?detailLines(own.tips):detailUnique(custom?.tips||[]);
 let main=own?.muscles||detailMuscles[id]?.[0]||entry?.main||coach?.muscles||extra?.[3]||source?.main||[];
 let secondary=own?.secondaryMuscles||detailMuscles[id]?.[1]||entry?.secondary||source?.secondary||[];
 if(!Array.isArray(main))main=[];if(!Array.isArray(secondary))secondary=[];
 if(isYoga){main=[];secondary=[];}
 const images=photo?Array.from({length:Math.min(2,photo.imageCount)},(_,i)=>({url:exercisePhoto(photo,i),alt:name+' demonstration position '+(i+1)})):[];
 return {id,name,steps,form,tips,main,secondary,images,isCardio,isYoga,sourceName:photo?.name||'',mistakes:coach?.avoid||[],breath:coach?.breath||'',tempo:coach?.tempo||'',equipment:own?.equipment||entry?.equipment||source?.equipment||exerciseCatalog.find(e=>e[0]===id)?.[2]||'',explanation:own?.description||'',muscleNote:isCardio?'Indicative muscle groups; effort depends on speed, resistance and technique.':''};
}
function exerciseDetailImageFailed(picture){
 const box=picture.closest('figure');if(!box)return;
 const message=document.createElement('p');message.className='muted';message.setAttribute('role','status');
 message.textContent='Demonstration picture could not load. Check your connection or use the video link below.';
 picture.replaceWith(message);
}
function showInfo(id){
 const d=resolveExerciseDetails(id),body=document.querySelector('#modalbody'),modal=document.querySelector('#modal');
 const section=(heading,items)=>'<h3>'+heading+'</h3>'+(items.length?'<ul>'+items.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ul>':'<p class="muted">Exercise-specific '+heading.toLowerCase()+' have not been added yet.</p>');
 const supported=new Set([...FRONT,...BACK].map(p=>p[0]));
 const mapped=d.main.flatMap(m=>anatomyKeys[m]||[m]).filter(m=>supported.has(m));
 const labels=values=>values.map(m=>anatomyNames[m]||muscleLabels[m]||m.replace(/_/g,' ')).join(', ');
 const map=mapped.length?detailedMuscleMap(d.main,d.secondary)+'<p><b>Main:</b> '+esc(labels(d.main))+(d.secondary.length?'<br><b>Supporting:</b> '+esc(labels(d.secondary)):'')+'</p>':'<p class="muted">'+(d.isYoga?'Muscle maps belong to individual yoga poses; no single map describes a whole practice.':'Muscle information has not been added for this exercise.')+'</p>';
 const images=d.images.length?'<div class="grid" style="grid-template-columns:1fr 1fr;gap:8px">'+d.images.map((p,i)=>'<figure style="margin:0"><img loading="lazy" src="'+esc(p.url)+'" alt="'+esc(p.alt)+'" onerror="exerciseDetailImageFailed(this)" style="width:100%;border-radius:8px"><figcaption>Position '+(i+1)+'</figcaption></figure>').join('')+'</div><small>Photography: Free Exercise DB (public domain).</small>':'<p class="muted">No verified demonstration pictures have been added for this exercise.</p>';
 body.innerHTML='<h2>'+esc(d.name)+'</h2>'+map+(d.muscleNote?'<p class="muted">'+esc(d.muscleNote)+'</p>':'')+images+(d.equipment?'<p><b>Equipment:</b> '+esc(d.equipment)+'</p>':'')+(d.explanation?'<p>'+esc(d.explanation)+'</p>':'')+guideSection('How to perform',d.steps)+section('Form guidance',d.form)+section('Tips',d.tips)+(d.mistakes.length?section('Common mistakes',d.mistakes):'')+(d.breath?'<h3>Breathing</h3><p>'+esc(d.breath)+'</p>':'')+(d.tempo?'<h3>Tempo</h3><p>'+esc(d.tempo)+'</p>':'')+(d.isCardio?'<h3>What to record</h3><p>Duration in minutes; distance and resistance where applicable.</p>':'')+'<p><a class="ghost" target="_blank" rel="noopener noreferrer" href="https://www.youtube.com/results?search_query='+encodeURIComponent(d.name+' exercise correct form demonstration')+'">▶ FIND VIDEO DEMONSTRATION</a></p>';
 if(!d.steps.length)body.querySelector('ol').outerHTML='<p class="muted">Exercise-specific instructions have not been added yet.</p>';
 for(const prop of ['top','bottom','left','right','margin','margin-top','margin-bottom','transform','width','max-height'])modal.style.removeProperty(prop);
 if(!modal.open)modal.showModal();modal.scrollTop=0;body.scrollTop=0;document.activeElement?.blur?.();
 requestAnimationFrame(()=>{modal.scrollTop=0;});
}
