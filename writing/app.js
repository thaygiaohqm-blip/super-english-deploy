(function(){
const {esc,shuffle,store,speak,toast,norm}=SE;
const prog=store('se:writing');
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const main=$('#main'),H1=$('#h1'),LEAD=$('#lead'),CRUMB=$('#crumb'),META=$('#meta');
const ES=window.SE_ESSAYS,EB=Object.fromEntries(ES.map(e=>[e.id,e]));
const head=o=>{H1.textContent=o.h1;LEAD.innerHTML=o.lead||'';CRUMB.innerHTML=o.crumb||'';META.innerHTML=(o.meta||[]).map(x=>'<span class="chip">'+esc(x)+'</span>').join('')};
const ICON='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>';
const spk=(t,l)=>'<button class="icon-btn" type="button" data-say="'+esc(t)+'">'+ICON+' '+(l||'Nghe')+'</button>';
const bindSay=r=>$$('[data-say]',r).forEach(b=>b.onclick=ev=>{ev.stopPropagation();speak(b.dataset.say)});
const q=s=>s.replace(/’/g,"'");
/* ---- chuẩn bị dữ liệu ---- */
ES.forEach(e=>{
  e.sents=[];e.paras.forEach((p,pi)=>p.forEach((s,si)=>{s.pi=pi;s.si=si;s.id=pi+'.'+si;s.e=e;e.sents.push(s)}));
  e.colls.forEach((c,n)=>{c.n=n;c.e=e;c.id='c:'+e.id+':'+n;c.sent=e.sents.find(s=>q(s.en).toLowerCase().includes(q(c.f).toLowerCase()))||null});
  e.sents.forEach(s=>{s.id2='s:'+e.id+':'+s.id;s.colls=e.colls.filter(c=>c.sent===s||q(s.en).toLowerCase().includes(q(c.f).toLowerCase()))});
});
const allColls=[].concat(...ES.map(e=>e.colls));
const WD=window.SE_WORDS||{};
const wkey=w=>q(w).toLowerCase().replace(/'s$/,'');
function hl(s,e,dis){
  const t=q(s.en),low=t.toLowerCase(),m=[];
  e.colls.forEach(c=>{const f=q(c.f).toLowerCase();let i=low.indexOf(f);while(i>=0){m.push([i,i+f.length,c.n]);i=low.indexOf(f,i+1)}});
  m.sort((a,b)=>a[0]-b[0]||(b[1]-b[0])-(a[1]-a[0]));
  const words=(txt,off)=>{if(dis)return esc(txt);let o='',p=0,r=/[A-Za-z][A-Za-z'’-]*/g,x;while((x=r.exec(txt))){const k=WD[x[0].toLowerCase().replace(/’/g,"'")]?x[0].toLowerCase().replace(/’/g,"'"):(WD[wkey(x[0])]?wkey(x[0]):null);if(!k)continue;o+=esc(txt.slice(p,x.index))+'<button type="button" class="cw" data-w="'+esc(k)+'" data-s="'+esc(s.id2)+'">'+esc(x[0])+'</button>';p=x.index+x[0].length}return o+esc(txt.slice(p))};
  let out='',pos=0;for(const [a,b,n] of m){if(a<pos)continue;out+=words(s.en.slice(pos,a))+'<button type="button" class="cl" data-c="'+e.id+':'+n+'"'+(dis?' disabled':'')+'>'+esc(s.en.slice(a,b))+'</button>';pos=b}
  return out+words(s.en.slice(pos));
}
const stC=c=>prog.get(c.id);
/* ---- cửa sổ collocation ---- */
function collModal(c){
  const m=document.createElement('div');m.className='modal';const s=c.sent;
  const st=stC(c);
  m.innerHTML='<div class="modal__box" role="dialog" aria-modal="true"><button class="modal__x" type="button" aria-label="Đóng">×</button><span class="tag">'+esc(c.e.no)+' · collocation</span><h2 style="margin-top:8px">'+esc(c.en)+'</h2><div class="vi">'+esc(c.vi)+'</div>'
   +(s?'<div class="ctx"><div class="en" style="font-family:var(--serif)">'+hl(s,c.e,true)+'</div><small>'+esc(s.vi)+'</small></div>':'')
   +'<div class="row">'+spk(c.en.replace(/\s*\(.*?\)/g,''),'Nghe cụm từ')+(s?spk(s.en,'Nghe câu'):'')+'</div><div class="row" style="margin-top:12px"><button class="btn sm coral" data-j="rv" type="button">Cần ôn</button><button class="btn sm" data-j="ok" type="button" style="background:var(--ok);border-color:var(--ok)">Đã nhớ</button>'+(st?'<span class="state '+st+'">'+(st==='ok'?'Đã nhớ':'Cần ôn')+'</span>':'')+'</div></div>';
  document.body.appendChild(m);const close=()=>{m.remove();document.removeEventListener('keydown',ek)};const ek=ev=>{if(ev.key==='Escape')close()};document.addEventListener('keydown',ek);
  m.onclick=ev=>{if(ev.target===m||ev.target.closest('.modal__x'))close()};bindSay(m);
  $$('[data-j]',m).forEach(b=>b.onclick=()=>{prog.set(c.id,b.dataset.j);toast(b.dataset.j==='ok'?'Đã nhớ':'Đã đánh dấu cần ôn');close();if(typeof refresh==='function')refresh()});
}
let refresh=null;
function wordModal(k,sid){
  const w=WD[k];if(!w)return;const [,eid,idx]=sid.match(/^s:([^:]+):(.+)$/)||[];const e=EB[eid],s=e&&e.sents.find(x=>x.id===idx);
  const m=document.createElement('div');m.className='modal';
  m.innerHTML='<div class="modal__box" role="dialog" aria-modal="true"><button class="modal__x" type="button" aria-label="Đóng">×</button><span class="tag">Từ lẻ · '+esc(w[0])+'</span><h2 style="margin-top:8px">'+esc(k)+'</h2><div class="vi">'+esc(w[1])+'</div>'
   +(s?'<div class="ctx"><div class="en" style="font-family:var(--serif)">'+hl(s,e,true).replace(/(^|[^\w])(?=)/,'$1')+'</div><small>'+esc(s.vi)+'</small></div>':'')+'<div class="row">'+spk(k,'Nghe từ')+(s?spk(s.en,'Nghe câu'):'')+'</div></div>';
  document.body.appendChild(m);const close=()=>{m.remove();document.removeEventListener('keydown',ek)};const ek=ev=>{if(ev.key==='Escape')close()};document.addEventListener('keydown',ek);
  m.onclick=ev=>{if(ev.target===m||ev.target.closest('.modal__x'))close()};bindSay(m);
}
document.addEventListener('click',ev=>{const b=ev.target.closest('.cw[data-w]');if(!b)return;ev.stopPropagation();wordModal(b.dataset.w,b.dataset.s)});
document.addEventListener('click',ev=>{const b=ev.target.closest('.cl[data-c]');if(!b||b.disabled||b.hasAttribute('disabled'))return;ev.stopPropagation();const [id,n]=b.dataset.c.split(':');collModal(EB[id].colls[+n])});
/* ---- danh sách đề ---- */
function home(){
  head({h1:'Super Writing',lead:'Bài writing song ngữ Anh – Việt. Bấm vào cụm từ được tô sáng để học collocation ngay trong câu.',meta:[ES.length+' đề',allColls.length+' collocation']});
  const rv=allColls.filter(c=>stC(c)==='rv').length;
  main.innerHTML='<div class="row" style="margin-top:22px;justify-content:space-between"><h2 class="sect" style="margin:0">Các đề</h2><a class="btn sm" href="#/on-tap">Ôn tập tổng hợp tất cả đề</a></div><div class="grid" style="margin-top:14px;grid-template-columns:repeat(auto-fill,minmax(320px,1fr))">'+ES.map(e=>{const ok=e.colls.filter(c=>stC(c)==='ok').length;return '<a class="card-l" href="#/e/'+e.id+'"><span class="tag" style="align-self:flex-start">'+esc(e.no)+' · '+esc(e.topic)+'</span><h3>'+esc(e.title)+'</h3><p>'+esc(e.prompt_vi)+'</p><div class="row">'+(e.paras.length?'<span class="tag">'+e.n_sent+' câu song ngữ</span><span class="tag">'+e.colls.length+' collocation</span>':'<span class="tag warn">Chưa có bài mẫu</span>')+'</div>'+(e.colls.length?'<div class="bar"><i style="width:'+Math.round(ok/e.colls.length*100)+'%"></i></div>':'')+'</a>'}).join('')+'</div>'
  +(rv?'<div class="note">Bạn đang có <b>'+rv+'</b> collocation cần ôn. Vào "Ôn tập tổng hợp" để luyện lại.</div>':'')
  +'<div class="note">Đề 3 và Đề 4 có đầy đủ bản dịch và collocation từ tài liệu của bạn. Đề 1 và Đề 2 chỉ có bài tiếng Anh trong tài liệu, nên phần dịch và collocation do Claude biên soạn thêm.</div>';
}
/* ---- trang một đề ---- */
function essay(id,tab){
  const e=EB[id];if(!e)return nf();
  tab=tab||(e.paras.length?'song-ngu':'de');
  head({h1:e.no+' · '+e.title,lead:'',crumb:'<a href="#/">Tất cả đề</a>',meta:[e.topic,e.paras.length?e.words+' từ · '+e.n_sent+' câu':'Chưa có bài mẫu']});
  const tabs=[['song-ngu','Song ngữ'],['en','Bài tiếng Anh'],['vi','Bài tiếng Việt'],['colloc','Collocation ('+e.colls.length+')']].filter(t=>e.paras.length||t[0]==='de');
  if(e.own)tabs.push(['own',e.own.title.startsWith('Bài viết')?'Bản nháp của bạn':'Bài gốc tiếng Việt']);
  if(!e.paras.length)tabs.unshift(['de','Đề bài']);
  let body='';
  const promptBox='<div class="panel" style="margin-bottom:18px"><div class="ptitle" style="margin-top:0">Đề bài</div><p style="font:500 18px/1.7 var(--serif);margin:0 0 8px">'+esc(e.prompt_en)+'</p><p class="vi-only" style="color:var(--muted);margin:0">'+esc(e.prompt_vi)+'</p></div>';
  if(tab==='de'){body=promptBox+(e.link?'<div class="panel"><p>Tài liệu của bạn chưa có bài mẫu cho đề này, chỉ có đường dẫn tham khảo:</p><a class="btn" href="'+esc(e.link)+'" target="_blank" rel="noopener">Xem livestream của Huy Forum</a></div>':'')}
  else if(tab==='song-ngu'){
    body=promptBox+'<div class="toolbar"><button class="sw" data-t="vi" aria-pressed="true">Hiện tiếng Việt</button><button class="sw" data-t="en" aria-pressed="false">Che tiếng Anh để tự kiểm tra</button><button class="sw" data-t="hl" aria-pressed="true">Tô sáng collocation</button></div><div class="panel">'
    +e.paras.map((p,pi)=>(e.ptitles&&e.ptitles[pi]?'<div class="ptitle">'+esc(e.ptitles[pi])+'</div>':'')+'<div class="para">'+p.map(s=>'<div class="pair"><div class="en">'+hl(s,e)+' <button class="icon-btn" style="padding:2px 8px;margin-left:4px" type="button" data-say="'+esc(s.en)+'" aria-label="Nghe câu">'+ICON+'</button></div><div class="vi">'+esc(s.vi)+'</div></div>').join('')+'</div>').join('')+'</div><p class="legend">Bấm vào cụm từ được tô sáng để mở cửa sổ học collocation.</p>';
  }
  else if(tab==='en'||tab==='vi'){
    body=(tab==='en'?promptBox:'')+'<div class="panel essay-text">'+e.paras.map(p=>'<p>'+p.map(s=>tab==='en'?hl(s,e):esc(s.vi)).join(' ')+'</p>').join('')+'</div>'+(e.note?'<div class="note">'+esc(e.note)+'</div>':'');
  }
  else if(tab==='colloc'){
    body='<div class="row" style="justify-content:space-between;margin-bottom:12px"><span class="legend" style="margin:0">Bấm vào một cụm để xem nghĩa, câu chứa nó và đánh dấu mức nhớ.</span><a class="btn sm" href="#/e/'+e.id+'/on-tap">Ôn các collocation này</a></div><div class="collgrid">'+e.colls.map(c=>{const st=stC(c);return '<button type="button" data-cc="'+c.n+'"><b>'+esc(c.en)+(st?' <span class="state '+st+'">'+(st==='ok'?'Đã nhớ':'Cần ôn')+'</span>':'')+'</b><span>'+esc(c.vi)+'</span></button>'}).join('')+'</div>';
  }
  else if(tab==='own'){
    body='<div class="panel essay-text">'+e.own.paras.map(p=>'<p>'+esc(p)+'</p>').join('')+'</div>';
  }
  main.innerHTML='<div class="tabs" role="tablist">'+tabs.map(t=>'<button type="button" role="tab" aria-selected="'+(t[0]===tab)+'" data-tab="'+t[0]+'">'+t[1]+'</button>').join('')+(e.colls.length||e.sents.length?'<a class="btn sm coral" style="margin:6px 0 6px auto" href="#/e/'+e.id+'/on-tap">Ôn tập đề này</a>':'')+'</div>'+body+(tab!=='en'&&tab!=='vi'&&e.note?'<div class="note">'+esc(e.note)+'</div>':'');
  $$('[data-tab]').forEach(b=>b.onclick=()=>{location.hash='#/e/'+id+'/'+b.dataset.tab});
  $$('[data-cc]').forEach(b=>b.onclick=()=>collModal(e.colls[+b.dataset.cc]));
  bindSay(main);
  $$('.sw').forEach(b=>b.onclick=()=>{const on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',on);const t=b.dataset.t;
    if(t==='vi')document.body.classList.toggle('hide-vi',!on);else if(t==='en')document.body.classList.toggle('hide-en',on);else document.body.classList.toggle('no-hl',!on)});
  $$('.pair .en').forEach(d=>d.addEventListener('click',()=>{if(document.body.classList.contains('hide-en')){d.style.filter='none';setTimeout(()=>d.style.filter='',2500)}}));
  refresh=()=>essay(id,tab);
}
/* ---- ôn tập ---- */
function review(id,mode){
  const scope=id?EB[id]:null;if(id&&!scope)return nf();
  const sents=scope?scope.sents:[].concat(...ES.map(e=>e.sents)),colls=scope?scope.colls:allColls;
  const base=id?'#/e/'+id+'/on-tap':'#/on-tap';
  head({h1:scope?'Ôn tập · '+scope.no:'Ôn tập tổng hợp',lead:'',crumb:'<a href="#/">Tất cả đề</a>'+(scope?' › <a href="#/e/'+id+'">'+esc(scope.no)+'</a>':''),meta:[sents.length+' câu',colls.length+' collocation']});
  const MODES=[['viet-lai','Viết lại câu'],['flash','Flashcard cụm từ'],['quiz','Trắc nghiệm'],['dien','Điền cụm từ']];
  if(!mode){
    main.innerHTML='<h2 class="sect">Chọn cách ôn</h2><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">'
    +'<a class="card-l" href="'+base+'/viet-lai"><span class="big">VI→EN</span><h3>Viết lại câu</h3><p>Hiện một câu tiếng Việt trong bài, bạn tự viết lại bằng tiếng Anh rồi so với câu mẫu và kiểm tra collocation đã dùng.</p><span class="tag">'+sents.length+' câu</span></a>'
    +'<a class="card-l" href="'+base+'/flash"><span class="big">⇄</span><h3>Flashcard cụm từ</h3><p>Lật thẻ để ôn collocation, kèm câu ví dụ lấy từ chính bài viết.</p><span class="tag">'+colls.length+' cụm</span></a>'
    +'<a class="card-l" href="'+base+'/quiz"><span class="big">A·B·C</span><h3>Trắc nghiệm</h3><p>Chọn nghĩa, chọn cụm tiếng Anh hoặc chọn cụm điền vào chỗ trống trong câu.</p><span class="tag">'+colls.length+' cụm</span></a>'
    +'<a class="card-l" href="'+base+'/dien"><span class="big">___</span><h3>Điền cụm từ</h3><p>Câu tiếng Anh bị che mất collocation, bạn gõ lại cụm từ dựa vào nghĩa tiếng Việt.</p><span class="tag">'+colls.length+' cụm</span></a></div>';
    return;
  }
  const bar=()=>'<div class="studybar" style="margin-top:22px"><div class="modes">'+MODES.map(m=>'<a class="btn sm '+(m[0]===mode?'':'ghost')+'" href="'+base+'/'+m[0]+'">'+m[1]+'</a>').join('')+'</div></div>';
  const st=$('#stage');
  if(mode==='viet-lai')rewrite(sents,bar,base);
  else if(mode==='flash')flash(colls,bar,base);
  else if(mode==='quiz')quiz(colls,bar,base);
  else if(mode==='dien')fill(colls,bar,base);
  else nf();
}
const wrap=(bar,inner)=>{main.innerHTML=bar()+'<div id="stage" class="stage">'+inner+'</div>'};
const toks=s=>norm(q(s)).replace(/[^a-z0-9' ]/g,' ').split(/\s+/).filter(Boolean);
function doneScreen(bar,name,right,total,extra,again,base){
  wrap(bar,'<div class="panel done"><div class="ring" style="--p:'+Math.round(right/Math.max(1,total)*100)+'"><b>'+right+'/'+total+'</b></div><h2>Hoàn thành: '+name+'</h2><p>'+(extra||'')+'</p><div class="row" style="justify-content:center"><button class="btn" id="again" type="button">Làm lại</button><a class="btn ghost" href="'+base+'">Chọn cách ôn khác</a></div></div>');$('#again').onclick=again}
/* viết lại câu */
function rewrite(sents,bar,base){
  let deck=shuffle(sents),k=0,hint=0,chk=false,val='',good=0,stats=[];
  const rvFirst=sents.filter(s=>prog.get(s.id2)==='rv');if(rvFirst.length)deck=[...shuffle(rvFirst),...shuffle(sents.filter(s=>!rvFirst.includes(s)))];
  function paint(){
    if(k>=deck.length)return doneScreen(bar,'Viết lại câu',good,deck.length,'Bạn tự chấm "đúng ý" '+good+' trên '+deck.length+' câu.',()=>{deck=shuffle(sents);k=0;good=0;paint()},base);
    const s=deck[k],e=s.e;
    let inner='<div class="row" style="justify-content:space-between"><span class="counter" style="text-align:left">Câu '+(k+1)+' / '+deck.length+'</span><span class="tag">'+esc(e.no)+'</span></div><div class="panel" style="margin-top:8px"><div class="ptitle" style="margin-top:0">Viết lại câu sau bằng tiếng Anh</div><p style="font-size:20px;font-weight:600;line-height:1.6;margin:0">'+esc(s.vi)+'</p></div>';
    if(!chk){
      inner+='<textarea id="ta" class="input" style="margin-top:12px" placeholder="Gõ câu tiếng Anh của bạn ở đây..." spellcheck="false">'+esc(val)+'</textarea>';
      if(hint&&s.colls.length)inner+='<div class="note">Gợi ý collocation: '+s.colls.map(c=>hint>1?'<b>'+esc(c.en.replace(/\s*\(.*?\)/g,'').split(' ').slice(0,2).join(' '))+'…</b> ('+esc(c.vi)+')':esc(c.vi)).join(' · ')+'</div>';
      inner+='<div class="nav"><button class="btn ghost sm" id="hint" type="button">'+(hint?'Gợi ý thêm':'Gợi ý collocation')+'</button><button class="btn" id="chk" type="button">Kiểm tra</button></div>';
    }else{
      const ut=new Set(toks(val)),mt=toks(s.en);const hit=mt.filter(t=>ut.has(t)).length;const pct=Math.round(hit/Math.max(1,mt.length)*100);
      const diff=s.en.replace(/[A-Za-z0-9’']+/g,w=>ut.has(norm(q(w)).replace(/[^a-z0-9']/g,''))?'<span class="ok">'+esc(w)+'</span>':'<span class="miss">'+esc(w)+'</span>');
      const used=s.colls.map(c=>{const f=toks(c.f);const hitc=f.filter(t=>ut.has(t)).length;return [c,hitc/f.length>=.8]});
      inner+='<div class="panel" style="margin-top:12px"><div class="ptitle" style="margin-top:0">Bạn viết</div><p style="margin:0 0 14px">'+(esc(val)||'<i style="color:var(--muted)">(bỏ trống)</i>')+'</p><div class="ptitle">Câu mẫu</div><p class="diff" style="font:500 19px/1.7 var(--serif);margin:0">'+diff+'</p><p class="legend">Xanh: từ bạn đã dùng. Đỏ gạch chân: từ trong câu mẫu mà bạn chưa dùng. Độ khớp từ vựng: <b>'+pct+'%</b> (chỉ là thước đo tham khảo, câu đúng ý vẫn có thể dùng cách diễn đạt khác).</p>'
       +(used.length?'<div class="ptitle">Collocation trong câu này</div><div class="collgrid">'+used.map(([c,u])=>'<button type="button" data-cc="'+c.n+'"><b>'+(u?'✓ ':'✗ ')+esc(c.en)+'</b><span>'+esc(c.vi)+'</span></button>').join('')+'</div>':'')
       +'<div class="row" style="margin-top:12px">'+spk(s.en,'Nghe câu mẫu')+'</div></div><div class="jud"><button class="btn rv" data-g="rv" type="button">Cần luyện lại</button><button class="btn ok" data-g="ok" type="button">Mình viết đúng ý</button></div>';
    }
    wrap(bar,inner);bindSay(main);
    const ta=$('#ta');if(ta){ta.focus();ta.oninput=()=>val=ta.value;$('#chk').onclick=()=>{val=ta.value;if(!val.trim())return toast('Hãy viết thử một câu trước nhé');chk=true;paint()};$('#hint').onclick=()=>{val=ta.value;hint++;paint()}}
    $$('[data-cc]').forEach(b=>b.onclick=()=>collModal(s.e.colls[+b.dataset.cc]));
    $$('[data-g]').forEach(b=>b.onclick=()=>{prog.set(s.id2,b.dataset.g);if(b.dataset.g==='ok')good++;k++;chk=false;val='';hint=0;paint()});
  }
  paint();
}
/* flashcard cụm từ */
function flash(colls,bar,base){
  let deck=shuffle(colls),k=0,flip=false;
  function paint(){
    const c=deck[k],s=c.sent;
    wrap(bar,'<div class="card'+(flip?' flip':'')+'" id="card"><div class="card__in"><div class="face"><div class="top"><span>'+esc(c.e.no)+'</span><span>'+(stC(c)?'<span class="state '+stC(c)+'">'+(stC(c)==='ok'?'Đã nhớ':'Cần ôn')+'</span>':'')+'</span></div><div class="main"><div class="say sm">'+esc(c.en)+'</div><div>'+spk(c.en.replace(/\s*\(.*?\)/g,''))+'</div></div><div class="hint">Bấm vào thẻ để lật</div></div><div class="face back"><div class="top"><span>'+esc(c.en)+'</span><span></span></div><div class="main"><div class="mean">'+esc(c.vi)+'</div>'+(s?'<div class="coll" style="font-family:var(--serif);font-weight:500">'+hl(s,c.e,true)+'<small>'+esc(s.vi)+'</small></div>':'')+'</div></div></div></div>'
    +' <div class="jud"><button class="btn rv" data-j="rv" type="button">Cần ôn <small>('+deck.filter(x=>stC(x)==='rv').length+')</small></button><button class="btn ok" data-j="ok" type="button">Đã nhớ <small>('+deck.filter(x=>stC(x)==='ok').length+')</small></button></div><div class="nav"><button class="btn ghost sm" id="p" type="button" '+(k?'':'disabled')+'>← Trước</button><span class="counter">'+(k+1)+' / '+deck.length+'</span><button class="btn ghost sm" id="n" type="button" '+(k<deck.length-1?'':'disabled')+'>Sau →</button></div>');
    $('#card').onclick=ev=>{if(ev.target.closest('[data-say]'))return;flip=!flip;$('#card').classList.toggle('flip',flip)};
    $('#p').onclick=()=>{if(k>0){k--;flip=false;paint()}};$('#n').onclick=()=>{if(k<deck.length-1){k++;flip=false;paint()}};SE.swipe($('#card'),()=>$('#n').click(),()=>$('#p').click(),{l:()=>k<deck.length-1,r:()=>k>0});
    $$('[data-j]').forEach(b=>b.onclick=()=>{prog.set(c.id,b.dataset.j);toast(b.dataset.j==='ok'?'Đã nhớ':'Cần ôn');if(k<deck.length-1){k++;flip=false}paint()});bindSay(main)
  }
  paint();
}
/* trắc nghiệm cụm từ */
function quiz(colls,bar,base){
  let deck=shuffle(colls).slice(0,25),k=0,right=0,ans=null,cur=null,wrongN=0;
  const opts=(c,key)=>{const pool=colls.length>6?colls:allColls;const o=[];const seen=new Set([c[key].toLowerCase()]);for(const x of shuffle(pool)){if(x===c||seen.has(x[key].toLowerCase()))continue;seen.add(x[key].toLowerCase());o.push(x);if(o.length>=3)break}return shuffle([c,...o])};
  function paint(){
    if(k>=deck.length)return doneScreen(bar,'Trắc nghiệm cụm từ',right,deck.length,'',()=>{deck=shuffle(colls).slice(0,25);k=0;right=0;ans=null;cur=null;paint()},base);
    const c=deck[k];
    if(!cur){const types=['en2vi','vi2en'];if(c.sent)types.push('cz','cz');const t=types[Math.random()*types.length|0];cur={t,o:opts(c,t==='en2vi'?'vi':'en')}}
    const key=cur.t==='en2vi'?'vi':'en';let qh;
    if(cur.t==='en2vi')qh='<div class="q"><small>Chọn nghĩa đúng của cụm</small>'+esc(c.en)+'</div>';
    else if(cur.t==='vi2en')qh='<div class="q"><small>Chọn cụm tiếng Anh đúng</small>'+esc(c.vi)+'</div>';
    else{const f=q(c.f);const t=q(c.sent.en);const i=t.toLowerCase().indexOf(f.toLowerCase());qh='<div class="q"><small>Chọn cụm điền vào chỗ trống</small><span style="font:500 20px/1.6 var(--serif);display:block">'+esc(c.sent.en.slice(0,i))+'<u>&nbsp;&nbsp;______&nbsp;&nbsp;</u>'+esc(c.sent.en.slice(i+f.length))+'</span></div><p class="hint" style="margin:0">'+esc(c.sent.vi)+'</p>'}
    wrap(bar,'<div class="row" style="justify-content:space-between"><span class="counter" style="text-align:left">Câu '+(k+1)+' / '+deck.length+'</span><span class="tag">Đúng '+right+'</span></div>'+qh+'<div class="opts">'+cur.o.map((o,n)=>'<button class="opt'+(ans!=null?(o===c?' ok':(ans===n?' bad':'')):'')+'" data-o="'+n+'" type="button" '+(ans!=null?'disabled':'')+'><kbd>'+(n+1)+'</kbd>'+esc(cur.t==='cz'?o.en.replace(/\s*\(.*?\)/g,''):o[key])+'</button>').join('')+'</div>'
     +(ans!=null?'<div class="verdict '+(cur.o[ans]===c?'ok':'bad')+'">'+(cur.o[ans]===c?'Chính xác!':'Chưa đúng.')+'<small><b>'+esc(c.en)+'</b> = '+esc(c.vi)+'</small></div><div class="nav"><button class="btn" id="nq" type="button">Câu tiếp →</button></div>':''));
    $$('[data-o]').forEach(b=>b.onclick=()=>{ans=+b.dataset.o;const ok=cur.o[ans]===c;if(ok){right++;prog.set(c.id,'ok')}else prog.set(c.id,'rv');paint()});
    const nq=$('#nq');if(nq)nq.onclick=()=>{k++;ans=null;cur=null;paint()};
  }
  paint();
}
/* điền cụm từ */
function fill(colls,bar,base){
  const ok=colls.filter(c=>c.sent);let deck=shuffle(ok).slice(0,20),k=0,right=0,checked=false,good=false,hint=false;
  function paint(){
    if(k>=deck.length)return doneScreen(bar,'Điền cụm từ',right,deck.length,'',()=>{deck=shuffle(ok).slice(0,20);k=0;right=0;paint()},base);
    const c=deck[k],f=q(c.f),t=q(c.sent.en),i=t.toLowerCase().indexOf(f.toLowerCase());
    const hn=f.split(' ').map(w=>w[0]+'_'.repeat(Math.max(0,w.length-1))).join(' ');
    wrap(bar,'<div class="row" style="justify-content:space-between"><span class="counter" style="text-align:left">Câu '+(k+1)+' / '+deck.length+'</span><span class="tag">Đúng '+right+'</span></div><div class="q"><small>Điền cụm từ còn thiếu (gõ đúng dạng trong câu)</small><span style="font:500 20px/1.6 var(--serif);display:block">'+esc(c.sent.en.slice(0,i))+'<u>&nbsp;&nbsp;______&nbsp;&nbsp;</u>'+esc(c.sent.en.slice(i+f.length))+'</span></div><p class="hint" style="margin:0 0 10px">'+esc(c.sent.vi)+'<br><b>Nghĩa của cụm:</b> '+esc(c.vi)+'</p><input class="input" id="inp" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Gõ cụm từ rồi bấm Enter" '+(checked?'disabled':'')+'>'
     +(hint&&!checked?'<p class="hint">Gợi ý: <b>'+esc(hn)+'</b></p>':'')
     +(checked?'<div class="verdict '+(good?'ok':'bad')+'">'+(good?'Chính xác!':'Đáp án: '+esc(c.f))+'<small>'+esc(c.en)+'</small></div><div class="nav"><button class="btn" id="nx" type="button">Câu tiếp →</button></div>':'<div class="nav"><button class="btn ghost sm" id="h" type="button">Gợi ý</button><button class="btn" id="chk" type="button">Kiểm tra</button></div>'));
    const inp=$('#inp');
    if(!checked){inp.focus();const check=()=>{const v=toks(inp.value).join(' ');if(!v)return;good=v===toks(f).join(' ');checked=true;if(good){right++;prog.set(c.id,'ok')}else prog.set(c.id,'rv');paint()};inp.onkeydown=ev=>{if(ev.key==='Enter')check()};$('#chk').onclick=check;$('#h').onclick=()=>{hint=true;const v=inp.value;paint();$('#inp').value=v;$('#inp').focus()}}
    else{$('#nx').focus();$('#nx').onclick=()=>{k++;checked=false;hint=false;paint()}}
  }
  paint();
}
function nf(){head({h1:'Không tìm thấy trang',crumb:'<a href="#/">Về danh sách đề</a>'});main.innerHTML='<div class="panel" style="margin-top:22px"><a class="btn" href="#/">Về danh sách đề</a></div>'}
function route(){
  document.body.classList.remove('hide-en','hide-vi','no-hl');window.scrollTo({top:0});refresh=null;
  const p=location.hash.replace(/^#\/?/,'').split('/').filter(Boolean);
  if(!p.length)return home();
  if(p[0]==='on-tap')return review(null,p[1]);
  if(p[0]==='e'){if(p[2]==='on-tap')return review(p[1],p[3]);return essay(p[1],p[2])}
  nf();
}
window.addEventListener('hashchange',route);route();
})();
