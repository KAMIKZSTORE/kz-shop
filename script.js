/* ---------------------------
   App: Kamikz demo single-file
   --------------------------- */

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
function toast(msg, t=1400){ const el=document.createElement('div'); el.className='toast'; el.textContent=msg; document.body.appendChild(el); setTimeout(()=> el.style.opacity='0', t-200); setTimeout(()=> el.remove(), t); }

/* EmailJS implementation */
async function sendEmail(to, subject, body) {
  try {
    showLoading(); // Show loading indicator
    
    // Prepare email parameters
    const templateParams = {
      to_email: to,
      from_name: "Admin Kamikz",
      from_email: "andikadarmawangsa640@gmail.com",
      subject: subject,
      message: body
    };

    // Send email using EmailJS
    await emailjs.send(
      'YOUR_EMAILJS_SERVICE_ID', // Replace with your EmailJS service ID
      'YOUR_EMAILJS_TEMPLATE_ID', // Replace with your EmailJS template ID
      templateParams
    );
    
    hideLoading(); // Hide loading indicator
    toast(`Email OTP dikirim ke ${to}`);
    return true;
  } catch (error) {
    hideLoading();
    console.error('Email sending failed:', error);
    toast('Gagal mengirim OTP. Silakan coba lagi.');
    return false;
  }
}

/* app state */
let users = loadUsers();
let current = getCurrent();
let me = current && users[current] ? users[current] : null;

/* seed admin if missing */
(function seed(){
  if(!users['admin@dev.co']){
    users['admin@dev.co'] = {
      name:'admin', email:'admin@dev.co', gmail:'admin@gmail.com', role:'admin', photo:'', phone:'', phoneVerified:true,
      saldo:500000, history:[{id:uid(),dateISO:new Date().toISOString(),type:'topup',note:'Saldo awal (admin)',amount:500000}],
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
function closeModal(){ modalWrap.style.display='none'; modalWrap.setAttribute('aria-hidden','true'); modalContent.innerHTML=''; }

/* close modal when click outside */
modalWrap.addEventListener('click', (e)=> {
  if(e.target === modalWrap) closeModal();
});

/* --- LOADING HELPERS (DITAMBAHKAN) --- */
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
/* helper to run an async-like simulated action with loader */
function withLoading(fn, delay=900){
  showLoading();
  return setTimeout(()=> {
    try { fn(); } finally { hideLoading(); }
  }, delay);
}

/* initial UI bindings */
document.addEventListener('DOMContentLoaded', ()=> {
  users = loadUsers(); current = getCurrent();
  if(!current || !users[current]) askLogin();
  else renderApp();

  // handlers (elements exist in DOM)
  $('btnTopUp').addEventListener('click', showTopUpModal);
  $('qaTopUp').addEventListener('click', ()=> $('btnTopUp').click());
  $('qaTransfer').addEventListener('click', showTransferModal);
  $('qaMutasi').addEventListener('click', openTransactions);
  $('qaProfile').addEventListener('click', openProfile);
  $('hdrAvatar').addEventListener('click', openProfile);

  // Refresh button: show loader while reloading users
  $('refreshBtn').addEventListener('click', ()=> {
    withLoading(()=> {
