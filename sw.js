// Service Worker pour les notifications push - Misterpips
const CACHE_NAME = 'misterpips-v1';
const urlsToCache = [
    '/',
    '/planning-forex.html',
    '/assets/css/planning.css',
    '/assets/js/planning-forex.js',
    '/assets/images/Misterpips.jpg'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Gestion des requêtes
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Retourner la réponse du cache ou faire la requête
                return response || fetch(event.request);
            })
    );
});

// Gestion des notifications push
self.addEventListener('push', (event) => {
    console.log('📱 Notification push reçue:', event);
    
    const options = {
        body: event.data ? event.data.text() : '🚀 Nouvelle alerte Forex',
        icon: '/assets/images/Misterpips.jpg',
        badge: '/assets/images/Misterpips.jpg',
        vibrate: [200, 100, 200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: '📊 Voir le planning',
                icon: '/assets/images/chart-icon.png'
            },
            {
                action: 'close',
                title: '❌ Fermer',
                icon: '/assets/images/close-icon.png'
            }
        ],
        requireInteraction: true,
        tag: 'forex-alert'
    };

    event.waitUntil(
        self.registration.showNotification('🚨 Alerte Forex - Misterpips', options)
    );
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
    console.log('🖱️ Clic sur notification:', event);
    
    event.notification.close();

    if (event.action === 'explore') {
        // Ouvrir le planning forex
        event.waitUntil(
            clients.openWindow('/planning-forex.html')
        );
    } else if (event.action === 'close') {
        // Fermer la notification
        event.notification.close();
    } else {
        // Clic par défaut - ouvrir l'app
        event.waitUntil(
            clients.matchAll().then((clientList) => {
                for (const client of clientList) {
                    if (client.url === '/' && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
        );
    }
});

// Gestion de la fermeture des notifications
self.addEventListener('notificationclose', (event) => {
    console.log('🔕 Notification fermée:', event);
    
    // Analytics ou tracking si nécessaire
    event.waitUntil(
        fetch('/api/analytics', {
            method: 'POST',
            body: JSON.stringify({
                action: 'notification_closed',
                tag: event.notification.tag,
                timestamp: Date.now()
            })
        }).catch(() => {
            // Ignorer les erreurs d'analytics
        })
    );
});

// Synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    try {
        // Synchroniser les données en arrière-plan
        console.log('🔄 Synchronisation en arrière-plan...');
        
        // Ici on pourrait synchroniser les alertes, prix, etc.
        const response = await fetch('/api/sync');
        const data = await response.json();
        
        console.log('✅ Synchronisation terminée:', data);
    } catch (error) {
        console.error('❌ Erreur synchronisation:', error);
    }
}

// Message du client vers le Service Worker
self.addEventListener('message', (event) => {
    console.log('💬 Message reçu:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    // Répondre au client
    event.ports[0].postMessage({
        type: 'SW_RESPONSE',
        message: 'Service Worker actif'
    });
});

console.log('🔧 Service Worker Misterpips chargé');