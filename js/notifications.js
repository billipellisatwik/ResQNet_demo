class NotificationCenter {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.init();
    }

    init() {
        // Mock load API
        this.loadNotifications();
    }

    async loadNotifications() {
        // Mock API response
        this.notifications = [
            { id: 1, type: 'critical', category: 'Weather', message: 'Heavy rainfall alert in Zone A', read: false, time: new Date().toISOString() },
            { id: 2, type: 'info', category: 'System', message: 'System maintenance scheduled', read: true, time: new Date().toISOString() }
        ];
        this.updateBadge();
        this.render();
    }

    addNotification(notif) {
        this.notifications.unshift(notif);
        if (!notif.read) this.unreadCount++;
        this.updateBadge();
        this.render();
        
        if (notif.type === 'critical') {
            window.ResQNotify.playSound('critical');
            window.ResQNotify.toast({ type: 'critical', title: notif.category, message: notif.message, duration: 8000 });
        }
    }

    markAsRead(id) {
        const notif = this.notifications.find(n => n.id === id);
        if (notif && !notif.read) {
            notif.read = true;
            this.unreadCount--;
            this.updateBadge();
            this.render();
        }
    }

    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.unreadCount = 0;
        this.updateBadge();
        this.render();
    }

    updateBadge() {
        const badge = document.getElementById('notif-badge');
        if (badge) {
            badge.innerText = this.unreadCount;
            badge.style.display = this.unreadCount > 0 ? 'inline-block' : 'none';
        }
    }

    render() {
        const container = document.getElementById('notif-list');
        if (!container) return;
        
        container.innerHTML = '';
        this.notifications.forEach(n => {
            const el = document.createElement('div');
            el.className = `notif-item ${n.read ? 'read' : 'unread'}`;
            el.innerHTML = `
                <div class="notif-icon">${window.ResQNotify.getIcon(n.type)}</div>
                <div class="notif-content">
                    <div class="notif-title">${n.category}</div>
                    <div class="notif-message">${n.message}</div>
                    <div class="notif-time">${new Date(n.time).toLocaleTimeString()}</div>
                </div>
            `;
            el.onclick = () => this.markAsRead(n.id);
            container.appendChild(el);
        });
    }
}


window.ResQNotificationCenter = new NotificationCenter();
