// --- ELITE GAME STATE ---
let coins = Number(localStorage.getItem("coins")) || 0;
let tokens = Number(localStorage.getItem("tokens")) || 0;
let level = Number(localStorage.getItem("level")) || 1;
let totalWins = Number(localStorage.getItem("totalWins")) || 0;
let highestLevel = Number(localStorage.getItem("highestLevel")) || 1;
let prestigeCount = Number(localStorage.getItem("prestigeCount")) || 0;

let upgrades = JSON.parse(localStorage.getItem("upgrades")) || { hp: 100, luck: 0, mult: 1 };
let ownedSkins = JSON.parse(localStorage.getItem("ownedSkins")) || ['classic'];
let activeSkin = localStorage.getItem("activeSkin") || 'classic';

let p1HP = upgrades.hp;
let p2HP = 100 + (level * 5);
let isMuted = localStorage.getItem("gameMuted") === "true";

// --- AUDIO (IN ROOT) ---
const sounds = {
    roll: new Audio('dice_roll.mp3'),
    win: new Audio('win_ding.mp3'),
    lose: new Audio('lose_thud.mp3'),
    pulse: new Audio('pulse.mp3'),
    heartbeat: new Audio('heartbeat.mp3')
};

// --- BESTIARY ---
const enemies = [
    { name: "Slime", minLvl: 1, color: "#22c55e" },
    { name: "Goblin", minLvl: 5, color: "#4ade80" },
    { name: "Skeleton", minLvl: 15, color: "#cbd5e1" },
    { name: "Orc Warrior", minLvl: 30, color: "#fb923c" },
    { name: "Void Wraith", minLvl: 45, color: "#a855f7" },
    { name: "DRAGON KING", minLvl: 60, color: "#ef4444" }
];

// --- NAVIGATION ---
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    
    const nav = document.getElementById('main-nav');
    const wallet = document.getElementById('main-wallet');
    
    if(tabId === 'home') {
        nav.style.display = 'none';
        wallet.style.display = 'none';
    } else {
        nav.style.display = 'flex';
        wallet.style.display = 'flex';
    }
}

// --- BATTLE ENGINE ---
function rollDice() {
    for (let key in sounds) { // Unlock audio for mobile
        sounds[key].play().then(() => { sounds[key].pause(); sounds[key].currentTime = 0; }).catch(() => {});
    }
    
    const diceElements = document.querySelectorAll('.dice-img');
    diceElements.forEach(d => d.classList.add('shake'));
    setTimeout(() => diceElements.forEach(d => d.classList.remove('shake')), 400);

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;

    // PATH LOGIC FOR YOUR MANUAL NEON FILES
    let prefix = (activeSkin === 'neon') ? 'neon-' : '';
    
    document.getElementById("p1-img").src = `assets/${prefix}red-${d1}.png`;
    document.getElementById("p2-img").src = `assets/${prefix}green-${d2}.png`;
    
    sounds.roll.currentTime = 0;
    sounds.roll.play();

    let damageToCPU = d1;
    let isCrit = (d1 === 6 || (Math.random() * 100 < upgrades.luck));

    if (isCrit) {
        damageToCPU *= 2;
        showFloatingText("CRITICAL!", "#fbbf24");
        document.querySelector('.battle-arena').classList.add('crit-shake');
        setTimeout(() => document.querySelector('.battle-arena').classList.remove('crit-shake'), 400);
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

// --- SKINS & UPGRADES ---
function buySkin(skinName, cost) {
    if (ownedSkins.includes(skinName)) {
        activeSkin = skinName;
    } else if (coins >= cost) {
        coins -= cost;
        ownedSkins.push(skinName);
        activeSkin = skinName;
        triggerConfetti();
    } else {
        alert("Not enough coins!");
    }
    updateUI();
}

function buyPermanent(type) {
    let cost = (type === 'hp') ? 10 : 25;
    if (tokens >= cost) {
        tokens -= cost;
        if (type === 'hp') { upgrades.hp += 20; p1HP = upgrades.hp; }
        else { upgrades.luck += 5; }
        showFloatingText("UPGRADED!", "#fbbf24");
    } else {
        alert("Not enough tokens!");
    }
    updateUI();
}

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
    } else if (p1HP <= 0) {
        sounds.lose.play();
        p1HP = upgrades.hp;
        p2HP = 100 + (level * 5);
        alert("DEFEAT! Resting for a moment...");
    }
}

// --- UI & CORE SYSTEMS ---
function updateUI() {
    document.getElementById("coins-game").textContent = Math.floor(coins).toLocaleString();
    document.getElementById("tokens-game").textContent = tokens;
    document.getElementById("lvl-num").textContent = level;
    
    // HP Bars
    document.getElementById("p1-hp").style.width = (p1HP / upgrades.hp * 100) + "%";
    document.getElementById("p2-hp").style.width = (p2HP / (100 + (level * 5)) * 100) + "%";
    
    // Enemy Logic
    let currentEnemy = [...enemies].reverse().find(e => level >= e.minLvl);
    const eName = document.getElementById("enemy-name");
    const eBar = document.getElementById("p2-hp");
    if(eName) {
        eName.textContent = currentEnemy.name;
        eName.style.color = currentEnemy.color;
        eBar.style.backgroundColor = currentEnemy.color;
    }

    // Skin Buttons
    document.querySelectorAll('.skin-btn').forEach(btn => {
        const sid = btn.id.replace('skin-', '');
        if (ownedSkins.includes(sid)) {
            btn.textContent = (activeSkin === sid) ? "EQUIPPED" : "SELECT";
            btn.classList.add('owned');
        }
    });

    document.getElementById("best-run").textContent = highestLevel;
    document.getElementById("total-wins").textContent = totalWins;
    document.getElementById("prestige-star").textContent = "⭐".repeat(prestigeCount);

    saveData();
}

// (Keep your existing saveData, adjustVolume, toggleMute, triggerConfetti functions here)
