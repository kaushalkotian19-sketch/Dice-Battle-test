// GLOBAL STATE
let playerCoins = 226;
let playerTokens = 12;

// SCREEN TRANSITION
function enterArena() {
    const name = document.getElementById('nickname-input').value;
    if(!name) {
        alert("Enter your Warrior Name!");
        return;
    }
    document.getElementById('display-username').innerText = name;
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
}

// TAB SWITCHING
function showTab(tabId) {
    // 1. Reset all tabs and buttons
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // 2. Activate the selected one
    document.getElementById(`tab-${tabId}`).classList.add('active');
    
    // 3. Highlight the clicked button
    const activeBtn = Array.from(document.querySelectorAll('.nav-btn'))
                           .find(btn => btn.innerText.toLowerCase().includes(tabId));
    if(activeBtn) activeBtn.classList.add('active');
}

// BATTLE LOGIC
function rollDice(mode) {
    const roll1 = Math.floor(Math.random() * 6) + 1;
    const roll2 = Math.floor(Math.random() * 6) + 1;

    // Use your existing image naming convention
    document.getElementById('dice1').src = `red-dice-${roll1}.png`;
    document.getElementById('dice2').src = `green-dice-${roll2}.png`;

    // Sound effect trigger
    const sfx = new Audio('dice_roll.mp3');
    sfx.play();
}

// AURA LOGIC
function setAura(auraType) {
    document.body.className = `${auraType}-aura`;
    document.querySelectorAll('.aura-chip').forEach(chip => {
        chip.classList.toggle('active', chip.innerText.toLowerCase() === auraType);
    });
}
