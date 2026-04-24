let coins = Number(localStorage.getItem("coins")) || 1000;
let tokens = Number(localStorage.getItem("tokens")) || 0;
let currentLevel = Number(localStorage.getItem("level")) || 1;
let upgrades = JSON.parse(localStorage.getItem("upgrades")) || { hp: 100 };
let currentTheme = localStorage.getItem("gameTheme") || "default";

let p1HP = upgrades.hp, p2HP = 100;
document.body.className = currentTheme;

const sounds = {
    roll: new Audio('dice_roll.mp3'),
    win: new Audio('win_ding.mp3'),
    lose: new Audio('lose_thud.mp3'),
    heartbeat: new Audio('heartbeat.mp3') // RESTORED
};
sounds.heartbeat.loop = true;

function handleSimpleLogin() {
    const nick = document.getElementById("nickname-input").value || "Player";
    document.getElementById("display-username").textContent = nick;
    document.getElementById("home-screen").style.display = "none";
    document.getElementById("game-nav").style.display = "flex";
    document.getElementById("game-screen").style.display = "block";
    updateUI();
}

function startBattle(type) {
    const bet = Number(document.getElementById("bet-input").value);
    if (bet > coins) return alert("Low Coins!");

    document.getElementById("battle-status").textContent = "Rolling...";
    sounds.roll.play();

    setTimeout(() => {
        let p1 = (type === 'bsk') ? Math.floor(Math.random() * 12) + 1 : Math.floor(Math.random() * 6) + 1;
        let p2 = Math.floor(Math.random() * 6) + 1;

        document.getElementById("dice1").src = `./assets/red-${p1 > 6 ? 6 : p1}.png`;
        document.getElementById("dice2").src = `./assets/green-${p2}.png`;

        if (p1 > p2) {
            p2HP -= 34; coins += bet;
            if (p2HP <= 0) { sounds.win.play(); currentLevel++; p2HP = 100; p1HP = upgrades.hp; }
        } else {
            p1HP -= 20; coins -= bet;
            if (p1HP <= 0) { sounds.lose.play(); p1HP = upgrades.hp; p2HP = 100; }
        }
        
        // HEARTBEAT LOGIC
        if (p1HP < (upgrades.hp * 0.3)) { sounds.heartbeat.play(); } 
        else { sounds.heartbeat.pause(); }

        updateUI();
        document.getElementById("battle-status").textContent = "Ready to Battle?";
    }, 600);
}

function buyPermanent(type, cost) {
    if (tokens >= cost) {
        tokens -= cost;
        if (type === 'hp') { upgrades.hp += 20; p1HP = upgrades.hp; }
        localStorage.setItem("upgrades", JSON.stringify(upgrades));
        localStorage.setItem("tokens", tokens);
        updateUI();
    }
}

function updateUI() {
    document.getElementById("coins-game").textContent = Math.floor(coins).toLocaleString();
    document.getElementById("tokens-game").textContent = tokens;
    document.getElementById("lvl-num").textContent = currentLevel;
    document.getElementById("p1-hp").style.width = (p1HP / upgrades.hp * 100) + "%";
    document.getElementById("p2-hp").style.width = p2HP + "%";
    localStorage.setItem("coins", coins);
}

function showTab(t) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    document.getElementById(`tab-${t}`).style.display = 'flex';
}

function setTheme(t) { document.body.className = t; localStorage.setItem("gameTheme", t); }
