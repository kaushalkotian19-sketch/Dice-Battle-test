// --- STATE & STORAGE ---
let coins = Number(localStorage.getItem("coins")) || 1000;
let tokens = Number(localStorage.getItem("tokens")) || 0;
let level = Number(localStorage.getItem("level")) || 1;
let upgrades = JSON.parse(localStorage.getItem("upgrades")) || { hp: 100, luck: 0, mult: 1 };
let p1HP = upgrades.hp, p2HP = 100;

const sounds = {
    roll: new Audio('dice_roll.mp3'),
    win: new Audio('win_ding.mp3'),
    lose: new Audio('lose_thud.mp3'),
    heartbeat: new Audio('heartbeat.mp3')
};
sounds.heartbeat.loop = true;

// --- CORE NAVIGATION ---
function enterArena() {
    const name = document.getElementById("nickname-input").value.trim() || "Warrior";
    localStorage.setItem("dice_nickname", name);
    document.getElementById("display-username").textContent = name;

    document.getElementById("home-screen").style.display = "none";
    document.getElementById("game-nav").style.display = "flex";
    document.getElementById("game-screen").style.display = "block";
    document.getElementById("wallet").style.display = "flex";

    unlockAudio();
    updateUI();
    renderLeaderboard();
}

function showTab(id) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${id}`).classList.add('active');
}

// --- BATTLE LOGIC ---
function startBattle(mode) {
    const bet = Math.floor(Number(document.getElementById("bet-input").value));
    if (isNaN(bet) || bet <= 0) return alert("Invalid bet!");
    if (coins < bet) return alert("Balance not enough!");

    // Start Juice
    document.querySelectorAll(".dice-space img").forEach(img => img.classList.add("shake"));
    document.getElementById("battle-status").textContent = "Rolling...";
    sounds.roll.play().catch(() => {});

    setTimeout(() => {
        document.querySelectorAll(".dice-space img").forEach(img => img.classList.remove("shake"));
        
        let p1 = (mode === 'bsk') ? Math.floor(Math.random() * 12) + 1 : Math.floor(Math.random() * 6) + 1;
        let p2 = Math.floor(Math.random() * 6) + 1;

        document.getElementById("dice1").src = `./assets/red-${p1 > 6 ? 6 : p1}.png`;
        document.getElementById("dice2").src = `./assets/green-${p2}.png`;

        if (p1 > p2) {
            let dmg = 34;
            if (Math.random() * 100 < upgrades.luck) {
                dmg = 68;
                showFloatingText("CRITICAL!", "#fbbf24");
            }
            p2HP -= dmg;
            coins += (bet * upgrades.mult);
            if (p2HP <= 0) { sounds.win.play(); level++; tokens += 2; p2HP = 100; p1HP = upgrades.hp; }
        } else {
            p1HP -= 20;
            coins -= bet;
            if (p1HP <= 0) { sounds.lose.play(); p1HP = upgrades.hp; p2HP = 100; }
        }
        updateUI();
        updateLeaderboard();
    }, 600);
}

// --- SYSTEMS (DAILY, SHOP, HALL) ---
function claimDaily() {
    const last = localStorage.getItem("lastDaily");
    const now = Date.now();
    if (last && (now - last < 86400000)) {
        return alert("Daily Reward already claimed! Wait 24h.");
    }
    const reward = Math.floor(Math.random() * 151) + 50;
    coins += reward;
    localStorage.setItem("lastDaily", now);
    showFloatingText(`+${reward} Coins!`, "#fbbf24");
    updateUI();
}

function buyPermanent(type) {
    const cost = (type === 'hp') ? 10 : 25;
    if (tokens < cost) return alert("Tokens not enough!");
    tokens -= cost;
    if (type === 'hp') { upgrades.hp += 20; p1HP = upgrades.hp; }
    else { upgrades.luck += 5; }
    save();
    updateUI();
}

function handlePrestige() {
    if (level < 50) return alert("Reach Level 50 to Prestige!");
    level = 1; upgrades.mult += 0.5; coins = 1000;
    save(); updateUI();
}

// --- UTILS ---
function updateUI() {
    document.getElementById("coins-game").textContent = Math.floor(coins).toLocaleString();
    document.getElementById("tokens-game").textContent = tokens;
    document.getElementById("lvl-num").textContent = level;
    document.getElementById("mult-display").textContent = upgrades.mult;
    document.getElementById("p1-hp").style.width = (p1HP / upgrades.hp * 100) + "%";
    document.getElementById("p2-hp").style.width = p2HP + "%";
    save();
}

function updateLeaderboard() {
    let high = localStorage.getItem("highScore") || 0;
    if (coins > high) {
        localStorage.setItem("highScore", Math.floor(coins));
        renderLeaderboard();
    }
}

function renderLeaderboard() {
    const ui = document.getElementById("leaderboard-ui");
    const high = localStorage.getItem("highScore") || 0;
    const nick = localStorage.getItem("dice_nickname") || "Warrior";
    ui.innerHTML = `
        <div class="rank-item"><span>🏆 Personal Best</span><span>${Number(high).toLocaleString()}</span></div>
        <div class="rank-item"><span>👤 Champion</span><span>${nick}</span></div>
    `;
}

function save() {
    localStorage.setItem("coins", coins);
    localStorage.setItem("tokens", tokens);
    localStorage.setItem("level", level);
    localStorage.setItem("upgrades", JSON.stringify(upgrades));
}

function setTheme(t) { document.body.className = t; localStorage.setItem("gameTheme", t); }
function showFloatingText(t, c) {
    const e = document.createElement("div"); e.className = "floating-text";
    e.textContent = t; e.style.color = c; document.body.appendChild(e);
    setTimeout(() => e.remove(), 1000);
}
function unlockAudio() { Object.values(sounds).forEach(s => { s.play(); s.pause(); s.currentTime = 0; }); }

window.onload = () => { document.body.className = localStorage.getItem("gameTheme") || "default"; };
