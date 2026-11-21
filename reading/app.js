(function(){
const {esc,speak}=SE;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const main=$('#main'),H1=$('#h1'),LEAD=$('#lead'),CRUMB=$('#crumb'),META=$('#meta');
const D=window.SE_READING||[],BY=Object.fromEntries(D.map(r=>[r.id,r]));
const head=o=>{H1.textContent=o.h1;LEAD.innerHTML=o.lead||'';CRUMB.innerHTML=o.crumb||'';META.innerHTML=(o.meta||[]).map(x=>'<span class="chip">'+esc(x)+'</span>').join('')};
const ICON='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>';
const spk=t=>'<button type="button" class="icon-btn" data-say="'+esc(t)+'" aria-label="Nghe">'+ICON+'</button>';
const UI={view:'bi',hl:true};
try{Object.assign(UI,JSON.parse(localStorage.getItem('se:reading:ui')||'{}'))}catch(e){}
const saveUI=()=>{try{localStorage.setItem('se:reading:ui',JSON.stringify(UI))}catch(e){}};
/* {{c12:text}} -> đoạn tô màu, gắn với mục từ vựng số 12 */
function paint(en){
  return en.split(/(\{\{\w\d*:.*?\}\})/g).map(s=>{const m=s.match(/^\{\{(\w)(\d*):(.*)\}\}$/);if(!m)return esc(s);
    return '<button type="button" class="hl hl-'+m[1]+(m[2]===''?' nov':'')+'"'+(m[2]===''?'':' data-v="'+m[2]+'"')+'>'+esc(m[3])+'</button>'}).join('');
}
const plain=en=>en.replace(/\{\{\w\d*:(.*?)\}\}/g,'$1');
const isVi=t=>/[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(t);
function entry(v,i,pop){
  return '<article class="ve'+(v.c?' c-'+v.c:'')+'" id="v'+i+'"><h3>'+esc(v.w)+(v.pos?' <span class="pos">('+esc(v.pos)+')</span>':'')+(v.ipa||SE.ipa(v.w)?' <span class="ipa">'+esc(v.ipa||SE.ipa(v.w))+'</span>':'')+spk(v.w)+'</h3>'
   +'<p>'+esc(v.mean)+'</p>'+(v.syn?'<p class="syn">Synonyms: '+esc(v.syn)+'</p>':'')
   +(v.ex?'<p><b>VD:</b> <span class="exn">'+esc(v.ex)+'</span>'+spk(v.ex)+(v.exvi?'<br><span class="exv">'+esc(v.exvi)+'</span>':'')+'</p>':'')+'</article>';
}
function popup(R,i){
  const v=R.vocab[i];if(!v)return;
  const m=document.createElement('div');m.className='modal';
  m.innerHTML='<div class="modal__box" role="dialog" aria-modal="true"><button class="modal__x" type="button" aria-label="Đóng">×</button>'+entry(v,i).replace('<article class="ve','<article style="border:0;padding:0;margin:0" class="ve')+'</div>';
  document.body.appendChild(m);const close=()=>{m.remove();document.removeEventListener('keydown',k)};const k=e=>{if(e.key==='Escape')close()};
  document.addEventListener('keydown',k);m.onclick=e=>{if(e.target===m||e.target.closest('.modal__x'))close()};bind(m);speak(v.w);
}
function bind(root,R){
  $$('[data-say]',root).forEach(b=>b.onclick=e=>{e.stopPropagation();speak(b.dataset.say)});
  if(R)$$('.hl[data-v]',root).forEach(b=>b.onclick=e=>{e.stopPropagation();popup(R,+b.dataset.v)});
}
/* ---- danh sách bài ---- */
function list(){
  head({h1:'Reading',lead:'Bài đọc IELTS song ngữ: giữ nguyên highlight từ vựng, có câu hỏi, đáp án kèm dẫn chứng và bảng collocation đầy đủ. Sẽ bổ sung thêm bài dần.',crumb:'',meta:[D.length+' bài']});
  main.innerHTML='<div class="rlist">'+D.map(r=>'<a class="card-l" href="#/'+r.id+'"><span class="big">Rd</span><h3>'+esc(r.title)+'</h3><p>'+esc(r.title_vi)+'</p><div class="row"><span class="tag">'+r.passage.length+' đoạn</span><span class="tag">'+r.answers.length+' câu hỏi</span><span class="tag">'+r.vocab.length+' mục từ vựng</span></div></a>').join('')+'</div>';
}
/* ---- trang bài ---- */
const TABS=[['bai','Bài đọc'],['hoi','Câu hỏi'],['dapan','Đáp án'],['tuvung','Từ vựng']];
function page(R,tab){
  tab=TABS.some(t=>t[0]===tab)?tab:'bai';
  head({h1:R.title,lead:esc(R.title_vi),crumb:'<a href="#/">Reading</a>',meta:[R.passage.length+' đoạn','Câu hỏi '+(R.sections[0]?R.sections[0].range.split('–')[0]:'')+'–'+(R.answers.length?R.answers[R.answers.length-1].n:''),R.vocab.length+' mục từ vựng']});
  const tabs='<nav class="rtabs" aria-label="Các phần">'+TABS.map(t=>'<a href="#/'+R.id+'/'+t[0]+'"'+(t[0]===tab?' aria-current="true"':'')+'>'+t[1]+'</a>').join('')+'</nav>';
  main.innerHTML=tabs+'<div id="body"></div>';const B=$('#body');
  ({bai:bai,hoi:hoi,dapan:dapan,tuvung:tuvung})[tab](R,B);
}
function bai(R,B){
  const row=(en,vi,cls,i)=>'<div class="rp '+(cls||'')+(UI.view==='en'?' only-en':'')+(UI.view==='hide'?' hide-en':'')+'"><div class="en">'+(cls==='title'?esc(en):paint(en)+' '+spk(plain(en)))+'</div><div class="vi">'+esc(vi)+'</div></div>';
  B.innerHTML='<div class="rbar"><div class="modes" role="group" aria-label="Chế độ hiển thị">'
   +[['bi','Song ngữ'],['en','Chỉ tiếng Anh'],['hide','Che tiếng Anh']].map(x=>'<button type="button" data-v="'+x[0]+'" aria-pressed="'+(UI.view===x[0])+'">'+x[1]+'</button>').join('')+'</div>'
   +'<div class="modes"><button type="button" id="hlb" aria-pressed="'+UI.hl+'">Highlight từ vựng</button></div></div>'
   +'<p class="note">Các cụm được tô màu là từ vựng/collocation của bài. Bấm vào cụm để xem đầy đủ nghĩa, phiên âm, từ đồng nghĩa và ví dụ.</p>'
   +'<div id="paras" class="'+(UI.hl?'':'nohl')+'">'+row(R.title,R.title_vi,'title')+R.passage.map((p,i)=>row(p[0],p[1],'',i)).join('')+'</div>'
   +(R.note?'<p class="note">'+esc(R.note)+'</p>':'');
  $$('[data-v]',B).forEach(b=>{if(b.closest('.modes')&&!b.id)b.onclick=()=>{UI.view=b.dataset.v;saveUI();bai(R,B)}});
  $('#hlb').onclick=()=>{UI.hl=!UI.hl;saveUI();bai(R,B)};
  bind(B,R);
  $$('.rp.hide-en .en',B).forEach(c=>c.onclick=()=>c.classList.toggle('open'));
}
function hoi(R,B){
  const ans=Object.fromEntries(R.answers.map(a=>[a.n,a]));
  B.innerHTML=R.sections.map(s=>{
    let h='<section class="qsec"><h2>Questions '+esc(s.range)+' <span class="qt">· '+esc(s.type)+'</span></h2>',opts=false;
    s.lines.forEach((l,i)=>{
      if(l.k==='o'){if(!opts){h+='<ul class="opts">';opts=true}h+='<li><b>'+esc(l.l)+'.</b><span>'+esc(l.en)+'<small>'+esc(l.vi)+'</small></span></li>';return}
      if(opts){h+='</ul>';opts=false}
      if(l.k==='p')h+='<div class="qpair"><b>'+esc(l.en)+'</b><div class="vi">'+esc(l.vi)+'</div></div>';
      else if(l.k==='t')h+='<p class="'+(isVi(l.t)?'qvi':'')+'" style="margin:6px 0">'+esc(l.t)+'</p>';
      else if(l.k==='q'){const a=ans[l.n];h+='<div class="qi"><div class="qn">'+l.n+'</div><div><div>'+esc(l.en)+'</div><div class="qvi">'+esc(l.vi)+'</div>'+(a?'<button type="button" class="btn sm ghost ans" data-a="'+l.n+'">Xem đáp án</button><div class="abox" id="ab'+l.n+'" hidden></div>':'')+'</div></div>'}
    });
    if(opts)h+='</ul>';
    return h+'</section>'}).join('');
  $$('[data-a]',B).forEach(b=>b.onclick=()=>{const a=ans[b.dataset.a],box=$('#ab'+a.n);if(box.hidden){box.innerHTML=ansHtml(a);box.hidden=false;b.textContent='Ẩn đáp án'}else{box.hidden=true;b.textContent='Xem đáp án'}});
}
const ansHtml=a=>'<div class="ansbox"><b class="k">Đáp án: '+esc(a.a)+'</b>'+(a.ev?'<p style="margin:6px 0"><b>Dẫn chứng:</b> <span class="ev">'+esc(a.ev)+'</span></p>':'')+(a.ex?'<p style="margin:6px 0"><b>Giải thích:</b> '+esc(a.ex)+'</p>':'')+'</div>';
function dapan(R,B){
  B.innerHTML='<h2 style="margin:18px 0 6px">Bảng đáp án nhanh</h2>'+R.quick.map(r=>'<div class="qk">'+r.map(x=>'<span>'+esc(x)+'</span>').join('')+'</div>').join('')+(R.quick_note?'<p class="note">'+esc(R.quick_note)+'</p>':'')
   +'<h2 style="margin:22px 0 6px">Đáp án và giải thích</h2>'+R.answers.map(a=>'<div class="acard"><h3>Câu '+a.n+' — <span>'+esc(a.a)+'</span></h3>'+(a.ev?'<p><b>Dẫn chứng:</b> <i>'+esc(a.ev)+'</i></p>':'')+(a.ex?'<p><b>Giải thích:</b> '+esc(a.ex)+'</p>':'')+'</div>').join('');
}
const VS={q:'',only:false};
function tuvung(R,B){
  B.innerHTML='<div class="vtop"><input class="input" id="vq" placeholder="Tìm từ vựng hoặc nghĩa…" value="'+esc(VS.q)+'" style="flex:1;min-width:180px;max-width:380px;margin:0"><div class="modes"><button type="button" id="vo" aria-pressed="'+VS.only+'">Chỉ cụm được highlight</button></div><span class="hint" id="vc" style="margin:0"></span></div><div id="vl"></div>';
  const draw=()=>{const q=VS.q.trim().toLowerCase();const items=R.vocab.map((v,i)=>[v,i]).filter(([v])=>(!VS.only||v.hl)&&(!q||(v.w+' '+v.mean+' '+v.syn+' '+v.ex+' '+v.exvi).toLowerCase().includes(q)));
    $('#vl').innerHTML=items.map(([v,i])=>entry(v,i)).join('')||'<p class="hint">Không có mục nào khớp.</p>';$('#vc').textContent=items.length+'/'+R.vocab.length+' mục';bind($('#vl'))};
  $('#vq').oninput=e=>{VS.q=e.target.value;draw()};$('#vo').onclick=()=>{VS.only=!VS.only;$('#vo').setAttribute('aria-pressed',VS.only);draw()};draw();
}
function route(){
  window.scrollTo({top:0});
  const p=location.hash.replace(/^#\/?/,'').split('/').filter(Boolean);
  if(!p.length)return list();
  const R=BY[p[0]];if(!R){main.innerHTML='<p class="hint" style="margin-top:30px">Không tìm thấy bài này. <a href="#/">Về danh sách</a></p>';return}
  page(R,p[1]);
}
window.addEventListener('hashchange',route);route();
})();
