// Game State
let coins = Number(localStorage.getItem("coins")) || 0;
let tokens = Number(localStorage.getItem("tokens")) || 0;
let level = Number(localStorage.getItem("level")) || 1;
let totalWins = Number(localStorage.getItem("totalWins")) || 0;
let prestigeCount = Number(localStorage.getItem("prestigeCount")) || 0;

let upgrades = JSON.parse(localStorage.getItem("upgrades")) || { hp: 100, luck: 0, mult: 1 };
let p1HP = upgrades.hp;
let p2HP = 100 + (level * 5);

// Audio (Root Folder)
const sounds = {
    roll: new Audio('dice_roll.mp3'),
    win: new Audio('win_ding.mp3'),
    lose: new Audio('lose_thud.mp3'),
    pulse: new Audio('pulse.mp3'),
    heartbeat: new Audio('heartbeat.mp3')
};

// --- CORE FUNCTIONS ---

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
}

function rollDice() {
    const dice = document.querySelectorAll('.dice-img');
    dice.forEach(d => d.classList.add('shake'));
    setTimeout(() => dice.forEach(d => d.classList.remove('shake')), 400);

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;

    // Assets Path Fix
    document.getElementById("p1-img").src = `assets/red-dice-${d1}.png`;
    document.getElementById("p2-img").src = `assets/green-dice-${d2}.png`;
    
    sounds.roll.play();

    let dmgToCPU = d1;
    if (d1 === 6 || (Math.random() * 100 < upgrades.luck)) {
        dmgToCPU *= 2;
        showFloatingText("CRIT!", "#fbbf24");
        if ("vibrate" in navigator) navigator.vibrate([50, 30, 50]);
    }

    if (d1 > d2) {
        p2HP -= (dmgToCPU * 5);
        coins += (10 * upgrades.mult);
    } else if (d2 > d1) {
        p1HP -= (d2 * 5);
        document.body.classList.add('damage-flash');
        setTimeout(() => document.body.classList.remove('damage-flash'), 300);
        if ("vibrate" in navigator) navigator.vibrate(100);
    }

    checkBattle();
    updateUI();
}

function buyPermanent(type) {
    if (type === 'hp' && tokens >= 10) {
        tokens -= 10; upgrades.hp += 20; p1HP = upgrades.hp;
    } else if (type === 'luck' && tokens >= 25) {
        tokens -= 25; upgrades.luck += 5;
    }
    updateUI();
}

function checkBattle() {
    if (p2HP <= 0) {
        sounds.win.play();
        tokens += 5; level++; totalWins++;
        p2HP = 100 + (level * 5); p1HP = upgrades.hp;
    } else if (p1HP <= 0) {
        sounds.lose.play();
        p1HP = upgrades.hp; p2HP = 100;
    }
}

function updateUI() {
    document.getElementById("coins-game").textContent = Math.floor(coins);
    document.getElementById("tokens-game").textContent = tokens;
    document.getElementById("lvl-num").textContent = level;
    document.getElementById("p1-hp").style.width = (p1HP / upgrades.hp * 100) + "%";
    document.getElementById("p2-hp").style.width = (p2HP / (100 + (level * 5)) * 100) + "%";
    document.getElementById("prestige-star").textContent = "⭐".repeat(prestigeCount);
    
    // Hall of Fame
    if(document.getElementById("total-wins")) {
        document.getElementById("total-wins").textContent = totalWins;
        document.getElementById("best-run").textContent = localStorage.getItem("highestLevel") || level;
    }
    
    saveData();
}

function saveData() {
    localStorage.setItem("coins", coins);
    localStorage.setItem("tokens", tokens);
    localStorage.setItem("level", level);
    localStorage.setItem("upgrades", JSON.stringify(upgrades));
    localStorage.setItem("totalWins", totalWins);
    localStorage.setItem("prestigeCount", prestigeCount);
}

function playPulse() {
    sounds.pulse.currentTime = 0;
    sounds.pulse.play().catch(() => {});
}

// Initial Call
updateUI();
