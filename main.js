// --- PWA SERVICE WORKER REGISTRATION ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker Registered successfully!'))
            .catch(err => console.log('Service Worker Registration Failed:', err));
    });
}

// --- GAME STATE ---
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

// --- AUDIO SYSTEM ---
const sounds = {
    roll: new Audio('dice_roll.mp3'),
    win: new Audio('win_ding.mp3'),
    lose: new Audio('lose_thud.mp3'),
    pulse: new Audio('pulse.mp3'),
    heartbeat: new Audio('heartbeat.mp3'),
    bgm: new Audio('ambient_synth.mp3')
};
sounds.bgm.loop = true;
sounds.bgm.volume = 0.4;

// --- BESTIARY ---
const enemies = [
    { name: "Slime", minLvl: 1, color: "#22c55e" },
    { name: "Goblin", minLvl: 5, color: "#4ade80" },
    { name: "Skeleton", minLvl: 15, color: "#cbd5e1" },
    { name: "Orc Warrior", minLvl: 30, color: "#fb923c" },
    { name: "Void Wraith", minLvl: 45, color: "#a855f7" },
    { name: "DRAGON", minLvl: 60, color: "#ef4444" }
];

// --- COMBAT JUICE ---
function createDamagePop(damage, targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;

    const parent = target.parentElement;
    parent.style.position = 'relative';

    const pop = document.createElement('div');
    pop.className = 'damage-pop';
    pop.textContent = -${damage};
    
    const offsetX = (Math.random() - 0.5) * 40;
    pop.style.left = calc(50% - 10px + ${offsetX}px);
    pop.style.top = 20px;

    parent.appendChild(pop);

    setTimeout(() => pop.remove(), 800);
}

// --- CORE FUNCTIONS ---
function startGame() {
    showTab('arena');
    if (!isMuted) {
        sounds.pulse.play().catch(e => console.log("Audio play blocked:", e));
        sounds.bgm.play().catch(e => console.log("BGM play blocked:", e));
    }
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(tab-${tabId}).classList.add('active');
    
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

function rollDice() {
    const diceElements = document.querySelectorAll('.dice-img');
    diceElements.forEach(d => d.classList.add('shake'));
    setTimeout(() => diceElements.forEach(d => d.classList.remove('shake')), 400);

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;

    let prefix = (activeSkin === 'neon') ? 'neon-' : '';
    // Making sure the player uses the correct skin and enemy uses green
    document.getElementById("p1-img").src = assets/${prefix}green-${d1}.png; 
    document.getElementById("p2-img").src = assets/green-${d2}.png;
    
    if(!isMuted) {
        sounds.roll.currentTime = 0;
        sounds.roll.play().catch(() => {});
    }
    if (d1 > d2) {
        let dmg = d1 * 5;
        p2HP -= dmg;
        coins += (10 * upgrades.mult);
        createDamagePop(dmg, 'p2-img'); 
    } else if (d2 > d1) {
        let dmg = d2 * 5;
        p1HP -= dmg;
        createDamagePop(dmg, 'p1-img'); 
        
        if(p1HP < 30 && p1HP > 0 && !isMuted) {
            sounds.heartbeat.currentTime = 0;
            sounds.heartbeat.play().catch(() => {});
        }
    }

    checkBattleStatus();
    updateUI();
}

function checkBattleStatus() {
    if (p2HP <= 0) {
        if(!isMuted) sounds.win.play().catch(() => {});
        tokens += 5;
        totalWins++;
        level++;
        if (level > highestLevel) highestLevel = level;
        p2HP = 100 + (level * 5);
        p1HP = upgrades.hp; 
    } else if (p1HP <= 0) {
        if(!isMuted) sounds.lose.play().catch(() => {});
        p1HP = upgrades.hp;
        p2HP = 100 + (level * 5);
    }
}

function buySkin(skinName, cost) {
    if (ownedSkins.includes(skinName)) {
        activeSkin = skinName;
    } else if (coins >= cost) {
        coins -= cost;
        ownedSkins.push(skinName);
        activeSkin = skinName;
    }
    updateUI();
}

function buyPermanent(type) {
    let cost = (type === 'hp') ? 10 : 25;
    if (tokens >= cost) {
        tokens -= cost;
        if (type === 'hp') { upgrades.hp += 20; p1HP = upgrades.hp; }
        else { upgrades.luck += 5; }
    }
    updateUI();
}

function handlePrestige() {
    if (level >= 50) {
        prestigeCount++;
        level = 1;
        coins = 0;
        p2HP = 100 + (level * 5);
        p1HP = upgrades.hp;
        updateUI();
        alert("PRESTIGE ACTIVATED! You have restarted at Level 1 with a new Prestige Star.");
    } else {
        alert("You must reach Level 50 to Prestige!");
    }
}

function updateUI() {
    document.getElementById("coins-game").textContent = Math.floor(coins).toLocaleString();
    document.getElementById("tokens-game").textContent = tokens;
    document.getElementById("lvl-num").textContent = level;
    
    let p1Percent = Math.max(0, (p1HP / upgrades.hp * 100));
    let p2Percent = Math.max(0, (p2HP / (100 + (level * 5)) * 100));
    
    document.getElementById("p1-hp").style.width = p1Percent + "%";
    document.getElementById("p2-hp").style.width = p2Percent + "%";
    
    let currentEnemy = [...enemies].reverse().find(e => level >= e.minLvl) || enemies[0];
    const eName = document.getElementById("enemy-name");
    if(eName) {
        eName.textContent = currentEnemy.name;
        eName.style.color = currentEnemy.color;
    }

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
    document.getElementById("mute-btn").textContent = isMuted ? "🔇 Muted" : "🔊 Sound On";
    
    saveData();
}

function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem("gameMuted", isMuted);
    if(isMuted) {
        sounds.bgm.pause();
    } else {
        if (document.getElementById('tab-home').classList.contains('active') === false) {
             sounds.bgm.play().catch(() => {});
        }
    }
    updateUI();
}

function adjustVolume() {
    const vol = document.getElementById("volume-slider").value;
    for (let s in sounds) {
        if(s === 'bgm') {
            sounds[s].volume = vol * 0.4; 
        } else {
            sounds[s].volume = vol;
        }
    }
}

function saveData() {
    localStorage.setItem("coins", coins);
    localStorage.setItem("tokens", tokens);
    localStorage.setItem("level", level);
    localStorage.setItem("totalWins", totalWins);
    localStorage.setItem("highestLevel", highestLevel);
    localStorage.setItem("prestigeCount", prestigeCount);
    localStorage.setItem("upgrades", JSON.stringify(upgrades));
    localStorage.setItem("ownedSkins", JSON.stringify(ownedSkins));
    localStorage.setItem("activeSkin", activeSkin);
}

document.getElementById("volume-slider").value = 0.5;
adjustVolume();
updateUI();
