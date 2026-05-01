// ==========================================
// 1. FIREBASE INITIALIZATION & CONFIG
// ==========================================
const firebaseConfig = {
    // PASTE YOUR FIREBASE CONFIG OBJECT HERE
};
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();

// ==========================================
// 2. GAME STATE & VARIABLES
// ==========================================
let coins = Number(localStorage.getItem("coins")) || 0;
let tokens = Number(localStorage.getItem("tokens")) || 0;
let highestLevel = Number(localStorage.getItem("highestLevel")) || 1;
let prestigeCount = Number(localStorage.getItem("prestigeCount")) || 0;
let playerName = localStorage.getItem("playerName") || "Warrior";
let upgrades = JSON.parse(localStorage.getItem("upgrades")) || { mult: 1, luck: 1 };
let ownedSkins = JSON.parse(localStorage.getItem("ownedSkins")) || ['classic'];
let equippedSkin = localStorage.getItem("equippedSkin") || 'classic';

// Time & Limit Tracking
let lastPlayTime = Number(localStorage.getItem("lastPlayTime")) || Date.now();
let idleCoinsEarned = 0;
let dailyChestsOpened = Number(localStorage.getItem("dailyChestsOpened")) || 0;
let lastChestDate = localStorage.getItem("lastChestDate") || "";
const MAX_DAILY_CHESTS = 3;

// Streak Tracking
let loginStreak = Number(localStorage.getItem("loginStreak")) || 0;
let lastLoginDate = localStorage.getItem("lastLoginDate") || "";
const streakRewards = [
    { type: 'coins', amount: 200 }, { type: 'tokens', amount: 5 }, { type: 'coins', amount: 500 },
    { type: 'tokens', amount: 10 }, { type: 'coins', amount: 1000 }, { type: 'tokens', amount: 20 },
    { type: 'gacha', amount: 1 }
];

// Tutorial
let tutorialActive = false;
let tutorialStep = 0;
let hasSeenTutorial = localStorage.getItem("hasSeenTutorial") === "true";

// Combat State
let playerHp = 100, maxHp = 100;
let bossHp = 100, bossMaxHp = 100;
let isDiceFrozen = false;
let bossStatus = { type: null, turns: 0, damage: 0 }; 

// ==========================================
// 3. DATA DICTIONARIES (BIOMES & SKINS)
// ==========================================
const biomeData = {
    1: { name: "Greenwood Forest", env: "env-forest", bossAbility: null },
    10: { name: "Echoing Dungeon", env: "env-dungeon", bossAbility: "STUN" },
    20: { name: "Burning Badlands", env: "env-badlands", bossAbility: "FREEZE" },
    30: { name: "Obsidian Volcano", env: "env-volcano", bossAbility: "BURN" },
    40: { name: "The Cosmic Void", env: "env-void", bossAbility: "DRAIN" }
};

const skinData = {
    'classic': { name: 'Classic Red', img: 'dice_classic.png', effect: null },
    'silver': { name: 'Silver Knight', img: 'silver_dice.png', effect: 'shield' },
    'gold': { name: 'Golden Touch', img: 'gold_dice.png', effect: 'midas' },
    'magma': { name: 'Magma Core', img: 'magma_dice.png', effect: 'burn' },
    'void': { name: 'Void Reaver', img: 'void_dice.png', effect: 'vampire' },
    'forged': { name: 'Iron Forged', img: 'forged_dice.png', effect: 'bleed' },
    'mythic': { name: 'Mythic Soul', img: 'mythic_dice.png', effect: 'omni' }
};

// ==========================================
// 4. CORE ENGINE & PROGRESSION
// ==========================================
window.startGame = function() {
    bossMaxHp = 100 + (highestLevel * 20);
    bossHp = bossMaxHp;
    maxHp = 100 + ((upgrades.mult - 1) * 50); 
    playerHp = maxHp;
    
    showTab('arena');
    updateUI();
    
    setTimeout(checkIdleRewards, 500);
    setTimeout(checkLoginStreak, 1500);
    setTimeout(() => { if (!hasSeenTutorial) startTutorial(); }, 2500);
}

function saveData() {
    localStorage.setItem("coins", coins);
    localStorage.setItem("tokens", tokens);
    localStorage.setItem("highestLevel", highestLevel);
    localStorage.setItem("prestigeCount", prestigeCount);
    localStorage.setItem("upgrades", JSON.stringify(upgrades));
    localStorage.setItem("lastPlayTime", Date.now());
    localStorage.setItem("dailyChestsOpened", dailyChestsOpened);
    localStorage.setItem("lastChestDate", lastChestDate);
}

// ==========================================
// 5. COMBAT & BIOME LOGIC
// ==========================================
window.rollDice = function() {
    if (isDiceFrozen || playerHp <= 0) return;

    let playerRoll = Math.floor(Math.random() * 6) + 1;
    let enemyRoll = Math.floor(Math.random() * 6) + 1;
    let isCrit = playerRoll === 6;

    // --- ELEMENTAL LOGIC ---
    const currentSkin = skinData[equippedSkin];
    if (currentSkin && currentSkin.effect) {
        if (Math.random() < 0.15) applyEffect(currentSkin.effect, playerRoll * upgrades.mult);
    }

    // --- DAMAGE CALCULATION ---
    let damage = Math.max(1, Math.floor(playerRoll * upgrades.mult));
    bossHp -= damage;
    coins += Math.floor(damage * 10);

    // --- JUICE (VISUAL EFFECTS) ---
    if (isCrit) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay flash-white';
        document.body.appendChild(overlay);
        document.body.classList.add('impact-shake');
        spawnParticles(window.innerWidth/2, window.innerHeight/3, '#ef4444');
        setTimeout(() => { overlay.remove(); document.body.classList.remove('impact-shake'); }, 200);
    }

    // --- BOSS STATUS EFFECTS (BURN) ---
    if (bossStatus.turns > 0) {
        bossHp -= bossStatus.damage;
        bossStatus.turns--;
        if (bossStatus.turns === 0) bossStatus.type = null;
    }

    // --- WIN/LOSS CHECK ---
    if (bossHp <= 0) {
        highestLevel++;
        bossMaxHp = 100 + (highestLevel * 20);
        bossHp = bossMaxHp;
        syncToCloud();
    } else {
        enemyTurn(enemyRoll);
    }

    if (playerHp <= 0) {
        alert("You have fallen! The healers revived you.");
        playerHp = maxHp;
    }

    updateUI();
    saveData();
}

function enemyTurn(enemyRoll) {
    let bossDamage = Math.max(1, Math.floor(enemyRoll * (highestLevel * 0.5)));
    playerHp -= bossDamage;

    // BIOME ABILITY CHECK (FREEZE)
    let currentBiome = Object.values(biomeData).reverse().find(b => highestLevel >= Object.keys(biomeData).find(k => biomeData[k] === b));
    if (currentBiome && currentBiome.bossAbility === "FREEZE" && Math.random() < 0.2) {
        freezeDice(2000);
    }
}

function applyEffect(type, damage) {
    switch(type) {
        case 'burn': bossStatus = { type: 'BURN', turns: 3, damage: Math.floor(damage * 0.5) }; break;
        case 'vampire': playerHp = Math.min(maxHp, playerHp + Math.floor(damage * 0.5)); break;
        case 'midas': coins += Math.floor(damage * 2); break;
    }
}

function freezeDice(duration) {
    isDiceFrozen = true;
    const rollBtn = document.getElementById('roll-btn');
    rollBtn.style.filter = "grayscale(1) brightness(0.5)";
    rollBtn.innerText = "❄️ FROZEN";
    
    setTimeout(() => {
        isDiceFrozen = false;
        rollBtn.style.filter = "none";
        rollBtn.innerText = "ROLL DICE";
        updateUI();
    }, duration);
}

function spawnParticles(x, y, color = '#fbbf24') {
    for (let i = 0; i < 12; i++) {
        const p = document.createElement('div');
        p.className = 'particle'; p.style.backgroundColor = color;
        p.style.left = x + 'px'; p.style.top = y + 'px';
        document.body.appendChild(p);
        
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 6 + 4;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;

        let opacity = 1;
        const animate = () => {
            p.style.top = (parseFloat(p.style.top) + vy) + 'px';
            p.style.left = (parseFloat(p.style.left) + vx) + 'px';
            opacity -= 0.02; p.style.opacity = opacity;
            if (opacity > 0) requestAnimationFrame(animate); else p.remove();
        };
        requestAnimationFrame(animate);
    }
}

// ==========================================
// 6. ECONOMY, REWARDS, & PRESTIGE
// ==========================================
function checkIdleRewards() {
    const now = Date.now();
    const minutesAway = Math.floor((now - lastPlayTime) / (1000 * 60));

    if (minutesAway >= 10) { 
        const cappedMinutes = Math.min(minutesAway, 720); // 12 Hour Cap
        const coinsPerMinute = 0.2 * upgrades.mult; // Hardcore balance
        idleCoinsEarned = Math.floor(cappedMinutes * coinsPerMinute);

        if (idleCoinsEarned > 0) {
            document.getElementById('idle-reward-amount').innerHTML = `+${idleCoinsEarned.toLocaleString()} 💰`;
            document.getElementById('idle-reward-modal').style.display = 'flex';
        }
    }
    lastPlayTime = now;
}

window.claimIdleReward = function() {
    coins += idleCoinsEarned;
    idleCoinsEarned = 0;
    document.getElementById('idle-reward-modal').style.display = 'none';
    updateUI(); saveData();
}

function checkLoginStreak() {
    const today = new Date().toDateString();
    if (lastLoginDate === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastLoginDate !== yesterday.toDateString()) loginStreak = 0;
    if (loginStreak >= 7) loginStreak = 0;

    const nextDay = loginStreak + 1;
    document.getElementById('login-streak-modal').style.display = 'flex';
    
    for (let i = 1; i <= 7; i++) {
        const el = document.getElementById(`day-${i}`);
        el.classList.remove('completed', 'current');
        if (i < nextDay) el.classList.add('completed');
        if (i === nextDay) el.classList.add('current');
    }
}

window.claimDailyStreak = function() {
    const reward = streakRewards[loginStreak];
    loginStreak++;
    lastLoginDate = new Date().toDateString();

    if (reward.type === 'coins') coins += reward.amount;
    if (reward.type === 'tokens') tokens += reward.amount;
    if (reward.type === 'gacha') setTimeout(openMysteryBox, 500);

    localStorage.setItem("loginStreak", loginStreak);
    localStorage.setItem("lastLoginDate", lastLoginDate);
    document.getElementById('login-streak-modal').style.display = 'none';
    updateUI(); saveData();
}

window.openMysteryBox = function() {
    const today = new Date().toDateString();
    if (lastChestDate !== today) { dailyChestsOpened = 0; lastChestDate = today; }
    
    if (dailyChestsOpened >= MAX_DAILY_CHESTS) {
        alert(`You have opened all ${MAX_DAILY_CHESTS} chests today! Come back tomorrow.`); return;
    }

    if (coins < 2000) { alert("Not enough coins!"); return; }
    
    coins -= 2000; dailyChestsOpened++; updateUI();

    const btn = document.getElementById('gacha-btn'); 
    btn.innerHTML = '🎲 UNLOCKING...';
    
    setTimeout(() => {
        const roll = Math.floor(Math.random() * 100) + 1; 
        let rewardText = "";

        if (roll <= 60) {
            let won = Math.floor(Math.random() * 3000) + 1000; coins += won;
            rewardText = `<span style="color: #4ade80; font-size: 2rem;">+${won} 💰</span>`;
        } else if (roll <= 90) {
            let won = Math.floor(Math.random() * 15) + 5; tokens += won;
            rewardText = `<span style="color: #a855f7; font-size: 2rem;">+${won} 💎</span>`;
        } else {
            coins += 50000; tokens += 200;
            rewardText = `🚨 JACKPOT!!! 🚨<br><br><span style="color: #fbbf24; font-size: 2rem;">50k 💰 & 200 💎</span>`;
        }
        
        document.getElementById('rays-effect').style.display = 'block';
        document.getElementById('gacha-reward-box').innerHTML = rewardText;
        document.getElementById('gacha-modal').style.display = 'flex';
        updateUI(); saveData();
    }, 1500);
}

window.ascendPlayer = function() {
    if (highestLevel < 50) return;
    if (confirm("Reset Level and Coins to 0 for a permanent Crown and 1.5x Multiplier?")) {
        prestigeCount++; highestLevel = 1; coins = 0;
        playerHp = 100; maxHp = 100;
        upgrades.mult = parseFloat((upgrades.mult * 1.5).toFixed(2));
        
        document.body.classList.add('flash-white');
        setTimeout(() => document.body.classList.remove('flash-white'), 500);
        
        saveData(); syncToCloud(); updateUI();
        alert("YOU HAVE ASCENDED!"); showTab('arena');
    }
}

window.simulatePurchase = function(amount, priceString) {
    if (confirm(`Simulate real purchase of ${amount} Tokens for ${priceString}?`)) {
        tokens += amount; updateUI(); saveData();
        alert(`Payment successful! +${amount} Tokens added.`);
    }
}

window.watchAd = function() {
    tokens += 5; updateUI(); saveData();
    alert("Ad watched. +5 Tokens!");
}

// ==========================================
// 7. UI & SOCIAL
// ==========================================
window.showTab = function(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');
    
    // Refresh leaderboard when hall is opened
    if(tabId === 'hall') fetchLeaderboard();
}

function updateUI() {
    document.getElementById('coin-count').innerText = coins.toLocaleString();
    document.getElementById('token-count').innerText = tokens.toLocaleString();
    document.getElementById('enemy-hp-fill').style.width = (bossHp/bossMaxHp * 100) + "%";
    document.getElementById('player-hp-fill').style.width = (playerHp/maxHp * 100) + "%";
    document.getElementById('player-hp-text').innerText = `${Math.floor(playerHp)}/${maxHp}`;
    document.getElementById('enemy-name').innerText = `Lvl ${highestLevel} Boss`;
    
    // Prestige Button
    document.getElementById('prestige-section').style.display = highestLevel >= 50 ? 'block' : 'none';
    
    // Boss Status UI
    const statusUi = document.getElementById('boss-status-ui');
    statusUi.innerHTML = bossStatus.turns > 0 ? `${bossStatus.type} (${bossStatus.turns} turns left)` : "";

    // Biome Logic
    let currentBiome = biomeData[1];
    Object.keys(biomeData).forEach(lv => { if (highestLevel >= Number(lv)) currentBiome = biomeData[lv]; });
    document.body.className = currentBiome.env;
    document.getElementById('biome-name').innerText = currentBiome.name;

    // Gacha Btn Update
    const gachaBtn = document.getElementById('gacha-btn');
    if (gachaBtn && !gachaBtn.innerHTML.includes('UNLOCKING')) {
        const today = new Date().toDateString();
        let count = (lastChestDate === today) ? dailyChestsOpened : 0;
        if (count >= MAX_DAILY_CHESTS) {
            gachaBtn.innerHTML = `🎁 COME BACK TOMORROW`; gachaBtn.style.opacity = '0.5';
        } else {
            gachaBtn.innerHTML = `OPEN CHEST (2,000 💰) [${MAX_DAILY_CHESTS - count} LEFT]`; gachaBtn.style.opacity = '1';
        }
    }
}

window.shareScore = async function() {
    const text = `I reached Level ${highestLevel} ${prestigeCount > 0 ? `with ${prestigeCount}👑 ` : ''}in Dice Battle Elite! Can you beat me?`;
    const url = window.location.href;
    if (navigator.share) {
        try { await navigator.share({ title: 'Dice Battle Elite', text: text, url: url }); } catch (err) {}
    } else {
        navigator.clipboard.writeText(`${text} Play here: ${url}`);
        alert("Score copied to clipboard!");
    }
}

// ==========================================
// 8. CLOUD SAVES & LEADERBOARD
// ==========================================
async function syncToCloud() {
    const user = auth.currentUser;
    if (user) {
        await db.collection("leaderboard").doc(user.uid).set({
            name: playerName, level: highestLevel, prestige: prestigeCount,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }
}

async function fetchLeaderboard() {
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = "Loading Top Players...";
    try {
        const snapshot = await db.collection("leaderboard").orderBy("prestige", "desc").orderBy("level", "desc").limit(50).get();
        list.innerHTML = "";
        let rank = 1;
        snapshot.forEach(doc => {
            const data = doc.data();
            const crowns = data.prestige > 0 ? "👑".repeat(data.prestige) : "";
            list.innerHTML += `<div style="display:flex; justify-content:space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <span>#${rank} ${crowns} ${data.name}</span>
                <span style="color:var(--gold);">Lvl ${data.level}</span>
            </div>`;
            rank++;
        });
    } catch (e) {
        list.innerHTML = "Failed to load leaderboard. Check connection.";
    }
}

// ==========================================
// 9. TUTORIAL ENGINE
// ==========================================
window.startTutorial = function() {
    if (hasSeenTutorial) return;
    tutorialActive = true; tutorialStep = 1;
    document.getElementById('tutorial-overlay').style.display = 'block';
    showTutorialStep();
}

function showTutorialStep() {
    const box = document.getElementById('tutorial-box');
    const text = document.getElementById('tutorial-text');
    const pointer = document.getElementById('tutorial-pointer');
    
    box.style.bottom = "auto"; box.style.top = "auto";
    pointer.style.bottom = "-20px"; pointer.style.top = "auto";
    pointer.style.borderTop = "15px solid var(--gold)"; pointer.style.borderBottom = "none";
    pointer.style.display = "block";

    switch(tutorialStep) {
        case 1: text.innerHTML = "Welcome! Let's learn to fight."; box.style.top = "30%"; pointer.style.display = "none"; break;
        case 2: text.innerHTML = "This is <b>YOU</b>. Your HP is on the right."; box.style.top = "25%"; pointer.style.top = "-20px"; pointer.style.borderBottom = "15px solid var(--gold)"; pointer.style.borderTop = "none"; break;
        case 3: text.innerHTML = "This is the <b>BOSS</b>. Reduce HP to 0!"; box.style.top = "25%"; break;
        case 4: text.innerHTML = "Tap <b>ROLL DICE</b> to attack!"; box.style.bottom = "150px"; break;
        case 5: text.innerHTML = "You earn <b>COINS</b> for hits. Use them in the Vault!"; box.style.top = "40%"; pointer.style.display = "none"; break;
        default: endTutorial();
    }
}

window.tutorialNextStep = function() {
    tutorialStep++;
    if (tutorialStep > 5) endTutorial(); else showTutorialStep();
}

function endTutorial() {
    tutorialActive = false; hasSeenTutorial = true;
    localStorage.setItem("hasSeenTutorial", "true");
    document.getElementById('tutorial-overlay').style.display = 'none';
}

// ==========================================
// 10. AUTH INITIALIZATION
// ==========================================
auth.signInAnonymously().then(() => {
    startGame();
}).catch((error) => {
    console.error("Firebase Auth Error:", error);
    startGame(); // Start anyway if offline
});
