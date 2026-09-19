from pathlib import Path
import json,re
p=Path('annotated-handoff');f=p/'index.html';s=f.read_text();m=re.search(r'<script[^>]*id="initial"[^>]*>(.*?)</script>',s,re.S);d=json.loads(m[1]);caps={x['id']:x for x in json.loads((p/'captures.json').read_text())}
for v in d:
 for a in v['annotations']:
  match=next((b for b in caps.get(v['id'],{}).get('annotations',[]) if b['title']==a['title']),None)
  a.setdefault('uid',v['id']+'::'+(match['selector'] if match else a['title']))
s=s[:m.start(1)]+json.dumps(d,ensure_ascii=False).replace('<','\\u003c')+s[m.end(1):]
start=s.index("const key='native-japanese-handoff-");end=s.index('let current=0',start)
s=s[:start]+(p/'persistent-edits.js').read_text()+'\n'+s[end:]
# Remove old persist, retaining the new implementation above.
start=s.index('function persist(){try{');end=s.index('function draw()',start);s=s[:start]+s[end:]
s=s.replace("a.id=nextId();a.num=", "a.id=nextId();a.uid='user-'+Date.now()+'-'+Math.random().toString(36).slice(2);a.num=")
s=s.replace("clone.querySelector('#initial').textContent=", "clone.querySelector('#status').textContent='本地自动保存';clone.querySelector('#initial').textContent=")
# Export already has a separate key and contains the user's edited screens.
f.write_text(s)
