let coins = Number(localStorage.getItem("coins")) || 100;
let tokens = Number(localStorage.getItem("tokens")) || 0;
let currentLevel = Number(localStorage.getItem("level")) || 1;
let prestigeCount = Number(localStorage.getItem("prestige")) || 0;
let legacy = JSON.parse(localStorage.getItem("legacy")) || [];
let upgrades = JSON.parse(localStorage.getItem("upgrades")) || { hp: 100, luck: 0, bounty: 1 };
let achievements = JSON.parse(localStorage.getItem("achievements")) || [];
let p1HP = 100;
let p2HP = 100;

const sounds = {
    bgm: new Audio('ambient_synth.mp3'),
    roll: new Audio('dice_roll.mp3'),
    win: new Audio('win_ding.mp3'),
    lose: new Audio('lose_thud.mp3'),
    levelUp: new Audio('level_up.mp3')
};
sounds.bgm.loop = true;
sounds.bgm.volume = 0.3;

function prestige() {
    if (coins < 1000000) return alert("Need 1,000,000 coins to Prestige!");
    if (!confirm("Reset progress for permanent benefits?")) return;
    
    // Record Legacy
    legacy.push({ date: new Date().toLocaleDateString(), lvl: currentLevel, coins: coins });
    localStorage.setItem("legacy", JSON.stringify(legacy));
    
    prestigeCount++;
    coins = 100;
    currentLevel = 1;
    localStorage.setItem("prestige", prestigeCount);
    localStorage.setItem("coins", coins);
    localStorage.setItem("level", currentLevel);
    location.reload();
}

function buyPermanent(type, cost) {
    if (tokens < cost) return alert("Not enough Tokens!");
    tokens -= cost;
    if (type === 'hp') upgrades.hp = 120;
    if (type === 'luck') upgrades.luck += 0.05;
    if (type === 'bounty') upgrades.bounty = 2;
    localStorage.setItem("upgrades", JSON.stringify(upgrades));
    localStorage.setItem("tokens", tokens);
    updateUI();
}

function startBattle(type) {
    const bet = Number(document.getElementById("bet-input").value);
    if (bet <= 0 || bet > coins) return alert("Check balance!");

    sounds.roll.play();
    setTimeout(() => {
        // Implementation of "Lucky Charm"
        let p1 = (type === 'bsk') ? Math.floor(Math.random() * 12) + 1 : Math.floor(Math.random() * 6) + 1;
        if (Math.random() < upgrades.luck) p1 = 6; // Permanent luck boost
        
        let p2 = Math.floor(Math.random() * 6) + 1;

        document.getElementById("dice1").src = `./assets/red-${p1 > 6 ? 6 : p1}.png`;
        document.getElementById("dice2").src = `./assets/green-${p2}.png`;

        if (p1 > p2) {
            // Achievement: The Gambler
            if (type === 'bsk' && bet >= 100) unlockAchievement("The Gambler");
            
            // Survivor Logic
            if (p1HP <= (upgrades.hp * 0.1)) unlockAchievement("Survivor");
            
            p2HP -= 20;
            coins += bet * (prestigeCount + 1);
            showFloatingText(`+${bet * (prestigeCount + 1)}`, "gold");
            sounds.win.play();
        } else if (p2 > p1) {
            p1HP -= 20;
            coins -= bet;
            showFloatingText(`-${bet}`, "red");
            sounds.lose.play();
        }

        if (p2HP <= 0) handleLevelUp();
        else if (p1HP <= 0) { p1HP = 100; p2HP = 100; }
        updateUI();
    }, 700);
}

function handleLevelUp() {
    if (currentLevel % 5 === 0) {
        tokens += (5 * upgrades.bounty);
        if (currentLevel / 5 >= 10) unlockAchievement("Boss Slayer");
    }
    currentLevel++;
    p1HP = upgrades.hp;
    p2HP = 100;
    triggerLevelUp();
}

function showFloatingText(text, colorClass) {
    const el = document.createElement("div");
    el.className = `floating-text ${colorClass}`;
    el.textContent = text;
    document.getElementById("floating-text-container").appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

function screenShake() {
    const container = document.getElementById("main-container");
    container.classList.add("shake-effect");
    setTimeout(() => container.classList.remove("shake-effect"), 300);
}

function updateUI() {
    document.getElementById("coins-game").textContent = coins.toLocaleString();
    document.getElementById("tokens-game").textContent = tokens;
    document.getElementById("lvl-num").textContent = currentLevel;
    document.getElementById("p1-hp").style.width = (p1HP / upgrades.hp * 100) + "%";
    document.getElementById("p2-hp").style.width = (p2HP / 100 * 100) + "%";
    
    // Show prestige button at 1M coins
    if (coins >= 1000000 && prestigeCount === 0) {
        document.getElementById("prestige-btn").style.display = "block";
    }
    
    // Render Hall of Fame
    const hall = document.getElementById("hall-list");
    if (hall) {
        hall.innerHTML = legacy.map(run => `<div class="list-item">🏅 Lvl ${run.lvl} - ${run.coins.toLocaleString()} coins (${run.date})</div>`).join('');
    }
    
    // Render Achievements
    const achievementList = document.getElementById("achievement-list");
    if (achievementList) {
        achievementList.innerHTML = achievements.map(ach => `<div class="list-item">🏆 ${ach}</div>`).join('') || '<p>No achievements yet</p>';
    }
    
    localStorage.setItem("coins", coins);
    localStorage.setItem("level", currentLevel);
    localStorage.setItem("tokens", tokens);
    localStorage.setItem("upgrades", JSON.stringify(upgrades));
}

function showTab(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.getElementById(`tab-${tab}`).style.display = 'block';
}

function unlockAchievement(name) {
    if (!achievements.includes(name)) {
        achievements.push(name);
        localStorage.setItem("achievements", JSON.stringify(achievements));
        showFloatingText(`🏆 ACHIEVEMENT: ${name}`, "gold");
    }
}

function handleSimpleLogin() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) new AudioContext().resume();
    sounds.bgm.play().catch(() => {});
    document.getElementById("home-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "block";
    document.getElementById("game-nav").style.display = "flex";
    showTab('arena');
    updateUI();
}

function triggerLevelUp() {
    sounds.levelUp.play();
    showFloatingText(`Level Up! You reached Level ${currentLevel}!`, "gold");
}

function logout() { location.reload(); }

document.getElementById("roll-std").onclick = () => startBattle('std');
document.getElementById("roll-bsk").onclick = () => startBattle('bsk');
updateUI();
