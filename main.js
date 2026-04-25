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

function startBattle(type) {
    const bet = Number(document.getElementById("bet-input").value);
    if (bet > coins) return alert("Not enough coins!");

    document.getElementById("battle-status").textContent = "Rolling...";
    sounds.roll.play();

    setTimeout(() => {
        let p1 = (type === 'bsk') ? Math.floor(Math.random() * 12) + 1 : Math.floor(Math.random() * 6) + 1;
        let p2 = Math.floor(Math.random() * 6) + 1;

        document.getElementById("dice1").src = `./assets/red-${p1 > 6 ? 6 : p1}.png`;
        document.getElementById("dice2").src = `./assets/green-${p2}.png`;

        if (p1 > p2) {
            let dmg = 34;
            // Critical Strike Logic
            if (Math.random() * 100 < upgrades.luck) {
                dmg = 68;
                showFloatingText("CRITICAL!", "gold");
            }
            p2HP -= dmg; 
            coins += (bet * upgrades.mult);
            if (p2HP <= 0) { 
                sounds.win.play(); level++; 
                p2HP = 100; p1HP = upgrades.hp; 
            }
        } else {
            p1HP -= 20; coins -= bet;
            if (p1HP <= 0) { sounds.lose.play(); p1HP = upgrades.hp; p2HP = 100; }
        }
        
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
        updateUI();
        showFloatingText("UPGRADED", "white");
    }
}

function updateUI() {
    document.getElementById("coins-game").textContent = Math.floor(coins).toLocaleString();
    document.getElementById("tokens-game").textContent = tokens;
    document.getElementById("lvl-num").textContent = level;
    document.getElementById("user-rank-val").textContent = "LVL " + level;
    document.getElementById("mult-val").textContent = upgrades.mult + "x";
    document.getElementById("p1-hp").style.width = (p1HP / upgrades.hp * 100) + "%";
    document.getElementById("p2-hp").style.width = p2HP + "%";
    localStorage.setItem("coins", coins);
    localStorage.setItem("level", level);
}

function showTab(t) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.getElementById(`tab-${t}`).style.display = 'flex';
}

function setTheme(t) {
    document.body.className = t;
    localStorage.setItem("gameTheme", t);
}

function showFloatingText(t, c) {
    const e = document.createElement("div"); e.className = `floating-text ${c}`; e.textContent = t;
    document.getElementById("floating-text-container").appendChild(e);
    setTimeout(() => e.remove(), 1000);
}
