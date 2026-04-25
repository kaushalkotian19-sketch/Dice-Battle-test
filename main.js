// --- DOM ELEMENTS ---
const homeScreen = document.getElementById('home-screen');
const gameContainer = document.getElementById('game-container');
const enterBtn = document.getElementById('enter-btn');
const nicknameInput = document.getElementById('nickname-input');

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Attach listener to button
    enterBtn.addEventListener('click', enterArena);

    // Tab switching logic
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            showTab(tabId);
        });
    });
});

// --- TRANSITION LOGIC ---
function enterArena() {
    const warriorName = nicknameInput.value.trim();
    
    if (warriorName === "") {
        alert("Enter your Warrior Name first!");
        return;
    }

    // Update UI name
    document.getElementById('display-name').innerText = warriorName;

    // Transition [Fixes the blank screen issue]
    homeScreen.style.display = 'none';
    gameContainer.style.display = 'block';

    // Play entry sound
    new Audio('ambient_synth.mp3').play().catch(() => console.log("Audio waiting for user interaction"));
}

// --- TAB CONTROL ---
function showTab(tabName) {
    // Reset tabs
    document.querySelectorAll('.content-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));

    // Activate selected
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Highlight button
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) activeBtn.classList.add('active');
}

// --- GAME LOGIC OBJECT ---
const game = {
    roll: function(type) {
        const r1 = Math.floor(Math.random() * 6) + 1;
        const r2 = Math.floor(Math.random() * 6) + 1;

        // Image Update
        document.getElementById('dice-left').src = `red-dice-${r1}.png`;
        document.getElementById('dice-right').src = `green-dice-${r2}.png`;

        document.getElementById('battle-log').innerText = `Rolled ${r1} vs ${r2}!`;
        new Audio('dice_roll.mp3').play();
    }
};

const ui = {
    setAura: function(type) {
        document.body.className = `${type}-aura`;
    }
};
