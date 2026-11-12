/* Super English — phần dùng chung: thanh trên, màu giao diện, lưu tiến độ, đọc phát âm */
(function(){
  const page=document.body.dataset.page||'home';
  const root=document.currentScript.src.replace(/shared\/site\.js.*$/,'');
  const get=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
  const put=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
  const THEMES=[['reu','Rêu','#004646','#27c4b5','#ed3838'],['ai','Chàm','#233a63','#5fa8d8','#e0533d'],['sakura','Anh đào','#7a2e4a','#ee8fae','#d23b3b'],['matcha','Trà xanh','#3f5a22','#a3c45a','#d9622b'],['momiji','Lá phong','#7a2f14','#f2a04a','#c8102e'],['yoru','Ban đêm','#134e4c','#3fd1c0','#ff6b6b']];
  const applyTheme=id=>{if(!id||id==='reu')delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme=id};
  applyTheme(get('se:theme'));
  const esc=t=>String(t==null?'':t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
  const store=(name)=>{let d={};try{d=JSON.parse(get(name)||'{}')}catch(e){}return{get:k=>d[k],set(k,v){if(v==null)delete d[k];else d[k]=v;put(name,JSON.stringify(d));if(window.SE_SYNC)SE_SYNC.dirty(name)},all:()=>d}};
  const FEM=/female|woman|samantha|karen|moira|tessa|victoria|fiona|zira|hazel|susan|aria|jenny|libby|sonia|serena|allison|ava|joanna|kendra|kimberly|salli|ivy|emma|amy|google us english|google uk english female|sfg|iol|#female/i;
  const MAL=/\bmale\b|daniel|david|mark|george|james|alex|fred|ryan|guy|thomas|oliver|arthur|rishi|gordon/i;
  let voice=null,sex=get('se:voice')||'f';
  const pick=()=>{if(!('speechSynthesis' in window))return;const vs=speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang));const us=v=>/en[-_]US/i.test(v.lang)?0:/en[-_]GB/i.test(v.lang)?1:2;const rank=v=>(/natural|neural|online|premium|enhanced/i.test(v.name)?0:/google|samantha|karen|zira|aria|jenny/i.test(v.name)?1:2);
    const f=vs.filter(v=>FEM.test(v.name)&&!/\bmale\b/i.test(v.name.replace(/female/ig,''))).sort((a,b)=>us(a)-us(b)||rank(a)-rank(b));
    const m=vs.filter(v=>MAL.test(v.name)&&!FEM.test(v.name)).sort((a,b)=>us(a)-us(b)||rank(a)-rank(b));
    voice=(sex==='f'?f[0]:m[0])||(sex==='f'?null:vs[0])||null};
  if('speechSynthesis' in window){pick();speechSynthesis.onvoiceschanged=pick}
  const speak=t=>{if(!('speechSynthesis' in window))return toast('Trình duyệt này chưa hỗ trợ đọc phát âm');speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t.replace(/____/g,'blank'));u.lang='en-US';if(voice){u.voice=voice;u.lang=voice.lang}u.rate=.92;if(!voice)u.pitch=sex==='f'?1.3:.85;speechSynthesis.speak(u)};
  const setSex=x=>{sex=x;put('se:voice',x);pick();const b=document.querySelector('.vbtn span');if(b)b.textContent=x==='f'?'Giọng nữ':'Giọng nam';speak('Hello, this is the '+(x==='f'?'female':'male')+' voice.')};
  const swipe=(el,left,right)=>{if(!el)return;let x0=0,y0=0,t0=0;el.addEventListener('touchstart',e=>{const t=e.changedTouches[0];x0=t.clientX;y0=t.clientY;t0=Date.now()},{passive:true});el.addEventListener('touchend',e=>{const t=e.changedTouches[0],dx=t.clientX-x0,dy=t.clientY-y0;if(Math.abs(dx)>50&&Math.abs(dx)>1.5*Math.abs(dy)&&Date.now()-t0<800){e.preventDefault();dx<0?left():right()}},{passive:false})};
  let tt;const toast=m=>{let t=document.querySelector('.toast');if(!t){t=document.createElement('div');t.className='toast';document.body.appendChild(t)}t.textContent=m;t.hidden=false;clearTimeout(tt);tt=setTimeout(()=>t.hidden=true,2200)};
  const norm=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
  window.SE={esc,shuffle,store,speak,toast,norm,root,get,put,swipe};
  const logo='<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="10" fill="#27c4b5"/><path d="M12 11h16v4H17v4h9v4h-9v4h11v4H12z" fill="#003838"/><circle cx="31" cy="30" r="4" fill="#ed3838"/></svg>';
  const link=(h,l,id)=>'<a href="'+root+h+'"'+(page===id?' aria-current="true"':'')+'>'+l+'</a>';
  const s=document.createElement('div');s.className='strip';
  s.innerHTML='<div class="strip__in"><a class="brand" href="'+root+'index.html" title="Trang chủ">'+logo+'<span>Super<b>English</b></span></a><nav class="snav" aria-label="Công cụ">'+link('vocab/index.html','Từ vựng','vocab')+link('writing/index.html','Writing','writing')+link('speaking/index.html','Speaking','speaking')+'</nav><button class="tbtn vbtn" type="button" title="Đổi giọng đọc nữ / nam"><span>'+(sex==='f'?'Giọng nữ':'Giọng nam')+'</span></button><button class="tbtn abtn" type="button" title="Đăng nhập để lưu tiến độ"><span>Đăng nhập</span></button><button class="tbtn mbtn" type="button" aria-haspopup="true" aria-expanded="false" title="Đổi màu giao diện"><i class="dot"></i><span>Màu</span></button></div>';
  document.body.insertBefore(s,document.body.firstChild);
  const btn=s.querySelector('.mbtn');s.querySelector('.vbtn').onclick=()=>setSex(sex==='f'?'m':'f');let menu=null;
  btn.onclick=e=>{e.stopPropagation();if(menu){menu.remove();menu=null;btn.setAttribute('aria-expanded','false');return}
    menu=document.createElement('div');menu.className='tmenu';menu.setAttribute('role','menu');const cur=get('se:theme')||'reu';
    menu.innerHTML=THEMES.map(t=>'<button type="button" role="menuitemradio" aria-checked="'+(t[0]===cur)+'" data-t="'+t[0]+'"><i><b style="background:'+t[2]+'"></b><b style="background:'+t[3]+'"></b><b style="background:'+t[4]+'"></b></i>'+t[1]+'</button>').join('');
    menu.onclick=ev=>{const b=ev.target.closest('[data-t]');if(!b)return;put('se:theme',b.dataset.t);applyTheme(b.dataset.t);menu.remove();menu=null};
    document.body.appendChild(menu);btn.setAttribute('aria-expanded','true')};
  document.addEventListener('click',()=>{if(menu){menu.remove();menu=null}});
  const au=document.createElement('script');au.src=root+'shared/auth.js';au.defer=true;document.head.appendChild(au);
  const f=document.createElement('footer');f.className='footer';f.innerHTML='<div class="wrap">Super English · tiến độ học được lưu ngay trên thiết bị của bạn · Từ vựng B1 theo danh sách chính thức của Cambridge; B2, C1, C2 biên soạn theo định hướng English Vocabulary Profile; nghĩa tiếng Việt và cụm từ do Claude biên soạn</div>';
  const addF=()=>document.body.appendChild(f);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addF);else addF();
})();
