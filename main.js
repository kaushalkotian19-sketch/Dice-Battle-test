// --- INITIAL STATE & PERSISTENCE ---
let coins = Number(localStorage.getItem("coins")) || 1000;
let tokens = Number(localStorage.getItem("tokens")) || 0;
let level = Number(localStorage.getItem("level")) || 1;
let upgrades = JSON.parse(localStorage.getItem("upgrades")) || { hp: 100, luck: 0, mult: 1 };
let p1HP = upgrades.hp, p2HP = 100;

// Audio Setup (Ensure these files exist in your /assets folder)
const sounds = {
    roll: new Audio('./assets/dice_roll.mp3'),
    win: new Audio('./assets/win_ding.mp3'),
    lose: new Audio('./assets/lose_thud.mp3'),
    heartbeat: new Audio('./assets/heartbeat.mp3')
};
sounds.heartbeat.loop = true;

// --- CORE FUNCTIONS ---

function enterArena() {
    const nick = document.getElementById("nickname-input").value.trim() || "Warrior";
    document.getElementById("display-username").textContent = nick;
    localStorage.setItem("dice_nickname", nick);

    document.getElementById("home-screen").style.display = "none";
    document.getElementById("game-nav").style.display = "flex";
    document.getElementById("game-screen").style.display = "block";
    updateUI();
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
}

function startBattle(mode) {
    const bet = Number(document.getElementById("bet-input").value);
    if (bet > coins) return alert("Insufficient Coins!");

    document.getElementById("battle-status").textContent = "Rolling...";
    sounds.roll.play();

    setTimeout(() => {
        // Roll Logic
        let p1 = (mode === 'bsk') ? Math.floor(Math.random() * 12) + 1 : Math.floor(Math.random() * 6) + 1;
        let p2 = Math.floor(Math.random() * 6) + 1;

        // Visuals
        document.getElementById("dice1").src = `./assets/red-${p1 > 6 ? 6 : p1}.png`;
        document.getElementById("dice2").src = `./assets/green-${p2}.png`;

        if (p1 > p2) {
            let dmg = 34;
            // Critical Strike Check
            if (Math.random() * 100 < upgrades.luck) {
                dmg = 68;
                showFloatingText("CRITICAL!", "var(--gold)");
            }
            p2HP -= dmg; 
            coins += (bet * upgrades.mult);
            document.getElementById("battle-status").textContent = "Victory!";
            
            if (p2HP <= 0) { 
                sounds.win.play(); 
                level++; 
                p2HP = 100; 
                p1HP = upgrades.hp; 
            }
        } else {
            p1HP -= 20; 
            coins -= bet;
            document.getElementById("battle-status").textContent = "Defeat...";
            if (p1HP <= 0) { 
                sounds.lose.play(); 
                p1HP = upgrades.hp; 
                p2HP = 100; 
            }
        }
        
        // Critical Health Audio
        if (p1HP < (upgrades.hp * 0.3)) sounds.heartbeat.play();
        else sounds.heartbeat.pause();

        updateUI();
    }, 600);
}

function buyPermanent(type, cost) {
    if (tokens >= cost) {
        tokens -= cost;
        if (type === 'hp') { upgrades.hp += 20; p1HP = upgrades.hp; }
        if (type === 'luck') { upgrades.luck += 5; }
        
        localStorage.setItem("upgrades", JSON.stringify(upgrades));
        localStorage.setItem("tokens", tokens);
        showFloatingText("LEVEL UP!", "white");
        updateUI();
    } else {
        alert("Need more Tokens!");
    }
}

function setTheme(theme) {
    document.body.className = theme;
    localStorage.setItem("gameTheme", theme);
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

function showFloatingText(text, color) {
    const el = document.createElement("div");
    el.className = "floating-text";
    el.textContent = text;
    el.style.color = color;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

// Auto-load Theme on Start
window.onload = () => {
    const savedTheme = localStorage.getItem("gameTheme") || "default";
    document.body.className = savedTheme;
};
