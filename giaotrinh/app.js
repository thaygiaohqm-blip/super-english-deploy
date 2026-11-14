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
  return t.replace(/([A-Za-z][A-Za-z'’-]*)|([^A-Za-z]+)/g,(m,w,o)=>{if(!w)return esc(o);const e=look1(w);return '<span class="w'+(e&&e.lv?' v':'')+'">'+esc(w)+'</span>'});
}
/* ---- tra nghĩa ---- */
const DD=window.SE_GTD||{};
const CT={"i'm":"tôi là / tôi đang","i'll":"tôi sẽ","i'd":"tôi sẽ / tôi muốn / tôi đã","i've":"tôi đã","it'll":"nó sẽ","isn't":"không phải / không (is not)","aren't":"không phải / không (are not)","can't":"không thể","couldn't":"đã không thể","didn't":"đã không","doesn't":"không (does not)","don't":"không (do not)","he'd":"anh ấy sẽ / đã","she'll":"cô ấy sẽ","shouldn't":"không nên","they'll":"họ sẽ","they're":"họ là / họ đang","they've":"họ đã","we'd":"chúng tôi sẽ / đã","we'll":"chúng tôi sẽ","we're":"chúng tôi là / đang","we've":"chúng tôi đã","wasn't":"đã không phải / đã không","won't":"sẽ không","wouldn't":"sẽ không","you'd":"bạn sẽ / đã","you'll":"bạn sẽ","you're":"bạn là / đang","you've":"bạn đã","that's":"đó là","it's":"nó là / nó đã","there's":"có","let's":"chúng ta hãy","what's":"cái gì là","here's":"đây là","he's":"anh ấy là","she's":"cô ấy là","who's":"ai là"};
function look1(w){
  let k=w.toLowerCase().replace(/’/g,"'").replace(/^['-]+|['-]+$/g,'');
  if(CT[k])return{vi:CT[k],pos:'viết tắt'};
  if(/^([a-z]-)+[a-z]$/.test(k))return{vi:'đánh vần từng chữ cái: '+k.toUpperCase().replace(/-/g,' – ')};
  if(k.length===1)return{vi:'chữ cái "'+k.toUpperCase()+'"'};
  if(/^\d/.test(k))return{vi:'số'};
  const tries=[k,k.replace(/'s$/,''),k.replace(/s'$/,'s'),k.replace(/'$/,'')];
  for(const t of tries){const e=DD[t];if(e)return{vi:e[0],pos:e[1]||'',c:e[2]||'',cv:e[3]||'',lv:e[4]||'',pid:e[5]||'',x:e[6]||'',ipa:e[7]||''}}
  if(k.includes('-')){const parts=k.split('-').map(p=>DD[p]?p+' = '+DD[p][0]:'').filter(Boolean);if(parts.length)return{vi:'từ ghép: '+parts.join(' · ')}}
  return null;
}
function lookText(t,gl){
  const g=findGl(gl,t);if(g){const e=look1(t);return{vi:g[1],pos:'',c:e&&e.c,cv:e&&e.cv,lv:e&&e.lv,pid:e&&e.pid,x:e&&e.x,ipa:e&&e.ipa}}
  const ws=t.match(/[A-Za-z][A-Za-z'’-]*/g)||[];
  if(ws.length<=1)return look1(t)||{vi:''};
  const parts=ws.map(w=>{const e=look1(w);return e?w+' = '+e.vi:null}).filter(Boolean);
  return{vi:parts.join('; '),multi:1};
}
/* ---- bảng chọn từ ---- */
let tip=null;
function closeTip(){if(tip){tip.remove();tip=null}}
function openTip(word,r,src,ctx){
  closeTip();const saved=findW(word);r=r||{vi:''};
  tip=document.createElement('div');tip.className='gtip';
  tip.innerHTML='<h3>'+esc(word)+(r.lv?' <span class="lvb" style="font-size:.72rem;vertical-align:middle">'+r.lv.toUpperCase()+'</span>':'')+'</h3>'
   +'<div style="color:var(--muted);font-size:.92rem">'+(r.ipa?'<span style="font-family:Georgia,serif">'+esc(r.ipa)+'</span> ':'')+(r.pos?'· '+esc(r.pos):'')+'</div>'
   +'<div class="mean" style="margin:2px 0 4px;font-size:1.05rem">'+(r.vi?esc(r.vi):'<span style="color:var(--muted)">Chưa có nghĩa sẵn cho từ này.</span>')+'</div>'
   +(r.lv?'<div style="margin:2px 0 4px"><a class="lvb" href="../vocab/#/'+r.lv+(r.pid?'/'+r.pid:'')+'" target="_blank" rel="noopener">Mở trong tab Từ vựng '+r.lv.toUpperCase()+' ↗</a></div>':'')
   +(r.x?'<div style="margin:4px 0;color:var(--muted);font-size:.92rem"><b>Ví dụ:</b> '+esc(r.x)+'</div>':'')
   +(r.c?'<div style="margin:4px 0;color:var(--muted);font-size:.92rem"><b>Cụm:</b> '+esc(r.c)+(r.cv?' — '+esc(r.cv):'')+'</div>':'')
   +'<div class="row" style="margin-top:8px"><button class="icon-btn" type="button" data-a="say">'+ICON+' Nghe</button><button class="btn sm" type="button" data-a="'+(saved?'del':'save')+'">'+(saved?'Bỏ khỏi danh sách':'Lưu để học')+'</button><button class="btn sm" type="button" data-a="x">Đóng</button></div>';
  document.body.appendChild(tip);if(/^[A-Za-z'’-]+$/.test(word.trim()))speak(word.trim());
  tip.onclick=ev=>{const a=ev.target.closest('[data-a]');if(!a)return;const k=a.dataset.a;
    if(k==='say')speak(word);
    else if(k==='save'){saveW({w:word.trim(),vi:r.vi||'',c:r.c||'',cv:r.cv||'',src:src,ctx:ctx||''});toast('Đã lưu "'+word.trim()+'"');closeTip()}
    else if(k==='del'){delW(word);toast('Đã bỏ');closeTip()}
    else closeTip()};
}
function bindStudy(root,src,glOf){
  root.addEventListener('click',ev=>{
    const studying=document.body.classList.contains('study');
    if(ev.target.closest('[data-say],[data-play]'))return;
    if(!studying){
      const sent0=ev.target.closest('.sent');const gl0=glOf(sent0)||[];const c0=sent0?sent0.dataset.en:'';
      const g0=ev.target.closest('.gw');if(g0){const it=gl0[+g0.dataset.g];if(it)openTip(it[0],lookText(it[0],gl0),src(sent0),c0);return}
      const w0=ev.target.closest('.w.v');if(w0){const t=w0.textContent;openTip(t,lookText(t,gl0),src(sent0),c0)}
      return}
    const s=getSelection(),sel=String(s||'').trim();
    const sent=ev.target.closest('.sent');const ctx=sent?sent.dataset.en:'';const gl=glOf(sent)||[];
    if(sel.length>=2&&sel.length<=80&&s.anchorNode&&root.contains(s.anchorNode)){const t=sel.replace(/\s+/g,' ');openTip(t,lookText(t,gl),src(sent),ctx);return}
    const g=ev.target.closest('.gw');
    if(g){const it=gl[+g.dataset.g];openTip(it[0],lookText(it[0],gl),src(sent),ctx);return}
    const w=ev.target.closest('.w');
    if(w){const t=w.textContent;openTip(t,lookText(t,gl),src(sent),ctx)}
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
/* ---- đọc đoạn bằng giọng AI Anh-Anh (nếu có file), không thì giọng trình duyệt ---- */
const pUrl=t=>{const m=window.SE_GTP||{};return m[t]?'tts/'+SE.sex()+'/p/'+m[t]+'.mp3':null};
const sayP=t=>{const u=pUrl(t);if(u)SE.play(u);else speak(t)};
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
    $$('#paras [data-say]').forEach(b=>b.onclick=ev=>{ev.stopPropagation();sayP(b.dataset.say)});
    $$('#paras .rp.hide').forEach(d=>d.addEventListener('click',ev=>{if(ev.target.closest('button,.w'))return;if(!d.classList.contains('rev')){d.classList.add('rev')}}));
  };
  main.innerHTML='<div class="gtmodes"><div class="seg" role="group" aria-label="Chế độ hiển thị"><button type="button" data-m="bi">Song ngữ</button><button type="button" data-m="en">Chỉ tiếng Anh</button><button type="button" data-m="hide">Che tiếng Anh</button></div><button class="sw2" id="st" type="button" title="Bấm vào bất kỳ từ nào để xem nghĩa">Chọn từ vựng</button><button class="btn sm" id="all" type="button">Nghe cả bài</button></div>'
   +'<div id="hint" class="note" style="margin-top:10px;display:none">Đang bật <b>chọn từ vựng</b>: chạm vào bất kỳ từ nào để xem nghĩa (và cụm từ nếu có), hoặc bôi đen cả cụm. Các cụm gạch vàng là từ vựng trọng tâm của bài.</div>'
   +'<div id="paras" style="margin-top:16px"></div>'
   +(r.g.length?'<h2 class="sect" style="margin-top:22px">Từ vựng gợi ý trong bài ('+r.g.length+')</h2><div class="grid" id="gl" style="margin-top:10px"></div>':'')
   +'<div class="row" style="margin-top:22px;display:flex;gap:8px;flex-wrap:wrap;justify-content:space-between"><button class="btn" id="dn" type="button">'+(prog.get(itemKey('r',uid,+i))==='ok'?'Đã học (bỏ đánh dấu)':'Đánh dấu đã học')+'</button><a class="btn sm" href="#/words">Từ đã lưu ('+words().length+')</a></div>';
  if(r.g.length)$('#gl').innerHTML=r.g.map((g,k)=>'<div class="wcard"><div><b>'+esc(g[0])+'</b><small>'+esc(g[1])+'</small></div><button class="icon-btn" type="button" data-gi="'+k+'" aria-label="Lưu từ">+ Lưu</button></div>').join('');
  $$('#gl [data-gi]').forEach(b=>b.onclick=()=>{const g=r.g[+b.dataset.gi];saveW({w:g[0],vi:g[1],src:u.label+' · '+r.label,ctx:''});toast('Đã lưu "'+g[0]+'"')});
  $$('.seg [data-m]').forEach(b=>b.onclick=()=>{mode=b.dataset.m;SE.put('se:gtmode',mode);render()});
  $('#st').onclick=()=>{study=!study;$('#hint').style.display=study?'':'none';render()};
  $('#all').onclick=()=>{const us=r.p.map(p=>pUrl(p[0]));if(us.every(Boolean))SE.playList(us);else speak(r.p.map(p=>p[0]).join(' '))};
  $('#dn').onclick=()=>{const k=itemKey('r',uid,+i);prog.set(k,prog.get(k)==='ok'?null:'ok');reading(uid,i)};
  render();
  bindStudy($('#paras'),()=>u.label+' · '+r.label,()=>r.g);
  document.title=r.title+' — Giáo trình';
}
/* ---- bài nghe ---- */
function listening(uid,i){
  const u=UB[uid],l=u&&u.listening[+i];if(!l)return home();
  head({h1:'Track '+String(l.track).padStart(2,'0')+' · '+l.title,crumb:'<a href="#/">Giáo trình</a> › '+esc(u.label)+' › Listening',lead:esc(u.title)+' · '+esc(l.vi),meta:[l.type,mmss(l.dur||0)]});
  let show=false,vi=true,study=false,seg=null,segEnd=0;
  const aligned=l.l.some(x=>x[1].some(y=>y[1]!=null));
  const sentHtml=(y,k)=>'<span class="ss" data-k="'+k+'">'+plain(y[0],study)+'</span> <button class="icon-btn spk" type="button" data-play="'+k+'" aria-label="Nghe câu này">'+ICON+'</button> ';
  const body=()=>{
    document.body.classList.toggle('study',study);document.body.classList.toggle('novi',!vi);
    const el=$('#scr');
    if(!show){el.innerHTML='<div class="scr-off">Script đang ẩn. Hãy nghe và làm bài trước, rồi bấm <b>Xem script</b> để đối chiếu.</div>';return}
    const dlg=l.l.some(x=>x[0]);let k=0;
    el.innerHTML=l.l.map(x=>{const en=x[1].map(y=>sentHtml(y,k++)).join('');const raw=x[1].map(y=>y[0]).join(' ');
      return dlg?'<div class="lrow sent" data-en="'+esc(raw)+'"><span class="sp">'+esc(x[0])+'</span><div class="en">'+en+'</div><div class="vi">'+esc(x[2])+'</div></div>'
      :'<div class="lmono sent" data-en="'+esc(raw)+'"><p class="en">'+en+'</p><p class="vi">'+esc(x[2])+'</p></div>'}).join('');
    $$('#scr [data-play]').forEach(b=>b.onclick=ev=>{ev.stopPropagation();playSeg(+b.dataset.play)});
    mark();
  };
  const flat=[];l.l.forEach(x=>x[1].forEach(y=>flat.push(y)));
  const mark=()=>{$$('#scr .ss').forEach(e=>e.classList.toggle('playing',seg!=null&&+e.dataset.k===seg));$$('#scr [data-play]').forEach(b=>b.classList.toggle('on',seg!=null&&+b.dataset.play===seg))};
  const au0=()=>$('#au');
  function playSeg(k){
    const au=au0(),y=flat[k];
    if(seg===k&&!au.paused){au.pause();seg=null;mark();return}
    if(y[1]==null){speak(y[0]);return}
    seg=k;segEnd=y[2];au.currentTime=y[1];au.play();mark();
  }
  main.innerHTML='<div class="player"><audio id="au" controls preload="metadata" src="audio/t'+String(l.track).padStart(2,'0')+'.mp3"></audio><div class="row"><button class="btn sm" id="b5" type="button">« 5 giây</button><button class="btn sm" id="f5" type="button">5 giây »</button><span class="seg" role="group" aria-label="Tốc độ"><button type="button" data-s=".75">0.75×</button><button type="button" data-s="1" class="on">1×</button><button type="button" data-s="1.25">1.25×</button></span></div></div>'
   +'<div class="gtmodes" style="position:static"><button class="sw2" id="sh" type="button">Xem script</button><button class="sw2 on" id="sv" type="button">Bản dịch</button><button class="sw2" id="st" type="button" title="Bấm vào bất kỳ từ nào để xem nghĩa">Chọn từ vựng</button></div>'
   +(aligned?'<p class="hintline">Bấm biểu tượng loa cạnh mỗi câu để nghe riêng câu đó; bấm lần nữa để dừng. Thanh audio phía trên luôn ghim khi bạn cuộn.</p>':'')+'<div id="scr"></div>'
   +'<div class="row" style="margin-top:22px;display:flex;gap:8px;flex-wrap:wrap;justify-content:space-between"><button class="btn" id="dn" type="button">'+(prog.get(itemKey('l',uid,+i))==='ok'?'Đã nghe (bỏ đánh dấu)':'Đánh dấu đã nghe')+'</button><span>'+(+i>0?'<a class="btn sm" href="#/l/'+uid+'/'+(+i-1)+'">← Track trước</a> ':'')+(+i<u.listening.length-1?'<a class="btn sm" href="#/l/'+uid+'/'+(+i+1)+'">Track sau →</a>':'')+'</span></div>';
  const au=$('#au');
  au.addEventListener('timeupdate',()=>{if(seg!=null&&au.currentTime>=segEnd){au.pause();seg=null;mark()}});
  au.addEventListener('pause',()=>{if(seg!=null&&au.currentTime<segEnd-.3){seg=null;mark()}});
  au.addEventListener('play',()=>{if(seg!=null&&(au.currentTime<flat[seg][1]-.3||au.currentTime>segEnd)){seg=null;mark()}});
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
  const rend=()=>{wl.innerHTML=words().map(w=>'<div class="wcard"><div><b>'+esc(w.w)+'</b> <button class="icon-btn" type="button" data-say="'+esc(w.w)+'" aria-label="Nghe">'+ICON+'</button><small class="wv">'+esc(w.vi||'(chưa có nghĩa)')+'</small><small>'+esc(w.src||'')+'</small>'+(w.c?'<small>Cụm: '+esc(w.c)+(w.cv?' — '+esc(w.cv):'')+'</small>':'')+(w.ctx?'<small style="font-family:var(--serif)">“'+esc(w.ctx)+'”</small>':'')+'</div><button class="icon-btn" type="button" data-del="'+esc(w.w)+'" aria-label="Xóa">Xóa</button></div>').join('');
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
function route(){closeTip();const st=document.querySelector('.strip');if(st)document.documentElement.style.setProperty('--stripH',st.offsetHeight+'px');document.body.classList.remove('study','novi');const h=location.hash.replace(/^#\/?/,'').split('/').filter(Boolean);
  if(!h.length)home();else if(h[0]==='r')reading(h[1],h[2]);else if(h[0]==='l')listening(h[1],h[2]);else if(h[0]==='words')wordsPage();else home();window.scrollTo(0,0)}
window.addEventListener('hashchange',route);route();
})();
