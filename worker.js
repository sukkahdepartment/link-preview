const HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Link Preview</title>
<style>
:root{--bg:#0e1015;--card:#171a22;--line:#262a36;--txt:#f2f4f8;--mut:#9aa1b2;--acc:#6c8cff}
*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(1000px 500px at 50% -10%,#1b2140,var(--bg));color:var(--txt);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;display:flex;justify-content:center;padding:48px 16px}
main{width:100%;max-width:620px}h1{font-size:28px;margin:0 0 6px}p.sub{color:var(--mut);margin:0 0 24px}
form{display:flex;gap:8px}input{flex:1;min-width:0;padding:14px 16px;border-radius:12px;border:1px solid var(--line);background:var(--card);color:var(--txt);font-size:16px;outline:none}
input:focus{border-color:var(--acc)}button{padding:0 20px;border:0;border-radius:12px;background:var(--acc);color:#fff;font-weight:600;font-size:16px;cursor:pointer}button:disabled{opacity:.6}
#out{margin-top:24px}.card{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden}
.card img.hero{width:100%;display:block;aspect-ratio:16/9;object-fit:cover;background:#000}
.body{padding:16px 18px}.site{display:flex;align-items:center;gap:8px;color:var(--mut);font-size:13px;margin-bottom:8px}.site img{width:16px;height:16px;border-radius:3px}
.title{font-size:19px;font-weight:700;line-height:1.3;margin:0 0 8px}.desc{color:#c3c8d6;font-size:14px;line-height:1.5;margin:0 0 12px;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.meta{color:var(--mut);font-size:13px;margin-bottom:12px}a.open{color:var(--acc);text-decoration:none;font-weight:600;font-size:14px;word-break:break-all}
.err{color:#ff8a8a;background:#2a1717;border:1px solid #4a2525;padding:12px 14px;border-radius:12px}.sk{height:260px;border-radius:16px;background:linear-gradient(90deg,var(--card),#20242f,var(--card));background-size:200% 100%;animation:s 1.2s infinite}@keyframes s{to{background-position:-200% 0}}
</style></head><body><main>
<h1>Link Preview</h1><p class="sub">Paste any link to see its thumbnail, title and details.</p>
<form id="f"><input id="u" type="text" inputmode="url" placeholder="https://..." autocomplete="off" autofocus><button id="b">Preview</button></form>
<div id="out"></div></main>
<script>
const f=document.getElementById('f'),u=document.getElementById('u'),out=document.getElementById('out'),b=document.getElementById('b');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function go(v){
  v=v.trim();if(!v)return;if(!/^https?:\\/\\//i.test(v))v='https://'+v;
  b.disabled=true;out.innerHTML='<div class="sk"></div>';
  history.replaceState(null,'','?url='+encodeURIComponent(v));
  try{
    const r=await fetch('/api/preview?url='+encodeURIComponent(v));const d=await r.json();
    if(!r.ok)throw new Error(d.error||'Could not load preview');
    out.innerHTML='<div class="card">'+(d.image?'<img class="hero" src="'+esc(d.image)+'" alt="" referrerpolicy="no-referrer" onerror="this.remove()">':'')+
    '<div class="body"><div class="site">'+(d.favicon?'<img src="'+esc(d.favicon)+'" alt="" referrerpolicy="no-referrer" onerror="this.remove()">':'')+'<span>'+esc(d.siteName||d.host)+'</span></div>'+
    '<h2 class="title">'+esc(d.title||d.host)+'</h2>'+(d.description?'<p class="desc">'+esc(d.description)+'</p>':'')+
    (d.author?'<div class="meta">By '+esc(d.author)+'</div>':'')+'<a class="open" href="'+esc(d.url)+'" target="_blank" rel="noopener">'+esc(d.url)+'</a></div></div>';
  }catch(e){out.innerHTML='<div class="err">'+esc(e.message)+'</div>'}
  b.disabled=false;
}
f.addEventListener('submit',e=>{e.preventDefault();go(u.value)});
const q=new URLSearchParams(location.search).get('url');if(q){u.value=q;go(q)}
</script></body></html>`;

const json=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json;charset=utf-8','cache-control':'public, max-age=300'}});
const decode=s=>(s||'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#0?39;|&apos;/g,"'").replace(/&#x([0-9a-f]+);/gi,(_,h)=>String.fromCodePoint(parseInt(h,16))).replace(/&#(\d+);/g,(_,d)=>String.fromCodePoint(+d)).trim();
function badHost(h){h=h.toLowerCase();return h==='localhost'||h.endsWith('.local')||h.endsWith('.internal')||/^\d+\.\d+\.\d+\.\d+$/.test(h)||h.includes(':')||!h.includes('.')}
function ytId(u){const h=u.hostname.replace(/^www\.|^m\./,'');
  if(h==='youtu.be')return u.pathname.slice(1).split('/')[0];
  if(h==='youtube.com'||h==='music.youtube.com'){if(u.pathname==='/watch')return u.searchParams.get('v');const m=u.pathname.match(/^\/(shorts|embed|live)\/([\w-]{6,})/);if(m)return m[2]}
  return null}
function metas(html){const o={};const re=/<meta\s+[^>]*>/gi;let m;
  while((m=re.exec(html))){const t=m[0];const k=(t.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i)||[])[1];const c=(t.match(/content\s*=\s*["']([^"']*)["']/i)||[])[1];if(k&&c!=null&&!(k.toLowerCase() in o))o[k.toLowerCase()]=decode(c)}
  return o}
async function preview(raw){
  let u;try{u=new URL(raw)}catch{return[{error:'That does not look like a valid link.'},400]}
  if(!/^https?:$/.test(u.protocol)||badHost(u.hostname))return[{error:'Only public http(s) links are supported.'},400];
  const host=u.hostname.replace(/^www\./,'');const out={url:u.href,host,favicon:'https://www.google.com/s2/favicons?domain='+u.hostname+'&sz=64'};
  const id=ytId(u);
  if(id){out.siteName='YouTube';out.image='https://i.ytimg.com/vi/'+id+'/hqdefault.jpg';
    try{const r=await fetch('https://www.youtube.com/oembed?format=json&url='+encodeURIComponent('https://www.youtube.com/watch?v='+id));
      if(r.ok){const d=await r.json();out.title=d.title;out.author=d.author_name;out.description='Video by '+d.author_name+' on YouTube'}
      else if(r.status===401||r.status===403||r.status===404){return[{error:'That YouTube video is unavailable or private.'},404]}}catch{}
    try{const h=await fetch('https://i.ytimg.com/vi/'+id+'/maxresdefault.jpg',{method:'HEAD'});if(h.ok)out.image='https://i.ytimg.com/vi/'+id+'/maxresdefault.jpg'}catch{}
    return[out,200]}
  let res;try{res=await fetch(u.href,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 (compatible; LinkPreviewBot/1.0)','accept':'text/html,application/xhtml+xml'},cf:{cacheTtl:300}})}catch{return[{error:'Could not reach that site.'},502]}
  const ct=res.headers.get('content-type')||'';
  if(ct.startsWith('image/')){out.image=res.url;out.title=u.pathname.split('/').pop()||host;out.siteName=host;return[out,200]}
  if(!ct.includes('html')&&!ct.includes('xml'))return[{error:'That link is not a web page (type: '+(ct.split(';')[0]||'unknown')+').'},415];
  const text=(await res.text()).slice(0,400000);const head=text.slice(0,200000);const m=metas(head);
  const fin=new URL(res.url);
  const abs=p=>{try{return p?new URL(p,fin).href:undefined}catch{}};
  const tt=(head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1];
  out.title=m['og:title']||m['twitter:title']||decode(tt);
  out.description=m['og:description']||m['twitter:description']||m['description'];
  out.image=abs(m['og:image']||m['og:image:url']||m['twitter:image']||m['twitter:image:src']);
  out.siteName=m['og:site_name']||fin.hostname.replace(/^www\./,'');
  out.author=m['author']||(m['article:author']&&!/^https?:/.test(m['article:author'])?m['article:author']:undefined);
  out.url=m['og:url']&&/^https?:/.test(m['og:url'])?m['og:url']:fin.href;
  const ic=(head.match(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*>/i)||[''])[0].match(/href=["']([^"']+)["']/i);
  if(ic)out.favicon=abs(ic[1])||out.favicon;
  if(!out.title&&!out.image&&!out.description)return[{error:'No preview info found for that page (it may block bots).'},422];
  return[out,200]}
export default{async fetch(req){
  const url=new URL(req.url);
  if(url.pathname==='/api/preview'){const [o,s]=await preview(url.searchParams.get('url')||'');return json(o,s)}
  return new Response(HTML,{headers:{'content-type':'text/html;charset=utf-8'}})}}
