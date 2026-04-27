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

let cooldowns = JSON.parse(localStorage.getItem("cooldowns")) || { heal: 0, double: 0 };
let buffs = JSON.parse(localStorage.getItem("buffs")) || { doubleDamage: false };

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

// --- CORE HELPERS ---
function getEnemyMaxHP(lvl) {
    let baseHP = 100 + (lvl * 5);
    return (lvl % 10 === 0) ? baseHP * 3 : baseHP; 
}

let p1HP = upgrades.hp;
let p2HP = getEnemyMaxHP(level);

// --- COMBAT JUICE ---
function createDamagePop(value, targetId, color = '#ef4444', isCrit = false) {
    const target = document.getElementById(targetId);
    if (!target) return;

    const parent = target.parentElement;
    parent.style.position = 'relative';

    const pop = document.createElement('div');
    pop.className = 'damage-pop';
    
    if (isCrit) pop.classList.add('crit-text');
    
    pop.textContent = (typeof value === 'number') ? `-${value}` : value;
    pop.style.color = color;
    
    const offsetX = (Math.random() - 0.5) * 40;
    pop.style.left = `calc(50% - 10px + ${offsetX}px)`;
    pop.style.top = `20px`;

    parent.appendChild(pop);
    setTimeout(() => pop.remove(), 800);
}

function triggerBossFlash() {
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.top = '0'; flash.style.left = '0';
    flash.style.width = '100vw'; flash.style.height = '100vh';
    flash.style.zIndex = '9999';
    flash.style.pointerEvents = 'none';
    flash.style.animation = 'flashScreen 1s ease-out forwards';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 1000);
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

function useSkill(type) {
    if (type === 'heal' && cooldowns.heal === 0 && coins >= 50) {
        if (p1HP >= upgrades.hp) return; 
        coins -= 50;
        let healAmount = Math.floor(upgrades.hp * 0.3); 
        p1HP = Math.min(upgrades.hp, p1HP + healAmount);
        cooldowns.heal = 3; 
        createDamagePop("+HP", 'p1-img', '#4ade80'); 
        if(!isMuted) sounds.win.play().catch(() => {}); 
    } 
    else if (type === 'double' && cooldowns.double === 0 && coins >= 100) {
        coins -= 100;
        buffs.doubleDamage = true;
        cooldowns.double = 3; 
        if(!isMuted) sounds.pulse.play().catch(() => {}); 
    }
    updateUI();
}

function rollDice() {
    const diceElements = document.querySelectorAll('.dice-img');
    diceElements.forEach(d => d.classList.add('shake'));
    setTimeout(() => diceElements.forEach(d => d.classList.remove('shake')), 400);

    if (cooldowns.heal > 0) cooldowns.heal--;
    if (cooldowns.double > 0) cooldowns.double--;

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;

    let prefix = (activeSkin === 'neon') ? 'neon-' : '';
    document.getElementById("p1-img").src = `assets/${prefix}red-${d1}.png`; 
    document.getElementById("p2-img").src = `assets/${prefix}green-${d2}.png`;
    
    if(!isMuted) {
        sounds.roll.currentTime = 0;
        sounds.roll.play().catch(() => {});
    }

    if (d1 > d2) {
        let dmg = d1 * 5;
        let isCrit = false;

        let totalCritChance = 5 + upgrades.luck; 
        
        if (Math.random() * 100 < totalCritChance) {
            isCrit = true;
            dmg *= 2; 
        }
        
        let usedDoubleSkill = false;
        if (buffs.doubleDamage) {
            dmg *= 2; 
            buffs.doubleDamage = false; 
            usedDoubleSkill = true;
        }
        
        p2HP -= dmg;
        coins += (10 * upgrades.mult);

        if (isCrit) {
            document.body.classList.add('violent-shake');
            setTimeout(() => document.body.classList.remove('violent-shake'), 500);
            createDamagePop(`CRIT! -${dmg}`, 'p2-img', '#ef4444', true);
            if(!isMuted) sounds.pulse.play().catch(() => {}); 
        } else if (usedDoubleSkill) {
            createDamagePop(`-${dmg}`, 'p2-img', '#fbbf24', false); 
        } else {
            createDamagePop(dmg, 'p2-img'); 
        }

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
        
        if (level % 10 === 0) {
            tokens += 25; 
            coins += (100 * upgrades.mult); 
        } else {
            tokens += 5; 
        }
        
        totalWins++;
        level++;
        if (level > highestLevel) highestLevel = level;
        
        if (level % 10 === 0) triggerBossFlash();

        p2HP = getEnemyMaxHP(level);
        p1HP = upgrades.hp; 
    } else if (p1HP <= 0) {
        if(!isMuted) sounds.lose.play().catch(() => {});
        p1HP = upgrades.hp;
        p2HP = getEnemyMaxHP(level);
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
        p2HP = getEnemyMaxHP(level); 
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
    
    let maxP2HP = getEnemyMaxHP(level);
    let p1Percent = Math.max(0, (p1HP / upgrades.hp * 100));
    let p2Percent = Math.max(0, (p2HP / maxP2HP * 100));
    
    document.getElementById("p1-hp").style.width = p1Percent + "%";
    const p2HpBar = document.getElementById("p2-hp");
    p2HpBar.style.width = p2Percent + "%";
    
    let isBoss = (level % 10 === 0);
    document.body.classList.toggle('boss-mode', isBoss);
    
    let currentEnemy = [...enemies].reverse().find(e => level >= e.minLvl) || enemies[0];
    
    document.body.classList.remove('env-forest', 'env-dungeon', 'env-badlands', 'env-void', 'env-volcano');
    
    if (currentEnemy.name === "Slime" || currentEnemy.name === "Goblin") {
        document.body.classList.add('env-forest');
    } else if (currentEnemy.name === "Skeleton") {
        document.body.classList.add('env-dungeon');
    } else if (currentEnemy.name === "Orc Warrior") {
        document.body.classList.add('env-badlands');
    } else if (currentEnemy.name === "Void Wraith") {
        document.body.classList.add('env-void');
    } else if (currentEnemy.name === "DRAGON") {
        document.body.classList.add('env-volcano');
    }

    const eName = document.getElementById("enemy-name");
    if(eName) {
        if (isBoss) {
            eName.innerHTML = `👑 BOSS: ${currentEnemy.name} 👑`;
            eName.classList.add('boss-name');
            p2HpBar.classList.add('boss-hp-bar');
            eName.style.color = "#ef4444"; 
        } else {
            eName.textContent = currentEnemy.name;
            eName.classList.remove('boss-name');
            p2HpBar.classList.remove('boss-hp-bar');
            eName.style.color = currentEnemy.color; 
        }
    }

    const healBtn = document.getElementById('skill-heal');
    const doubleBtn = document.getElementById('skill-double');

    if (healBtn) {
        if (cooldowns.heal > 0) {
            healBtn.disabled = true;
            healBtn.innerHTML = `⏳ CD: ${cooldowns.heal}`;
        } else {
            healBtn.disabled = (coins < 50 || p1HP >= upgrades.hp);
            healBtn.innerHTML = `💚 HEAL<br><span class="skill-cost">50 💰</span>`;
        }
    }

    if (doubleBtn) {
        if (buffs.doubleDamage) {
            doubleBtn.classList.add('active-buff');
            doubleBtn.innerHTML = `🔥 ACTIVE`;
            doubleBtn.disabled = true;
        } else if (cooldowns.double > 0) {
            doubleBtn.classList.remove('active-buff');
            doubleBtn.disabled = true;
            doubleBtn.innerHTML = `⏳ CD: ${cooldowns.double}`;
        } else {
            doubleBtn.classList.remove('active-buff');
            doubleBtn.disabled = (coins < 100);
            doubleBtn.innerHTML = `⚔️ 2X DMG<br><span class="skill-cost">100 💰</span>`;
        }
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
    localStorage.setItem("cooldowns", JSON.stringify(cooldowns));
    localStorage.setItem("buffs", JSON.stringify(buffs));
}

document.getElementById("volume-slider").value = 0.5;
adjustVolume();
updateUI();
