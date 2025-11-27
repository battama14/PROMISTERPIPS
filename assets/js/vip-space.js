// Script VIP Space
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 VIP Space initialisé');
    
    // Éléments DOM
    const backBtn = document.getElementById('backBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Bouton retour
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
    }
    
    // Bouton déconnexion
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                try {
                    await window.signOut(window.firebaseAuth);
                    sessionStorage.clear();
                    localStorage.removeItem('vipAccess');
                    showNotification('Déconnexion réussie', 'success');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                } catch (error) {
                    console.error('Erreur déconnexion:', error);
                    showNotification('Erreur lors de la déconnexion', 'error');
                }
            }
        });
    }
    
    // Fonction PWA - Installer l'app
    window.downloadApp = function() {
        if ('serviceWorker' in navigator) {
            showNotification('Installation de l\'application...', 'info');
            // Logique d'installation PWA
            setTimeout(() => {
                showNotification('Application installée avec succès !', 'success');
            }, 2000);
        } else {
            showNotification('Votre navigateur ne supporte pas l\'installation', 'warning');
        }
    };
    
    // Animations des cartes
    const navCards = document.querySelectorAll('.nav-card');
    navCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 200);
    });
    
    // Fonction notification
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${getNotificationColor(type)};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
            z-index: 9999;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 350px;
            font-weight: 500;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    function getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }
    
    function getNotificationColor(type) {
        const colors = {
            success: 'linear-gradient(135deg, #44ff44, #28a745)',
            error: 'linear-gradient(135deg, #ff4444, #dc3545)',
            warning: 'linear-gradient(135deg, #ffaa00, #ffc107)',
            info: 'linear-gradient(135deg, #00d4ff, #17a2b8)'
        };
        return colors[type] || colors.info;
    }
    
    console.log('✅ VIP Space scripts chargés');
});