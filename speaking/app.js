(function(){
const {esc,store,speak,toast,get,put}=SE;
const prog=store('se:speaking');
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const main=$('#main'),H1=$('#h1'),LEAD=$('#lead'),CRUMB=$('#crumb'),META=$('#meta');
const TP=window.SE_SPEAK,TB=Object.fromEntries(TP.map(t=>[t.id,t]));
const BANDS=[['45','4–5'],['56','5–6'],['67','6–7'],['78','7–8'],['89','8–9']];
const DESC={
'45':['Nói được ý đơn giản bằng câu ngắn, hay dừng và lặp từ.','Từ vựng cơ bản, ít từ đồng nghĩa.','Chủ yếu câu đơn; dễ sai thì và mạo từ.','Ý chính còn rời rạc, ít liên kết.'],
'56':['Nói được khá dài nhưng còn ngập ngừng, tự sửa.','Từ vựng đủ cho chủ đề quen thuộc, thỉnh thoảng diễn đạt vòng.','Có câu phức đơn giản (because, when, so); còn lỗi.','Có liên kết cơ bản: also, after that.'],
'67':['Nói khá trôi chảy, ngập ngừng chủ yếu khi tìm ý.','Dùng được vài cụm và thành ngữ thông dụng, diễn đạt lại khi cần.','Trộn câu đơn và câu phức, lỗi không cản trở hiểu.','Triển khai ý rõ: nêu lý do, ví dụ, cảm nhận.'],
'78':['Trôi chảy, ngập ngừng hiếm.','Từ vựng linh hoạt, có collocation và thành ngữ ít gặp.','Nhiều cấu trúc phức, đa số câu đúng.','Ý được triển khai đầy đủ, liên kết tự nhiên, có đối chiếu.'],
'89':['Nói tự nhiên như người bản ngữ, gần như không ngập ngừng.','Dùng từ chính xác, tinh tế, thành ngữ tự nhiên.','Cấu trúc đa dạng, gần như không lỗi.','Ý sâu, mạch lạc, có góc nhìn riêng và nhận xét kết luận.']};
const DL=['Độ trôi chảy','Từ vựng','Ngữ pháp','Triển khai ý'];
const ICON='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>';
const spk=(t,l)=>'<button class="icon-btn" type="button" data-say="'+esc(t)+'">'+ICON+' '+(l||'Nghe')+'</button>';
const bindSay=r=>$$('[data-say]',r).forEach(b=>b.onclick=ev=>{ev.stopPropagation();speak(b.dataset.say)});
const head=o=>{H1.textContent=o.h1;LEAD.innerHTML=o.lead||'';CRUMB.innerHTML=o.crumb||'';META.innerHTML=(o.meta||[]).map(x=>'<span class="chip">'+esc(x)+'</span>').join('')};
const rx=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function hl(text,keys){
  let out=esc(text),marks=[];
  keys.forEach(([p])=>{
    p=p.split('...')[0].trim();if(!p)return;
    const ws=p.split(/\s+/);let f=ws[0];const stem=f.length>5?f.slice(0,-2):f.length>3?f.slice(0,-1):f;
    const re=new RegExp('\\b'+rx(esc(stem))+'\\w*'+(ws.length>1?'\\s+'+ws.slice(1).map(w=>rx(esc(w))).join('\\s+'):''),'i');
    const m=re.exec(out);if(m&&!/<mark/.test(m[0]))out=out.slice(0,m.index)+'<mark class="kp">'+m[0]+'</mark>'+out.slice(m.index+m[0].length);
  });
  return out;
}
const key=(t,b)=>t+':'+b;
function home(){
  head({h1:'Super Speaking',lead:'Mỗi chủ đề một đề IELTS Speaking Part 2 kèm bài nói mẫu từ band 4–5 đến band 8–9.',meta:[TP.length+' chủ đề','5 mức band','Song ngữ']});
  const done=Object.keys(prog.all()).length;
  main.innerHTML='<h2 class="sect" style="margin-top:22px">Chọn chủ đề</h2><div class="grid" style="margin-top:14px">'+TP.map((t,i)=>{
    const n=BANDS.filter(([b])=>prog.get(key(t.id,b))==='ok').length;
    return '<a class="card-l" href="#/'+t.id+'"><span class="big">'+(i+1)+'</span><h3>'+esc(t.name)+' · '+esc(t.vi)+'</h3><p>'+esc(t.q)+'</p><div class="row"><span class="tag">Đã luyện '+n+'/5 band</span></div></a>'}).join('')+'</div>'
  +'<div class="note">Bài mẫu là bản rút gọn (khoảng 1 phút nói) để dễ học và bắt chước. Khi thi thật, bạn cần nói khoảng 1–2 phút cho Part 2, nên hãy mở rộng thêm ý, ví dụ và cảm nhận theo cùng cấu trúc. Các bài mẫu do Claude biên soạn, không phải bài chấm điểm chính thức của IELTS.</div>';
  document.title='Super Speaking — Luyện nói IELTS theo band';
}
let timer=null;
function topic(id,bandId){
  const t=TB[id];if(!t)return home();
  const b=BANDS.some(x=>x[0]===bandId)?bandId:(get('se:spband')||'67');put('se:spband',b);
  const s=t.s[b],i=TP.indexOf(t),bl=BANDS.find(x=>x[0]===b)[1];
  head({h1:t.name+' · '+t.vi,crumb:'<a href="#/">Speaking</a> › '+esc(t.name),lead:'',meta:['Band '+bl,s.w+' từ']});
  const dsc=DESC[b];
  main.innerHTML=
   '<div class="panel" style="margin-top:20px"><span class="tag">IELTS Speaking · Part 2</span><h2 style="margin:10px 0 4px;font-family:var(--serif)">'+esc(t.q)+'</h2><div class="vi" style="color:var(--muted)">'+esc(t.qv)+'</div>'
   +'<p style="margin:12px 0 4px"><b>You should say:</b></p><ul style="margin:0;padding-left:20px">'+t.pts.map(p=>'<li>'+esc(p[0])+' <small style="color:var(--muted)">· '+esc(p[1])+'</small></li>').join('')+'</ul>'
   +'<div class="row" style="margin-top:14px"><button class="btn sm" id="tmP" type="button">Chuẩn bị 1 phút</button><button class="btn sm" id="tmS" type="button">Nói 2 phút</button><span class="chip" id="tmV">00:00</span></div></div>'
   +'<div class="tabs" style="margin-top:18px" role="tablist">'+BANDS.map(([k,l])=>'<a class="'+(k===b?'on':'')+'" role="tab" href="#/'+t.id+'/'+k+'" style="padding:8px 14px">Band '+l+'</a>').join('')+'</div>'
   +'<div class="note" style="margin-top:12px"><b>Đặc điểm band '+bl+':</b> '+dsc.map((x,j)=>DL[j]+': '+esc(x)).join(' · ')+'</div>'
   +'<div class="row" style="margin-top:14px;justify-content:space-between"><h2 class="sect" style="margin:0">Bài nói mẫu</h2><div class="row"><button class="btn sm" id="all" type="button">Nghe cả bài</button><button class="btn sm" id="tv" type="button">Ẩn bản dịch</button></div></div>'
   +'<div id="smp" style="margin-top:12px">'+s.t.map((p,j)=>'<div class="para" style="margin-bottom:12px"><p class="en" style="font-family:var(--serif);font-size:1.08rem;line-height:1.7;margin:0">'+hl(p[0],s.k)+' <button class="icon-btn" type="button" data-say="'+esc(p[0])+'" aria-label="Nghe đoạn '+(j+1)+'">'+ICON+'</button></p><p class="vi" style="margin:4px 0 0;color:var(--muted)">'+esc(p[1])+'</p></div>').join('')+'</div>'
   +'<h2 class="sect" style="margin-top:22px">Cụm từ chính của bài</h2><div class="grid" style="margin-top:10px">'+s.k.map(([p,v])=>'<button class="card-l" type="button" data-say="'+esc(p.split('...')[0])+'" style="text-align:left"><h3 style="margin:0">'+esc(p)+'</h3><p style="margin:4px 0 0">'+esc(v)+'</p></button>').join('')+'</div>'
   +'<h2 class="sect" style="margin-top:22px">Câu hỏi mở rộng (Part 3)</h2><ol style="margin:10px 0 0;padding-left:20px;line-height:1.8">'+t.p3.map(q=>'<li>'+esc(q[0])+' <small style="color:var(--muted)">· '+esc(q[1])+'</small></li>').join('')+'</ol>'
   +'<div class="row" style="margin-top:22px;justify-content:space-between"><button class="btn" id="dn" type="button">'+(prog.get(key(t.id,b))==='ok'?'Đã luyện (bỏ đánh dấu)':'Đánh dấu đã luyện band '+bl)+'</button><span>'+(i>0?'<a class="btn sm" href="#/'+TP[i-1].id+'/'+b+'">← '+esc(TP[i-1].name)+'</a> ':'')+(i<TP.length-1?'<a class="btn sm" href="#/'+TP[i+1].id+'/'+b+'">'+esc(TP[i+1].name)+' →</a>':'')+'</span></div>';
  bindSay(main);document.title=t.name+' · Band '+bl+' — Super Speaking';
  $('#all').onclick=()=>speak(s.t.map(p=>p[0]).join(' '));
  $('#tv').onclick=ev=>{const h=ev.target.textContent.startsWith('Ẩn');$$('#smp .vi').forEach(e=>e.style.display=h?'none':'');ev.target.textContent=h?'Hiện bản dịch':'Ẩn bản dịch'};
  $('#dn').onclick=()=>{const k=key(t.id,b);prog.set(k,prog.get(k)==='ok'?null:'ok');topic(id,b)};
  const run=sec=>{clearInterval(timer);let n=sec;const v=$('#tmV'),f=()=>{v.textContent=String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')};f();timer=setInterval(()=>{n--;f();if(n<=0){clearInterval(timer);toast('Hết giờ')}},1000)};
  $('#tmP').onclick=()=>run(60);$('#tmS').onclick=()=>run(120);
}
function route(){clearInterval(timer);const h=location.hash.replace(/^#\/?/,'').split('/').filter(Boolean);if(!h.length)home();else topic(h[0],h[1]);window.scrollTo(0,0)}
window.addEventListener('hashchange',route);route();
})();
