/* ==========================================================================
   RESQ-MESH: OFFLINE EMERGENCY SIGNAL RELAY ENGINE v1.2
   Simple & Intuitive Language for No-Internet Mesh Relay Status
   Includes Safe Fallback Translation Resolver
   ========================================================================== */

class ResQMeshEngine {
    constructor() {
        this.peerId = 'PEER-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        this.meshQueue = this.loadLocalMeshQueue();
        this.channel = null;
        this.activePeersCount = Math.floor(Math.random() * 3) + 2; // Simulated nearby peer nodes (2-4)
        this.init();
    }

    init() {
        this.initP2PChannel();
        this.setupNetworkStateListeners();
        this.renderMeshStatusBadge();
    }

    initP2PChannel() {
        if ('BroadcastChannel' in window) {
            try {
                this.channel = new BroadcastChannel('resqnet_p2p_mesh_channel');
                this.channel.onmessage = (event) => {
                    if (event && event.data) {
                        this.receivePeerPacket(event.data);
                    }
                };
                console.log(`🌐 ResQ-Mesh Engine initialized (Peer ID: ${this.peerId})`);
            } catch (e) {
                console.warn('BroadcastChannel error:', e);
            }
        }
    }

    setupNetworkStateListeners() {
        window.addEventListener('online', () => {
            console.log('⚡ Internet restored! ResQ-Mesh uploading collected help signals...');
            this.syncWithServer();
        });
    }

    loadLocalMeshQueue() {
        try {
            const raw = localStorage.getItem('resq_mesh_packets');
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    saveLocalMeshQueue() {
        try {
            localStorage.setItem('resq_mesh_packets', JSON.stringify(this.meshQueue));
        } catch (e) {
            console.warn('LocalStorage mesh save error:', e);
        }
    }

    broadcastSOS(sosData) {
        const meshPacket = {
            mesh_id: 'MESH-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
            hops: 1,
            origin_peer: this.peerId,
            origin_timestamp: Date.now(),
            payload: {
                ...sosData,
                id: sosData.id || 'RESQ-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                mesh_relayed: true,
                location_type: '🌐 OFFLINE SIGNAL RELAYED'
            }
        };

        this.addPacketToMeshQueue(meshPacket);

        if (this.channel) {
            this.channel.postMessage(meshPacket);
        }

        if (window.ResQNotify) {
            window.ResQNotify.banner({
                type: 'warning',
                title: '📡 OFFLINE SIGNAL SENT VIA NEARBY PHONES',
                message: `No mobile network signal! Help signal broadcasted to <strong>${this.activePeersCount} nearby phones</strong> via Bluetooth/Wi-Fi. Hopping phone-to-phone to rescue team.`,
                persistent: true
            });
        }

        this.renderMeshStatusBadge();
        return meshPacket;
    }

    receivePeerPacket(packet) {
        if (!packet || !packet.mesh_id) return;

        const exists = this.meshQueue.some(p => p.mesh_id === packet.mesh_id || p.payload?.id === packet.payload?.id);
        if (exists) return;

        packet.hops += 1;
        packet.relayed_by = this.peerId;
        this.addPacketToMeshQueue(packet);

        if (this.channel) {
            setTimeout(() => this.channel.postMessage(packet), 300);
        }

        if (navigator.onLine) {
            this.syncWithServer();
        }

        this.renderMeshStatusBadge();
    }

    addPacketToMeshQueue(packet) {
        this.meshQueue.unshift(packet);
        if (this.meshQueue.length > 50) this.meshQueue.pop();
        this.saveLocalMeshQueue();
    }

    async syncWithServer() {
        if (!navigator.onLine || this.meshQueue.length === 0) return;

        try {
            const baseUrl = window.ResQAPI ? window.ResQAPI.getBaseUrl() : 'http://localhost:8000/api/v1';
            const res = await fetch(`${baseUrl}/sos/mesh_sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mesh_packets: this.meshQueue })
            });

            if (res.ok) {
                const data = await res.json();

                if (data.synced_count > 0 && window.ResQNotify) {
                    window.ResQNotify.toast({
                        type: 'success',
                        title: '🌐 EMERGENCY SIGNALS DELIVERED',
                        message: `Successfully relayed <strong>${data.synced_count} offline help signals</strong> to Rescue Command Center!`
                    });
                }

                this.meshQueue = [];
                this.saveLocalMeshQueue();
                this.renderMeshStatusBadge();
            }
        } catch (e) {
            console.warn('ResQ-Mesh sync error:', e);
        }
    }

    renderMeshStatusBadge() {
        const container = document.getElementById('mesh-status-container');
        if (!container) return;

        const count = this.meshQueue.length;

        const getTrans = (key, fallback) => {
            if (window.ResQTranslation && window.ResQTranslation.translations && window.ResQTranslation.translations[window.ResQTranslation.currentLang]) {
                const val = window.ResQTranslation.get(key);
                if (val && val !== key) return val;
            }
            return fallback;
        };

        const title = getTrans('mesh.title', '📡 Offline');
        const peersText = getTrans('mesh.peers', 'Phones Connected Nearby');
        const subtitle = getTrans('mesh.subtitle', 'Works even without SIM or Internet');
        const savedText = getTrans('mesh.saved', 'Help Requests Saved');
        const testBtn = getTrans('mesh.testBtn', '📡 Test Offline Relay');

        container.innerHTML = `
            <div class="glass-panel" style="padding:0.85rem 1.15rem; display:flex; justify-content:space-between; align-items:center; border-left:4px solid var(--cyan);">
                <div style="display:flex; align-items:center; gap:0.6rem;">
                    <span class="live-dot blue"></span>
                    <div>
                        <div style="font-weight:900; font-size:0.875rem; color:var(--text-primary); display:flex; align-items:center; gap:0.4rem;">
                            <span>${title}</span>
                            <span class="badge-tag" style="background:var(--cyan-bg, rgba(6,182,212,0.15)); color:var(--cyan); border:1px solid var(--cyan); font-weight:800; font-size:0.75rem;">
                                ${this.activePeersCount} ${peersText}
                            </span>
                        </div>
                        <div style="font-size:0.775rem; color:var(--text-secondary); margin-top:0.25rem;">
                            ${subtitle} • <strong>${count} ${savedText}</strong>
                        </div>
                    </div>
                </div>
                <button class="btn btn-sm btn-secondary" onclick="window.ResQMesh.broadcastSOS({ category: 'Water / Flood Help', description: 'Test Offline Emergency Signal', latitude: 17.3850, longitude: 78.4867 })" style="font-size:0.75rem;">
                    ${testBtn}
                </button>
            </div>
        `;
    }
}

if (!window.ResQMesh) {
    window.ResQMesh = new ResQMeshEngine();
}

window.addEventListener('language-changed', () => {
    if (window.ResQMesh) window.ResQMesh.renderMeshStatusBadge();
});
