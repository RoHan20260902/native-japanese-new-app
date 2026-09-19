// Stable, field-level user edits layered over each newly published baseline.
const key='native-japanese-handoff-user-edits';
let screens=JSON.parse(document.getElementById('initial').textContent);
const baseline=structuredClone(screens), baselineMap=new Map(baseline.map(s=>[s.id,s]));
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
let editState={schema:1,pages:{},deleted:[]};
try{
 const raw=localStorage.getItem(key);
 if(raw){const parsed=JSON.parse(raw);if(parsed.schema===1)editState=parsed;}
 else {
  // Legacy saves contain entire pages; preserve them conservatively, without deleting old keys.
  const legacyKeys=Object.keys(localStorage).filter(k=>/^native-japanese-handoff-v\d+$/.test(k)).sort((a,b)=>Number(b.match(/\d+$/)[0])-Number(a.match(/\d+$/)[0]));
  const legacy=legacyKeys.length?JSON.parse(localStorage.getItem(legacyKeys[0])):null;
  if(legacy){
   editState.deleted=legacy.__deletedViews||[];
   for(const s of screens)if(Array.isArray(legacy[s.id])&&!equal(legacy[s.id],s.annotations.map(({uid,...a})=>a))){
    const old=legacy[s.id];
    // Old files lack stable identities. Prefer title matching, then numeric identity.
    for(const a of old)if(!a.uid){const match=s.annotations.find(b=>b.title===a.title)||s.annotations.find(b=>b.id===a.id);a.uid=match?.uid||('user-legacy-'+s.id+'-'+a.id);}
    editState.pages[s.id]={legacy:old};
   }
   localStorage.setItem(key,JSON.stringify(editState));
  }
 }
}catch{}
const deletedIds=new Set(editState.deleted||[]);
for(const s of screens){const patch=editState.pages[s.id];if(!patch)continue;
 if(patch.legacy){s.annotations=structuredClone(patch.legacy);continue;}
 s.annotations=s.annotations.filter(a=>!(patch.removed||[]).includes(a.uid)).map(a=>Object.assign(a,patch.fields?.[a.uid]||{}));
 for(const a of patch.added||[])if(!s.annotations.some(b=>b.uid===a.uid))s.annotations.push(structuredClone(a));
 // Keep user-edited annotations even if a later release removes their baseline counterpart.
 for(const [uid,a] of Object.entries(patch.retained||{}))if(!s.annotations.some(b=>b.uid===uid)&&!(patch.removed||[]).includes(uid))s.annotations.push(structuredClone(a));
 s.annotations.forEach((a,i)=>a.id=i+1);
}
const remaining=screens.filter(s=>!deletedIds.has(s.id));if(remaining.length)screens=remaining;else deletedIds.clear();
function persist(){
 screens[current].annotations=items;
 const base=baselineMap.get(screens[current].id)?.annotations||[];
 const patch={fields:{},removed:[],added:[],retained:{}};const seen=new Set();
 for(const a of items){if(!a.uid||seen.has(a.uid))a.uid='user-'+Date.now()+'-'+Math.random().toString(36).slice(2);seen.add(a.uid);
  const b=base.find(b=>b.uid===a.uid);
  if(!b){patch.added.push(structuredClone(a));continue;}
  const changes={};for(const field of Object.keys(a))if(!['id','uid'].includes(field)&&!equal(a[field],b[field]))changes[field]=structuredClone(a[field]);
  if(Object.keys(changes).length){patch.fields[a.uid]=changes;patch.retained[a.uid]=structuredClone(a);}
 }
 patch.removed=base.filter(b=>!items.some(a=>a.uid===b.uid)).map(b=>b.uid);
 editState.pages[screens[current].id]=patch;editState.deleted=[...deletedIds];
 try{localStorage.setItem(key,JSON.stringify(editState));document.getElementById('status').textContent='已自动保存，版本更新后保留';}
 catch{document.getElementById('status').textContent='保存失败，请下载 HTML 备份';}
}
