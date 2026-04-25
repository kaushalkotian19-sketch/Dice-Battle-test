function enterArena() {
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('game-nav').style.display = 'flex';
    document.getElementById('game-screen').style.display = 'block';
    document.getElementById('wallet').style.display = 'flex';
}

function showTab(tabId) {
    // Hide all
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    // Show active
    document.getElementById(`tab-${tabId}`).classList.add('active');
    event.currentTarget.classList.add('active');
}

function setAura(type) {
    document.body.className = `${type}-aura`;
    document.querySelectorAll('.aura-btn').forEach(btn => {
        btn.classList.toggle('active', btn.innerText.toLowerCase().includes(type));
    });
}

function startBattle(mode) {
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    // Note: Ensure images like dice-1.png exist in your folder
    document.getElementById('dice1').src = `dice-${d1}.png`;
    document.getElementById('dice2').src = `dice-${d2}.png`;
}
