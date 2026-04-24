let coins = Number(localStorage.getItem("coins")) || 100;
let tokens = Number(localStorage.getItem("tokens")) || 0;
let currentLevel = Number(localStorage.getItem("level")) || 1;
let bossesDefeated = Number(localStorage.getItem("bosses")) || 0;
let ownedSkins = JSON.parse(localStorage.getItem("ownedSkins")) || [];
let activeSkin = localStorage.getItem("activeSkin") || "default";
let winStreak = 0;
let p1HP = 100;
let p2HP = 100;

const sounds = {
    bgm: new Audio('ambient_synth.mp3'),
    roll: new Audio('dice_roll.mp3'),
    win: new Audio('win_ding.mp3'),
    lose: new Audio('lose_thud.mp3'),
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
    applySkin();
    updateUI();
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
    document.getElementById("skin-neon").textContent = ownedSkins.includes('neon') ? (activeSkin === 'neon' ? '💠 Active' : '💠 Equip') : '💠 Neon (50k)';
    document.getElementById("skin-fire").textContent = ownedSkins.includes('fire') ? (activeSkin === 'fire' ? '🔥 Active' : '🔥 Equip') : '🔥 Fire (250k)';
}

function startBattle(type) {
    const bet = Number(document.getElementById("bet-input").value);
    if (bet <= 0 || bet > coins) return alert("Check balance!");
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
            coins += (winStreak >= 3 ? bet * 2 : bet);
            sounds.win.play();
        } else if (p2 > p1) {
            winStreak = 0;
            p1HP -= (currentLevel % 5 === 0) ? 35 : 20;
            coins -= bet;
            sounds.lose.play();
        }

        if (p2HP <= 0) {
            if (currentLevel % 5 === 0) { bossesDefeated++; tokens += 5; }
            currentLevel++; p1HP = 100; p2HP = 100;
            triggerLevelUp();
        } else if (p1HP <= 0) { p1HP = 100; p2HP = 100; winStreak = 0; }
        updateUI();
    }, 700);
}

function updateUI() {
    let rank = "NOVICE";
    if (coins > 100000) rank = "HUSTLER";
    if (coins > 1000000) rank = "WHALE";
    if (coins > 10000000) rank = "DICE LEGEND";
    document.getElementById("rank-tag").textContent = rank;
    document.getElementById("coins-game").textContent = coins.toLocaleString();
    document.getElementById("tokens-game").textContent = tokens;
    document.getElementById("lvl-num").textContent = currentLevel;
    document.getElementById("win-streak").textContent = winStreak;
    document.getElementById("boss-count").textContent = bossesDefeated;
    document.getElementById("p1-hp").style.width = p1HP + "%";
    document.getElementById("p2-hp").style.width = p2HP + "%";
    document.getElementById("multiplier").textContent = winStreak >= 3 ? "2x 🔥" : "1x";
    document.body.classList.toggle("boss-theme", currentLevel % 5 === 0);
    document.getElementById("boss-warning").style.display = (currentLevel % 5 === 0) ? "block" : "none";
    localStorage.setItem("coins", coins);
    localStorage.setItem("level", currentLevel);
    localStorage.setItem("bosses", bossesDefeated);
    localStorage.setItem("tokens", tokens);
}

function triggerLevelUp() {
    sounds.levelUp.play();
    document.getElementById("celebration-title").textContent = (currentLevel - 1) % 5 === 0 ? "BOSS DEFEATED!" : "LEVEL UP!";
    document.getElementById("new-lvl").textContent = currentLevel;
    document.getElementById("celebration-overlay").style.display = "flex";
}

function claimDailyReward() {
    const last = localStorage.getItem("lastClaim");
    if (last && Date.now() - last < 86400000) return alert("Come back tomorrow!");
    const prize = Math.floor(Math.random() * 100) + 50;
    coins += prize;
    localStorage.setItem("lastClaim", Date.now());
    updateUI();
    alert(`Received ${prize} coins!`);
}

function closeOverlay() { document.getElementById("celebration-overlay").style.display = "none"; }
function logout() { location.reload(); }
document.getElementById("roll-std").onclick = () => startBattle('std');
document.getElementById("roll-bsk").onclick = () => startBattle('bsk');
updateUI();
