let coins = Number(localStorage.getItem("coins")) || 100;
let tokens = Number(localStorage.getItem("tokens")) || 0;
let currentLevel = Number(localStorage.getItem("level")) || 1;
let prestigeCount = Number(localStorage.getItem("prestige")) || 0;
let legacy = JSON.parse(localStorage.getItem("legacy")) || [];
let upgrades = JSON.parse(localStorage.getItem("upgrades")) || { hp: 100, luck: 0 };
let lastClaim = Number(localStorage.getItem("lastClaim")) || 0;

let p1HP = upgrades.hp, p2HP = 100, winStreak = 0;

function setTheme(theme) {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
}

function claimDailyReward() {
    const now = Date.now();
    if (now - lastClaim < 86400000) return alert("Daily Chest is empty!");
    const reward = Math.floor(Math.random() * 9000) + 1000;
    coins += reward;
    localStorage.setItem("lastClaim", now);
    lastClaim = now;
    showFloatingText(`🎁 +${reward}`, "gold");
    updateUI();
}

function startBattle(type) {
    const bet = Number(document.getElementById("bet-input").value);
    const useShield = document.getElementById("shield-active").checked;
    if (bet > coins || bet <= 0) return alert("Invalid Bet!");
    if (useShield && coins < (bet + 500)) return alert("Not enough for Shield!");
    
    if (useShield) coins -= 500;
    const d1 = document.getElementById("dice1"), d2 = document.getElementById("dice2");
    d1.classList.add("dice-rolling"); d2.classList.add("dice-rolling");

    setTimeout(() => {
        d1.classList.remove("dice-rolling"); d2.classList.remove("dice-rolling");
        let p1 = (type === 'bsk') ? Math.floor(Math.random() * 12) + 1 : Math.floor(Math.random() * 6) + 1;
        if (Math.random() < upgrades.luck) p1 = 6;
        let p2 = (currentLevel % 5 === 0) ? Math.max(Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1) : Math.floor(Math.random() * 6) + 1;

        // Boss Enrage Level 20
        if (currentLevel >= 20 && p2HP <= 25) p2 = Math.max(p2, Math.floor(Math.random() * 6) + 1);

        d1.src = `./assets/red-${p1 > 6 ? 6 : p1}.png`;
        d2.src = `./assets/green-${p2}.png`;

        if (p1 > p2) {
            let dmg = (p1 === 6 && type === 'std') ? 68 : 34;
            p2HP -= dmg;
            coins += bet * (prestigeCount + 1);
            if (dmg === 68) showFloatingText("CRITICAL!", "gold");
            screenShake();
        } else if (p2 > p1) {
            let dmgTaken = useShield ? 10 : 20;
            p1HP -= dmgTaken;
            coins -= bet;
            if (useShield) showFloatingText("🛡️ BLOCKED", "blue");
        }
        if (p2HP <= 0) handleWin();
        if (p1HP <= 0) { p1HP = upgrades.hp; p2HP = 100; winStreak = 0; }
        updateUI();
    }, 600);
}

function handleWin() {
    if (currentLevel % 5 === 0) tokens += 5;
    currentLevel++; p1HP = upgrades.hp; p2HP = 100;
    updateUI();
}

function updateUI() {
    document.getElementById("coins-game").textContent = coins.toLocaleString();
    document.getElementById("tokens-game").textContent = tokens;
    document.getElementById("lvl-num").textContent = currentLevel;
    document.getElementById("p1-hp").style.width = (p1HP / upgrades.hp * 100) + "%";
    document.getElementById("p2-hp").style.width = p2HP + "%";
    document.getElementById("multiplier-display").textContent = (prestigeCount + 1) + "x";
    document.getElementById("prestige-btn").style.display = coins >= 1000000 ? "block" : "none";
    
    const hall = document.getElementById("hall-list");
    hall.innerHTML = legacy.map(r => `<div class="list-item">🏆 Lvl ${r.lvl} (${r.date})</div>`).join('');
    
    localStorage.setItem("coins", coins);
    localStorage.setItem("tokens", tokens);
    localStorage.setItem("level", currentLevel);
}

function showTab(tab) {
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    document.getElementById(`tab-${tab}`).style.display = 'block';
}

function handleSimpleLogin() {
    document.getElementById("home-screen").style.display = "none";
    document.getElementById("game-nav").style.display = "flex";
    document.getElementById("game-screen").style.display = "block";
    setTheme(activeTheme);
    updateUI();
}

function showFloatingText(t, c) {
    const e = document.createElement("div"); e.className = `floating-text ${c}`; e.textContent = t;
    document.getElementById("floating-text-container").appendChild(e);
    setTimeout(() => e.remove(), 1000);
}

function screenShake() {
    const c = document.getElementById("main-container"); c.classList.add("shake");
    setTimeout(() => c.classList.remove("shake"), 300);
}
