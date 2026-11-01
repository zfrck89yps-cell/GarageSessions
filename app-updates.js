/* Updates replace app assets only. The training database keeps its existing key. */
const GS_BUILD='2026-11-01.3';
let gsUpdateRegistration=null,gsUpdateChecking=false,gsUpdateMessage='',gsUpdateLastCheck=0,gsUpdateRequested=false,gsUpdateReloading=false,gsUpdateControllerChanged=false;
const gsUpdateHadController=!!navigator.serviceWorker?.controller;
function gsUpdateBusy(){return !!builder||!!document.querySelector('#modal')?.open||!!(db.draft&&draftHasProgress(db.draft))||!!(typeof cgRun==='function'&&cgRun()&&!cgRun().complete)||tab==='picker'}
function gsUpdateReady(){return !!gsUpdateRegistration?.waiting||gsUpdateControllerChanged}
function gsUpdatePanel(){return '<div class="card"><h3>APP UPDATES</h3><p>Installed version: <strong>'+GS_BUILD+'</strong></p><p class="gs-update-status" role="status">'+esc(gsUpdateMessage||'Updates keep your saved workouts and history on this device.')+'</p><button class="btn secondary" onclick="gsCheckForUpdates(true)" '+(gsUpdateChecking?'disabled':'')+'>CHECK FOR UPDATES</button></div>'}
const gsSettingsUpdates=settings;settings=function(){return gsSettingsUpdates()+gsUpdatePanel()};
function gsUpdatePaint(){
 document.querySelectorAll('.gs-update-status').forEach(e=>{e.textContent=gsUpdateMessage||'Updates keep your saved workouts and history on this device.'});
 let banner=document.querySelector('#gs-update-banner');
 if(!gsUpdateReady()){banner?.remove();document.body.classList.remove('gs-update-visible');return}
 document.body.classList.add('gs-update-visible');
 if(!banner){banner=document.createElement('aside');banner.id='gs-update-banner';banner.setAttribute('aria-label','App update');document.body.append(banner)}
 const busy=gsUpdateBusy(),key=String(busy)+String(gsUpdateRequested);
 if(banner.dataset.state===key)return;banner.dataset.state=key;
 banner.innerHTML='<div><strong>Update available</strong><p>'+(busy?'Ready to install after your workout or editing is finished.':'Your saved workouts and history will stay in place.')+'</p></div><button class="btn" onclick="gsApplyUpdate()">'+(busy?(gsUpdateRequested?'UPDATE QUEUED':'UPDATE WHEN FINISHED'):'UPDATE NOW')+'</button>';
}
function gsWatchUpdate(worker){if(!worker)return;worker.addEventListener('statechange',()=>{if(worker.state==='installed'){gsUpdateMessage=gsUpdateRegistration?.waiting?'Update downloaded and ready.':'App is ready for offline use.';gsUpdatePaint()}else if(worker.state==='redundant'){gsUpdateMessage='The update could not be downloaded. Your current version is still available.';gsUpdatePaint()}})}
async function gsCheckForUpdates(manual=false){
 if(navigator.onLine===false){gsUpdateMessage='You’re offline. Updates will be checked when you reconnect.';gsUpdatePaint();return}
 if(gsUpdateChecking)return;
 if(!('serviceWorker' in navigator)){gsUpdateMessage='Updates are not supported in this browser.';gsUpdatePaint();return}
 if(!manual&&Date.now()-gsUpdateLastCheck<60000)return;
 gsUpdateLastCheck=Date.now();gsUpdateChecking=true;if(manual)gsUpdateMessage='Checking for updates…';gsUpdatePaint();
 try{
  if(!gsUpdateRegistration)await gsInitUpdates();
  if(!gsUpdateRegistration)throw Error('Registration unavailable');
  await gsUpdateRegistration.update();
  const worker=gsUpdateRegistration.installing;
  if(worker){gsUpdateMessage='Downloading update…';gsUpdatePaint();await new Promise((resolve,reject)=>{let timer;const changed=()=>{if(worker.state==='installed'||worker.state==='activated'){clearTimeout(timer);worker.removeEventListener('statechange',changed);resolve()}else if(worker.state==='redundant'){clearTimeout(timer);worker.removeEventListener('statechange',changed);reject(Error('Download failed'))}};timer=setTimeout(()=>{worker.removeEventListener('statechange',changed);reject(Error('Download timed out'))},30000);worker.addEventListener('statechange',changed);changed()})}
  gsUpdateMessage=gsUpdateReady()?'Update downloaded and ready.':'You’re up to date.';
 }catch{gsUpdateMessage=navigator.onLine===false?'You’re offline. Updates will be checked when you reconnect.':'Could not check for updates. Try again when you have a connection.'}
 finally{gsUpdateChecking=false;if(navigator.onLine===false)gsUpdateMessage='You’re offline. Updates will be checked when you reconnect.';gsUpdatePaint()}
}
function gsSaveBeforeUpdate(){save();if(localStorage.getItem(KEY)!==JSON.stringify(db))throw Error('Save could not be verified')}
function gsReloadForUpdate(){if(gsUpdateReloading||gsUpdateBusy())return;try{gsSaveBeforeUpdate()}catch{gsUpdateRequested=false;gsUpdateMessage='Could not save your latest changes. Update postponed; export a backup from More.';gsUpdatePaint();return}gsUpdateReloading=true;window.location.reload()}
function gsApplyUpdate(){
 if(!gsUpdateReady())return;gsUpdateRequested=true;
 if(gsUpdateBusy()){gsUpdateMessage='Update queued until your workout or editing is finished.';gsUpdatePaint();return}
 try{gsSaveBeforeUpdate()}catch{gsUpdateRequested=false;gsUpdateMessage='Could not save your latest changes. Update postponed; export a backup from More.';gsUpdatePaint();return}
 if(gsUpdateControllerChanged){gsReloadForUpdate();return}
 gsUpdateMessage='Installing update…';gsUpdatePaint();
 try{gsUpdateRegistration.waiting.postMessage({type:'GS_SKIP_WAITING'})}catch{gsUpdateRequested=false;gsUpdateMessage='Could not start the update. Please try again.';gsUpdatePaint()}
}
let gsUpdateInitPromise=null;
function gsInitUpdates(){
 if(!('serviceWorker' in navigator))return Promise.resolve(null);
 if(gsUpdateInitPromise)return gsUpdateInitPromise;
 gsUpdateInitPromise=navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(reg=>{gsUpdateRegistration=reg;reg.addEventListener('updatefound',()=>gsWatchUpdate(reg.installing));gsWatchUpdate(reg.installing);gsUpdatePaint();return reg}).catch(()=>{gsUpdateInitPromise=null;return null});return gsUpdateInitPromise;
}
if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('controllerchange',()=>{
 if(!gsUpdateHadController&&!gsUpdateRequested)return;
 gsUpdateControllerChanged=true;gsUpdateMessage='Update ready to open.';
 if(gsUpdateRequested&&!gsUpdateBusy())gsReloadForUpdate();else gsUpdatePaint();
});
const gsRenderUpdates=render;render=function(){gsRenderUpdates();gsUpdatePaint()};
setInterval(()=>{if(gsUpdateRequested&&gsUpdateReady()&&!gsUpdateBusy()&&!gsUpdateReloading)gsApplyUpdate();else gsUpdatePaint()},1000);
setInterval(()=>{if(document.visibilityState==='visible')gsCheckForUpdates()},15*60*1000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')gsCheckForUpdates()});
window.addEventListener('online',()=>gsCheckForUpdates());window.addEventListener('focus',()=>gsCheckForUpdates());
const gsUpdateStyle=document.createElement('style');gsUpdateStyle.textContent='#gs-update-banner{position:fixed;left:0;right:0;bottom:calc(74px + env(safe-area-inset-bottom));z-index:900;background:#242424;border-top:2px solid #c6ff00;padding:12px 16px max(12px,env(safe-area-inset-bottom));display:flex;flex-wrap:wrap;gap:12px;align-items:center;box-sizing:border-box}#gs-update-banner>div{flex:1 1 190px}#gs-update-banner p{margin:5px 0;font-size:.85rem}#gs-update-banner button{white-space:normal}body.gs-update-visible #app{padding-bottom:190px}';document.head.append(gsUpdateStyle);
gsInitUpdates().then(reg=>{if(reg)gsCheckForUpdates()});
