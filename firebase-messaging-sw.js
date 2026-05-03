// Import Firebase Service Worker compatibility libraries
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Your exact Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDBi43PAlEbRssq_VPAS-ZTvC48ASI2yuE",
  authDomain: "dice-battle-elite-a1b2c.firebaseapp.com",
  projectId: "dice-battle-elite-a1b2c",
  storageBucket: "dice-battle-elite-a1b2c.firebasestorage.app",
  messagingSenderId: "937761058634",
  appId: "1:937761058634:web:5e1df692ec74d6f8479bb3",
  measurementId: "G-R8L39Y6TXR"
};

// Initialize the background app
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle messages received while the game is closed or in the background
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);
  
  const notificationTitle = payload.notification.title || "Dice Battle Elite";
  const notificationOptions = {
    body: payload.notification.body || "Your rewards are ready!",
    icon: './assets/red-dice.png',
    badge: './assets/red-dice.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
