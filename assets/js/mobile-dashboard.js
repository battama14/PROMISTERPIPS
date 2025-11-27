// Mobile Dashboard - Ultra Professional
console.log('📱 Chargement du dashboard mobile...');

class MobileDashboard {
    constructor() {
        this.currentUser = sessionStorage.getItem('firebaseUID');
        this.currentSection = 'overview';
        this.trades = [];
        this.settings = {
            capital: 1000,
            notifications: true,
            sounds: true
        };
        this.notificationPermission = false;
        this.init();
    }

    async init() {
        console.log('🚀 Initialisation mobile dashboard...');
        
        // Vérifier l'utilisateur
        if (!this.currentUser) {
            console.error('Aucun UID Firebase trouvé!');
            window.location.href = 'index.html';
            return;
        }

        // Initialiser les notifications
        await this.initNotifications();
        
        // Charger les données
        await this.loadData();
        
        // Mettre à jour l'interface
        this.updateStats();
        this.loadRecentTrades();
        this.loadRanking();
        
        // Écouter les changements en temps réel
        this.setupRealtimeListeners();
        
        // Gérer les événements tactiles
        this.setupTouchEvents();
        
        console.log('✅ Mobile dashboard initialisé');
    }

    async initNotifications() {
        try {
            // Demander permission pour les notifications
            if ('Notification' in window) {
                const permission = await Notification.requestPermission();
                this.notificationPermission = permission === 'granted';
                
                if (this.notificationPermission) {
                    console.log('✅ Notifications autorisées');
                }
            }

            // Initialiser Firebase Messaging si disponible
            if (window.firebaseMessaging) {
                try {
                    const token = await window.getToken(window.firebaseMessaging, {
                        vapidKey: 'YOUR_VAPID_KEY' // À remplacer par votre clé VAPID
                    });
                    
                    if (token) {
                        console.log('✅ Token FCM obtenu:', token);
                        // Sauvegarder le token pour l'utilisateur
                        await this.saveNotificationToken(token);
                    }
                } catch (error) {
                    console.log('FCM non disponible:', error);
                }
            }
        } catch (error) {
            console.error('Erreur initialisation notifications:', error);
        }
    }

    async saveNotificationToken(token) {
        try {
            const tokenRef = window.dbRef(window.firebaseDB, `users/${this.currentUser}/fcmToken`);
            await window.dbSet(tokenRef, token);
        } catch (error) {
            console.error('Erreur sauvegarde token:', error);
        }
    }

    async loadData() {
        try {
            // Charger depuis Firebase
            if (window.firebaseDB) {
                await this.loadFromFirebase();
            } else {
                this.loadFromLocalStorage();
            }
        } catch (error) {
            console.error('Erreur chargement données:', error);
            this.loadFromLocalStorage();
        }
    }

    async loadFromFirebase() {
        try {
            const userRef = window.dbRef(window.firebaseDB, `dashboards/${this.currentUser}`);
            const snapshot = await window.dbGet(userRef);
            
            if (snapshot.exists()) {
                const data = snapshot.val();
                this.trades = data.trades || [];
                this.settings = { ...this.settings, ...data.settings };
                console.log('📊 Données chargées depuis Firebase');
            }
        } catch (error) {
            console.error('Erreur chargement Firebase:', error);
        }
    }

    loadFromLocalStorage() {
        try {
            const savedData = localStorage.getItem(`mobile_dashboard_${this.currentUser}`);
            if (savedData) {
                const data = JSON.parse(savedData);
                this.trades = data.trades || [];
                this.settings = { ...this.settings, ...data.settings };
                console.log('📊 Données chargées depuis localStorage');
            }
        } catch (error) {
            console.error('Erreur chargement local:', error);
        }
    }

    async saveData() {
        try {
            const data = {
                trades: this.trades,
                settings: this.settings,
                lastUpdated: new Date().toISOString()
            };

            // Sauvegarder localement
            localStorage.setItem(`mobile_dashboard_${this.currentUser}`, JSON.stringify(data));

            // Sauvegarder sur Firebase
            if (window.firebaseDB) {
                const userRef = window.dbRef(window.firebaseDB, `dashboards/${this.currentUser}`);
                await window.dbSet(userRef, data);
                
                // Synchroniser avec la version desktop
                const desktopRef = window.dbRef(window.firebaseDB, `users/${this.currentUser}/accounts/compte1`);
                await window.dbSet(desktopRef, {
                    trades: this.trades,
                    capital: this.settings.capital,
                    settings: this.settings
                });
            }

            this.showToast('Données synchronisées', 'success');
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
            this.showToast('Erreur de synchronisation', 'error');
        }
    }

    setupRealtimeListeners() {
        if (!window.firebaseDB) return;

        try {
            // Écouter les changements de trades
            const tradesRef = window.dbRef(window.firebaseDB, `dashboards/${this.currentUser}/trades`);
            window.onValue(tradesRef, (snapshot) => {
                if (snapshot.exists()) {
                    const newTrades = snapshot.val();
                    if (Array.isArray(newTrades) && newTrades.length !== this.trades.length) {
                        this.trades = newTrades;
                        this.updateStats();
                        this.loadRecentTrades();
                        this.showToast('Données mises à jour', 'info');
                    }
                }
            });
        } catch (error) {
            console.error('Erreur listeners temps réel:', error);
        }
    }

    setupTouchEvents() {
        // Gérer le swipe pour fermer le menu
        let startX = 0;
        const menu = document.getElementById('mobileMenu');
        
        menu.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });
        
        menu.addEventListener('touchmove', (e) => {
            const currentX = e.touches[0].clientX;
            const diffX = startX - currentX;
            
            if (diffX > 50) { // Swipe left
                this.toggleMenu();
            }
        });

        // Vibration pour les actions importantes
        this.setupHapticFeedback();
    }

    setupHapticFeedback() {
        const buttons = document.querySelectorAll('.action-btn, .fab, .add-btn');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                if ('vibrate' in navigator) {
                    navigator.vibrate(50); // Vibration courte
                }
            });
        });
    }

    updateStats() {
        const closedTrades = this.trades.filter(t => t.status === 'closed');
        const openTrades = this.trades.filter(t => t.status === 'open');
        const totalPnL = closedTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
        const winningTrades = closedTrades.filter(t => parseFloat(t.pnl || 0) > 0);
        const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length * 100).toFixed(1) : 0;
        
        const currentCapital = this.settings.capital + totalPnL;
        const capitalChange = this.settings.capital > 0 ? ((totalPnL / this.settings.capital) * 100).toFixed(1) : 0;

        // Mettre à jour les éléments
        this.updateElement('mobileCapital', `$${currentCapital.toFixed(2)}`);
        this.updateElement('mobileWinRate', `${winRate}%`);
        this.updateElement('mobilePnL', `$${totalPnL.toFixed(2)}`);
        this.updateElement('mobileOpenTrades', openTrades.length);
        
        // Mettre à jour les changements
        this.updateElement('mobileCapitalChange', `${capitalChange >= 0 ? '+' : ''}${capitalChange}%`);
        this.updateElement('mobileWinRateChange', '+5.2%'); // Exemple
        this.updateElement('mobilePnLChange', `${totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(0)}`);
    }

    updateElement(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        }
    }

    loadRecentTrades() {
        const container = document.getElementById('mobileTradesList');
        if (!container) return;

        container.innerHTML = '';

        if (this.trades.length === 0) {
            container.innerHTML = '<div class="no-trades">Aucun trade enregistré</div>';
            return;
        }

        const recentTrades = this.trades.slice(-5).reverse();
        
        recentTrades.forEach(trade => {
            const item = this.createTradeItem(trade);
            container.appendChild(item);
        });
    }

    createTradeItem(trade) {
        const div = document.createElement('div');
        div.className = 'trade-item';
        
        const pnl = parseFloat(trade.pnl || 0);
        const pnlClass = pnl > 0 ? 'positive' : pnl < 0 ? 'negative' : 'neutral';
        
        div.innerHTML = `
            <div class="trade-header">
                <span class="trade-pair">${trade.currency || 'EUR/USD'}</span>
                <span class="trade-type ${(trade.type || 'BUY').toLowerCase()}">${trade.type || 'BUY'}</span>
            </div>
            <div class="trade-details">
                <div class="trade-info">
                    <span>Lot: ${trade.lotSize || '0.01'}</span>
                    <span>Date: ${new Date(trade.date || Date.now()).toLocaleDateString()}</span>
                </div>
                <div class="trade-pnl ${pnlClass}">$${pnl.toFixed(2)}</div>
            </div>
        `;
        
        // Ajouter événement tactile
        div.addEventListener('click', () => {
            this.showTradeDetails(trade);
        });
        
        return div;
    }

    async loadRanking() {
        try {
            if (!window.firebaseDB) return;

            const usersRef = window.dbRef(window.firebaseDB, 'users');
            const snapshot = await window.dbGet(usersRef);
            
            if (snapshot.exists()) {
                const users = snapshot.val();
                this.displayRanking(users);
            }
        } catch (error) {
            console.error('Erreur chargement classement:', error);
        }
    }

    displayRanking(users) {
        const container = document.getElementById('mobileRankingList');
        if (!container) return;

        const rankings = [];
        
        Object.keys(users).forEach(userId => {
            const user = users[userId];
            let trades = [];
            
            if (user.accounts && user.accounts.compte1 && user.accounts.compte1.trades) {
                trades = Array.isArray(user.accounts.compte1.trades) 
                    ? user.accounts.compte1.trades 
                    : Object.values(user.accounts.compte1.trades);
            }
            
            const closedTrades = trades.filter(t => t.status === 'closed');
            const totalProfit = closedTrades.reduce((sum, trade) => sum + parseFloat(trade.pnl || 0), 0);
            const winningTrades = closedTrades.filter(trade => parseFloat(trade.pnl || 0) > 0).length;
            const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0;
            
            if (closedTrades.length > 0) {
                const savedPseudo = localStorage.getItem(`pseudo_${userId}`);
                const displayName = savedPseudo || user.pseudo || user.email?.split('@')[0] || 'Utilisateur';
                
                rankings.push({
                    userId,
                    name: displayName,
                    profit: totalProfit,
                    winRate: winRate,
                    trades: closedTrades.length
                });
            }
        });

        rankings.sort((a, b) => b.profit - a.profit);
        
        container.innerHTML = '';
        
        if (rankings.length === 0) {
            container.innerHTML = '<div class="no-data">Aucun trader dans le classement</div>';
            return;
        }

        rankings.slice(0, 10).forEach((user, index) => {
            const item = document.createElement('div');
            item.className = 'ranking-item';
            
            const medals = ['🥇', '🥈', '🥉'];
            const position = index < 3 ? medals[index] : `#${index + 1}`;
            
            const isCurrentUser = user.userId === this.currentUser;
            if (isCurrentUser) {
                item.style.background = 'rgba(0, 212, 255, 0.1)';
                item.style.border = '1px solid rgba(0, 212, 255, 0.3)';
            }
            
            item.innerHTML = `
                <div class="ranking-position">${position}</div>
                <div class="ranking-user">
                    <div class="ranking-name">${user.name}${isCurrentUser ? ' (Vous)' : ''}</div>
                    <div class="ranking-trades">${user.trades} trades</div>
                </div>
                <div class="ranking-stats">
                    <div class="ranking-profit ${user.profit >= 0 ? 'positive' : 'negative'}">$${user.profit.toFixed(2)}</div>
                    <div class="ranking-winrate">${user.winRate.toFixed(1)}% WR</div>
                </div>
            `;
            
            container.appendChild(item);
        });
    }

    // Navigation
    toggleMenu() {
        const menu = document.getElementById('mobileMenu');
        menu.classList.toggle('active');
        
        if ('vibrate' in navigator) {
            navigator.vibrate(30);
        }
    }

    showSection(sectionName) {
        // Cacher toutes les sections
        document.querySelectorAll('.mobile-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Afficher la section demandée
        const section = document.getElementById(sectionName + 'Section');
        if (section) {
            section.classList.add('active');
        }
        
        // Mettre à jour la navigation
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeItem = document.querySelector(`a[href="#${sectionName}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
        
        this.currentSection = sectionName;
        this.toggleMenu();
        
        // Charger les données spécifiques à la section
        if (sectionName === 'trades') {
            this.loadAllTrades();
        } else if (sectionName === 'ranking') {
            this.loadRanking();
        }
    }

    loadAllTrades() {
        const container = document.getElementById('allTradesList');
        if (!container) return;

        container.innerHTML = '';

        if (this.trades.length === 0) {
            container.innerHTML = '<div class="no-trades">Aucun trade enregistré</div>';
            return;
        }

        this.trades.forEach(trade => {
            const item = this.createTradeItem(trade);
            container.appendChild(item);
        });
    }

    filterTrades() {
        const filter = document.getElementById('tradesFilter').value;
        let filteredTrades = [...this.trades];
        
        if (filter !== 'all') {
            filteredTrades = this.trades.filter(trade => trade.status === filter);
        }
        
        const container = document.getElementById('allTradesList');
        container.innerHTML = '';
        
        filteredTrades.forEach(trade => {
            const item = this.createTradeItem(trade);
            container.appendChild(item);
        });
    }

    // Actions
    newTrade() {
        this.showModal('Nouveau Trade', this.getNewTradeForm());
    }

    getNewTradeForm() {
        return `
            <div class="mobile-form">
                <div class="form-group">
                    <label>Instrument</label>
                    <select id="tradeCurrency">
                        <option value="EUR/USD">EUR/USD</option>
                        <option value="GBP/USD">GBP/USD</option>
                        <option value="USD/JPY">USD/JPY</option>
                        <option value="AUD/USD">AUD/USD</option>
                        <option value="USD/CAD">USD/CAD</option>
                        <option value="XAU/USD">XAU/USD</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Type</label>
                    <select id="tradeType">
                        <option value="BUY">BUY</option>
                        <option value="SELL">SELL</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Lot Size</label>
                    <input type="number" id="tradeLotSize" step="0.01" min="0.01" placeholder="0.10">
                </div>
                <div class="form-group">
                    <label>Point d'entrée</label>
                    <input type="number" id="tradeEntry" step="0.00001" placeholder="1.12345">
                </div>
                <div class="form-group">
                    <label>Stop Loss</label>
                    <input type="number" id="tradeStopLoss" step="0.00001" placeholder="1.12000">
                </div>
                <div class="form-group">
                    <label>Take Profit</label>
                    <input type="number" id="tradeTakeProfit" step="0.00001" placeholder="1.13000">
                </div>
                <div class="form-actions">
                    <button class="btn-primary" onclick="mobileDashboard.saveTrade()">Enregistrer</button>
                    <button class="btn-secondary" onclick="mobileDashboard.closeModal()">Annuler</button>
                </div>
            </div>
        `;
    }

    async saveTrade() {
        const currency = document.getElementById('tradeCurrency').value;
        const type = document.getElementById('tradeType').value;
        const lotSize = parseFloat(document.getElementById('tradeLotSize').value);
        const entry = parseFloat(document.getElementById('tradeEntry').value);
        const stopLoss = parseFloat(document.getElementById('tradeStopLoss').value);
        const takeProfit = parseFloat(document.getElementById('tradeTakeProfit').value);

        if (!currency || !type || !lotSize || !entry || !stopLoss || !takeProfit) {
            this.showToast('Veuillez remplir tous les champs', 'error');
            return;
        }

        const trade = {
            id: `${this.currentUser}_${Date.now()}`,
            currency,
            type,
            lotSize,
            entryPoint: entry,
            stopLoss,
            takeProfit,
            status: 'open',
            date: new Date().toISOString().split('T')[0],
            createdAt: Date.now()
        };

        this.trades.push(trade);
        await this.saveData();
        
        this.closeModal();
        this.updateStats();
        this.loadRecentTrades();
        
        this.showToast('Trade enregistré!', 'success');
        this.playNotificationSound();
        
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
        }
    }

    closeTrade() {
        const openTrades = this.trades.filter(t => t.status === 'open');
        if (openTrades.length === 0) {
            this.showToast('Aucun trade ouvert', 'warning');
            return;
        }
        
        this.showModal('Clôturer Trade', this.getCloseTradeForm(openTrades));
    }

    getCloseTradeForm(openTrades) {
        return `
            <div class="mobile-form">
                <div class="form-group">
                    <label>Trade à clôturer</label>
                    <select id="tradeToClose">
                        ${openTrades.map((trade, index) => `
                            <option value="${this.trades.indexOf(trade)}">
                                ${trade.currency} ${trade.type} - ${trade.lotSize} lots
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Prix de sortie</label>
                    <input type="number" id="exitPrice" step="0.00001" placeholder="1.12500">
                </div>
                <div class="form-group">
                    <label>P&L ($)</label>
                    <input type="number" id="tradePnL" step="0.01" placeholder="25.50">
                </div>
                <div class="form-actions">
                    <button class="btn-primary" onclick="mobileDashboard.saveCloseTrade()">Clôturer</button>
                    <button class="btn-secondary" onclick="mobileDashboard.closeModal()">Annuler</button>
                </div>
            </div>
        `;
    }

    async saveCloseTrade() {
        const tradeIndex = parseInt(document.getElementById('tradeToClose').value);
        const exitPrice = parseFloat(document.getElementById('exitPrice').value);
        const pnl = parseFloat(document.getElementById('tradePnL').value);

        if (isNaN(tradeIndex) || isNaN(exitPrice) || isNaN(pnl)) {
            this.showToast('Veuillez remplir tous les champs', 'error');
            return;
        }

        this.trades[tradeIndex].status = 'closed';
        this.trades[tradeIndex].exitPoint = exitPrice;
        this.trades[tradeIndex].pnl = pnl;
        this.trades[tradeIndex].closedAt = Date.now();

        await this.saveData();
        
        this.closeModal();
        this.updateStats();
        this.loadRecentTrades();
        
        this.showToast('Trade clôturé!', 'success');
        this.playNotificationSound();
        
        if ('vibrate' in navigator) {
            navigator.vibrate([50, 30, 50]);
        }
    }

    showRanking() {
        this.showSection('ranking');
    }

    showSettings() {
        this.showSection('settings');
    }

    // Settings
    editProfile() {
        const currentPseudo = localStorage.getItem(`pseudo_${this.currentUser}`) || 
                            sessionStorage.getItem('userEmail')?.split('@')[0] || '';
        
        this.showModal('Modifier Profil', `
            <div class="mobile-form">
                <div class="form-group">
                    <label>Pseudo</label>
                    <input type="text" id="newPseudo" value="${currentPseudo}" maxlength="20">
                </div>
                <div class="form-actions">
                    <button class="btn-primary" onclick="mobileDashboard.savePseudo()">Sauvegarder</button>
                    <button class="btn-secondary" onclick="mobileDashboard.closeModal()">Annuler</button>
                </div>
            </div>
        `);
    }

    savePseudo() {
        const newPseudo = document.getElementById('newPseudo').value.trim();
        
        if (!newPseudo) {
            this.showToast('Veuillez entrer un pseudo', 'error');
            return;
        }
        
        localStorage.setItem(`pseudo_${this.currentUser}`, newPseudo);
        
        const displayElement = document.getElementById('userDisplay');
        if (displayElement) {
            displayElement.textContent = newPseudo;
        }
        
        this.closeModal();
        this.showToast('Pseudo mis à jour!', 'success');
    }

    editCapital() {
        this.showModal('Modifier Capital', `
            <div class="mobile-form">
                <div class="form-group">
                    <label>Capital Initial ($)</label>
                    <input type="number" id="newCapital" value="${this.settings.capital}" step="100" min="100">
                </div>
                <div class="form-actions">
                    <button class="btn-primary" onclick="mobileDashboard.saveCapital()">Sauvegarder</button>
                    <button class="btn-secondary" onclick="mobileDashboard.closeModal()">Annuler</button>
                </div>
            </div>
        `);
    }

    async saveCapital() {
        const newCapital = parseFloat(document.getElementById('newCapital').value);
        
        if (isNaN(newCapital) || newCapital < 100) {
            this.showToast('Capital minimum: $100', 'error');
            return;
        }
        
        this.settings.capital = newCapital;
        await this.saveData();
        
        this.closeModal();
        this.updateStats();
        this.showToast('Capital mis à jour!', 'success');
    }

    toggleNotifications() {
        const toggle = document.getElementById('notificationsToggle');
        this.settings.notifications = toggle.checked;
        this.saveData();
        
        if (toggle.checked && !this.notificationPermission) {
            this.initNotifications();
        }
    }

    exportData() {
        if (this.trades.length === 0) {
            this.showToast('Aucune donnée à exporter', 'warning');
            return;
        }

        const data = {
            trades: this.trades,
            settings: this.settings,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `misterpips_mobile_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.showToast('Export terminé!', 'success');
    }

    // Modal
    showModal(title, content) {
        const modal = document.getElementById('mobileModal');
        const titleElement = document.getElementById('modalTitle');
        const bodyElement = document.getElementById('modalBody');
        
        titleElement.textContent = title;
        bodyElement.innerHTML = content;
        
        modal.classList.add('active');
        
        if ('vibrate' in navigator) {
            navigator.vibrate(30);
        }
    }

    closeModal() {
        const modal = document.getElementById('mobileModal');
        modal.classList.remove('active');
    }

    showTradeDetails(trade) {
        const pnl = parseFloat(trade.pnl || 0);
        const status = trade.status === 'open' ? 'Ouvert' : 'Fermé';
        
        this.showModal('Détails du Trade', `
            <div class="trade-details-modal">
                <div class="detail-row">
                    <span class="detail-label">Instrument:</span>
                    <span class="detail-value">${trade.currency}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Type:</span>
                    <span class="detail-value">${trade.type}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Lot Size:</span>
                    <span class="detail-value">${trade.lotSize}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Entrée:</span>
                    <span class="detail-value">${trade.entryPoint}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Stop Loss:</span>
                    <span class="detail-value">${trade.stopLoss}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Take Profit:</span>
                    <span class="detail-value">${trade.takeProfit}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">P&L:</span>
                    <span class="detail-value ${pnl >= 0 ? 'positive' : 'negative'}">$${pnl.toFixed(2)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value">${status}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date:</span>
                    <span class="detail-value">${new Date(trade.date).toLocaleDateString()}</span>
                </div>
            </div>
        `);
    }

    // Notifications
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
        
        // Notification système si autorisée
        if (this.notificationPermission && this.settings.notifications) {
            new Notification('Misterpips', {
                body: message,
                icon: 'assets/images/Misterpips.jpg'
            });
        }
    }

    playNotificationSound() {
        if (!this.settings.sounds) return;
        
        try {
            // Créer un son simple
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.log('Son non disponible:', error);
        }
    }

    async logout() {
        try {
            if (window.firebaseAuth && window.signOut) {
                await window.signOut(window.firebaseAuth);
            }
            sessionStorage.clear();
            localStorage.removeItem(`mobile_dashboard_${this.currentUser}`);
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Erreur déconnexion:', error);
            window.location.href = 'index.html';
        }
    }
}

// Initialisation
let mobileDashboard;

function initializeMobileDashboard() {
    console.log('📱 Démarrage mobile dashboard...');
    try {
        mobileDashboard = new MobileDashboard();
        window.mobileDashboard = mobileDashboard;
        console.log('✅ Mobile dashboard créé');
    } catch (error) {
        console.error('❌ Erreur création mobile dashboard:', error);
    }
}

// Démarrer quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMobileDashboard);
} else {
    setTimeout(initializeMobileDashboard, 100);
}

// Gérer les événements de visibilité pour les notifications
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('📱 App en arrière-plan');
    } else {
        console.log('📱 App au premier plan');
        if (mobileDashboard) {
            mobileDashboard.loadData();
        }
    }
});

console.log('📱 Script mobile dashboard chargé avec succès');