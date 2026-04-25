let coins = Number(localStorage.getItem("coins")) || 1000;
let tokens = Number(localStorage.getItem("tokens")) || 0;
let level = Number(localStorage.getItem("level")) || 1;
let upgrades = JSON.parse(localStorage.getItem("upgrades")) || { hp: 100, luck: 0, mult: 1 };
let p1HP = upgrades.hp, p2HP = 100;

function enterArena() {
    const nameInput = document.getElementById("nickname-input");
    const name = nameInput.value.trim() || "Warrior";
    document.getElementById("display-username").textContent = name;

    document.getElementById("home-screen").style.display = "none";
    document.getElementById("game-nav").style.display = "flex";
    document.getElementById("game-screen").style.display = "block";
    document.getElementById("wallet").style.display = "flex";
    updateUI();
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`tab-${tabId}`).classList.add('active');
    const activeBtn = document.querySelector(`button[onclick="showTab('${tabId}')"]`);
    if(activeBtn) activeBtn.classList.add('active');
}

function rollDice() {
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;

    // Ensure image filenames match exactly
    document.getElementById("p1-img").src = `red-dice-${d1}.png`;
    document.getElementById("p2-img").src = `green-dice-${d2}.png`;

    if(d1 > d2) {
        document.getElementById("battle-status").textContent = "Victory!";
        coins += 50 * upgrades.mult;
    } else {
        document.getElementById("battle-status").textContent = "Defeat!";
        p1HP -= 10;
    }
    updateUI();
}

function updateUI() {
    document.getElementById("coins-game").textContent = Math.floor(coins);
    document.getElementById("tokens-game").textContent = tokens;
    document.getElementById("lvl-num").textContent = level;
    document.getElementById("mult-display").textContent = upgrades.mult;
    document.getElementById("p1-hp").style.width = (p1HP / upgrades.hp * 100) + "%";
}

function setTheme(t) {
    document.body.className = t;
}
