// ═══════════════════════════════════════
// XP SHOP — 공통 유틸리티
// ═══════════════════════════════════════

// ── Supabase 설정 (본인 키로 교체) ──
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

// ── 토스페이먼츠 설정 ──
const TOSS_CLIENT_KEY = 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq'; // 테스트키

// ── Supabase 헬퍼 ──
async function sbFetch(path, options = {}) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    ...options,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      'Prefer': options.prefer || 'return=representation',
      ...options.headers
    }
  });
  if (!res.ok) { const e = await res.text(); throw new Error(e); }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function sbGet(table, query = '') {
  return sbFetch(table + '?' + query);
}

async function sbPost(table, body) {
  return sbFetch(table, { method: 'POST', body: JSON.stringify(body) });
}

async function sbPatch(table, query, body) {
  return sbFetch(table + '?' + query, { method: 'PATCH', body: JSON.stringify(body) });
}

// ── Storage 업로드 ──
async function sbUpload(bucket, path, file) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': file.type
    },
    body: file
  });
  if (!res.ok) throw new Error(await res.text());
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

// ── 장바구니 (localStorage) ──
const Cart = {
  get() { return JSON.parse(localStorage.getItem('xp_cart') || '[]'); },
  save(items) { localStorage.setItem('xp_cart', JSON.stringify(items)); },
  add(item) {
    const items = this.get();
    items.push({ ...item, id: Date.now() });
    this.save(items);
  },
  remove(id) { this.save(this.get().filter(i => i.id !== id)); },
  clear() { localStorage.removeItem('xp_cart'); },
  count() { return this.get().length; },
  total() { return this.get().reduce((s, i) => s + i.price * i.qty, 0); }
};

// ── 세션 (localStorage) ──
const Session = {
  get() { return JSON.parse(localStorage.getItem('xp_user') || 'null'); },
  set(u) { localStorage.setItem('xp_user', JSON.stringify(u)); },
  clear() { localStorage.removeItem('xp_user'); }
};

// ── 유틸 ──
function won(n) { return '₩' + Number(n).toLocaleString('ko-KR'); }
function genOrderNo() { return 'XP-' + Date.now().toString(36).toUpperCase(); }

// ── 시계 ──
function startClock(elId) {
  function tick() {
    const d = new Date();
    const el = document.getElementById(elId);
    if (!el) return;
    el.innerHTML = String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0')
      + '<br>' + (d.getMonth()+1) + '/' + d.getDate();
  }
  tick(); setInterval(tick, 15000);
}

// ── 알림 ──
function showNotif(msg, color) {
  let el = document.getElementById('xp-notif');
  if (!el) { el = document.createElement('div'); el.id = 'xp-notif'; document.body.appendChild(el); }
  el.style.cssText = `position:fixed;bottom:46px;right:4px;background:${color||'#ffffe1'};
    border:1px solid ${color?'#555':'#808000'};padding:8px 14px;font-size:12px;
    z-index:99999;max-width:240px;box-shadow:2px 2px 6px rgba(0,0,0,0.3);
    border-radius:2px;font-family:'Nanum Gothic',Tahoma,sans-serif;
    animation:ntfIn 0.2s ease;`;
  el.textContent = msg;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.remove(), 3000);
}

// ── 장바구니 배지 업데이트 ──
function updateCartBadge() {
  const cnt = Cart.count();
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = cnt > 0 ? cnt : '';
    el.style.display = cnt > 0 ? 'flex' : 'none';
  });
}

// ── XP 창 공통 ──
let _zTop = 200;
let _drag = null;

function xpOpen(id) {
  const w = document.getElementById(id);
  if (w) { w.style.display = 'block'; xpFocus(id); }
}
function xpClose(id) {
  const w = document.getElementById(id);
  if (w) w.style.display = 'none';
}
function xpFocus(id) {
  document.querySelectorAll('.xp-win').forEach(w => w.classList.remove('xp-focused'));
  const w = document.getElementById(id);
  if (!w) return;
  w.style.zIndex = ++_zTop;
  w.classList.add('xp-focused');
}
function xpDragStart(e, id) {
  if (e.target.closest('.title-btn')) return;
  xpFocus(id);
  const r = document.getElementById(id).getBoundingClientRect();
  _drag = { id, sx: e.clientX, sy: e.clientY, ol: r.left, ot: r.top };
  document.addEventListener('mousemove', _onDrag);
  document.addEventListener('mouseup', _stopDrag);
  e.preventDefault();
}
function _onDrag(e) {
  if (!_drag) return;
  const w = document.getElementById(_drag.id);
  w.style.left = Math.max(0, _drag.ol + e.clientX - _drag.sx) + 'px';
  w.style.top  = Math.max(0, _drag.ot + e.clientY - _drag.sy) + 'px';
}
function _stopDrag() {
  _drag = null;
  document.removeEventListener('mousemove', _onDrag);
  document.removeEventListener('mouseup', _stopDrag);
}

// ── 공통 CSS 주입 ──
const XP_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Nanum Gothic',Tahoma,sans-serif;background:linear-gradient(180deg,#1a6bb5 0%,#3c9a3c 60%,#2d7a2d 100%);min-height:100vh;padding-bottom:50px;}
.xp-win{position:fixed;border-radius:8px 8px 4px 4px;box-shadow:2px 2px 12px rgba(0,0,0,0.55);display:block;overflow:hidden;min-width:280px;background:#f0f0ea;}
.xp-win .title-bar{background:linear-gradient(180deg,#3168d5 0%,#1957c2 8%,#1957c2 92%,#3168d5 100%);padding:4px 6px;display:flex;align-items:center;gap:6px;cursor:move;height:30px;border-radius:6px 6px 0 0;}
.xp-win .tb-icon{font-size:14px;}
.xp-win .tb-text{flex:1;color:white;font-size:12px;font-weight:700;text-shadow:1px 1px 2px rgba(0,0,0,0.5);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.title-btn{width:21px;height:21px;border-radius:3px;border:none;cursor:pointer;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;color:white;}
.btn-min{background:linear-gradient(180deg,#5aa0e8,#2a6bc2);border:1px solid #1a4a99;}
.btn-max{background:linear-gradient(180deg,#5aa0e8,#2a6bc2);border:1px solid #1a4a99;}
.btn-cls{background:linear-gradient(180deg,#e8605a,#c22a2a);border:1px solid #991a1a;margin-left:2px;}
.title-btn:hover{filter:brightness(1.2);}
.xp-win .menu-bar{background:#ece9d8;border-bottom:1px solid #aca899;padding:2px 4px;display:flex;gap:2px;font-size:11px;}
.xp-win .mi{padding:2px 8px;border-radius:2px;cursor:pointer;color:#222;}
.xp-win .mi:hover{background:#316ac5;color:white;}
.win-body{background:#f0f0ea;overflow-y:auto;border:1px solid #aca899;border-top:none;}
.win-body::-webkit-scrollbar{width:16px;}
.win-body::-webkit-scrollbar-track{background:#c8c0b8;}
.win-body::-webkit-scrollbar-thumb{background:linear-gradient(90deg,#e0ddd5,#b8b4ac,#e0ddd5);border:1px solid #888;}
.xp-btn{height:28px;padding:0 14px;border:2px outset #ddd;background:linear-gradient(180deg,#ece9d8,#d4d0c8);cursor:pointer;font-size:12px;font-weight:700;font-family:'Nanum Gothic',Tahoma,sans-serif;border-radius:2px;color:#333;}
.xp-btn:hover{filter:brightness(1.05);}
.xp-btn:active{border-style:inset;}
.xp-btn.primary{background:linear-gradient(180deg,#5aa0e8,#316ac5,#1957c2);color:white;border-color:#1a3a99;text-shadow:1px 1px 2px rgba(0,0,0,0.4);}
.xp-btn.danger{background:linear-gradient(180deg,#e8605a,#c22a2a);color:white;border-color:#991a1a;}
.xp-input{height:24px;border:1px solid #7f9db9;background:white;font-size:12px;font-family:'Nanum Gothic',Tahoma,sans-serif;padding:0 6px;width:100%;}
.xp-select{height:24px;border:1px solid #7f9db9;background:white;font-size:12px;font-family:'Nanum Gothic',Tahoma,sans-serif;padding:0 4px;width:100%;}
.xp-textarea{border:1px solid #7f9db9;background:white;font-size:12px;font-family:'Nanum Gothic',Tahoma,sans-serif;padding:6px;width:100%;resize:vertical;}
.btn-row{display:flex;gap:8px;justify-content:flex-end;padding:8px 14px 12px;border-top:1px solid #aca899;background:#f0f0ea;}
.status-bar{background:#f0f0ea;border-top:1px solid #aca899;padding:2px 6px;font-size:11px;color:#444;display:flex;gap:6px;}
.xp-table{width:100%;border-collapse:collapse;font-size:12px;}
.xp-table th{background:linear-gradient(180deg,#e0ddd5,#ccc9c0);border:1px solid #aca899;padding:5px 8px;font-weight:700;text-align:left;}
.xp-table td{border:1px solid #d4d0c8;padding:5px 8px;background:white;}
.xp-table tr:nth-child(even) td{background:#f5f3ef;}
.xp-table tr:hover td{background:#e8f0fe;}
.section-title{font-size:13px;font-weight:800;color:#003399;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #003399;}
.badge{display:inline-block;font-size:10px;font-weight:800;padding:2px 7px;border-radius:2px;}
.badge-blue{background:#316ac5;color:white;}
.badge-red{background:#cc0000;color:white;}
.badge-green{background:#2d8a2d;color:white;}
.badge-gray{background:#888;color:white;}
.badge-yellow{background:#ffcc00;color:#333;}
@keyframes ntfIn{from{transform:translateY(16px);opacity:0;}to{transform:translateY(0);opacity:1;}}
/* TASKBAR */
.xp-taskbar{position:fixed;bottom:0;left:0;right:0;height:40px;background:linear-gradient(180deg,#245edb,#1a52d5 4%,#1a52d5 96%,#0c3699);border-top:2px solid #4a7fe0;display:flex;align-items:center;z-index:9000;padding:0 4px;}
.start-btn{height:32px;padding:0 14px 0 8px;background:linear-gradient(180deg,#5db55d,#3a9c3a,#2d8a2d);border:1px solid #1a5e1a;border-radius:12px;color:white;font-size:13px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:6px;font-family:'Nanum Gothic',Tahoma,sans-serif;text-shadow:1px 1px 2px rgba(0,0,0,0.5);text-decoration:none;}
.taskbar-right{display:flex;align-items:center;gap:8px;background:rgba(0,0,50,0.25);border-left:1px solid rgba(255,255,255,0.15);height:100%;padding:0 10px;}
.taskbar-icon-btn{color:white;font-size:18px;text-decoration:none;position:relative;cursor:pointer;}
.cart-badge{position:absolute;top:-4px;right:-6px;background:#ff3b3b;color:white;font-size:9px;font-weight:800;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
.taskbar-clock{color:white;font-size:11px;text-align:center;min-width:60px;font-family:'Nanum Gothic',Tahoma,sans-serif;line-height:1.4;}
`;

function injectXPStyles() {
  const s = document.createElement('style');
  s.textContent = XP_CSS;
  document.head.appendChild(s);
}
