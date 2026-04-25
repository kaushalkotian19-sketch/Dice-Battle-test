// --- INITIAL STATE ---
let coins = Number(localStorage.getItem("coins")) || 1000;
let tokens = Number(localStorage.getItem("tokens")) || 0;
let level = Number(localStorage.getItem("level")) || 1;
let winStreak = 0;
let upgrades = JSON.parse(localStorage.getItem("upgrades")) || { hp: 100, luck: 0, mult: 1 };
let inv = JSON.parse(localStorage.getItem("inv")) || { potion: 0, lucky: 0, shield: 0 };
let p1HP = upgrades.hp, p2HP = 100, activeShield = false;

// --- CORE NAVIGATION ---
function enterArena() {
    const nick = document.getElementById("nickname-input").value || "Warrior";
    document.getElementById("display-username").textContent = nick;
    document.getElementById("home-screen").style.display = "none";
    document.querySelectorAll("#game-nav, #game-screen, #wallet").forEach(el => el.style.display = "flex");
    updateUI();
}

function showTab(id) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${id}`).classList.add('active');
}

// --- BATTLE LOGIC ---
function startBattle(mode) {
    const bet = Math.floor(Number(document.getElementById("bet-input").value));
    if (coins < bet || bet <= 0) return alert("Insufficient Balance!");

    const isBoss = level % 10 === 0;
    if (isBoss && p2HP === 100) {
        p2HP = 500;
        document.getElementById("cpu-label").textContent = "BOSS";
    }

    document.querySelectorAll(".dice-img").forEach(i => i.classList.add("shake"));

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
                coins += isBoss ? bet * 5 : bet * upgrades.mult;
                tokens += isBoss ? 5 : 2;
                level++; winStreak++;
                p2HP = 100; p1HP = upgrades.hp;
                document.getElementById("cpu-label").textContent = "CPU";
                spawnExplosion("#fbbf24");
                if (winStreak >= 5) { tokens += 2; winStreak = 0; }
            }
        } else {
            if (activeShield) { activeShield = false; } 
            else { p1HP -= 20; coins -= bet; winStreak = 0; }
            if (p1HP <= 0) { p1HP = upgrades.hp; p2HP = 100; }
        }
        updateUI();
    }, 600);
}

// --- SHOP & ITEMS ---
function buyItem(item, price) {
    if (coins < price) return alert("Not enough coins!");
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

function setAura(type) {
    document.body.className = type + "-aura";
    document.querySelectorAll('.aura-btn').forEach(btn => {
        btn.classList.toggle('active', btn.innerText.toLowerCase().includes(type));
    });
}

// --- UI REFRESH ---
function updateUI() {
    document.getElementById("coins-game").textContent = Math.floor(coins);
    document.getElementById("tokens-game").textContent = tokens;
    document.getElementById("lvl-num").textContent = level;
    document.getElementById("count-potion").textContent = inv.potion;
    document.getElementById("count-lucky").textContent = inv.lucky;
    document.getElementById("count-shield").textContent = inv.shield;
    document.getElementById("streak-count").textContent = `${winStreak} / 5`;
    document.getElementById("p1-hp").style.width = (p1HP/upgrades.hp*100) + "%";
    
    const bossMax = (level % 10 === 0) ? 500 : 100;
    document.getElementById("p2-hp").style.width = (p2HP/bossMax*100) + "%";
    
    if (p1HP < upgrades.hp * 0.3) document.getElementById("game-screen").classList.add("low-hp-warning");
    else document.getElementById("game-screen").classList.remove("low-hp-warning");

    localStorage.setItem("coins", coins);
    localStorage.setItem("tokens", tokens);
    localStorage.setItem("level", level);
    localStorage.setItem("inv", JSON.stringify(inv));
    localStorage.setItem("upgrades", JSON.stringify(upgrades));
}

// --- PARTICLE EFFECT ---
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
