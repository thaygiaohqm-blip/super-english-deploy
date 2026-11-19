/* Luyện nói — lộ trình 6 chặng: học cụm → nghe hội thoại → nhại lại (chấm bằng micro) → nói 1-1 với AI */
(function(){
const {esc,speak,toast}=SE;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const main=$('#main'),H1=$('#h1'),LEAD=$('#lead'),CRUMB=$('#crumb'),META=$('#meta');
const D=window.SE_NOI||[];const LES={};D.forEach(s=>s.lessons.forEach(l=>{LES[l.id]=l;l.stage=s}));
const ORDER=D.flatMap(s=>s.lessons);
const st=SE.store('se:noi');
const head=o=>{H1.textContent=o.h1;LEAD.innerHTML=o.lead||'';CRUMB.innerHTML=o.crumb||'';META.innerHTML=(o.meta||[]).map(x=>'<span class="chip">'+esc(x)+'</span>').join('')};
const ICON='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>';
const MIC='<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
const spk=t=>'<button type="button" class="icon-btn" data-say="'+esc(t)+'" aria-label="Nghe">'+ICON+'</button>';
const sayText=t=>String(t).split(' / ')[0].replace(/\.\.\./g,'').trim();
const bindSay=r=>$$('[data-say]',r).forEach(b=>b.onclick=e=>{e.stopPropagation();speak(b.dataset.say)});

/* ---------- nhận giọng nói & so khớp ---------- */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
let live=null;
function listen(o){
  if(!SR){toast('Trình duyệt chưa hỗ trợ nhận giọng nói. Hãy dùng Chrome/Edge hoặc gõ câu trả lời.');o.end&&o.end({text:'',conf:null});return null}
  stopListen();speechSynthesis&&speechSynthesis.cancel();
  const r=new SR();r.lang='en-GB';r.interimResults=true;r.maxAlternatives=1;r.continuous=false;let fin='',cf=[],failed=false;
  r.onresult=e=>{let it='';for(let i=e.resultIndex;i<e.results.length;i++){const x=e.results[i];if(x.isFinal){fin+=x[0].transcript+' ';cf.push(x[0].confidence)}else it+=x[0].transcript}o.live&&o.live((fin+it).trim())};
  r.onerror=e=>{failed=true;toast(e.error==='not-allowed'||e.error==='service-not-allowed'?'Hãy cho phép dùng micro cho trang này.':e.error==='no-speech'?'Chưa nghe thấy giọng nói, hãy thử lại gần micro hơn.':'Không nhận được giọng nói ('+e.error+'). Bạn có thể gõ thay thế.')};
  r.onend=()=>{if(live===r)live=null;o.end({text:fin.trim(),conf:cf.length?cf.reduce((a,b)=>a+b,0)/cf.length:null,failed})};
  try{r.start();live=r}catch(e){o.end({text:'',conf:null,failed:true})}
  return r;
}
const stopListen=()=>{if(live){try{live.stop()}catch(e){}live=null}};
const CON={"i'm":'i am',"it's":'it is',"he's":'he is',"she's":'she is',"that's":'that is',"what's":'what is',"there's":'there is',"you're":'you are',"we're":'we are',"they're":'they are',"i've":'i have',"don't":'do not',"doesn't":'does not',"didn't":'did not',"can't":'can not',"cannot":'can not',"won't":'will not',"isn't":'is not',"aren't":'are not',"wasn't":'was not',"haven't":'have not',"hasn't":'has not',"i'd":'i would',"i'll":'i will',"let's":'let us',"couldn't":'could not',"wouldn't":'would not',"shouldn't":'should not'};
const toks=t=>String(t).toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9' ]+/g,' ').split(/\s+/).filter(Boolean).flatMap(w=>(CON[w]||w).split(' '));
function match(target,said){
  const T=sayText(target),tw=toks(T),sw=toks(said),pool={};sw.forEach(w=>pool[w]=(pool[w]||0)+1);
  const raw=T.replace(/\.\.\./g,'').split(/\s+/).filter(Boolean);let ok=0;
  const marks=raw.map(w=>{const ws=toks(w);const hit=ws.length&&ws.every(x=>pool[x]>0);if(hit){ws.forEach(x=>pool[x]--);ok+=ws.length}return{w,hit}});
  return{ratio:tw.length?ok/tw.length:0,marks};
}
const grade=(m,conf)=>Math.round(100*m.ratio*(conf==null?1:.8+.2*Math.min(1,conf)));

/* ---------- AI ---------- */
const auth=()=>{try{const a=JSON.parse(SE.get('se:auth')||'null');return a&&a.token?a:null}catch(e){return null}};
async function ask(body){
  const a=auth();if(!a)return{err:'login'};
  try{const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+a.token},body:JSON.stringify(body)});
    const j=await r.json().catch(()=>({}));
    if(r.status===401)return{err:'login'};if(j.error==='no_key')return{err:'nokey'};
    if(!r.ok)return{err:'fail',msg:j.error||'AI đang bận, hãy thử lại.'};return j}catch(e){return{err:'net'}}
}

/* ---------- lộ trình ---------- */
const done=id=>({l:!!st.get('l:'+id),s:st.get('s:'+id),a:st.get('a:'+id)});
function roadmap(){
  const total=ORDER.length,fin=ORDER.filter(l=>done(l.id).a!=null).length;
  head({h1:'Luyện nói',lead:'Lộ trình 6 chặng từ con số 0 đến diễn đạt tự tin. Mỗi bài: học cụm câu → nghe hội thoại mẫu → nhại lại và được chấm bằng micro → nói 1-1 với AI, được sửa từng câu và chấm điểm cuối bài.',crumb:'',meta:[D.length+' chặng',total+' bài',fin+'/'+total+' bài đã nói với AI']});
  const nx=ORDER.find(l=>done(l.id).a==null&&done(l.id).s==null&&!done(l.id).l)||ORDER[0];
  main.innerHTML='<p class="note">Gợi ý bài tiếp theo: <a href="#/'+nx.id+'"><b>'+esc(nx.t)+'</b></a>. Hãy dùng Chrome hoặc Edge trên máy tính/điện thoại để dùng micro. Nói chuyện với AI cần đăng nhập.</p><div class="rd">'
   +D.map(s=>'<section class="stg"><header><span class="n">'+s.n.replace(/\D/g,'')+'</span><div><h2>'+esc(s.t)+' <span class="tag">'+esc(s.lv)+'</span></h2></div></header><p class="g">'+esc(s.goal)+'</p><div class="lsn">'
    +s.lessons.map(l=>{const d=done(l.id);return'<a href="#/'+l.id+'"><b>'+esc(l.t)+'</b><small>'+esc(l.vi)+'</small><div class="bd"><i class="'+(d.l?'on':'')+'">Học</i><i class="'+(d.s!=null?'on':'')+'">Nhại '+(d.s!=null?d.s+'%':'')+'</i><i class="'+(d.a!=null?'on':'')+'">AI '+(d.a!=null?(d.a/10).toFixed(1):'')+'</i></div></a>'}).join('')+'</div></section>').join('')+'</div>';
}
/* ---------- trang bài ---------- */
const TABS=[['hoc','1. Học cụm'],['hoithoai','2. Hội thoại'],['nhai','3. Nhại lại'],['ai','4. Nói với AI']];
function lesson(id,tab){
  const L=LES[id];if(!L)return roadmap();stopListen();
  tab=TABS.some(t=>t[0]===tab)?tab:'hoc';
  head({h1:L.t,lead:esc(L.vi)+' — '+esc(L.goal),crumb:'<a href="#/">Luyện nói</a> › '+esc(L.stage.n)+' · '+esc(L.stage.t),meta:[L.stage.lv,L.ph.length+' cụm']});
  main.innerHTML='<nav class="rtabs" aria-label="Các bước">'+TABS.map(t=>'<a href="#/'+id+'/'+t[0]+'"'+(t[0]===tab?' aria-current="true"':'')+'>'+t[1]+'</a>').join('')+'</nav><div id="body"></div>';
  const B=$('#body');({hoc:learn,hoithoai:dialog,nhai:shadow,ai:room})[tab](L,B);
  const i=ORDER.indexOf(L),nxt=ORDER[i+1];
  if(tab==='ai'&&nxt)B.insertAdjacentHTML('beforeend','<p style="margin-top:20px"><a class="btn ghost sm" href="#/'+nxt.id+'">Bài tiếp theo: '+esc(nxt.t)+' →</a></p>');
}
function learn(L,B){
  B.innerHTML='<div class="tip"><b>Mẹo:</b> '+esc(L.tip)+'</div><div class="row" style="margin:6px 0"><button class="btn sm" id="all" type="button">Nghe lần lượt</button></div>'
   +L.ph.map(p=>'<div class="ph"><div><div class="en">'+esc(p[0])+'</div><div class="vi">'+esc(p[1])+'</div></div>'+spk(sayText(p[0]))+'</div>').join('')
   +'<p style="margin-top:16px"><button class="btn" id="ok" type="button">Đã học xong → Nghe hội thoại</button></p>';
  bindSay(B);
  $('#all').onclick=()=>{let k=0;const go=()=>{if(k>=L.ph.length||!$('#all'))return;speak(sayText(L.ph[k++][0]));setTimeout(go,2600)};go()};
  $('#ok').onclick=()=>{st.set('l:'+L.id,1);location.hash='#/'+L.id+'/hoithoai'};
}
function dialog(L,B){
  B.innerHTML='<p class="note">Nghe cuộc hội thoại mẫu. Bấm vào từng câu để nghe lại; bạn sẽ đóng vai <b>B</b> ở bước sau.</p><div class="dl">'
   +L.dl.map(d=>'<div class="m '+(d[0]==='B'?'b':'a')+'"><small>'+esc(d[0])+'</small><div class="en">'+esc(d[1])+' '+spk(d[1])+'</div><small>'+esc(d[2])+'</small></div>').join('')+'</div>'
   +'<p><button class="btn" id="nx" type="button">Sang bước nhại lại →</button></p>';
  bindSay(B);$('#nx').onclick=()=>location.hash='#/'+L.id+'/nhai';
}
/* nhại lại: nghe mẫu → nói → chấm */
function shadow(L,B){
  const items=L.ph.map(p=>sayText(p[0]));let i=0;const res=[];
  const view=()=>{
    if(i>=items.length){const avg=Math.round(res.reduce((a,b)=>a+b,0)/res.length);const best=st.get('s:'+L.id);if(best==null||avg>best)st.set('s:'+L.id,avg);
      B.innerHTML='<div class="say"><div class="sc'+(avg<60?' lo':'')+'">'+avg+'%</div><p>Điểm nhại lại trung bình của bài này.</p><div class="row" style="justify-content:center"><button class="btn ghost" id="re" type="button">Làm lại</button><a class="btn" href="#/'+L.id+'/ai">Nói với AI →</a></div></div>'
       +'<p class="nb">Điểm này đo mức khớp giữa câu bạn nói (do trình nhận giọng nói của trình duyệt nghe được) và câu mẫu. Đó là ước lượng độ rõ ràng, không phải chấm âm vị chuyên sâu.</p>';
      $('#re').onclick=()=>{i=0;res.length=0;view()};SE.fx&&SE.fx(avg>=60);return}
    B.innerHTML='<p class="muted" style="color:var(--muted)">Câu '+(i+1)+'/'+items.length+'</p><div class="say"><div class="en" id="tg">'+esc(items[i])+'</div><div style="color:var(--muted)">'+esc(L.ph[i][1])+'</div><div class="row" style="justify-content:center;margin-top:10px"><button class="btn ghost sm" id="hear" type="button">'+ICON+' Nghe mẫu</button></div></div>'
     +'<div class="say"><button class="mic" id="mic" type="button" aria-label="Bấm để nói">'+MIC+'</button><p id="st" style="color:var(--muted)">Bấm micro và đọc câu trên</p><div id="out"></div>'
     +'<details style="margin-top:8px"><summary>Không dùng micro? Gõ câu bạn muốn chấm</summary><div class="row" style="margin-top:8px"><input class="tx" id="ty" style="flex:1" placeholder="Gõ câu bạn nói…"><button class="btn sm" id="go" type="button">Chấm</button></div></details></div>';
    $('#hear').onclick=()=>speak(items[i]);
    const finish=(text,conf)=>{
      if(!text){$('#st').textContent='Chưa nghe rõ. Hãy thử lại.';$('#mic').classList.remove('on');return}
      const m=match(items[i],text),s=grade(m,conf);res[i]=s;
      $('#mic').classList.remove('on');$('#st').innerHTML='Bạn nói: <i>'+esc(text)+'</i>';
      $('#out').innerHTML='<div class="sc'+(s<60?' lo':'')+'">'+s+'%</div><p>'+m.marks.map(x=>'<span class="w '+(x.hit?'ok':'no')+'">'+esc(x.w)+'</span>').join(' ')+'</p>'
       +'<div class="row" style="justify-content:center"><button class="btn ghost sm" id="try" type="button">Nói lại</button><button class="btn sm" id="next" type="button">'+(i+1<items.length?'Câu tiếp →':'Xem kết quả')+'</button></div>'
       +(s<60?'<p class="nb">Các từ đỏ là từ chưa được nghe thấy. Nghe lại mẫu, nói chậm và rõ từng từ rồi thử lại.</p>':'');
      SE.fx&&SE.fx(s>=60,$('.say .sc'));$('#try').onclick=()=>view();$('#next').onclick=()=>{i++;view()};
    };
    $('#mic').onclick=()=>{
      if(live){stopListen();return}
      $('#mic').classList.add('on');$('#st').textContent='Đang nghe… hãy nói';$('#out').innerHTML='';
      listen({live:t=>{$('#st').textContent=t||'Đang nghe…'},end:r=>finish(r.text,r.conf)});
    };
    $('#go').onclick=()=>{const t=$('#ty').value.trim();if(t)finish(t,null)};
    $('#ty').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('#go').click()}});
  };
  view();
}
/* nói 1-1 với AI (hoặc chế độ kịch bản khi chưa có AI) */
function room(L,B){
  const A=L.ai,hist=[],fixes=[];let busy=false,mode='ai',turns=0;const MAX=8;
  B.innerHTML='<div class="tip"><b>Tình huống:</b> '+esc(A.goal)+'<br><small>Cụm nên dùng: '+A.targets.map(esc).join(' · ')+'</small></div><div id="nb"></div><div class="chat" id="chat" aria-live="polite"></div>'
   +'<div class="dock"><textarea class="tx" id="tx" rows="2" placeholder="Bấm micro và nói, hoặc gõ câu trả lời của bạn rồi bấm Gửi"></textarea><div class="row"><button class="mic" id="mic" type="button" aria-label="Bấm để nói">'+MIC+'</button><button class="btn" id="send" type="button">Gửi</button><button class="btn ghost sm" id="hint" type="button">Gợi ý</button><button class="btn ghost sm" id="end" type="button" disabled>Kết thúc &amp; chấm điểm</button></div></div><div id="rep"></div>';
  const chat=$('#chat'),tx=$('#tx');
  const bub=(who,t)=>{const d=document.createElement('div');d.className='msg '+who;d.innerHTML=esc(t)+(who==='ai'?' <button type="button" class="icon-btn pl" data-say="'+esc(t)+'" aria-label="Nghe">'+ICON+'</button>':'');chat.appendChild(d);bindSay(d);d.scrollIntoView({block:'nearest',behavior:'smooth'});return d};
  const note=h=>{$('#nb').innerHTML=h?'<p class="nb">'+h+'</p>':''};
  let hintText=A.targets[0]||'',script=L.dl.map(d=>d.slice());let si=0;
  /* kịch bản: AI nói các câu của A, bạn đáp theo vai B */
  const scriptAi=()=>{const nx=script.slice(si).findIndex(d=>d[0]==='A');if(nx<0)return null;si+=nx;const a=script[si][1];si++;const b=script[si]&&script[si][0]==='B'?script[si]:null;return{a,b}};
  let cur=null;
  const aiSay=t=>{hist.push({r:'ai',t});bub('ai',t);setTimeout(()=>speak(t),200)};
  const start=()=>{
    if(!auth())note('Bạn chưa đăng nhập nên đang ở <b>chế độ kịch bản</b>: AI đóng vai theo hội thoại mẫu, bạn đáp lại và được so với câu mẫu. Đăng nhập (nút trên cùng) để nói chuyện tự do với AI.'),mode='script';
    if(mode==='script'){cur=scriptAi();aiSay(cur?cur.a:A.open);hintText=cur&&cur.b?cur.b[1]:hintText}else aiSay(A.open);
  };
  const setBusy=b=>{busy=b;['send','mic','hint'].forEach(i=>$('#'+i).disabled=b)};
  const addFix=f=>{if(!f)return;const d=document.createElement('div');d.className='fix'+(f.ok?'':' bad');
    d.innerHTML=f.ok?'✓ <b>Câu của bạn tự nhiên và đúng.</b>':'<b>Nên nói:</b> '+esc(f.better)+' '+(f.better?'<button type="button" class="icon-btn pl" data-say="'+esc(f.better)+'" aria-label="Nghe">'+ICON+'</button>':'')+((f.notes||[]).length?'<ul>'+f.notes.map(n=>'<li>'+esc(n)+'</li>').join('')+'</ul>':'');
    chat.appendChild(d);bindSay(d);SE.fx&&SE.fx(!!f.ok,d)};
  async function submit(text){
    text=(text||'').trim();if(!text||busy)return;stopListen();tx.value='';turns++;hist.push({r:'user',t:text});bub('me',text);setBusy(true);
    if(mode==='script'){
      const model=cur&&cur.b?cur.b[1]:null;let f;
      if(model){const m=match(model,text);const s=grade(m,null);fixes.push({said:text,better:model,s});f={ok:s>=70,better:s>=70?'':model,notes:s>=70?[]:['Câu mẫu trong bài: bạn có thể nói giống như vậy.']}}else f={ok:true};
      addFix(f);cur=scriptAi();
      if(cur){aiSay(cur.a);hintText=cur.b?cur.b[1]:hintText}else aiSay('Thank you, that was a good conversation!');
      setBusy(false);$('#end').disabled=turns<2;if(!cur||turns>=MAX)finish();return}
    const r=await ask({mode:'turn',stage:L.stage.id,role:A.role,goal:A.goal,targets:A.targets,history:hist});
    if(r.err){hist.pop();turns--;chat.lastChild.remove();setBusy(false);tx.value=text;
      if(r.err==='login'||r.err==='nokey'){mode='script';note(r.err==='login'?'Chưa đăng nhập hoặc phiên đã hết hạn nên chuyển sang <b>chế độ kịch bản</b>.':'Máy chủ chưa cấu hình khóa AI nên chuyển sang <b>chế độ kịch bản</b>.');hist.length=0;chat.innerHTML='';turns=0;start();return}
      toast(r.msg||'Không kết nối được AI, hãy thử lại.');return}
    fixes.push({said:text,better:r.fix.better,ok:r.fix.ok});addFix(r.fix);hintText=r.hint||hintText;aiSay(r.reply);setBusy(false);$('#end').disabled=turns<2;
    if(turns>=MAX){toast('Đã đủ '+MAX+' lượt, hãy bấm Kết thúc để xem điểm.');}
  }
  async function finish(){
    if(busy&&mode==='ai')return;setBusy(true);stopListen();$('#end').disabled=true;const R=$('#rep');
    if(mode==='script'){
      const sc=fixes.filter(f=>f.s!=null),avg=sc.length?Math.round(sc.reduce((a,f)=>a+f.s,0)/sc.length):0;st.set('a:'+L.id,Math.round(avg/10));
      R.innerHTML='<div class="rep"><h2 style="margin:0 0 6px">Kết quả (chế độ kịch bản)</h2><div class="sc'+(avg<60?' lo':'')+'">'+avg+'%</div><p>Mức khớp trung bình với hội thoại mẫu.</p>'
       +fixes.filter(f=>f.s!=null&&f.s<70).map(f=>'<div class="mk"><s>'+esc(f.said)+'</s><br>Mẫu: <b>'+esc(f.better)+'</b></div>').join('')+'<p class="nb">Đăng nhập và cấu hình AI để được chấm 4 tiêu chí (trôi chảy, ngữ pháp, từ vựng, hoàn thành nhiệm vụ) kèm lỗi cụ thể.</p><p><button class="btn" id="again" type="button">Nói lại bài này</button></p></div>';
      $('#again').onclick=()=>lesson(L.id,'ai');R.scrollIntoView({behavior:'smooth'});return}
    R.innerHTML='<div class="rep">Đang chấm điểm…</div>';
    const r=await ask({mode:'report',stage:L.stage.id,role:A.role,goal:A.goal,history:hist});setBusy(false);
    if(r.err){R.innerHTML='<div class="rep">Không chấm được lúc này. '+esc(r.msg||'Hãy thử lại.')+' <button class="btn sm" id="rt" type="button">Thử lại</button></div>';$('#rt').onclick=finish;$('#end').disabled=false;return}
    const s=r.scores;st.set('a:'+L.id,Math.round(s.overall*10));
    const bar=(n,v)=>'<div class="sb"><span>'+n+'</span><div><i style="width:'+v*10+'%"></i></div><b>'+v+'</b></div>';
    R.innerHTML='<div class="rep"><h2 style="margin:0 0 6px">Kết quả của bạn</h2><div class="row"><div class="sc'+(s.overall<6?' lo':'')+'">'+s.overall+'<small style="font-size:18px">/10</small></div>'+(r.cefr?'<span class="tag">Ước lượng '+esc(r.cefr)+'</span>':'')+'</div>'
     +'<div class="sbs">'+bar('Trôi chảy',s.fluency)+bar('Ngữ pháp',s.grammar)+bar('Từ vựng',s.vocab)+bar('Hoàn thành',s.task)+'</div>'
     +(r.strengths.length?'<h3>Điểm tốt</h3><ul>'+r.strengths.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'')
     +(r.mistakes.length?'<h3>Cần sửa</h3>'+r.mistakes.map(m=>'<div class="mk"><s>'+esc(m.said)+'</s><br><b>'+esc(m.better)+'</b> '+spk(m.better)+'<br><small>'+esc(m.why)+'</small></div>').join(''):'')
     +(r.phrases.length?'<h3>Cụm nên ôn</h3>'+r.phrases.map(p=>'<div class="ph"><div class="en">'+esc(p)+'</div>'+spk(p)+'</div>').join(''):'')
     +(r.next?'<p class="tip"><b>Bước tiếp theo:</b> '+esc(r.next)+'</p>':'')+'<p class="nb">Điểm do AI đánh giá dựa trên phần chữ do nhận giọng nói chuyển ra, nên phát âm và ngữ điệu chỉ được ước lượng gián tiếp.</p><p><button class="btn" id="again" type="button">Nói lại bài này</button></p></div>';
    bindSay(R);$('#again').onclick=()=>lesson(L.id,'ai');SE.fx&&SE.fx(s.overall>=6,$('.rep .sc'));R.scrollIntoView({behavior:'smooth'});
  }
  $('#send').onclick=()=>submit(tx.value);
  tx.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submit(tx.value)}});
  $('#mic').onclick=()=>{if(busy)return;if(live){stopListen();return}$('#mic').classList.add('on');
    listen({live:t=>{tx.value=t},end:r=>{$('#mic').classList.remove('on');if(r.text){tx.value=r.text;tx.focus();toast('Kiểm tra lại câu rồi bấm Gửi (hoặc sửa nếu máy nghe nhầm)')}}})};
  $('#hint').onclick=()=>{if(hintText)toast('Gợi ý: '+hintText,4500)};
  $('#end').onclick=finish;
  start();
}
function route(){
  const p=location.hash.replace(/^#\/?/,'').split('/').filter(Boolean);
  stopListen();window.scrollTo(0,0);
  if(!p.length)roadmap();else lesson(p[0],p[1]);
}
window.addEventListener('hashchange',route);route();
})();
