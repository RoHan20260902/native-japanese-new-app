from pathlib import Path
import json,base64,re
root=Path('annotated-handoff')
views=json.loads((root/'captures.json').read_text())
excluded=json.loads((root/'excluded-views.json').read_text()) if (root/'excluded-views.json').exists() else []
views=[v for v in views if v['id'] not in excluded]
D=[]
for v in views:
 anns=[];sides={'left':[],'right':[]}
 for i,a in enumerate(sorted(v['annotations'],key=lambda x:x['rect']['y'])):
  r=a['rect'];center=r['x']+r['width']/2
  side='left' if center<190 else 'right'
  if r['width']>220:side='left' if len(sides['left'])<=len(sides['right']) else 'right'
  if len(sides[side])>=3:side='right' if side=='left' else 'left'
  x=50 if side=='left' else 850
  ax=403+r['x']+(min(10,r['width']/2) if side=='left' else r['width']-min(10,r['width']/2))
  ay=95+r['y']+r['height']/2
  desc=a['desc'];lines=[];line='';w=0
  for c in desc:
   cw=0.55 if ord(c)<128 else 1
   if w+cw>20 and c not in '。，；：！？、」』）)]':lines.append(line);line='';w=0
   line+=c;w+=cw
  if line:lines.append(line)
  ann=dict(id=i+1,num=str(i+1),title=a['title'],desc='\n'.join(lines),end=[ax,ay],target=r)
  sides[side].append((ann,x,max(105,min(825,ay-45))))
 for side,entries in sides.items():
  prev=-100
  for i,(a,x,y) in enumerate(entries):
   y=max(y,prev+135);y=min(y,825-(len(entries)-i-1)*135);prev=y
   a.update(box=[x,y,300,110],numPos=[x+24,y+28],titlePos=[x+48,y+34],descPos=[x+20,y+68],start=[x+300 if side=='left' else x,y+55],bend=[378 if side=='left' else 821,y+55]);anns.append(a)
 D.append(dict(id=v['id'],sourceId=v['sourceId'],title=v['title'],group=v['group'],state=('下方内容 '+v['id'].rsplit('-',1)[1] if v['state'].startswith('下方内容') else v['state']),image='data:image/png;base64,'+base64.b64encode((root/v['image']).read_bytes()).decode(),annotations=sorted(anns,key=lambda a:a['id'])))
for view in D:
 for a in view['annotations']:
  if a['title'] in ['筛选课程','调整排序']:
   r=a['target']; is_filter=a['title']=='筛选课程'
   a['end']=[403+r['x']+r['width']-7,95+r['y']+r['height']/2+(-9 if is_filter else 9)]
   a['bend'][0]=807 if is_filter else 833
   if is_filter:a['start'][1]=a['box'][1]+20;a['bend'][1]=a['start'][1]
base=Path('annotated-prototype/index.html').read_text()
base=re.sub(r'<script id="initial".*?</script>',lambda m:'<script id="initial" type="application/json">'+json.dumps(D,ensure_ascii=False).replace('<','\\u003c')+'</script>',base,flags=re.S)
base=re.sub(r'href="data:image/png;base64,[^"]+"','href=""',base,count=1)
base=base.replace('<title>Native Japanese · 首页功能标注</title>','<title>Native Japanese · MVP Annotated UI Handoff</title>')
base=base.replace('<body>','<body class="preview">') if '<body>' in base else base.replace('<header>','<body class="preview"><header>',1)
base=base.replace('/ 首页功能标注','/ MVP 功能标注').replace('ANNOTATED UI PROTOTYPE · 1 SCREEN × 5 FUNCTIONS','ANNOTATED UI HANDOFF · 29 SCREENS · 可编辑交付')
base=base.replace('<button id="preview">查看模式</button>','<button id="preview">编辑模式</button>')
base=base.replace('<main>','<nav class="screen-nav"><div><label for="screenSelect">页面与状态</label><select id="screenSelect"></select></div><div class="tools"><button id="previous">← 上一视图</button><span id="count"></span><button id="next">下一视图 →</button></div></nav><main>')
base=base.replace('<text x="403" y="55"','<text id="screenTitle" x="403" y="55"').replace('首页 · 未开通会员</text>','</text>')
base=base.replace('</style>','.screen-nav{padding:14px 28px;background:#f9fafb;border-bottom:1px solid #dce1e6;display:flex;justify-content:space-between;align-items:center;gap:16px}.screen-nav label{display:inline;margin-right:12px}.screen-nav select{font:inherit;font-size:14px;padding:9px;border:1px solid #ccd3da;border-radius:7px;max-width:450px;background:white}#count{font-size:12px;color:#6a7887}body.preview svg{max-height:calc(100vh - 205px);min-height:620px}svg{min-width:800px}#screenTitle{font-size:13px}@media(max-width:950px){.screen-nav{flex-wrap:wrap}.screen-nav select{max-width:70vw}}</style>')
start=base.index("const key='native-japanese-annotation-v1'")
end=base.index("function el(",start)
base=base[:start]+'''const key='native-japanese-handoff-v17';const screens=JSON.parse(document.getElementById('initial').textContent);let saved={};try{saved=JSON.parse(localStorage.getItem(key))||{}}catch{}for(const s of screens)if(Array.isArray(saved[s.id]))s.annotations=saved[s.id];let current=0,items=screens[0].annotations,selected=null,drag=null,preview=true;const svg=document.getElementById('canvas'),layer=document.getElementById('annotations'),fields=['num','title','desc'];
const menu=document.getElementById('screenSelect');let group;
for(const [i,s] of screens.entries()){if(!group||group.label!==s.group){group=document.createElement('optgroup');group.label=s.group;menu.append(group)}let option=document.createElement('option');option.value=i;option.textContent=s.title+(s.state==='页面概览'?'':' · '+s.state);group.append(option)}
function showScreen(i){current=Math.max(0,Math.min(screens.length-1,Number(i)));items=screens[current].annotations;menu.value=current;document.getElementById('screen').setAttribute('href',screens[current].image);document.getElementById('screenTitle').textContent=screens[current].title+' · '+screens[current].state;document.getElementById('count').textContent=(current+1)+' / '+screens.length;document.getElementById('previous').disabled=current===0;document.getElementById('next').disabled=current===screens.length-1;select(null)}
menu.onchange=()=>showScreen(menu.value);document.getElementById('previous').onclick=()=>showScreen(current-1);document.getElementById('next').onclick=()=>showScreen(current+1);
''' +base[end:]
base=base.replace('localStorage.setItem(key,JSON.stringify(items))',"screens[current].annotations=items;localStorage.setItem(key,JSON.stringify(Object.fromEntries(screens.map(s=>[s.id,s.annotations]))))")
base=base.replace("items=items.filter(a=>a.id!==selected);select(null);persist()","items=items.filter(a=>a.id!==selected);screens[current].annotations=items;select(null);persist()")
# Replace save handler through end with all-screen export.
a=base.index("document.getElementById('save').onclick=")
base=base[:a]+'''document.getElementById('save').onclick=()=>{screens[current].annotations=items;const clone=document.documentElement.cloneNode(true);clone.querySelector('#initial').textContent=JSON.stringify(screens).replace(/</g,'\\\\u003c');clone.querySelector('#annotations').replaceChildren();clone.querySelector('#screen').setAttribute('href','');clone.querySelector('#screenSelect').replaceChildren();clone.querySelector('body').classList.add('preview');clone.querySelector('#preview').textContent='编辑模式';let source='<!doctype html>\\n'+clone.outerHTML;source=source.replace(/const key='native-japanese-handoff-[^']*'/,"const key='native-japanese-handoff-"+Date.now()+"'");let url=URL.createObjectURL(new Blob([source],{type:'text/html'}));let link=document.createElement('a');link.href=url;link.download='Native-Japanese-MVP-Handoff.html';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};showScreen(0);
</script></body></html>'''
(root/'index.html').write_text(base)
print('Built',len(D),'views,',sum(len(x['annotations']) for x in D),'annotations;',round(len(base)/1024/1024,1),'MB')
