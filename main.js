// --- STATE MANAGEMENT ---
let coins = Number(localStorage.getItem("coins")) || 1000;
let tokens = Number(localStorage.getItem("tokens")) || 0;
let level = Number(localStorage.getItem("level")) || 1;
let upgrades = JSON.parse(localStorage.getItem("upgrades")) || { hp: 100, luck: 0, mult: 1 };
let p1HP = upgrades.hp, p2HP = 100;

// --- AUDIO ASSETS ---
const sounds = {
    roll: new Audio('dice_roll.mp3'),
    win: new Audio('win_ding.mp3'),
    lose: new Audio('lose_thud.mp3'),
    heartbeat: new Audio('heartbeat.mp3')
};
sounds.heartbeat.loop = true;

// Unlocks audio for mobile browsers upon interaction
function unlockAudio() {
    Object.values(sounds).forEach(s => { 
        s.play().then(() => { s.pause(); s.currentTime = 0; }).catch(() => {}); 
    });
}

// --- LOGIN & NAVIGATION ---
function enterArena() {
    const nameInput = document.getElementById("nickname-input");
    const name = nameInput.value.trim() || "Warrior";

    localStorage.setItem("dice_nickname", name);
    document.getElementById("display-username").textContent = name;

    // Show game elements
    document.getElementById("home-screen").style.display = "none";
    document.getElementById("game-nav").style.display = "flex";
    document.getElementById("game-screen").style.display = "block";
    document.getElementById("wallet").style.display = "flex";

    unlockAudio();
    updateUI();
}

function showTab(id) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${id}`).classList.add('active');
}

// --- BATTLE SYSTEM ---
function startBattle(mode) {
    const bet = Math.floor(Number(document.getElementById("bet-input").value));

    // Validation to prevent NaN errors
    if (isNaN(bet) || bet <= 0) return alert("Enter a valid bet!");
    if (coins < bet) return alert("Balance not enough!");

    document.getElementById("battle-status").textContent = "Rolling...";
    sounds.roll.play().catch(() => {});

    setTimeout(() => {
        let p1 = (mode === 'bsk') ? Math.floor(Math.random() * 12) + 1 : Math.floor(Math.random() * 6) + 1;
        let p2 = Math.floor(Math.random() * 6) + 1;

        // Visual dice update
        document.getElementById("dice1").src = `./assets/red-${p1 > 6 ? 6 : p1}.png`;
        document.getElementById("dice2").src = `./assets/green-${p2}.png`;

        if (p1 > p2) {
            let dmg = 34;
            // Critical Luck logic
            if (Math.random() * 100 < upgrades.luck) {
                dmg = 68;
                showFloatingText("CRITICAL!", "#fbbf24");
            }
            p2HP -= dmg;
            coins += (bet * upgrades.mult);
            
            if (p2HP <= 0) { 
                sounds.win.play(); 
                level++; 
                tokens += 2; 
                p2HP = 100; 
                p1HP = upgrades.hp; 
            }
        } else {
            p1HP -= 20;
            coins -= bet;
            if (p1HP <= 0) { 
                sounds.lose.play(); 
                p1HP = upgrades.hp; 
                p2HP = 100; 
            }
        }

        updateUI();
    }, 600);
}

// --- PERMANENT SHOP & PRESTIGE ---
function buyPermanent(type) {
    const cost = (type === 'hp') ? 10 : 25;
    
    if (tokens < cost) return alert("Balance not enough! You need more Tokens.");

    tokens -= cost;
    if (type === 'hp') {
        upgrades.hp += 20;
        p1HP = upgrades.hp;
    } else if (type === 'luck') {
        upgrades.luck += 5;
    }

    saveData();
    updateUI();
}

function handlePrestige() {
    if (level < 50) return alert("Requirement: Reach LVL 50!");
    
    level = 1;
    upgrades.mult += 0.5;
    coins = 1000;
    saveData();
    updateUI();
}

function saveData() {
    localStorage.setItem("upgrades", JSON.stringify(upgrades));
    localStorage.setItem("tokens", tokens);
    localStorage.setItem("coins", coins);
    localStorage.setItem("level", level);
}

function setTheme(t) {
    document.body.className = t;
    localStorage.setItem("gameTheme", t);
}

function updateUI() {
    document.getElementById("coins-game").textContent = Math.floor(coins).toLocaleString();
    document.getElementById("tokens-game").textContent = Math.floor(tokens);
    document.getElementById("lvl-num").textContent = level;
    document.getElementById("mult-display").textContent = upgrades.mult;
    
    document.getElementById("p1-hp").style.width = (p1HP / upgrades.hp * 100) + "%";
    document.getElementById("p2-hp").style.width = p2HP + "%";
    
    if (p1HP < (upgrades.hp * 0.3) && p1HP > 0) sounds.heartbeat.play().catch(() => {});
    else sounds.heartbeat.pause();
    
    saveData();
}

function showFloatingText(txt, clr) {
    const div = document.createElement("div");
    div.className = "floating-text";
    div.textContent = txt;
    div.style.color = clr;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 1000);
}

window.onload = () => {
    document.body.className = localStorage.getItem("gameTheme") || "default";
};
