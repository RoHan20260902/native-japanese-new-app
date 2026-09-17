const {chromium}=require('/Users/RiRosen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');const path=require('path');const root=__dirname;const specs=JSON.parse(fs.readFileSync(path.join(root,'spec.json')));
(async()=>{const b=await chromium.launch({headless:true,channel:'chrome'});const p=await b.newPage({viewport:{width:1100,height:1000},deviceScaleFactor:1.5});await p.goto('http://localhost:8100',{waitUntil:'domcontentloaded'});await p.evaluate(()=>document.fonts.ready);const out=[];const missing=[];
for(const s of specs){if(process.env.ONLY_SCREENS&&!process.env.ONLY_SCREENS.split(",").includes(s.id))continue;await p.reload({waitUntil:'domcontentloaded'});await p.evaluate(page=>setPage(page),s.page);await p.waitForTimeout(320);
const sel=(q)=>p.locator(q).first();
if(s.setup==='grammar'){await p.evaluate(()=>setPage('lesson-detail'));await sel('[data-page="lesson-detail"] .grammar-tag-row span').click()}
if(s.setup==='learning-toggle'){const button=sel('[data-page="'+s.page+'"] [data-action="toggle-complete"]');await button.click();await button.evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}))}
if(s.setup==='podcast')await p.evaluate(()=>openPodcastDetail(0));
if(s.setup==='success')await p.evaluate(()=>{setMembershipActive(true);setPage('membership-success')});
if(s.setup==='resume')await p.evaluate(()=>{setMembershipActive(true);setPage('lesson-detail');setPage('home')});
if(s.setup==='paid')await p.evaluate(()=>setMembershipActive(true));
const actions={notice:'open-sheet',rules:'open-level-rules',logout:'logout',nickname:'open-nickname',avatar:'open-avatar'};
if(actions[s.setup])await sel('[data-page="'+s.page+'"] [data-action="'+actions[s.setup]+'"]').click();
if(s.setup==='recording'){await sel('[data-page="lesson-detail"] .dialogue-list button:not([data-action])').dispatchEvent('pointerdown')}
if(s.setup==='rating'){await p.evaluate(()=>{for(let i=0;i<6;i++)maybeShowRatingPrompt()})}
if(s.setup==='playback')await sel('[data-page="level-n1"] .level-list-head button').click();
if(s.setup==='filter'||s.setup==='sort')await sel('[data-page="course"] [data-tool="'+s.setup+'"]').click();
if(s.setup==='favorite-podcast')await sel('[data-favorite-filter="podcast"]').click();
await p.waitForTimeout(350);
const phone=await p.locator('.phone').boundingBox();let pending=[];
for(const a of s.annotations){const query=a.selector.startsWith('GLOBAL ')?a.selector.slice(7):'[data-page="'+s.page+'"] '+a.selector;const loc=sel(query);if(!await loc.count()||!await loc.isVisible()){missing.push([s.id,query]);continue}pending.push({...a,query})}
let seq=0;
while(pending.length){if(seq>12)throw Error('too many captures '+s.id);if(seq)await sel(pending[0].query).evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));await p.waitForTimeout(120);const scroll=await sel('[data-page="'+s.page+'"]').evaluate(e=>e.scrollTop);let visible=[];let rest=[];const clip=await p.locator('.app').boundingBox();for(const a of pending){const r=await sel(a.query).boundingBox();const y=r.y+r.height/2;const global=a.selector.startsWith('GLOBAL ');if(y>=phone.y+8&&y<=(global?phone.y+phone.height-8:clip.y+clip.height-8)&&(global||r.y+r.height<=clip.y+clip.height-4)&&r.height<800&&visible.length<6){visible.push({...a,rect:a.anchorRect||{x:r.x-phone.x,y:r.y-phone.y,width:r.width,height:r.height}})}else rest.push(a)}
if(!visible.length){if(!seq){seq++;pending=rest;continue}throw Error('No visible targets '+s.id+' '+JSON.stringify(rest))}
const id=s.id+'-'+seq;await p.locator('.phone').screenshot({path:path.join(root,'screens',id+'.png')});out.push({...s,id,sourceId:s.id,state:s.state||(seq?'下方内容':'页面概览'),scroll,image:'screens/'+id+'.png',annotations:visible});console.log(id,visible.length,'callouts');pending=rest;seq++}
}
let result=out;if(process.env.ONLY_SCREENS){const prior=JSON.parse(fs.readFileSync(path.join(root,'captures.json')));result=specs.flatMap(s=>out.some(v=>v.sourceId===s.id)?out.filter(v=>v.sourceId===s.id):prior.filter(v=>v.sourceId===s.id))}fs.writeFileSync(path.join(root,'captures.json'),JSON.stringify(result,null,2));fs.writeFileSync(path.join(root,'missing.json'),JSON.stringify(missing,null,2));console.log('DONE',out.length,'views. Missing:',missing);await b.close()})().catch(e=>{console.error(e);process.exit(1)});
