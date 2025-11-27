// Composant Classement VIP - Données Réelles Firebase
class RankingVIP {
    constructor() {
        this.container = null;
        this.data = [];
        this.init();
    }

    init() {
        this.findContainer();
        this.loadRealData();
        console.log('✅ Classement VIP initialisé');
    }

    findContainer() {
        this.container = document.getElementById('rankingList');
        if (!this.container) {
            console.log('❌ Container rankingList non trouvé');
            return;
        }
        
        // Forcer la visibilité
        this.container.style.cssText = `
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        `;
    }

    async loadRealData() {
        try {
            // Attendre que Firebase soit disponible
            if (!window.firebase) {
                setTimeout(() => this.loadRealData(), 1000);
                return;
            }
            
            const db = window.firebase.database();
            const usersRef = db.ref('users');
            
            usersRef.on('value', (snapshot) => {
                const users = snapshot.val();
                if (users) {
                    this.processUserData(users);
                }
            });
        } catch (error) {
            console.error('❌ Erreur chargement classement:', error);
            setTimeout(() => this.loadRealData(), 2000);
        }
    }

    processUserData(users) {
        this.data = [];
        
        Object.keys(users).forEach(userId => {
            const user = users[userId];
            let trades = {};
            
            // Gérer différentes structures de données
            if (user.accounts && user.accounts.compte1 && user.accounts.compte1.trades) {
                // Structure dashboard
                if (Array.isArray(user.accounts.compte1.trades)) {
                    user.accounts.compte1.trades.forEach((trade, index) => {
                        trades[trade.id || `trade_${index}`] = trade;
                    });
                } else {
                    trades = user.accounts.compte1.trades;
                }
            } else if (user.trades) {
                // Structure directe
                trades = user.trades;
            }
            
            const stats = this.calculateStats(trades);
            
            if (stats.totalTrades > 0) {
                // Récupérer le pseudo depuis localStorage ou utiliser l'email
                const savedPseudo = localStorage.getItem(`pseudo_${userId}`);
                const displayName = savedPseudo || user.pseudo || user.email?.split('@')[0] || 'Utilisateur';
                
                this.data.push({
                    nickname: displayName,
                    profit: Math.round(stats.totalProfit),
                    winRate: Math.round(stats.winRate),
                    trades: stats.totalTrades
                });
            }
        });
        
        this.sortData();
        this.render();
    }

    calculateStats(trades) {
        const tradesList = Object.values(trades).filter(t => t && t.status === 'closed');
        const totalTrades = tradesList.length;
        const winningTrades = tradesList.filter(t => parseFloat(t.pnl || t.profit || 0) > 0).length;
        const totalProfit = tradesList.reduce((sum, t) => sum + parseFloat(t.pnl || t.profit || 0), 0);
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
        
        return { totalTrades, totalProfit, winRate };
    }

    render() {
        if (!this.container) return;
        
        this.container.innerHTML = '';
        
        if (this.data.length === 0) {
            this.container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">Aucun trader avec des données</div>';
            return;
        }
        
        this.data.forEach((user, index) => {
            const item = this.createRankingItem(user, index);
            this.container.appendChild(item);
        });
    }

    createRankingItem(user, index) {
        const div = document.createElement('div');
        const medal = ['🥇', '🥈', '🥉'][index] || `${index + 1}`;
        const bgColors = ['#ffd700', '#c0c0c0', '#cd7f32', '#f8f9fa'];
        
        div.style.cssText = `
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding: 15px !important;
            margin: 10px 0 !important;
            background: ${bgColors[index] || '#f8f9fa'} !important;
            border-radius: 10px !important;
            border: 1px solid #ddd !important;
            visibility: visible !important;
            opacity: 1 !important;
        `;
        
        div.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 20px; font-weight: bold;">${medal}</span>
                <div>
                    <div style="font-weight: bold; color: #333;">${user.nickname}</div>
                    <div style="font-size: 12px; color: #666;">${user.trades} trades</div>
                </div>
            </div>
            <div style="text-align: right;">
                <div style="font-weight: bold; color: ${user.profit >= 0 ? '#28a745' : '#dc3545'};">$${user.profit}</div>
                <div style="font-size: 12px; color: #666;">${user.winRate}% WR</div>
            </div>
        `;
        
        return div;
    }



    sortData() {
        this.data.sort((a, b) => b.profit - a.profit);
    }
}

// Initialisation
window.RankingVIP = RankingVIP;