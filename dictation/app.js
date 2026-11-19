/* Dictation — nghe từng câu rồi gõ lại; chấm từng từ, hiệu ứng đúng/sai */
(function(){
const {esc,toast}=SE;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const main=$('#main'),H1=$('#h1'),LEAD=$('#lead'),CRUMB=$('#crumb'),META=$('#meta');
const D=window.SE_DICT||[],BY=Object.fromEntries(D.map(x=>[x.id,x]));
const st=SE.store('se:dict');
const head=o=>{H1.textContent=o.h1;LEAD.innerHTML=o.lead||'';CRUMB.innerHTML=o.crumb||'';META.innerHTML=(o.meta||[]).map(x=>'<span class="chip">'+esc(x)+'</span>').join('')};
const PLAY='<svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
const PAUSE='<svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';
const key=(id,k)=>id+':'+k;
const best=(id,k)=>st.get(key(id,k));

/* ---------- âm thanh: phát đoạn [a,b] của file dài ---------- */
let AU=null,AUid=null,timer=null,onStop=null;
function audio(ex){
  if(AU&&AUid===ex.id)return AU;
  if(AU){AU.pause()}
  AU=new Audio();AU.preload='auto';AU.src=SE.root+'dictation/'+ex.audio;AUid=ex.id;return AU;
}
function stopSeg(){clearInterval(timer);timer=null;if(AU)AU.pause();if(onStop){const f=onStop;onStop=null;f()}}
function playSeg(ex,a,b,rate,done){
  const au=audio(ex);stopSeg();onStop=done||null;
  au.playbackRate=rate||1;au.preservesPitch=true;
  const go=()=>{try{au.currentTime=a}catch(e){}au.playbackRate=rate||1;au.play().catch(()=>{toast('Không phát được âm thanh. Hãy bấm nút phát.');stopSeg()});
    clearInterval(timer);timer=setInterval(()=>{if(au.currentTime>=b-.02||au.ended){stopSeg()}},30)};
  if(au.readyState>=1)go();else au.addEventListener('loadedmetadata',go,{once:true});
}

/* ---------- so khớp từng từ ---------- */
const CON={"i'm":'i am',"it's":'it is',"he's":'he is',"she's":'she is',"that's":'that is',"what's":'what is',"there's":'there is',"you're":'you are',"we're":'we are',"they're":'they are',"i've":'i have',"don't":'do not',"doesn't":'does not',"didn't":'did not',"can't":'can not',"cannot":'can not',"won't":'will not',"isn't":'is not',"aren't":'are not',"wasn't":'was not',"haven't":'have not',"hasn't":'has not',"i'd":'i would',"i'll":'i will',"let's":'let us',"couldn't":'could not',"wouldn't":'would not',"shouldn't":'should not',"you've":'you have',"we've":'we have',"they've":'they have',"who's":'who is',"you'll":'you will',"we'll":'we will',"they'll":'they will'};
/* mỗi từ hiển thị -> danh sách token chuẩn hoá */
function words(t){
  return String(t).trim().split(/\s+/).filter(Boolean).map(w=>{
    const n=w.toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9']+/g,' ').trim().split(/\s+/).filter(Boolean).flatMap(x=>{x=x.replace(/^'+|'+$/g,'');return x?(CON[x]||(/^[a-z]+'s$/.test(x)?x.slice(0,-2)+' is':x)).split(' '):[]});
    return{w,t:n};
  }).filter(x=>x.t.length);
}
const lev=(a,b)=>{const m=a.length,n=b.length;let p=Array.from({length:n+1},(_,i)=>i);for(let i=1;i<=m;i++){const c=[i];for(let j=1;j<=n;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c}return p[n]};
function compare(target,typed){
  const T=words(target),U=words(typed);
  const tt=[],ti=[];T.forEach((w,i)=>w.t.forEach(x=>{tt.push(x);ti.push(i)}));
  const ut=[],ui=[];U.forEach((w,i)=>w.t.forEach(x=>{ut.push(x);ui.push(i)}));
  const n=tt.length,m=ut.length,dp=Array.from({length:n+1},()=>new Int16Array(m+1));
  for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)dp[i][j]=tt[i]===ut[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
  const tm=new Array(n).fill(null),um=new Array(m).fill(false);let i=0,j=0;
  while(i<n&&j<m){if(tt[i]===ut[j]){tm[i]=j;um[j]=true;i++;j++}else if(dp[i+1][j]>=dp[i][j+1])i++;else j++}
  /* trong mỗi khoảng chưa khớp, ghép theo thứ tự để tìm từ gõ gần đúng (sai 1–2 chữ) */
  const near=new Array(n).fill(null);let pi=0,pj=0;const anchors=[];tm.forEach((v,k)=>{if(v!=null)anchors.push([k,v])});anchors.push([n,m]);
  for(const [ai,aj] of anchors){const g=[],h=[];for(let k=pi;k<ai;k++)g.push(k);for(let k=pj;k<aj;k++)h.push(k);
    for(let q=0;q<Math.min(g.length,h.length);q++){const a=tt[g[q]],b=ut[h[q]],d=lev(a,b);if(d>0&&d<=(a.length>=7?2:a.length>=4?1:0)){near[g[q]]=h[q];um[h[q]]='near'}}
    pi=ai+1;pj=aj+1}
    const tw=T.map(()=>({ok:true,near:false})),uw=U.map(()=>({ok:true,near:false}));
  for(let k=0;k<n;k++){if(tm[k]==null){const w=tw[ti[k]];if(near[k]!=null)w.near=true;else w.ok=false;}}
  for(let k=0;k<m;k++){if(um[k]===false)uw[ui[k]].ok=false;else if(um[k]==='near'&&uw[ui[k]].ok)uw[ui[k]].near=true}
  /* một từ "gần đúng" chỉ khi mọi token sai của nó đều gần đúng */
  tw.forEach((w,x)=>{if(!w.ok)w.near=false});
  const exact=T.every((_,x)=>tw[x].ok&&!tw[x].near)&&uw.every(w=>w.ok&&!w.near)&&m>0;
  const okTok=tm.filter(v=>v!=null).length;
  const near2=near.filter(v=>v!=null).length;
  return{T,U,tw,uw,exact,pct:n?Math.round(100*(okTok+.5*near2)/Math.max(n,m>n?m:n)):0};
}

/* ---------- danh sách ---------- */
function secUnits(ex,s){return ex.u.map((u,k)=>({u,k})).filter(x=>x.u[0]===s)}
function sec(ex,s){const us=secUnits(ex,s),d=us.filter(x=>best(ex.id,x.k)!=null).length;return{n:us.length,d}}
function list(){
  stopSeg();
  head({h1:'Dictation',lead:'Nghe từng câu rồi gõ lại đúng những gì bạn nghe được. Hệ thống chấm từng từ, báo ngay đúng/sai và cho xem đáp án kèm bản dịch tiếng Việt.',crumb:'',meta:[D.length+' bài']});
  main.innerHTML='<div class="dlist">'+D.map(ex=>{const tot=ex.u.length,done=ex.u.filter((_,k)=>best(ex.id,k)!=null).length;
    return'<article class="dex"><h2>'+esc(ex.title)+'</h2><p>'+esc(ex.sub)+' · '+tot+' câu · '+done+'/'+tot+' đã làm</p><div class="pbar"><i style="width:'+(100*done/tot)+'%"></i></div><div class="dsecs" style="margin-top:12px">'
    +ex.secs.map(s=>{const c=sec(ex,s.n-1);return'<a href="#/'+ex.id+'/'+s.n+'"><b>Section '+s.n+'</b><br>'+esc(s.t)+'<br><small>'+c.d+'/'+c.n+' câu</small><div class="pbar"><i style="width:'+(100*c.d/c.n)+'%"></i></div></a>'}).join('')+'</div>'
    +'<p style="margin-top:12px"><a class="btn ghost sm" href="#/'+ex.id+'/ts">Xem transcript song ngữ</a></p></article>'}).join('')+'</div>';
}
/* ---------- làm bài ---------- */
let SP=1;const RATES=[1,.75,.5,1.25];
function practice(ex,s,start){
  const us=secUnits(ex,s-1);if(!us.length)return list();
  let i=Math.max(0,Math.min(us.length-1,start||0)),checked=false,hint=0;
  const meta=ex.secs[s-1];
  head({h1:'Section '+s+' · '+meta.t,lead:esc(ex.title),crumb:'<a href="#/">Dictation</a>',meta:[us.length+' câu']});
  const tabs=()=>'<nav class="dtabs">'+ex.secs.map(x=>'<a href="#/'+ex.id+'/'+x.n+'"'+(x.n===s?' aria-current="true"':'')+'>Section '+x.n+'</a>').join('')+'<a href="#/'+ex.id+'/ts">Transcript</a></nav>';
  main.innerHTML=tabs()+'<div id="dots" class="dots"></div><div id="card"></div>';
  const dots=()=>{$('#dots').innerHTML=us.map((x,q)=>{const b=best(ex.id,x.k);return'<button type="button" class="'+(b==null?'':b>=100?'ok':'mid')+(q===i?' cur':'')+'" data-q="'+q+'" aria-label="Câu '+(q+1)+'">'+(q+1)+'</button>'}).join('');
    $$('#dots button').forEach(b=>b.onclick=()=>{i=+b.dataset.q;render()})};
  const play=()=>{const {u}=us[i];const btn=$('#pl');btn.classList.add('on');btn.innerHTML=PAUSE;playSeg(ex,u[4],u[5],SP,()=>{const b=$('#pl');if(b){b.classList.remove('on');b.innerHTML=PLAY}})};
  const toggle=()=>{if(AU&&!AU.paused&&timer){stopSeg()}else play()};
  function render(auto){
    stopSeg();checked=false;hint=0;const {u,k}=us[i];const wc=words(u[2]).length;
    $('#card').innerHTML='<div class="dcard" id="dc"><div class="dhead"><span>Câu '+(i+1)+'/'+us.length+' · '+wc+' từ'+(best(ex.id,k)!=null?' · tốt nhất '+best(ex.id,k)+'%':'')+'</span><span><span class="kbd">Tab</span> nghe lại · <span class="kbd">Enter</span> kiểm tra</span></div>'
     +'<div class="dctl"><button class="btn ghost sm" id="prev" type="button"'+(i?'':' disabled')+'>← Trước</button><button class="dplay" id="pl" type="button" aria-label="Nghe câu này">'+PLAY+'</button><button class="btn ghost sm" id="next" type="button"'+(i<us.length-1?'':' disabled')+'>Sau →</button></div>'
     +'<div class="dctl" style="margin-top:-6px"><button class="btn ghost sm" id="rate" type="button">Tốc độ '+SP+'x</button><button class="btn ghost sm" id="hint" type="button">Gợi ý</button></div>'
     +'<div id="hn"></div><textarea class="dtx" id="tx" rows="3" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="Nghe rồi gõ lại câu bạn nghe được…" aria-label="Câu bạn nghe được"></textarea>'
     +'<div class="row" style="margin-top:12px"><button class="btn" id="ck" type="button">Kiểm tra</button><button class="btn ghost" id="ans" type="button">Xem đáp án</button></div><div id="res" class="dres" aria-live="polite"></div></div>';
    dots();const tx=$('#tx');
    $('#pl').onclick=toggle;$('#rate').onclick=()=>{SP=RATES[(RATES.indexOf(SP)+1)%RATES.length];$('#rate').textContent='Tốc độ '+SP+'x';if(AU)AU.playbackRate=SP};
    $('#prev').onclick=()=>{if(i){i--;render(true)}};$('#next').onclick=()=>{if(i<us.length-1){i++;render(true)}};
    $('#hint').onclick=()=>{const w=words(u[2]);hint=Math.min(w.length,hint+1);$('#hn').innerHTML='<div class="dhint">'+w.map((x,q)=>q<hint?esc(x.w):esc(x.w[0])+'_'.repeat(Math.max(1,Math.min(8,x.w.replace(/[^A-Za-z0-9]/g,'').length-1)))).join(' ')+'</div>'};
    $('#ck').onclick=check;$('#ans').onclick=()=>reveal(null);
    tx.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();if(checked&&lastExact)goNext();else check()}else if(e.key==='Tab'){e.preventDefault();toggle()}});
    if(auto)setTimeout(()=>{play();tx.focus()},120);else tx.focus({preventScroll:true});
  }
  let lastExact=false;
  function goNext(){if(i<us.length-1){i++;render(true)}else{stopSeg();toast('Đã hết section '+s+'!');location.hash='#/'+ex.id+'/'+(s<ex.secs.length?s+1:'')}}
  function reveal(r){
    const {u,k}=us[i];const w=words(u[2]);const ans=w.map((x,q)=>'<span class="dw '+(r?(r.tw[q].ok&&!r.tw[q].near?'ok':r.tw[q].near?'near':'no'):'')+'">'+esc(x.w)+'</span>').join(' ');
    let h='';
    if(r){h+='<div class="row"><div class="dscore'+(r.exact?'':(r.pct<60?' lo':''))+'">'+(r.exact?'Chính xác 100%':r.pct+'%')+'</div></div>';
      h+='<div class="ln"><span class="lb">Bạn gõ</span>'+r.U.map((x,q)=>{const f=r.uw[q];return'<span class="dw '+(!f.ok?'ex':f.near?'near':'ok')+'">'+esc(x.w)+'</span>'}).join(' ')+'</div>'}
    h+='<div class="ln"><span class="lb">Đáp án</span>'+(u[1]?'<span class="dsp">'+esc(u[1])+'</span>':'')+ans+'</div>'
      +'<div class="dvi">'+esc(u[3])+'</div><div class="row" style="margin-top:12px">'+(r&&!r.exact?'<button class="btn ghost" id="again" type="button">Gõ lại</button>':'')+'<button class="btn ghost" id="rp" type="button">Nghe lại</button><button class="btn" id="go" type="button">'+(i<us.length-1?'Câu tiếp →':'Hoàn thành section')+'</button></div>';
    $('#res').innerHTML=h;$('#rp').onclick=play;$('#go').onclick=goNext;const ag=$('#again');if(ag)ag.onclick=()=>{$('#res').innerHTML='';checked=false;$('#tx').classList.remove('bad','ok');$('#tx').focus();$('#tx').select()};
    checked=true;
  }
  function check(){
    const {u,k}=us[i],t=$('#tx').value.trim();if(!t){toast('Hãy gõ câu bạn nghe được rồi bấm Kiểm tra.');return}
    const r=compare(u[2],t);lastExact=r.exact;const b=best(ex.id,k),sc=r.exact?100:r.pct;if(b==null||sc>b)st.set(key(ex.id,k),sc);
    const tx=$('#tx');tx.classList.remove('ok','bad');tx.classList.add(r.exact?'ok':'bad');reveal(r);dots();
    SE.fx&&SE.fx(r.exact,$('#dc'));if(r.exact)setTimeout(play,350);
    $('#res').scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  render(false);
}
/* ---------- transcript song ngữ ---------- */
function transcript(ex){
  stopSeg();head({h1:'Transcript',lead:esc(ex.title),crumb:'<a href="#/">Dictation</a>',meta:[ex.u.length+' câu']});
  const tabs='<nav class="dtabs">'+ex.secs.map(x=>'<a href="#/'+ex.id+'/'+x.n+'">Section '+x.n+'</a>').join('')+'<a href="#/'+ex.id+'/ts" aria-current="true">Transcript</a></nav>';
  main.innerHTML=tabs+ex.secs.map((s,si)=>'<h2 class="trh">Section '+s.n+' · '+esc(s.t)+'</h2><div class="trl">'+secUnits(ex,si).map(x=>'<div class="tru"><div><div class="en">'+(x.u[1]?'<span class="dsp">'+esc(x.u[1])+'</span>':'')+esc(x.u[2])+'</div><div class="vi">'+esc(x.u[3])+'</div></div><button class="icon-btn" type="button" data-a="'+x.u[4]+'" data-b="'+x.u[5]+'" aria-label="Nghe">▶</button></div>').join('')+'</div>').join('');
  $$('[data-a]').forEach(b=>b.onclick=()=>playSeg(ex,+b.dataset.a,+b.dataset.b,1));
}
function route(){
  const p=location.hash.replace(/^#\/?/,'').split('/').filter(Boolean);window.scrollTo(0,0);
  const ex=BY[p[0]];if(!ex)return list();
  if(p[1]==='ts')return transcript(ex);
  const s=+p[1];if(!s)return list();practice(ex,s,0);
}
window.addEventListener('hashchange',route);route();
})();
