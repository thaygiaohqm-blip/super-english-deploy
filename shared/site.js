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
  const setSex=x=>{sex=x;put('se:voice',x);pick();const b=document.querySelector('.vbtn span');if(b)b.textContent=x==='f'?'Giọng nữ':'Giọng nam';const vb=document.querySelector('.vbtn');if(vb)vb.dataset.sex=x;speak('Hello, this is the '+(x==='f'?'female':'male')+' voice.')};
  const swipe=(el,left,right,o)=>{if(!el)return;o=o||{};let x0=0,y0=0,t0=0,dx=0,on=false,lock=0,hint=null;const W=()=>el.offsetWidth||300;
    const can=d=>d<0?(o.l?o.l():true):(o.r?o.r():true);
    const reset=()=>{el.classList.remove('drag');el.classList.add('snap');el.style.transform='';el.style.opacity='';setTimeout(()=>el.classList.remove('snap'),260);if(hint){hint.remove();hint=null}};
    el.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;if(e.target.closest('button,a,[data-say]'))return;x0=e.clientX;y0=e.clientY;t0=Date.now();dx=0;on=true;lock=0;el._moved=false});
    el.addEventListener('pointermove',e=>{if(!on)return;const mx=e.clientX-x0,my=e.clientY-y0;
      if(!lock){if(Math.abs(mx)>8&&Math.abs(mx)>Math.abs(my)*1.2){lock=1;try{el.setPointerCapture(e.pointerId)}catch(_){}el.classList.remove('snap');el.classList.add('drag');hint=document.createElement('div');hint.className='swhint';el.appendChild(hint)}else if(Math.abs(my)>10){lock=2}}
      if(lock!==1)return;e.preventDefault();el._moved=true;dx=mx;const ok=can(dx<0?-1:1),k=ok?1:.25,x=dx*k,r=Math.max(-14,Math.min(14,x/W()*22));
      el.style.transform='translateX('+x+'px) rotate('+r+'deg)';el.style.opacity=String(1-Math.min(.35,Math.abs(x)/W()*.5));
      if(hint){hint.textContent=dx<0?'Thẻ sau →':'← Thẻ trước';hint.dataset.d=dx<0?'l':'r';hint.style.opacity=ok?String(Math.min(1,Math.abs(dx)/(W()*.3))):'0'}});
    const end=e=>{if(!on)return;on=false;if(lock!==1){return}const v=Math.abs(dx)/Math.max(1,Date.now()-t0),d=dx<0?-1:1;
      if((Math.abs(dx)>W()*.28||v>.6&&Math.abs(dx)>40)&&can(d)){el.classList.remove('drag');el.classList.add('fly');el.style.transform='translateX('+(d*W()*1.3)+'px) rotate('+(d*18)+'deg)';el.style.opacity='0';
        setTimeout(()=>{(d<0?left:right)();const n=document.getElementById(el.id);if(n&&n!==el){n.classList.add(d<0?'in-l':'in-r')}},190)}
      else reset();setTimeout(()=>{el._moved=false},0)};
    el.addEventListener('pointerup',end);el.addEventListener('pointercancel',()=>{if(on&&lock===1){on=false;reset()}else on=false});
    el.addEventListener('click',e=>{if(el._moved){e.stopImmediatePropagation();e.preventDefault()}},true)};
  let tt;const toast=m=>{let t=document.querySelector('.toast');if(!t){t=document.createElement('div');t.className='toast';document.body.appendChild(t)}t.textContent=m;t.hidden=false;clearTimeout(tt);tt=setTimeout(()=>t.hidden=true,2200)};
  const norm=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
  window.SE={esc,shuffle,store,speak,toast,norm,root,get,put,swipe};
  const logo='<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="10" fill="#27c4b5"/><path d="M12 11h16v4H17v4h9v4h-9v4h11v4H12z" fill="#003838"/><circle cx="31" cy="30" r="4" fill="#ed3838"/></svg>';
  const link=(h,l,id)=>'<a href="'+root+h+'"'+(page===id?' aria-current="true"':'')+'>'+l+'</a>';
  const s=document.createElement('div');s.className='strip';
  s.innerHTML='<div class="strip__in"><a class="brand" href="'+root+'index.html" title="Trang chủ">'+logo+'<span>Super<b>English</b></span></a><nav class="snav" aria-label="Công cụ">'+link('vocab/index.html','Từ vựng','vocab')+link('writing/index.html','Writing','writing')+link('speaking/index.html','Speaking','speaking')+link('giaotrinh/index.html','Giáo trình','giaotrinh')+'</nav><button class="tbtn vbtn" type="button" aria-label="Đổi giọng đọc nữ / nam" title="Đổi giọng đọc nữ / nam" data-sex="'+sex+'"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg><span>'+(sex==='f'?'Giọng nữ':'Giọng nam')+'</span></button><button class="tbtn abtn" type="button" aria-label="Tài khoản" title="Đăng nhập để lưu tiến độ"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg><span>Đăng nhập</span></button><button class="tbtn mbtn" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Đổi màu giao diện" title="Đổi màu giao diện"><i class="dot"></i><span>Màu</span></button></div>';
  document.body.insertBefore(s,document.body.firstChild);
  const btn=s.querySelector('.mbtn');s.querySelector('.vbtn').onclick=()=>setSex(sex==='f'?'m':'f');let menu=null;
  btn.onclick=e=>{e.stopPropagation();if(menu){menu.remove();menu=null;btn.setAttribute('aria-expanded','false');return}
    menu=document.createElement('div');menu.className='tmenu';menu.setAttribute('role','menu');const cur=get('se:theme')||'reu';
    menu.innerHTML=THEMES.map(t=>'<button type="button" role="menuitemradio" aria-checked="'+(t[0]===cur)+'" data-t="'+t[0]+'"><i><b style="background:'+t[2]+'"></b><b style="background:'+t[3]+'"></b><b style="background:'+t[4]+'"></b></i>'+t[1]+'</button>').join('');
    menu.onclick=ev=>{const b=ev.target.closest('[data-t]');if(!b)return;put('se:theme',b.dataset.t);applyTheme(b.dataset.t);menu.remove();menu=null};
    document.body.appendChild(menu);const r=btn.getBoundingClientRect();menu.style.top=(r.bottom+8)+'px';menu.style.right=Math.max(8,innerWidth-r.right)+'px';btn.setAttribute('aria-expanded','true')};
  addEventListener('scroll',()=>{if(menu){menu.remove();menu=null;btn.setAttribute('aria-expanded','false')}},{passive:true});
  document.addEventListener('click',()=>{if(menu){menu.remove();menu=null}});
  const au=document.createElement('script');au.src=root+'shared/auth.js';au.defer=true;document.head.appendChild(au);
  const f=document.createElement('footer');f.className='footer';f.innerHTML='<div class="wrap">Super English · tiến độ học được lưu ngay trên thiết bị của bạn · Từ vựng B1 theo danh sách chính thức của Cambridge; B2, C1, C2 biên soạn theo định hướng English Vocabulary Profile; nghĩa tiếng Việt và cụm từ do Claude biên soạn</div>';
  const addF=()=>document.body.appendChild(f);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addF);else addF();
})();
(function(){const f=()=>{const n=document.querySelector('.snav'),c=n&&n.querySelector('[aria-current="true"]');if(c)n.scrollLeft=Math.max(0,c.offsetLeft-n.clientWidth/2+c.offsetWidth/2)};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(f,0));else setTimeout(f,0)})();
