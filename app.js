// ===========================
//  FRIENDS CHAT v2 — by SIFAT
//  Firebase Edition
// ===========================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ---- FIREBASE CONFIG ----
const firebaseConfig = {
  apiKey: "AIzaSyAPWOhyEY1woIPHgYJ-wyGu6q-aE7amei8",
  authDomain: "friend-s-chat-a621a.firebaseapp.com",
  projectId: "friend-s-chat-a621a",
  storageBucket: "friend-s-chat-a621a.firebasestorage.app",
  messagingSenderId: "713601179360",
  appId: "1:713601179360:web:df928eed72d2d17589fa85",
  measurementId: "G-BVDRXMVJ9D"
};

// ---- ADMIN GMAIL ---- (শুধু তোমার Gmail এখানে দাও)
const ADMIN_EMAIL = "Mohammadsifat1820@gmail.com";

// ---- AI FILTER ----
const RESTRICTED = [
  'গালি','বেআক্কেল','গাধা','কুত্তা','কুত্তার বাচ্চা','শালা','শালি',
  'হারামি','হারামজাদা','ছাগল','বেশ্যা','মাগি','রান্ডি','খানকি','মূর্খ',
  'fuck','shit','bitch','asshole','bastard','idiot','stupid','moron',
  'retard','nigger','faggot','whore','slut',
  '💩','🖕','🤬',
];

// ---- INIT ----
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

let currentUser = null;
let chatUnsubscribe = null;
let postUnsubscribe = null;

// ---- UID জেনারেটর ----
function generateUID() {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

// ---- AI FILTER ----
function filterText(text) {
  const lower = text.toLowerCase();
  for (const word of RESTRICTED) {
    if (lower.includes(word.toLowerCase()) || text.includes(word)) {
      return { blocked: true, word };
    }
  }
  return { blocked: false };
}

// ---- WARNING BANNER ----
function showWarning(userName, word) {
  const banner = document.getElementById('warning-banner');
  document.getElementById('warning-text').textContent = `⚠️ ${userName}, আপনার লেখায় "${word}" দেওয়া নিষেধ!`;
  banner.classList.remove('hidden', 'shake');
  void banner.offsetWidth;
  banner.classList.add('shake');
  clearTimeout(banner._t);
  banner._t = setTimeout(hideWarning, 5000);
  // Log to Firestore
  addDoc(collection(db, 'filter_logs'), {
    userName, word,
    uid: currentUser?.uid,
    time: serverTimestamp()
  });
}

window.hideWarning = function() {
  const banner = document.getElementById('warning-banner');
  banner.classList.add('hidden');
  banner.classList.remove('shake');
};

// ---- GOOGLE LOGIN ----
window.handleGoogleLogin = async function() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    // Check if user already has a profile
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      // নতুন user — username নিতে হবে
      document.getElementById('login-screen').classList.add('hidden');
      document.getElementById('username-modal').classList.remove('hidden');
    }
    // onAuthStateChanged handle করবে বাকিটা
  } catch (e) {
    alert('Login এ সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    console.error(e);
  }
};

// ---- USERNAME SAVE ----
window.saveUsername = async function() {
  const input = document.getElementById('username-input').value.trim();
  if (!input) { alert('Username দিন!'); return; }
  if (input.length < 2) { alert('Username কমপক্ষে ২ অক্ষর হতে হবে!'); return; }

  const user = auth.currentUser;
  const uid = generateUID();
  const userRef = doc(db, 'users', user.uid);
  await setDoc(userRef, {
    uid: uid,
    username: input,
    email: user.email,
    photo: user.photoURL || '',
    joinDate: serverTimestamp(),
    blocked: false
  });
  document.getElementById('username-modal').classList.add('hidden');
};

// ---- AUTH STATE ----
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // username modal দেখাও
      document.getElementById('login-screen').classList.add('hidden');
      document.getElementById('username-modal').classList.remove('hidden');
      return;
    }

    const data = userSnap.data();

    // Blocked check
    if (data.blocked) {
      alert('আপনার account blocked করা হয়েছে।');
      await signOut(auth);
      return;
    }

    currentUser = {
      firebaseUid: user.uid,
      uid: data.uid,
      name: data.username,
      email: user.email,
      photo: user.photoURL || '',
    };

    // UI আপডেট
    document.getElementById('profile-name').textContent = data.username;
    document.getElementById('profile-tag').textContent = 'UI: ' + data.uid;
    document.getElementById('post-name').textContent = data.username;

    // Avatar
    if (user.photoURL) {
      document.getElementById('profile-avatar').innerHTML = `<img src="${user.photoURL}" alt="avatar">`;
      document.getElementById('post-avatar').innerHTML = `<img src="${user.photoURL}" alt="avatar">`;
    } else {
      const letter = data.username.charAt(0).toUpperCase();
      document.getElementById('profile-avatar').textContent = letter;
      document.getElementById('post-avatar').textContent = letter;
    }

    // Screen switch
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('username-modal').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');

    // Admin check
    if (user.email === ADMIN_EMAIL) {
      addAdminButton();
    }

    // Real-time listeners চালু
    startChatListener();
    startPostListener();

  } else {
    currentUser = null;
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
    if (chatUnsubscribe) chatUnsubscribe();
    if (postUnsubscribe) postUnsubscribe();
  }
});

// ---- LOGOUT ----
window.handleLogout = async function() {
  if (!confirm('লগআউট করতে চান?')) return;
  await signOut(auth);
};

// ---- TAB SWITCH ----
const TAB_TITLES = { home:'হোম', community:'কমিউনিটি চ্যাট', rules:'নিয়মাবলী', post:'পোস্ট' };

window.switchTab = function(tab) {
  document.querySelectorAll('.tab-content').forEach(el => {
    el.classList.add('hidden'); el.classList.remove('active');
  });
  const t = document.getElementById('tab-' + tab);
  t.classList.remove('hidden'); t.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.getElementById('tab-title').textContent = TAB_TITLES[tab] || tab;
  if (window.innerWidth <= 768) closeSidebar();
};

// ---- SIDEBAR ----
window.toggleSidebar = function() {
  const s = document.getElementById('sidebar');
  const o = document.getElementById('sidebar-overlay');
  if (s.classList.contains('open')) { closeSidebar(); }
  else { s.classList.add('open'); o.classList.remove('hidden'); }
};
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.add('hidden');
}

// ---- CHAT ----
function startChatListener() {
  const q = query(collection(db, 'messages'), orderBy('time', 'asc'));
  chatUnsubscribe = onSnapshot(q, (snapshot) => {
    const container = document.getElementById('chat-messages');
    // Loading সরাও
    const loading = document.getElementById('chat-loading');
    if (loading) loading.remove();

    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        const msg = { id: change.doc.id, ...change.doc.data() };
        renderChatMessage(msg);
      }
      if (change.type === 'removed') {
        const el = document.getElementById('msg-' + change.doc.id);
        if (el) el.remove();
      }
    });
    container.scrollTop = container.scrollHeight;
  });
}

window.sendMessage = async function() {
  if (!currentUser) return;
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  const check = filterText(text);
  if (check.blocked) { showWarning(currentUser.name, check.word); input.value = ''; return; }

  hideWarning();
  input.value = '';

  await addDoc(collection(db, 'messages'), {
    name: currentUser.name,
    uid: currentUser.uid,
    firebaseUid: currentUser.firebaseUid,
    photo: currentUser.photo,
    text,
    time: serverTimestamp()
  });
};

function renderChatMessage(msg) {
  const container = document.getElementById('chat-messages');
  if (document.getElementById('msg-' + msg.id)) return;
  const isOwn = msg.firebaseUid === currentUser?.firebaseUid;
  const time = msg.time?.toDate ? msg.time.toDate().toLocaleTimeString('bn-BD', { hour:'2-digit', minute:'2-digit' }) : '';

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${isOwn ? 'own' : 'other'}`;
  bubble.id = 'msg-' + msg.id;

  const avatarHTML = msg.photo
    ? `<img src="${msg.photo}" alt="a" style="width:24px;height:24px;border-radius:50%;object-fit:cover;">`
    : `<span style="font-size:.7rem;font-weight:700;color:var(--neon)">${escapeHTML(msg.name?.charAt(0) || 'U')}</span>`;

  bubble.innerHTML = `
    <div class="bubble-header">
      <div style="width:24px;height:24px;border-radius:50%;background:var(--neon-dim);display:flex;align-items:center;justify-content:center;overflow:hidden;">${avatarHTML}</div>
      <span class="bubble-name">${escapeHTML(msg.name)}</span>
    </div>
    <div class="bubble-body">${escapeHTML(msg.text)}</div>
    <div class="bubble-time">${time}</div>
  `;
  container.appendChild(bubble);
}

// ---- POSTS ----
function startPostListener() {
  const q = query(collection(db, 'posts'), orderBy('time', 'desc'));
  postUnsubscribe = onSnapshot(q, (snapshot) => {
    const feed = document.getElementById('post-feed');
    const loading = document.getElementById('post-loading');
    if (loading) loading.remove();

    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        const post = { id: change.doc.id, ...change.doc.data() };
        renderPost(post, true);
      }
      if (change.type === 'removed') {
        const el = document.getElementById('post-' + change.doc.id);
        if (el) el.remove();
      }
    });
  });
}

window.createPost = async function() {
  if (!currentUser) return;
  const input = document.getElementById('post-input');
  const text = input.value.trim();
  if (!text) return;

  const check = filterText(text);
  if (check.blocked) { showWarning(currentUser.name, check.word); return; }

  hideWarning();
  input.value = '';
  updateCharCount();

  await addDoc(collection(db, 'posts'), {
    name: currentUser.name,
    uid: currentUser.uid,
    firebaseUid: currentUser.firebaseUid,
    photo: currentUser.photo,
    text,
    time: serverTimestamp()
  });
};

function renderPost(post, prepend = false) {
  const feed = document.getElementById('post-feed');
  if (document.getElementById('post-' + post.id)) return;

  const time = post.time?.toDate ? post.time.toDate().toLocaleTimeString('bn-BD', { hour:'2-digit', minute:'2-digit' }) : '';
  const avatarHTML = post.photo
    ? `<img src="${post.photo}" alt="a">`
    : escapeHTML(post.name?.charAt(0) || 'U');

  const card = document.createElement('div');
  card.className = 'post-card';
  card.id = 'post-' + post.id;
  card.innerHTML = `
    <div class="post-header">
      <div class="post-avatar">${avatarHTML}</div>
      <div class="post-user-info">
        <div class="post-user-name">${escapeHTML(post.name)}</div>
        <div class="post-meta">
          <span class="post-time">আজ ${time}</span>
        </div>
      </div>
    </div>
    <div class="post-body">${escapeHTML(post.text).replace(/\n/g,'<br>')}</div>
  `;
  if (prepend) { feed.insertBefore(card, feed.firstChild); }
  else { feed.appendChild(card); }
}

// ---- CHAR COUNT ----
function updateCharCount() {
  const input = document.getElementById('post-input');
  const count = document.getElementById('post-char');
  if (input && count) count.textContent = `${input.value.length}/১০০০`;
}
window.updateCharCount = updateCharCount;

// ---- ADMIN ----
function addAdminButton() {
  const nav = document.querySelector('.sidebar-nav');
  if (document.getElementById('admin-btn')) return;
  const btn = document.createElement('button');
  btn.className = 'nav-item';
  btn.id = 'admin-btn';
  btn.style.color = '#f87171';
  btn.innerHTML = '<span class="nav-icon">🛡️</span><span>Admin Panel</span>';
  btn.onclick = openAdmin;
  nav.appendChild(btn);
}

window.openAdmin = async function() {
  document.getElementById('admin-panel').classList.remove('hidden');
  loadAdminData();
};

window.closeAdmin = function() {
  document.getElementById('admin-panel').classList.add('hidden');
};

async function loadAdminData() {
  // Users
  const usersSnap = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js")
    .then(({ getDocs, collection: col }) => getDocs(col(db, 'users')));
  const usersDiv = document.getElementById('admin-users');
  usersDiv.innerHTML = '';
  usersSnap.forEach(d => {
    const u = d.data();
    const item = document.createElement('div');
    item.className = 'admin-item';
    item.innerHTML = `
      <div class="item-name">${escapeHTML(u.username)} ${u.blocked ? '<span class="blocked-tag">BLOCKED</span>' : ''}</div>
      <div class="item-info">UI: ${u.uid} | ${u.email}</div>
      <div class="item-actions">
        <button class="btn-block" onclick="toggleBlock('${d.id}', ${u.blocked})">${u.blocked ? 'Unblock' : 'Block'}</button>
      </div>
    `;
    usersDiv.appendChild(item);
  });

  // Filter logs
  const { getDocs: gd2, collection: col2, orderBy: ob2, query: q2 } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
  const logsSnap = await gd2(q2(col2(db, 'filter_logs'), ob2('time', 'desc')));
  const logsDiv = document.getElementById('admin-logs');
  logsDiv.innerHTML = '';
  if (logsSnap.empty) { logsDiv.innerHTML = '<div class="system-msg">কোনো log নেই</div>'; }
  logsSnap.forEach(d => {
    const l = d.data();
    const item = document.createElement('div');
    item.className = 'admin-item';
    item.innerHTML = `<div class="item-name">${escapeHTML(l.userName)}</div><div class="item-info">নিষিদ্ধ শব্দ: "${escapeHTML(l.word)}"</div>`;
    logsDiv.appendChild(item);
  });

  // Chats
  const { getDocs: gd3, collection: col3, orderBy: ob3, query: q3 } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
  const chatsSnap = await gd3(q3(col3(db, 'messages'), ob3('time', 'desc')));
  const chatsDiv = document.getElementById('admin-chats');
  chatsDiv.innerHTML = '';
  chatsSnap.forEach(d => {
    const m = d.data();
    const item = document.createElement('div');
    item.className = 'admin-item';
    item.innerHTML = `
      <div class="item-name">${escapeHTML(m.name)}</div>
      <div class="item-info">${escapeHTML(m.text)}</div>
      <div class="item-actions"><button class="btn-delete" onclick="deleteMessage('${d.id}')">Delete</button></div>
    `;
    chatsDiv.appendChild(item);
  });

  // Posts
  const { getDocs: gd4, collection: col4, orderBy: ob4, query: q4 } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
  const postsSnap = await gd4(q4(col4(db, 'posts'), ob4('time', 'desc')));
  const postsDiv = document.getElementById('admin-posts');
  postsDiv.innerHTML = '';
  postsSnap.forEach(d => {
    const p = d.data();
    const item = document.createElement('div');
    item.className = 'admin-item';
    item.innerHTML = `
      <div class="item-name">${escapeHTML(p.name)}</div>
      <div class="item-info">${escapeHTML(p.text)}</div>
      <div class="item-actions"><button class="btn-delete" onclick="deletePost('${d.id}')">Delete</button></div>
    `;
    postsDiv.appendChild(item);
  });
}

window.toggleBlock = async function(docId, isBlocked) {
  const userRef = doc(db, 'users', docId);
  await updateDoc(userRef, { blocked: !isBlocked });
  alert(!isBlocked ? 'User blocked!' : 'User unblocked!');
  loadAdminData();
};

window.deleteMessage = async function(id) {
  if (!confirm('এই message delete করবেন?')) return;
  await deleteDoc(doc(db, 'messages', id));
  loadAdminData();
};

window.deletePost = async function(id) {
  if (!confirm('এই post delete করবেন?')) return;
  await deleteDoc(doc(db, 'posts', id));
  loadAdminData();
};

// ---- ESCAPE HTML ----
function escapeHTML(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

// ---- EVENT LISTENERS ----
document.addEventListener('DOMContentLoaded', () => {
  const postInput = document.getElementById('post-input');
  if (postInput) {
    postInput.addEventListener('input', updateCharCount);
    postInput.addEventListener('keydown', e => { if (e.ctrlKey && e.key === 'Enter') createPost(); });
  }
  const unInput = document.getElementById('username-input');
  if (unInput) unInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveUsername(); });
});
