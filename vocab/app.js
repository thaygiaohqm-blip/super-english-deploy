(function(){
const {esc,shuffle,store,speak,toast,norm}=SE;
const prog=store('se:vocab');
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const main=$('#main'),H1=$('#h1'),LEAD=$('#lead'),CRUMB=$('#crumb'),META=$('#meta'),Q=$('#q');
const LV=Object.fromEntries(SE_LEVELS.map(l=>[l.id,l]));
const cache={},byId={};
function load(lv){return new Promise(res=>{
  if(cache[lv])return res(cache[lv]);
  if(!LV[lv]||LV[lv].state!=='ready')return res(null);
  const s=document.createElement('script');s.src='data/'+lv+'.js';
  s.onload=()=>{const d=window.SE_VOCAB[lv];d.items.forEach(e=>{e.lv=lv;byId[e.id]=e});cache[lv]=d;res(d)};
  s.onerror=()=>res(null);document.head.appendChild(s)})}
const loadAll=()=>Promise.all(SE_LEVELS.filter(l=>l.state==='ready').map(l=>load(l.id)));
const head=(o)=>{H1.textContent=o.h1;LEAD.textContent=o.lead||'';CRUMB.innerHTML=o.crumb||'';META.innerHTML=(o.meta||[]).map(x=>'<span class="chip">'+esc(x)+'</span>').join('')};
const ICON='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>';
const spk=(t,l)=>'<button class="icon-btn" type="button" data-say="'+esc(t)+'" aria-label="Nghe phát âm">'+ICON+' '+(l||'Nghe')+'</button>';
const bindSay=r=>$$('[data-say]',r).forEach(b=>b.onclick=ev=>{ev.stopPropagation();speak(b.dataset.say)});
const hlWord=(e)=>{const c=e.c;if(!c)return '';let out=esc(c);for(const a of e.a||[]){const re=new RegExp('(^|[^A-Za-z])('+a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')(?![A-Za-z])','i');if(re.test(c)){return esc(c).replace(new RegExp('(^|[^A-Za-z])('+esc(a).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')(?![A-Za-z])','i'),'$1<em>$2</em>')}}return out};
const state=e=>prog.get(e.id);
const needs=id=>prog.get(id)==='rv'||prog.get('x:'+id)==='rv';
const needIds=()=>Object.entries(prog.all()).filter(([k,v])=>v==='rv').map(([k])=>k.replace(/^x:/,'')).filter((v,i,a)=>a.indexOf(v)===i);
/* "Đã học xong" của một từ chỉ tính từ flashcard (Đã nhớ) và Điền từ (gõ đúng/sai gần nhất). Trắc nghiệm, ghép cặp, danh sách không tính. */
const mastered=id=>{const w=prog.get('w:'+id);return w==='ok'||(w!=='no'&&prog.get(id)==='ok')};
const stat=(ids)=>{let ok=0,rv=0;ids.forEach(i=>{if(mastered(i))ok++;if(prog.get(i)==='rv')rv++});return{ok,rv,pct:ids.length?Math.round(ok/ids.length*100):0}};

/* ---------------- trang chủ ---------------- */
async function home(){
  head({h1:'Super Vocab',lead:'Từ vựng tiếng Anh theo cụm từ, chia theo cấp độ CEFR. Mỗi cấp chia thành các gói nhỏ để học bằng flashcard, trắc nghiệm, điền từ và ghép cặp.',meta:['A1 → C2','Học theo cụm từ ghép','Có tìm kiếm']});
  const rv=needIds().length;
  main.innerHTML='<h2 class="sect">Chọn cấp độ</h2><div class="grid">'+SE_LEVELS.map(l=>{
    const total=cache[l.id]?cache[l.id].items.length:null;
    if(l.state!=='ready')return '<div class="card-l soon"><span class="big">'+l.name+'</span><h3>'+esc(l.en)+'</h3><p>'+esc(l.note)+'</p><span class="tag warn">Sắp có</span></div>';
    return '<a class="card-l" href="#/'+l.id+'" data-lv="'+l.id+'"><span class="big">'+l.name+'</span><h3>'+esc(l.en)+'</h3><p>'+esc(l.note)+'</p><div class="row"><span class="tag" data-count="'+l.id+'">…</span><span class="tag '+(l.src==='official'?'':'warn')+'">'+(l.src==='official'?'Nguồn Cambridge':l.src==='mixed'?'Cambridge + CEFR-J':'CEFR-J/Octanove + biên soạn')+'</span></div><div class="bar"><i data-bar="'+l.id+'" style="width:0"></i></div></a>'}).join('')+'</div>'
  +'<h2 class="sect">Ôn tập</h2><div class="grid"><a class="card-l" href="#/dong-nghia"><h3>Từ đồng nghĩa</h3><p>Hơn 8.000 từ từ A1 đến C2 được gom thành các nhóm đồng nghĩa và cùng trường nghĩa; mỗi từ có nhãn cấp độ, bấm vào để xem chi tiết.</p><div class="row"><span class="tag">A1 → C2</span></div></a><a class="card-l" href="#/on-tap"><h3>Từ cần ôn</h3><p>Những từ bạn đánh dấu "Cần ôn" hoặc trả lời sai sẽ được gom lại ở đây.</p><div class="row"><span class="tag '+(rv?'warn':'')+'">'+rv+' từ</span></div></a></div>'
  +'<div class="note"><b>Về nguồn từ vựng.</b> Cambridge chỉ công bố danh sách từ chính thức đến mức B1 (B1 Preliminary và A2 Key). Từ B2 trở lên họ không có danh sách riêng; ở các cấp đó, trang này sẽ dùng bộ biên soạn theo định hướng English Vocabulary Profile và có ghi chú rõ.</div>';
  for(const l of SE_LEVELS.filter(l=>l.state==='ready')){const d=await load(l.id);if(!d)continue;const c=stat(d.items.map(e=>e.id));
    const t=$('[data-count="'+l.id+'"]');if(t)t.textContent=d.items.length+' từ · '+d.packs.length+' gói';const b=$('[data-bar="'+l.id+'"]');if(b)b.style.width=Math.round(c.ok/d.items.length*100)+'%'}
}
/* ---------------- trang cấp độ ---------------- */
const loadJS=(src,g)=>new Promise(r=>{if(window[g])return r(window[g]);const sc=document.createElement('script');sc.src=src;sc.onload=()=>r(window[g]);sc.onerror=()=>r(null);document.head.appendChild(sc)});
async function level(lv,view){
  const l=LV[lv];const d=await load(lv);if(!d)return notFound();
  head({h1:l.name+' · '+l.en.split(' · ')[0],lead:l.note,crumb:'<a href="#/">Tất cả cấp độ</a>',meta:[d.items.length+' từ và cụm từ',d.packs.length+' gói']});
  const all=stat(d.items.map(e=>e.id));
  main.innerHTML='<div class="row" style="margin-top:22px;justify-content:space-between"><div class="row"><span class="tag">Đã nhớ '+all.ok+'/'+d.items.length+'</span><span class="tag warn">Cần ôn '+all.rv+'</span></div><div class="row"><a class="btn sm ghost" href="#/'+lv+'/ngau-nhien">Ôn ngẫu nhiên 20 từ</a>'+(all.rv?'<a class="btn sm coral" href="#/'+lv+'/can-on">Ôn từ cần ôn ('+all.rv+')</a>':'')+'</div></div>'
  +'<div class="modes vtabs" role="group" aria-label="Cách chia từ" style="margin-top:18px"><a class="vt" href="#/'+lv+'" aria-pressed="'+(view!=='topic')+'">Theo gói (A–Z)</a><a class="vt" href="#/'+lv+'/chu-de" aria-pressed="'+(view==='topic')+'">Theo chủ đề</a></div>'
  +(view==='topic'?await topicGrid(lv,d):'<h2 class="sect">Các gói từ</h2><div class="grid">'+d.packs.map(p=>{const c=stat(p.ids);return '<a class="card-l" href="#/'+lv+'/'+p.id+'"><h3>'+esc(p.name)+'</h3><p>'+esc(p.sub)+'</p><div class="row"><span class="tag">'+p.ids.length+' từ</span>'+(c.ok===p.ids.length?'<span class="tag" style="background:var(--ok-soft);color:var(--ok)">Hoàn thành</span>':c.ok?'<span class="tag">'+c.pct+'% học xong</span>':'')+(c.rv?'<span class="tag warn">'+c.rv+' cần ôn</span>':'')+'</div><div class="bar"><i style="width:'+Math.round(c.ok/p.ids.length*100)+'%"></i></div></a>'}).join('')+'</div>');
}
async function topicGrid(lv,d){
  const T=await loadJS('data/topics.js','SE_TOPICS');if(!T)return '<p class="hint">Không tải được dữ liệu chủ đề.</p>';
  return '<h2 class="sect">Các chủ đề</h2><div class="grid">'+T.names.filter(n=>(T.lv[lv][n[0]]||[]).length).map(n=>{const ids=T.lv[lv][n[0]],c=stat(ids);return '<a class="card-l" href="#/'+lv+'/t-'+n[0]+'"><h3>'+esc(n[1])+'</h3><div class="row"><span class="tag">'+ids.length+' từ</span>'+(c.ok===ids.length?'<span class="tag" style="background:var(--ok-soft);color:var(--ok)">Hoàn thành</span>':c.ok?'<span class="tag">'+c.pct+'% học xong</span>':'')+(c.rv?'<span class="tag warn">'+c.rv+' cần ôn</span>':'')+'</div><div class="bar"><i style="width:'+Math.round(c.ok/ids.length*100)+'%"></i></div></a>'}).join('')+'</div>';
}
/* ---------------- học một gói ---------------- */
async function pack(lv,pid,mode){
  const d=await load(lv);if(!d)return notFound();
  let items,title,back,sub;
  if(pid==='ngau-nhien'){items=shuffle(d.items).slice(0,20);title='Ôn ngẫu nhiên';sub='20 từ bất kỳ trong cấp '+lv.toUpperCase()}
  else if(pid.startsWith('t-')){const T=await loadJS('data/topics.js','SE_TOPICS');const id=pid.slice(2),nm=(T.names.find(n=>n[0]===id)||[0,id])[1];items=(T.lv[lv][id]||[]).map(i=>byId[i]);title=nm;sub=items.length+' từ · chủ đề'}
  else if(pid==='can-on'){items=d.items.filter(e=>needs(e.id));title='Từ cần ôn';sub='Các từ bạn đã đánh dấu hoặc trả lời sai'}
  else{const p=d.packs.find(x=>x.id===pid);if(!p)return notFound();items=p.ids.map(i=>byId[i]);title=p.name+' · '+p.sub;sub=p.ids.length+' từ'}
  head({h1:title,lead:'',crumb:'<a href="#/">Cấp độ</a> › <a href="#/'+lv+(pid.startsWith('t-')?'/chu-de':'')+'">'+lv.toUpperCase()+'</a>',meta:[sub].concat(items.length?['Học xong '+stat(items.map(x=>x.id)).pct+'% (flashcard + điền từ)']:[])});
  if(!items.length){main.innerHTML='<div class="panel" style="margin-top:22px;text-align:center"><h2>Chưa có từ nào ở đây</h2><a class="btn" href="#/'+lv+'">Về danh sách gói</a></div>';return}
  study({items,pool:d.items,mode:mode||'card',back:'#/'+lv+(pid.startsWith('t-')?'/chu-de':''),base:'#/'+lv+'/'+pid})
}
async function review(){
  await loadAll();const ids=needIds();
  const items=ids.map(i=>byId[i]).filter(Boolean);
  head({h1:'Từ cần ôn',lead:'Gom từ mọi cấp độ.',crumb:'<a href="#/">Cấp độ</a>',meta:[items.length+' từ']});
  if(!items.length){main.innerHTML='<div class="panel" style="margin-top:22px;text-align:center"><h2>Chưa có từ nào cần ôn</h2><p>Khi bạn bấm "Cần ôn" ở flashcard hoặc trả lời sai, từ sẽ xuất hiện ở đây.</p><a class="btn" href="#/">Chọn cấp độ để học</a></div>';return}
  const pool=[].concat(...Object.values(cache).map(d=>d.items));
  study({items,pool,mode:'card',back:'#/',base:'#/on-tap'})
}
/* ---------------- công cụ học ---------------- */
function study(cfg){
  const items=cfg.items,pool=cfg.pool;
  let mode=cfg.mode,i=0,flip=false,Qz=null,W=null,M=null,live=true,deck=items.slice(),shuf=false;
  const MODES=[['card','Flashcard'],['quiz','Trắc nghiệm'],['write','Điền từ'],['match','Ghép cặp'],['list','Danh sách']];
  function shell(inner){
    main.innerHTML='<div class="studybar" style="margin-top:22px"><div class="modes" role="group" aria-label="Chế độ học">'+MODES.map(m=>'<button type="button" data-m="'+m[0]+'" aria-pressed="'+(m[0]===mode)+'">'+m[1]+'</button>').join('')+'</div><span class="tag">'+items.length+' từ'+(cfg.parent?' · ôn từ sai (bấm chế độ để về cả gói)':'')+'</span></div><div id="stage" class="stage">'+inner+'</div>';
    $$('[data-m]',main).forEach(b=>b.onclick=()=>{if(cfg.parent){stopStudy();study(Object.assign({},cfg.parent,{mode:b.dataset.m}));return}mode=b.dataset.m;i=0;flip=false;Qz=W=M=null;paint()});
  }
  /* so sánh chữ bạn gõ với đáp án: đỏ = sai/thừa, xanh = chữ cần có */
  function diffHtml(typed,ans){const a=[...typed.toLowerCase()],b=[...ans.toLowerCase()],n=a.length,m=b.length,L=Array.from({length:n+1},()=>new Array(m+1).fill(0));
    for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)L[i][j]=a[i]===b[j]?L[i+1][j+1]+1:Math.max(L[i+1][j],L[i][j+1]);
    let i=0,j=0,t='',c='';while(i<n&&j<m){if(a[i]===b[j]){t+=esc(typed[i]);c+=esc(ans[j]);i++;j++}else if(L[i+1][j]>=L[i][j+1]){t+='<span class="miss">'+esc(typed[i])+'</span>';i++}else{c+='<span class="ok">'+esc(ans[j])+'</span>';j++}}
    while(i<n){t+='<span class="miss">'+esc(typed[i++])+'</span>'}while(j<m){c+='<span class="ok">'+esc(ans[j++])+'</span>'}
    return{t,c}}
  function jud(e,v){prog.set(e.id,v);prog.set('x:'+e.id,null)}
  /* kết quả từ trắc nghiệm / điền từ / ghép cặp: ghi riêng, KHÔNG đè dấu của flashcard */
  function jx(e,v){prog.set('x:'+e.id,v==='rv'?'rv':null)}
  /* flashcard */
  function card(){
    const e=deck[i],st=state(e);let nOk=0,nRv=0;deck.forEach(x=>{const v=state(x);if(v==='ok')nOk++;else if(v==='rv')nRv++});
    shell('<div class="card'+(flip?' flip':'')+'" id="card"><div class="card__in"><div class="face" aria-hidden="'+flip+'"><div class="top"><span>'+esc(e.p||'từ')+'</span><span>'+(st==='ok'?'<span class="state ok">Đã nhớ</span>':st==='rv'?'<span class="state rv">Cần ôn</span>':'')+'</span></div><div class="main"><div class="say'+(e.w.length>22?' sm':'')+'">'+esc(e.w)+'</div>'+SE.ipaH(e.w)+(e.c?'<div class="fcoll">'+esc(e.c)+'</div><span class="ipa ci" style="display:block;text-align:center">'+esc(SE.ipa(e.c))+'</span>':'')+'<div>'+spk(e.w)+(e.c?spk(e.c,'Cụm từ'):'')+'</div></div><div class="hint">Bấm vào thẻ để lật</div></div><div class="face back" aria-hidden="'+!flip+'"><div class="top"><span>'+esc(e.w)+' '+SE.ipaH(e.w)+' · '+esc(e.p)+'</span><span>'+(e.t?'':'')+'</span></div><div class="main"><div class="mean">'+esc(e.vi)+'</div>'+(e.c?'<div class="coll">'+hlWord(e)+'<small>'+esc(e.cv)+'</small></div>':'')+(e.x?'<div class="xmp">Ví dụ Cambridge: '+esc(e.x)+'</div>':'')+'<div class="row" style="justify-content:center">'+spk(e.c||e.w)+'</div></div></div></div></div>'
    +'<div class="jud"><button class="btn rv" data-j="rv" type="button">Cần ôn <small>('+nRv+')</small></button><button class="btn ok" data-j="ok" type="button">Đã nhớ <small>('+nOk+')</small></button></div>'
    +'<div class="nav"><button class="btn ghost sm" id="prev" type="button" '+(i?'':'disabled')+'>← Trước</button><span class="counter">'+(i+1)+' / '+deck.length+'</span><button class="btn ghost sm" id="next" type="button" '+(i<deck.length-1?'':'disabled')+'>Sau →</button></div><div class="row" style="justify-content:center;margin:10px 0"><button class="btn ghost sm" id="shuf" type="button">Xáo trộn thẻ</button>'+(shuf?'<button class="btn ghost sm" id="ord" type="button">Về thứ tự gốc</button>':'')+'</div><p class="hint">Vuốt trái/phải để đổi thẻ · Phím tắt: Space lật · ←/→ chuyển · 1 đã nhớ · 2 cần ôn</p>');
    SE.swipe($('#card'),()=>go(1),()=>go(-1),{l:()=>i<deck.length-1,r:()=>i>0});
    $('#card').onclick=ev=>{if(ev.target.closest('[data-say]'))return;flip=!flip;$('#card').classList.toggle('flip',flip)};
    $('#prev').onclick=()=>go(-1);$('#next').onclick=()=>go(1);
    $('#shuf').onclick=()=>{deck=shuffle(items);shuf=true;i=0;flip=false;toast('Đã xáo trộn '+deck.length+' thẻ');card()};const od=$('#ord');if(od)od.onclick=()=>{deck=items.slice();shuf=false;i=0;flip=false;card()};
    $$('[data-j]').forEach(b=>b.onclick=()=>{jud(e,b.dataset.j);toast(b.dataset.j==='ok'?'Đã đánh dấu: đã nhớ':'Đã đánh dấu: cần ôn');if(i<deck.length-1)go(1);else card()});
    bindSay(main);
  }
  const go=d=>{i=Math.max(0,Math.min(deck.length-1,i+d));flip=false;paint()};
  /* trắc nghiệm */
  function options(e,key,n=3){
    const same=pool.filter(x=>x!==e&&x.p===e.p&&x[key]!==e[key]);const other=pool.filter(x=>x!==e&&x.p!==e.p&&x[key]!==e[key]);
    const out=[],seen=new Set([e[key].toLowerCase()]);
    for(const x of [...shuffle(same).slice(0,40),...shuffle(other).slice(0,40)]){const k=x[key].toLowerCase();if(seen.has(k))continue;seen.add(k);out.push(x);if(out.length>=n)break}
    return shuffle([e,...out]);
  }
  function newQuiz(){Qz={deck:shuffle(items),k:0,right:0,wrong:[],ans:null,cur:null}}
  function quiz(){
    if(!Qz)newQuiz();
    if(Qz.k>=Qz.deck.length)return done('Trắc nghiệm',Qz.right,Qz.deck.length,Qz.wrong,()=>{newQuiz();paint()});
    const e=Qz.deck[Qz.k];
    if(!Qz.cur){const types=['en2vi','vi2en'];if(e.z)types.push('cz','cz');const t=types[Math.random()*types.length|0];Qz.cur={t,opts:options(e,t==='en2vi'?'vi':'w')}}
    const c=Qz.cur;let q,lab;
    if(c.t==='en2vi'){lab='Chọn nghĩa đúng';q='<div class="q"><small>'+lab+'</small>'+esc(e.w)+'<div class="ipa" style="font-size:.5em;font-weight:400">'+esc(SE.ipa(e.w))+'</div></div><div class="row" style="justify-content:center">'+spk(e.w)+'</div>'}
    else if(c.t==='vi2en'){lab='Chọn từ tiếng Anh đúng';q='<div class="q"><small>'+lab+' · '+esc(e.p)+'</small>'+esc(e.vi)+'</div>'}
    else{lab='Điền từ vào chỗ trống';q='<div class="q"><small>'+lab+'</small>'+esc(e.z)+'</div><p class="hint" style="margin:0">'+esc(e.cv)+'</p>'}
    const key=c.t==='en2vi'?'vi':'w';
    shell('<div class="row" style="justify-content:space-between"><span class="counter" style="text-align:left">Câu '+(Qz.k+1)+' / '+Qz.deck.length+'</span><span class="tag">Đúng '+Qz.right+'</span></div>'+q+'<div class="opts">'+c.opts.map((o,n)=>'<button class="opt'+(Qz.ans!=null?(o===e?' ok':(Qz.ans===n?' bad':'')):'')+'" data-o="'+n+'" type="button" '+(Qz.ans!=null?'disabled':'')+'><kbd>'+(n+1)+'</kbd>'+esc(o[key])+'</button>').join('')+'</div>'
      +(Qz.ans!=null?(c.opts[Qz.ans]===e?'<div class="verdict ok">Chính xác!':'<div class="verdict bad">Chưa đúng. Đáp án: '+esc(e[key]))+'<small>'+esc(e.w)+' · '+esc(e.vi)+(e.c?'<br>'+esc(e.c)+' = '+esc(e.cv):'')+'</small></div><div class="nav"><button class="btn" id="nq" type="button">Câu tiếp →</button></div>':''));
    $$('[data-o]').forEach(b=>b.onclick=()=>answerQ(+b.dataset.o));bindSay(main);
    const nq=$('#nq');if(nq)nq.onclick=nextQ;
  }
  function answerQ(n){const e=Qz.deck[Qz.k];if(Qz.ans!=null)return;Qz.ans=n;const ok=Qz.cur.opts[n]===e;if(ok){Qz.right++;jx(e,'ok')}else{Qz.wrong.push(e);jx(e,'rv')}quiz();SE.fx(ok,$('.opt'+(ok?'.ok':'.bad')))}
  function nextQ(){Qz.k++;Qz.ans=null;Qz.cur=null;quiz()}
  /* điền từ */
  function newWrite(){W={deck:shuffle(items),k:0,right:0,wrong:[],checked:false,ok:false,hint:false,pos:null,skip:false,ans:''}}
  function write(){
    if(!W)newWrite();
    if(W.k>=W.deck.length)return done('Điền từ',W.right,W.deck.length,W.wrong,()=>{newWrite();paint()});
    const e=W.deck[W.k];
    if(!W.pos){const idx=[...e.w].map((c,i)=>/[A-Za-z]/.test(c)?i:-1).filter(i=>i>=0);const n=idx.length>4?2:1;W.pos=shuffle(idx).slice(0,n)}
    const h=[...e.w].map((c,i)=>/[A-Za-z0-9]/.test(c)?(W.pos.includes(i)?c:'_'):(c===' '?'  ':c)).join(' ').replace(/ {5}/g,'   ');
    shell('<div class="row" style="justify-content:space-between"><span class="counter" style="text-align:left">Từ '+(W.k+1)+' / '+W.deck.length+'</span><span class="tag">Đúng '+W.right+'</span></div><div class="q"><small>Gõ từ tiếng Anh có nghĩa này · '+esc(e.p)+'</small>'+esc(e.vi)+'</div>'+(e.z?'<p class="hint" style="font-size:16px;margin:4px 0 12px">'+esc(e.z)+'</p>':'')
     +'<input class="input" id="inp" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Gõ đáp án rồi bấm Enter" '+(W.checked?'disabled':'')+'>'
     +(W.hint&&!W.checked?'<p class="hint">Gợi ý: <b>'+esc(h)+'</b></p>':'')
     +(W.checked?'<div class="verdict '+(W.ok?'ok':'bad')+'">'+(W.ok?'Chính xác! ✓ <span class="ipa">'+esc(SE.ipa(e.w))+'</span>':(W.skip?'Không sao, đáp án là: ':'Chưa đúng ✗ — đáp án: ')+'<b>'+esc(e.w)+'</b> <span class="ipa">'+esc(SE.ipa(e.w))+'</span>')+'<small>'+(!W.ok&&!W.skip&&W.ans?(()=>{const best=e.a.slice().sort((x,y)=>Math.abs(x.length-W.ans.length)-Math.abs(y.length-W.ans.length))[0]||e.w,d=diffHtml(W.ans,best);return '<span class="diff" style="font-size:1.05em">Bạn gõ: '+d.t+'<br>Sửa lại: '+d.c+'</span><br>'})():'')+(e.c?esc(e.c)+' = '+esc(e.cv):'')+'</small></div><div class="nav"><button class="btn" id="nw" type="button">Từ tiếp →</button></div>':'<div class="nav"><button class="btn ghost sm" id="hint" type="button">Gợi ý</button><button class="btn ghost sm" id="skip" type="button">Không biết</button><button class="btn" id="chk" type="button">Kiểm tra</button></div>'));
    const inp=$('#inp');if(!W.checked)inp.focus();else{setTimeout(()=>{const n=$('#nw');if(n&&W&&W.checked)n.focus()},460)}
    if(!W.checked){inp.onkeydown=ev=>{if(ev.key==='Enter'){ev.preventDefault();check()}};$('#chk').onclick=check;$('#skip').onclick=()=>{W.lock=Date.now()+450;W.checked=true;W.ok=false;W.skip=true;W.ans='';W.wrong.push(e);prog.set('w:'+e.id,'no');jx(e,'rv');write();SE.fx(false,$('.verdict'))};$('#hint').onclick=()=>{W.hint=true;const v=inp.value;write();$('#inp').value=v;$('#inp').focus()}}
    else{$('#nw').onclick=()=>{if(Date.now()<(W.lock||0))return;nextW()}}
    function check(){const v=norm(inp.value).replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim();if(!v)return;const ok=e.a.some(a=>norm(a).replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim()===v);W.lock=Date.now()+450;W.checked=true;W.ok=ok;W.ans=inp.value.trim();prog.set('w:'+e.id,ok?'ok':'no');if(ok){W.right++;jx(e,'ok')}else{W.wrong.push(e);jx(e,'rv')}write();SE.fx(ok,$('.verdict'))}
    function nextW(){W.k++;W.checked=false;W.ok=false;W.hint=false;W.pos=null;W.skip=false;write()}
  }
  /* ghép cặp */
  function newMatch(){M={deck:shuffle(items),round:0,miss:0,pairs:0,done:{},sel:null,order:null}}
  function match(){
    if(!M)newMatch();
    const per=5,start=M.round*per,set=M.deck.slice(start,start+per);
    if(!set.length)return done('Ghép cặp',M.pairs,M.pairs+M.miss,[],()=>{newMatch();paint()},'Số lần ghép nhầm: '+M.miss);
    if(!M.order)M.order={l:shuffle(set),r:shuffle(set)};
    shell('<div class="row" style="justify-content:space-between"><span class="counter" style="text-align:left">Lượt '+(M.round+1)+' / '+Math.ceil(M.deck.length/per)+'</span><span class="tag">Nhầm '+M.miss+'</span></div><p class="hint" style="margin-top:0">Bấm một từ tiếng Anh, rồi bấm nghĩa tương ứng</p><div class="pairs"><div class="col">'+M.order.l.map(e=>'<button class="pt'+(M.done[e.id]?' done':'')+(M.sel&&M.sel.id===e.id?' sel':'')+'" data-l="'+e.id+'" type="button">'+esc(e.w)+'</button>').join('')+'</div><div class="col">'+M.order.r.map(e=>'<button class="pt'+(M.done[e.id]?' done':'')+'" data-r="'+e.id+'" type="button">'+esc(e.vi)+'</button>').join('')+'</div></div>');
    $$('[data-l]').forEach(b=>b.onclick=()=>{M.sel=byId[b.dataset.l];speak(M.sel.w);match()});
    $$('[data-r]').forEach(b=>b.onclick=()=>{if(!M.sel)return toast('Chọn từ tiếng Anh trước');
      if(M.sel.id===b.dataset.r){M.done[M.sel.id]=1;M.pairs++;jx(M.sel,'ok');SE.fx(true,b);M.sel=null;if(set.every(e=>M.done[e.id])){M.round++;M.order=null}match()}
      else{M.miss++;jx(M.sel,'rv');b.classList.add('wrong');SE.fx(false,b);setTimeout(()=>{b.classList.remove('wrong')},500);$('#stage .tag').textContent='Nhầm '+M.miss}})
  }
  /* danh sách */
  function list(){
    shell('<div class="list" style="max-width:none">'+items.map((e,n)=>'<button class="it" type="button" data-d="'+n+'"><div><b>'+esc(e.w)+'</b> <span class="ipa">'+esc(SE.ipa(e.w))+'</span> <span>'+esc(e.p)+'</span></div><span class="m">'+esc(e.vi)+'</span><span>'+esc(e.c)+(e.cv?' — '+esc(e.cv):'')+'</span></button>').join('')+'</div>');
    $('#stage').style.maxWidth='none';
    $$('[data-d]').forEach(b=>b.onclick=()=>detail(items[+b.dataset.d]))
  }
  function done(name,right,total,wrong,again,extra){
    shell('<div class="panel done"><div class="ring" style="--p:'+Math.round(right/Math.max(1,total)*100)+'"><b>'+right+'/'+total+'</b></div><h2>Hoàn thành: '+name+'</h2><p>'+(extra||(wrong.length?'Có '+wrong.length+' từ cần ôn lại. Chúng đã được đánh dấu.':'Không sai từ nào!'))+'</p><div class="row" style="justify-content:center"><button class="btn" id="again" type="button">Làm lại</button>'+(wrong.length?'<button class="btn coral" id="wr" type="button">Ôn '+wrong.length+' từ sai</button>':'')+'<a class="btn ghost" href="'+cfg.back+'">Về danh sách</a></div></div>');
    $('#again').onclick=again;const w=$('#wr');if(w)w.onclick=()=>{const par=cfg.parent||cfg;stopStudy();study({items:wrong,pool,mode:mode,back:cfg.back,base:cfg.base,parent:par})}
  }
  function paint(){({card,quiz,write,match,list})[mode]();if(mode!=='card')window.scrollTo({top:0})}
  /* phím tắt */
  const key=ev=>{if(!live||!document.body.contains($('#stage')))return;if(/INPUT|TEXTAREA/.test(document.activeElement.tagName))return;
    if(mode==='card'){if(ev.key===' '){ev.preventDefault();flip=!flip;$('#card').classList.toggle('flip',flip)}else if(ev.key==='ArrowRight')go(1);else if(ev.key==='ArrowLeft')go(-1);else if(ev.key==='1'||ev.key==='2'){const b=$('[data-j="'+(ev.key==='1'?'ok':'rv')+'"]');if(b)b.click()}}
    else if(mode==='quiz'){const n=+ev.key;if(n>=1&&n<=4&&Qz&&Qz.ans==null){answerQ(n-1)}else if(ev.key==='Enter'&&Qz&&Qz.ans!=null)nextQ()}};
  document.addEventListener('keydown',key);
  stopStudy=()=>{live=false;document.removeEventListener('keydown',key)};
  paint();
}
let stopStudy=()=>{};
/* ---------------- từ đồng nghĩa ---------------- */
const SYNS={tab:'syn',lvs:new Set(['a1','a2','b1','b2','c1','c2']),q:'',n:40};
async function synonyms(){
  head({h1:'Từ đồng nghĩa',lead:'Toàn bộ từ vựng A1–C2 được gom nhóm theo nghĩa. Nhãn màu cho biết cấp độ; bấm vào một từ để mở cửa sổ thông tin.',crumb:'<a href="#/">Từ vựng</a>',meta:[]});
  main.innerHTML='<p class="hint" style="margin-top:22px">Đang tải…</p>';
  const S=await loadJS('data/syn.js','SE_SYN');await loadAll();if(!S)return notFound();
  if(!S.byId){S.byId={};S.g.forEach(g=>g[4].forEach(i=>{(S.byId[i]=S.byId[i]||[]).push(g)}))}
  const lvs=SE_LEVELS.filter(l=>l.state==='ready').map(l=>l.id);
  const chip=i=>{const e=byId[i];return e?'<button type="button" class="lvw" data-w="'+i+'">'+esc(e.w)+' <span class="lvc lv-'+e.lv+'">'+e.lv.toUpperCase()+'</span></button>':''};
  const cnt={syn:0,rel:0,one:S.s.length};S.g.forEach(g=>{if(g[3]==='rel')cnt.rel++;else cnt.syn++});
  function paint(){
    const T=[['syn','Đồng nghĩa ('+cnt.syn+')'],['rel','Cùng trường nghĩa ('+cnt.rel+')'],['one','Chưa có nhóm ('+cnt.one+')']];
    const q=SYNS.q.trim().toLowerCase(),nq=SE.norm(q);
    const match=i=>{const e=byId[i];return e&&SYNS.lvs.has(e.lv)};
    let list;
    if(SYNS.tab==='one')list=null;
    else{list=S.g.filter(g=>SYNS.tab==='rel'?g[3]==='rel':g[3]!=='rel').map(g=>[g,g[4].filter(match)]).filter(([g,ids])=>ids.length>=2&&(!q||ids.some(i=>byId[i].w.toLowerCase().includes(q)||SE.norm(byId[i].vi).includes(nq))||SE.norm(g[0]).includes(nq)||g[1].toLowerCase().includes(q)))}
    const singles=SYNS.tab==='one'?S.s.filter(i=>match(i)&&(!q||byId[i].w.toLowerCase().includes(q)||SE.norm(byId[i].vi).includes(nq))):null;
    const total=list?list.length:singles.length;
    main.innerHTML='<div class="modes" role="group" style="margin-top:22px">'+T.map(t=>'<button type="button" data-t="'+t[0]+'" aria-pressed="'+(SYNS.tab===t[0])+'">'+t[1]+'</button>').join('')+'</div>'
     +'<div class="row" style="margin:12px 0;flex-wrap:wrap;gap:8px">'+lvs.map(l=>'<button type="button" class="lvf lv-'+l+'" data-l="'+l+'" aria-pressed="'+SYNS.lvs.has(l)+'">'+l.toUpperCase()+'</button>').join('')+'<input class="input" id="sq" placeholder="Lọc theo từ hoặc nghĩa…" value="'+esc(SYNS.q)+'" style="flex:1;min-width:160px;max-width:320px;margin:0"></div>'
     +'<p class="hint">'+(SYNS.tab==='syn'?'Các từ trong cùng một khung có nghĩa gần như nhau (gom tự động từ WordNet kết hợp nghĩa tiếng Việt, nên đôi chỗ chỉ gần nghĩa).':SYNS.tab==='rel'?'Các từ cùng thuộc một trường nghĩa (ví dụ: các món ăn, các loại phòng) chứ không hẳn đồng nghĩa.':'Những từ chưa tìm được từ đồng nghĩa hay cùng trường nghĩa trong danh sách.')+' · '+total+(list?' nhóm':' từ')+'</p>'
     +(list?'<div class="synl">'+list.slice(0,SYNS.n).map(([g,ids])=>'<div class="syng"><div class="synt"><b>'+esc(g[0])+'</b>'+(g[1]?'<small>'+esc(g[1])+'</small>':'')+'</div><div class="synw">'+ids.map(chip).join('')+'</div></div>').join('')+'</div>'+(list.length>SYNS.n?'<div style="text-align:center;margin:16px"><button class="btn ghost" id="more" type="button">Hiện thêm ('+(list.length-SYNS.n)+')</button></div>':'')
       :'<div class="syng"><div class="synw">'+singles.slice(0,SYNS.n*8).map(chip).join('')+'</div></div>'+(singles.length>SYNS.n*8?'<div style="text-align:center;margin:16px"><button class="btn ghost" id="more" type="button">Hiện thêm</button></div>':''));
    $$('[data-t]').forEach(b=>b.onclick=()=>{SYNS.tab=b.dataset.t;SYNS.n=40;paint()});
    $$('[data-l]').forEach(b=>b.onclick=()=>{const l=b.dataset.l;SYNS.lvs.has(l)?SYNS.lvs.delete(l):SYNS.lvs.add(l);if(!SYNS.lvs.size)SYNS.lvs.add(l);paint()});
    const sq=$('#sq');sq.oninput=()=>{SYNS.q=sq.value;clearTimeout(sq._t);sq._t=setTimeout(()=>{SYNS.n=40;const p=sq.selectionStart;paint();const n=$('#sq');n.focus();n.setSelectionRange(p,p)},200)};
    const mo=$('#more');if(mo)mo.onclick=()=>{SYNS.n+=40;paint()};
    $$('.lvw').forEach(b=>b.onclick=()=>detail(byId[b.dataset.w]));
  }
  paint();
}
function synLine(e){const S=window.SE_SYN;if(!S||!S.byId)return '';const gs=(S.byId[e.id]||[]).filter(g=>g[3]!=='rel');if(!gs.length)return '';
  const ws=[];gs.forEach(g=>g[4].forEach(i=>{if(i!==e.id&&byId[i]&&!ws.includes(i))ws.push(i)}));if(!ws.length)return '';
  return '<p class="xmp" style="margin-top:10px"><b>Đồng nghĩa:</b> '+ws.slice(0,12).map(i=>'<button type="button" class="lvw" data-w="'+i+'">'+esc(byId[i].w)+' <span class="lvc lv-'+byId[i].lv+'">'+byId[i].lv.toUpperCase()+'</span></button>').join(' ')+'</p>'}
function detail(e){
  const m=document.createElement('div');m.className='modal';
  m.innerHTML='<div class="modal__box" role="dialog" aria-modal="true"><button class="modal__x" type="button" aria-label="Đóng">×</button><h2>'+esc(e.w)+'</h2>'+SE.ipaH(e.w)+' <span class="pos">'+esc(e.p)+'</span><div class="vi">'+esc(e.vi)+'</div>'+(e.c?'<div class="ctx"><b>'+hlWord(e)+'</b><small>'+esc(e.cv)+'</small></div>':'')+(e.x?'<p class="xmp">Ví dụ trong danh sách Cambridge: '+esc(e.x)+'</p>':'')+''+synLine(e)+'<div class="row">'+spk(e.w)+(e.c?spk(e.c).replace('Nghe','Nghe cụm từ'):'')+'<button class="icon-btn" data-j="rv" type="button">Đánh dấu cần ôn</button><button class="icon-btn" data-j="ok" type="button">Đã nhớ</button></div></div>';
  document.body.appendChild(m);const close=()=>{m.remove();document.removeEventListener('keydown',esck)};const esck=ev=>{if(ev.key==='Escape')close()};
  document.addEventListener('keydown',esck);m.onclick=ev=>{if(ev.target===m||ev.target.closest('.modal__x'))close()};bindSay(m);
  $$('[data-w]',m).forEach(b=>b.onclick=()=>{m.remove();detail(byId[b.dataset.w])});
  $$('[data-j]',m).forEach(b=>b.onclick=()=>{prog.set(e.id,b.dataset.j);toast(b.dataset.j==='ok'?'Đã nhớ':'Đã đánh dấu cần ôn')})
}
/* ---------------- tìm kiếm ---------------- */
async function search(q){
  await loadAll();stopStudy();
  const n=norm(q).trim();const items=[].concat(...Object.values(cache).map(d=>d.items));
  const score=e=>{const w=norm(e.w),vi=norm(e.vi),c=norm(e.c),cv=norm(e.cv);let s=0;
    if(w===n)s=100;else if(w.startsWith(n))s=80;else if(new RegExp('\\b'+n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).test(w))s=65;else if(w.includes(n))s=50;
    else if(vi.includes(n))s=40;else if(c.includes(n))s=30;else if(cv.includes(n))s=25;return s};
  const r=items.map(e=>[score(e),e]).filter(x=>x[0]).sort((a,b)=>b[0]-a[0]||a[1].w.localeCompare(b[1].w)).slice(0,60);
  head({h1:'Tìm kiếm',lead:'',crumb:'<a href="#/">Trang chủ</a>',meta:[r.length+' kết quả cho "'+q+'"']});
  main.innerHTML=r.length?'<div class="res">'+r.map(([,e],n)=>'<button type="button" data-r="'+n+'"><b>'+esc(e.w)+' '+SE.ipaH(e.w)+' <span class="pos">'+esc(e.p)+' · '+e.lv.toUpperCase()+'</span></b><span>'+esc(e.vi)+'</span><small>'+esc(e.c)+(e.cv?' — '+esc(e.cv):'')+'</small></button>').join('')+'</div>':'<div class="panel" style="margin-top:22px;text-align:center"><h2>Không tìm thấy</h2><p>Thử gõ một phần của từ, hoặc gõ nghĩa tiếng Việt.</p></div>';
  $$('[data-r]').forEach(b=>b.onclick=()=>detail(r[+b.dataset.r][1]))
}
function notFound(){head({h1:'Không tìm thấy trang',crumb:'<a href="#/">Về trang chủ</a>'});main.innerHTML='<div class="panel" style="margin-top:22px"><p>Đường dẫn này chưa có nội dung.</p><a class="btn" href="#/">Về trang chủ</a></div>'}
/* ---------------- định tuyến ---------------- */
let t;Q.addEventListener('input',()=>{clearTimeout(t);t=setTimeout(()=>{const v=Q.value.trim();if(v)search(v);else route()},180)});
async function route(){
  stopStudy();window.scrollTo({top:0});
  const parts=(location.hash.replace(/^#\/?/,'')||'').split('/').filter(Boolean);
  if(Q.value.trim()&&!parts.length&&false)return;
  if(!parts.length)return home();
  if(parts[0]==='on-tap')return review();
  if(parts[0]==='dong-nghia')return synonyms();
  if(LV[parts[0]]){if(parts.length===1)return level(parts[0]);if(parts[1]==='chu-de')return level(parts[0],'topic');return pack(parts[0],parts[1],parts[2])}
  notFound();
}
window.addEventListener('hashchange',()=>{Q.value='';route()});
route();
})();
