// Système d'authentification Firebase
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Écouter les changements d'état d'authentification
        window.auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            this.updateUI(user);
            
            if (user) {
                console.log('✅ Utilisateur connecté:', user.email);
                this.updateConnectionStatus(true);
                this.saveUserData(user);
            } else {
                console.log('❌ Utilisateur déconnecté');
                this.updateConnectionStatus(false);
            }
        });
    }

    // Connexion
    async login(email, password) {
        try {
            const result = await window.auth.signInWithEmailAndPassword(email, password);
            console.log('✅ Connexion réussie');
            return { success: true, user: result.user };
        } catch (error) {
            console.error('❌ Erreur connexion:', error);
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }

    // Inscription
    async register(email, password) {
        try {
            const result = await window.auth.createUserWithEmailAndPassword(email, password);
            console.log('✅ Inscription réussie');
            
            // Créer le profil utilisateur
            await this.createUserProfile(result.user);
            
            return { success: true, user: result.user };
        } catch (error) {
            console.error('❌ Erreur inscription:', error);
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }

    // Déconnexion
    async logout() {
        try {
            await window.auth.signOut();
            console.log('✅ Déconnexion réussie');
            window.location.href = 'index.html';
        } catch (error) {
            console.error('❌ Erreur déconnexion:', error);
        }
    }

    // Créer profil utilisateur
    async createUserProfile(user) {
        try {
            const userRef = window.database.ref(`users/${user.uid}`);
            await userRef.set({
                email: user.email,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                trades: {},
                stats: {
                    totalTrades: 0,
                    totalProfit: 0,
                    winRate: 0
                }
            });
            console.log('✅ Profil utilisateur créé');
        } catch (error) {
            console.error('❌ Erreur création profil:', error);
        }
    }

    // Sauvegarder données utilisateur
    async saveUserData(user) {
        try {
            const userRef = window.database.ref(`users/${user.uid}`);
            await userRef.update({
                lastLogin: new Date().toISOString()
            });
        } catch (error) {
            console.error('❌ Erreur sauvegarde:', error);
        }
    }

    // Mettre à jour l'interface
    updateUI(user) {
        const userEmail = document.getElementById('userEmail');
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const accessDashboard = document.getElementById('accessDashboard');

        if (user) {
            if (userEmail) userEmail.textContent = user.email;
            if (loginBtn) loginBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (accessDashboard) accessDashboard.style.display = 'block';
        } else {
            if (userEmail) userEmail.textContent = '';
            if (loginBtn) loginBtn.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (accessDashboard) accessDashboard.style.display = 'none';
        }
    }

    // Mettre à jour statut connexion
    updateConnectionStatus(isOnline) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            statusElement.textContent = isOnline ? 'En ligne' : 'Hors ligne';
            statusElement.className = isOnline ? 'status-online' : 'status-offline';
        }
    }

    // Messages d'erreur
    getErrorMessage(errorCode) {
        const messages = {
            'auth/user-not-found': 'Utilisateur non trouvé',
            'auth/wrong-password': 'Mot de passe incorrect',
            'auth/email-already-in-use': 'Email déjà utilisé',
            'auth/weak-password': 'Mot de passe trop faible',
            'auth/invalid-email': 'Email invalide',
            'auth/too-many-requests': 'Trop de tentatives, réessayez plus tard'
        };
        return messages[errorCode] || 'Erreur inconnue';
    }

    // Vérifier si utilisateur connecté
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Obtenir utilisateur actuel
    getCurrentUser() {
        return this.currentUser;
    }

    // Rediriger si non connecté
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }
}

// Initialiser le gestionnaire d'authentification
window.authManager = new AuthManager();