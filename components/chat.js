// Composant Chat VIP - Ultra Optimisé
class ChatVIP {
    constructor() {
        this.isVisible = false;
        this.container = null;
        this.widget = null;
        this.messagesContainer = null;
        this.input = null;
        this.init();
    }

    init() {
        this.createElements();
        this.setupEventListeners();
        this.setupFirebaseListener();
        console.log('✅ Chat VIP initialisé');
    }

    createElements() {
        // Conteneur principal
        this.container = document.createElement('div');
        this.container.id = 'chatContainer';
        this.container.innerHTML = `
            <div id="chatIcon" class="chat-icon">💬</div>
            <div id="chatWidget" class="chat-widget">
                <div class="chat-header">
                    <h4>💬 Chat VIP</h4>
                    <button id="closeChatBtn">✕</button>
                </div>
                <div id="chatMessages" class="chat-messages"></div>
                <div class="chat-input-container">
                    <input type="text" id="chatInput" placeholder="Tapez votre message...">
                    <button id="sendChatBtn">➤</button>
                </div>
            </div>
        `;
        
        // Styles inline pour garantir l'affichage
        this.container.style.cssText = `
            position: fixed !important;
            bottom: 20px !important;
            right: 20px !important;
            z-index: 999999 !important;
            font-family: Arial, sans-serif !important;
        `;
        
        document.body.appendChild(this.container);
        
        // Références rapides
        this.widget = document.getElementById('chatWidget');
        this.messagesContainer = document.getElementById('chatMessages');
        this.input = document.getElementById('chatInput');
    }

    setupEventListeners() {
        const icon = document.getElementById('chatIcon');
        const closeBtn = document.getElementById('closeChatBtn');
        const sendBtn = document.getElementById('sendChatBtn');
        const input = document.getElementById('chatInput');
        
        if (icon) icon.onclick = () => this.toggle();
        if (closeBtn) closeBtn.onclick = () => this.hide();
        if (sendBtn) sendBtn.onclick = () => this.sendMessage();
        if (input) {
            input.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.sendMessage();
                }
            };
        }
        
        console.log('✅ Chat event listeners configurés');
    }

    toggle() {
        this.isVisible = !this.isVisible;
        this.widget.style.display = this.isVisible ? 'block' : 'none';
        if (this.isVisible && this.messagesContainer.children.length === 0) {
            this.loadMessages();
        }
    }

    hide() {
        this.isVisible = false;
        this.widget.style.display = 'none';
    }

    async sendMessage() {
        const input = document.getElementById('chatInput');
        if (!input) {
            console.error('❌ Input chat non trouvé');
            return;
        }
        
        const message = input.value.trim();
        if (!message) {
            console.log('⚠️ Message vide');
            return;
        }
        
        console.log('📤 Tentative envoi message:', message);
        
        const messageData = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: sessionStorage.getItem('firebaseUID') || 'demo_user',
            nickname: localStorage.getItem('userNickname') || 'Utilisateur',
            message: message,
            timestamp: Date.now(),
            type: 'text'
        };
        
        // Afficher immédiatement le message
        this.addMessageToUI(messageData);
        input.value = '';
        
        // Essayer d'envoyer à Firebase
        if (window.firebaseDB && window.firebaseModules) {
            try {
                const { ref, push } = window.firebaseModules;
                await push(ref(window.firebaseDB, 'vip_chat'), messageData);
                console.log('✅ Message envoyé à Firebase');
            } catch (error) {
                console.error('❌ Erreur Firebase:', error);
            }
        } else {
            console.log('📴 Mode démo - Firebase non disponible');
        }
    }

    setupFirebaseListener() {
        if (!window.firebaseDB) {
            setTimeout(() => this.setupFirebaseListener(), 1000);
            return;
        }

        const { ref, onValue } = window.firebaseModules;
        onValue(ref(window.firebaseDB, 'vip_chat'), (snapshot) => {
            if (!snapshot.exists()) return;
            
            const messages = Object.values(snapshot.val())
                .sort((a, b) => a.timestamp - b.timestamp)
                .slice(-20);
            
            this.displayMessages(messages);
        });
    }

    displayMessages(messages) {
        this.messagesContainer.innerHTML = '';
        const currentUserId = sessionStorage.getItem('firebaseUID');
        
        messages.forEach(msg => {
            this.addMessageToUI(msg);
        });
        
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
    
    addMessageToUI(messageData) {
        const currentUserId = sessionStorage.getItem('firebaseUID');
        const div = document.createElement('div');
        div.className = `message ${messageData.userId === currentUserId ? 'own' : 'other'}`;
        div.innerHTML = `
            <div class="message-text">${messageData.message}</div>
            <div class="message-info">
                <span class="message-author">${messageData.nickname}</span>
                <span class="message-time">${new Date(messageData.timestamp).toLocaleTimeString()}</span>
            </div>
        `;
        this.messagesContainer.appendChild(div);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    loadMessages() {
        // Messages déjà chargés via le listener Firebase
    }
}

// Initialisation
window.ChatVIP = ChatVIP;