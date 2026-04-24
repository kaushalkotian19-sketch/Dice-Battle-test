let coins = Number(localStorage.getItem("coins")) || 100;
let tokens = Number(localStorage.getItem("tokens")) || 0;
let currentLevel = Number(localStorage.getItem("level")) || 1;
let bossesDefeated = Number(localStorage.getItem("bosses")) || 0;
let winStreak = 0;
let p1HP = 100;
let p2HP = 100;
let isBossLevel = false;

const sounds = {
    bgm: new Audio('ambient_synth.mp3'),
    roll: new Audio('dice_roll.mp3'),
    win: new Audio('win_ding.mp3'),
    lose: new Audio('lose_thud.mp3'),
    berserkHype: new Audio('heartbeat.mp3'),
    levelUp: new Audio('level_up.mp3')
};
sounds.bgm.loop = true;
sounds.bgm.volume = 0.3;

function handleSimpleLogin() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) new AudioContext().resume();
    sounds.bgm.play().catch(() => {});
    
    const nameInput = document.getElementById("username-input").value;
    if (!nameInput) return alert("Enter a name!");
    
    localStorage.setItem("username", nameInput);
    document.getElementById("display-username").textContent = nameInput;
    document.getElementById("home-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "block";
    checkBossStatus();
    updateUI();
}

function checkBossStatus() {
    isBossLevel = (currentLevel % 5 === 0);
    document.getElementById("boss-warning").style.display = isBossLevel ? "block" : "none";
    document.getElementById("p2-label").textContent = isBossLevel ? "🔥 BOSS 🔥" : "OPPONENT";
    document.body.classList.toggle("boss-theme", isBossLevel);
}

function startBattle(type) {
    const bet = Number(document.getElementById("bet-input").value);
    if (bet <= 0 || bet > coins) return alert("Insufficient Balance!");

    sounds.roll.play();
    document.querySelectorAll(".dice-space img").forEach(d => d.classList.add("dice-rolling"));

    setTimeout(() => {
        document.querySelectorAll(".dice-space img").forEach(d => d.classList.remove("dice-rolling"));
        
        let p1 = (type === 'bsk') ? Math.floor(Math.random() * 12) + 1 : Math.floor(Math.random() * 6) + 1;
        let p2 = isBossLevel ? Math.max(Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1) : Math.floor(Math.random() * 6) + 1;

        document.getElementById("dice1").src = `./assets/red-${p1 > 6 ? 6 : p1}.png`;
        document.getElementById("dice2").src = `./assets/green-${p2}.png`;
        document.getElementById("score1").textContent = p1;
        document.getElementById("score2").textContent = p2;

        if (p1 > p2) {
            winStreak++;
            p2HP -= isBossLevel ? 20 : 34;
            coins += (winStreak >= 3 ? bet * 2 : bet);
            sounds.win.play();
            document.getElementById("battle-msg").textContent = "VICTORY!";
        } else if (p2 > p1) {
            winStreak = 0;
            p1HP -= isBossLevel ? 35 : 20;
            coins -= bet;
            sounds.lose.play();
            document.getElementById("battle-msg").textContent = "DEFEAT!";
        } else {
            document.getElementById("battle-msg").textContent = "DRAW!";
        }

        if (p2HP <= 0) {
            if (isBossLevel) { bossesDefeated++; tokens += 5; }
            currentLevel++; p1HP = 100; p2HP = 100;
            triggerLevelUp();
        } else if (p1HP <= 0) {
            alert("Game Over! HP Restored.");
            p1HP = 100; p2HP = 100; winStreak = 0;
        }
        updateUI();
    }, 700);
}

function updateUI() {
    // Rank System
    let rank = "NOVICE";
    let color = "#64748b";
    if (coins > 5000) { rank = "HUSTLER"; color = "#0ea5e9"; }
    if (coins > 50000) { rank = "WHALE"; color = "#a855f7"; }
    if (coins > 500000) { rank = "LEGEND"; color = "#eab308"; }
    if (bossesDefeated >= 10) { rank = "SLAYER"; color = "#ef4444"; }

    const tag = document.getElementById("rank-tag");
    tag.textContent = rank;
    tag.style.background = color;

    document.getElementById("coins-game").textContent = coins.toLocaleString();
    document.getElementById("tokens-game").textContent = tokens;
    document.getElementById("lvl-num").textContent = currentLevel;
    document.getElementById("win-streak").textContent = winStreak;
    document.getElementById("boss-count").textContent = bossesDefeated;
    document.getElementById("p1-hp").style.width = p1HP + "%";
    document.getElementById("p2-hp").style.width = p2HP + "%";
    document.getElementById("multiplier").textContent = winStreak >= 3 ? "2x 🔥" : "1x";

    localStorage.setItem("coins", coins);
    localStorage.setItem("level", currentLevel);
    localStorage.setItem("bosses", bossesDefeated);
    localStorage.setItem("tokens", tokens);
    checkBossStatus();
}

function triggerLevelUp() {
    sounds.levelUp.play();
    document.getElementById("celebration-title").textContent = isBossLevel ? "BOSS DEFEATED!" : "LEVEL UP!";
    document.getElementById("new-lvl").textContent = currentLevel;
    document.getElementById("celebration-overlay").style.display = "flex";
}

function closeOverlay() { document.getElementById("celebration-overlay").style.display = "none"; }
function logout() { location.reload(); }
document.getElementById("roll-std").onclick = () => startBattle('std');
document.getElementById("roll-bsk").onclick = () => startBattle('bsk');

// Initial Sync
updateUI();
