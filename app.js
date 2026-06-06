// ===========================
//  FRIENDS CHAT — by SIFAT
//  app.js — Main Logic
// ===========================

// ---- AI FILTER: নিষিদ্ধ শব্দ ও ইমোজির তালিকা ----
const RESTRICTED = [
  // বাংলা গালি ও খারাপ শব্দ
  'গালি', 'বেআক্কেল', 'বোকা', 'গাধা', 'কুত্তা', 'কুত্তার বাচ্চা',
  'শালা', 'শালি', 'মাদার', 'বাস্টার্ড', 'বাজে',
  'হারামি', 'হারামজাদা', 'ছাগল', 'ছাগলের বাচ্চা',
  'বেশ্যা', 'মাগি', 'রান্ডি', 'খানকি',
  'মূর্খ', 'আহম্মক',
  // ইংরেজি খারাপ শব্দ
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'damn',
  'hell', 'crap', 'idiot', 'stupid', 'moron', 'dumb',
  'loser', 'retard', 'nigger', 'faggot', 'whore', 'slut',
  // নিষিদ্ধ ইমোজি
  '💩', '🖕', '🤬', '🖖🏻',
];

// ---- স্টেট ----
let currentUser = null;
let chatMessages = [];
let posts = [];

// ---- ইউটিলিটি ----
function generateUID() {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

function getTime() {
  const now = new Date();
  return now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
}

function getAvatar(name) {
  if (!name) return 'U';
  return name.charAt(0).toUpperCase();
}

// ---- AI ফিল্টার ফাংশন ----
function filterText(text) {
  const lower = text.toLowerCase();
  for (const word of RESTRICTED) {
    if (lower.includes(word.toLowerCase()) || text.includes(word)) {
      return { blocked: true, word: word };
    }
  }
  return { blocked: false };
}

// ---- সতর্কতা ব্যানার ----
function showWarning(userName, restrictedWord) {
  const banner = document.getElementById('warning-banner');
  const txt = document.getElementById('warning-text');
  txt.textContent = `⚠️ ${userName}, আপনার লেখায় "${restrictedWord}" দেওয়া নিষেধ!`;
  banner.classList.remove('hidden');
  banner.classList.remove('shake');
  // রিফ্লো ট্রিগার করে শেক অ্যানিমেশন
  void banner.offsetWidth;
  banner.classList.add('shake');
  // ৫ সেকেন্ড পর নিজে নিজে বন্ধ হবে
  clearTimeout(banner._timer);
  banner._timer = setTimeout(hideWarning, 5000);
}

function hideWarning() {
  const banner = document.getElementById('warning-banner');
  banner.classList.add('hidden');
  banner.classList.remove('shake');
}

// ---- লগইন ----
function handleLogin() {
  const input = document.getElementById('login-input').value.trim();
  if (!input) {
    alert('অনুগ্রহ করে আপনার UI নম্বর বা Gmail লিখুন।');
    return;
  }
  const uid = generateUID();
  let displayName = input;
  // Gmail থেকে নাম বের করা
  if (input.includes('@')) {
    displayName = input.split('@')[0];
    displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
  }
  loginUser(displayName, uid);
}

function handleGoogleLogin() {
  const names = ['Riya', 'Arif', 'Sadia', 'Rifat', 'Mim', 'Tanvir'];
  const randomName = names[Math.floor(Math.random() * names.length)];
  const uid = generateUID();
  loginUser(randomName + ' (Google)', uid);
}

function loginUser(name, uid) {
  currentUser = { name, uid, avatar: getAvatar(name) };
  // UI আপডেট
  document.getElementById('profile-name').textContent = name;
  document.getElementById('profile-tag').textContent = 'UI: ' + uid;
  document.getElementById('profile-avatar').textContent = getAvatar(name);
  document.getElementById('post-avatar').textContent = getAvatar(name);
  document.getElementById('post-name').textContent = name;
  // স্ক্রিন সুইচ
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  // স্বাগত মেসেজ পাঠানো
  setTimeout(() => {
    addSystemChatMsg(`${name} কমিউনিটিতে যোগ দিয়েছেন 👋`);
  }, 800);
}

// ---- লগআউট ----
function handleLogout() {
  if (!confirm('আপনি কি সত্যিই লগআউট করতে চান?')) return;
  currentUser = null;
  chatMessages = [];
  posts = [];
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('login-input').value = '';
  document.getElementById('chat-messages').innerHTML =
    '<div class="chat-day-label">আজকের চ্যাট</div>' +
    '<div class="system-msg">👋 কমিউনিটি চ্যাটে আপনাকে স্বাগতম! সুন্দর ভাষায় কথা বলুন।</div>';
  document.getElementById('post-feed').innerHTML =
    '<div class="system-msg">📝 এখনো কোনো পোস্ট নেই। প্রথম পোস্টটি আপনিই করুন!</div>';
  hideWarning();
}

// ---- ট্যাব সুইচ ----
const TAB_TITLES = {
  home: 'হোম',
  community: 'কমিউনিটি চ্যাট',
  rules: 'নিয়মাবলী',
  post: 'পোস্ট'
};

function switchTab(tab) {
  // সকল ট্যাব লুকানো
  document.querySelectorAll('.tab-content').forEach(el => {
    el.classList.add('hidden');
    el.classList.remove('active');
  });
  // সক্রিয় ট্যাব দেখানো
  const target = document.getElementById('tab-' + tab);
  target.classList.remove('hidden');
  target.classList.add('active');
  // নেভ আইটেম আপডেট
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.tab === tab) btn.classList.add('active');
  });
  // শিরোনাম আপডেট
  document.getElementById('tab-title').textContent = TAB_TITLES[tab] || tab;
  // মোবাইলে সাইডবার বন্ধ করা
  if (window.innerWidth <= 768) closeSidebar();
}

// ---- সাইডবার টগল ----
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const isOpen = sidebar.classList.contains('open');
  if (isOpen) {
    closeSidebar();
  } else {
    sidebar.classList.add('open');
    overlay.classList.remove('hidden');
  }
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.add('hidden');
}

// ---- সিস্টেম চ্যাট মেসেজ ----
function addSystemChatMsg(text) {
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'system-msg';
  div.textContent = '🔔 ' + text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// ---- মেসেজ পাঠানো (Community Chat) ----
function sendMessage() {
  if (!currentUser) return;
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  // AI ফিল্টার চেক
  const check = filterText(text);
  if (check.blocked) {
    showWarning(currentUser.name, check.word);
    input.value = '';
    return;
  }

  hideWarning();
  input.value = '';

  // মেসেজ অবজেক্ট তৈরি
  const msg = {
    id: Date.now(),
    name: currentUser.name,
    uid: currentUser.uid,
    text: text,
    time: getTime(),
    own: true
  };
  chatMessages.push(msg);
  renderChatMessage(msg);
}

function renderChatMessage(msg) {
  const container = document.getElementById('chat-messages');
  const isOwn = msg.own;

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${isOwn ? 'own' : 'other'}`;
  bubble.innerHTML = `
    <div class="bubble-header">
      <span class="bubble-name">${escapeHTML(msg.name)}</span>
      <span class="bubble-tag">UI: ${msg.uid}</span>
    </div>
    <div class="bubble-body">${escapeHTML(msg.text)}</div>
    <div class="bubble-time">${msg.time}</div>
  `;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

// ---- পোস্ট তৈরি করা ----
function createPost() {
  if (!currentUser) return;
  const input = document.getElementById('post-input');
  const text = input.value.trim();
  if (!text) return;

  // AI ফিল্টার চেক
  const check = filterText(text);
  if (check.blocked) {
    showWarning(currentUser.name, check.word);
    return;
  }

  hideWarning();
  input.value = '';
  updateCharCount();

  const post = {
    id: Date.now(),
    name: currentUser.name,
    uid: currentUser.uid,
    text: text,
    time: getTime(),
    avatar: currentUser.avatar
  };
  posts.unshift(post);
  renderPost(post);
}

function renderPost(post) {
  const feed = document.getElementById('post-feed');
  // "কোনো পোস্ট নেই" মেসেজ সরানো
  const emptyMsg = feed.querySelector('.system-msg');
  if (emptyMsg) emptyMsg.remove();

  const card = document.createElement('div');
  card.className = 'post-card';
  card.innerHTML = `
    <div class="post-header">
      <div class="post-avatar">${escapeHTML(post.avatar)}</div>
      <div class="post-user-info">
        <div class="post-user-name">${escapeHTML(post.name)}</div>
        <div class="post-meta">
          <span class="post-tag">UI: ${post.uid}</span>
          <span class="post-time">আজ ${post.time}</span>
        </div>
      </div>
    </div>
    <div class="post-body">${escapeHTML(post.text).replace(/\n/g, '<br>')}</div>
  `;
  feed.insertBefore(card, feed.firstChild);
}

// ---- ক্যারেক্টার কাউন্ট ----
function updateCharCount() {
  const input = document.getElementById('post-input');
  const count = document.getElementById('post-char');
  if (input && count) {
    count.textContent = `${input.value.length}/১০০০`;
  }
}

// ---- XSS প্রতিরোধ ----
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ---- ইভেন্ট লিসেনার ----
document.addEventListener('DOMContentLoaded', () => {
  // পোস্ট ইনপুট ক্যারেক্টার কাউন্ট
  const postInput = document.getElementById('post-input');
  if (postInput) {
    postInput.addEventListener('input', updateCharCount);
    postInput.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') createPost();
    });
  }

  // Enter key for login
  const loginInput = document.getElementById('login-input');
  if (loginInput) {
    loginInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleLogin();
    });
  }
});
