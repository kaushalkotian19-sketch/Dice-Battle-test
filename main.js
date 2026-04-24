let coins = Number(localStorage.getItem("coins")) || 100;
let tokens = Number(localStorage.getItem("tokens")) || 0;
let currentLevel = Number(localStorage.getItem("level")) || 1;
let bossesDefeated = Number(localStorage.getItem("bosses")) || 0;
let prestigeCount = Number(localStorage.getItem("prestige")) || 0;
let ownedSkins = JSON.parse(localStorage.getItem("ownedSkins")) || [];
let activeSkin = localStorage.getItem("activeSkin") || "default";
let winStreak = 0;
let p1HP = 100;
let p2HP = 100;
let frozenTurns = 0;

const sounds = {
    bgm: new Audio('ambient_synth.mp3'),
    roll: new Audio('dice_roll.mp3'),
    win: new Audio('win_ding.mp3'),
    lose: new Audio('lose_thud.mp3'),
    levelUp: new Audio('level_up.mp3')
};
sounds.bgm.loop = true;
sounds.bgm.volume = 0.3;

function prestige() {
    if (coins < 1000000) return alert("Need 1,000,000 coins to Prestige!");
    if (!confirm("Reset all progress for a permanent multiplier?")) return;
    prestigeCount++;
    coins = 100;
    currentLevel = 1;
    bossesDefeated = 0;
    localStorage.setItem("prestige", prestigeCount);
    localStorage.setItem("coins", coins);
    localStorage.setItem("level", currentLevel);
    localStorage.setItem("bosses", bossesDefeated);
    location.reload();
}

function buySkin(skin, price) {
    if (ownedSkins.includes(skin)) {
        activeSkin = activeSkin === skin ? "default" : skin;
    } else {
        if (coins < price) return alert("Need more coins!");
        coins -= price;
        ownedSkins.push(skin);
        activeSkin = skin;
        localStorage.setItem("ownedSkins", JSON.stringify(ownedSkins));
    }
    localStorage.setItem("activeSkin", activeSkin);
    applySkin();
    updateUI();
}

function applySkin() {
    const dice = document.getElementById("dice1");
    dice.classList.remove("skin-neon", "skin-fire");
    if (activeSkin !== "default") dice.classList.add(`skin-${activeSkin}`);
}

function startBattle(type) {
    const bet = Number(document.getElementById("bet-input").value);
    if (bet <= 0 || bet > coins) return alert("Check balance!");
    if (type === 'bsk' && frozenTurns > 0) return alert("Berserk is FROZEN!");

    sounds.roll.play();
    const d1 = document.getElementById("dice1");
    const d2 = document.getElementById("dice2");
    d1.classList.add("dice-rolling");
    d2.classList.add("dice-rolling");
    if (activeSkin === 'fire') document.getElementById("p1-dice-container").classList.add("burning");

    setTimeout(() => {
        d1.classList.remove("dice-rolling");
        d2.classList.remove("dice-rolling");
        document.getElementById("p1-dice-container").classList.remove("burning");

        let p1 = (type === 'bsk') ? Math.floor(Math.random() * 12) + 1 : Math.floor(Math.random() * 6) + 1;
        let p2 = (currentLevel % 5 === 0) ? Math.max(Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1) : Math.floor(Math.random() * 6) + 1;

        d1.src = `./assets/red-${p1 > 6 ? 6 : p1}.png`;
        d2.src = `./assets/green-${p2}.png`;
        document.getElementById("score1").textContent = p1;
        document.getElementById("score2").textContent = p2;

        if (p1 > p2) {
            winStreak++;
            p2HP -= (currentLevel % 5 === 0) ? 20 : 34;
            let gain = (winStreak >= 3 ? bet * 2 : bet) * (prestigeCount + 1);
            coins += gain;
            showFloatingText(`+${gain}`, "gold");
            if (p1 === 6 || type === 'bsk') screenShake();
            sounds.win.play();
        } else if (p2 > p1) {
            winStreak = 0;
            p1HP -= (currentLevel === 20) ? 40 : 20;
            let loss = (currentLevel === 10) ? bet * 2 : bet;
            coins -= loss;
            showFloatingText(`-${loss}`, "red");
            sounds.lose.play();
        }

        if (frozenTurns > 0) frozenTurns--;
        if (p2HP <= 0) handleLevelUp();
        else if (p1HP <= 0) { p1HP = 100; p2HP = 100; winStreak = 0; }
        updateUI();
    }, 700);
}

function handleLevelUp() {
    if (currentLevel % 5 === 0) { bossesDefeated++; tokens += 5; }
    currentLevel++; p1HP = 100; p2HP = 100;
    if (currentLevel === 15) frozenTurns = 3;
    p2HP = (currentLevel === 20) ? 200 : 100;
    triggerLevelUp();
}

function showFloatingText(text, colorClass) {
    const el = document.createElement("div");
    el.className = `floating-text ${colorClass}`;
    el.textContent = text;
    document.getElementById("floating-text-container").appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

function screenShake() {
    const container = document.getElementById("main-container");
    container.classList.add("shake-effect");
    setTimeout(() => container.classList.remove("shake-effect"), 300);
}

function updateUI() {
    let rank = prestigeCount > 0 ? "💎 DIAMOND" : "NOVICE";
    if (coins >= 1000000 && prestigeCount === 0) document.getElementById("prestige-btn").style.display = "block";
    
    document.getElementById("rank-tag").textContent = rank;
    document.getElementById("coins-game").textContent = coins.toLocaleString();
    document.getElementById("tokens-game").textContent = tokens;
    document.getElementById("lvl-num").textContent = currentLevel;
    document.getElementById("win-streak").textContent = winStreak;
    document.getElementById("boss-count").textContent = bossesDefeated;
    document.getElementById("p1-hp").style.width = p1HP + "%";
    document.getElementById("p2-hp").style.width = (p2HP / (currentLevel === 20 ? 2 : 1)) + "%";
    document.getElementById("multiplier-display").textContent = `${(prestigeCount + 1)}x`;

    const abilityTag = document.getElementById("boss-ability");
    if (currentLevel === 10) { abilityTag.textContent = "THE THIEF: 2x Steal"; abilityTag.style.display = "block"; }
    else if (currentLevel === 15) { abilityTag.textContent = `FREEZER: ${frozenTurns} Turns Locked`; abilityTag.style.display = "block"; }
    else if (currentLevel === 20) { abilityTag.textContent = "THE GIANT: 200 HP"; abilityTag.style.display = "block"; }
    else { abilityTag.style.display = "none"; }

    document.body.classList.toggle("boss-theme", currentLevel % 5 === 0);
    document.getElementById("boss-warning").style.display = (currentLevel % 5 === 0) ? "block" : "none";

    localStorage.setItem("coins", coins);
    localStorage.setItem("level", currentLevel);
    localStorage.setItem("bosses", bossesDefeated);
}

function handleSimpleLogin() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) new AudioContext().resume();
    sounds.bgm.play().catch(() => {});
    document.getElementById("home-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "block";
    applySkin();
    updateUI();
}

function triggerLevelUp() {
    sounds.levelUp.play();
    document.getElementById("new-lvl").textContent = currentLevel;
    document.getElementById("celebration-overlay").style.display = "flex";
}

function closeOverlay() { document.getElementById("celebration-overlay").style.display = "none"; }
function logout() { location.reload(); }
document.getElementById("roll-std").onclick = () => startBattle('std');
document.getElementById("roll-bsk").onclick = () => startBattle('bsk');
updateUI();
