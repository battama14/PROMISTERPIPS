// Composant Calendrier - Ultra Optimisé
class CalendarVIP {
    constructor() {
        this.currentDate = new Date();
        this.trades = [];
        this.container = null;
        this.init();
    }

    init() {
        this.findContainer();
        this.setupControls();
        this.render();
        console.log('✅ Calendrier VIP initialisé');
    }

    findContainer() {
        this.container = document.getElementById('calendarGrid');
        if (!this.container) {
            console.log('❌ Container calendarGrid non trouvé');
            return;
        }
    }

    setupControls() {
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');
        const monthDisplay = document.getElementById('monthYear');
        
        if (prevBtn) prevBtn.onclick = () => this.previousMonth();
        if (nextBtn) nextBtn.onclick = () => this.nextMonth();
        
        this.updateMonthDisplay();
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.updateMonthDisplay();
        this.render();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.updateMonthDisplay();
        this.render();
    }

    updateMonthDisplay() {
        const monthDisplay = document.getElementById('monthYear');
        if (!monthDisplay) return;
        
        const months = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];
        
        const monthName = months[this.currentDate.getMonth()];
        const year = this.currentDate.getFullYear();
        monthDisplay.textContent = `${monthName} ${year}`;
    }

    render() {
        if (!this.container) return;
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        let html = '';
        
        // En-têtes des jours
        const dayHeaders = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        dayHeaders.forEach(day => {
            html += `<div class="calendar-header">${day}</div>`;
        });
        
        // Jours vides au début
        for (let i = 0; i < firstDay; i++) {
            html += '<div class="calendar-day empty"></div>';
        }
        
        // Jours du mois
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = this.isToday(year, month, day);
            const dayTrades = this.getTradesForDate(dateStr);
            
            html += `
                <div class="calendar-day ${isToday ? 'today' : ''}" data-date="${dateStr}" onclick="window.calendar.selectDay('${dateStr}')">
                    <div class="day-number">${day}</div>
                    ${this.renderDayTrades(dayTrades)}
                </div>
            `;
        }
        
        this.container.innerHTML = html;
    }

    isToday(year, month, day) {
        const today = new Date();
        return today.getFullYear() === year && 
               today.getMonth() === month && 
               today.getDate() === day;
    }

    getTradesForDate(dateStr) {
        return this.trades.filter(trade => {
            const tradeDate = new Date(trade.date);
            const tradeDateStr = `${tradeDate.getFullYear()}-${String(tradeDate.getMonth() + 1).padStart(2, '0')}-${String(tradeDate.getDate()).padStart(2, '0')}`;
            return tradeDateStr === dateStr;
        });
    }

    renderDayTrades(dayTrades) {
        if (dayTrades.length === 0) return '';
        
        const totalPnL = dayTrades.reduce((sum, trade) => sum + (parseFloat(trade.pnl) || 0), 0);
        const tradesCount = dayTrades.length;
        
        return `
            <div class="day-trades">
                <div class="trades-count">${tradesCount}T</div>
                <div class="trades-pnl ${totalPnL >= 0 ? 'positive' : 'negative'}">$${totalPnL.toFixed(0)}</div>
            </div>
        `;
    }

    selectDay(dateStr) {
        console.log('📅 Jour sélectionné:', dateStr);
        const dayTrades = this.getTradesForDate(dateStr);
        if (dayTrades.length > 0) {
            this.showDayTrades(dateStr, dayTrades);
        }
    }

    showDayTrades(dateStr, trades) {
        // Afficher les trades du jour dans un modal ou une section
        console.log(`Trades du ${dateStr}:`, trades);
    }

    loadTrades(trades) {
        this.trades = trades || [];
        this.render();
    }
}

// Initialisation
window.CalendarVIP = CalendarVIP;