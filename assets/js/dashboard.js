// Dashboard Trading - Version Optimisée
console.log('Loading dashboard script...');

class SimpleTradingDashboard {
    constructor() {
        console.log('Creating dashboard instance...');
        this.currentUser = sessionStorage.getItem('firebaseUID');
        if (!this.currentUser) {
            console.error('Aucun UID Firebase trouvé!');
            alert('Erreur: Vous devez être connecté pour accéder au dashboard');
            window.location.href = 'index.html';
            return;
        }
        this.currentAccount = 'compte1';
        this.trades = [];
        this.settings = { 
            capital: 1000, 
            riskPerTrade: 2,
            dailyTarget: 1,
            weeklyTarget: 3,
            monthlyTarget: 15,
            yearlyTarget: 200
        };
        this.accounts = {
            'compte1': { name: 'Compte Principal', capital: 1000 },
            'compte2': { name: 'Compte Démo', capital: 500 },
            'compte3': { name: 'Compte Swing', capital: 2000 }
        };
        this.currentCalendarDate = new Date();
        this.currentStep = 0;
        this.currentTrade = {};
        this.charts = {};
        this.chatVisible = false;
        this.unreadMessages = 0;
        this.init();
    }

    async init() {
        console.log('Initializing dashboard...');
        await this.loadData();
        this.setupEventListeners();
        this.updateStats();
        this.renderTradesTable();
        this.initCharts();
        
        // Charger le classement après un délai pour s'assurer que Firebase est prêt
        setTimeout(() => {
            this.loadRanking();
        }, 2000);
        
        // Écouter les messages du chat
        this.setupChatListener();
        
        document.body.style.opacity = '1';
        document.body.style.visibility = 'visible';
        
        console.log('Dashboard initialized successfully');
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        setTimeout(() => {
            this.bindButton('newTradeBtn', () => this.startNewTrade());
            this.bindButton('settingsBtn', () => this.showSettings());
            this.bindButton('closeTradeBtn', () => this.showCloseTradeModal());
            this.bindButton('exportBtn', () => this.exportToExcel());
            this.bindButton('historyTradeBtn', () => this.showHistoryTradeModal());
            this.bindButton('addAccountBtn', () => this.addNewAccount());
            this.bindButton('deleteAccountBtn', () => this.deleteAccount());
            this.bindButton('vipHomeBtn', () => window.location.href = 'index.html');
            this.bindButton('backBtn', () => window.location.href = 'vip-space.html');
            this.bindButton('logoutBtn', () => this.logout());
            
            // Navigation sidebar
            document.querySelectorAll('.nav-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const href = item.getAttribute('href');
                    if (href === '#trades') {
                        this.showMyTrades();
                    } else if (href === '#analytics') {
                        this.showAnalytics();
                    } else if (href === '#overview') {
                        this.showOverview();
                    }
                });
            });
            
            // Chat functionality
            const chatToggle = document.querySelector('.chat-toggle');
            const chatContainer = document.querySelector('.chat-container');
            const chatClose = document.querySelector('.chat-close');
            const chatInput = document.getElementById('chatInput');
            const sendBtn = document.getElementById('sendBtn');
            
            if (chatToggle && chatContainer) {
                chatToggle.addEventListener('click', () => {
                    const isVisible = chatContainer.style.display !== 'none';
                    chatContainer.style.display = isVisible ? 'none' : 'block';
                    if (!isVisible) {
                        this.unreadMessages = 0;
                        this.updateChatBadge();
                    }
                });
            }
            
            if (chatClose && chatContainer) {
                chatClose.addEventListener('click', () => {
                    chatContainer.style.display = 'none';
                    this.chatVisible = false;
                });
            }
            
            if (sendBtn && chatInput) {
                sendBtn.addEventListener('click', () => {
                    console.log('Send button clicked');
                    this.sendChatMessage();
                });
                chatInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        console.log('Enter pressed');
                        this.sendChatMessage();
                    }
                });
            }
            

            
            // Ranking period change
            const rankingPeriod = document.getElementById('rankingPeriod');
            if (rankingPeriod) {
                rankingPeriod.addEventListener('change', () => this.loadRanking());
            }
            
            const accountSelect = document.getElementById('accountSelect');
            if (accountSelect) {
                accountSelect.onchange = (e) => this.switchAccount(e.target.value);
            }
            
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-close') || e.target.textContent === '×') {
                    this.closeModal();
                }
                if (e.target.id === 'tradeModal') {
                    this.closeModal();
                }
            });
            
            console.log('✅ Event listeners configured');
        }, 500);
    }

    bindButton(id, handler) {
        const button = document.getElementById(id);
        if (button) {
            button.onclick = handler;
            console.log(`✅ ${id} button configured`);
        } else {
            console.warn(`⚠️ ${id} button not found`);
        }
    }

    async loadData() {
        try {
            if (window.firebaseDB) {
                await this.loadFromFirebase();
            } else {
                this.loadFromLocalStorage();
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.loadFromLocalStorage();
        }
    }

    loadFromLocalStorage() {
        try {
            const savedData = localStorage.getItem(`dashboard_${this.currentUser}`);
            if (savedData) {
                const data = JSON.parse(savedData);
                this.trades = data.trades || [];
                this.settings = data.settings || this.settings;
                this.accounts = data.accounts || this.accounts;
                this.currentAccount = data.currentAccount || this.currentAccount;
                console.log('Données chargées depuis localStorage');
            }
        } catch (error) {
            console.error('Erreur chargement local:', error);
        }
    }

    async loadFromFirebase() {
        try {
            const userRef = window.dbRef(window.firebaseDB, `dashboards/${this.currentUser}`);
            const snapshot = await window.dbGet(userRef);
            
            if (snapshot.exists()) {
                const data = snapshot.val();
                this.trades = data.trades || [];
                this.settings = data.settings || this.settings;
                this.accounts = data.accounts || this.accounts;
                this.currentAccount = data.currentAccount || this.currentAccount;
                console.log('Données chargées depuis Firebase');
            }
        } catch (error) {
            console.error('Erreur chargement Firebase:', error);
        }
    }

    async saveData() {
        try {
            if (window.firebaseDB) {
                await this.saveToFirebase();
            }
            this.saveToLocalStorage();
        } catch (error) {
            console.error('Error saving data:', error);
            this.saveToLocalStorage();
        }
    }

    saveToLocalStorage() {
        try {
            const allData = {
                trades: this.trades,
                settings: this.settings,
                accounts: this.accounts,
                currentAccount: this.currentAccount,
                lastUpdated: new Date().toISOString()
            };
            
            localStorage.setItem(`dashboard_${this.currentUser}`, JSON.stringify(allData));
            
            const syncStatus = document.getElementById('syncStatus');
            if (syncStatus) {
                syncStatus.textContent = '✅ Sauvegardé';
                setTimeout(() => {
                    syncStatus.textContent = '💾 Local';
                }, 1000);
            }
        } catch (error) {
            console.error('Erreur sauvegarde locale:', error);
        }
    }

    async saveToFirebase() {
        if (!window.firebaseDB) return;
        
        try {
            const dataToSave = {
                trades: this.trades,
                settings: this.settings,
                accounts: this.accounts,
                currentAccount: this.currentAccount,
                lastUpdated: new Date().toISOString()
            };
            
            const dashboardRef = window.dbRef(window.firebaseDB, `dashboards/${this.currentUser}`);
            await window.dbSet(dashboardRef, dataToSave);
            
            // Récupérer les données existantes pour préserver le pseudo
            const userRef = window.dbRef(window.firebaseDB, `users/${this.currentUser}`);
            const snapshot = await window.dbGet(userRef);
            
            let userData = {
                isVIP: true,
                plan: 'VIP',
                email: sessionStorage.getItem('userEmail') || 'user@example.com',
                accounts: {
                    compte1: {
                        trades: this.trades,
                        capital: this.accounts[this.currentAccount]?.capital || this.settings.capital,
                        settings: this.settings
                    }
                },
                lastUpdated: new Date().toISOString()
            };
            
            // Préserver le pseudo existant
            if (snapshot.exists()) {
                const existingData = snapshot.val();
                if (existingData.pseudo) {
                    userData.pseudo = existingData.pseudo;
                }
            }
            
            // Ajouter le pseudo depuis localStorage si disponible
            const savedPseudo = localStorage.getItem(`pseudo_${this.currentUser}`);
            if (savedPseudo) {
                userData.pseudo = savedPseudo;
            }
            
            await window.dbSet(userRef, userData);
            
            const syncStatus = document.getElementById('syncStatus');
            if (syncStatus) {
                syncStatus.textContent = '✅ Firebase OK';
                setTimeout(() => {
                    syncStatus.textContent = '🔥 Firebase';
                }, 2000);
            }
            
            console.log('✅ Données sauvegardées Firebase');
        } catch (error) {
            console.error('Erreur sauvegarde Firebase:', error);
        }
    }

    updateStats() {
        const closedTrades = this.trades.filter(t => t.status === 'closed');
        const openTrades = this.trades.filter(t => t.status === 'open');
        const totalPnL = closedTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
        const winningTrades = closedTrades.filter(t => parseFloat(t.pnl || 0) > 0);
        const winRate = closedTrades.length > 0 ? 
            (winningTrades.length / closedTrades.length * 100).toFixed(1) : 0;
        
        const initialCapital = this.accounts[this.currentAccount]?.capital || this.settings.capital;
        const currentCapital = initialCapital + totalPnL;
        const capitalChange = initialCapital > 0 ? ((totalPnL / initialCapital) * 100).toFixed(1) : 0;
        
        this.updateElement('totalTrades', this.trades.length);
        this.updateElement('openTrades', openTrades.length);
        this.updateElement('totalPnL', `$${totalPnL.toFixed(2)}`, totalPnL >= 0 ? 'positive' : 'negative');
        this.updateElement('winRate', `${winRate}%`);
        this.updateElement('capital', `$${currentCapital.toFixed(2)}`, totalPnL >= 0 ? 'positive' : 'negative');
        
        // Mettre à jour les indicateurs de changement
        const statChanges = document.querySelectorAll('.stat-change');
        if (statChanges.length >= 3) {
            statChanges[0].textContent = `${capitalChange >= 0 ? '+' : ''}${capitalChange}%`;
            statChanges[0].className = `stat-change ${capitalChange >= 0 ? 'positive' : 'negative'}`;
            
            const recentWinRate = this.calculateRecentWinRate();
            statChanges[1].textContent = `${recentWinRate >= 0 ? '+' : ''}${recentWinRate}%`;
            statChanges[1].className = `stat-change ${recentWinRate >= 0 ? 'positive' : 'negative'}`;
            
            statChanges[2].textContent = `${totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(0)}`;
            statChanges[2].className = `stat-change ${totalPnL >= 0 ? 'positive' : 'negative'}`;
        }
        
        this.updateTradingPlan();
    }

    updateElement(id, text, className = '') {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
            if (className) {
                element.className = className;
            }
        }
    }

    startNewTrade() {
        console.log('Starting new trade...');
        this.currentTrade = {
            date: new Date().toISOString().split('T')[0]
        };
        this.showModal();
        this.renderTradeForm();
    }

    renderTradeForm() {
        const modalContent = document.getElementById('modalContent');
        if (!modalContent) return;
        
        modalContent.innerHTML = `
            <div class="trade-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>Instrument</label>
                        <select id="currency">
                            <option value="EUR/USD">EUR/USD</option>
                            <option value="GBP/USD">GBP/USD</option>
                            <option value="USD/JPY">USD/JPY</option>
                            <option value="AUD/USD">AUD/USD</option>
                            <option value="USD/CAD">USD/CAD</option>
                            <option value="BTC/USD">BTC/USD</option>
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
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Point d'entrée</label>
                        <input type="number" id="entryPoint" step="0.00001" placeholder="1.12345">
                    </div>
                    <div class="form-group">
                        <label>Lot Size</label>
                        <input type="number" id="lotSize" step="0.01" min="0.01" placeholder="0.10">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Stop Loss</label>
                        <input type="number" id="stopLoss" step="0.00001" placeholder="1.12000">
                    </div>
                    <div class="form-group">
                        <label>Take Profit</label>
                        <input type="number" id="takeProfit" step="0.00001" placeholder="1.13000">
                    </div>
                </div>
                <div class="form-actions">
                    <button class="btn-primary" onclick="dashboard.saveTrade()">Enregistrer Trade</button>
                    <button class="btn-secondary" onclick="dashboard.closeModal()">Annuler</button>
                </div>
            </div>
        `;
    }

    saveTrade() {
        const currency = document.getElementById('currency')?.value;
        const tradeType = document.getElementById('tradeType')?.value;
        const entryPoint = parseFloat(document.getElementById('entryPoint')?.value);
        const stopLoss = parseFloat(document.getElementById('stopLoss')?.value);
        const takeProfit = parseFloat(document.getElementById('takeProfit')?.value);
        const lotSize = parseFloat(document.getElementById('lotSize')?.value);

        if (!currency || !tradeType || !entryPoint || !stopLoss || !takeProfit || !lotSize) {
            this.showNotification('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }

        if (entryPoint <= 0 || stopLoss <= 0 || takeProfit <= 0 || lotSize <= 0) {
            this.showNotification('Les valeurs doivent être positives', 'error');
            return;
        }

        const trade = {
            ...this.currentTrade,
            id: `${this.currentUser}_${Date.now()}`,
            currency,
            type: tradeType,
            entryPoint,
            stopLoss,
            takeProfit,
            lotSize,
            status: 'open',
            date: new Date().toISOString().split('T')[0],
            createdAt: Date.now()
        };
        
        this.trades.push(trade);
        this.saveData();
        this.closeModal();
        this.fullDashboardUpdate();
        this.showNotification('Trade enregistré avec succès!', 'success');
    }

    showSettings() {
        const modalContent = document.getElementById('modalContent');
        if (!modalContent) return;
        
        modalContent.innerHTML = `
            <h2>⚙️ Paramètres</h2>
            <div class="trade-form">
                <div class="form-group">
                    <label>Capital initial ($):</label>
                    <input type="number" id="capitalInput" value="${this.settings.capital}" step="100">
                </div>
                <div class="form-group">
                    <label>Risque par trade (%):</label>
                    <input type="number" id="riskInput" value="${this.settings.riskPerTrade}" step="0.1" min="0.1" max="10">
                </div>
                <h3 style="color: #00d4ff; margin: 20px 0 15px 0;">🎯 Plan de Trading</h3>
                <div class="form-group">
                    <label>Objectif journalier (% du capital):</label>
                    <input type="number" id="dailyTargetInput" value="${this.settings.dailyTarget}" step="0.1" min="0.1">
                </div>
                <div class="form-group">
                    <label>Objectif hebdomadaire (% du capital):</label>
                    <input type="number" id="weeklyTargetInput" value="${this.settings.weeklyTarget}" step="0.5" min="0.5">
                </div>
                <div class="form-group">
                    <label>Objectif mensuel (% du capital):</label>
                    <input type="number" id="monthlyTargetInput" value="${this.settings.monthlyTarget}" step="1" min="1">
                </div>
                <div class="form-group">
                    <label>Objectif annuel (% du capital):</label>
                    <input type="number" id="yearlyTargetInput" value="${this.settings.yearlyTarget}" step="10" min="10">
                </div>
                <div class="form-buttons">
                    <button class="btn-submit" onclick="dashboard.saveSettings()">Sauvegarder</button>
                    <button class="btn-secondary" onclick="dashboard.closeModal()">Annuler</button>
                </div>
            </div>
        `;
        
        this.showModal();
    }

    saveSettings() {
        const capital = parseFloat(document.getElementById('capitalInput')?.value) || 1000;
        const riskPerTrade = parseFloat(document.getElementById('riskInput')?.value) || 2;
        const dailyTarget = parseFloat(document.getElementById('dailyTargetInput')?.value) || 1;
        const weeklyTarget = parseFloat(document.getElementById('weeklyTargetInput')?.value) || 3;
        const monthlyTarget = parseFloat(document.getElementById('monthlyTargetInput')?.value) || 15;
        const yearlyTarget = parseFloat(document.getElementById('yearlyTargetInput')?.value) || 200;
        
        this.settings = { capital, riskPerTrade, dailyTarget, weeklyTarget, monthlyTarget, yearlyTarget };
        this.accounts[this.currentAccount].capital = capital;
        this.saveData();
        this.closeModal();
        this.fullDashboardUpdate();
        this.showNotification('Paramètres sauvegardés!');
    }

    renderTradesTable() {
        const tbody = document.getElementById('tradesTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (this.trades.length === 0) {
            tbody.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted); grid-column: 1 / -1;">Aucun trade enregistré</div>';
            return;
        }
        
        this.trades.slice(-5).reverse().forEach((trade, index) => {
            const row = document.createElement('div');
            row.className = 'trade-row';
            const pnl = parseFloat(trade.pnl || 0);
            const pnlClass = pnl > 0 ? 'positive' : pnl < 0 ? 'negative' : 'neutral';
            
            row.innerHTML = `
                <div>${new Date(trade.date).toLocaleDateString()}</div>
                <div>${trade.currency}</div>
                <div>${trade.type || 'BUY'}</div>
                <div>${trade.lotSize}</div>
                <div class="${pnlClass}">$${pnl.toFixed(2)}</div>
                <div><span class="status-badge ${trade.status}">${trade.status === 'open' ? 'Ouvert' : 'Fermé'}</span></div>
                <div>
                    <button class="action-btn-small" onclick="dashboard.editTrade(${this.trades.indexOf(trade)})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn-small share" onclick="dashboard.shareTradeImage(${this.trades.indexOf(trade)})" title="Partager sur Telegram">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
            `;
            tbody.appendChild(row);
        });
    }

    fullDashboardUpdate() {
        console.log('🔄 Mise à jour complète du dashboard...');
        this.updateStats();
        this.renderTradesTable();
        setTimeout(() => {
            this.initCharts();
        }, 100);
        console.log('✅ Mise à jour complète terminée');
    }

    showModal() {
        const modal = document.getElementById('tradeModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal() {
        const modal = document.getElementById('tradeModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #00d4ff, #5b86e5);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Nouvelles fonctions pour la navigation
    showOverview() {
        document.querySelectorAll('.dashboard-content > section').forEach(section => {
            section.style.display = 'block';
        });
        document.getElementById('rankingSection').style.display = 'none';
        
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.querySelector('a[href="#overview"]').classList.add('active');
    }

    showMyTrades() {
        document.querySelectorAll('.dashboard-content > section').forEach(section => {
            section.style.display = 'none';
        });
        
        const tradesSection = document.querySelector('.trades-section');
        if (tradesSection) {
            tradesSection.style.display = 'block';
            this.showAllTradesModal();
        }
        
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.querySelector('a[href="#trades"]').classList.add('active');
    }

    showAnalytics() {
        document.querySelectorAll('.dashboard-content > section').forEach(section => {
            section.style.display = 'none';
        });
        
        const chartsSection = document.querySelector('.charts-section');
        const statsSection = document.querySelector('.stats-section');
        if (chartsSection) chartsSection.style.display = 'block';
        if (statsSection) statsSection.style.display = 'block';
        
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.querySelector('a[href="#analytics"]').classList.add('active');
        
        setTimeout(() => this.initCharts(), 100);
    }

    showAllTradesModal() {
        const modalContent = document.getElementById('modalContent');
        if (!modalContent) return;
        
        modalContent.innerHTML = `
            <h2>📊 Tous mes Trades</h2>
            <div class="trades-filter">
                <select id="statusFilter">
                    <option value="all">Tous les statuts</option>
                    <option value="open">Ouverts</option>
                    <option value="closed">Fermés</option>
                </select>
                <select id="periodFilter">
                    <option value="all">Toutes les périodes</option>
                    <option value="today">Aujourd'hui</option>
                    <option value="week">Cette semaine</option>
                    <option value="month">Ce mois</option>
                </select>
            </div>
            <div class="all-trades-table">
                <div class="table-header">
                    <div>Date</div>
                    <div>Paire</div>
                    <div>Type</div>
                    <div>Entrée</div>
                    <div>SL</div>
                    <div>TP</div>
                    <div>Lot</div>
                    <div>P&L</div>
                    <div>Status</div>
                    <div>Actions</div>
                </div>
                <div id="allTradesBody" class="table-body">
                    ${this.renderAllTrades()}
                </div>
            </div>
        `;
        
        this.showModal();
        
        // Event listeners pour les filtres
        document.getElementById('statusFilter').addEventListener('change', () => this.filterTrades());
        document.getElementById('periodFilter').addEventListener('change', () => this.filterTrades());
    }

    renderAllTrades() {
        if (this.trades.length === 0) {
            return '<div class="no-trades">Aucun trade enregistré</div>';
        }
        
        return this.trades.map((trade, index) => {
            const pnl = parseFloat(trade.pnl || 0);
            const pnlClass = pnl > 0 ? 'positive' : pnl < 0 ? 'negative' : 'neutral';
            
            return `
                <div class="trade-row">
                    <div>${new Date(trade.date).toLocaleDateString()}</div>
                    <div>${trade.currency}</div>
                    <div>${trade.type || 'BUY'}</div>
                    <div>${trade.entryPoint}</div>
                    <div>${trade.stopLoss}</div>
                    <div>${trade.takeProfit}</div>
                    <div>${trade.lotSize}</div>
                    <div class="${pnlClass}">$${pnl.toFixed(2)}</div>
                    <div><span class="status-badge ${trade.status}">${trade.status === 'open' ? 'Ouvert' : 'Fermé'}</span></div>
                    <div>
                        <button class="action-btn-small" onclick="dashboard.editTrade(${index})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn-small delete" onclick="dashboard.deleteTrade(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    filterTrades() {
        const statusFilter = document.getElementById('statusFilter').value;
        const periodFilter = document.getElementById('periodFilter').value;
        
        let filteredTrades = [...this.trades];
        
        if (statusFilter !== 'all') {
            filteredTrades = filteredTrades.filter(trade => trade.status === statusFilter);
        }
        
        if (periodFilter !== 'all') {
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            
            if (periodFilter === 'today') {
                filteredTrades = filteredTrades.filter(trade => trade.date === today);
            } else if (periodFilter === 'week') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filteredTrades = filteredTrades.filter(trade => new Date(trade.date) >= weekAgo);
            } else if (periodFilter === 'month') {
                const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                filteredTrades = filteredTrades.filter(trade => new Date(trade.date) >= monthAgo);
            }
        }
        
        const allTradesBody = document.getElementById('allTradesBody');
        if (allTradesBody) {
            allTradesBody.innerHTML = this.renderFilteredTrades(filteredTrades);
        }
    }

    renderFilteredTrades(trades) {
        if (trades.length === 0) {
            return '<div class="no-trades">Aucun trade trouvé pour ces critères</div>';
        }
        
        return trades.map((trade, index) => {
            const pnl = parseFloat(trade.pnl || 0);
            const pnlClass = pnl > 0 ? 'positive' : pnl < 0 ? 'negative' : 'neutral';
            const originalIndex = this.trades.indexOf(trade);
            
            return `
                <div class="trade-row">
                    <div>${new Date(trade.date).toLocaleDateString()}</div>
                    <div>${trade.currency}</div>
                    <div>${trade.type || 'BUY'}</div>
                    <div>${trade.entryPoint}</div>
                    <div>${trade.stopLoss}</div>
                    <div>${trade.takeProfit}</div>
                    <div>${trade.lotSize}</div>
                    <div class="${pnlClass}">$${pnl.toFixed(2)}</div>
                    <div><span class="status-badge ${trade.status}">${trade.status === 'open' ? 'Ouvert' : 'Fermé'}</span></div>
                    <div>
                        <button class="action-btn-small" onclick="dashboard.editTrade(${originalIndex})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn-small delete" onclick="dashboard.deleteTrade(${originalIndex})">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="action-btn-small share" onclick="dashboard.shareTradeImage(${originalIndex})" title="Partager">
                            <i class="fas fa-share-alt"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    sendChatMessage() {
        const chatInput = document.getElementById('chatInput');
        const chatMessages = document.querySelector('.chat-messages');
        
        if (!chatInput || !chatMessages) return;
        
        const message = chatInput.value.trim();
        if (!message) return;
        
        // Afficher immédiatement le message
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user';
        messageDiv.innerHTML = `
            <div class="message-content">
                <span class="message-author">Vous</span>
                <p>${message}</p>
                <span class="message-time">${new Date().toLocaleTimeString()}</span>
            </div>
            <div class="message-avatar">
                <i class="fas fa-user"></i>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Envoyer à Firebase
        if (window.firebaseDB) {
            const messageData = {
                id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId: this.currentUser,
                nickname: localStorage.getItem(`pseudo_${this.currentUser}`) || sessionStorage.getItem('userEmail')?.split('@')[0] || 'Utilisateur',
                message: message,
                timestamp: Date.now(),
                type: 'text'
            };
            
            const chatRef = window.dbRef(window.firebaseDB, 'chat/messages');
            window.dbPush(chatRef, messageData);
        }
        
        chatInput.value = '';
    }



    calculateWinRate() {
        const closedTrades = this.trades.filter(t => t.status === 'closed');
        if (closedTrades.length === 0) return 0;
        const winningTrades = closedTrades.filter(t => parseFloat(t.pnl || 0) > 0);
        return ((winningTrades.length / closedTrades.length) * 100).toFixed(1);
    }

    calculateRecentWinRate() {
        const recentTrades = this.trades.filter(t => {
            const tradeDate = new Date(t.date);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return tradeDate >= weekAgo && t.status === 'closed';
        });
        
        if (recentTrades.length === 0) return 0;
        const recentWins = recentTrades.filter(t => parseFloat(t.pnl || 0) > 0);
        return ((recentWins.length / recentTrades.length) * 100).toFixed(1);
    }

    updateTradingPlan() {
        const closedTrades = this.trades.filter(t => t.status === 'closed');
        const totalPnL = closedTrades.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
        const initialCapital = this.settings.capital;
        
        // Calculs des objectifs
        const dailyTarget = (initialCapital * this.settings.dailyTarget) / 100;
        const weeklyTarget = (initialCapital * this.settings.weeklyTarget) / 100;
        const monthlyTarget = (initialCapital * this.settings.monthlyTarget) / 100;
        
        // Calculs des progrès
        const dailyProgress = Math.min((totalPnL / dailyTarget) * 100, 100);
        const weeklyProgress = Math.min((totalPnL / weeklyTarget) * 100, 100);
        const monthlyProgress = Math.min((totalPnL / monthlyTarget) * 100, 100);
        
        // Mise à jour des éléments
        this.updateElement('dailyTarget', dailyTarget.toFixed(0));
        this.updateElement('weeklyTarget', weeklyTarget.toFixed(0));
        this.updateElement('monthlyTarget', monthlyTarget.toFixed(0));
        
        this.updateElement('dailyTargetPercent', `${this.settings.dailyTarget}%`);
        this.updateElement('weeklyTargetPercent', `${this.settings.weeklyTarget}%`);
        this.updateElement('monthlyTargetPercent', `${this.settings.monthlyTarget}%`);
        
        this.updateElement('dailyProgress', `${dailyProgress.toFixed(1)}%`);
        this.updateElement('weeklyProgress', `${weeklyProgress.toFixed(1)}%`);
        this.updateElement('monthProgress', `${monthlyProgress.toFixed(1)}%`);
        
        // Mise à jour des barres de progression
        const dailyBar = document.getElementById('dailyProgressBar');
        const weeklyBar = document.getElementById('weeklyProgressBar');
        const monthlyBar = document.getElementById('monthlyProgressBar');
        
        if (dailyBar) dailyBar.style.width = `${Math.min(dailyProgress, 100)}%`;
        if (weeklyBar) weeklyBar.style.width = `${Math.min(weeklyProgress, 100)}%`;
        if (monthlyBar) monthlyBar.style.width = `${Math.min(monthlyProgress, 100)}%`;
    }

    editTrade(index) {
        const trade = this.trades[index];
        if (!trade) return;
        
        const modalContent = document.getElementById('modalContent');
        if (!modalContent) return;
        
        modalContent.innerHTML = `
            <h2>✏️ Modifier le Trade</h2>
            <div class="trade-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>Instrument</label>
                        <select id="editCurrency">
                            <option value="EUR/USD" ${trade.currency === 'EUR/USD' ? 'selected' : ''}>EUR/USD</option>
                            <option value="GBP/USD" ${trade.currency === 'GBP/USD' ? 'selected' : ''}>GBP/USD</option>
                            <option value="USD/JPY" ${trade.currency === 'USD/JPY' ? 'selected' : ''}>USD/JPY</option>
                            <option value="AUD/USD" ${trade.currency === 'AUD/USD' ? 'selected' : ''}>AUD/USD</option>
                            <option value="USD/CAD" ${trade.currency === 'USD/CAD' ? 'selected' : ''}>USD/CAD</option>
                            <option value="BTC/USD" ${trade.currency === 'BTC/USD' ? 'selected' : ''}>BTC/USD</option>
                            <option value="XAU/USD" ${trade.currency === 'XAU/USD' ? 'selected' : ''}>XAU/USD</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Type</label>
                        <select id="editTradeType">
                            <option value="BUY" ${trade.type === 'BUY' ? 'selected' : ''}>BUY</option>
                            <option value="SELL" ${trade.type === 'SELL' ? 'selected' : ''}>SELL</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Point d'entrée</label>
                        <input type="number" id="editEntryPoint" step="0.00001" value="${trade.entryPoint}">
                    </div>
                    <div class="form-group">
                        <label>Lot Size</label>
                        <input type="number" id="editLotSize" step="0.01" min="0.01" value="${trade.lotSize}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Stop Loss</label>
                        <input type="number" id="editStopLoss" step="0.00001" value="${trade.stopLoss}">
                    </div>
                    <div class="form-group">
                        <label>Take Profit</label>
                        <input type="number" id="editTakeProfit" step="0.00001" value="${trade.takeProfit}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>P&L ($)</label>
                        <input type="number" id="editPnL" step="0.01" value="${trade.pnl || 0}">
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select id="editStatus">
                            <option value="open" ${trade.status === 'open' ? 'selected' : ''}>Ouvert</option>
                            <option value="closed" ${trade.status === 'closed' ? 'selected' : ''}>Fermé</option>
                        </select>
                    </div>
                </div>
                <div class="form-actions">
                    <button class="btn-primary" onclick="dashboard.updateTrade(${index})">Mettre à jour</button>
                    <button class="btn-secondary" onclick="dashboard.closeModal()">Annuler</button>
                </div>
            </div>
        `;
        
        this.showModal();
    }

    updateTrade(index) {
        const currency = document.getElementById('editCurrency')?.value;
        const tradeType = document.getElementById('editTradeType')?.value;
        const entryPoint = parseFloat(document.getElementById('editEntryPoint')?.value);
        const stopLoss = parseFloat(document.getElementById('editStopLoss')?.value);
        const takeProfit = parseFloat(document.getElementById('editTakeProfit')?.value);
        const lotSize = parseFloat(document.getElementById('editLotSize')?.value);
        const pnl = parseFloat(document.getElementById('editPnL')?.value) || 0;
        const status = document.getElementById('editStatus')?.value;

        if (!currency || !tradeType || !entryPoint || !stopLoss || !takeProfit || !lotSize) {
            this.showNotification('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }

        this.trades[index] = {
            ...this.trades[index],
            currency,
            type: tradeType,
            entryPoint,
            stopLoss,
            takeProfit,
            lotSize,
            pnl,
            status
        };
        
        this.saveData();
        this.closeModal();
        this.fullDashboardUpdate();
        this.showNotification('Trade mis à jour avec succès!');
    }

    deleteTrade(index) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce trade ?')) {
            this.trades.splice(index, 1);
            this.saveData();
            this.fullDashboardUpdate();
            this.showNotification('Trade supprimé avec succès!');
            
            // Rafraîchir la modal si elle est ouverte
            const modal = document.getElementById('tradeModal');
            if (modal && modal.style.display !== 'none') {
                this.showAllTradesModal();
            }
        }
    }

    async logout() {
        try {
            if (window.firebaseAuth && window.signOut) {
                await window.signOut(window.firebaseAuth);
            }
            sessionStorage.clear();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Erreur déconnexion:', error);
            sessionStorage.clear();
            window.location.href = 'index.html';
        }
    }

    showPseudoModal() {
        const currentPseudo = localStorage.getItem(`pseudo_${this.currentUser}`) || sessionStorage.getItem('userEmail');
        
        const modalContent = document.getElementById('modalContent');
        if (!modalContent) return;
        
        modalContent.innerHTML = `
            <h2>👤 Changer votre Pseudo</h2>
            <div class="trade-form">
                <div class="form-group">
                    <label>Pseudo actuel:</label>
                    <input type="text" id="currentPseudo" value="${currentPseudo}" readonly style="background: #2a2d47; color: #8892b0;">
                </div>
                <div class="form-group">
                    <label>Nouveau pseudo:</label>
                    <input type="text" id="newPseudo" placeholder="Entrez votre nouveau pseudo" maxlength="20">
                    <small style="color: #8892b0; font-size: 0.75rem;">Maximum 20 caractères. Ce pseudo sera visible dans le classement VIP.</small>
                </div>
                <div class="form-actions">
                    <button class="btn-primary" onclick="dashboard.savePseudo()">Sauvegarder</button>
                    <button class="btn-secondary" onclick="dashboard.closeModal()">Annuler</button>
                </div>
            </div>
        `;
        
        this.showModal();
    }

    async savePseudo() {
        const newPseudo = document.getElementById('newPseudo')?.value.trim();
        
        if (!newPseudo) {
            this.showNotification('Veuillez entrer un pseudo', 'error');
            return;
        }
        
        if (newPseudo.length > 20) {
            this.showNotification('Le pseudo ne peut pas dépasser 20 caractères', 'error');
            return;
        }
        
        // Sauvegarder localement
        localStorage.setItem(`pseudo_${this.currentUser}`, newPseudo);
        
        // Mettre à jour l'affichage immédiatement
        const displayElement = document.getElementById('userDisplay');
        if (displayElement) {
            displayElement.textContent = newPseudo;
        }
        
        // Mettre à jour aussi dans mobile si ouvert
        const mobileDisplay = document.getElementById('userDisplay');
        if (mobileDisplay) {
            mobileDisplay.textContent = newPseudo;
        }
        
        // Sauvegarder dans Firebase pour synchronisation
        await this.savePseudoToFirebase(newPseudo);
        
        this.closeModal();
        this.showNotification('Pseudo mis à jour avec succès!');
        
        // Recharger le classement pour afficher le nouveau pseudo
        setTimeout(() => {
            this.loadRanking();
        }, 500);
    }

    async savePseudoToFirebase(pseudo) {
        if (!window.firebaseDB) return;
        
        try {
            // Forcer la mise à jour du pseudo dans Firebase
            const pseudoRef = window.dbRef(window.firebaseDB, `users/${this.currentUser}/pseudo`);
            await window.dbSet(pseudoRef, pseudo);
            
            const userRef = window.dbRef(window.firebaseDB, `users/${this.currentUser}`);
            const snapshot = await window.dbGet(userRef);
            
            let userData = {};
            if (snapshot.exists()) {
                userData = snapshot.val();
            }
            
            userData.pseudo = pseudo;
            userData.email = sessionStorage.getItem('userEmail') || 'user@example.com';
            userData.isVIP = true;
            userData.plan = 'VIP';
            userData.lastUpdated = new Date().toISOString();
            
            // Maintenir la structure des comptes si elle existe
            if (!userData.accounts) {
                userData.accounts = {
                    compte1: {
                        trades: this.trades,
                        capital: this.accounts[this.currentAccount]?.capital || this.settings.capital,
                        settings: this.settings
                    }
                };
            }
            
            await window.dbSet(userRef, userData);
            console.log('✅ Pseudo forcé dans Firebase:', pseudo);
            
            // Forcer le rechargement du classement après sauvegarde
            setTimeout(() => {
                if (window.RankingVIP) {
                    const ranking = new window.RankingVIP();
                }
            }, 1000);
        } catch (error) {
            console.error('Erreur sauvegarde pseudo Firebase:', error);
        }
    }
}

// Initialisation
let dashboard;

function initializeDashboard() {
    console.log('Starting dashboard initialization...');
    try {
        dashboard = new SimpleTradingDashboard();
        window.dashboard = dashboard;
        
        // Ajouter les fonctions de classement
        dashboard.showRanking = function() {
            document.querySelectorAll('.dashboard-content > section').forEach(section => {
                section.style.display = 'none';
            });
            
            const rankingSection = document.getElementById('rankingSection');
            if (rankingSection) {
                rankingSection.style.display = 'block';
                this.loadRanking();
            }
            
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            const rankingLink = document.querySelector('a[href="#ranking"]');
            if (rankingLink) rankingLink.classList.add('active');
        };
        
        // Ajouter initCharts à la classe
        dashboard.initCharts = function() {
            setTimeout(() => {
                initCharts();
            }, 100);
        };
        
        dashboard.loadRanking = async function() {
            try {
                if (!window.firebaseDB || !window.firebaseAuth?.currentUser) {
                    // Utiliser des données locales si Firebase n'est pas disponible
                    const localUsers = {};
                    const currentUserEmail = sessionStorage.getItem('userEmail') || 'user@example.com';
                    const currentUserPseudo = localStorage.getItem(`pseudo_${this.currentUser}`);
                    
                    localUsers[this.currentUser] = {
                        email: currentUserEmail,
                        pseudo: currentUserPseudo,
                        trades: {},
                        lastUpdated: new Date().toISOString()
                    };
                    
                    this.trades.forEach((trade, index) => {
                        localUsers[this.currentUser].trades[trade.id || `trade_${index}`] = trade;
                    });
                    
                    this.displayRanking(localUsers);
                    return;
                }
                
                // D'abord sauvegarder les données de l'utilisateur actuel
                await this.saveToFirebase();
                
                // Charger depuis users avec la structure correcte
                const usersRef = window.dbRef(window.firebaseDB, 'users');
                const snapshot = await window.dbGet(usersRef);
                
                if (snapshot.exists()) {
                    const users = snapshot.val();
                    const processedUsers = {};
                    
                    Object.keys(users).forEach(uid => {
                        const user = users[uid];
                        if (user.accounts && user.accounts.compte1 && user.accounts.compte1.trades) {
                            processedUsers[uid] = {
                                email: user.email,
                                pseudo: user.pseudo || localStorage.getItem(`pseudo_${uid}`),
                                trades: {},
                                lastUpdated: user.lastUpdated
                            };
                            
                            // Convertir les trades en format objet
                            if (Array.isArray(user.accounts.compte1.trades)) {
                                user.accounts.compte1.trades.forEach((trade, index) => {
                                    processedUsers[uid].trades[trade.id || `trade_${index}`] = trade;
                                });
                            } else if (typeof user.accounts.compte1.trades === 'object') {
                                processedUsers[uid].trades = user.accounts.compte1.trades;
                            }
                        }
                    });
                    
                    this.displayRanking(processedUsers);
                } else {
                    document.getElementById('rankingList').innerHTML = '<div class="no-data">Aucun trader VIP trouvé</div>';
                }
                
            } catch (error) {
                console.error('Erreur chargement classement:', error);
                // Fallback vers les données locales
                const localUsers = {};
                const currentUserEmail = sessionStorage.getItem('userEmail') || 'user@example.com';
                const currentUserPseudo = localStorage.getItem(`pseudo_${this.currentUser}`);
                
                localUsers[this.currentUser] = {
                    email: currentUserEmail,
                    pseudo: currentUserPseudo,
                    trades: {},
                    lastUpdated: new Date().toISOString()
                };
                
                this.trades.forEach((trade, index) => {
                    localUsers[this.currentUser].trades[trade.id || `trade_${index}`] = trade;
                });
                
                this.displayRanking(localUsers);
            }
        };
        
        dashboard.displayRanking = function(users) {
            const rankingList = document.getElementById('rankingList');
            if (!rankingList) return;
            
            const rankings = [];
            const today = new Date().toISOString().split('T')[0];
            const period = document.getElementById('rankingPeriod')?.value || 'monthly';
            
            Object.keys(users).forEach(userId => {
                const user = users[userId];
                let trades = Object.values(user.trades || {});
                
                // Filtrer selon la période
                if (period === 'daily') {
                    const today = new Date().toISOString().split('T')[0];
                    trades = trades.filter(trade => trade.date === today);
                } else if (period === 'weekly') {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    trades = trades.filter(trade => new Date(trade.date) >= weekAgo);
                } else if (period === 'monthly') {
                    const monthAgo = new Date();
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    trades = trades.filter(trade => new Date(trade.date) >= monthAgo);
                }
                
                const closedTrades = trades.filter(t => t.status === 'closed');
                const totalProfit = closedTrades.reduce((sum, trade) => sum + parseFloat(trade.pnl || 0), 0);
                const winningTrades = closedTrades.filter(trade => parseFloat(trade.pnl || 0) > 0).length;
                const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0;
                
                // Priorité au pseudo Firebase, puis localStorage
                const displayName = user.pseudo || localStorage.getItem(`pseudo_${userId}`) || user.email?.split('@')[0] || 'Utilisateur';
                
                // Inclure les utilisateurs avec au moins 1 trade fermé dans la période
                if (closedTrades.length > 0) {
                    rankings.push({
                        userId: userId,
                        email: user.email,
                        pseudo: displayName,
                        profit: totalProfit,
                        winRate: winRate,
                        trades: trades.length,
                        closedTrades: closedTrades.length,
                        lastActivity: user.lastUpdated
                    });
                }
            });
            
            rankings.sort((a, b) => b.profit - a.profit);
            
            rankingList.innerHTML = '';
            
            if (rankings.length === 0) {
                rankingList.innerHTML = '<div class="no-data">Aucun trader avec des trades fermés pour cette période</div>';
                return;
            }
            
            rankings.forEach((user, index) => {
                const div = document.createElement('div');
                div.className = 'ranking-item';
                
                const medals = ['🥇', '🥈', '🥉'];
                const positionDisplay = index < 3 ? medals[index] : `#${index + 1}`;
                
                // Mettre en évidence l'utilisateur actuel
                const isCurrentUser = user.userId === this.currentUser;
                if (isCurrentUser) {
                    div.style.background = 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(91, 134, 229, 0.1))';
                    div.style.border = '2px solid #00d4ff';
                }
                
                div.innerHTML = `
                    <div class="ranking-position">
                        <span class="position-number">${positionDisplay}</span>
                        <div class="user-info">
                            <div class="user-name">${user.pseudo}${isCurrentUser ? ' (Vous)' : ''}</div>
                            <div class="user-trades">${user.closedTrades} trades fermés</div>
                        </div>
                    </div>
                    <div class="ranking-stats">
                        <div class="profit-amount ${user.profit >= 0 ? 'positive' : 'negative'}">
                            $${user.profit.toFixed(2)}
                        </div>
                        <div class="win-rate">${user.winRate.toFixed(1)}% WR</div>
                    </div>
                `;
                
                rankingList.appendChild(div);
            });
        };
        
        console.log('Dashboard created successfully');
    } catch (error) {
        console.error('Error creating dashboard:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
    setTimeout(initializeDashboard, 100);
}

console.log('Dashboard script loaded successfully');

// Fonctions pour les graphiques
function initCharts() {
    // Performance Chart
    const performanceCtx = document.getElementById('performanceChart');
    if (performanceCtx && window.Chart) {
        const chart = new Chart(performanceCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
                datasets: [{
                    label: 'Performance (%)',
                    data: [0, 2.5, 1.8, 4.2, 3.1, 5.7],
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#8892b0' }
                    },
                    x: {
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#8892b0' }
                    }
                }
            }
        });
    }
    
    // Win/Loss Chart
    const winLossCtx = document.getElementById('winLossChart');
    if (winLossCtx && window.Chart) {
        const chart = new Chart(winLossCtx, {
            type: 'doughnut',
            data: {
                labels: ['Gains', 'Pertes'],
                datasets: [{
                    data: [65, 35],
                    backgroundColor: ['#00d4ff', '#ff6b6b'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#8892b0' }
                    }
                }
            }
        });
    }
}

// Fonctions manquantes
function showCloseTradeModal() {
    if (!dashboard) return;
    
    const openTrades = dashboard.trades.filter(t => t.status === 'open');
    if (openTrades.length === 0) {
        dashboard.showNotification('Aucun trade ouvert à clôturer');
        return;
    }
    
    const modalContent = document.getElementById('modalContent');
    if (!modalContent) return;
    
    modalContent.innerHTML = `
        <h2>🔒 Clôturer un Trade</h2>
        <div class="trade-form">
            <div class="form-group">
                <label>Sélectionner le trade à clôturer:</label>
                <select id="tradeToClose" onchange="dashboard.updateTradePreview()">
                    ${openTrades.map((trade, index) => `
                        <option value="${dashboard.trades.indexOf(trade)}">
                            ${trade.currency} ${trade.type} - ${trade.lotSize} lots (Entrée: ${trade.entryPoint})
                        </option>
                    `).join('')}
                </select>
            </div>
            <div id="tradePreview" class="trade-preview">
                <!-- Aperçu du trade sélectionné -->
            </div>
            <div class="form-group">
                <label>Comment le trade s'est-il terminé ?</label>
                <div class="close-options">
                    <button type="button" class="close-option" data-type="tp" onclick="dashboard.selectCloseType('tp')">
                        <i class="fas fa-bullseye"></i>
                        <span>Take Profit</span>
                        <small>Objectif atteint</small>
                    </button>
                    <button type="button" class="close-option" data-type="sl" onclick="dashboard.selectCloseType('sl')">
                        <i class="fas fa-shield-alt"></i>
                        <span>Stop Loss</span>
                        <small>Protection activée</small>
                    </button>
                    <button type="button" class="close-option" data-type="be" onclick="dashboard.selectCloseType('be')">
                        <i class="fas fa-equals"></i>
                        <span>Break Even</span>
                        <small>Sortie à l'entrée</small>
                    </button>
                    <button type="button" class="close-option" data-type="manual" onclick="dashboard.selectCloseType('manual')">
                        <i class="fas fa-hand-paper"></i>
                        <span>Manuel</span>
                        <small>Clôture manuelle</small>
                    </button>
                    <button type="button" class="close-option delete-option" data-type="delete" onclick="dashboard.selectCloseType('delete')">
                        <i class="fas fa-trash"></i>
                        <span>Supprimer</span>
                        <small>Effacer le trade</small>
                    </button>
                </div>
            </div>
            <div id="manualPriceGroup" class="form-group" style="display: none;">
                <label>Prix de sortie manuel:</label>
                <input type="number" id="manualExitPrice" step="0.00001" placeholder="1.12345">
            </div>
            <div id="resultPreview" class="result-preview">
                <!-- Résultat calculé -->
            </div>
            <div class="form-actions">
                <button class="btn-primary" id="confirmCloseBtn" onclick="dashboard.closeTrade()" disabled>Confirmer Clôture</button>
                <button class="btn-secondary" onclick="dashboard.closeModal()">Annuler</button>
            </div>
        </div>
    `;
    
    dashboard.showModal();
    dashboard.updateTradePreview();
}

function showHistoryTradeModal() {
    if (!dashboard) return;
    
    const modalContent = document.getElementById('modalContent');
    if (!modalContent) return;
    
    modalContent.innerHTML = `
        <h2>📈 Ajouter un Trade Passé</h2>
        <div class="trade-tutorial">
            <div class="tutorial-step">
                <div class="step-icon">1</div>
                <div class="step-content">
                    <h4>Sélectionnez la paire</h4>
                    <p>Choisissez l'instrument tradé (EUR/USD, GBP/USD, etc.)</p>
                </div>
            </div>
            <div class="tutorial-step">
                <div class="step-icon">2</div>
                <div class="step-content">
                    <h4>Définissez les niveaux</h4>
                    <p>Entrez le point d'entrée, stop loss et take profit</p>
                </div>
            </div>
            <div class="tutorial-step">
                <div class="step-icon">3</div>
                <div class="step-content">
                    <h4>Résultat final</h4>
                    <p>Indiquez le P&L final et le statut (fermé)</p>
                </div>
            </div>
        </div>
        <div class="trade-form">
            <div class="form-row">
                <div class="form-group">
                    <label>Date du trade</label>
                    <input type="date" id="historyDate" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label>Instrument</label>
                    <select id="historyCurrency">
                        <option value="EUR/USD">EUR/USD</option>
                        <option value="GBP/USD">GBP/USD</option>
                        <option value="USD/JPY">USD/JPY</option>
                        <option value="AUD/USD">AUD/USD</option>
                        <option value="USD/CAD">USD/CAD</option>
                        <option value="BTC/USD">BTC/USD</option>
                        <option value="XAU/USD">XAU/USD</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Type</label>
                    <select id="historyTradeType">
                        <option value="BUY">BUY</option>
                        <option value="SELL">SELL</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Lot Size</label>
                    <input type="number" id="historyLotSize" step="0.01" min="0.01" placeholder="0.10">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Point d'entrée</label>
                    <input type="number" id="historyEntryPoint" step="0.00001" placeholder="1.12345">
                </div>
                <div class="form-group">
                    <label>Prix de sortie</label>
                    <input type="number" id="historyExitPoint" step="0.00001" placeholder="1.12500">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Stop Loss</label>
                    <input type="number" id="historyStopLoss" step="0.00001" placeholder="1.12000">
                </div>
                <div class="form-group">
                    <label>Take Profit</label>
                    <input type="number" id="historyTakeProfit" step="0.00001" placeholder="1.13000">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>P&L Final ($)</label>
                    <input type="number" id="historyPnL" step="0.01" placeholder="25.50">
                </div>
                <div class="form-group">
                    <label>Résultat</label>
                    <select id="historyResult">
                        <option value="win">Gain 📈</option>
                        <option value="loss">Perte 📉</option>
                        <option value="breakeven">Break Even ➡️</option>
                    </select>
                </div>
            </div>
            <div class="form-actions">
                <button class="btn-primary" onclick="dashboard.saveHistoryTrade()">Enregistrer Trade Passé</button>
                <button class="btn-secondary" onclick="dashboard.closeModal()">Annuler</button>
            </div>
        </div>
    `;
    
    dashboard.showModal();
}

function exportToExcel() {
    if (!dashboard || dashboard.trades.length === 0) {
        dashboard?.showNotification('Aucun trade à exporter');
        return;
    }
    
    // Créer les données CSV
    const headers = ['Date', 'Paire', 'Type', 'Entrée', 'Sortie', 'SL', 'TP', 'Lot', 'P&L', 'Status'];
    const csvContent = [headers.join(',')];
    
    dashboard.trades.forEach(trade => {
        const row = [
            trade.date,
            trade.currency,
            trade.type || 'BUY',
            trade.entryPoint,
            trade.exitPoint || '',
            trade.stopLoss,
            trade.takeProfit,
            trade.lotSize,
            trade.pnl || 0,
            trade.status
        ];
        csvContent.push(row.join(','));
    });
    
    // Télécharger le fichier
    const blob = new Blob([csvContent.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `misterpips_trades_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    dashboard.showNotification('Export Excel terminé!');
}

// Ajouter les fonctions manquantes à la classe
SimpleTradingDashboard.prototype.showCloseTradeModal = function() {
    showCloseTradeModal();
};

SimpleTradingDashboard.prototype.showHistoryTradeModal = function() {
    showHistoryTradeModal();
};

SimpleTradingDashboard.prototype.exportToExcel = function() {
    exportToExcel();
};

SimpleTradingDashboard.prototype.updateTradePreview = function() {
    const tradeIndex = parseInt(document.getElementById('tradeToClose')?.value);
    const trade = this.trades[tradeIndex];
    if (!trade) return;
    
    const previewDiv = document.getElementById('tradePreview');
    if (previewDiv) {
        previewDiv.innerHTML = `
            <div class="trade-details">
                <div class="detail-row">
                    <span>Paire:</span> <strong>${trade.currency}</strong>
                </div>
                <div class="detail-row">
                    <span>Type:</span> <strong>${trade.type}</strong>
                </div>
                <div class="detail-row">
                    <span>Entrée:</span> <strong>${trade.entryPoint}</strong>
                </div>
                <div class="detail-row">
                    <span>Stop Loss:</span> <strong>${trade.stopLoss}</strong>
                </div>
                <div class="detail-row">
                    <span>Take Profit:</span> <strong>${trade.takeProfit}</strong>
                </div>
                <div class="detail-row">
                    <span>Lot Size:</span> <strong>${trade.lotSize}</strong>
                </div>
            </div>
        `;
    }
};

SimpleTradingDashboard.prototype.selectCloseType = function(type) {
    // Réinitialiser les boutons
    document.querySelectorAll('.close-option').forEach(btn => btn.classList.remove('selected'));
    document.querySelector(`[data-type="${type}"]`).classList.add('selected');
    
    const tradeIndex = parseInt(document.getElementById('tradeToClose')?.value);
    const trade = this.trades[tradeIndex];
    if (!trade) return;
    
    const manualGroup = document.getElementById('manualPriceGroup');
    const resultPreview = document.getElementById('resultPreview');
    const confirmBtn = document.getElementById('confirmCloseBtn');
    
    let exitPrice, pnl;
    
    if (type === 'tp') {
        exitPrice = trade.takeProfit;
        pnl = this.calculatePnL(trade, exitPrice);
        manualGroup.style.display = 'none';
    } else if (type === 'sl') {
        exitPrice = trade.stopLoss;
        pnl = this.calculatePnL(trade, exitPrice);
        manualGroup.style.display = 'none';
    } else if (type === 'be') {
        exitPrice = trade.entryPoint;
        pnl = 0;
        manualGroup.style.display = 'none';
    } else if (type === 'manual') {
        manualGroup.style.display = 'block';
        const manualInput = document.getElementById('manualExitPrice');
        manualInput.oninput = () => {
            const manualPrice = parseFloat(manualInput.value);
            if (!isNaN(manualPrice)) {
                const manualPnL = this.calculatePnL(trade, manualPrice);
                this.updateResultPreview(manualPrice, manualPnL);
                confirmBtn.disabled = false;
            }
        };
        confirmBtn.disabled = true;
        return;
    } else if (type === 'delete') {
        manualGroup.style.display = 'none';
        resultPreview.innerHTML = `
            <div class="result-summary delete-warning">
                <div class="result-icon">⚠️</div>
                <div class="result-details">
                    <div class="result-price">ATTENTION: Suppression définitive</div>
                    <div class="result-pnl">Ce trade sera complètement effacé</div>
                </div>
            </div>
        `;
        confirmBtn.textContent = 'Supprimer le Trade';
        confirmBtn.disabled = false;
        confirmBtn.dataset.closeType = type;
        return;
    }
    
    this.updateResultPreview(exitPrice, pnl);
    confirmBtn.disabled = false;
    
    // Stocker les valeurs pour la clôture
    confirmBtn.dataset.exitPrice = exitPrice;
    confirmBtn.dataset.pnl = pnl;
    confirmBtn.dataset.closeType = type;
};

SimpleTradingDashboard.prototype.calculatePnL = function(trade, exitPrice) {
    const entryPrice = parseFloat(trade.entryPoint);
    const capital = this.settings.capital;
    const riskPercent = this.settings.riskPerTrade / 100;
    
    // Distance SL en pips
    let slDistance;
    if (trade.currency.includes('JPY')) {
        slDistance = Math.abs(entryPrice - parseFloat(trade.stopLoss)) * 100;
    } else {
        slDistance = Math.abs(entryPrice - parseFloat(trade.stopLoss)) * 10000;
    }
    
    // Distance sortie en pips
    let exitDistance;
    if (trade.currency.includes('JPY')) {
        exitDistance = Math.abs(exitPrice - entryPrice) * 100;
    } else {
        exitDistance = Math.abs(exitPrice - entryPrice) * 10000;
    }
    
    // Montant risqué = capital * risque%
    const riskAmount = capital * riskPercent;
    
    // Valeur par pip = montant risqué / distance SL
    const valuePerPip = slDistance > 0 ? riskAmount / slDistance : 1;
    
    // Direction du trade
    const direction = trade.type === 'BUY' ? (exitPrice > entryPrice ? 1 : -1) : (exitPrice < entryPrice ? 1 : -1);
    
    return exitDistance * valuePerPip * direction;
};

SimpleTradingDashboard.prototype.updateResultPreview = function(exitPrice, pnl) {
    const resultDiv = document.getElementById('resultPreview');
    if (resultDiv) {
        const pnlClass = pnl > 0 ? 'positive' : pnl < 0 ? 'negative' : 'neutral';
        const pnlIcon = pnl > 0 ? '📈' : pnl < 0 ? '📉' : '➡️';
        
        resultDiv.innerHTML = `
            <div class="result-summary ${pnlClass}">
                <div class="result-icon">${pnlIcon}</div>
                <div class="result-details">
                    <div class="result-price">Prix de sortie: <strong>${exitPrice}</strong></div>
                    <div class="result-pnl">P&L: <strong class="${pnlClass}">$${pnl.toFixed(2)}</strong></div>
                </div>
            </div>
        `;
    }
};

SimpleTradingDashboard.prototype.closeTrade = function() {
    const tradeIndex = parseInt(document.getElementById('tradeToClose')?.value);
    const confirmBtn = document.getElementById('confirmCloseBtn');
    
    if (confirmBtn.dataset.closeType === 'delete') {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce trade définitivement ?')) {
            this.trades.splice(tradeIndex, 1);
            this.saveData();
            this.closeModal();
            this.fullDashboardUpdate();
            this.showNotification('Trade supprimé!', 'success');
        }
        return;
    }
    
    let exitPrice, pnl;
    
    if (confirmBtn.dataset.closeType === 'manual') {
        exitPrice = parseFloat(document.getElementById('manualExitPrice')?.value);
        const trade = this.trades[tradeIndex];
        pnl = this.calculatePnL(trade, exitPrice);
    } else {
        exitPrice = parseFloat(confirmBtn.dataset.exitPrice);
        pnl = parseFloat(confirmBtn.dataset.pnl);
    }
    
    if (isNaN(tradeIndex) || isNaN(exitPrice) || isNaN(pnl)) {
        this.showNotification('Erreur dans les données du trade', 'error');
        return;
    }
    
    this.trades[tradeIndex].status = 'closed';
    this.trades[tradeIndex].exitPoint = exitPrice;
    this.trades[tradeIndex].pnl = pnl;
    this.trades[tradeIndex].closedAt = Date.now();
    this.trades[tradeIndex].closeType = confirmBtn.dataset.closeType;
    
    this.saveData();
    this.closeModal();
    this.fullDashboardUpdate();
    this.showNotification('Trade clôturé avec succès!', 'success');
};

SimpleTradingDashboard.prototype.shareTradeImage = function(tradeIndex) {
    const trade = this.trades[tradeIndex];
    if (!trade) return;
    
    // Créer un canvas pour l'image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 400;
    
    // Fond dégradé
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, '#0a0e27');
    gradient.addColorStop(1, '#151932');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 400);
    
    // Header avec logo
    const logoImg = new Image();
    logoImg.onload = () => {
        // Dessiner le logo
        ctx.drawImage(logoImg, 250, 15, 40, 40);
        
        // Texte MISTERPIPS à côté
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('MISTERPIPS', 300, 45);
        
        // Continuer avec le reste de l'image
        ctx.fillStyle = '#8892b0';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🚀 Résultat de Trading VIP', 300, 75);
        
        const pnl = parseFloat(trade.pnl || 0);
        const pnlColor = pnl >= 0 ? '#44ff44' : '#ff4444';
        const pnlIcon = pnl >= 0 ? '📈' : '📉';
        const status = trade.status === 'closed' ? 'FERMÉ' : 'OUVERT';
        
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(`${trade.currency} ${trade.type}`, 50, 130);
        
        ctx.font = '16px Arial';
        ctx.fillStyle = '#8892b0';
        ctx.fillText(`Entrée: ${trade.entryPoint}`, 50, 160);
        ctx.fillText(`Stop Loss: ${trade.stopLoss}`, 50, 185);
        ctx.fillText(`Take Profit: ${trade.takeProfit}`, 50, 210);
        ctx.fillText(`Lot Size: ${trade.lotSize}`, 50, 235);
        ctx.fillText(`Date: ${new Date(trade.date).toLocaleDateString()}`, 50, 260);
        
        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = pnlColor;
        ctx.textAlign = 'center';
        ctx.fillText(`${pnlIcon} $${Math.abs(pnl).toFixed(2)}`, 450, 180);
        
        ctx.font = '18px Arial';
        ctx.fillStyle = pnl >= 0 ? '#44ff44' : '#ff4444';
        ctx.fillText(pnl >= 0 ? 'PROFIT' : 'PERTE', 450, 210);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.fillText(`Status: ${status}`, 450, 240);
        
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('💎 Rejoignez notre groupe VIP', 300, 320);
        
        ctx.fillStyle = '#8892b0';
        ctx.font = '12px Arial';
        ctx.fillText('Signaux de trading professionnels', 300, 340);
        ctx.fillText('Support 24/7 • Communauté active', 300, 355);
        ctx.fillText('📞 https://t.me/misterpips_support', 300, 375);
        
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `misterpips_trade_${trade.currency}_${new Date().toISOString().split('T')[0]}.png`;
            a.click();
            URL.revokeObjectURL(url);
            
            this.showNotification('Image générée! Partagez sur Telegram 📱', 'success');
            
            setTimeout(() => {
                const telegramUrl = 'https://t.me/misterpips_support';
                window.open(telegramUrl, '_blank');
            }, 1000);
        }, 'image/png');
    };
    logoImg.src = 'assets/images/Misterpips.jpg';
    

};

SimpleTradingDashboard.prototype.saveHistoryTrade = function() {
    const date = document.getElementById('historyDate')?.value;
    const currency = document.getElementById('historyCurrency')?.value;
    const tradeType = document.getElementById('historyTradeType')?.value;
    const lotSize = parseFloat(document.getElementById('historyLotSize')?.value);
    const entryPoint = parseFloat(document.getElementById('historyEntryPoint')?.value);
    const exitPoint = parseFloat(document.getElementById('historyExitPoint')?.value);
    const stopLoss = parseFloat(document.getElementById('historyStopLoss')?.value);
    const takeProfit = parseFloat(document.getElementById('historyTakeProfit')?.value);
    const pnl = parseFloat(document.getElementById('historyPnL')?.value);
    
    if (!date || !currency || !tradeType || !lotSize || !entryPoint || !exitPoint || !stopLoss || !takeProfit || isNaN(pnl)) {
        this.showNotification('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }
    
    const trade = {
        id: `${this.currentUser}_${Date.now()}`,
        date,
        currency,
        type: tradeType,
        lotSize,
        entryPoint,
        exitPoint,
        stopLoss,
        takeProfit,
        pnl,
        status: 'closed',
        createdAt: Date.now(),
        closedAt: Date.now()
    };
    
    this.trades.push(trade);
    this.saveData();
    this.closeModal();
    this.fullDashboardUpdate();
    this.showNotification('Trade passé enregistré avec succès!');
};

SimpleTradingDashboard.prototype.setupChatListener = function() {
    if (!window.firebaseDB) return;
    
    try {
        const chatRef = window.dbRef(window.firebaseDB, 'chat/messages');
        let isFirstLoad = true;
        window.onValue(chatRef, (snapshot) => {
            if (snapshot.exists()) {
                const messages = Object.values(snapshot.val())
                    .sort((a, b) => a.timestamp - b.timestamp)
                    .slice(-50);
                
                if (!isFirstLoad) {
                    const newMessages = messages.filter(msg => 
                        msg.userId !== this.currentUser && 
                        msg.timestamp > (this.lastMessageTime || 0)
                    );
                    
                    if (newMessages.length > 0) {
                        const chatContainer = document.querySelector('.chat-container');
                        const isVisible = chatContainer && chatContainer.style.display !== 'none';
                        
                        if (!isVisible) {
                            this.unreadMessages += newMessages.length;
                            this.updateChatBadge();
                            this.playNotificationSound();
                        }
                    }
                }
                
                this.lastMessageTime = messages.length > 0 ? messages[messages.length - 1].timestamp : 0;
                this.displayChatMessages(messages);
                isFirstLoad = false;
            }
        });
    } catch (error) {
        console.error('Erreur listener chat:', error);
    }
};

SimpleTradingDashboard.prototype.updateChatBadge = function() {
    const chatToggle = document.querySelector('.chat-toggle');
    if (!chatToggle) return;
    
    let badge = chatToggle.querySelector('.chat-badge');
    if (this.unreadMessages > 0) {
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'chat-badge';
            badge.style.cssText = `
                position: absolute;
                top: -5px;
                right: -5px;
                background: #ff4444;
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                font-size: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                animation: pulse 1s infinite;
            `;
            chatToggle.style.position = 'relative';
            chatToggle.appendChild(badge);
        }
        badge.textContent = this.unreadMessages > 9 ? '9+' : this.unreadMessages;
    } else if (badge) {
        badge.remove();
    }
};

SimpleTradingDashboard.prototype.playNotificationSound = function() {
    try {
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
};

SimpleTradingDashboard.prototype.displayChatMessages = function(messages) {
    const chatMessages = document.querySelector('.chat-messages');
    if (!chatMessages) return;
    
    // Garder le message de bienvenue, supprimer le reste
    const welcomeMessage = chatMessages.querySelector('.welcome-message');
    chatMessages.innerHTML = '';
    if (welcomeMessage) {
        chatMessages.appendChild(welcomeMessage);
    }
    
    messages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.userId === this.currentUser ? 'user' : 'other'}`;
        
        const time = new Date(msg.timestamp).toLocaleTimeString();
        
        if (msg.userId === this.currentUser) {
            messageDiv.innerHTML = `
                <div class="message-content">
                    <span class="message-author">Vous</span>
                    <p>${msg.message}</p>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-avatar">
                    <i class="fas fa-user"></i>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="message-content">
                    <span class="message-author">${msg.nickname}</span>
                    <p>${msg.message}</p>
                    <span class="message-time">${time}</span>
                </div>
            `;
        }
        
        chatMessages.appendChild(messageDiv);
    });
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
};

// Ajouter les styles pour le bouton share
