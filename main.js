// --- PWA SERVICE WORKER REGISTRATION ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(err => console.log('SW Failed:', err)));
}

// --- GAME STATE ---
let coins = Number(localStorage.getItem("coins"));
if (isNaN(coins) || coins === null) coins = 10000;

let tokens = Number(localStorage.getItem("tokens")) || 0;
let level = Number(localStorage.getItem("level")) || 1;
let totalWins = Number(localStorage.getItem("totalWins")) || 0;
let highestLevel = Number(localStorage.getItem("highestLevel")) || 1;
let prestigeCount = Number(localStorage.getItem("prestigeCount")) || 0;
let pastRuns = JSON.parse(localStorage.getItem("pastRuns")) || [];

let savedUpgrades = JSON.parse(localStorage.getItem("upgrades")) || {};
let upgrades = { hp: savedUpgrades.hp || 100, luck: savedUpgrades.luck || 0, mult: savedUpgrades.mult || 1 };

let ownedSkins = JSON.parse(localStorage.getItem("ownedSkins")) || ['classic'];
let activeSkin = localStorage.getItem("activeSkin") || 'classic';

let cooldowns = JSON.parse(localStorage.getItem("cooldowns")) || { heal: 0, double: 0 };
let buffs = JSON.parse(localStorage.getItem("buffs")) || { doubleDamage: false };

let isMuted = localStorage.getItem("gameMuted") === "true";

// --- SKIN DATABASE ---
const skinData = {
    classic: { id: 'classic', name: 'CLASSIC', price: 0, prefixP1: '', prefixP2: '' },
    neon: { id: 'neon', name: 'NEON', price: 5000, prefixP1: 'neon-', prefixP2: 'neon-' },
    forged: { id: 'forged', name: 'FORGED', price: 10000, prefixP1: 'steel-', prefixP2: 'steel-' },
    void: { id: 'void', name: 'VOID', price: 25000, prefixP1: 'void-', prefixP2: 'void-' },
    magma: { id: 'magma', name: 'MAGMA & ICE', price: 50000, prefixP1: 'magma-', prefixP2: 'cold-' },
    silver: { id: 'silver', name: 'ROYAL SILVER', price: 100000, prefixP1: 'silver-', prefixP2: 'silver-' },
    gold: { id: 'gold', name: 'ROYAL GOLD', price: 500000, prefixP1: 'gold-', prefixP2: 'gold-' },
    mythic: { id: 'mythic', name: 'MYTHIC', price: 1000000, prefixP1: 'cosmos-', prefixP2: 'cosmos-' }
};

// --- DAILY REWARD & AD STATE ---
let lastLoginDate = localStorage.getItem("lastLoginDate") || "";
let loginStreak = Number(localStorage.getItem("loginStreak")) || 0;
let pendingReward = null;

let dailyAdsWatched = Number(localStorage.getItem("dailyAdsWatched")) || 0;
let lastAdDate = localStorage.getItem("lastAdDate") || "";
const MAX_DAILY_ADS = 3;

const dailyRewards = [
    { type: 'coins', amount: 100, text: "100 💰" }, { type: 'coins', amount: 250, text: "250 💰" },
    { type: 'coins', amount: 500, text: "500 💰" }, { type: 'tokens', amount: 5, text: "5 💎" },
    { type: 'tokens', amount: 10, text: "10 💎" }, { type: 'tokens', amount: 15, text: "15 💎" },
    { type: 'tokens', amount: 25, text: "25 💎" } 
];

// --- ACHIEVEMENT TRACKING ---
let stats = JSON.parse(localStorage.getItem("stats")) || { bossesDefeated: 0, critsLanded: 0, missionsCompleted: 0 };
if (stats.missionsCompleted === undefined) stats.missionsCompleted = 0;

let achievements = JSON.parse(localStorage.getItem("achievements")) || {};

const achievementData = [
    { id: 'firstBlood', icon: '🩸', title: 'First Blood', desc: 'Win your first battle.', max: 1, reward: { type: 'tokens', amt: 2 }, getProgress: () => totalWins },
    { id: 'giantSlayer', icon: '🐉', title: 'Giant Slayer', desc: 'Defeat 5 Bosses.', max: 5, reward: { type: 'tokens', amt: 5 }, getProgress: () => stats.bossesDefeated },
    { id: 'highRoller', icon: '🎲', title: 'High Roller', desc: 'Land 50 Critical Hits.', max: 50, reward: { type: 'coins', amt: 2500 }, getProgress: () => stats.critsLanded },
    { id: 'maxLevel', icon: '⭐', title: 'Prestige Ready', desc: 'Reach Level 50.', max: 50, reward: { type: 'tokens', amt: 10 }, getProgress: () => level },
    { id: 'bountyHunter', icon: '📜', title: 'Bounty Hunter', desc: 'Complete 10 Active Missions.', max: 10, reward: { type: 'tokens', amt: 10 }, getProgress: () => stats.missionsCompleted },
    { id: 'mythicalStatus', icon: '🌌', title: 'Mythical Status', desc: 'Equip the Mythic Skin.', max: 1, reward: { type: 'tokens', amt: 250 }, getProgress: () => (activeSkin === 'mythic' ? 1 : 0) }
];

// --- MISSION SYSTEM ---
const missionPool = [
    { id: 'crit', target: 5, desc: 'Land 5 Critical Hits' },
    { id: 'heal', target: 3, desc: 'Use the Heal Skill 3 times' },
    { id: 'boss', target: 1, desc: 'Defeat 1 Boss Enemy' },
    { id: 'play', target: 10, desc: 'Roll the dice 10 times' }
];
let currentMission = JSON.parse(localStorage.getItem("currentMission")) || { ...missionPool[0], progress: 0 };

// --- AUDIO SYSTEM ---
const sounds = {
    roll: new Audio('dice_roll.mp3'), win: new Audio('win_ding.mp3'), lose: new Audio('lose_thud.mp3'),
    pulse: new Audio('pulse.mp3'), heartbeat: new Audio('heartbeat.mp3'), bgm: new Audio('ambient_synth.mp3')
};
sounds.bgm.loop = true; sounds.bgm.volume = 0.4;

// --- BESTIARY ---
const enemies = [
    { name: "Slime", minLvl: 1, color: "#22c55e" }, { name: "Goblin", minLvl: 5, color: "#4ade80" },
    { name: "Skeleton", minLvl: 15, color: "#cbd5e1" }, { name: "Orc Warrior", minLvl: 30, color: "#fb923c" },
    { name: "Void Wraith", minLvl: 45, color: "#a855f7" }, { name: "DRAGON", minLvl: 60, color: "#ef4444" }
];

function getEnemyMaxHP(lvl) {
    let baseHP = 100 + (lvl * 5); return (lvl % 10 === 0) ? baseHP * 3 : baseHP; 
}

let p1HP = upgrades.hp; let p2HP = getEnemyMaxHP(level);

// --- CORE HELPERS ---
function formatPrice(price) {
    if (price === 0) return 'FREE';
    if (price >= 1000000) return (price / 1000000) + 'M 💰';
    if (price >= 1000) return (price / 1000) + 'k 💰';
    return price + ' 💰';
}

function createDamagePop(value, targetId, color = '#ef4444', isCrit = false) {
    const target = document.getElementById(targetId); if (!target) return;
    const parent = target.parentElement; parent.style.position = 'relative';
    const pop = document.createElement('div'); pop.className = 'damage-pop';
    if (isCrit) pop.classList.add('crit-text');
    pop.textContent = (typeof value === 'number') ? `-${value}` : value;
    pop.style.color = color;
    pop.style.left = `calc(50% - 10px + ${(Math.random() - 0.5) * 40}px)`; pop.style.top = `20px`;
    parent.appendChild(pop); setTimeout(() => pop.remove(), 800);
}

function triggerBossFlash() {
    const flash = document.createElement('div');
    flash.style.position = 'fixed'; flash.style.top = '0'; flash.style.left = '0'; flash.style.width = '100vw'; flash.style.height = '100vh';
    flash.style.zIndex = '9999'; flash.style.pointerEvents = 'none'; flash.style.animation = 'flashScreen 1s ease-out forwards';
    document.body.appendChild(flash); setTimeout(() => flash.remove(), 1000);
}

// --- DAILY REWARDS LOGIC ---
function checkDailyReward() {
    const today = new Date().toDateString(); 
    if (lastLoginDate !== today) {
        let tempStreak = loginStreak; let yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        if (lastLoginDate !== yesterday.toDateString() && lastLoginDate !== "") tempStreak = 0; 
        tempStreak++; if (tempStreak > 7) tempStreak = 1; 
        pendingReward = dailyRewards[tempStreak - 1];
        document.getElementById('streak-day').textContent = tempStreak;
        document.getElementById('reward-amount').textContent = `+${pendingReward.text}`;
        document.getElementById('daily-reward-modal').style.display = 'flex';
    }
}

function claimDailyReward() {
    const today = new Date().toDateString(); let yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    if (lastLoginDate !== yesterday.toDateString() && lastLoginDate !== "") loginStreak = 0; 
    loginStreak++; if (loginStreak > 7) loginStreak = 1;
    if (pendingReward.type === 'coins') coins += pendingReward.amount;
    if (pendingReward.type === 'tokens') tokens += pendingReward.amount;
    lastLoginDate = today; document.getElementById('daily-reward-modal').style.display = 'none';
    if(!isMuted) sounds.win.play().catch(() => {}); updateUI();
}

// --- ACHIEVEMENT LOGIC ---
function checkAchievements() {
    let newlyUnlocked = false;
    achievementData.forEach(ach => {
        let status = achievements[ach.id];
        if (status !== 'unlocked' && status !== 'claimed' && status !== true) { 
            if (ach.getProgress() >= ach.max) {
                achievements[ach.id] = 'unlocked'; 
                newlyUnlocked = true;
                createDamagePop("🏆 REWARD READY!", 'p1-img', '#fbbf24', true);
            }
        }
    });
    if (newlyUnlocked) updateUI();
}

function claimAchievement(id) {
    const ach = achievementData.find(a => a.id === id);
    if (ach && achievements[id] === 'unlocked') {
        achievements[id] = 'claimed'; 
        if (ach.reward.type === 'tokens') { tokens += ach.reward.amt; } 
        else { coins += ach.reward.amt; }
        if(!isMuted) sounds.win.play().catch(() => {});
        alert(`🏆 You claimed ${ach.reward.amt} ${ach.reward.type === 'tokens' ? '💎' : '💰'}!`);
        updateUI();
    }
}

// --- MISSION LOGIC ---
function updateMissionProgress(actionType, amount = 1) {
    if (currentMission.id === actionType) {
        currentMission.progress += amount;
        if (currentMission.progress >= currentMission.target) {
            upgrades.mult += 0.5; 
            stats.missionsCompleted++; 
            if(!isMuted) sounds.win.play().catch(() => {});
            createDamagePop("MISSION COMPLETE!", 'p1-img', '#3b82f6', true);
            alert(`📜 MISSION COMPLETE! Your Coin Multiplier is now ${upgrades.mult}x!`);
            let nextMission = missionPool[Math.floor(Math.random() * missionPool.length)];
            currentMission = { ...nextMission, progress: 0 };
            checkAchievements(); 
        }
        updateUI();
    }
}

// --- AD SIMULATOR LOGIC ---
let adInterval;

function showAd() {
    const today = new Date().toDateString();
    if (lastAdDate !== today) {
        dailyAdsWatched = 0;
        lastAdDate = today;
    }
    if (dailyAdsWatched >= MAX_DAILY_ADS) {
        alert(`You have reached the daily limit of ${MAX_DAILY_ADS} ads! Check back tomorrow.`);
        return;
    }
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
    dailyAdsWatched++;
    if(!isMuted) sounds.pulse.play().catch(() => {}); 
    alert(`Ad complete! You earned 5 💎 Tokens. (${MAX_DAILY_ADS - dailyAdsWatched} ads remaining today)`); 
    updateUI();
}

// --- MYSTERY BOX (GACHA) LOGIC ---
function openMysteryBox() {
    const cost = 2000;
    if (coins < cost) { alert("Not enough coins! Keep battling."); return; }
    coins -= cost; updateUI();
    const btn = document.getElementById('gacha-btn'); const originalText = btn.innerHTML;
    btn.innerHTML = '🎲 UNLOCKING...'; btn.classList.add('gacha-roll');
    if(!isMuted) sounds.roll.play().catch(() => {});

    setTimeout(() => {
        btn.classList.remove('gacha-roll'); btn.innerHTML = originalText;
        const roll = Math.floor(Math.random() * 100) + 1; 
        let rewardText = "";

        if (roll <= 60) {
            let wonCoins = Math.floor(Math.random() * 3000) + 1000; coins += wonCoins;
            rewardText = `Common Drop!<br><br><span style="color: #4ade80; font-size: 2rem;">+${wonCoins} 💰</span>`;
            if(!isMuted) sounds.win.play().catch(() => {});
        } else if (roll <= 90) {
            let wonTokens = Math.floor(Math.random() * 15) + 5; tokens += wonTokens;
            rewardText = `Rare Drop!<br><br><span style="color: #a855f7; font-size: 2rem;">+${wonTokens} 💎</span>`;
            if(!isMuted) sounds.win.play().catch(() => {});
        } else if (roll <= 99) {
            const premiumSkins = ['forged', 'void', 'magma', 'silver', 'gold', 'mythic'];
            const unowned = premiumSkins.filter(s => !ownedSkins.includes(s));
            if (unowned.length > 0) {
                const randomSkinId = unowned[Math.floor(Math.random() * unowned.length)];
                ownedSkins.push(randomSkinId);
                rewardText = `🔥 EPIC DROP! 🔥<br><br><span style="color: #ef4444; font-size: 1.5rem;">${skinData[randomSkinId].name} SKIN UNLOCKED!</span>`;
                if(!isMuted) sounds.pulse.play().catch(() => {});
            } else {
                tokens += 100;
                rewardText = `🔥 EPIC DROP! 🔥<br><br><span style="color: #a855f7; font-size: 2rem;">+100 💎</span>`;
                if(!isMuted) sounds.pulse.play().catch(() => {});
            }
        } else {
            coins += 50000; tokens += 200;
            rewardText = `🚨 JACKPOT!!! 🚨<br><br><span style="color: #fbbf24; font-size: 2rem;">50k 💰 & 200 💎</span>`;
            document.body.classList.add('violent-shake'); setTimeout(() => document.body.classList.remove('violent-shake'), 500);
            if(!isMuted) sounds.pulse.play().catch(() => {});
        }
        document.getElementById('gacha-reward-box').innerHTML = rewardText;
        document.getElementById('gacha-modal').style.display = 'flex';
        updateUI();
    }, 1500);
}

// --- BATTLE BUFF SYSTEM ---
let nextRollBuff = null; 
const buffTypes = [
    { id: 'shield', icon: '🛡️', color: '#3b82f6', text: 'SHIELD' },
    { id: 'strike', icon: '⚡', color: '#fbbf24', text: '2X STRIKE' },
    { id: 'magnet', icon: '🧲', color: '#a855f7', text: 'COIN MAGNET' }
];

function spawnBattleBuff() {
    const existing = document.querySelector('.battle-buff'); 
    if (existing) existing.remove();
    
    if (Math.random() * 100 > 15) return;
    
    const arena = document.querySelector('.battle-arena'); 
    if (!arena) return;
    arena.style.position = 'relative';

    const buff = buffTypes[Math.floor(Math.random() * buffTypes.length)];
    const buffEl = document.createElement('div');
    buffEl.className = 'battle-buff'; 
    buffEl.textContent = buff.icon;
    
    let offset = Math.floor(Math.random() * 40) - 20; 
    buffEl.style.left = `calc(50% - 20px + ${offset}px)`; 
    buffEl.style.top = '-15px'; 

    buffEl.onclick = () => {
        nextRollBuff = buff.id; 
        if(!isMuted) sounds.win.play().catch(() => {});
        createDamagePop(`${buff.text} ACTIVE!`, 'p1-img', buff.color, true);
        buffEl.remove(); 
    };
    arena.appendChild(buffEl);
}

// --- CORE FUNCTIONS ---
function startGame() {
    showTab('arena');
    if (!isMuted) { sounds.pulse.play().catch(() => {}); sounds.bgm.play().catch(() => {}); }
    setTimeout(checkDailyReward, 500); 
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    const nav = document.getElementById('main-nav'); const wallet = document.getElementById('main-wallet');
    if(tabId === 'home') { nav.style.display = 'none'; wallet.style.display = 'none'; } 
    else { nav.style.display = 'flex'; wallet.style.display = 'flex'; }
}

function useSkill(type) {
    if (type === 'heal' && cooldowns.heal === 0 && coins >= 50) {
        if (p1HP >= upgrades.hp) return; 
        coins -= 50; updateMissionProgress('heal');
        p1HP = Math.min(upgrades.hp, p1HP + Math.floor(upgrades.hp * 0.3)); cooldowns.heal = 3; 
        createDamagePop("+HP", 'p1-img', '#4ade80'); if(!isMuted) sounds.win.play().catch(() => {}); 
    } 
    else if (type === 'double' && cooldowns.double === 0 && coins >= 100) {
        coins -= 100; buffs.doubleDamage = true; cooldowns.double = 3; 
        if(!isMuted) sounds.pulse.play().catch(() => {}); 
    }
    updateUI();
}

function rollDice() {
    const rollBtn = document.querySelector('.roll-btn'); rollBtn.disabled = true; rollBtn.style.opacity = '0.5';
    const existingBuff = document.querySelector('.battle-buff'); if (existingBuff) existingBuff.remove();
    updateMissionProgress('play');

    if (cooldowns.heal > 0) cooldowns.heal--; if (cooldowns.double > 0) cooldowns.double--;
    let currentSkin = skinData[activeSkin] || skinData['classic'];
    
    if(!isMuted) { sounds.roll.currentTime = 0; sounds.roll.play().catch(() => {}); }
    const diceElements = document.querySelectorAll('.dice-img');
    diceElements.forEach(d => d.classList.add('shake'));

    let rollCycles = 0;
    const cycleInterval = setInterval(() => {
        let tempD1 = Math.floor(Math.random() * 6) + 1; let tempD2 = Math.floor(Math.random() * 6) + 1;
        document.getElementById("p1-img").src = `assets/${currentSkin.prefixP1}red-${tempD1}.png`; 
        document.getElementById("p2-img").src = `assets/${currentSkin.prefixP2}green-${tempD2}.png`;
        rollCycles++;
    }, 50);

    const d1 = Math.floor(Math.random() * 6) + 1; const d2 = Math.floor(Math.random() * 6) + 1;

    setTimeout(() => {
        clearInterval(cycleInterval); diceElements.forEach(d => d.classList.remove('shake'));
        document.getElementById("p1-img").src = `assets/${currentSkin.prefixP1}red-${d1}.png`; 
        document.getElementById("p2-img").src = `assets/${currentSkin.prefixP2}green-${d2}.png`;

        if (d1 > d2) {
            let dmg = d1 * 5; let isCrit = false;
            if (Math.random() * 100 < (5 + upgrades.luck)) { isCrit = true; dmg *= 2; updateMissionProgress('crit'); stats.critsLanded++; }
            let usedDoubleSkill = false;
            if (buffs.doubleDamage) { dmg *= 2; buffs.doubleDamage = false; usedDoubleSkill = true; }
            if (nextRollBuff === 'strike') { dmg *= 2; }
            
            p2HP -= dmg;
            let earnedCoins = (10 * upgrades.mult); if (nextRollBuff === 'magnet') { earnedCoins *= 2; }
            coins += earnedCoins;

            if (isCrit) {
                document.body.classList.add('violent-shake'); setTimeout(() => document.body.classList.remove('violent-shake'), 500);
                createDamagePop(`CRIT! -${dmg}`, 'p2-img', '#ef4444', true); if(!isMuted) sounds.pulse.play().catch(() => {}); 
            } else if (usedDoubleSkill) { createDamagePop(`-${dmg}`, 'p2-img', '#fbbf24', false); 
            } else { createDamagePop(dmg, 'p2-img'); }
        } else if (d2 > d1) {
            let dmg = d2 * 5;
            if (nextRollBuff === 'shield') { dmg = 0; createDamagePop("BLOCKED!", 'p1-img', '#3b82f6', true); } 
            else {
                p1HP -= dmg; createDamagePop(dmg, 'p1-img'); 
                if(p1HP < 30 && p1HP > 0 && !isMuted) { sounds.heartbeat.currentTime = 0; sounds.heartbeat.play().catch(() => {}); }
            }
        }
        
        nextRollBuff = null; checkBattleStatus(); checkAchievements(); updateUI(); spawnBattleBuff();
        rollBtn.disabled = false; rollBtn.style.opacity = '1';
    }, 400); 
}

function checkBattleStatus() {
    if (p2HP <= 0) {
        if(!isMuted) sounds.win.play().catch(() => {});
        if (level % 10 === 0) { tokens += 25; coins += (100 * upgrades.mult); stats.bossesDefeated++; updateMissionProgress('boss'); } 
        else { tokens += 5; }
        totalWins++; level++; if (level > highestLevel) highestLevel = level;
        if (level % 10 === 0) triggerBossFlash();
        p2HP = getEnemyMaxHP(level); p1HP = upgrades.hp; 
    } else if (p1HP <= 0) {
        if(!isMuted) sounds.lose.play().catch(() => {});
        p1HP = upgrades.hp; p2HP = getEnemyMaxHP(level);
    }
}

// --- SHOP LOGIC ---
function simulatePurchase(tokenAmount, priceStr) {
    const confirmBuy = confirm(`[SIMULATED PURCHASE]\n\nDo you want to buy ${tokenAmount} 💎 for ${priceStr}?\n(No real money will be charged)`);
    if (confirmBuy) {
        setTimeout(() => {
            tokens += tokenAmount;
            if(!isMuted) sounds.pulse.play().catch(() => {});
            document.body.classList.add('violent-shake'); 
            setTimeout(() => document.body.classList.remove('violent-shake'), 500);
            alert(`🎉 PAYMENT SUCCESSFUL!\n\nThank you for supporting the game! You received ${tokenAmount} 💎.`);
            updateUI();
        }, 800);
    }
}

function exchangeCurrency(diamondCost, coinReward) {
    if (tokens >= diamondCost) {
        tokens -= diamondCost;
        coins += coinReward;
        if(!isMuted) sounds.win.play().catch(() => {});
        createDamagePop(`+${coinReward} 💰`, 'p1-img', '#fbbf24', false);
        updateUI();
    } else {
        alert("Not enough Diamonds! Defeat Bosses or watch Ads to earn more.");
    }
}

function buySkin(skinId, cost) {
    if (ownedSkins.includes(skinId)) { 
        activeSkin = skinId; 
    } else if (coins >= cost) { 
        coins -= cost; 
        ownedSkins.push(skinId); 
        activeSkin = skinId; 
    }
    checkAchievements();
    updateUI();
}

function buyPermanent(type) {
    let cost = (type === 'hp') ? 10 : 25;
    if (tokens >= cost) { tokens -= cost; if (type === 'hp') { upgrades.hp += 20; p1HP = upgrades.hp; } else { upgrades.luck += 5; } }
    updateUI();
}

function handlePrestige() {
    if (level >= 50) {
        pastRuns.push({ level: highestLevel, prestige: prestigeCount });
        prestigeCount++; level = 1; highestLevel = 1; coins = 0; p2HP = getEnemyMaxHP(level); p1HP = upgrades.hp;
        updateUI(); alert("PRESTIGE ACTIVATED! Your run has been saved to the Hall of Fame. Restarting at Level 1...");
    } else { alert("You must reach Level 50 to Prestige!"); }
}

// --- UPDATE UI LOGIC ---
function updateUI() {
    document.getElementById("coins-game").textContent = Math.floor(coins).toLocaleString();
    document.getElementById("tokens-game").textContent = tokens;
    document.getElementById("lvl-num").textContent = level;
    
    let maxP2HP = getEnemyMaxHP(level);
    document.getElementById("p1-hp").style.width = Math.max(0, (p1HP / upgrades.hp * 100)) + "%";
    const p2HpBar = document.getElementById("p2-hp");
    p2HpBar.style.width = Math.max(0, (p2HP / maxP2HP * 100)) + "%";
    
    let isBoss = (level % 10 === 0); document.body.classList.toggle('boss-mode', isBoss);
    let currentEnemy = [...enemies].reverse().find(e => level >= e.minLvl) || enemies[0];
    
    document.body.classList.remove('env-forest', 'env-dungeon', 'env-badlands', 'env-void', 'env-volcano');
    if (currentEnemy.name === "Slime" || currentEnemy.name === "Goblin") document.body.classList.add('env-forest');
    else if (currentEnemy.name === "Skeleton") document.body.classList.add('env-dungeon');
    else if (currentEnemy.name === "Orc Warrior") document.body.classList.add('env-badlands');
    else if (currentEnemy.name === "Void Wraith") document.body.classList.add('env-void');
    else if (currentEnemy.name === "DRAGON") document.body.classList.add('env-volcano');

    const eName = document.getElementById("enemy-name");
    if(eName) {
        if (isBoss) { eName.innerHTML = `👑 BOSS: ${currentEnemy.name} 👑`; eName.classList.add('boss-name'); p2HpBar.classList.add('boss-hp-bar'); eName.style.color = "#ef4444"; } 
        else { eName.textContent = currentEnemy.name; eName.classList.remove('boss-name'); p2HpBar.classList.remove('boss-hp-bar'); eName.style.color = currentEnemy.color; }
    }

    const healBtn = document.getElementById('skill-heal'); const doubleBtn = document.getElementById('skill-double');
    if (healBtn) {
        if (cooldowns.heal > 0) { healBtn.disabled = true; healBtn.innerHTML = `⏳ CD: ${cooldowns.heal}`; } 
        else { healBtn.disabled = (coins < 50 || p1HP >= upgrades.hp); healBtn.innerHTML = `💚 HEAL<br><span class="skill-cost">50 💰</span>`; }
    }
    if (doubleBtn) {
        if (buffs.doubleDamage) { doubleBtn.classList.add('active-buff'); doubleBtn.innerHTML = `🔥 ACTIVE`; doubleBtn.disabled = true; } 
        else if (cooldowns.double > 0) { doubleBtn.classList.remove('active-buff'); doubleBtn.disabled = true; doubleBtn.innerHTML = `⏳ CD: ${cooldowns.double}`; } 
        else { doubleBtn.classList.remove('active-buff'); doubleBtn.disabled = (coins < 100); doubleBtn.innerHTML = `⚔️ 2X DMG<br><span class="skill-cost">100 💰</span>`; }
    }

    const mDesc = document.getElementById('mission-desc'); const mProg = document.getElementById('mission-progress'); const mMult = document.getElementById('current-mult-display');
    if (mDesc && mProg && mMult) { mDesc.textContent = currentMission.desc; mProg.textContent = `${currentMission.progress} / ${currentMission.target}`; mMult.textContent = `${upgrades.mult}x MULT`; }

    const adBtn = document.getElementById('watch-ad-btn');
    if (adBtn) {
        const today = new Date().toDateString();
        let currentAdCount = (lastAdDate === today) ? dailyAdsWatched : 0;
        if (currentAdCount >= MAX_DAILY_ADS) {
            adBtn.innerHTML = `📺 COME BACK TOMORROW`; adBtn.style.opacity = '0.5';
        } else {
            adBtn.innerHTML = `📺 WATCH AD (+5 💎) [${MAX_DAILY_ADS - currentAdCount} LEFT]`; adBtn.style.opacity = '1';
        }
    }

    const ribbon = document.getElementById('skin-ribbon');
    if (ribbon) {
        ribbon.innerHTML = ''; 
        Object.values(skinData).forEach(skin => {
            const isOwned = ownedSkins.includes(skin.id); const isEquipped = (activeSkin === skin.id); const canAfford = coins >= skin.price;
            const card = document.createElement('div'); card.className = `skin-card ${isEquipped ? 'active-skin' : ''}`;
            let btnHtml = isEquipped ? `<button class="skin-action-btn equipped">EQUIPPED</button>` : isOwned ? `<button class="skin-action-btn equip" onclick="buySkin('${skin.id}', 0)">EQUIP</button>` : `<button class="skin-action-btn buy ${canAfford ? '' : 'disabled'}" onclick="buySkin('${skin.id}', ${skin.price})">${formatPrice(skin.price)}</button>`;
            card.innerHTML = `<img src="assets/${skin.prefixP1}red-6.png" class="skin-preview" onerror="this.src='assets/red-6.png'"><p class="skin-title">${skin.name}</p>${btnHtml}`;
            ribbon.appendChild(card);
        });
    }

    const topRunsContainer = document.getElementById('top-runs-container');
    if (topRunsContainer) {
        topRunsContainer.innerHTML = ''; 
        let allRuns = [...pastRuns, { level: highestLevel, prestige: prestigeCount, isCurrent: true }];
        allRuns.sort((a, b) => { if (b.prestige !== a.prestige) return b.prestige - a.prestige; return b.level - a.level; });
        let top5 = allRuns.slice(0, 5);
        top5.forEach((run, index) => {
            let rankClass = 'rank-novice'; let rankName = 'NOVICE';
            if (run.prestige > 0 || run.level >= 50) { rankClass = 'rank-legend'; rankName = 'LEGEND'; }
            else if (run.level >= 30) { rankClass = 'rank-titan'; rankName = 'TITAN'; }
            else if (run.level >= 15) { rankClass = 'rank-slayer'; rankName = 'SLAYER'; }
            let prestigeText = run.prestige > 0 ? ` (${run.prestige}⭐)` : '';
            let currentTag = run.isCurrent ? `<span class="active-run-tag">ACTIVE</span>` : '';
            let div = document.createElement('div'); div.className = 'run-row';
            div.innerHTML = `<div class="run-rank ${rankClass}">${index + 1}. ${rankName}${currentTag}</div><div class="run-stats">LVL ${run.level}${prestigeText}</div>`;
            topRunsContainer.appendChild(div);
        });
    }

    const achContainer = document.getElementById('achievements-container');
    if (achContainer) {
        achContainer.innerHTML = ''; 
        achievementData.forEach(ach => {
            let status = achievements[ach.id];
            if (status === true) status = 'claimed'; 
            
            let progress = Math.min(ach.getProgress(), ach.max);
            let isUnlocked = (status === 'unlocked');
            let isClaimed = (status === 'claimed');
            
            let div = document.createElement('div'); 
            div.className = `achievement-card ${isClaimed ? 'unlocked' : ''}`;
            
            let actionHtml = '';
            if (isClaimed) {
                actionHtml = `<div class="ach-progress" style="margin-top:10px;">✅ CLAIMED</div>`;
            } else if (isUnlocked) {
                let rewardIcon = ach.reward.type === 'tokens' ? '💎' : '💰';
                actionHtml = `<button class="claim-btn" onclick="claimAchievement('${ach.id}')">CLAIM ${ach.reward.amt} ${rewardIcon}</button>`;
            } else {
                let percent = (progress / ach.max) * 100;
                actionHtml = `
                    <div class="ach-bar-bg">
                        <div class="ach-bar-fill" style="width: ${percent}%"></div>
                        <span class="ach-bar-text">${progress} / ${ach.max}</span>
                    </div>
                `;
            }

            div.innerHTML = `
                <div class="ach-icon" style="align-self: flex-start; margin-top: 5px;">${isClaimed || isUnlocked ? ach.icon : '🔒'}</div>
                <div class="ach-info">
                    <p class="ach-title">${ach.title}</p>
                    <p class="ach-desc">${ach.desc}</p>
                    ${actionHtml}
                </div>
            `;
            achContainer.appendChild(div);
        });
    }

    const bestScoreNum = document.getElementById("best-score-num");
    const bestScoreIcon = document.getElementById("best-score-icon");
    if (bestScoreNum && bestScoreIcon) {
        bestScoreNum.textContent = highestLevel;
        let currentSkinForPill = skinData[activeSkin] || skinData['classic'];
        bestScoreIcon.src = `assets/${currentSkinForPill.prefixP1}red-6.png`;
    }

    document.getElementById("total-wins").textContent = totalWins; document.getElementById("prestige-star").textContent = "⭐".repeat(prestigeCount); document.getElementById("mute-btn").textContent = isMuted ? "🔇 Muted" : "🔊 Sound On";
    saveData();
}

function toggleMute() { isMuted = !isMuted; localStorage.setItem("gameMuted", isMuted); if(isMuted) sounds.bgm.pause(); else if (!document.getElementById('tab-home').classList.contains('active')) sounds.bgm.play().catch(() => {}); updateUI(); }
function adjustVolume() { const vol = document.getElementById("volume-slider").value; for (let s in sounds) sounds[s].volume = (s === 'bgm') ? vol * 0.4 : vol; }

function saveData() {
    localStorage.setItem("coins", coins); localStorage.setItem("tokens", tokens); localStorage.setItem("level", level); localStorage.setItem("totalWins", totalWins); localStorage.setItem("highestLevel", highestLevel); localStorage.setItem("prestigeCount", prestigeCount); localStorage.setItem("upgrades", JSON.stringify(upgrades)); localStorage.setItem("ownedSkins", JSON.stringify(ownedSkins)); localStorage.setItem("activeSkin", activeSkin); localStorage.setItem("cooldowns", JSON.stringify(cooldowns)); localStorage.setItem("buffs", JSON.stringify(buffs)); localStorage.setItem("lastLoginDate", lastLoginDate); localStorage.setItem("loginStreak", loginStreak); localStorage.setItem("stats", JSON.stringify(stats)); localStorage.setItem("achievements", JSON.stringify(achievements)); localStorage.setItem("currentMission", JSON.stringify(currentMission)); localStorage.setItem("pastRuns", JSON.stringify(pastRuns)); localStorage.setItem("dailyAdsWatched", dailyAdsWatched); localStorage.setItem("lastAdDate", lastAdDate);
}

function initParticles() {
    const container = document.getElementById('particles-container'); if (!container) return;
    container.innerHTML = ''; 
    for (let i = 0; i < 35; i++) {
        let p = document.createElement('div'); p.className = 'particle';
        p.style.left = `${Math.random() * 100}vw`; p.style.top = `${Math.random() * 100}vh`;
        p.style.animationDelay = `${Math.random() * 5}s`; p.style.animationDuration = `${Math.random() * 4 + 3}s`; 
        container.appendChild(p);
    }
}

// --- INITIALIZE GAME ---
document.getElementById("volume-slider").value = 0.5; 
adjustVolume(); 
updateUI(); 
initParticles();
