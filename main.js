let coins = Number(localStorage.getItem("coins")) || 100;
let tokens = Number(localStorage.getItem("tokens")) || 0;
let winStreak = 0;
let currentLevel = Number(localStorage.getItem("level")) || 1;
let bossesDefeated = Number(localStorage.getItem("bosses")) || 0;
let p1HP = 100;
let p2HP = 100;
let isBossLevel = false;

const sounds = {
    bgm: new Audio('ambient_synth.mp3'),
    roll: new Audio('dice_roll.mp3'),
    win: new Audio('win_ding.mp3'),
    lose: new Audio('lose_thud.mp3'),
    berserkHype: new Audio('heartbeat.mp3'),
    levelUp: new Audio('level_up.mp3'),
    bossIntro: new Audio('lose_thud.mp3') // Reuse or add new boss sound
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
    const warning = document.getElementById("boss-warning");
    const p2Label = document.getElementById("p2-label");
    const body = document.body;

    if (isBossLevel) {
        warning.style.display = "block";
        p2Label.textContent = "🔥 BOSS 🔥";
        body.classList.add("boss-theme");
        sounds.bgm.playbackRate = 0.8; // Slow down music for boss feel
    } else {
        warning.style.display = "none";
        p2Label.textContent = "OPPONENT";
        body.classList.remove("boss-theme");
        sounds.bgm.playbackRate = 1.0;
    }
}

function startBattle(type) {
    const bet = Number(document.getElementById("bet").value);
    if (bet <= 0 || bet > coins) return alert("Check bet!");

    sounds.roll.play();
    document.querySelectorAll(".dice img").forEach(d => d.classList.add("dice-rolling"));

    setTimeout(() => {
        document.querySelectorAll(".dice img").forEach(d => d.classList.remove("dice-rolling"));
        
        let p1 = (type === 'berserk') ? Math.floor(Math.random() * 12) + 1 : Math.floor(Math.random() * 6) + 1;
        
        // BOSS PERK: Rolls 2 dice, picks highest
        let p2;
        if (isBossLevel) {
            let r1 = Math.floor(Math.random() * 6) + 1;
            let r2 = Math.floor(Math.random() * 6) + 1;
            p2 = Math.max(r1, r2);
        } else {
            p2 = Math.floor(Math.random() * 6) + 1;
        }

        document.getElementById("dice1").src = `./assets/red-${p1 > 6 ? 6 : p1}.png`;
        document.getElementById("dice2").src = `./assets/green-${p2}.png`;
        document.getElementById("score1").textContent = p1;
        document.getElementById("score2").textContent = p2;

        if (p1 > p2) {
            winStreak++;
            p2HP -= isBossLevel ? 15 : 25; // Bosses take less damage
            coins += bet;
            sounds.win.play();
        } else if (p2 > p1) {
            winStreak = 0;
            p1HP -= isBossLevel ? 30 : 20; // Bosses hit harder
            coins -= bet;
            sounds.lose.play();
        }

        if (p2HP <= 0) handleVictory();
        else if (p1HP <= 0) handleDefeat();

        updateUI();
    }, 800);
}

function handleVictory() {
    if (isBossLevel) {
        bossesDefeated++;
        tokens += 5;
        localStorage.setItem("bosses", bossesDefeated);
    }
    p1HP = 100; p2HP = 100;
    currentLevel++;
    triggerCelebration();
    checkBossStatus();
}

function handleDefeat() {
    alert("Defeated! Restarting match...");
    p1HP = 100; p2HP = 100;
    updateUI();
}

function triggerCelebration() {
    sounds.levelUp.play();
    document.getElementById("celebration-title").textContent = isBossLevel ? "BOSS DEFEATED!" : "LEVEL UP!";
    document.getElementById("new-lvl").textContent = currentLevel;
    document.getElementById("celebration-overlay").style.display = "flex";
}

function updateUI() {
    // RANK SYSTEM
    let rank = "NOVICE";
    if (coins > 1000) rank = "HUSTLER";
    if (coins > 10000) rank = "WHALE";
    if (coins > 100000) rank = "DICE LEGEND";
    if (bossesDefeated > 10) rank = "BOSS SLAYER";

    document.getElementById("rank-tag").textContent = rank;
    document.getElementById("coins").textContent = coins;
    document.getElementById("coins-game").textContent = coins;
    document.getElementById("tokens-game").textContent = tokens;
    document.getElementById("lvl-num").textContent = currentLevel;
    document.getElementById("win-streak").textContent = winStreak;
    document.getElementById("boss-count").textContent = bossesDefeated;
    document.getElementById("p1-hp").style.width = p1HP + "%";
    document.getElementById("p2-hp").style.width = p2HP + "%";

    localStorage.setItem("coins", coins);
    localStorage.setItem("level", currentLevel);
    localStorage.setItem("tokens", tokens);
}

function closeOverlay() { document.getElementById("celebration-overlay").style.display = "none"; }
function logout() { location.reload(); }
document.getElementById("roll").onclick = () => startBattle('standard');
document.getElementById("berserk").onclick = () => startBattle('berserk');
updateUI();
