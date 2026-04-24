let coins = Number(localStorage.getItem("coins")) || 1000;
let tokens = Number(localStorage.getItem("tokens")) || 0;
let currentLevel = Number(localStorage.getItem("level")) || 1;
let prestigeCount = Number(localStorage.getItem("prestige")) || 0;
let upgrades = JSON.parse(localStorage.getItem("upgrades")) || { hp: 100, luck: 0 };

let p1HP = upgrades.hp, p2HP = 100;

// AUDIO PATHS FIXED (ROOT FOLDER)
const sounds = {
    roll: new Audio('dice_roll.mp3'),
    win: new Audio('win_ding.mp3'),
    lose: new Audio('lose_thud.mp3'),
    ambient: new Audio('ambient_synth.mp3')
};
sounds.ambient.loop = true;

function initAudio() {
    Object.values(sounds).forEach(s => {
        s.play().then(() => { s.pause(); s.currentTime = 0; }).catch(() => {});
    });
    sounds.ambient.play();
}

function handleSimpleLogin() {
    initAudio();
    document.getElementById("home-screen").style.display = "none";
    document.getElementById("game-nav").style.display = "flex";
    document.getElementById("game-screen").style.display = "block";
    updateUI();
}

function startBattle(type) {
    const bet = Number(document.getElementById("bet-input").value);
    if (bet > coins) return alert("Not enough coins!");
    
    sounds.roll.play();
    setTimeout(() => {
        let p1 = (type === 'bsk') ? Math.floor(Math.random() * 12) + 1 : Math.floor(Math.random() * 6) + 1;
        let p2 = Math.floor(Math.random() * 6) + 1;

        document.getElementById("dice1").src = `./assets/red-${p1 > 6 ? 6 : p1}.png`;
        document.getElementById("dice2").src = `./assets/green-${p2}.png`;

        if (p1 > p2) {
            p2HP -= 34;
            coins += bet;
            showFloatingText("HIT!", "gold");
            if (p2HP <= 0) { sounds.win.play(); currentLevel++; p2HP = 100; p1HP = upgrades.hp; }
        } else {
            p1HP -= 20;
            coins -= bet;
            showFloatingText("OUCH!", "red");
            if (p1HP <= 0) { sounds.lose.play(); p1HP = upgrades.hp; p2HP = 100; }
        }
        updateUI();
    }, 600);
}

function buyPermanent(type, cost) {
    if (tokens >= cost) {
        tokens -= cost;
        if (type === 'hp') upgrades.hp += 20;
        if (type === 'luck') upgrades.luck += 0.05;
        p1HP = upgrades.hp; 
        localStorage.setItem("upgrades", JSON.stringify(upgrades));
        updateUI();
    } else {
        alert("Need more tokens!");
    }
}

function updateUI() {
    document.getElementById("coins-game").textContent = Math.floor(coins).toLocaleString();
    document.getElementById("tokens-game").textContent = tokens;
    document.getElementById("lvl-num").textContent = currentLevel;
    document.getElementById("p1-hp").style.width = (p1HP / upgrades.hp * 100) + "%";
    document.getElementById("p2-hp").style.width = p2HP + "%";
    localStorage.setItem("coins", coins);
    localStorage.setItem("tokens", tokens);
    localStorage.setItem("level", currentLevel);
}

function showTab(tab) {
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    document.getElementById(`tab-${tab}`).style.display = 'block';
}

function setTheme(t) { document.body.className = t; }

function showFloatingText(t, c) {
    const e = document.createElement("div"); e.className = `floating-text ${c}`; e.textContent = t;
    document.getElementById("floating-text-container").appendChild(e);
    setTimeout(() => e.remove(), 1000);
}
