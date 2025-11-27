// Configuration Firebase - Misterpips
const firebaseConfig = {
    apiKey: "AIzaSyBGpF5_wVdvbKFZQJYX8kF5L5L5L5L5L5L",
    authDomain: "misterpips-b71fb.firebaseapp.com",
    databaseURL: "https://misterpips-b71fb-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "misterpips-b71fb",
    storageBucket: "misterpips-b71fb.appspot.com",
    messagingSenderId: "987654321",
    appId: "1:987654321:web:fedcba987654321"
};

// Initialiser Firebase
firebase.initializeApp(firebaseConfig);

// Exporter les services
window.auth = firebase.auth();
window.database = firebase.database();

console.log('✅ Firebase configuré et initialisé');