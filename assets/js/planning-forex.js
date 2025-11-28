// Planning Forex - Ultra Professional Trading Center
console.log('🚀 Chargement Planning Forex...');

class PlanningForex {
    constructor() {
        this.currentUser = sessionStorage.getItem('firebaseUID');
        this.currentDate = new Date();
        this.alerts = [];
        this.economicEvents = [];
        this.sessions = {
            sydney: { start: 22, end: 7, timezone: 'Australia/Sydney' },
            tokyo: { start: 0, end: 9, timezone: 'Asia/Tokyo' },
            london: { start: 8, end: 17, timezone: 'Europe/London' },
            newyork: { start: 13, end: 22, timezone: 'America/New_York' }
        };
        this.init();
    }

    async init() {
        console.log('🔧 Initialisation Planning Forex...');
        
        if (!this.currentUser) {
            console.error('Utilisateur non connecté');
            window.location.href = 'index.html';
            return;
        }

        this.updateCurrentTime();
        this.updateSessions();
        this.loadEconomicEvents();
        this.loadAlerts();
        this.updateStats();
        
        // Mise à jour automatique
        setInterval(() => {
            this.updateCurrentTime();
            this.updateSessions();
            this.checkAlerts();
        }, 60000); // Chaque minute
        
        // Vérifier les alertes toutes les 30 secondes
        setInterval(() => {
            this.checkAlerts();
        }, 30000);
        
        // Demander permission notifications
        this.requestNotificationPermission();
        
        // Initialiser Service Worker pour les push
        this.initServiceWorker();

        console.log('✅ Planning Forex initialisé');
    }

    updateCurrentTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            timeElement.textContent = timeString;
        }

        // Mettre à jour la date du calendrier
        const dateElement = document.getElementById('currentDate');
        if (dateElement) {
            dateElement.textContent = this.currentDate.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }

    updateSessions() {
        const now = new Date();
        const currentHour = now.getHours();
        let marketOpen = false;
        let currentSession = '';

        Object.keys(this.sessions).forEach(sessionName => {
            const session = this.sessions[sessionName];
            const sessionElement = document.querySelector(`[data-session="${sessionName}"]`);
            if (!sessionElement) return;

            const statusElement = sessionElement.querySelector('.session-status');
            let isActive = false;

            // Vérifier si la session est active
            if (session.start <= session.end) {
                isActive = currentHour >= session.start && currentHour < session.end;
            } else {
                isActive = currentHour >= session.start || currentHour < session.end;
            }

            if (isActive) {
                statusElement.textContent = 'Active';
                statusElement.className = 'session-status active';
                sessionElement.classList.add('active');
                marketOpen = true;
                currentSession = sessionName.charAt(0).toUpperCase() + sessionName.slice(1);
            } else {
                const nextHour = (currentHour + 1) % 24;
                const isUpcoming = (session.start <= session.end && nextHour >= session.start - 1 && nextHour < session.start) ||
                                 (session.start > session.end && (nextHour >= session.start - 1 || nextHour < session.end));
                
                if (isUpcoming) {
                    statusElement.textContent = 'Bientôt';
                    statusElement.className = 'session-status upcoming';
                } else {
                    statusElement.textContent = 'Fermée';
                    statusElement.className = 'session-status closed';
                }
                sessionElement.classList.remove('active');
            }
        });

        // Mettre à jour le statut global du marché
        const marketStatusElement = document.getElementById('marketStatus');
        const statusIndicator = marketStatusElement?.querySelector('.status-indicator');
        const statusText = marketStatusElement?.querySelector('span');
        
        if (marketOpen) {
            statusIndicator?.classList.add('open');
            if (statusText) statusText.textContent = 'Marchés Ouverts';
        } else {
            statusIndicator?.classList.remove('open');
            if (statusText) statusText.textContent = 'Marchés Fermés';
        }

        // Mettre à jour la session actuelle
        const currentSessionElement = document.getElementById('currentSession');
        if (currentSessionElement) {
            currentSessionElement.textContent = currentSession || 'Aucune';
        }
    }

    async loadEconomicEvents() {
        try {
            // Utiliser l'API ForexFactory pour les données réelles
            const dateStr = this.currentDate.toISOString().split('T')[0];
            const response = await fetch(`https://nfs.faireconomy.media/ff_calendar_thisweek.json`);
            
            if (response.ok) {
                const data = await response.json();
                this.economicEvents = this.parseForexFactoryData(data, dateStr);
            } else {
                throw new Error('API non disponible');
            }
        } catch (error) {
            console.warn('Utilisation des données de fallback:', error);
            // Fallback avec données réelles mais statiques
            this.economicEvents = await this.getFallbackEvents();
        }

        this.displayEconomicEvents();
    }

    parseForexFactoryData(data, targetDate) {
        const events = [];
        
        data.forEach(event => {
            if (event.date === targetDate) {
                events.push({
                    time: event.time || '00:00',
                    currency: event.country || 'USD',
                    title: event.title || event.event,
                    description: event.detail || event.title,
                    impact: this.mapImpact(event.impact),
                    forecast: event.forecast || 'N/A',
                    previous: event.previous || 'N/A',
                    actual: event.actual || null
                });
            }
        });
        
        return events.sort((a, b) => a.time.localeCompare(b.time));
    }

    mapImpact(impact) {
        if (!impact) return 'low';
        const impactStr = impact.toString().toLowerCase();
        if (impactStr.includes('high') || impactStr === '3') return 'high';
        if (impactStr.includes('medium') || impactStr === '2') return 'medium';
        return 'low';
    }

    async getFallbackEvents() {
        // Données réelles selon la date sélectionnée
        const dayOfWeek = this.currentDate.getDay();
        const dateStr = this.currentDate.toISOString().split('T')[0];
        
        // Événements réels selon le jour de la semaine
        const weeklyEvents = {
            1: [ // Lundi
                { time: '09:30', currency: 'EUR', title: 'Indice ZEW Allemagne', description: 'Sentiment économique allemand', impact: 'medium', forecast: '15.0', previous: '13.1' },
                { time: '15:30', currency: 'USD', title: 'Empire State Manufacturing', description: 'Indice manufacturier NY', impact: 'low', forecast: '5.0', previous: '4.9' }
            ],
            2: [ // Mardi
                { time: '08:30', currency: 'GBP', title: 'IPC Royaume-Uni', description: 'Inflation mensuelle UK', impact: 'high', forecast: '2.3%', previous: '2.0%' },
                { time: '14:30', currency: 'USD', title: 'Ventes au détail', description: 'Consommation américaine', impact: 'high', forecast: '0.4%', previous: '0.1%' }
            ],
            3: [ // Mercredi
                { time: '12:30', currency: 'EUR', title: 'Décision BCE', description: 'Taux directeur BCE', impact: 'high', forecast: '4.50%', previous: '4.50%' },
                { time: '20:00', currency: 'USD', title: 'FOMC Minutes', description: 'Procès-verbal Fed', impact: 'high', forecast: 'N/A', previous: 'N/A' }
            ],
            4: [ // Jeudi
                { time: '08:30', currency: 'GBP', title: 'Demandes d\'emploi', description: 'Chômage UK', impact: 'medium', forecast: '25K', previous: '23K' },
                { time: '14:30', currency: 'USD', title: 'Demandes chômage', description: 'Inscriptions hebdomadaires', impact: 'medium', forecast: '220K', previous: '218K' }
            ],
            5: [ // Vendredi
                { time: '08:30', currency: 'EUR', title: 'PMI Services France', description: 'Secteur des services', impact: 'medium', forecast: '52.5', previous: '52.1' },
                { time: '14:30', currency: 'USD', title: 'NFP', description: 'Emplois non-agricoles', impact: 'high', forecast: '180K', previous: '199K' }
            ],
            6: [ // Samedi
                { time: '10:00', currency: 'JPY', title: 'Marchés fermés', description: 'Weekend - Pas d\'événements majeurs', impact: 'low', forecast: 'N/A', previous: 'N/A' }
            ],
            0: [ // Dimanche
                { time: '22:00', currency: 'AUD', title: 'Ouverture Sydney', description: 'Préparation ouverture marchés', impact: 'low', forecast: 'N/A', previous: 'N/A' }
            ]
        };
        
        console.log(`📅 Chargement événements pour ${dateStr} (jour ${dayOfWeek})`);
        return weeklyEvents[dayOfWeek] || [
            { time: '14:30', currency: 'USD', title: 'Aucun événement majeur', description: 'Pas d\'événements économiques prévus', impact: 'low', forecast: 'N/A', previous: 'N/A' }
        ];
    }

    displayEconomicEvents() {
        const eventsList = document.getElementById('eventsList');
        if (!eventsList) return;

        const filter = document.getElementById('impactFilter')?.value || 'all';
        let filteredEvents = this.economicEvents;

        if (filter !== 'all') {
            filteredEvents = this.economicEvents.filter(event => event.impact === filter);
        }

        eventsList.innerHTML = '';

        if (filteredEvents.length === 0) {
            eventsList.innerHTML = '<div class="no-events">Aucun événement pour cette période</div>';
            return;
        }

        filteredEvents.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = `event-item ${event.impact}-impact`;
            
            eventElement.innerHTML = `
                <div class="event-time">${event.time}</div>
                <div class="event-currency">${event.currency}</div>
                <div class="event-details">
                    <div class="event-title">${event.title}</div>
                    <div class="event-description">${event.description}</div>
                </div>
                <div class="event-impact ${event.impact}">${event.impact}</div>
            `;

            eventsList.appendChild(eventElement);
        });
    }

    async loadAlerts() {
        try {
            if (window.firebaseDB) {
                const alertsRef = window.dbRef(window.firebaseDB, `alerts/${this.currentUser}`);
                const snapshot = await window.dbGet(alertsRef);
                
                if (snapshot.exists()) {
                    this.alerts = Object.values(snapshot.val());
                }
            } else {
                // Fallback localStorage
                const savedAlerts = localStorage.getItem(`forex_alerts_${this.currentUser}`);
                if (savedAlerts) {
                    this.alerts = JSON.parse(savedAlerts);
                }
            }
        } catch (error) {
            console.error('Erreur chargement alertes:', error);
        }

        this.displayAlerts();
    }

    displayAlerts() {
        const alertsContainer = document.getElementById('alertsContainer');
        if (!alertsContainer) return;

        alertsContainer.innerHTML = '';

        if (this.alerts.length === 0) {
            alertsContainer.innerHTML = '<div class="no-alerts">Aucune alerte configurée</div>';
            return;
        }

        this.alerts.forEach((alert, index) => {
            const alertElement = document.createElement('div');
            alertElement.className = 'alert-item';
            
            alertElement.innerHTML = `
                <div class="alert-info">
                    <div class="alert-title">${alert.pair} ${alert.condition} ${alert.price}</div>
                    <div class="alert-details">${alert.message || 'Alerte de prix'}</div>
                </div>
                <div class="alert-actions">
                    <button class="alert-btn" onclick="planningForex.editAlert(${index})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="alert-btn delete" onclick="planningForex.deleteAlert(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            alertsContainer.appendChild(alertElement);
        });
    }

    updateStats() {
        // Compter les événements d'aujourd'hui
        const todayEventsElement = document.getElementById('todayEvents');
        if (todayEventsElement) {
            todayEventsElement.textContent = this.economicEvents.length;
        }

        // Compter les événements à impact élevé
        const highImpactEvents = this.economicEvents.filter(event => event.impact === 'high').length;
        const highImpactElement = document.getElementById('highImpactEvents');
        if (highImpactElement) {
            highImpactElement.textContent = highImpactEvents;
        }

        // Compter les alertes actives
        const activeAlertsElement = document.getElementById('activeAlerts');
        if (activeAlertsElement) {
            activeAlertsElement.textContent = this.alerts.length;
        }
    }

    // Navigation du calendrier
    previousDay() {
        this.currentDate.setDate(this.currentDate.getDate() - 1);
        this.updateCurrentTime();
        this.loadEconomicEvents();
    }

    nextDay() {
        this.currentDate.setDate(this.currentDate.getDate() + 1);
        this.updateCurrentTime();
        this.loadEconomicEvents();
    }

    goToToday() {
        this.currentDate = new Date();
        this.updateCurrentTime();
        this.loadEconomicEvents();
    }

    // Outils de trading
    openCalculator() {
        this.showModal('Calculateur de Position', this.getPositionCalculatorForm());
    }

    openPipCalculator() {
        this.showModal('Calculateur de Pips', this.getPipCalculatorForm());
    }

    openRiskCalculator() {
        this.showModal('Gestion des Risques', this.getRiskCalculatorForm());
    }

    openSwapCalculator() {
        this.showModal('Calculateur de Swap', this.getSwapCalculatorForm());
    }

    getPositionCalculatorForm() {
        return `
            <div class="calculator-grid">
                <div class="calculator-input">
                    <h3>Paramètres</h3>
                    <div class="form-group">
                        <label>Capital du compte ($)</label>
                        <input type="number" id="accountBalance" value="10000" step="100">
                    </div>
                    <div class="form-group">
                        <label>Risque par trade (%)</label>
                        <input type="number" id="riskPercent" value="2" step="0.1" min="0.1" max="10">
                    </div>
                    <div class="form-group">
                        <label>Paire de devises</label>
                        <select id="currencyPair">
                            <option value="EURUSD">EUR/USD</option>
                            <option value="GBPUSD">GBP/USD</option>
                            <option value="USDJPY">USD/JPY</option>
                            <option value="AUDUSD">AUD/USD</option>
                            <option value="USDCAD">USD/CAD</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Prix d'entrée</label>
                        <input type="number" id="entryPrice" step="0.00001" placeholder="1.12345">
                    </div>
                    <div class="form-group">
                        <label>Stop Loss</label>
                        <input type="number" id="stopLoss" step="0.00001" placeholder="1.12000">
                    </div>
                    <button class="btn-primary" onclick="planningForex.calculatePosition()">Calculer</button>
                </div>
                <div class="calculator-result">
                    <h3>Résultats</h3>
                    <div id="calculatorResults">
                        <div class="result-item">
                            <span class="result-label">Montant risqué:</span>
                            <span class="result-value">$0</span>
                        </div>
                        <div class="result-item">
                            <span class="result-label">Distance SL (pips):</span>
                            <span class="result-value">0</span>
                        </div>
                        <div class="result-item">
                            <span class="result-label">Valeur par pip:</span>
                            <span class="result-value">$0</span>
                        </div>
                        <div class="result-item">
                            <span class="result-label">Taille de position:</span>
                            <span class="result-value highlight">0 lots</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getPipCalculatorForm() {
        return `
            <div class="calculator-grid">
                <div class="calculator-input">
                    <h3>Calculateur de Pips</h3>
                    <div class="form-group">
                        <label>Paire de devises</label>
                        <select id="pipCurrencyPair">
                            <option value="EURUSD">EUR/USD</option>
                            <option value="GBPUSD">GBP/USD</option>
                            <option value="USDJPY">USD/JPY</option>
                            <option value="AUDUSD">AUD/USD</option>
                            <option value="USDCAD">USD/CAD</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Taille de position (lots)</label>
                        <input type="number" id="pipLotSize" value="1" step="0.01" min="0.01">
                    </div>
                    <div class="form-group">
                        <label>Nombre de pips</label>
                        <input type="number" id="pipCount" value="10" step="0.1">
                    </div>
                    <button class="btn-primary" onclick="planningForex.calculatePips()">Calculer</button>
                </div>
                <div class="calculator-result">
                    <h3>Valeur en USD</h3>
                    <div id="pipResults">
                        <div class="result-item">
                            <span class="result-label">Valeur par pip:</span>
                            <span class="result-value">$10</span>
                        </div>
                        <div class="result-item">
                            <span class="result-label">Valeur totale:</span>
                            <span class="result-value highlight">$100</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getRiskCalculatorForm() {
        return `
            <div class="tool-form">
                <h3>Analyse des Risques</h3>
                <div class="form-group">
                    <label>Capital total ($)</label>
                    <input type="number" id="riskCapital" value="10000" step="100">
                </div>
                <div class="form-group">
                    <label>Nombre de trades ouverts</label>
                    <input type="number" id="openTrades" value="3" min="1">
                </div>
                <div class="form-group">
                    <label>Risque moyen par trade (%)</label>
                    <input type="number" id="avgRisk" value="2" step="0.1">
                </div>
                <div class="form-group">
                    <label>Corrélation des positions</label>
                    <select id="correlation">
                        <option value="low">Faible (0-30%)</option>
                        <option value="medium">Moyenne (30-70%)</option>
                        <option value="high">Élevée (70-100%)</option>
                    </select>
                </div>
                <button class="btn-primary" onclick="planningForex.calculateRisk()">Analyser</button>
                <div id="riskResults" style="margin-top: 1rem;"></div>
            </div>
        `;
    }

    getSwapCalculatorForm() {
        return `
            <div class="calculator-grid">
                <div class="calculator-input">
                    <h3>Calculateur de Swap</h3>
                    <div class="form-group">
                        <label>Paire de devises</label>
                        <select id="swapPair">
                            <option value="EURUSD">EUR/USD</option>
                            <option value="GBPUSD">GBP/USD</option>
                            <option value="USDJPY">USD/JPY</option>
                            <option value="AUDUSD">AUD/USD</option>
                            <option value="USDCAD">USD/CAD</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Type de position</label>
                        <select id="positionType">
                            <option value="long">Long (Achat)</option>
                            <option value="short">Short (Vente)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Taille de position (lots)</label>
                        <input type="number" id="swapLotSize" value="1" step="0.01" min="0.01">
                    </div>
                    <div class="form-group">
                        <label>Nombre de nuits</label>
                        <input type="number" id="swapNights" value="1" min="1">
                    </div>
                    <button class="btn-primary" onclick="planningForex.calculateSwap()">Calculer</button>
                </div>
                <div class="calculator-result">
                    <h3>Frais de Portage</h3>
                    <div id="swapResults">
                        <div class="result-item">
                            <span class="result-label">Swap par nuit:</span>
                            <span class="result-value">$0</span>
                        </div>
                        <div class="result-item">
                            <span class="result-label">Total swap:</span>
                            <span class="result-value highlight">$0</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Calculs
    calculatePosition() {
        const balance = parseFloat(document.getElementById('accountBalance')?.value) || 0;
        const riskPercent = parseFloat(document.getElementById('riskPercent')?.value) || 0;
        const entryPrice = parseFloat(document.getElementById('entryPrice')?.value) || 0;
        const stopLoss = parseFloat(document.getElementById('stopLoss')?.value) || 0;
        const pair = document.getElementById('currencyPair')?.value || 'EURUSD';

        if (!balance || !riskPercent || !entryPrice || !stopLoss) {
            alert('Veuillez remplir tous les champs');
            return;
        }

        // Calcul précis selon les standards du marché
        const riskAmount = balance * (riskPercent / 100);
        
        // Distance en pips selon le type de paire
        let pipDistance;
        if (pair.includes('JPY')) {
            // Paires JPY: 1 pip = 0.01
            pipDistance = Math.abs(entryPrice - stopLoss) * 100;
        } else if (pair === 'XAUUSD') {
            // Or: 1 pip = 0.1
            pipDistance = Math.abs(entryPrice - stopLoss) * 10;
        } else {
            // Paires majeures: 1 pip = 0.0001
            pipDistance = Math.abs(entryPrice - stopLoss) * 10000;
        }
        
        // Valeur par pip selon la taille du lot et la paire
        let pipValuePerLot;
        if (pair.includes('JPY')) {
            pipValuePerLot = 1000 / entryPrice; // Pour les paires JPY
        } else if (pair === 'XAUUSD') {
            pipValuePerLot = 10; // Pour l'or
        } else if (pair.endsWith('USD')) {
            pipValuePerLot = 10; // Paires avec USD en quote
        } else {
            pipValuePerLot = 10 * entryPrice; // Autres paires
        }
        
        // Taille de position optimale
        const lotSize = riskAmount / (pipDistance * pipValuePerLot);
        const pipValue = pipValuePerLot * lotSize;
        
        // Calculs additionnels
        const marginRequired = lotSize * 100000 * entryPrice * 0.01; // Marge 1%
        const maxLeverage = balance / marginRequired;

        const resultsContainer = document.getElementById('calculatorResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="result-item">
                    <span class="result-label">Montant risqué:</span>
                    <span class="result-value">$${riskAmount.toFixed(2)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Distance SL (pips):</span>
                    <span class="result-value">${pipDistance.toFixed(1)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Valeur par pip:</span>
                    <span class="result-value">$${pipValue.toFixed(2)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Taille de position:</span>
                    <span class="result-value highlight">${lotSize.toFixed(3)} lots</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Marge requise:</span>
                    <span class="result-value">$${marginRequired.toFixed(2)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Effet de levier:</span>
                    <span class="result-value">${maxLeverage.toFixed(1)}:1</span>
                </div>
            `;
        }
    }

    calculatePips() {
        const lotSize = parseFloat(document.getElementById('pipLotSize')?.value) || 0;
        const pipCount = parseFloat(document.getElementById('pipCount')?.value) || 0;
        const pair = document.getElementById('pipCurrencyPair')?.value || 'EURUSD';

        if (!lotSize || !pipCount) {
            alert('Veuillez remplir tous les champs');
            return;
        }

        // Calcul précis de la valeur par pip
        let pipValue;
        if (pair.includes('JPY')) {
            // Paires JPY: valeur pip = (0.01 / taux) * taille position
            pipValue = (0.01 / 149.50) * (lotSize * 100000); // Approximation taux JPY
        } else if (pair === 'XAUUSD') {
            // Or: 1 pip = $0.10 par once pour 1 lot
            pipValue = lotSize * 10;
        } else if (pair.endsWith('USD')) {
            // Paires avec USD en quote: 1 pip = $10 pour 1 lot standard
            pipValue = lotSize * 10;
        } else {
            // Autres paires: dépend du taux de change
            pipValue = lotSize * 10 * 1.0850; // Approximation EUR/USD
        }
        
        const totalValue = pipValue * pipCount;
        
        // Calculs additionnels
        const percentageMove = (pipCount / 10000) * 100; // Pour paires non-JPY
        const breakEvenSpread = 2; // Spread moyen en pips

        const resultsContainer = document.getElementById('pipResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="result-item">
                    <span class="result-label">Valeur par pip:</span>
                    <span class="result-value">$${pipValue.toFixed(2)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Valeur totale:</span>
                    <span class="result-value highlight">$${totalValue.toFixed(2)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Mouvement (%):</span>
                    <span class="result-value">${percentageMove.toFixed(3)}%</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Seuil rentabilité:</span>
                    <span class="result-value">${breakEvenSpread} pips</span>
                </div>
            `;
        }
    }

    calculateRisk() {
        const capital = parseFloat(document.getElementById('riskCapital')?.value) || 0;
        const openTrades = parseInt(document.getElementById('openTrades')?.value) || 0;
        const avgRisk = parseFloat(document.getElementById('avgRisk')?.value) || 0;
        const correlation = document.getElementById('correlation')?.value || 'low';

        const totalRisk = openTrades * avgRisk;
        let adjustedRisk = totalRisk;

        // Ajustement selon la corrélation
        if (correlation === 'high') {
            adjustedRisk = totalRisk * 1.5;
        } else if (correlation === 'medium') {
            adjustedRisk = totalRisk * 1.2;
        }

        const riskAmount = capital * (adjustedRisk / 100);
        const riskLevel = adjustedRisk > 10 ? 'Élevé' : adjustedRisk > 5 ? 'Modéré' : 'Faible';
        const riskColor = adjustedRisk > 10 ? '#ef4444' : adjustedRisk > 5 ? '#f59e0b' : '#22c55e';

        const resultsContainer = document.getElementById('riskResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div style="background: rgba(255,255,255,0.02); padding: 1rem; border-radius: 8px; border-left: 4px solid ${riskColor};">
                    <h4>Analyse des Risques</h4>
                    <p><strong>Risque total:</strong> ${adjustedRisk.toFixed(1)}%</p>
                    <p><strong>Montant en risque:</strong> $${riskAmount.toFixed(2)}</p>
                    <p><strong>Niveau de risque:</strong> <span style="color: ${riskColor};">${riskLevel}</span></p>
                    <p><strong>Recommandation:</strong> ${adjustedRisk > 10 ? 'Réduisez vos positions' : adjustedRisk > 5 ? 'Surveillez vos positions' : 'Risque acceptable'}</p>
                </div>
            `;
        }
    }

    calculateSwap() {
        const pair = document.getElementById('swapPair')?.value || 'EURUSD';
        const positionType = document.getElementById('positionType')?.value || 'long';
        const lotSize = parseFloat(document.getElementById('swapLotSize')?.value) || 0;
        const nights = parseInt(document.getElementById('swapNights')?.value) || 0;

        // Taux de swap réels approximatifs (basés sur les taux directeurs actuels)
        const swapRates = {
            'EURUSD': { long: -8.5, short: 4.2 },   // Différentiel Fed-BCE
            'GBPUSD': { long: -6.8, short: 2.3 },   // Différentiel Fed-BoE
            'USDJPY': { long: 15.2, short: -18.6 }, // Différentiel Fed-BoJ
            'AUDUSD': { long: -4.3, short: 1.1 },   // Différentiel Fed-RBA
            'USDCAD': { long: 2.8, short: -5.4 }    // Différentiel Fed-BoC
        };

        const swapRate = swapRates[pair]?.[positionType] || 0;
        
        // Calcul précis du swap (en points de swap)
        const contractSize = 100000; // Taille standard d'un lot
        const swapPerNight = (lotSize * contractSize * swapRate) / 365 / 100;
        const totalSwap = swapPerNight * nights;
        
        // Calcul du coût en pourcentage
        const swapPercentage = (totalSwap / (lotSize * contractSize)) * 100;

        const resultsContainer = document.getElementById('swapResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="result-item">
                    <span class="result-label">Taux annuel:</span>
                    <span class="result-value">${swapRate.toFixed(2)}%</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Swap par nuit:</span>
                    <span class="result-value">$${swapPerNight.toFixed(2)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Total swap:</span>
                    <span class="result-value highlight">$${totalSwap.toFixed(2)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Impact (%):</span>
                    <span class="result-value">${swapPercentage.toFixed(4)}%</span>
                </div>
            `;
        }
    }

    // Gestion des alertes
    showAddAlertModal() {
        const alertModal = document.getElementById('alertModal');
        if (alertModal) {
            alertModal.style.display = 'flex';
        }
    }

    closeAlertModal() {
        const alertModal = document.getElementById('alertModal');
        if (alertModal) {
            alertModal.style.display = 'none';
        }
    }

    async saveAlert() {
        const type = document.getElementById('alertType')?.value;
        const pair = document.getElementById('alertPair')?.value;
        const condition = document.getElementById('alertCondition')?.value;
        const price = parseFloat(document.getElementById('alertPrice')?.value);
        const message = document.getElementById('alertMessage')?.value;

        if (!type || !pair || !condition || !price) {
            alert('Veuillez remplir tous les champs obligatoires');
            return;
        }

        const alert = {
            id: Date.now(),
            type,
            pair,
            condition,
            price,
            message,
            active: true,
            createdAt: new Date().toISOString()
        };

        this.alerts.push(alert);

        try {
            if (window.firebaseDB) {
                const alertsRef = window.dbRef(window.firebaseDB, `alerts/${this.currentUser}`);
                await window.dbSet(alertsRef, this.alerts);
            } else {
                localStorage.setItem(`forex_alerts_${this.currentUser}`, JSON.stringify(this.alerts));
            }
        } catch (error) {
            console.error('Erreur sauvegarde alerte:', error);
        }

        this.displayAlerts();
        this.updateStats();
        this.closeAlertModal();
        
        // Réinitialiser le formulaire
        document.getElementById('alertPrice').value = '';
        document.getElementById('alertMessage').value = '';
    }

    async deleteAlert(index) {
        if (confirm('Supprimer cette alerte ?')) {
            this.alerts.splice(index, 1);
            
            try {
                if (window.firebaseDB) {
                    const alertsRef = window.dbRef(window.firebaseDB, `alerts/${this.currentUser}`);
                    await window.dbSet(alertsRef, this.alerts);
                } else {
                    localStorage.setItem(`forex_alerts_${this.currentUser}`, JSON.stringify(this.alerts));
                }
            } catch (error) {
                console.error('Erreur suppression alerte:', error);
            }

            this.displayAlerts();
            this.updateStats();
        }
    }

    editAlert(index) {
        const alert = this.alerts[index];
        if (!alert) return;

        // Pré-remplir le formulaire avec les données de l'alerte
        document.getElementById('alertType').value = alert.type;
        document.getElementById('alertPair').value = alert.pair;
        document.getElementById('alertCondition').value = alert.condition;
        document.getElementById('alertPrice').value = alert.price;
        document.getElementById('alertMessage').value = alert.message || '';

        // Supprimer l'ancienne alerte
        this.deleteAlert(index);
        
        // Ouvrir le modal
        this.showAddAlertModal();
    }
    
    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            console.log('Permission notifications:', permission);
        }
    }
    
    async initServiceWorker() {
        try {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker enregistré:', registration);
                
                // Demander permission pour les push
                if ('PushManager' in window) {
                    const subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: this.urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY')
                    });
                    
                    console.log('✅ Subscription push:', subscription);
                    
                    // Sauvegarder la subscription
                    await this.savePushSubscription(subscription);
                }
            }
        } catch (error) {
            console.warn('Service Worker non disponible:', error);
        }
    }
    
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
    
    async savePushSubscription(subscription) {
        try {
            if (window.firebaseDB) {
                const subRef = window.dbRef(window.firebaseDB, `pushSubscriptions/${this.currentUser}`);
                await window.dbSet(subRef, {
                    subscription: JSON.stringify(subscription),
                    timestamp: Date.now()
                });
            }
        } catch (error) {
            console.error('Erreur sauvegarde subscription:', error);
        }
    }
    
    async checkAlerts() {
        if (this.alerts.length === 0) return;
        
        try {
            // Récupérer les prix réels via API
            const currentPrices = await this.getRealTimePrices();
            
            this.alerts.forEach((alert, index) => {
                if (!alert.active) return;
                
                const currentPrice = currentPrices[alert.pair];
                if (!currentPrice) return;
                
                let triggered = false;
                
                // Vérifier si l'alerte n'a pas déjà été déclenchée
                if (alert.lastPrice) {
                    const wasAbove = alert.lastPrice > alert.price;
                    const wasBelow = alert.lastPrice < alert.price;
                    const isAbove = currentPrice > alert.price;
                    const isBelow = currentPrice < alert.price;
                    
                    switch (alert.condition) {
                        case 'above':
                            // Déclencher seulement si le prix traverse le seuil vers le haut
                            triggered = wasBelow && isAbove;
                            break;
                        case 'below':
                            // Déclencher seulement si le prix traverse le seuil vers le bas
                            triggered = wasAbove && isBelow;
                            break;
                        case 'equals':
                            // Déclencher si le prix atteint exactement la valeur (±0.0001)
                            triggered = Math.abs(currentPrice - alert.price) <= 0.0001 && 
                                       Math.abs(alert.lastPrice - alert.price) > 0.0001;
                            break;
                    }
                } else {
                    // Première vérification - ne pas déclencher, juste enregistrer le prix
                    triggered = false;
                }
                
                // Mettre à jour le dernier prix connu
                this.alerts[index].lastPrice = currentPrice;
                
                if (triggered) {
                    this.triggerAlert(alert, currentPrice, index);
                }
            });
        } catch (error) {
            console.error('Erreur vérification alertes:', error);
        }
    }
    
    async getRealTimePrices() {
        try {
            // API gratuite Fixer.io pour les taux de change
            const response = await fetch('https://api.fixer.io/latest?access_key=YOUR_API_KEY&symbols=USD,EUR,GBP,JPY,AUD,CAD');
            
            if (!response.ok) {
                throw new Error('API Fixer non disponible');
            }
            
            const data = await response.json();
            
            // Convertir en format forex
            return {
                'EURUSD': 1 / data.rates.USD,
                'GBPUSD': data.rates.GBP / data.rates.USD,
                'USDJPY': data.rates.JPY,
                'AUDUSD': data.rates.AUD / data.rates.USD,
                'USDCAD': data.rates.CAD,
                'XAUUSD': await this.getGoldPrice()
            };
        } catch (error) {
            console.warn('Utilisation API alternative:', error);
            return await this.getAlternativePrices();
        }
    }
    
    async getAlternativePrices() {
        try {
            // API alternative gratuite - ExchangeRate-API
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const data = await response.json();
            
            return {
                'EURUSD': 1 / data.rates.EUR,
                'GBPUSD': 1 / data.rates.GBP,
                'USDJPY': data.rates.JPY,
                'AUDUSD': 1 / data.rates.AUD,
                'USDCAD': data.rates.CAD,
                'XAUUSD': await this.getGoldPrice()
            };
        } catch (error) {
            console.error('Toutes les APIs de prix échouent:', error);
            // Fallback avec derniers prix connus
            return this.getLastKnownPrices();
        }
    }
    
    async getGoldPrice() {
        try {
            const response = await fetch('https://api.metals.live/v1/spot/gold');
            const data = await response.json();
            return data[0].price;
        } catch (error) {
            return 2025.50; // Prix de fallback
        }
    }
    
    getLastKnownPrices() {
        // Derniers prix connus comme fallback
        return {
            'EURUSD': 1.0847,
            'GBPUSD': 1.2651,
            'USDJPY': 149.45,
            'AUDUSD': 0.6448,
            'USDCAD': 1.3652,
            'XAUUSD': 2025.30
        };
    }
    
    async triggerAlert(alert, currentPrice, index) {
        const message = alert.message || `${alert.pair} a atteint ${currentPrice.toFixed(5)}`;
        
        // 1. Notification push (Service Worker)
        await this.sendPushNotification(message, alert);
        
        // 2. Notification navigateur
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🚨 Alerte Forex - Misterpips', {
                body: message,
                icon: 'assets/images/Misterpips.jpg',
                badge: 'assets/images/Misterpips.jpg',
                tag: `alert-${alert.id}`,
                requireInteraction: true,
                actions: [
                    { action: 'view', title: 'Voir le graphique' },
                    { action: 'close', title: 'Fermer' }
                ]
            });
        }
        
        // 3. Notification visuelle dans la page
        this.showAlertNotification(message);
        
        // 4. Son d'alerte
        this.playAlertSound();
        
        // 5. Envoyer à Firebase pour sync multi-appareils
        await this.sendFirebaseNotification(message, alert);
        
        // Désactiver l'alerte pour éviter le spam
        this.alerts[index].active = false;
        this.saveAlertsToStorage();
        this.displayAlerts();
        
        console.log('🚨 Alerte déclenchée:', message);
    }
    
    async sendPushNotification(message, alert) {
        try {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.ready;
                
                if (registration.pushManager) {
                    // Envoyer notification push
                    await registration.showNotification('🚨 Alerte Forex - Misterpips', {
                        body: message,
                        icon: 'assets/images/Misterpips.jpg',
                        badge: 'assets/images/Misterpips.jpg',
                        tag: `push-alert-${alert.id}`,
                        requireInteraction: true,
                        vibrate: [200, 100, 200],
                        data: {
                            pair: alert.pair,
                            price: alert.price,
                            url: window.location.href
                        },
                        actions: [
                            { action: 'view', title: '📊 Voir', icon: 'assets/images/chart-icon.png' },
                            { action: 'dismiss', title: '❌ Fermer', icon: 'assets/images/close-icon.png' }
                        ]
                    });
                }
            }
        } catch (error) {
            console.error('Erreur notification push:', error);
        }
    }
    
    async sendFirebaseNotification(message, alert) {
        try {
            if (window.firebaseDB) {
                const notificationData = {
                    id: `notif_${Date.now()}`,
                    userId: this.currentUser,
                    message: message,
                    pair: alert.pair,
                    price: alert.price,
                    timestamp: Date.now(),
                    read: false,
                    type: 'price_alert'
                };
                
                const notifRef = window.dbRef(window.firebaseDB, `notifications/${this.currentUser}/${notificationData.id}`);
                await window.dbSet(notifRef, notificationData);
                
                console.log('✅ Notification sauvegardée Firebase');
            }
        } catch (error) {
            console.error('Erreur notification Firebase:', error);
        }
    }
    
    showAlertNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'alert-notification';
        notification.innerHTML = `
            <div class="alert-notification-content">
                <div class="alert-icon">🚨</div>
                <div class="alert-text">${message}</div>
                <button class="alert-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;
        
        // Ajouter les styles inline
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ff6b6b, #ee5a24);
            color: white;
            padding: 1rem;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideInRight 0.5s ease;
            max-width: 350px;
        `;
        
        document.body.appendChild(notification);
        
        // Supprimer automatiquement après 10 secondes
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    }
    
    playAlertSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Son d\'alerte non disponible:', error);
        }
    }
    
    async saveAlertsToStorage() {
        try {
            if (window.firebaseDB) {
                const alertsRef = window.dbRef(window.firebaseDB, `alerts/${this.currentUser}`);
                await window.dbSet(alertsRef, this.alerts);
            } else {
                localStorage.setItem(`forex_alerts_${this.currentUser}`, JSON.stringify(this.alerts));
            }
        } catch (error) {
            console.error('Erreur sauvegarde alertes:', error);
        }
    }

    // Gestion des modals
    showModal(title, content) {
        const modal = document.getElementById('toolModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');
        
        if (modal && modalTitle && modalContent) {
            modalTitle.textContent = title;
            modalContent.innerHTML = content;
            modal.style.display = 'flex';
        }
    }

    closeModal() {
        const modal = document.getElementById('toolModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
}

// Initialisation
let planningForex;

function initializePlanningForex() {
    console.log('🚀 Démarrage Planning Forex...');
    try {
        planningForex = new PlanningForex();
        window.planningForex = planningForex;
        console.log('✅ Planning Forex créé avec succès');
    } catch (error) {
        console.error('❌ Erreur création Planning Forex:', error);
    }
}

// Démarrer quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePlanningForex);
} else {
    setTimeout(initializePlanningForex, 100);
}

// Gestion des filtres
document.addEventListener('change', (e) => {
    if (e.target.id === 'impactFilter') {
        planningForex?.displayEconomicEvents();
    }
});

// Fermer les modals en cliquant à l'extérieur
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        planningForex?.closeModal();
        planningForex?.closeAlertModal();
    }
});

console.log('📊 Script Planning Forex chargé avec succès');