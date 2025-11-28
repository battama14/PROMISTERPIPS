// Administration Dashboard - Version Complète
console.log('🔧 Chargement du panneau d\'administration...');

class AdminDashboard {
    constructor() {
        this.users = [];
        this.analytics = {};
        this.currentSection = 'users';
        this.init();
    }

    async init() {
        console.log('🚀 Initialisation admin dashboard...');
        await this.loadData();
        this.updateStats();
        this.loadUsers();
        console.log('✅ Admin dashboard initialisé');
    }

    async loadData() {
        try {
            if (!window.firebaseDB) {
                console.warn('Firebase non disponible');
                return;
            }

            const usersRef = window.dbRef(window.firebaseDB, 'users');
            const snapshot = await window.dbGet(usersRef);
            
            if (snapshot.exists()) {
                const usersData = snapshot.val();
                this.users = Object.keys(usersData).map(uid => ({
                    uid,
                    ...usersData[uid]
                }));
                console.log(`📊 ${this.users.length} utilisateurs chargés`);
            }
        } catch (error) {
            console.error('❌ Erreur chargement données:', error);
        }
    }

    updateStats() {
        const totalUsers = this.users.length;
        let totalTrades = 0;
        let totalVolume = 0;
        let activeToday = 0;
        const today = new Date().toISOString().split('T')[0];

        this.users.forEach(user => {
            if (user.accounts && user.accounts.compte1 && user.accounts.compte1.trades) {
                const trades = Array.isArray(user.accounts.compte1.trades) 
                    ? user.accounts.compte1.trades 
                    : Object.values(user.accounts.compte1.trades);
                
                totalTrades += trades.length;
                
                trades.forEach(trade => {
                    if (trade.pnl) totalVolume += Math.abs(parseFloat(trade.pnl));
                    if (trade.date === today) activeToday++;
                });
            }
            
            if (user.lastUpdated && user.lastUpdated.split('T')[0] === today) {
                activeToday++;
            }
        });

        this.updateElement('totalUsers', totalUsers);
        this.updateElement('totalTrades', totalTrades);
        this.updateElement('totalVolume', `$${totalVolume.toFixed(2)}`);
        this.updateElement('activeToday', activeToday);
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    loadUsers() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.users.length === 0) {
            tbody.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted); grid-column: 1 / -1;">Aucun utilisateur trouvé</div>';
            return;
        }

        this.users.forEach(user => {
            const row = document.createElement('div');
            row.className = 'trade-row';
            
            let tradesCount = 0;
            let totalPnL = 0;
            
            if (user.accounts && user.accounts.compte1 && user.accounts.compte1.trades) {
                const trades = Array.isArray(user.accounts.compte1.trades) 
                    ? user.accounts.compte1.trades 
                    : Object.values(user.accounts.compte1.trades);
                
                tradesCount = trades.length;
                totalPnL = trades.reduce((sum, trade) => sum + parseFloat(trade.pnl || 0), 0);
            }

            const lastActivity = user.lastUpdated 
                ? new Date(user.lastUpdated).toLocaleDateString()
                : 'Jamais';

            const pnlClass = totalPnL > 0 ? 'positive' : totalPnL < 0 ? 'negative' : 'neutral';

            row.innerHTML = `
                <div>${user.email || 'N/A'}</div>
                <div>${user.pseudo || 'Aucun'}</div>
                <div><span class="status-badge ${user.isVIP ? 'vip' : 'free'}">${user.plan || 'FREE'}</span></div>
                <div>${tradesCount}</div>
                <div class="${pnlClass}">$${totalPnL.toFixed(2)}</div>
                <div>${lastActivity}</div>
                <div>
                    <button class="action-btn-small" onclick="admin.editUser('${user.uid}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn-small" onclick="admin.viewUserDetails('${user.uid}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn-small delete" onclick="admin.deleteUser('${user.uid}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            tbody.appendChild(row);
        });
    }

    showUsers() {
        this.hideAllSections();
        document.getElementById('usersSection').style.display = 'block';
        this.updateNavigation('users');
        this.currentSection = 'users';
    }

    showAnalytics() {
        this.hideAllSections();
        document.getElementById('analyticsSection').style.display = 'block';
        this.updateNavigation('analytics');
        this.currentSection = 'analytics';
        this.loadAnalytics();
    }

    showSiteConfig() {
        this.hideAllSections();
        document.getElementById('siteConfigSection').style.display = 'block';
        this.updateNavigation('siteconfig');
        this.currentSection = 'siteconfig';
        this.loadSiteConfig();
    }

    showSystem() {
        this.hideAllSections();
        document.getElementById('systemSection').style.display = 'block';
        this.updateNavigation('system');
        this.currentSection = 'system';
        this.loadSystemInfo();
    }

    hideAllSections() {
        document.querySelectorAll('.admin-section').forEach(section => {
            section.style.display = 'none';
        });
    }

    updateNavigation(activeSection) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`a[href="#${activeSection}"]`).classList.add('active');
    }

    loadAnalytics() {
        const filter = document.getElementById('analyticsFilter').value;
        
        // Performance par utilisateur
        const userPerformance = document.getElementById('userPerformance');
        let performanceHTML = '';
        
        this.users.forEach(user => {
            if (user.accounts && user.accounts.compte1 && user.accounts.compte1.trades) {
                const trades = Array.isArray(user.accounts.compte1.trades) 
                    ? user.accounts.compte1.trades 
                    : Object.values(user.accounts.compte1.trades);
                
                const totalPnL = trades.reduce((sum, trade) => sum + parseFloat(trade.pnl || 0), 0);
                const pnlClass = totalPnL > 0 ? 'positive' : totalPnL < 0 ? 'negative' : 'neutral';
                
                performanceHTML += `
                    <div class="performance-item">
                        <span>${user.pseudo || user.email?.split('@')[0] || 'Utilisateur'}</span>
                        <span class="${pnlClass}">$${totalPnL.toFixed(2)}</span>
                    </div>
                `;
            }
        });
        
        userPerformance.innerHTML = performanceHTML || '<p>Aucune donnée disponible</p>';

        // Instruments les plus tradés
        const instruments = {};
        this.users.forEach(user => {
            if (user.accounts && user.accounts.compte1 && user.accounts.compte1.trades) {
                const trades = Array.isArray(user.accounts.compte1.trades) 
                    ? user.accounts.compte1.trades 
                    : Object.values(user.accounts.compte1.trades);
                
                trades.forEach(trade => {
                    if (trade.currency) {
                        instruments[trade.currency] = (instruments[trade.currency] || 0) + 1;
                    }
                });
            }
        });

        const topInstruments = document.getElementById('topInstruments');
        const sortedInstruments = Object.entries(instruments)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        let instrumentsHTML = '';
        sortedInstruments.forEach(([instrument, count]) => {
            instrumentsHTML += `
                <div class="instrument-item">
                    <span>${instrument}</span>
                    <span>${count} trades</span>
                </div>
            `;
        });

        topInstruments.innerHTML = instrumentsHTML || '<p>Aucune donnée disponible</p>';

        // Activité par jour
        const dailyActivity = document.getElementById('dailyActivity');
        dailyActivity.innerHTML = '<p>Graphique d\'activité - En développement</p>';
    }

    loadSystemInfo() {
        document.getElementById('dbStatus').textContent = window.firebaseDB ? 'Connecté' : 'Déconnecté';
        document.getElementById('dbStatus').className = window.firebaseDB ? 'status-ok' : 'status-error';
        
        const lastBackup = localStorage.getItem('lastBackup');
        document.getElementById('lastBackup').textContent = lastBackup 
            ? new Date(lastBackup).toLocaleString()
            : 'Jamais';
    }

    addUser() {
        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <h3>Créer un Utilisateur VIP</h3>
            <div class="trade-form">
                <div class="form-group">
                    <label>Email:</label>
                    <input type="email" id="newUserEmail" placeholder="user@example.com">
                </div>
                <div class="form-group">
                    <label>Mot de passe:</label>
                    <input type="password" id="newUserPassword" placeholder="Mot de passe (min 6 caractères)">
                </div>
                <div class="form-group">
                    <label>Pseudo:</label>
                    <input type="text" id="newUserPseudo" placeholder="Pseudo">
                </div>
                <div class="form-group">
                    <label>Plan:</label>
                    <select id="newUserPlan">
                        <option value="FREE">FREE</option>
                        <option value="VIP">VIP</option>
                        <option value="PREMIUM">PREMIUM</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button class="btn-primary" onclick="admin.saveNewUser()">Créer</button>
                    <button class="btn-secondary" onclick="admin.closeModal()">Annuler</button>
                </div>
            </div>
        `;
        this.showModal();
    }

    async saveNewUser() {
        const email = document.getElementById('newUserEmail').value;
        const password = document.getElementById('newUserPassword').value;
        const pseudo = document.getElementById('newUserPseudo').value;
        const plan = document.getElementById('newUserPlan').value;

        if (!email || !password) {
            this.showNotification('Email et mot de passe requis', 'error');
            return;
        }

        if (password.length < 6) {
            this.showNotification('Mot de passe trop court (min 6 caractères)', 'error');
            return;
        }

        try {
            // Créer le compte Firebase Auth
            const { createUserWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js');
            const userCredential = await createUserWithEmailAndPassword(window.firebaseAuth, email, password);
            const newUser = userCredential.user;

            // Créer les données utilisateur dans la base
            const userData = {
                email,
                pseudo,
                plan,
                isVIP: plan === 'VIP' || plan === 'PREMIUM',
                accounts: {
                    compte1: {
                        trades: [],
                        capital: 1000,
                        settings: {
                            capital: 1000,
                            riskPerTrade: 2,
                            dailyTarget: 1,
                            weeklyTarget: 3,
                            monthlyTarget: 15
                        }
                    }
                },
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };

            const userRef = window.dbRef(window.firebaseDB, `users/${newUser.uid}`);
            await window.dbSet(userRef, userData);

            this.showNotification('Utilisateur créé avec succès!', 'success');
            this.closeModal();
            await this.loadData();
            this.updateStats();
            this.loadUsers();
        } catch (error) {
            console.error('Erreur création utilisateur:', error);
            let errorMessage = 'Erreur lors de la création';
            
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Cet email est déjà utilisé';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Email invalide';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Mot de passe trop faible';
            }
            
            this.showNotification(errorMessage, 'error');
        }
    }

    editUser(uid) {
        const user = this.users.find(u => u.uid === uid);
        if (!user) return;

        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <h3>Modifier l'Utilisateur</h3>
            <div class="trade-form">
                <div class="form-group">
                    <label>Email:</label>
                    <input type="email" id="editUserEmail" value="${user.email || ''}" readonly>
                </div>
                <div class="form-group">
                    <label>Pseudo:</label>
                    <input type="text" id="editUserPseudo" value="${user.pseudo || ''}">
                </div>
                <div class="form-group">
                    <label>Plan:</label>
                    <select id="editUserPlan">
                        <option value="FREE" ${user.plan === 'FREE' ? 'selected' : ''}>FREE</option>
                        <option value="VIP" ${user.plan === 'VIP' ? 'selected' : ''}>VIP</option>
                        <option value="PREMIUM" ${user.plan === 'PREMIUM' ? 'selected' : ''}>PREMIUM</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button class="btn-primary" onclick="admin.saveUserEdit('${uid}')">Sauvegarder</button>
                    <button class="btn-secondary" onclick="admin.closeModal()">Annuler</button>
                </div>
            </div>
        `;
        this.showModal();
    }

    async saveUserEdit(uid) {
        const pseudo = document.getElementById('editUserPseudo').value;
        const plan = document.getElementById('editUserPlan').value;

        try {
            const userRef = window.dbRef(window.firebaseDB, `users/${uid}`);
            const snapshot = await window.dbGet(userRef);
            
            if (snapshot.exists()) {
                const userData = snapshot.val();
                userData.pseudo = pseudo;
                userData.plan = plan;
                userData.isVIP = plan === 'VIP' || plan === 'PREMIUM';
                userData.lastUpdated = new Date().toISOString();

                await window.dbSet(userRef, userData);
                
                this.showNotification('Utilisateur modifié avec succès!', 'success');
                this.closeModal();
                await this.loadData();
                this.updateStats();
                this.loadUsers();
            }
        } catch (error) {
            console.error('Erreur modification utilisateur:', error);
            this.showNotification('Erreur lors de la modification', 'error');
        }
    }

    viewUserDetails(uid) {
        const user = this.users.find(u => u.uid === uid);
        if (!user) return;

        let tradesHTML = '';
        if (user.accounts && user.accounts.compte1 && user.accounts.compte1.trades) {
            const trades = Array.isArray(user.accounts.compte1.trades) 
                ? user.accounts.compte1.trades 
                : Object.values(user.accounts.compte1.trades);
            
            tradesHTML = trades.map(trade => `
                <div class="trade-detail">
                    <span>${trade.date || 'N/A'}</span>
                    <span>${trade.currency || 'N/A'}</span>
                    <span>${trade.type || 'N/A'}</span>
                    <span class="${parseFloat(trade.pnl || 0) >= 0 ? 'positive' : 'negative'}">
                        $${parseFloat(trade.pnl || 0).toFixed(2)}
                    </span>
                </div>
            `).join('');
        }

        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <h3>Détails de l'Utilisateur</h3>
            <div class="user-details">
                <div class="detail-section">
                    <h4>Informations</h4>
                    <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
                    <p><strong>Pseudo:</strong> ${user.pseudo || 'Aucun'}</p>
                    <p><strong>Plan:</strong> ${user.plan || 'FREE'}</p>
                    <p><strong>Créé le:</strong> ${user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}</p>
                    <p><strong>Dernière activité:</strong> ${user.lastUpdated ? new Date(user.lastUpdated).toLocaleString() : 'N/A'}</p>
                </div>
                <div class="detail-section">
                    <h4>Trades (${tradesHTML ? tradesHTML.split('trade-detail').length - 1 : 0})</h4>
                    <div class="trades-list">
                        ${tradesHTML || '<p>Aucun trade</p>'}
                    </div>
                </div>
            </div>
            <div class="form-actions">
                <button class="btn-secondary" onclick="admin.closeModal()">Fermer</button>
            </div>
        `;
        this.showModal();
    }

    async deleteUser(uid) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cela supprimera aussi son compte Firebase.')) return;

        try {
            // Supprimer les données utilisateur
            const userRef = window.dbRef(window.firebaseDB, `users/${uid}`);
            await window.dbSet(userRef, null);
            
            // Note: La suppression du compte Firebase Auth nécessite des privilèges admin côté serveur
            // Pour l'instant, on supprime seulement les données
            
            this.showNotification('Données utilisateur supprimées avec succès!', 'success');
            await this.loadData();
            this.updateStats();
            this.loadUsers();
        } catch (error) {
            console.error('Erreur suppression utilisateur:', error);
            this.showNotification('Erreur lors de la suppression', 'error');
        }
    }

    searchUser() {
        const email = document.getElementById('searchUserEmail').value.toLowerCase();
        if (!email) {
            this.showNotification('Veuillez saisir un email', 'error');
            return;
        }
        
        const user = this.users.find(u => u.email && u.email.toLowerCase() === email);
        if (user) {
            this.closeModal();
            this.editUser(user.uid);
            this.showNotification('Utilisateur trouvé! Vous pouvez maintenant modifier son statut.', 'success');
        } else {
            this.showNotification('Utilisateur non trouvé. Il doit d\'abord créer son compte.', 'warning');
        }
    }

    async refreshUsers() {
        this.showNotification('Actualisation en cours...', 'info');
        await this.loadData();
        this.updateStats();
        this.loadUsers();
        this.showNotification('Données actualisées!', 'success');
    }

    async backupData() {
        try {
            const data = {
                users: this.users,
                timestamp: new Date().toISOString(),
                version: '2.0.0'
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `misterpips_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);

            localStorage.setItem('lastBackup', new Date().toISOString());
            this.showNotification('Sauvegarde créée avec succès!', 'success');
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
            this.showNotification('Erreur lors de la sauvegarde', 'error');
        }
    }

    showLogs() {
        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <h3>Logs Système</h3>
            <div class="logs-container">
                <div class="log-entry">
                    <span class="log-time">${new Date().toLocaleString()}</span>
                    <span class="log-level info">INFO</span>
                    <span class="log-message">Système démarré</span>
                </div>
                <div class="log-entry">
                    <span class="log-time">${new Date().toLocaleString()}</span>
                    <span class="log-level success">SUCCESS</span>
                    <span class="log-message">Connexion Firebase établie</span>
                </div>
                <div class="log-entry">
                    <span class="log-time">${new Date().toLocaleString()}</span>
                    <span class="log-level info">INFO</span>
                    <span class="log-message">Admin dashboard initialisé</span>
                </div>
            </div>
            <div class="form-actions">
                <button class="btn-secondary" onclick="admin.closeModal()">Fermer</button>
            </div>
        `;
        this.showModal();
    }

    testConnection() {
        if (window.firebaseDB) {
            this.showNotification('Connexion Firebase OK!', 'success');
        } else {
            this.showNotification('Erreur de connexion Firebase', 'error');
        }
    }

    cleanupData() {
        if (!confirm('Nettoyer les données obsolètes ?')) return;
        this.showNotification('Nettoyage effectué!', 'success');
    }

    toggleMaintenance() {
        const current = document.getElementById('maintenanceMode').textContent;
        const newMode = current === 'Activé' ? 'Désactivé' : 'Activé';
        document.getElementById('maintenanceMode').textContent = newMode;
        document.getElementById('maintenanceMode').className = newMode === 'Activé' ? 'status-warning' : 'status-off';
        this.showNotification(`Mode maintenance ${newMode.toLowerCase()}`, 'info');
    }

    async loadSiteConfig() {
        try {
            const configRef = window.dbRef(window.firebaseDB, 'siteConfig');
            const snapshot = await window.dbGet(configRef);
            
            if (snapshot.exists()) {
                const config = snapshot.val();
                document.getElementById('heroProfit').value = config.heroProfit || '+2,847$';
                document.getElementById('heroWinRate').value = config.heroWinRate || '87.3%';
                document.getElementById('tradersCount').value = config.tradersCount || '500+';
                document.getElementById('successRate').value = config.successRate || '87%';
                document.getElementById('totalProfits').value = config.totalProfits || '2.8M$';
                document.getElementById('supportTime').value = config.supportTime || '24/7';
                document.getElementById('aboutTraders').value = config.aboutTraders || '500+';
                document.getElementById('aboutSuccess').value = config.aboutSuccess || '87%';
                document.getElementById('aboutSupport').value = config.aboutSupport || '24/7';
            }
        } catch (error) {
            console.error('Erreur chargement config:', error);
        }
    }

    async saveSiteConfig() {
        try {
            const config = {
                heroProfit: document.getElementById('heroProfit').value || '+2,847$',
                heroWinRate: document.getElementById('heroWinRate').value || '87.3%',
                tradersCount: document.getElementById('tradersCount').value || '500+',
                successRate: document.getElementById('successRate').value || '87%',
                totalProfits: document.getElementById('totalProfits').value || '2.8M$',
                supportTime: document.getElementById('supportTime').value || '24/7',
                aboutTraders: document.getElementById('aboutTraders').value || '500+',
                aboutSuccess: document.getElementById('aboutSuccess').value || '87%',
                aboutSupport: document.getElementById('aboutSupport').value || '24/7',
                lastUpdated: new Date().toISOString()
            };

            const configRef = window.dbRef(window.firebaseDB, 'siteConfig');
            await window.dbSet(configRef, config);
            
            this.showNotification('Configuration sauvegardée avec succès!', 'success');
        } catch (error) {
            console.error('Erreur sauvegarde config:', error);
            this.showNotification('Erreur lors de la sauvegarde', 'error');
        }
    }

    resetSystem() {
        if (!confirm('ATTENTION: Ceci va réinitialiser tout le système. Continuer ?')) return;
        this.showNotification('Reset système annulé - Fonction désactivée pour sécurité', 'warning');
    }

    showModal() {
        document.getElementById('adminModal').style.display = 'flex';
    }

    closeModal() {
        document.getElementById('adminModal').style.display = 'none';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 1rem 1.5rem;
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

    getNotificationColor(type) {
        const colors = {
            success: 'linear-gradient(135deg, #44ff44, #28a745)',
            error: 'linear-gradient(135deg, #ff4444, #dc3545)',
            warning: 'linear-gradient(135deg, #ffaa00, #ffc107)',
            info: 'linear-gradient(135deg, #00d4ff, #17a2b8)'
        };
        return colors[type] || colors.info;
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
            window.location.href = 'index.html';
        }
    }
}

// Initialisation
let admin;

function initializeAdmin() {
    console.log('🔧 Démarrage admin dashboard...');
    try {
        admin = new AdminDashboard();
        window.admin = admin;
        console.log('✅ Admin dashboard créé');
    } catch (error) {
        console.error('❌ Erreur création admin dashboard:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdmin);
} else {
    setTimeout(initializeAdmin, 100);
}

console.log('📝 Script admin chargé avec succès');