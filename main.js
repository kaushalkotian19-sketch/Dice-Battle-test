// STATE MANAGEMENT
let coins = Number(localStorage.getItem("coins")) || 1000;
let tokens = Number(localStorage.getItem("tokens")) || 0;
let currentLevel = Number(localStorage.getItem("level")) || 1;
let prestigeCount = Number(localStorage.getItem("prestige")) || 0;
let lastClaim = Number(localStorage.getItem("lastClaim")) || 0;
let upgrades = JSON.parse(localStorage.getItem("upgrades")) || { hp: 100, luck: 0 };
let legacy = JSON.parse(localStorage.getItem("legacy")) || [];

let p1HP = upgrades.hp, p2HP = 100;

// AUDIO SYSTEM
const sounds = {
    roll: new Audio('./assets/roll.mp3'),
    win: new Audio('./assets/win.mp3'),
    lose: new Audio('./assets/lose.mp3')
};

function initAudio() {
    Object.values(sounds).forEach(s => {
        s.play().then(() => { s.pause(); s.currentTime = 0; }).catch(() => {});
    });
}

function handleSimpleLogin() {
    initAudio();
    const nick = document.getElementById("nickname-input").value || "Player";
    document.getElementById("display-username").textContent = nick;
    document.getElementById("home-screen").style.display = "none";
    document.getElementById("game-nav").style.display = "flex";
    document.getElementById("game-screen").style.display = "block";
    updateUI();
}

function startBattle(type) {
    const bet = Number(document.getElementById("bet-input").value);
    const useShield = document.getElementById("shield-active").checked;
    
    if (bet > coins) return alert("Insufficient Coins!");
    if (useShield && coins < (bet + 500)) return alert("Shield requires 500c!");

    if (useShield) coins -= 500;
    sounds.roll.play();

    // DICE LOGIC
    setTimeout(() => {
        let p1 = (type === 'bsk') ? Math.floor(Math.random() * 12) + 1 : Math.floor(Math.random() * 6) + 1;
        if (Math.random() < upgrades.luck) p1 = 6;
        
        let p2 = Math.floor(Math.random() * 6) + 1;
        if (currentLevel % 5 === 0) p2 = Math.max(p2, Math.floor(Math.random() * 6) + 1);

        document.getElementById("dice1").src = `./assets/red-${p1 > 6 ? 6 : p1}.png`;
        document.getElementById("dice2").src = `./assets/green-${p2}.png`;

        if (p1 > p2) {
            let dmg = (p1 === 6 && type === 'std') ? 68 : 34;
            p2HP -= dmg;
            coins += bet * (prestigeCount + 1);
            showFloatingText(dmg === 68 ? "CRITICAL!" : "HIT!", "gold");
        } else if (p2 > p1) {
            let dmgTaken = useShield ? 10 : 20;
            p1HP -= dmgTaken;
            coins -= bet;
            showFloatingText(useShield ? "🛡️ BLOCKED" : "OW!", "red");
        }

        if (p2HP <= 0) handleWin();
        if (p1HP <= 0) handleLoss();
        updateUI();
    }, 600);
}

function handleWin() {
    sounds.win.play();
    if (currentLevel % 5 === 0) tokens += 5;
    currentLevel++;
    p1HP = upgrades.hp; p2HP = 100;
}

function handleLoss() {
    sounds.lose.play();
    p1HP = upgrades.hp; p2HP = 100;
}

function updateUI() {
    document.getElementById("coins-game").textContent = Math.floor(coins).toLocaleString();
    document.getElementById("tokens-game").textContent = tokens;
    document.getElementById("lvl-num").textContent = currentLevel;
    document.getElementById("p1-hp").style.width = (p1HP / upgrades.hp * 100) + "%";
    document.getElementById("p2-hp").style.width = p2HP + "%";
    document.getElementById("multiplier-display").textContent = (prestigeCount + 1) + "x";
    document.getElementById("prestige-btn").style.display = coins >= 1000000 ? "block" : "none";
    
    localStorage.setItem("coins", coins);
    localStorage.setItem("tokens", tokens);
    localStorage.setItem("level", currentLevel);
}

function showTab(tab) {
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    document.getElementById(`tab-${tab}`).style.display = 'block';
}

function setTheme(t) {
    document.body.className = t;
    localStorage.setItem("theme", t);
}

function showFloatingText(t, c) {
    const e = document.createElement("div"); e.className = `floating-text ${c}`; e.textContent = t;
    document.getElementById("floating-text-container").appendChild(e);
    setTimeout(() => e.remove(), 1000);
}
