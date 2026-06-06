// ডেমো ইউজার ডাটা (পরবর্তীতে জিমেইল/ডাটাবেজ দিয়ে রিপ্লেস হবে)
const mockUser = {
    name: "Rahat",
    uiNumber: "84729105"
};

// লগইন ফাংশন
function handleLogin() {
    const identifier = document.getElementById('login-identifier').value.trim();
    
    if (identifier !== "") {
        showDashboard(mockUser.name, mockUser.uiNumber);
    } else {
        alert("Please enter a valid UI Number or Gmail!");
    }
}

// গুগল লগইন ডেমো
function handleGoogleLogin() {
    // শুরুতে নতুন ব্যানারের নিয়মের কথা বলা হয়েছে
    alert("Welcome! এই website এর rules গুলা আগে দেখে আসেন rules option থেকে।");
    showDashboard(mockUser.name, mockUser.uiNumber);
}

// ড্যাশবোর্ড স্ক্রিন অন করা
function showDashboard(name, ui) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-platform').style.style.display = 'flex';
    document.getElementById('user-display-name').innerText = name;
    document.getElementById('user-display-ui').innerText = "UI: " + ui;
}

// লগআউট ফাংশন
function handleLogout() {
    document.getElementById('main-platform').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('login-identifier').value = "";
}

// ট্যাব বা মেনু পরিবর্তন করা
function switchTab(tabName) {
    // সব মেনু বাটন থেকে active ক্লাস রিমুভ করা
    const buttons = document.querySelectorAll('.menu-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    const content = document.getElementById('dynamic-content');
    const title = document.getElementById('current-tab-title');

    if (tabName === 'home') {
        title.innerText = "Home Dashboard";
        content.innerHTML = `
            <h3>Welcome to your new platform!</h3>
            <p>প্ল্যাটফর্মের মূল কাঠামো তৈরি। পরবর্তী ধাপে আমরা এখানে কাস্টম এআই এবং অন্যান্য অপশনগুলো এক এক করে যোগ করব।</p>
        `;
    } else {
        title.innerText = tabName.toUpperCase();
        content.innerHTML = `
            <h3>${tabName.toUpperCase()} Feature</h3>
            <p>এই অপশনটি লক করা আছে। আমরা আমাদের প্ল্যান অনুযায়ী এর পরে এক এক করে এই ফিচারগুলো রিয়েল-টাইম এআই সহ বিল্ড করব।</p>
        `;
    }
}