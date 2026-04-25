// home.js - Dedicated logic for the landing page
function enterArena() {
    const warriorName = document.getElementById('nickname-input').value;
    
    if (warriorName.trim() === "") {
        alert("Please enter your Warrior name to proceed!");
        return;
    }

    // Save name for the Arena session
    document.getElementById('display-username').innerText = warriorName;

    // Transition: Hide Home and show Game UI
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    
    // Play entry sound if available
    const ambient = new Audio('ambient_synth.mp3');
    ambient.play();
}
