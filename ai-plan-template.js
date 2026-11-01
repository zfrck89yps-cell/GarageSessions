/* Generated on demand so custom exercises and catalogue additions stay current. */
function gsAIExerciseList(){
 const rows=new Map();
 for(const [id,category,equipment] of exerciseCatalog){if(!Object.prototype.hasOwnProperty.call(names,id)||rows.has(id))continue;rows.set(id,{id,name:names[id],category:category||'Other',equipment:equipment||'',tracking:timeOnlyExercise(id)?'minutes':isCardioExercise(id)?'minutes_and_km':'kg_and_reps'})}
 return [...rows.values()].sort((a,b)=>a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
}
function gsAIPlanExample(){
 const monday=new Date();monday.setDate(monday.getDate()-((monday.getDay()+6)%7));
 return {format:'garage-sessions-plan-v1',plans:[{id:'plan-example-strength',name:'Example strength workout',type:'strength',ex:[['squat',8,12],['flatpress',8,12],['row',8,12]],groups:{'0':'A','1':'A'}},{id:'plan-example-cardio',name:'Example cardio guide',type:'cardio',ex:[['bike',1,2,{cardioGuide:[{repeat:1,stages:[{label:'Example easy stage',seconds:30,intensity:'low',cue:'Example instruction',rpmMin:'',rpmMax:''}]},{repeat:2,stages:[{label:'Example work stage',seconds:15,intensity:'medium',cue:'Example instruction',rpmMin:'',rpmMax:''},{label:'Example recovery stage',seconds:15,intensity:'low',cue:'Example instruction',rpmMin:'',rpmMax:''}]}]}]],groups:{}}],schedule:{weeks:2,anchor:localISO(monday),slots:[{plan:'plan-example-strength',week:0,day:1},{plan:'plan-example-cardio',week:0,day:3},{plan:'plan-example-strength',week:1,day:2}]}};
}
function gsAIPlanTemplate(){
 const catalogue=gsAIExerciseList();
 return `AI GARAGE SESSION PLANNER

INSTRUCTIONS FOR THE AI
Populate my requested workout programme using the exact JSON structure below. Ask me about goals, available equipment, experience, session length, exercise preferences and schedule if I have not supplied them. Follow my answers rather than treating the example as a recommended programme.
Return a downloadable UTF-8 .json file named garage-sessions-training-plan.json containing ONLY the populated import JSON. If you cannot attach a file, provide the JSON in one code block so I can save it as a .json file. Do not include this instruction sheet or the exercise catalogue in the import file. Do not output a full app backup.

FORMAT RULES
- Keep format exactly "garage-sessions-plan-v1".
- plans is a non-empty array of workouts. Each needs a unique id starting "plan-", followed only by lowercase letters, digits or hyphens; a descriptive name; type "strength" (also for mixed workouts) or "cardio"; ex; and groups.
- ex is an ordered array of exercise tuples: [exerciseId, minimumTarget, maximumTarget]. Use exact IDs from the catalogue below, not display names, guessed IDs or IDs from another app. Match equipment and tracking as well as exercise name. Retain requested exercise order. Use a given exercise ID once per workout.
- Targets are positive JSON numbers, with maximumTarget >= minimumTarget. For kg_and_reps they mean repetitions per set. For minutes or minutes_and_km they mean minutes, NOT reps, kilometres, seconds or weights.
- The import format does not configure a different set count for each exercise, prescribed working weights, exercise rest durations or exercise effort ratings. Set counts use the app default and can be adjusted during the workout. Do not invent fields to encode these settings. If my request needs them, explain the limitation separately from the JSON file.
- groups maps ZERO-BASED exercise positions (as string keys) to "A", "B", "C" or "D". Example: {"0":"A","1":"A"} pairs the first two exercises as Superset A. Assign at least two strength exercises per superset; omit ungrouped positions. Use {} for no supersets. Do not assign cardio or time-only exercises to supersets.

SCHEDULE RULES
- schedule.weeks must be one of 1, 2, 3, 4, 6 or 8.
- schedule.anchor is a real date in YYYY-MM-DD format. Prefer the Monday starting week 1; ask for a start date if needed. Week labels in the app are 1-based, but JSON week numbers are ZERO-BASED.
- slots entries are {"plan":"an-id-from-plans","week":0,"day":1}. week must be from 0 to weeks minus 1. day uses Sunday=0, Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5, Saturday=6.
- Add each workout/day/week combination only once. A saved workout may have several schedule slots. Use [] if I want saved workouts without recurring days.
- Importing replaces the repeating schedule. Existing saved workouts are removed only if selected in the app's import review; matching IDs update those workouts. Completed history is preserved. Do not reuse existing plan IDs unless I ask you to update them.

OPTIONAL CARDIO STAGE GUIDES
For exercises tracked as minutes_and_km, a fourth tuple item may be {"cardioGuide":[...blocks]}. Omit it for manual cardio logging. Do not use stage guides for strength exercises or time-only yoga/mobility.
Each block is {"repeat":1,"stages":[...stages]}. repeat must be an integer 1–50. Blocks and their stages run in the order supplied; stages within a block repeat together before advancing to the next block.
Each stage needs {"label":"Stage name","seconds":60,"intensity":"low","cue":"What to do","rpmMin":"","rpmMax":""}. seconds is an integer 1–7200; intensity must be "low", "medium" or "high". Use plain-language cues. Warm-up and cool-down are ordinary named stages.
Cycling cadence is optional and available only for bike, uprightcycle, recumbentcycle and airbike. Leave BOTH RPM fields as "" if no target is requested. Otherwise use numeric values with 1 <= rpmMin <= rpmMax <= 250. RPM means pedal cadence, not resistance. Do not invent cadence readings or assume a bike measures it.
Keep the expanded guide within 1,000 stages and 24 hours. Set minute targets to reflect the total guide duration, including repeats (seconds / 60). Stages advance automatically with a ding; the guide logs total duration on completion. Distance and resistance are entered manually.

VALID STRUCTURE EXAMPLE — REPLACE WITH MY PROGRAMME
The following is a format demonstration, not a prescribed workout. Remove the example workouts and example slots when creating my plan.

${JSON.stringify(gsAIPlanExample(),null,2)}

COMPLETE AVAILABLE EXERCISE CATALOGUE (${catalogue.length} exercises)
Generated from this installation on ${localISO(new Date())}, including any personal exercises. Personal exercise IDs only work on installations that already contain those exercises. No workout history, body measurements, saved weights, notes or existing plans are included.
Catalogue fields: id, name, category, equipment, tracking.

${JSON.stringify(catalogue,null,2)}
`;
}
function gsAITemplatePanel(){return '<section class="gs-ai-template" style="border-top:1px solid #444;margin-top:18px;padding-top:16px"><h3>CREATE A PLAN WITH AI</h3><p>To create a personalised workout plan using AI:</p><ol><li>Download the <strong>AI Garage Session Planner</strong> below.</li><li>Upload the planner to your chosen AI platform.</li><li>In the same message as the planner, outline how many sessions you want each week, how much time you have, your goals, favourite and disliked exercises, and any other relevant information, such as your available equipment.</li><li>Once your AI has created your plan, ask for it as a <strong>JSON file</strong>. Upload that file in <strong>More → Import Training Plan</strong>, using the file picker above, then review which existing workouts to keep.</li></ol><p class="muted">The planner includes instructions, an example and the full list of '+gsAIExerciseList().length+' available exercises, including your own exercises. You can also copy and paste it into your AI chat.</p><div class="split" style="flex-wrap:wrap;gap:8px"><button class="btn secondary" onclick="gsDownloadAITemplate()">DOWNLOAD AI GARAGE SESSION PLANNER</button><button class="btn secondary" onclick="gsCopyAITemplate()">COPY PLANNER</button></div><details style="margin-top:14px" ontoggle="if(this.open)gsShowAITemplate()"><summary>View template and full exercise list</summary><textarea id="gs-ai-template-text" aria-label="AI workout import template" readonly rows="12" style="width:100%;box-sizing:border-box;margin-top:12px;font-size:16px"></textarea></details><p id="gs-ai-template-status" role="status"></p></section>'}
const gsSettingsAITemplate=settings;
settings=function(){const html=gsSettingsAITemplate();const input='<input type="file" accept=".json,application/json" aria-label="Import training plan JSON" onchange="importTrainingPlan(this.files[0]);this.value=\'\'">';return html.replace(input,input+gsAITemplatePanel())};
function gsAIStatus(message){const el=document.querySelector('#gs-ai-template-status');if(el)el.textContent=message}
function gsShowAITemplate(){const field=document.querySelector('#gs-ai-template-text');if(field)field.value=gsAIPlanTemplate()}
async function gsCopyAITemplate(){
 const text=gsAIPlanTemplate();
 try{if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(text);gsAIStatus('Template and complete exercise list copied. Paste them into your AI chat.')}
 catch{const details=document.querySelector('.gs-ai-template details');if(details)details.open=true;gsShowAITemplate();const field=document.querySelector('#gs-ai-template-text');field?.focus();field?.select();field?.setSelectionRange(0,field.value.length);let copied=false;try{copied=!!document.execCommand?.('copy')}catch{}gsAIStatus(copied?'Template and complete exercise list copied.':'Automatic copying is unavailable here. Copy the selected text, or use Download template.')}
}
function gsDownloadAITemplate(){const blob=new Blob([gsAIPlanTemplate()],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='AI-Garage-Session-Planner.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);gsAIStatus('Planner downloaded. Upload it to your chosen AI with your workout requirements in the same message. Import the completed JSON plan in More → Import Training Plan.')}
