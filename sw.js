// One complete asset cache per release; failed downloads leave the old release active.
const CACHE='garage-sessions-v14';
const ASSETS=['./','./index.html','./app-updates.js','./ai-plan-template.js','./workout-tools.js','./cardio-guide.js','./exercise-db.js','./exercise-details.js','./exercise-additions.js','./manifest.webmanifest','./icon-original.svg','./apple-touch-icon-180.png','./assets/technique/airbike-0.svg','./assets/technique/airbike-1.svg','./assets/technique/arc-0.svg','./assets/technique/arc-1.svg','./assets/technique/bike-0.svg','./assets/technique/bike-1.svg','./assets/technique/elliptical-0.svg','./assets/technique/elliptical-1.svg','./assets/technique/fedb328-0.svg','./assets/technique/fedb328-1.svg','./assets/technique/fedb331-0.svg','./assets/technique/fedb331-1.svg','./assets/technique/hipthrust-0.svg','./assets/technique/hipthrust-1.svg','./assets/technique/recumbentcycle-0.svg','./assets/technique/recumbentcycle-1.svg','./assets/technique/rowerg-0.svg','./assets/technique/rowerg-1.svg','./assets/technique/rucking-0.svg','./assets/technique/rucking-1.svg','./assets/technique/running-0.svg','./assets/technique/running-1.svg','./assets/technique/skierg-0.svg','./assets/technique/skierg-1.svg','./assets/technique/splitstance-0.svg','./assets/technique/splitstance-1.svg','./assets/technique/stairclimber-0.svg','./assets/technique/stairclimber-1.svg','./assets/technique/staple10-0.svg','./assets/technique/staple10-1.svg','./assets/technique/staple21-0.svg','./assets/technique/staple21-1.svg','./assets/technique/staple33-0.svg','./assets/technique/staple33-1.svg','./assets/technique/staple64-0.svg','./assets/technique/staple64-1.svg','./assets/technique/staple66-0.svg','./assets/technique/staple66-1.svg','./assets/technique/treadmill-0.svg','./assets/technique/treadmill-1.svg','./assets/technique/uprightcycle-0.svg','./assets/technique/uprightcycle-1.svg','./assets/technique/walking-0.svg','./assets/technique/walking-1.svg','./assets/technique/yoga-0.svg','./assets/technique/yoga-1.svg'];
const CORE=new Set(ASSETS.map(path=>new URL(path,self.registration.scope).href));
self.addEventListener('install',event=>event.waitUntil((async()=>{
 try{const cache=await caches.open(CACHE);await cache.addAll(ASSETS.map(path=>new Request(new URL(path,self.registration.scope),{cache:'reload'})))}
 catch(error){await caches.delete(CACHE);throw error}
})()));
self.addEventListener('message',event=>{if(event.data?.type==='GS_SKIP_WAITING')event.waitUntil(self.skipWaiting())});
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const keys=await caches.keys();await Promise.all(keys.filter(key=>key.startsWith('garage-sessions-')&&key!==CACHE).map(key=>caches.delete(key)));
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;
 const appEntry=new URL('./',self.registration.scope).pathname;
 const isEntry=url.pathname===appEntry||url.pathname===appEntry+'index.html';
 const coreURL=isEntry?new URL('./index.html',self.registration.scope).href:url.origin+url.pathname;
 if(!CORE.has(coreURL))return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE);return (await cache.match(coreURL))||fetch(event.request)})());
});
