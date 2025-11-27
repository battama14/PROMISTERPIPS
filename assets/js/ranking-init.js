// Initialisation du classement VIP
console.log('🏆 Initialisation du classement VIP...');

// Attendre que Firebase soit disponible
function waitForFirebase() {
    return new Promise((resolve) => {
        const checkFirebase = () => {
            if (window.firebaseDB && window.firebaseAuth) {
                resolve();
            } else {
                setTimeout(checkFirebase, 500);
            }
        };
        checkFirebase();
    });
}

// Initialiser le classement après chargement de Firebase
async function initRanking() {
    try {
        await waitForFirebase();
        
        // Attendre un peu plus pour s'assurer que tout est prêt
        setTimeout(() => {
            if (window.RankingVIP) {
                const ranking = new window.RankingVIP();
                console.log('✅ Classement VIP initialisé avec succès');
            } else {
                console.warn('⚠️ RankingVIP non disponible');
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Erreur initialisation classement:', error);
    }
}

// Démarrer l'initialisation
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRanking);
} else {
    initRanking();
}

// Fonction pour forcer le rechargement du classement
window.refreshRanking = function() {
    if (window.RankingVIP) {
        const ranking = new window.RankingVIP();
        console.log('🔄 Classement VIP rechargé');
    }
};