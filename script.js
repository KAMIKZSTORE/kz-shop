javascript
/* ---------------------------
   App: Kamikz demo single-file
   --------------------------- */

/* Initialize EmailJS */
(function() {
  emailjs.init('YOUR_EMAILJS_PUBLIC_KEY'); // Replace with your public key
  console.log('EmailJS initialized');
})();

/* utilities & storage */
const LS_USERS = 'kamikz.users.v6';
const LS_CURRENT = 'kamikz.current.v6';
const DAILY_LIMIT = 50_000_000;

const $ = id => document.getElementById(id);
const uid = () => Math.random().toString(36).slice(2,10).toUpperCase();
const fmt = n => 'Rp ' + Number(n||0).toLocaleString('id-ID');

function loadUsers(){ try{ return JSON.parse(localStorage.getItem(LS_USERS) || '{}'); }catch(e){ return {}; } }
function saveUsers(u){ localStorage.setItem(LS_USERS, JSON.stringify(u||{})); }
function setCurrent(email){ localStorage.setItem(LS_CURRENT, email||''); }
function getCurrent(){ return localStorage.getItem(LS_CURRENT) || ''; }
function toast(msg, t=1400){ 
  const el = document.createElement('div'); 
  el.className = 'toast'; 
  el.textContent = msg; 
  document.body.appendChild(el); 
  setTimeout(()=> el.style.opacity = '0', t-200); 
  setTimeout(()=> el.remove(), t); 
}

/* DOM elements */
const loginPage = $('loginPage');
const app = $('app');
const loginBtn = $('loginBtn');
const logoutBtn = $('logoutBtn');

/* app state */
let users = loadUsers();
let current = getCurrent();
let me = current && users[current] ? users[current] : null;

/* EmailJS implementation */
async function sendEmail(to, subject, body) {
  try {
    showLoading();
    console.log('Attempting to send email to:', to);
    
    const templateParams = {
      to_email: to,
      from_name: "Admin Kamikz",
      from_email: "andikadarmawangsa640@gmail.com",
      reply_to: "andikadarmawangsa640@gmail.com",
      subject: subject,
      message: body
    };

    const response = await emailjs.send(
      'YOUR_EMAILJS_SERVICE_ID', // Replace with Service ID
      'YOUR_EMAILJS_TEMPLATE_ID', // Replace with Template ID
      templateParams
    );
    
    console.log('Email sent successfully:', response);
    hideLoading();
    toast(`Email OTP dikirim ke ${to}`);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    hideLoading();
    toast(`Gagal mengirim OTP: ${error.status || 'Unknown error'}`);
    return false;
  }
}

/* Login/Logout functions */
function showLoginPage() {
  loginPage.style.display = 'flex';
  app.style.display = 'none';
}

function hideLoginPage() {
  loginPage.style.display = 'none';
  app.style.display = 'block';
}

/* seed admin if missing */
(function seed(){
  if(!users['admin@dev.co']){
    users['admin@dev.co'] = {
      name:'admin', 
      email:'admin@dev.co', 
      gmail:'admin@gmail.com', 
      role:'admin', 
      photo:'', 
      phone:'', 
      phoneVerified:true,
      saldo:500000, 
      history:[{
        id:uid(),
        dateISO:new Date().toISOString(),
        type:'topup',
        note:'Saldo awal (admin)',
        amount:500000
      }],
      security:{pin:'1234', a2f:false}
    };
    saveUsers(users);
  }
})();

/* modal helpers */
const modalWrap = $('modalWrap'), modalContent = $('modalContent');
function showModal(html){
  modalContent.innerHTML = html;
  modalWrap.style.display = 'flex';
  modalWrap.setAttribute('aria-hidden','false');
}
function closeModal(){ 
  modalWrap.style.display='none'; 
  modalWrap.setAttribute('aria-hidden','true'); 
  modalContent.innerHTML=''; 
}

/* close modal when click outside */
modalWrap.addEventListener('click', (e)=> {
  if(e.target === modalWrap) closeModal();
});

/* loading helpers */
function showLoading() {
  const el = $('loadingScreen');
  if(!el) return;
  el.style.display = 'flex';
  el.setAttribute('aria-hidden','false');
}
function hideLoading() {
  const el = $('loadingScreen');
  if(!el) return;
  el.style.display = 'none';
  el.setAttribute('aria-hidden','true');
}
function withLoading(fn, delay=900){
  showLoading();
  return setTimeout(()=> {
    try { fn(); } finally { hideLoading(); }
  }, delay);
}

/* initial UI bindings */
document.addEventListener('DOMContentLoaded', ()=> {
  users = loadUsers(); 
  current = getCurrent();
  
  if(!current || !users[current]) {
    showLoginPage();
  } else {
    hideLoginPage();
    renderApp();
  }

  // Modern login handler
  loginBtn.addEventListener('click', () => {
    const email = $('loginEmail').value.trim().toLowerCase();
    const gmail = $('loginGmail').value.trim().toLowerCase();
    const name = $('loginName').value.trim();
    
    if(!email || !name) {
      toast('Email dan nama wajib diisi');
      return;
    }
    
    withLoading(() => {
      if(!users[email]) {
        users[email] = { 
          name, 
          email, 
          gmail,
          role: 'user',
          photo: '', 
          phone: '', 
          phoneVerified: false, 
          saldo: 0, 
          history: [], 
          security: {pin: '', a2f: false} 
        };
        saveUsers(users);
      }
      
      current = email; 
      setCurrent(email); 
      me = users[email];
      hideLoginPage(); 
      renderApp(); 
      toast('Selamat datang, ' + me.name);
    }, 900);
  });

  // Logout functionality
  logoutBtn.addEventListener('click', () => {
    withLoading(() => {
      setCurrent('');
      showLoginPage();
      toast('Anda telah logout');
    }, 500);
  });

  // Rest of your existing event listeners
  $('btnTopUp').addEventListener('click', showTopUpModal);
  $('qaTopUp').addEventListener('click', ()=> $('btnTopUp').click());
  $('qaTransfer').addEventListener('click', showTransferModal);
  $('qaMutasi').addEventListener('click', openTransactions);
  $('qaProfile').addEventListener('click', openProfile);
  $('hdrAvatar').addEventListener('click', openProfile);

  // Refresh button
  $('refreshBtn').addEventListener('click', ()=> {
    withLoading(()=> {
      users = loadUsers();
      me = users[current];
      updateBalance();
      toast('Saldo diperbarui');
    }, 900);
  });
});

/* render */
function renderApp(){
  if(!current || !users[current]) {
    showLoginPage();
    return;
  }
  
  users = loadUsers(); 
  me = users[current];
  
  const firstName = (me.name || '').split(' ')[0] || me.name;
  if(me.role === 'admin'){
    $('greet').innerHTML = `Hai, ${escapeHtml(firstName)} <span class="admin-badge" title="Admin">✔</span>`;
  } else {
    $('greet').textContent = `Hai, ${firstName}`;
  }
  $('trxCount').textContent = `${(me.history||[]).length} Trx`;
  $('saldoMain').textContent = fmt(me.saldo);
  $('balance').textContent = fmt(me.saldo);
  $('hdrAvatar').src = me.photo && me.photo.startsWith('data:') ? me.photo : genAvatar(me.name);
  renderRecent();
}

/* helper to avoid XSS */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m)=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function updateBalance(){
  if(!me) return;
  $('saldoMain').textContent = fmt(me.saldo);
  $('balance').textContent = fmt(me.saldo);
}

/* avatar */
function genAvatar(name){
  const initials = (name||'U').split(' ').map(s=>s[0]||'').slice(0,2).join('').toUpperCase() || 'U';
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect rx='20' width='100%' height='100%' fill='#eef9f7'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-size='72' fill='#0ea5a4' font-family='Inter, sans-serif' font-weight='700'>${initials}</text></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

/* recent */
function renderRecent(){
  const list = (me.history||[]).slice().reverse().slice(0,10);
  const out = $('recentList'); out.innerHTML = '';
  if(!list.length) { out.innerHTML = '<div class="empty">Belum ada transaksi</div>'; return; }
  list.forEach(it=>{
    const el = document.createElement('div'); el.className='recent-row';
    el.innerHTML = `<div><div style="font-weight:700">${escapeHtml(it.note||it.type)}</div><div class="small-muted">${new Date(it.dateISO).toLocaleString()}</div></div><div style="font-weight:800">${fmt(it.amount)}</div>`;
    out.appendChild(el);
  });
}

/* TopUp modal */
function showTopUpModal(){
  if(!me) { showLoginPage(); return; }
  showModal(`
    <h3>Topup Saldo</h3>
    <div class="small-muted">Saldo Anda saat ini</div>
    <div style="font-weight:800;font-size:20px;margin-top:4px">${fmt(me.saldo)}</div>

    <div class="form-row">
      <label class="small-muted">Jumlah Topup</label>
      <input id="topInput" class="input" placeholder="Masukkan jumlah topup (tanpa titik)">
      <div class="small-muted" style="margin-top:6px">Input Nominal Cepat</div>
      <div class="chips" id="topChips">
        <div class="chip" data-val="1000">Rp1.000</div>
        <div class="chip" data-val="5000">Rp5.000</div>
        <div class="chip" data-val="10000">Rp10.000</div>
        <div class="chip" data-val="20000">Rp20.000</div>
        <div class="chip" data-val="50000">Rp50.000</div>
        <div class="chip" data-val="100000">Rp100.000</div>
        <div class="chip" data-val="150000">Rp150.000</div>
        <div class="chip" data-val="200000">Rp200.000</div>
        <div class="chip" data-val="500000">Rp500.000</div>
        <div class="chip" data-val="1000000">Rp1.000.000</div>
      </div>

      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
        <button id="topCancel" class="btn">Batal</button>
        <button id="topProceed" class="btn primary">Topup Saldo Algastaku</button>
      </div>
    </div>
  `);

  document.querySelectorAll('#topChips .chip').forEach(c=>{
    c.addEventListener('click', ()=> {
      const val = Number(c.dataset.val);
      $('topInput').value = val;
    });
  });

  $('topCancel').addEventListener('click', closeModal);
  $('topProceed').addEventListener('click', ()=>{
    const v = Number($('topInput').value);
    if(!v || v <= 0) return alert('Masukkan nominal yang valid.');
    const today = new Date().toISOString().slice(0,10);
    const todayTotal = (me.history||[]).reduce((s,h)=> (h.dateISO||'').slice(0,10)===today ? s + (h.amount||0) : s, 0);
    if(todayTotal + v > DAILY_LIMIT) return alert('Melebihi limit harian: ' + fmt(DAILY_LIMIT));
    withLoading(()=> createTopupOrder(v), 900);
  });
}

/* create order */
function createTopupOrder(amount){
  const orderId = 'TP' + Date.now().toString().slice(-8);
  const unique = Math.floor(Math.random()*900 + 100);
  const adminFee = 19;
  const totalReceived = amount + unique;
  const totalToPay = amount + adminFee + unique;
  const order = {
    id: orderId,
    amount,
    unique,
    adminFee,
    totalToPay,
    totalReceived,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  me.pendingOrder = order;
  users[current] = me; saveUsers(users);
  showOrderDetail(order);
}

/* order detail (choose method) */
function showOrderDetail(order){
  showModal(`
    <h3>Kamikz Digital</h3>
    <div class="order-card">
      <div><strong>ID Topup</strong><div class="small-muted" style="float:right">${order.id}</div></div>
      <div style="margin-top:8px"><strong>Jumlah Topup</strong><div style="float:right">${fmt(order.amount)}</div></div>
      <div style="margin-top:8px"><strong>Kode Unik</strong><div style="float:right">${fmt(order.unique)}</div></div>
      <div style="margin-top:8px"><strong>Total Diterima</strong><div style="float:right;font-weight:800">${fmt(order.totalReceived)}</div></div>
    </div>

    <div class="small-muted">Pilih Metode Pembayaran</div>
    <div class="pay-method" data-method="qris"><div class="meta"><strong>QRIS</strong><div class="small-muted">Real-time 24 Jam</div></div><div>→</div></div>
    <div class="pay-method" data-method="ewallet"><div class="meta"><strong>E-Wallet</strong><div class="small-muted">OVO / DANA / GoPay</div></div><div>→</div></div>
    <div class="pay-method" data-method="retail"><div class="meta"><strong>Retail</strong><div class="small-muted">Alfamart / Indomaret</div></div><div>→</div></div>

    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
      <button id="orderClose" class="btn">Tutup</button>
    </div>
  `);

  $('orderClose').addEventListener('click', ()=> { 
    delete me.pendingOrder; 
    users[current]=me; 
    saveUsers(users); 
    closeModal(); 
  });

  document.querySelectorAll('.pay-method').forEach(el=>{
    el.addEventListener('click', ()=> {
      const method = el.dataset.method;
      if(method === 'qris') showQRPage(me.pendingOrder);
      else alert('Method ' + method + ' (simulasi) — QRIS dipilih untuk demo.');
    });
  });
}

/* QR page */
function showQRPage(order){
  if(!order) return alert('Order tidak ditemukan.');
  const expire = new Date(Date.now() + 15*60*1000);
  showModal(`
    <h3>Kamikz Digital</h3>
    <div class="order-card">
      <div><strong>Total Bayar</strong><div style="float:right;font-weight:800">${fmt(order.totalToPay)}</div></div>
      <div style="margin-top:8px"><strong>Detail Transaksi</strong>
        <div class="small-muted" style="margin-top:6px">Pelanggan: <strong>${escapeHtml(me.name)}</strong></div>
        <div class="small-muted" style="margin-top:2px">Jumlah: <strong>${fmt(order.totalReceived)}</strong></div>
        <div class="small-muted" style="margin-top:2px">Biaya Admin: <strong style="color:#d00">${fmt(order.adminFee)}</strong></div>
      </div>
    </div>

    <div class="small-muted">QRIS</div>
    <div class="qr-box">
      <img src="https://files.catbox.moe/vmbhiv.jpg" alt="qris" style="width:260px;height:260px;object-fit:cover;border-radius:6px"/>
      <div style="margin-top:8px;font-weight:800">${fmt(order.totalToPay)}</div>
      <div class="small-muted" style="margin-top:8px">Bayar sebelum: <strong>${expire.toLocaleString()}</strong></div>
    </div>

    <div style="display:flex;gap:8px;justify-content:center;margin-top:12px">
      <button id="btnCancelOrder" class="btn danger">Batalkan</button>
      <button id="btnCheckStatus" class="btn primary">Cek Status</button>
      <button id="btnSimulatePay" class="btn">Confirm</button>
    </div>
  `);

  $('btnCancelOrder').addEventListener('click', ()=>{
    delete me.pendingOrder; 
    users[current]=me; 
    saveUsers(users); 
    closeModal(); 
    toast('Order dibatalkan');
  });
  
  $('btnCheckStatus').addEventListener('click', ()=>{
    if(me.pendingOrder && me.pendingOrder.status === 'paid'){
      alert('Pembayaran telah lunas. Saldo ditambahkan.');
    } else alert('Status: Belum dibayar.');
  });
  
  $('btnSimulatePay').addEventListener('click', ()=>{
    if(!me.pendingOrder) return alert('Order tidak ditemukan.');
    withLoading(()=> {
      me.pendingOrder.status = 'paid';
      me.history = me.history || [];
      me.history.push({ 
        id: uid(), 
        dateISO: new Date().toISOString(), 
        type: 'topup', 
        note: 'Topup saldo ' + me.pendingOrder.id, 
        amount: me.pendingOrder.totalReceived 
      });
      me.saldo = Number(me.saldo || 0) + Number(me.pendingOrder.totalReceived);
      delete me.pendingOrder;
      users[current] = me; 
      saveUsers(users);
      renderApp(); 
      closeModal(); 
      toast('Pembayaran berhasil, saldo ditambahkan');
    }, 900);
  });
}

/* Transfer modal */
function showTransferModal(){
  if(!me) { showLoginPage(); return; }
  showModal(`
    <h3>Transfer Saldo</h3>
    <div class="form-row">
      <input id="tTo" class="input" placeholder="Email penerima">
      <input id="tAmt" class="input" type="number" placeholder="Nominal">
      <input id="tNote" class="input" placeholder="Catatan (opsional)">
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">
        <button id="tCancel" class="btn">Batal</button>
        <button id="tSend" class="btn primary">Kirim</button>
      </div>
    </div>
  `);
  
  $('tCancel').addEventListener('click', closeModal);
  $('tSend').addEventListener('click', ()=>{
    const to = $('tTo').value.trim().toLowerCase();
    const amt = Number($('tAmt').value);
    const note = $('tNote').value.trim();
    
    if(!to || !amt || amt <= 0) return alert('Isi penerima & nominal');
    if(!users[to]) return alert('Penerima tidak ditemukan.');
    if(Number(me.saldo) < amt) return alert('Saldo tidak cukup.');
    
    withLoading(()=> {
      me.saldo = Number(me.saldo) - amt;
      me.history = me.history || [];
      me.history.push({ 
        id: uid(), 
        dateISO: new Date().toISOString(), 
        type: 'transfer-out', 
        note: note || `Transfer ke ${to}`, 
        amount: -amt 
      });

      users[to].saldo = Number(users[to].saldo || 0) + amt;
      users[to].history = users[to].history || [];
      users[to].history.push({ 
        id: uid(), 
        dateISO: new Date().toISOString(), 
        type: 'transfer-in', 
        note: note || `Transfer dari ${me.email}`, 
        amount: amt 
      });

      users[current] = me; 
      saveUsers(users);
      renderApp(); 
      closeModal(); 
      toast('Transfer berhasil');
    }, 900);
  });
}

/* transactions */
function openTransactions(){
  if(!me) { showLoginPage(); return; }
  showModal(`
    <h3>Transaksi Saya</h3>
    <div style="max-height:60vh;overflow:auto;margin-top:8px">
      <div id="transactionsList"></div>
    </div>
    <div style="display:flex;justify-content:flex-end;margin-top:10px">
      <button id="closeTx" class="btn primary">Tutup</button>
    </div>
  `);
  
  const listEl = $('transactionsList'); 
  listEl.innerHTML = '';
  const list = (me.history||[]).slice().reverse();
  
  if(!list.length) {
    listEl.innerHTML = '<div class="empty">Belum ada transaksi</div>';
  } else {
    list.forEach(it=>{
      const el = document.createElement('div'); 
      el.className='recent-row';
      el.innerHTML = `
        <div>
          <div style="font-weight:700">${escapeHtml(it.note||it.type)}</div>
          <div class="small-muted">${new Date(it.dateISO).toLocaleString()}</div>
        </div>
        <div style="font-weight:800">${fmt(it.amount)}</div>
      `;
      listEl.appendChild(el);
    });
  }
  
  $('closeTx').addEventListener('click', closeModal);
}

/* profile */
function openProfile(){
  if(!me) { showLoginPage(); return; }
  showModal(`
    <h3>Profil</h3>
    <div style="text-align:center">
      <img id="pfPic" src="${me.photo && me.photo.startsWith('data:') ? me.photo : genAvatar(me.name)}" style="width:110px;height:110px;border-radius:999px;object-fit:cover"/>
      <div style="font-weight:800;margin-top:8px">${escapeHtml(me.name)} ${me.role === 'admin' ? '<span class="admin-badge" title="Admin">✔</span>' : ''}</div>
      <div class="small-muted">${escapeHtml(me.email)}</div>
      ${me.gmail ? `<div class="small-muted">Gmail: ${escapeHtml(me.gmail)}</div>` : ''}
    </div>
    <div class="form-row" style="margin-top:12px">
      <label class="small-muted">Ubah Foto</label>
      <input id="pfFile" type="file" accept="image/*" class="input">
      <label class="small-muted">Nama</label>
      <input id="pfName" class="input" value="${escapeHtml(me.name)}">
      <label class="small-muted">Gmail (untuk OTP)</label>
      <input id="pfGmail" class="input" value="${me.gmail || ''}" placeholder="your@gmail.com">
      <label class="small-muted">Nomor Telepon</label>
      <div style="display:flex;gap:8px">
        <input id="pfPhone" class="input" value="${me.phone||''}" placeholder="62...">
        <button id="sendOtp" class="btn">Kirim OTP</button>
      </div>
      <div id="otpArea"></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">
        <button id="pfCancel" class="btn">Batal</button>
        <button id="pfSave" class="btn primary">Simpan</button>
      </div>
    </div>
  `);

  const pfFile = $('pfFile'), pfPic = $('pfPic');
  pfFile.addEventListener('change', e=>{
    const f = e.target.files && e.target.files[0]; 
    if(!f) return;
    const reader = new FileReader(); 
    reader.onload = ev => pfPic.src = ev.target.result; 
    reader.readAsDataURL(f);
  });

  $('pfCancel').addEventListener('click', closeModal);
  $('pfSave').addEventListener('click', ()=>{
    const newName = $('pfName').value.trim();
    const newGmail = $('pfGmail').value.trim().toLowerCase();
    const newPhone = $('pfPhone').value.trim();
    
    if(!newName) return alert('Nama tidak boleh kosong');
    
    withLoading(()=> {
      me.name = newName;
      me.gmail = newGmail;
      const pic = pfPic.src && pfPic.src.startsWith('data:') ? pfPic.src : me.photo;
      me.photo = pic;
      if(newPhone && newPhone !== me.phone) me.phoneVerified = false;
      me.phone = newPhone;
      users[current] = me; 
      saveUsers(users);
      renderApp(); 
      closeModal(); 
      toast('Profil disimpan');
    }, 900);
  });

  $('sendOtp').addEventListener('click', async ()=>{
    const phone = $('pfPhone').value.trim();
    
    if(!/^(\+62|62|0)\d{9,12}$/.test(phone)) {
      return alert('Format nomor tidak valid. Gunakan format 62/08');
    }
    
    const gmail = me.gmail || me.email;
    if(!gmail) {
      return alert('Harap isi alamat Gmail yang valid di profil Anda');
    }

    // Generate OTP
    const code = String(Math.floor(100000 + Math.random()*900000));
    me.otpPending = { 
      code, 
      phone, 
      expires: Date.now() + 3*60*1000 // 3 menit
    };
    
    try {
      showLoading();
      console.log('Generated OTP:', code); // For debugging
      
      // Kirim email
      const emailSubject = 'Kode Verifikasi Kamikz';
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #11998e;">Kode Verifikasi Kamikz</h2>
          <p>Halo ${me.name},</p>
          <p>Gunakan kode berikut untuk verifikasi nomor telepon Anda:</p>
          <div style="background: #f3fbfb; padding: 15px; text-align: center; margin: 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
            ${code}
          </div>
          <p>Kode ini berlaku selama 3 menit.</p>
          <p style="color: #ff0000;">Jangan bagikan kode ini kepada siapapun!</p>
          <p>Terima kasih,<br>Tim Kamikz</p>
        </div>
      `;

      const success = await sendEmail(gmail, emailSubject, emailBody);
      
      if (success) {
        saveUsers(users); // Simpan OTP ke storage
        renderOtpArea(true);
      } else {
        delete me.otpPending; // Hapus OTP jika gagal
      }
    } catch (error) {
      console.error('OTP sending error:', error);
      delete me.otpPending;
      toast('Terjadi kesalahan saat mengirim OTP');
    } finally {
      hideLoading();
    }
  });
}

/* OTP functions */
function renderOtpArea(show) {
  const otpArea = $('otpArea');
  if(!otpArea) return;
  
  if (show && me && me.otpPending) {
    otpArea.innerHTML = `
      <div class="otp-container">
        <div class="small-muted">Kode OTP telah dikirim ke ${me.gmail || me.email}</div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <input id="otpCode" class="input" placeholder="6 digit OTP" maxlength="6" style="text-align:center;letter-spacing:5px">
          <button id="verifyOtp" class="btn primary">Verifikasi</button>
        </div>
        <div id="otpTimer" class="small-muted" style="margin-top:8px"></div>
      </div>
    `;

    // Start OTP timer
    startOtpTimer();
    
    $('verifyOtp').addEventListener('click', verifyOtpHandler);
  } else {
    otpArea.innerHTML = '';
  }
}

function startOtpTimer() {
  if (!me.otpPending) return;
  
  const expires = me.otpPending.expires;
  const timerElement = $('otpTimer');
  
  const updateTimer = () => {
    const now = Date.now();
    const remaining = Math.max(0, expires - now);
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    timerElement.textContent = `Kode kadaluarsa dalam: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    
    if (remaining <= 0) {
      clearInterval(timerInterval);
      timerElement.textContent = 'Kode OTP telah kadaluarsa';
      delete me.otpPending;
      saveUsers(users);
    }
  };
  
  updateTimer();
  const timerInterval = setInterval(updateTimer, 1000);
}

function verifyOtpHandler() {
  const code = $('otpCode').value.trim();
  
  if (!me.otpPending) {
    return alert('OTP tidak tersedia atau sudah kadaluarsa');
  }
  
  if (code.length !== 6 || !/^\d+$/.test(code)) {
    return alert('Masukkan 6 digit angka OTP');
  }
  
  if (Date.now() > me.otpPending.expires) {
    delete me.otpPending;
    saveUsers(users);
    return alert('OTP sudah kadaluarsa');
  }
  
  if (code === me.otpPending.code) {
    me.phoneVerified = true;
    me.phone = me.otpPending.phone;
    delete me.otpPending;
    users[current] = me;
    saveUsers(users);
    
    toast('Nomor telepon berhasil diverifikasi');
    renderApp();
    closeModal();
  } else {
    alert('Kode OTP salah. Silakan coba lagi.');
  }
}

/* utility: ensure current user exists */
(function ensureCurrent(){
  if(current && users[current]) { 
    me = users[current]; 
    return; 
  }
})();

/* stars effect */
(function stars(){
  const canvas = document.getElementById('bgStars');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = canvas.width = window.innerWidth;
  let h = canvas.height = window.innerHeight;
  let stars = [];
  
  function rand(min, max){ return Math.random()*(max-min)+min; }
  
  function reset(){
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    stars = [];
    const count = Math.min(180, Math.floor(w*h/6000));
    
    for(let i=0;i<count;i++){
      stars.push({
        x: rand(0,w),
        y: rand(0,h),
        r: rand(0.4,1.8),
        vy: rand(0.2,1.2),
        alpha: rand(0.3,0.95),
        twinkle: Math.random()*0.05
      });
    }
  }
  
  function draw(){
    ctx.clearRect(0,0,w,h);
    stars.forEach(s=>{
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      
      // fall
      s.y += s.vy;
      // small horizontal drift
      s.x += Math.sin(s.y * 0.01) * 0.3;
      // twinkle
      s.alpha += (Math.random()-0.5) * s.twinkle;
      if(s.alpha < 0.2) s.alpha = 0.2;
      if(s.alpha > 1) s.alpha = 1;
      
      if(s.y - s.r > h) {
        s.y = -s.r;
        s.x = rand(0,w);
      }
    });
    requestAnimationFrame(draw);
  }
  window.addEventListener('resize', reset);
  reset();
  draw();
})();
