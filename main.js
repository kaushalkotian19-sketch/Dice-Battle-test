// --- STATE ---
let coins = Number(localStorage.getItem("coins")) || 1000;
let tokens = Number(localStorage.getItem("tokens")) || 0;
let level = Number(localStorage.getItem("level")) || 1;
let upgrades = JSON.parse(localStorage.getItem("upgrades")) || { hp: 100, luck: 0, mult: 1 };
let p1HP = upgrades.hp, p2HP = 100;

// --- AUDIO (Root Path) ---
const sounds = {
    roll: new Audio('dice_roll.mp3'),
    win: new Audio('win_ding.mp3'),
    lose: new Audio('lose_thud.mp3'),
    heartbeat: new Audio('heartbeat.mp3')
};
sounds.heartbeat.loop = true;

// Fix for mobile audio blocking
function unlockAudio() {
    Object.values(sounds).forEach(s => { s.play(); s.pause(); s.currentTime = 0; });
}

// --- NAVIGATION ---
function enterArena() {
    const nick = document.getElementById("nickname-input").value.trim() || "Warrior";
    document.getElementById("display-username").textContent = nick;
    localStorage.setItem("dice_nickname", nick);

    unlockAudio(); // Important for browser sound permission

    document.getElementById("home-screen").style.display = "none";
    document.getElementById("game-nav").style.display = "flex";
    document.getElementById("game-screen").style.display = "block";
    updateUI();
}

function showTab(id) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${id}`).classList.add('active');
}

// --- BATTLE LOGIC ---
function startBattle(mode) {
    const bet = Number(document.getElementById("bet-input").value);
    if (bet > coins) return alert("Low Balance!");

    document.getElementById("battle-status").textContent = "Rolling...";
    sounds.roll.play().catch(() => {});

    setTimeout(() => {
        let p1 = (mode === 'bsk') ? Math.floor(Math.random() * 12) + 1 : Math.floor(Math.random() * 6) + 1;
        let p2 = Math.floor(Math.random() * 6) + 1;

        document.getElementById("dice1").src = `./assets/red-${p1 > 6 ? 6 : p1}.png`;
        document.getElementById("dice2").src = `./assets/green-${p2}.png`;

        if (p1 > p2) {
            let dmg = 34;
            if (Math.random() * 100 < upgrades.luck) {
                dmg = 68;
                showFloatingText("CRITICAL!", "var(--gold)");
            }
            p2HP -= dmg;
            coins += (bet * upgrades.mult);
            if (p2HP <= 0) { sounds.win.play(); level++; p2HP = 100; p1HP = upgrades.hp; }
        } else {
            p1HP -= 20;
            coins -= bet;
            if (p1HP <= 0) { sounds.lose.play(); p1HP = upgrades.hp; p2HP = 100; }
        }

        // Heartbeat Effect
        if (p1HP < (upgrades.hp * 0.3)) sounds.heartbeat.play();
        else sounds.heartbeat.pause();

        updateUI();
    }, 600);
}

// --- SHOP ---
function buyPermanent(type, cost) {
    if (tokens >= cost) {
        tokens -= cost;
        if (type === 'hp') { upgrades.hp += 20; p1HP = upgrades.hp; }
        if (type === 'luck') { upgrades.luck += 5; }
        localStorage.setItem("upgrades", JSON.stringify(upgrades));
        localStorage.setItem("tokens", tokens);
        updateUI();
    }
}

function setTheme(t) {
    document.body.className = t;
    localStorage.setItem("gameTheme", t);
}

function updateUI() {
    document.getElementById("coins-game").textContent = Math.floor(coins).toLocaleString();
    document.getElementById("tokens-game").textContent = tokens;
    document.getElementById("lvl-num").textContent = level;
    document.getElementById("p1-hp").style.width = (p1HP / upgrades.hp * 100) + "%";
    document.getElementById("p2-hp").style.width = p2HP + "%";
    localStorage.setItem("coins", coins);
    localStorage.setItem("level", level);
}

function showFloatingText(txt, clr) {
    const e = document.createElement("div");
    e.className = "floating-text";
    e.textContent = txt;
    e.style.color = clr;
    document.body.appendChild(e);
    setTimeout(() => e.remove(), 1000);
}

window.onload = () => {
    document.body.className = localStorage.getItem("gameTheme") || "default";
};
