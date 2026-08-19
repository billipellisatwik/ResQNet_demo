class WebSocketClient {
    constructor(clientType, clientId) {
        this.clientType = clientType;
        this.clientId = clientId || 'client_' + Math.random().toString(36).substr(2, 9);
        
        let host = window.location.host;
        if (!host || host.includes('file:') || host.includes('127.0.0.1:5500') || host.includes('localhost:5500')) {
            host = 'localhost:8000';
        }
        
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        this.url = `${protocol}//${host}/ws/${this.clientType}/${this.clientId}`;
        
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectDelay = 30000;
        this.messageQueue = [];
        this.listeners = new Map();
        
        this.connect();
    }

    connect() {
        try {
            this.ws = new WebSocket(this.url);
            
            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
                this.flushQueue();
                this.dispatch('connection', { status: 'connected' });
            };
            
            this.ws.onclose = (e) => {
                console.log('WebSocket disconnected', e);
                this.dispatch('connection', { status: 'disconnected' });
                this.scheduleReconnect();
            };
            
            this.ws.onerror = (err) => {
                console.error('WebSocket error', err);
            };
            
            this.ws.onmessage = (msg) => {
                try {
                    const data = JSON.parse(msg.data);
                    this.dispatch(data.type, data.payload);
                } catch (e) {
                    console.error('Failed to parse WebSocket message', e);
                }
            };
        } catch(e) {
            this.scheduleReconnect();
        }
    }

    scheduleReconnect() {
        let delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), this.maxReconnectDelay);
        this.reconnectAttempts++;
        console.log(`Reconnecting in ${delay}ms...`);

        setTimeout(() => this.connect(), delay);
    }

    send(type, payload) {
        const msg = JSON.stringify({ type, payload });
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(msg);
        } else {
            this.messageQueue.push(msg);
        }
    }

    flushQueue() {
        while (this.messageQueue.length > 0 && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(this.messageQueue.shift());
        }
    }

    on(type, callback) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type).push(callback);
    }
    
    off(type, callback) {
        if (!this.listeners.has(type)) return;
        const cbs = this.listeners.get(type);
        this.listeners.set(type, cbs.filter(cb => cb !== callback));
    }

    dispatch(type, payload) {
        if (this.listeners.has(type)) {
            this.listeners.get(type).forEach(cb => cb(payload));
        }
    }
}

window.ResQWebSocket = WebSocketClient;
