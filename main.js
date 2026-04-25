let coins = 1000, tokens = 0, level = 1;

function enterArena() {
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('game-nav').style.display = 'flex';
    document.getElementById('game-screen').style.display = 'block';
    document.getElementById('wallet').style.display = 'flex';
}

function showTab(tabId, btn) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    // Show selected
    document.getElementById(`tab-${tabId}`).classList.add('active');
    btn.classList.add('active');
}

function setAura(type) {
    document.body.className = `${type}-aura`;
    document.querySelectorAll('.aura-btn').forEach(btn => {
        btn.classList.toggle('active', btn.innerText.toLowerCase().includes(type));
    });
}

function startBattle(mode) {
    const dice1 = document.getElementById('dice1');
    const dice2 = document.getElementById('dice2');
    
    dice1.classList.add('shake'); dice2.classList.add('shake');
    
    setTimeout(() => {
        dice1.classList.remove('shake'); dice2.classList.remove('shake');
        let p1 = Math.floor(Math.random() * 6) + 1;
        let p2 = Math.floor(Math.random() * 6) + 1;
        dice1.src = `dice-${p1}.png`;
        dice2.src = `dice-${p2}.png`;
        
        if(p1 > p2) document.getElementById('battle-status').innerText = "Victory!";
        else document.getElementById('battle-status').innerText = "Defeat!";
    }, 500);
}
