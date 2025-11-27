// Configuration Firebase - Misterpips
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { getDatabase, ref, set, get, onValue, push } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js';

const firebaseConfig = {
    apiKey: "AIzaSyDSDK0NfVSs_VQb3TnrixiJbOpTsmoUMvU",
    authDomain: "misterpips-b71fb.firebaseapp.com",
    databaseURL: "https://misterpips-b71fb-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "misterpips-b71fb",
    storageBucket: "misterpips-b71fb.firebasestorage.app",
    messagingSenderId: "574231126409",
    appId: "1:574231126409:web:b7ed93ac4ea62e247dc158"
};

class FirebaseManager {
    constructor() {
        this.app = initializeApp(firebaseConfig);
        this.auth = getAuth(this.app);
        this.db = getDatabase(this.app);
        this.modules = { ref, get, set, onValue, push };
        this.init();
    }

    init() {
        // Exposer globalement
        window.firebaseDB = this.db;
        window.firebaseAuth = this.auth;
        window.firebaseModules = this.modules;
        
        // Gestion authentification
        onAuthStateChanged(this.auth, (user) => {
            if (user) {
                sessionStorage.setItem('firebaseUID', user.uid);
                sessionStorage.setItem('userEmail', user.email);
                this.onUserAuthenticated(user);
            } else {
                this.onUserLoggedOut();
            }
        });
        
        console.log('✅ Firebase initialisé');
    }

    onUserAuthenticated(user) {
        // Initialiser les composants après authentification
        setTimeout(() => {
            if (window.initializeApp) window.initializeApp();
        }, 500);
    }

    onUserLoggedOut() {
        if (!window.location.pathname.includes('index.html')) {
            window.location.href = 'index.html';
        }
    }
}

// Initialiser Firebase
window.firebaseManager = new FirebaseManager();