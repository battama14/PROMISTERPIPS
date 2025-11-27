// Application Principale - Misterpips Optimisé
class MisterpipsApp {
    constructor() {
        this.components = {};
        this.isInitialized = false;
        this.init();
    }

    init() {
        console.log('🚀 Initialisation Misterpips App');
        this.setupGlobalVariables();
        this.waitForFirebase();
    }

    setupGlobalVariables() {
        // Variables globales pour compatibilité
        window.initializeApp = () => this.initializeComponents();
        window.app = this;
    }

    waitForFirebase() {
        if (window.firebaseDB && window.firebaseModules) {
            this.initializeComponents();
        } else {
            setTimeout(() => this.waitForFirebase(), 500);
        }
    }

    initializeComponents() {
        if (this.isInitialized) return;
        
        console.log('🔧 Initialisation des composants...');
        
        // Initialiser les composants
        this.initChat();
        this.initRanking();
        this.initCalendar();
        this.initDashboard();
        
        this.isInitialized = true;
        console.log('✅ Application initialisée');
    }

    initChat() {
        if (window.ChatVIP) {
            this.components.chat = new window.ChatVIP();
            window.chat = this.components.chat;
        }
    }

    initRanking() {
        if (window.RankingVIP) {
            this.components.ranking = new window.RankingVIP();
            window.ranking = this.components.ranking;
        }
    }

    initCalendar() {
        if (window.CalendarVIP) {
            this.components.calendar = new window.CalendarVIP();
            window.calendar = this.components.calendar;
        }
    }

    initDashboard() {
        this.setupEventListeners();
        this.loadUserData();
        this.initTrades();
    }
    
    initTrades() {
        if (window.TradesManager) {
            this.components.trades = new window.TradesManager();
            window.tradesManager = this.components.trades;
        }
    }

    setupEventListeners() {
        // Bouton VIP Home
        const vipHomeBtn = document.getElementById('vipHomeBtn');
        if (vipHomeBtn) {
            vipHomeBtn.onclick = () => window.location.href = 'index.html';
        }

        // Boutons d'action
        const newTradeBtn = document.getElementById('newTradeBtn');
        if (newTradeBtn) {
            newTradeBtn.onclick = () => this.openNewTradeModal();
        }

        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.onclick = () => this.openSettingsModal();
        }

        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.onclick = () => this.exportData();
        }

        console.log('✅ Event listeners configurés');
    }

    loadUserData() {
        // Charger les données utilisateur depuis Firebase
        const uid = sessionStorage.getItem('firebaseUID');
        if (!uid || !window.firebaseDB) return;

        const { ref, get } = window.firebaseModules;
        get(ref(window.firebaseDB, `users/${uid}`)).then((snapshot) => {
            if (snapshot.exists()) {
                const userData = snapshot.val();
                this.updateUI(userData);
            }
        }).catch((error) => {
            console.error('❌ Erreur chargement données:', error);
        });
    }

    updateUI(userData) {
        // Mettre à jour l'interface avec les données utilisateur
        if (userData.capital) {
            const capitalEl = document.getElementById('capital');
            if (capitalEl) capitalEl.textContent = `$${userData.capital}`;
        }

        if (userData.winRate) {
            const winRateEl = document.getElementById('winRate');
            if (winRateEl) winRateEl.textContent = `${userData.winRate}%`;
        }

        if (userData.totalPnL) {
            const totalPnLEl = document.getElementById('totalPnL');
            if (totalPnLEl) totalPnLEl.textContent = `$${userData.totalPnL}`;
        }

        // Mettre à jour le classement
        if (this.components.ranking && userData.trades) {
            this.components.ranking.updateUserData({
                profit: userData.totalPnL || 0,
                winRate: userData.winRate || 0,
                trades: userData.trades.length || 0
            });
        }

        // Charger les trades dans le calendrier
        if (this.components.calendar && userData.trades) {
            this.components.calendar.loadTrades(userData.trades);
        }
    }

    openNewTradeModal() {
        console.log('📈 Ouverture modal nouveau trade');
        // Implémenter le modal de nouveau trade
    }

    openSettingsModal() {
        console.log('⚙️ Ouverture modal paramètres');
        // Implémenter le modal de paramètres
    }

    exportData() {
        console.log('📊 Export des données');
        // Implémenter l'export Excel
    }

    // Méthodes utilitaires
    showNotification(message, type = 'info') {
        console.log(`${type.toUpperCase()}: ${message}`);
        // Implémenter système de notifications
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('fr-FR').format(new Date(date));
    }
}

// Initialiser l'application
document.addEventListener('DOMContentLoaded', () => {
    window.misterpipsApp = new MisterpipsApp();
});