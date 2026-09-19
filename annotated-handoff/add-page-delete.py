"""Add page deletion to the generated single-file editor (idempotent)."""
from pathlib import Path
p=Path('annotated-handoff/index.html');s=p.read_text()
if 'id="deleteScreen"' not in s:
 s=s.replace('<button id="next">下一视图 →</button>','<button id="next">下一视图 →</button><button id="deleteScreen" class="edit-only">删除当前页面</button>')
 s=s.replace("const screens=JSON.parse", "let screens=JSON.parse",1)
 needle="for(const s of screens)if(Array.isArray(saved[s.id]))s.annotations=saved[s.id];"
 s=s.replace(needle,needle+"const deletedIds=new Set(Array.isArray(saved.__deletedViews)?saved.__deletedViews:[]);const remaining=screens.filter(s=>!deletedIds.has(s.id));if(remaining.length)screens=remaining;else deletedIds.clear();")
 s=s.replace("const menu=document.getElementById('screenSelect');let group;", "const menu=document.getElementById('screenSelect');function rebuildMenu(){menu.replaceChildren();let group;")
 s=s.replace("group.append(option)}\nfunction showScreen", "group.append(option)}}rebuildMenu();\nfunction showScreen")
 s=s.replace("document.getElementById('count').textContent=(current+1)+' / '+screens.length;", "document.getElementById('count').textContent=(current+1)+' / '+screens.length;document.getElementById('deleteScreen').disabled=screens.length<=1;")
 s=s.replace("JSON.stringify(Object.fromEntries(screens.map(s=>[s.id,s.annotations])))", "JSON.stringify({...Object.fromEntries(screens.map(s=>[s.id,s.annotations])),__deletedViews:[...deletedIds]})")
 needle="function el(name,attrs,text)"
 handler="""document.getElementById('deleteScreen').onclick=()=>{if(preview||screens.length<=1)return;const screen=screens[current];if(!window.confirm('删除当前页面「'+screen.title+' · '+screen.state+'」及其全部标注？'))return;drag=null;deletedIds.add(screen.id);screens.splice(current,1);rebuildMenu();showScreen(Math.min(current,screens.length-1));persist();};
"""
 s=s.replace(needle,handler+needle)
 p.write_text(s)
