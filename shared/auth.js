/* Super English — đăng nhập (Supabase) và đồng bộ tiến độ học giữa các thiết bị */
(function(){
  const {esc,toast,get,put,root}=SE;
  const NAMES=['se:vocab','se:writing'];
  const btn=document.querySelector('.abtn');if(!btn)return;
  const lab=btn.querySelector('span');
  let sb=null,user=null,timers={};
  const load=src=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s)});
  async function cfg(){
    if(!window.SE_CONFIG)await load(root+'shared/config.js').catch(()=>{});
    const c=window.SE_CONFIG||{};return c.SUPABASE_URL&&c.SUPABASE_ANON_KEY?c:null;
  }
  async function client(){
    if(sb)return sb;const c=await cfg();if(!c)return null;
    if(!window.supabase)await load('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js');
    sb=window.supabase.createClient(c.SUPABASE_URL,c.SUPABASE_ANON_KEY);return sb;
  }
  const merge=(a,b)=>Object.assign({},a,b); // ưu tiên dữ liệu trên máy này khi trùng
  async function sync(){
    if(!sb||!user)return;let changed=false;
    for(const n of NAMES){
      let local={};try{local=JSON.parse(get(n)||'{}')}catch(e){}
      const {data}=await sb.from('progress').select('data').eq('user_id',user.id).eq('name',n).maybeSingle();
      const remote=(data&&data.data)||{};const m=merge(remote,local);
      if(JSON.stringify(m)!==JSON.stringify(local)){put(n,JSON.stringify(m));changed=true}
      if(JSON.stringify(m)!==JSON.stringify(remote))await sb.from('progress').upsert({user_id:user.id,name:n,data:m,updated_at:new Date().toISOString()});
    }
    if(changed){toast('Đã đồng bộ tiến độ từ tài khoản');setTimeout(()=>location.reload(),600)}
  }
  window.SE_SYNC={dirty(n){if(!sb||!user)return;clearTimeout(timers[n]);timers[n]=setTimeout(async()=>{let d={};try{d=JSON.parse(get(n)||'{}')}catch(e){}
    await sb.from('progress').upsert({user_id:user.id,name:n,data:d,updated_at:new Date().toISOString()})},1500)}};
  function setUser(u){user=u;lab.textContent=u?(u.email.split('@')[0].slice(0,12)):'Đăng nhập'}
  function modal(){
    const m=document.createElement('div');m.className='modal';
    const close=()=>m.remove();
    const body=html=>{m.innerHTML='<div class="modal__box authbox" role="dialog" aria-modal="true"><button class="modal__x" type="button" aria-label="Đóng">×</button>'+html+'</div>';m.querySelector('.modal__x').onclick=close};
    m.onclick=e=>{if(e.target===m)close()};document.body.appendChild(m);
    const msg=t=>{const x=m.querySelector('.msg');if(x)x.textContent=t};
    (async()=>{
      const c=await client();
      if(!c){body('<h2>Chưa bật đăng nhập</h2><p>Chủ website cần tạo dự án Supabase miễn phí và điền địa chỉ + khóa vào <code>shared/config.js</code>. Hướng dẫn nằm trong README. Khi chưa bật, tiến độ vẫn được lưu ngay trên thiết bị này.</p>');return}
      if(user){body('<h2>Tài khoản</h2><p>Đang đăng nhập: <b>'+esc(user.email)+'</b><br>Tiến độ học được đồng bộ tự động giữa các thiết bị.</p><div class="row"><button class="btn sm" id="sy" type="button">Đồng bộ ngay</button><button class="btn sm ghost" id="lo" type="button">Đăng xuất</button></div><div class="msg"></div>');
        m.querySelector('#sy').onclick=async()=>{msg('Đang đồng bộ...');await sync();msg('Xong.')};
        m.querySelector('#lo').onclick=async()=>{await sb.auth.signOut();setUser(null);toast('Đã đăng xuất');close()};return}
      body('<h2>Đăng nhập để lưu tiến độ</h2><label for="em">Email</label><input id="em" type="email" autocomplete="email"><label for="pw">Mật khẩu (từ 6 ký tự)</label><input id="pw" type="password" autocomplete="current-password"><div class="row" style="margin-top:14px"><button class="btn sm" id="in" type="button">Đăng nhập</button><button class="btn sm ghost" id="up" type="button">Tạo tài khoản</button></div><div class="msg"></div>');
      const val=()=>[m.querySelector('#em').value.trim(),m.querySelector('#pw').value];
      m.querySelector('#in').onclick=async()=>{const [e,p]=val();msg('Đang đăng nhập...');const {data,error}=await sb.auth.signInWithPassword({email:e,password:p});if(error)return msg('Không đăng nhập được: '+error.message);setUser(data.user);close();toast('Đã đăng nhập');sync()};
      m.querySelector('#up').onclick=async()=>{const [e,p]=val();msg('Đang tạo tài khoản...');const {data,error}=await sb.auth.signUp({email:e,password:p});if(error)return msg('Không tạo được: '+error.message);if(data.session){setUser(data.user);close();toast('Đã tạo tài khoản');sync()}else msg('Đã tạo. Hãy mở email để xác nhận rồi quay lại đăng nhập.')};
    })();
  }
  btn.onclick=modal;
  (async()=>{const c=await client();if(!c)return;const {data}=await sb.auth.getSession();if(data.session){setUser(data.session.user);sync()}})();
})();
