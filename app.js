// গ্লোবাল ডেমো ইউজার ডাটা
const mockUser = {
    name: "Rahat",
    uiNumber: "84729105"
};

// কাস্টম এআই এর নিষিদ্ধ লিস্ট (Bad Words & Emojis)
const aiRestrictedList = ["খারাপ", "faka", "badword", "💩", "🖕", "fool"];

// সাধারণ লগইন ফাংশন
function handleLogin() {
    const identifier = document.getElementById('login-identifier').value.trim();
    if (identifier !== "") {
        showDashboard(mockUser.name, mockUser.uiNumber);
    } else {
        alert("Please enter a valid UI Number or Gmail!");
    }
}

// গুগল লগইন ফাংশন
function handleGoogleLogin() {
    alert("Welcome! এই website এর rules গুলা আগে দেখে আসেন rules option থেকে।");
    showDashboard(mockUser.name, mockUser.uiNumber);
}

// ড্যাশবোর্ড ওপেন করার ফাংশন
function showDashboard(name, ui) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-platform').style.display = 'flex';
    document.getElementById('user-display-name').innerText = name;
    document.getElementById('user-display-ui').innerText = "UI: " + ui;
}

// লগআউট ফাংশন
function handleLogout() {
    document.getElementById('main-platform').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('login-identifier').value = "";
}

// সাইডবার মেনু ট্যাব পরিবর্তনের লজিক (Rules অপশন আনলকড)
function switchTab(tabName) {
    const buttons = document.querySelectorAll('.menu-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // active ক্লাস যোগ করা
    if (event && event.target) {
        event.target.classList.add('active');
    }

    const dashboardView = document.getElementById('dashboard-view');
    const communityView = document.getElementById('community-view');
    const rulesView = document.getElementById('rules-view');
    const title = document.getElementById('current-tab-title');

    // সব ভিউ আগে হাইড করা
    dashboardView.style.display = 'none';
    communityView.style.display = 'none';
    rulesView.style.display = 'none';

    if (tabName === 'home') {
        title.innerText = "Home Dashboard";
        dashboardView.style.display = 'block';
    } else if (tabName === 'community') {
        title.innerText = "Community Chat";
        communityView.style.display = 'flex';
    } else if (tabName === 'rules') {
        title.innerText = "Platform Rules";
        rulesView.style.display = 'flex';
    } else {
        title.innerText = tabName.toUpperCase();
        dashboardView.style.display = 'block';
        dashboardView.innerHTML = `<h3>${tabName.toUpperCase()} Feature</h3><p>এই অপশনটি লক করা আছে। রুলস অপশনের পর আমরা এটি বিল্ড করব।</p>`;
    }
}

// চ্যাট মেসেজ পাঠানোর ফাংশন (Custom AI Filter)
function sendCommunityMessage() {
    const inputField = document.getElementById('chat-message-input');
    const messageText = inputField.value.trim();
    const aiBanner = document.getElementById('ai-banner');
    const aiBannerText = document.getElementById('ai-banner-text');

    if (messageText === "") return;

    let containsBadElement = false;
    let foundElement = "";

    for (let item of aiRestrictedList) {
        if (messageText.toLowerCase().includes(item)) {
            containsBadElement = true;
            foundElement = item;
            break;
        }
    }

    if (containsBadElement) {
        aiBannerText.innerText = `${mockUser.name}, আপনার লেখায় "${foundElement}" দেওয়া নিষেধ!`;
        aiBanner.style.display = 'block'; 
        return; 
    }

    aiBanner.style.display = 'none';
    
    const chatBox = document.getElementById('chat-box');
    const messageElement = document.createElement('div');
    messageElement.classList.add('msg', 'user');
    messageElement.innerHTML = `<div class="msg-header">${mockUser.name} (UI: ${mockUser.uiNumber})</div><div>${messageText}</div>`;
    
    chatBox.appendChild(messageElement);
    inputField.value = ""; 
    chatBox.scrollTop = chatBox.scrollHeight;
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendCommunityMessage();
    }
}
