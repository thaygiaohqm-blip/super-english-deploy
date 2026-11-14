(function(){
const {esc,store,speak,toast}=SE;
const prog=store('se:giaotrinh');
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const main=$('#main'),H1=$('#h1'),LEAD=$('#lead'),CRUMB=$('#crumb'),META=$('#meta');
const D=window.SE_GT,UB=Object.fromEntries(D.map(u=>[u.id,u]));
const head=o=>{H1.textContent=o.h1;LEAD.innerHTML=o.lead||'';CRUMB.innerHTML=o.crumb||'';META.innerHTML=(o.meta||[]).map(x=>'<span class="chip">'+esc(x)+'</span>').join('')};
const rx=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const mmss=n=>Math.floor(n/60)+':'+String(n%60).padStart(2,'0');
const ICON='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>';
/* ---- từ đã lưu ---- */
const words=()=>prog.get('words')||[];
const wkey=w=>w.trim().toLowerCase();
const findW=w=>words().find(x=>wkey(x.w)===wkey(w));
const saveW=o=>{const a=words().filter(x=>wkey(x.w)!==wkey(o.w));a.unshift(o);prog.set('words',a)};
const delW=w=>prog.set('words',words().filter(x=>wkey(x.w)!==wkey(w)));
/* ---- tô sáng từ vựng gợi ý ---- */
function marks(text,gl,study){
  const items=gl.map((g,i)=>[g[0],i]).sort((a,b)=>b[0].length-a[0].length);
  if(!items.length)return plain(text,study);
  const re=new RegExp('(?<![\\w])('+items.map(x=>rx(x[0])).join('|')+')(?![\\w])','gi');
  let out='',pos=0,m;
  while((m=re.exec(text))){out+=plain(text.slice(pos,m.index),study);const gi=gl.findIndex(g=>g[0].toLowerCase()===m[0].toLowerCase());out+='<button type="button" class="gw" data-g="'+gi+'">'+esc(m[0])+'</button>';pos=m.index+m[0].length}
  return out+plain(text.slice(pos),study);
}
function plain(t,study){
  if(!study)return esc(t);
  return t.replace(/([A-Za-z][A-Za-z'’-]*)|([^A-Za-z]+)/g,(m,w,o)=>w?'<span class="w">'+esc(w)+'</span>':esc(o));
}
/* ---- bảng chọn từ ---- */
let tip=null;
function closeTip(){if(tip){tip.remove();tip=null}}
function openTip(word,vi,src,ctx){
  closeTip();const saved=findW(word);
  tip=document.createElement('div');tip.className='gtip';
  tip.innerHTML='<h3>'+esc(word)+'</h3><div class="row" style="margin:0 0 4px"><button class="icon-btn" type="button" data-a="say">'+ICON+' Nghe</button></div>'
   +'<input type="text" placeholder="Nghĩa tiếng Việt" value="'+esc(saved?saved.vi:(vi||''))+'" aria-label="Nghĩa tiếng Việt">'
   +'<div class="row"><button class="btn sm" type="button" data-a="save">'+(saved?'Cập nhật':'Lưu để học')+'</button>'+(saved?'<button class="btn sm" type="button" data-a="del">Bỏ khỏi danh sách</button>':'')+'<button class="btn sm" type="button" data-a="x">Đóng</button></div>';
  document.body.appendChild(tip);
  const inp=$('input',tip);
  tip.onclick=ev=>{const a=ev.target.closest('[data-a]');if(!a)return;const k=a.dataset.a;
    if(k==='say')speak(word);
    else if(k==='save'){saveW({w:word.trim(),vi:inp.value.trim(),src:src,ctx:ctx||''});toast('Đã lưu "'+word.trim()+'"');closeTip();refreshHits()}
    else if(k==='del'){delW(word);toast('Đã bỏ');closeTip();refreshHits()}
    else closeTip()};
  inp.onkeydown=ev=>{if(ev.key==='Enter')$('[data-a=save]',tip).click()};
  if(!vi&&!saved)setTimeout(()=>inp.focus(),30);
}
function refreshHits(){}
/* chọn từ bằng chạm / bôi đen trong vùng .studyarea */
function bindStudy(root,src,glOf){
  root.addEventListener('click',ev=>{
    if(!document.body.classList.contains('study'))return;
    const sel=String(getSelection()||'').trim();
    const sent=ev.target.closest('.sent');const ctx=sent?sent.dataset.en:'';
    if(sel.length>=2&&sel.length<=80&&root.contains(getSelection().anchorNode)){openTip(sel.replace(/\s+/g,' '),(findGl(glOf(sent),sel)||[])[1],src(sent),ctx);return}
    const g=ev.target.closest('.gw');
    if(g){const gl=glOf(sent);const it=gl[+g.dataset.g];openTip(it[0],it[1],src(sent),ctx);return}
    const w=ev.target.closest('.w');
    if(w){const t=w.textContent;openTip(t,(findGl(glOf(sent),t)||[])[1],src(sent),ctx)}
  });
}
function findGl(gl,t){if(!gl)return null;const k=t.toLowerCase();return gl.find(g=>g[0].toLowerCase()===k)}
const itemKey=(k,u,i)=>k+':'+u+':'+i;
/* ---- trang chủ ---- */
function home(){
  head({h1:'Giáo trình · Complete IELTS Bands 4–5',lead:'Các bài Reading và Listening của sách Workbook, có bản dịch song ngữ, chế độ che tiếng Anh, chọn từ vựng ngay trong bài, audio và script.',meta:[D.length+' unit',D.reduce((n,u)=>n+u.reading.length,0)+' bài đọc',D.reduce((n,u)=>n+u.listening.length,0)+' bài nghe']});
  CRUMB.innerHTML='';
  main.innerHTML='<div class="row" style="margin-top:18px;display:flex;gap:8px;flex-wrap:wrap"><a class="btn" href="#/words">Từ đã lưu ('+words().length+')</a></div><div class="grid" style="margin-top:14px">'+D.map(u=>{
    const rs=u.reading.map((r,i)=>'<li><a href="#/r/'+u.id+'/'+i+'"><span class="t">'+esc(r.label)+': '+esc(r.title)+'</span><span class="k">'+(prog.get(itemKey('r',u.id,i))==='ok'?'<span class="ok">✓</span> ':'')+'Đọc</span></a></li>').join('');
    const ls=u.listening.map((l,i)=>'<li><a href="#/l/'+u.id+'/'+i+'"><span class="t">Track '+String(l.track).padStart(2,'0')+': '+esc(l.title)+'</span><span class="k">'+(prog.get(itemKey('l',u.id,i))==='ok'?'<span class="ok">✓</span> ':'')+mmss(l.dur||0)+'</span></a></li>').join('');
    return '<div class="card-l" style="cursor:default"><span class="big">'+esc(u.label.replace('Unit ',''))+'</span><h3>'+esc(u.title)+' · '+esc(u.vi)+'</h3><b style="font-size:.78rem">READING</b><ul class="ulist">'+rs+'</ul><b style="font-size:.78rem;display:block;margin-top:10px">LISTENING</b><ul class="ulist">'+ls+'</ul></div>'}).join('')+'</div>'
   +'<div class="note"><b>Về nội dung:</b> văn bản tiếng Anh được trích lại từ bản scan của sách bằng OCR rồi sửa lỗi, nên có thể còn sai sót nhỏ. Bản dịch tiếng Việt do Claude biên soạn, không phải bản dịch chính thức; hãy đối chiếu với sách khi cần. Đây là tài liệu của Cambridge University Press, chỉ dành cho cá nhân người đã mua sách; vui lòng không chia sẻ lại.</div>';
  document.title='Giáo trình — Complete IELTS Bands 4–5';
}
/* ---- bài đọc ---- */
function reading(uid,i){
  const u=UB[uid],r=u&&u.reading[+i];if(!r)return home();
  head({h1:r.title,crumb:'<a href="#/">Giáo trình</a> › '+esc(u.label)+' › '+esc(r.label),lead:esc(u.title)+' · '+esc(r.vi),meta:[r.label,r.type,r.g.length+' từ gợi ý']});
  let mode=SE.get('se:gtmode')||'bi',study=false;
  const render=()=>{
    document.body.classList.toggle('study',study);
    $('#paras').innerHTML=r.p.map((p,j)=>'<div class="rp sent '+(mode==='hide'?'hide':'')+(mode==='en'?' en-only':'')+'" data-en="'+esc(p[0])+'" data-j="'+j+'"><p class="en">'+marks(p[0],r.g,study)+' <button class="icon-btn" type="button" data-say="'+esc(p[0])+'" aria-label="Nghe">'+ICON+'</button></p><p class="vi">'+esc(p[1])+'</p></div>').join('');
    $$('.seg [data-m]').forEach(b=>b.classList.toggle('on',b.dataset.m===mode));
    $('#st').classList.toggle('on',study);
    $$('#paras [data-say]').forEach(b=>b.onclick=ev=>{ev.stopPropagation();speak(b.dataset.say)});
    $$('#paras .rp.hide').forEach(d=>d.addEventListener('click',ev=>{if(ev.target.closest('button,.w'))return;if(!d.classList.contains('rev')){d.classList.add('rev')}}));
  };
  main.innerHTML='<div class="gtmodes"><div class="seg" role="group" aria-label="Chế độ hiển thị"><button type="button" data-m="bi">Song ngữ</button><button type="button" data-m="en">Chỉ tiếng Anh</button><button type="button" data-m="hide">Che tiếng Anh</button></div><button class="sw2" id="st" type="button" title="Bấm vào từ hoặc bôi đen cụm từ để lưu học">Chọn từ vựng</button><button class="btn sm" id="all" type="button">Nghe cả bài</button></div>'
   +'<div id="hint" class="note" style="margin-top:10px;display:none">Đang bật <b>chọn từ vựng</b>: chạm vào từ hoặc bôi đen một cụm để xem nghĩa và lưu vào danh sách học. Các cụm được gạch sáng đã có nghĩa gợi ý sẵn.</div>'
   +'<div id="paras" style="margin-top:16px"></div>'
   +(r.g.length?'<h2 class="sect" style="margin-top:22px">Từ vựng gợi ý trong bài ('+r.g.length+')</h2><div class="grid" id="gl" style="margin-top:10px"></div>':'')
   +'<div class="row" style="margin-top:22px;display:flex;gap:8px;flex-wrap:wrap;justify-content:space-between"><button class="btn" id="dn" type="button">'+(prog.get(itemKey('r',uid,+i))==='ok'?'Đã học (bỏ đánh dấu)':'Đánh dấu đã học')+'</button><a class="btn sm" href="#/words">Từ đã lưu ('+words().length+')</a></div>';
  if(r.g.length)$('#gl').innerHTML=r.g.map((g,k)=>'<div class="wcard"><div><b>'+esc(g[0])+'</b><small>'+esc(g[1])+'</small></div><button class="icon-btn" type="button" data-gi="'+k+'" aria-label="Lưu từ">+ Lưu</button></div>').join('');
  $$('#gl [data-gi]').forEach(b=>b.onclick=()=>{const g=r.g[+b.dataset.gi];saveW({w:g[0],vi:g[1],src:u.label+' · '+r.label,ctx:''});toast('Đã lưu "'+g[0]+'"')});
  $$('.seg [data-m]').forEach(b=>b.onclick=()=>{mode=b.dataset.m;SE.put('se:gtmode',mode);render()});
  $('#st').onclick=()=>{study=!study;$('#hint').style.display=study?'':'none';render()};
  $('#all').onclick=()=>speak(r.p.map(p=>p[0]).join(' '));
  $('#dn').onclick=()=>{const k=itemKey('r',uid,+i);prog.set(k,prog.get(k)==='ok'?null:'ok');reading(uid,i)};
  render();
  bindStudy($('#paras'),()=>u.label+' · '+r.label,()=>r.g);
  document.title=r.title+' — Giáo trình';
}
/* ---- bài nghe ---- */
function listening(uid,i){
  const u=UB[uid],l=u&&u.listening[+i];if(!l)return home();
  head({h1:'Track '+String(l.track).padStart(2,'0')+' · '+l.title,crumb:'<a href="#/">Giáo trình</a> › '+esc(u.label)+' › Listening',lead:esc(u.title)+' · '+esc(l.vi),meta:[l.type,mmss(l.dur||0)]});
  let show=false,vi=true,study=false;
  const body=()=>{
    document.body.classList.toggle('study',study);document.body.classList.toggle('novi',!vi);
    const el=$('#scr');
    if(!show){el.innerHTML='<div class="scr-off">Script đang ẩn. Hãy nghe và làm bài trước, rồi bấm <b>Xem script</b> để đối chiếu.</div>';return}
    const dlg=l.l.some(x=>x[0]);
    el.innerHTML=l.l.map(x=>dlg?
      '<div class="lrow sent" data-en="'+esc(x[1])+'"><span class="sp">'+esc(x[0])+'</span><div class="en">'+plain(x[1],study)+' <button class="icon-btn" type="button" data-say="'+esc(x[1])+'" aria-label="Nghe">'+ICON+'</button></div><div class="vi">'+esc(x[2])+'</div></div>'
      :'<div class="lmono sent" data-en="'+esc(x[1])+'"><p class="en">'+plain(x[1],study)+' <button class="icon-btn" type="button" data-say="'+esc(x[1])+'" aria-label="Nghe">'+ICON+'</button></p><p class="vi">'+esc(x[2])+'</p></div>').join('');
    $$('#scr [data-say]').forEach(b=>b.onclick=()=>speak(b.dataset.say));
  };
  main.innerHTML='<div class="player"><audio id="au" controls preload="metadata" src="audio/t'+String(l.track).padStart(2,'0')+'.mp3"></audio><div class="row"><button class="btn sm" id="b5" type="button">« 5 giây</button><button class="btn sm" id="f5" type="button">5 giây »</button><span class="seg" role="group" aria-label="Tốc độ"><button type="button" data-s=".75">0.75×</button><button type="button" data-s="1" class="on">1×</button><button type="button" data-s="1.25">1.25×</button></span></div></div>'
   +'<div class="gtmodes" style="position:static"><button class="sw2" id="sh" type="button">Xem script</button><button class="sw2 on" id="sv" type="button">Bản dịch</button><button class="sw2" id="st" type="button" title="Bấm vào từ hoặc bôi đen cụm từ để lưu học">Chọn từ vựng</button></div><div id="scr"></div>'
   +'<div class="row" style="margin-top:22px;display:flex;gap:8px;flex-wrap:wrap;justify-content:space-between"><button class="btn" id="dn" type="button">'+(prog.get(itemKey('l',uid,+i))==='ok'?'Đã nghe (bỏ đánh dấu)':'Đánh dấu đã nghe')+'</button><span>'+(+i>0?'<a class="btn sm" href="#/l/'+uid+'/'+(+i-1)+'">← Track trước</a> ':'')+(+i<u.listening.length-1?'<a class="btn sm" href="#/l/'+uid+'/'+(+i+1)+'">Track sau →</a>':'')+'</span></div>';
  const au=$('#au');
  $('#b5').onclick=()=>au.currentTime=Math.max(0,au.currentTime-5);$('#f5').onclick=()=>au.currentTime=Math.min(au.duration||1e9,au.currentTime+5);
  $$('[data-s]').forEach(b=>b.onclick=()=>{au.playbackRate=+b.dataset.s;$$('[data-s]').forEach(x=>x.classList.toggle('on',x===b))});
  $('#sh').onclick=ev=>{show=!show;ev.target.classList.toggle('on',show);ev.target.textContent=show?'Ẩn script':'Xem script';body()};
  $('#sv').onclick=ev=>{vi=!vi;ev.target.classList.toggle('on',vi);body()};
  $('#st').onclick=ev=>{study=!study;ev.target.classList.toggle('on',study);if(study&&!show){show=true;$('#sh').classList.add('on');$('#sh').textContent='Ẩn script'}body()};
  $('#dn').onclick=()=>{const k=itemKey('l',uid,+i);prog.set(k,prog.get(k)==='ok'?null:'ok');listening(uid,i)};
  body();
  bindStudy($('#scr'),()=>u.label+' · Track '+String(l.track).padStart(2,'0'),()=>[]);
  document.title='Track '+l.track+' — Giáo trình';
}
/* ---- từ đã lưu ---- */
function wordsPage(){
  const a=words();
  head({h1:'Từ đã lưu',crumb:'<a href="#/">Giáo trình</a> › Từ đã lưu',lead:'Các từ và cụm bạn đã chọn trong bài đọc và script nghe.',meta:[a.length+' mục']});
  if(!a.length){main.innerHTML='<div class="note" style="margin-top:18px">Chưa có từ nào. Mở một bài đọc, bật <b>Chọn từ vựng</b> rồi chạm vào từ để lưu.</div>';return}
  main.innerHTML='<div class="gtmodes" style="position:static"><button class="sw2" id="hv" type="button">Che nghĩa để tự kiểm tra</button><button class="btn sm" id="fc" type="button">Học bằng thẻ</button></div><div id="wl" class="wlist" style="margin-top:12px"></div>';
  const wl=$('#wl');
  const rend=()=>{wl.innerHTML=words().map(w=>'<div class="wcard"><div><b>'+esc(w.w)+'</b> <button class="icon-btn" type="button" data-say="'+esc(w.w)+'" aria-label="Nghe">'+ICON+'</button><small class="wv">'+esc(w.vi||'(chưa có nghĩa)')+'</small><small>'+esc(w.src||'')+'</small>'+(w.ctx?'<small style="font-family:var(--serif)">“'+esc(w.ctx)+'”</small>':'')+'</div><button class="icon-btn" type="button" data-del="'+esc(w.w)+'" aria-label="Xóa">Xóa</button></div>').join('');
    $$('[data-say]',wl).forEach(b=>b.onclick=()=>speak(b.dataset.say));
    $$('[data-del]',wl).forEach(b=>b.onclick=()=>{delW(b.dataset.del);rend()});
    $$('.wv',wl).forEach(e=>e.onclick=()=>e.style.filter='none')};
  rend();
  $('#hv').onclick=ev=>{wl.classList.toggle('hidevi');ev.target.classList.toggle('on')};
  $('#fc').onclick=()=>cards(SE.shuffle(words()),0);
}
function cards(a,i){
  if(i>=a.length){toast('Đã hết thẻ');return wordsPage()}
  const w=a[i];head({h1:'Học bằng thẻ',crumb:'<a href="#/words">Từ đã lưu</a> › Thẻ',lead:'',meta:[(i+1)+' / '+a.length]});
  main.innerHTML='<div class="fc" id="c"><p class="big">'+esc(w.w)+'</p><p class="ctx" id="b" style="display:none"><b>'+esc(w.vi||'(chưa có nghĩa)')+'</b>'+(w.ctx?'<br><br>“'+esc(w.ctx)+'”':'')+'</p><p class="ctx" id="h">Chạm để xem nghĩa</p></div><div class="row" style="margin-top:14px;display:flex;gap:8px;justify-content:center"><button class="btn sm" id="sy" type="button">Nghe</button><button class="btn" id="nx" type="button">Thẻ tiếp →</button></div>';
  $('#c').onclick=()=>{$('#b').style.display='';$('#h').style.display='none'};
  $('#sy').onclick=()=>speak(w.w);$('#nx').onclick=()=>cards(a,i+1);speak(w.w);
}
function route(){closeTip();document.body.classList.remove('study','novi');const h=location.hash.replace(/^#\/?/,'').split('/').filter(Boolean);
  if(!h.length)home();else if(h[0]==='r')reading(h[1],h[2]);else if(h[0]==='l')listening(h[1],h[2]);else if(h[0]==='words')wordsPage();else home();window.scrollTo(0,0)}
window.addEventListener('hashchange',route);route();
})();
