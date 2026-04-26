// --- ELITE GAME STATE ---
let coins = Number(localStorage.getItem("coins")) || 0;
let tokens = Number(localStorage.getItem("tokens")) || 0;
let level = Number(localStorage.getItem("level")) || 1;
let totalWins = Number(localStorage.getItem("totalWins")) || 0;
let highestLevel = Number(localStorage.getItem("highestLevel")) || 1;
let prestigeCount = Number(localStorage.getItem("prestigeCount")) || 0;

let upgrades = JSON.parse(localStorage.getItem("upgrades")) || { hp: 100, luck: 0, mult: 1 };
let p1HP = upgrades.hp;
let p2HP = 100 + (level * 5);
let isMuted = localStorage.getItem("gameMuted") === "true";

// --- AUDIO (IN ROOT FOLDER) ---
const sounds = {
    roll: new Audio('dice_roll.mp3'),
    win: new Audio('win_ding.mp3'),
    lose: new Audio('lose_thud.mp3'),
    pulse: new Audio('pulse.mp3'),
    heartbeat: new Audio('heartbeat.mp3')
};

// --- NAVIGATION ---
function showTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    // Show selected tab
    document.getElementById(`tab-${tabId}`).classList.add('active');
    
    // Manage Nav and Wallet visibility
    if(tabId === 'home') {
        document.getElementById('main-nav').style.display = 'none';
        document.getElementById('main-wallet').style.display = 'none';
    } else {
        document.getElementById('main-nav').style.display = 'flex';
        document.getElementById('main-wallet').style.display = 'flex';
    }
}

// --- BATTLE LOGIC ---
function unlockAudio() {
    for (let key in sounds) {
        sounds[key].play().then(() => {
            sounds[key].pause();
            sounds[key].currentTime = 0;
        }).catch(() => {});
    }
}

function rollDice() {
    unlockAudio();
    
    // Animation
    const diceElements = document.querySelectorAll('.dice-img');
    diceElements.forEach(d => d.classList.add('shake'));
    setTimeout(() => diceElements.forEach(d => d.classList.remove('shake')), 400);

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;

    // IMAGE PATHS (Must be in assets folder)
    document.getElementById("p1-img").src = `assets/red-dice-${d1}.png`;
    document.getElementById("p2-img").src = `assets/green-dice-${d2}.png`;
    
    sounds.roll.play();

    // Damage Logic
    let damageToCPU = d1;
    let isCrit = (d1 === 6 || (Math.random() * 100 < upgrades.luck));

    if (isCrit) {
        damageToCPU *= 2;
        showFloatingText("CRITICAL!", "#fbbf24");
        if ("vibrate" in navigator) navigator.vibrate([50, 30, 50]);
    }

    if (d1 > d2) {
        let totalDmg = damageToCPU * 5;
        p2HP -= totalDmg;
        coins += (10 * upgrades.mult);
        showFloatingText(`-${totalDmg} HP`, "#22c55e");
    } else if (d2 > d1) {
        p1HP -= (d2 * 5);
        document.body.classList.add('damage-flash');
        setTimeout(() => document.body.classList.remove('damage-flash'), 300);
        showFloatingText(`-${d2 * 5} HP`, "#ef4444");
        if ("vibrate" in navigator) navigator.vibrate(100);
    }

    checkBattleStatus();
    updateUI();
}

// --- SYSTEMS ---
function checkBattleStatus() {
    if (p2HP <= 0) {
        sounds.win.play();
        triggerConfetti();
        tokens += 5;
        totalWins++;
        level++;
        if (level > highestLevel) highestLevel = level;
        
        p2HP = 100 + (level * 5);
        p1HP = upgrades.hp;
        setTimeout(() => alert("VICTORY! Level Up!"), 500);
    } else if (p1HP <= 0) {
        sounds.lose.play();
        p1HP = upgrades.hp;
        p2HP = 100;
        alert("DEFEAT! Healing up for next round.");
    }
}

function buyPermanent(type) {
    if (type === 'hp' && tokens >= 10) {
        tokens -= 10;
        upgrades.hp += 20;
        p1HP = upgrades.hp;
        showFloatingText("+20 MAX HP", "#22c55e");
    } else if (type === 'luck' && tokens >= 25) {
        tokens -= 25;
        upgrades.luck += 5;
        showFloatingText("+5% LUCK", "#fbbf24");
    } else {
        alert("Not enough Tokens! Win battles to earn more.");
    }
    updateUI();
}

function handlePrestige() {
    if (level < 50) return alert("Must reach Level 50 to Prestige!");
    prestigeCount++;
    level = 1;
    upgrades.mult += 0.5;
    coins = 0;
    triggerConfetti();
    if ("vibrate" in navigator) navigator.vibrate([100, 50, 100, 50, 100]);
    saveData();
    updateUI();
    alert("PRESTIGE COMPLETE! Your earnings are now boosted.");
}

// --- VISUALS & AUDIO SETTINGS ---
function triggerConfetti() {
    const colors = ['#fbbf24', '#ef4444', '#22c55e', '#a855f7', '#3b82f6'];
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.width = Math.random() * 8 + 5 + 'px';
        confetti.style.height = confetti.style.width;
        confetti.style.animationDelay = Math.random() * 2 + 's';
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 5000);
    }
}

function showFloatingText(txt, clr) {
    const div = document.createElement("div");
    div.className = "floating-text";
    div.style.color = clr;
    div.style.left = "50%";
    div.style.top = "40%";
    div.style.transform = "translate(-50%, -50%)";
    div.textContent = txt;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 800);
}

function adjustVolume() {
    const vol = document.getElementById("volume-slider").value;
    for (let key in sounds) { sounds[key].volume = vol; }
    document.getElementById("vol-label").innerText = `Volume: ${Math.round(vol * 100)}%`;
    localStorage.setItem("gameVolume", vol);
}

function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem("gameMuted", isMuted);
    applyMuteState();
    if (!isMuted) playPulse();
}

function applyMuteState() {
    for (let key in sounds) { sounds[key].muted = isMuted; }
    const btn = document.getElementById("mute-btn");
    const icon = document.getElementById("mute-icon");
    const text = document.getElementById("mute-text");
    
    if (isMuted) {
        icon.innerText = "🔇";
        text.innerText = "Muted";
        btn.classList.add("is-muted");
    } else {
        icon.innerText = "🔊";
        text.innerText = "Sound On";
        btn.classList.remove("is-muted");
    }
}

function playPulse() {
    sounds.pulse.currentTime = 0;
    sounds.pulse.play().catch(() => {});
}

// --- DATA MANAGEMENT ---
function updateUI() {
    document.getElementById("coins-game").textContent = Math.floor(coins).toLocaleString();
    document.getElementById("tokens-game").textContent = tokens.toLocaleString();
    document.getElementById("lvl-num").textContent = level;
    
    document.getElementById("p1-hp").style.width = (p1HP / upgrades.hp * 100) + "%";
    document.getElementById("p2-hp").style.width = (p2HP / (100 + (level * 5)) * 100) + "%";
    
    document.getElementById("best-run").textContent = highestLevel;
    document.getElementById("total-wins").textContent = totalWins;
    document.getElementById("prestige-star").textContent = prestigeCount > 0 ? "⭐".repeat(prestigeCount) : "";

    if (p1HP < (upgrades.hp * 0.3) && p1HP > 0) {
        sounds.heartbeat.play().catch(() => {});
    } else {
        sounds.heartbeat.pause();
    }

    saveData();
}

function saveData() {
    localStorage.setItem("coins", coins);
    localStorage.setItem("tokens", tokens);
    localStorage.setItem("level", level);
    localStorage.setItem("upgrades", JSON.stringify(upgrades));
    localStorage.setItem("totalWins", totalWins);
    localStorage.setItem("highestLevel", highestLevel);
    localStorage.setItem("prestigeCount", prestigeCount);
}

// Boot sequence
window.onload = () => {
    showTab('home'); // Ensure only home shows on load
    const savedVol = localStorage.getItem("gameVolume") || 0.5;
    document.getElementById("volume-slider").value = savedVol;
    adjustVolume();
    applyMuteState();
    updateUI();
};
