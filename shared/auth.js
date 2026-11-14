/* Super English — đăng nhập và đồng bộ tiến độ qua /api (dùng chung Redis + tài khoản với Super Honki) */
(function(){
  const {esc,toast,get,put}=SE;
  const APPS={'se:vocab':'vocab','se:writing':'writing','se:speaking':'speaking','se:giaotrinh':'giaotrinh'};
  const btn=document.querySelector('.abtn');if(!btn)return;
  const lab=btn.querySelector('span');
  const sess=()=>{try{const a=JSON.parse(get('se:auth')||'null');return a&&a.token?a:null}catch(e){return null}};
  const api=async(method,app,body)=>{const a=sess();const r=await fetch('/api/progress?app='+app,{method,cache:'no-store',headers:{'Content-Type':'application/json',Authorization:'Bearer '+a.token},body:body?JSON.stringify(body):undefined});
    if(r.status===401){put('se:auth','null');paint();throw new Error('expired')}return r.json()};
  const local=n=>{try{return JSON.parse(get(n)||'{}')}catch(e){return{}}};
  async function syncOne(n,tries){
    const app=APPS[n];const j=await api('GET',app);const remote=(j.data&&j.data.map)||{};const loc=local(n);
    const m=Object.assign({},remote,loc);let changed=JSON.stringify(m)!==JSON.stringify(loc);
    if(changed)put(n,JSON.stringify(m));
    if(JSON.stringify(m)!==JSON.stringify(remote)){const w=await api('PUT',app,{data:{map:m},ifRev:j.rev});if(!w.ok&&tries>0)return syncOne(n,tries-1)}
    return changed;
  }
  async function sync(){if(!sess())return;let ch=false;try{for(const n of Object.keys(APPS))ch=(await syncOne(n,3))||ch}catch(e){return}
    if(ch){toast('Đã đồng bộ tiến độ từ tài khoản');setTimeout(()=>location.reload(),600)}}
  const timers={};
  window.SE_SYNC={dirty(n){if(!sess()||!APPS[n])return;clearTimeout(timers[n]);timers[n]=setTimeout(()=>syncOne(n,3).catch(()=>{}),1500)}};
  function paint(){const a=sess();lab.textContent=a?(a.name||a.email.split('@')[0]).slice(0,12):'Đăng nhập';btn.classList.toggle('in',!!a)}
  function modal(){
    const m=document.createElement('div');m.className='modal';const close=()=>m.remove();
    const body=h=>{m.innerHTML='<div class="modal__box authbox" role="dialog" aria-modal="true"><button class="modal__x" type="button" aria-label="Đóng">×</button>'+h+'</div>';m.querySelector('.modal__x').onclick=close};
    m.onclick=e=>{if(e.target===m)close()};document.body.appendChild(m);
    const msg=t=>{const x=m.querySelector('.msg');if(x)x.textContent=t};
    const a=sess();
    if(a){body('<h2>Tài khoản</h2><p>Đang đăng nhập: <b>'+esc(a.email)+'</b><br>Tiến độ được đồng bộ tự động giữa các thiết bị.</p><div class="row"><button class="btn sm" id="sy" type="button">Đồng bộ ngay</button><button class="btn sm ghost" id="lo" type="button">Đăng xuất</button></div><div class="msg"></div>');
      m.querySelector('#sy').onclick=async()=>{msg('Đang đồng bộ...');await sync();msg('Xong.')};
      m.querySelector('#lo').onclick=()=>{put('se:auth','null');paint();toast('Đã đăng xuất');close()};return}
    body('<h2>Đăng nhập để lưu tiến độ</h2><p style="color:var(--muted);font-size:14px">Dùng chung tài khoản với Super Honki.</p><label for="em">Email</label><input id="em" type="email" autocomplete="email"><label for="pw">Mật khẩu (từ 8 ký tự)</label><input id="pw" type="password" autocomplete="current-password"><div class="row" style="margin-top:14px"><button class="btn sm" id="in" type="button">Đăng nhập</button><button class="btn sm ghost" id="up" type="button">Tạo tài khoản</button></div><div class="msg"></div>');
    const go=async action=>{const email=m.querySelector('#em').value.trim(),password=m.querySelector('#pw').value;msg('Đang xử lý...');
      try{const r=await fetch('/api/auth',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,email,password})});const j=await r.json();
        if(!r.ok)return msg(j.error||'Có lỗi, hãy thử lại.');put('se:auth',JSON.stringify({token:j.token,email:j.user.email,name:j.user.name||''}));paint();close();toast('Đã đăng nhập');sync()}
      catch(e){msg('Không kết nối được máy chủ. Trang này cần chạy trên Vercel (không mở trực tiếp từ file).')}};
    m.querySelector('#in').onclick=()=>go('login');m.querySelector('#up').onclick=()=>go('register');
  }
  btn.onclick=modal;paint();sync();
})();
