// --- PWA SERVICE WORKER REGISTRATION ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(err => console.log('SW Failed:', err));
    });
}

// --- GAME STATE & NAN FIX ---
let coins = 1500000(localStorage.getItem("coins"));
if (isNaN(coins) || coins === nun) coins = 10000; // Bug fix + Apology compensation!

let tokens = Number(localStorage.getItem("tokens")) || 0;
let level = Number(localStorage.getItem("level")) || 1;
let totalWins = Number(localStorage.getItem("totalWins")) || 0;
let highestLevel = Number(localStorage.getItem("highestLevel")) || 1;
let prestigeCount = Number(localStorage.getItem("prestigeCount")) || 0;

// Safe Upgrades Load (Prevents NaN bugs)
let savedUpgrades = JSON.parse(localStorage.getItem("upgrades")) || {};
let upgrades = {
    hp: savedUpgrades.hp || 100,
    luck: savedUpgrades.luck || 0,
    mult: savedUpgrades.mult || 1
};

let ownedSkins = JSON.parse(localStorage.getItem("ownedSkins")) || ['classic'];
let activeSkin = localStorage.getItem("activeSkin") || 'classic';

let cooldowns = JSON.parse(localStorage.getItem("cooldowns")) || { heal: 0, double: 0 };
let buffs = JSON.parse(localStorage.getItem("buffs")) || { doubleDamage: false };

let isMuted = localStorage.getItem("gameMuted") === "true";

// --- SKIN DATABASE ---
// Matches your exact asset naming convention
const skinData = {
    classic: { prefixP1: '', prefixP2: '' },
    neon: { prefixP1: 'neon-', prefixP2: 'neon-' },
    forged: { prefixP1: 'steel-', prefixP2: 'steel-' },
    void: { prefixP1: 'void-', prefixP2: 'void-' },
    magma: { prefixP1: 'magma-', prefixP2: 'cold-' }, // Special: Magma Red & Cold Green
    silver: { prefixP1: 'silver-', prefixP2: 'silver-' },
    gold: { prefixP1: 'gold-', prefixP2: 'gold-' },
    mythic: { prefixP1: 'cosmos-', prefixP2: 'cosmos-' }
};

// --- DAILY REWARD STATE ---
let lastLoginDate = localStorage.getItem("lastLoginDate") || "";
let loginStreak = Number(localStorage.getItem("loginStreak")) || 0;
let pendingReward = null;

const dailyRewards = [
    { type: 'coins', amount: 100, text: "100 💰" },
    { type: 'coins', amount: 250, text: "250 💰" },
    { type: 'coins', amount: 500, text: "500 💰" },
    { type: 'tokens', amount: 5, text: "5 💎" },
    { type: 'tokens', amount: 10, text: "10 💎" },
    { type: 'tokens', amount: 15, text: "15 💎" },
    { type: 'tokens', amount: 25, text: "25 💎" } 
];

// --- ACHIEVEMENT TRACKING ---
let stats = JSON.parse(localStorage.getItem("stats")) || { bossesDefeated: 0, critsLanded: 0 };
let achievements = JSON.parse(localStorage.getItem("achievements")) || {
    firstBlood: false, giantSlayer: false, highRoller: false, maxLevel: false
};

const achievementData = [
    { id: 'firstBlood', icon: '🩸', title: 'First Blood', desc: 'Win your first battle.', max: 1, getProgress: () => totalWins },
    { id: 'giantSlayer', icon: '🐉', title: 'Giant Slayer', desc: 'Defeat 5 Bosses.', max: 5, getProgress: () => stats.bossesDefeated },
    { id: 'highRoller', icon: '🎲', title: 'High Roller', desc: 'Land 50 Critical Hits.', max: 50, getProgress: () => stats.critsLanded },
    { id: 'maxLevel', icon: '⭐', title: 'Prestige Ready', desc: 'Reach Level 50.', max: 50, getProgress: () => level }
];

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
    flash.style.position = 'fixed'; flash.style.top = '0'; flash.style.left = '0';
    flash.style.width = '100vw'; flash.style.height = '100vh';
    flash.style.zIndex = '9999'; flash.style.pointerEvents = 'none';
    flash.style.animation = 'flashScreen 1s ease-out forwards';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 1000);
}

// --- DAILY REWARDS LOGIC ---
function checkDailyReward() {
    const today = new Date().toDateString(); 
    if (lastLoginDate !== today) {
        let tempStreak = loginStreak;
        let yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastLoginDate !== yesterday.toDateString() && lastLoginDate !== "") tempStreak = 0; 
        
        tempStreak++;
        if (tempStreak > 7) tempStreak = 1; 
        
        pendingReward = dailyRewards[tempStreak - 1];
        document.getElementById('streak-day').textContent = tempStreak;
        document.getElementById('reward-amount').textContent = `+${pendingReward.text}`;
        document.getElementById('daily-reward-modal').style.display = 'flex';
    }
}

function claimDailyReward() {
    const today = new Date().toDateString();
    let yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (lastLoginDate !== yesterday.toDateString() && lastLoginDate !== "") loginStreak = 0; 
    
    loginStreak++;
    if (loginStreak > 7) loginStreak = 1;

    if (pendingReward.type === 'coins') coins += pendingReward.amount;
    if (pendingReward.type === 'tokens') tokens += pendingReward.amount;

    lastLoginDate = today;
    document.getElementById('daily-reward-modal').style.display = 'none';
    if(!isMuted) sounds.win.play().catch(() => {});
    updateUI();
}

// --- ACHIEVEMENT LOGIC ---
function checkAchievements() {
    let newlyUnlocked = false;
    achievementData.forEach(ach => {
        if (!achievements[ach.id]) { 
            if (ach.getProgress() >= ach.max) {
                achievements[ach.id] = true;
                newlyUnlocked = true;
                createDamagePop("🏆 BADGE UNLOCKED!", 'p1-img', '#fbbf24', true);
            }
        }
    });
    if (newlyUnlocked) updateUI();
}

// --- SIMULATED AD LOGIC ---
let adInterval;
function showAd() {
    document.getElementById('ad-modal').style.display = 'flex';
    document.getElementById('ad-close-btn').style.display = 'none';
    
    let timeLeft = 5; 
    const timerEl = document.getElementById('ad-timer');
    timerEl.textContent = timeLeft;
    timerEl.style.color = '#ef4444'; 
    timerEl.style.textShadow = '0 0 20px rgba(239, 68, 68, 0.5)';

    adInterval = setInterval(() => {
        timeLeft--;
        timerEl.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(adInterval);
            timerEl.textContent = "DONE";
            timerEl.style.color = '#4ade80'; 
            timerEl.style.textShadow = '0 0 20px rgba(74, 222, 128, 0.5)';
            document.getElementById('ad-close-btn').style.display = 'block';
            if(!isMuted) sounds.win.play().catch(() => {});
        }
    }, 1000); 
}

function closeAd() {
    document.getElementById('ad-modal').style.display = 'none';
    tokens += 5; 
    if(!isMuted) sounds.pulse.play().catch(() => {});
    alert("Ad complete! You earned 5 💎 Tokens.");
    updateUI();
}

// --- CORE FUNCTIONS ---
function startGame() {
    showTab('arena');
    if (!isMuted) {
        sounds.pulse.play().catch(() => {});
        sounds.bgm.play().catch(() => {});
    }
    setTimeout(checkDailyReward, 500); 
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    
    const nav = document.getElementById('main-nav');
    const wallet = document.getElementById('main-wallet');
    
    if(tabId === 'home') {
        nav.style.display = 'none'; wallet.style.display = 'none';
    } else {
        nav.style.display = 'flex'; wallet.style.display = 'flex';
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

    // Use the new Skin Database mapping
    let currentSkin = skinData[activeSkin] || skinData['classic'];
    document.getElementById("p1-img").src = `assets/${currentSkin.prefixP1}red-${d1}.png`; 
    document.getElementById("p2-img").src = `assets/${currentSkin.prefixP2}green-${d2}.png`;
    
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
            stats.critsLanded++; 
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
    checkAchievements();
    updateUI();
}

function checkBattleStatus() {
    if (p2HP <= 0) {
        if(!isMuted) sounds.win.play().catch(() => {});
        
        if (level % 10 === 0) {
            tokens += 25; 
            coins += (100 * upgrades.mult); 
            stats.bossesDefeated++; 
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
        prestigeCount++; level = 1; coins = 0;
        p2HP = getEnemyMaxHP(level); p1HP = upgrades.hp;
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
    
    if (currentEnemy.name === "Slime" || currentEnemy.name === "Goblin") document.body.classList.add('env-forest');
    else if (currentEnemy.name === "Skeleton") document.body.classList.add('env-dungeon');
    else if (currentEnemy.name === "Orc Warrior") document.body.classList.add('env-badlands');
    else if (currentEnemy.name === "Void Wraith") document.body.classList.add('env-void');
    else if (currentEnemy.name === "DRAGON") document.body.classList.add('env-volcano');

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
        if (cooldowns.heal > 0) { healBtn.disabled = true; healBtn.innerHTML = `⏳ CD: ${cooldowns.heal}`; } 
        else { healBtn.disabled = (coins < 50 || p1HP >= upgrades.hp); healBtn.innerHTML = `💚 HEAL<br><span class="skill-cost">50 💰</span>`; }
    }

    if (doubleBtn) {
        if (buffs.doubleDamage) { doubleBtn.classList.add('active-buff'); doubleBtn.innerHTML = `🔥 ACTIVE`; doubleBtn.disabled = true; } 
        else if (cooldowns.double > 0) { doubleBtn.classList.remove('active-buff'); doubleBtn.disabled = true; doubleBtn.innerHTML = `⏳ CD: ${cooldowns.double}`; } 
        else { doubleBtn.classList.remove('active-buff'); doubleBtn.disabled = (coins < 100); doubleBtn.innerHTML = `⚔️ 2X DMG<br><span class="skill-cost">100 💰</span>`; }
    }

    // Fixed Skin UI Logic
    document.querySelectorAll('.skin-btn').forEach(btn => {
        const sid = btn.id.replace('skin-', '');
        if (ownedSkins.includes(sid)) {
            btn.textContent = (activeSkin === sid) ? "EQUIPPED" : "SELECT";
            btn.classList.add('owned');
        } else {
            const originalText = {
                'classic': 'CLASSIC', 'neon': 'NEON (5k 💰)', 'forged': 'FORGED (10k 💰)',
                'void': 'VOID (25k 💰)', 'magma': 'MAGMA & ICE (50k 💰)', 'silver': 'ROYAL SILVER (100k 💰)',
                'gold': 'ROYAL GOLD (500k 💰)', 'mythic': 'MYTHIC (1M 💰)'
            };
            btn.textContent = originalText[sid];
            btn.classList.remove('owned');
        }
    });

    const achContainer = document.getElementById('achievements-container');
    if (achContainer) {
        achContainer.innerHTML = ''; 
        achievementData.forEach(ach => {
            let isUnlocked = achievements[ach.id];
            let progress = Math.min(ach.getProgress(), ach.max);
            let div = document.createElement('div');
            div.className = `achievement-card ${isUnlocked ? 'unlocked' : ''}`;
            div.innerHTML = `
                <div class="ach-icon">${isUnlocked ? ach.icon : '🔒'}</div>
                <div class="ach-info"><p class="ach-title">${ach.title}</p><p class="ach-desc">${ach.desc}</p></div>
                <div class="ach-progress">${isUnlocked ? 'DONE' : progress + '/' + ach.max}</div>`;
            achContainer.appendChild(div);
        });
    }

    document.getElementById("best-run").textContent = highestLevel;
    document.getElementById("total-wins").textContent = totalWins;
    document.getElementById("prestige-star").textContent = "⭐".repeat(prestigeCount);
    document.getElementById("mute-btn").textContent = isMuted ? "🔇 Muted" : "🔊 Sound On";
    
    saveData();
}

function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem("gameMuted", isMuted);
    if(isMuted) sounds.bgm.pause();
    else if (document.getElementById('tab-home').classList.contains('active') === false) sounds.bgm.play().catch(() => {});
    updateUI();
}

function adjustVolume() {
    const vol = document.getElementById("volume-slider").value;
    for (let s in sounds) sounds[s].volume = (s === 'bgm') ? vol * 0.4 : vol;
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
    localStorage.setItem("lastLoginDate", lastLoginDate);
    localStorage.setItem("loginStreak", loginStreak);
    localStorage.setItem("stats", JSON.stringify(stats));
    localStorage.setItem("achievements", JSON.stringify(achievements));
}

document.getElementById("volume-slider").value = 0.5;
adjustVolume();
updateUI();
