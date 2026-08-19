/* ==========================================================================
   RESQNET AUTOMATED OFFLINE MANAGEMENT & INDEXEDDB AUTO-SYNC ENGINE v3.0
   Automatically detects network state, switches UI badges to OFFLINE (QUEUED),
   saves emergency actions locally to IndexedDB, and auto-syncs when online.
   ========================================================================== */

class OfflineEngine {
    constructor() {
        this.queue = [];
        this.db = null;
        this.isOffline = !navigator.onLine;
        this.init();
    }

    async init() {
        await this.initDB();
        this.setupNetworkStateListeners();
        this.startHeartbeat();
    }

    setupNetworkStateListeners() {
        window.addEventListener('online', () => {
            this.handleNetworkStatusChange(true);
        });
        
        window.addEventListener('offline', () => {
            this.handleNetworkStatusChange(false);
        });

        // Initial UI badge sync
        this.updateUIBadges(navigator.onLine);
    }

    handleNetworkStatusChange(isOnline) {
        this.isOffline = !isOnline;
        this.updateUIBadges(isOnline);

        if (isOnline) {
            window.ResQNotify.toast({
                type: 'success',
                title: 'Network Restored',
                message: 'Connected to ResQNet server. Auto-syncing offline emergency queue...'
            });
            this.sync();
        } else {
            window.ResQNotify.banner({
                type: 'warning',
                title: '📡 OFFLINE EMERGENCY MODE ACTIVE',
                message: 'No network connection detected. Emergency signals will be saved locally & auto-broadcasted when online.',
                persistent: true
            });
        }
    }

    updateUIBadges(isOnline) {
        const badges = document.querySelectorAll('#network-badge');
        badges.forEach(badge => {
            const text = badge.querySelector('#network-status-text') || badge;
            const dot = badge.querySelector('.live-dot');
            
            if (isOnline) {
                badge.style.background = 'var(--success-bg, rgba(0, 230, 118, 0.14))';
                badge.style.color = 'var(--success, #00E676)';
                badge.style.borderColor = 'var(--success, #00E676)';
                if (text) text.innerText = 'ONLINE';
                if (dot) dot.className = 'live-dot green';
            } else {
                badge.style.background = 'var(--danger-bg, rgba(255, 42, 84, 0.15))';
                badge.style.color = 'var(--danger, #FF2A54)';
                badge.style.borderColor = 'var(--danger, #FF2A54)';
                if (text) text.innerText = 'OFFLINE (QUEUED)';
                if (dot) dot.className = 'live-dot';
            }
        });
    }

    startHeartbeat() {
        // Ping backend every 12 seconds to detect quiet drops in cellular/server connectivity
        setInterval(async () => {
            if (!navigator.onLine) {
                if (!this.isOffline) this.handleNetworkStatusChange(false);
                return;
            }
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 4000);
                const baseUrl = window.ResQAPI ? window.ResQAPI.getBaseUrl() : 'http://localhost:8000/api/v1';
                const res = await fetch(`${baseUrl}/health`, { signal: controller.signal });
                clearTimeout(timeoutId);
                
                if (res.ok) {
                    if (this.isOffline) this.handleNetworkStatusChange(true);
                } else {
                    if (!this.isOffline) this.handleNetworkStatusChange(false);
                }
            } catch (err) {
                if (!this.isOffline) this.handleNetworkStatusChange(false);
            }
        }, 12000);
    }

    initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('ResQNetDB', 1);
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('sos_queue')) {
                    db.createObjectStore('sos_queue', { keyPath: 'id', autoIncrement: true });
                }
            };
            
            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve();
            };
            
            request.onerror = (e) => reject(e);
        });
    }

    async queueSOS(data) {
        if (!this.db) return;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['sos_queue'], 'readwrite');
            const store = transaction.objectStore('sos_queue');
            data.timestamp = new Date().getTime();
            data.offline_queued = true;
            const request = store.add(data);
            request.onsuccess = () => resolve();
            request.onerror = () => reject();
        });
    }

    async saveSOS(data) {
        return this.queueSOS(data);
    }

    async sync() {
        if (!this.db || !navigator.onLine || this.isOffline) return;
        
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['sos_queue'], 'readwrite');
            const store = transaction.objectStore('sos_queue');
            const request = store.getAll();
            
            request.onsuccess = async () => {
                const items = request.result;
                if (items.length > 0) {
                    console.log('⚡ Auto-syncing offline emergency queue to server:', items);
                    let count = 0;
                    for (const item of items) {
                        delete item.id;
                        delete item.offline_queued;
                        const res = await window.ResQAPI.createSOS(item);
                        if (res.success) count++;
                    }
                    store.clear();
                    window.ResQNotify.toast({
                        type: 'success',
                        title: 'Offline Sync Complete',
                        message: `Successfully uploaded ${count} emergency SOS signal(s) to Command Center!`
                    });
                }
                resolve();
            };
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.ResQOffline) window.ResQOffline = new OfflineEngine();
    });
} else {
    if (!window.ResQOffline) window.ResQOffline = new OfflineEngine();
}
