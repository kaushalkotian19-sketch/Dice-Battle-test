// --- STATE ---
let coins = Number(localStorage.getItem("coins")) || 1000;
let tokens = Number(localStorage.getItem("tokens")) || 0;
let level = Number(localStorage.getItem("level")) || 1;
let winStreak = 0;
let upgrades = JSON.parse(localStorage.getItem("upgrades")) || { hp: 100, luck: 0, mult: 1 };
let inv = JSON.parse(localStorage.getItem("inv")) || { potion: 0, lucky: 0, shield: 0 };
let p1HP = upgrades.hp, p2HP = 100, activeShield = false;

const sounds = {
    roll: new Audio('dice_roll.mp3'),
    win: new Audio('win_ding.mp3'),
    lose: new Audio('lose_thud.mp3')
};

// --- CORE ---
function enterArena() {
    const nick = document.getElementById("nickname-input").value || "Warrior";
    localStorage.setItem("dice_nick", nick);
    document.getElementById("display-username").textContent = nick;
    document.getElementById("home-screen").style.display = "none";
    document.querySelectorAll("#game-nav, #game-screen, #wallet").forEach(el => el.style.display = "flex");
    updateUI();
}

function showTab(id) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${id}`).classList.add('active');
}

// --- BATTLE ENGINE ---
function startBattle(mode) {
    const bet = Math.floor(Number(document.getElementById("bet-input").value));
    if (coins < bet || bet <= 0) return alert("Invalid Balance/Bet");

    const isBoss = level % 10 === 0;
    if (isBoss && p2HP === 100) p2HP = 500;

    document.querySelectorAll(".dice-img").forEach(i => i.classList.add("shake"));
    sounds.roll.play().catch(() => {});

    setTimeout(() => {
        document.querySelectorAll(".dice-img").forEach(i => i.classList.remove("shake"));
        
        let p1 = (localStorage.getItem("luckActive") === "Y") ? Math.floor(Math.random() * 3) + 4 : Math.floor(Math.random() * 6) + 1;
        if (mode === 'bsk') p1 = Math.floor(Math.random() * 12) + 1;
        let p2 = Math.floor(Math.random() * 6) + 1;
        localStorage.setItem("luckActive", "N");

        document.getElementById("dice1").src = `./assets/red-${p1 > 6 ? 6 : p1}.png`;
        document.getElementById("dice2").src = `./assets/green-${p2}.png`;

        if (p1 > p2) {
            let dmg = (Math.random() * 100 < upgrades.luck) ? 68 : 34;
            p2HP -= dmg;
            if (p2HP <= 0) {
                let reward = isBoss ? bet * 5 : bet * upgrades.mult;
                coins += reward;
                tokens += isBoss ? 5 : 2;
                level++;
                p2HP = 100; p1HP = upgrades.hp;
                sounds.win.play();
                spawnExplosion("#fbbf24");
                winStreak++;
                if (winStreak >= 5) { tokens += 2; winStreak = 0; }
            }
        } else {
            if (activeShield) { activeShield = false; showFloatingText("SHIELD BLOCKED!", "#3b82f6"); }
            else { p1HP -= 20; coins -= bet; winStreak = 0; }
            if (p1HP <= 0) { p1HP = upgrades.hp; p2HP = 100; sounds.lose.play(); }
        }
        updateUI();
    }, 600);
}

// --- ITEMS & SHOP ---
function buyItem(item, price) {
    if (coins < price) return alert("No coins!");
    coins -= price; inv[item]++; updateUI();
}

function useItem(item) {
    if (inv[item] <= 0) return;
    inv[item]--;
    if (item === 'potion') p1HP = Math.min(upgrades.hp, p1HP + 50);
    if (item === 'lucky') localStorage.setItem("luckActive", "Y");
    if (item === 'shield') activeShield = true;
    updateUI();
}

function claimDaily() {
    const last = localStorage.getItem("lDaily");
    if (last && (Date.now() - last < 86400000)) return alert("Wait 24h");
    coins += 200; localStorage.setItem("lDaily", Date.now()); updateUI();
}

function buyPermanent(type) {
    if (tokens < 10) return alert("Need 10T");
    tokens -= 10; upgrades.hp += 20; p1HP = upgrades.hp; updateUI();
}

// --- UI & PARTICLES ---
function updateUI() {
    document.getElementById("coins-game").textContent = Math.floor(coins);
    document.getElementById("tokens-game").textContent = tokens;
    document.getElementById("lvl-num").textContent = level;
    document.getElementById("count-potion").textContent = inv.potion;
    document.getElementById("count-lucky").textContent = inv.lucky;
    document.getElementById("count-shield").textContent = inv.shield;
    document.getElementById("streak-count").textContent = `${winStreak} / 5`;
    document.getElementById("p1-hp").style.width = (p1HP/upgrades.hp*100) + "%";
    document.getElementById("p2-hp").style.width = (p2HP/(level%10===0?500:100)*100) + "%";
    
    const gs = document.getElementById("game-screen");
    p1HP < upgrades.hp * 0.3 ? gs.classList.add("low-hp-warning") : gs.classList.remove("low-hp-warning");
    
    localStorage.setItem("coins", coins);
    localStorage.setItem("tokens", tokens);
    localStorage.setItem("level", level);
    localStorage.setItem("inv", JSON.stringify(inv));
    localStorage.setItem("upgrades", JSON.stringify(upgrades));
}

// Particle System
const canvas = document.getElementById("particle-canvas");
const ctx = canvas.getContext("2d");
let parts = [];
function spawnExplosion(c) {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    for(let i=0; i<30; i++) parts.push({x:innerWidth/2, y:innerHeight/2, vx:Math.random()*10-5, vy:Math.random()*-15, o:1, c:c});
    renderParts();
}
function renderParts() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    parts.forEach((p,i) => {
        p.x+=p.vx; p.y+=p.vy; p.vy+=0.6; p.o-=0.02;
        ctx.globalAlpha=p.o; ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(p.x,p.y,5,0,7); ctx.fill();
        if(p.o<=0) parts.splice(i,1);
    });
    if(parts.length>0) requestAnimationFrame(renderParts);
}

function showFloatingText(t, c) {
    const e = document.createElement("div"); e.className="floating-text";
    e.textContent=t; e.style.color=c; document.body.appendChild(e);
    setTimeout(()=>e.remove(), 1000);
}
