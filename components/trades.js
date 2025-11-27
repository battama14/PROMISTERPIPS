// Composant Trades - Gestion complète des trades
class TradesManager {
    constructor() {
        this.trades = [];
        this.currentAccount = 'compte1';
        this.init();
    }

    init() {
        this.loadTrades();
        this.setupEventListeners();
        this.renderTradesTable();
        console.log('✅ Trades Manager initialisé');
    }

    setupEventListeners() {
        const newTradeBtn = document.getElementById('newTradeBtn');
        if (newTradeBtn) {
            newTradeBtn.onclick = () => this.openNewTradeModal();
        }
    }

    loadTrades() {
        // Charger depuis localStorage d'abord
        const storedTrades = localStorage.getItem(`trades_${this.currentAccount}`);
        if (storedTrades) {
            try {
                this.trades = JSON.parse(storedTrades);
                console.log(`✅ ${this.trades.length} trades chargés depuis localStorage`);
            } catch (error) {
                console.error('❌ Erreur parsing trades localStorage:', error);
                this.trades = [];
            }
        }

        // Essayer de charger depuis Firebase
        this.loadFromFirebase();
    }

    async loadFromFirebase() {
        if (!window.firebaseDB || !window.firebaseModules) {
            console.log('📴 Firebase non disponible - utilisation localStorage');
            return;
        }

        try {
            const uid = sessionStorage.getItem('firebaseUID');
            if (!uid) {
                console.log('👤 Pas d\'UID - mode démo');
                return;
            }

            const { ref, get } = window.firebaseModules;
            const snapshot = await get(ref(window.firebaseDB, `trades/${uid}/${this.currentAccount}`));
            
            if (snapshot.exists()) {
                const firebaseTrades = Object.values(snapshot.val());
                this.trades = firebaseTrades;
                console.log(`🔥 ${this.trades.length} trades chargés depuis Firebase`);
                
                // Sauvegarder en local
                localStorage.setItem(`trades_${this.currentAccount}`, JSON.stringify(this.trades));
                
                this.renderTradesTable();
                this.updateStats();
            }
        } catch (error) {
            console.error('❌ Erreur chargement Firebase:', error);
        }
    }

    renderTradesTable() {
        const tbody = document.getElementById('tradesTableBody');
        if (!tbody) {
            console.log('❌ Table trades non trouvée');
            return;
        }

        tbody.innerHTML = '';

        if (this.trades.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; opacity: 0.7;">Aucun trade enregistré</td></tr>';
            return;
        }

        // Trier par date décroissante
        const sortedTrades = [...this.trades].sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedTrades.forEach(trade => {
            const row = document.createElement('tr');
            const pnl = parseFloat(trade.pnl) || 0;
            const pnlClass = pnl >= 0 ? 'positive' : 'negative';
            
            row.innerHTML = `
                <td>${this.formatDate(trade.date)}</td>
                <td>${trade.pair || trade.devise || 'N/A'}</td>
                <td>${trade.type || (trade.direction === 'buy' ? 'LONG' : 'SHORT')}</td>
                <td>${trade.entryPrice || trade.entry || 'N/A'}</td>
                <td>${trade.exitPrice || trade.exit || trade.tp || 'N/A'}</td>
                <td><span class="status-${trade.status || 'open'}">${this.getStatusText(trade.status)}</span></td>
                <td><span class="${pnlClass}">$${pnl.toFixed(2)}</span></td>
                <td>
                    <button onclick="window.tradesManager.editTrade('${trade.id}')" class="btn-small btn-info">✏️</button>
                    <button onclick="window.tradesManager.deleteTrade('${trade.id}')" class="btn-small btn-danger">🗑️</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        console.log(`✅ ${this.trades.length} trades affichés dans le tableau`);
    }

    updateStats() {
        const closedTrades = this.trades.filter(t => t.status === 'closed' || t.status === 'tp' || t.status === 'sl');
        const winningTrades = closedTrades.filter(t => (parseFloat(t.pnl) || 0) > 0);
        const totalPnL = closedTrades.reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);
        const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length * 100) : 0;

        // Mettre à jour l'interface
        this.updateElement('totalTrades', this.trades.length);
        this.updateElement('winRate', `${winRate.toFixed(1)}%`);
        this.updateElement('totalPnL', `$${totalPnL.toFixed(2)}`);

        // Mettre à jour les objectifs
        this.updateObjectives(totalPnL);

        console.log(`📊 Stats mises à jour: ${this.trades.length} trades, ${winRate.toFixed(1)}% WR, $${totalPnL.toFixed(2)} P&L`);
    }

    updateObjectives(totalPnL) {
        const monthlyTarget = 300; // $300 objectif mensuel
        const progress = Math.min((totalPnL / monthlyTarget) * 100, 100);
        
        const progressBar = document.getElementById('monthlyProgressBar');
        const progressText = document.getElementById('monthlyProgress');
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${progress.toFixed(1)}%`;
        }

        console.log(`🎯 Objectif mensuel: ${progress.toFixed(1)}% (${totalPnL}/${monthlyTarget})`);
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    formatDate(dateStr) {
        try {
            return new Date(dateStr).toLocaleDateString('fr-FR');
        } catch {
            return dateStr;
        }
    }

    getStatusText(status) {
        const statusMap = {
            'open': 'Ouvert',
            'closed': 'Fermé',
            'tp': 'TP atteint',
            'sl': 'SL atteint',
            'pending': 'En attente'
        };
        return statusMap[status] || status || 'Inconnu';
    }

    openNewTradeModal() {
        console.log('📈 Ouverture modal nouveau trade');
        // Modal simple pour demo
        const pair = prompt('Paire de devises (ex: EURUSD):');
        if (!pair) return;
        
        const type = prompt('Type (LONG/SHORT):');
        if (!type) return;
        
        const entry = prompt('Prix d\'entrée:');
        if (!entry) return;
        
        const size = prompt('Taille de position:');
        if (!size) return;

        const newTrade = {
            id: `trade_${Date.now()}`,
            pair: pair.toUpperCase(),
            type: type.toUpperCase(),
            entryPrice: parseFloat(entry),
            size: parseFloat(size),
            date: new Date().toISOString(),
            status: 'open',
            pnl: 0
        };

        this.addTrade(newTrade);
    }

    addTrade(trade) {
        this.trades.push(trade);
        this.saveTrades();
        this.renderTradesTable();
        this.updateStats();
        console.log('✅ Nouveau trade ajouté:', trade.pair);
    }

    editTrade(tradeId) {
        const trade = this.trades.find(t => t.id === tradeId);
        if (!trade) return;

        const newPnL = prompt(`P&L pour ${trade.pair}:`, trade.pnl || 0);
        if (newPnL === null) return;

        trade.pnl = parseFloat(newPnL) || 0;
        trade.status = 'closed';
        
        this.saveTrades();
        this.renderTradesTable();
        this.updateStats();
        console.log('✅ Trade modifié:', trade.pair);
    }

    deleteTrade(tradeId) {
        if (!confirm('Supprimer ce trade ?')) return;
        
        this.trades = this.trades.filter(t => t.id !== tradeId);
        this.saveTrades();
        this.renderTradesTable();
        this.updateStats();
        console.log('🗑️ Trade supprimé');
    }

    saveTrades() {
        localStorage.setItem(`trades_${this.currentAccount}`, JSON.stringify(this.trades));
        
        // Sauvegarder sur Firebase si disponible
        if (window.firebaseDB && window.firebaseModules) {
            const uid = sessionStorage.getItem('firebaseUID');
            if (uid) {
                const { ref, set } = window.firebaseModules;
                set(ref(window.firebaseDB, `trades/${uid}/${this.currentAccount}`), this.trades)
                    .then(() => console.log('💾 Trades sauvegardés sur Firebase'))
                    .catch(error => console.error('❌ Erreur sauvegarde Firebase:', error));
            }
        }
    }
}

// Initialisation
window.TradesManager = TradesManager;