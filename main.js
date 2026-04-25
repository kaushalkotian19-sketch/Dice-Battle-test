// --- INITIAL STATE ---
// Ensure we always have numbers to prevent NaN
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

function unlockAudio() {
    Object.values(sounds).forEach(s => { s.play(); s.pause(); s.currentTime = 0; });
}

// --- BATTLE LOGIC ---
function startBattle(mode) {
    const betInput = document.getElementById("bet-input");
    const bet = Math.floor(Number(betInput.value));

    // Fix NaN: Validate bet and balance
    if (isNaN(bet) || bet <= 0) return alert("Enter a valid bet amount!");
    if (coins < bet) return alert("Balance not enough!");

    document.getElementById("battle-status").textContent = "Rolling...";
    sounds.roll.play().catch(() => {});

    setTimeout(() => {
        let p1 = (mode === 'bsk') ? Math.floor(Math.random() * 12) + 1 : Math.floor(Math.random() * 6) + 1;
        let p2 = Math.floor(Math.random() * 6) + 1;

        document.getElementById("dice1").src = `./assets/red-${p1 > 6 ? 6 : p1}.png`;
        document.getElementById("dice2").src = `./assets/green-${p2}.png`;

        if (p1 > p2) {
            let dmg = 34;
            // Crit Luck Logic
            if (Math.random() * 100 < upgrades.luck) {
                dmg = 68;
                showFloatingText("CRITICAL!", "#fbbf24");
            }
            p2HP -= dmg;
            coins += (bet * upgrades.mult);
            
            if (p2HP <= 0) { 
                sounds.win.play(); 
                level++; 
                tokens += 2; // Reward tokens for leveling
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

// --- PERMANENT SHOP LOGIC ---
function buyPermanent(type) {
    let cost = (type === 'hp') ? 10 : 25;
    
    if (tokens < cost) {
        return alert("Low balance! You need more Tokens.");
    }

    tokens -= cost;
    if (type === 'hp') {
        upgrades.hp += 20;
        p1HP = upgrades.hp;
        showFloatingText("+20 HP!", "#ef4444");
    } else if (type === 'luck') {
        upgrades.luck += 5;
        showFloatingText("+5% LUCK!", "#22c55e");
    }

    saveAndRefresh();
}

// Prestige Logic: Reset level for multiplier
function handlePrestige() {
    if (level < 50) {
        return alert("Requirement: Reach LVL 50 to Prestige!");
    }
    
    level = 1;
    upgrades.mult += 0.5;
    coins = 1000;
    showFloatingText("PRESTIGED!", "#a855f7");
    saveAndRefresh();
}

function saveAndRefresh() {
    localStorage.setItem("upgrades", JSON.stringify(upgrades));
    localStorage.setItem("tokens", tokens);
    localStorage.setItem("coins", coins);
    localStorage.setItem("level", level);
    updateUI();
}

function updateUI() {
    // Force numbers to prevent NaN display
    document.getElementById("coins-game").textContent = Math.floor(coins).toLocaleString();
    document.getElementById("tokens-game").textContent = Math.floor(tokens);
    document.getElementById("lvl-num").textContent = level;
    
    document.getElementById("p1-hp").style.width = (p1HP / upgrades.hp * 100) + "%";
    document.getElementById("p2-hp").style.width = p2HP + "%";
    
    // Manage heartbeat sound
    if (p1HP < (upgrades.hp * 0.3) && p1HP > 0) sounds.heartbeat.play().catch(() => {});
    else sounds.heartbeat.pause();
}
