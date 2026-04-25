// --- DOM REFERENCES ---
const ui = {
    home: document.getElementById('home-screen'),
    game: document.getElementById('game-container'),
    enterBtn: document.getElementById('enter-btn'),
    userInput: document.getElementById('warrior-input')
};

// --- INITIALIZE ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Entry listener
    ui.enterBtn.addEventListener('click', () => {
        const name = ui.userInput.value.trim();
        if(!name) return alert("Identify yourself, Warrior!");
        
        document.getElementById('user-display').innerText = name;
        ui.home.style.display = 'none';
        ui.game.style.display = 'block';
        
        new Audio('ambient_synth.mp3').play().catch(e => console.log("Audio Pending"));
    });

    // 2. Tab switcher
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-target');
            document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
            document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
            
            document.getElementById(`view-${target}`).classList.add('active');
            tab.classList.add('active');
        });
    });
});

// --- BATTLE LOGIC ---
const battle = {
    start: function(type) {
        const r1 = Math.floor(Math.random() * 6) + 1;
        const r2 = Math.floor(Math.random() * 6) + 1;

        // Visual update
        document.getElementById('p1-dice').src = `red-dice-${r1}.png`;
        document.getElementById('p2-dice').src = `green-dice-${r2}.png`;
        
        document.getElementById('log-msg').innerText = `Rolled ${r1} vs ${r2}!`;
        new Audio('dice_roll.mp3').play();
    }
};
