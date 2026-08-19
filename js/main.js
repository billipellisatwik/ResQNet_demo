class ResQNotify {
    static init() {
        if (!document.getElementById('resq-toast-container')) {
            const container = document.createElement('div');
            container.id = 'resq-toast-container';
            container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; pointer-events: none;';
            document.body.appendChild(container);
        }
        
        if (!document.getElementById('resq-banner-container')) {
            const container = document.createElement('div');
            container.id = 'resq-banner-container';
            container.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; z-index: 9998;';
            document.body.appendChild(container);
        }
    }

    static getIcon(type) {
        const icons = {
            critical: '🚨',
            warning: '⚠️',
            success: '✅',
            info: 'ℹ️',
            danger: '🛑'
        };
        return icons[type] || '🔔';
    }

    static getColor(type) {
        const colors = {
            critical: '#ff3333',
            warning: '#ffaa00',
            success: '#00cc66',
            info: '#3399ff',
            danger: '#dc3545'
        };
        return colors[type] || '#333';
    }

    static playSound(type) {
        if (type !== 'critical') return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'square';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
            
            setTimeout(() => {
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.type = 'square';
                osc2.frequency.setValueAtTime(880, ctx.currentTime);
                osc2.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
                gain2.gain.setValueAtTime(0.1, ctx.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                osc2.start();
                osc2.stop(ctx.currentTime + 0.1);
            }, 150);
        } catch(e) {
            console.error('Audio play failed', e);
        }
    }

    static toast(options = {}) {
        this.init();
        const { type = 'info', title = '', message = '', duration = 5000, action, sound } = options;
        
        if (sound) this.playSound(type);

        const container = document.getElementById('resq-toast-container');
        if (container.children.length >= 5) {
            container.removeChild(container.firstChild);
        }

        const toast = document.createElement('div');
        const color = this.getColor(type);
        const icon = this.getIcon(type);

        toast.style.cssText = `
            background: rgba(30, 30, 30, 0.95);
            backdrop-filter: blur(10px);
            border-left: 4px solid ${color};
            color: #fff;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: flex-start;
            gap: 12px;
            width: 350px;
            pointer-events: auto;
            transform: translateX(120%);
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease;
            position: relative;
            overflow: hidden;
            ${type === 'critical' ? 'box-shadow: 0 0 20px rgba(255, 51, 51, 0.4);' : ''}
        `;

        let actionHtml = '';
        if (action) {
            actionHtml = `<button class="toast-action" style="margin-top: 8px; background: ${color}; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;">${action.label}</button>`;
        }

        toast.innerHTML = `
            <div style="font-size: 24px;">${icon}</div>
            <div style="flex-grow: 1;">
                <div style="font-weight: bold; margin-bottom: 4px; color: ${color};">${title}</div>
                <div style="font-size: 14px; color: #ddd; line-height: 1.4;">${message}</div>
                ${actionHtml}
            </div>
            <button class="toast-close" style="background: none; border: none; color: #999; cursor: pointer; font-size: 16px; padding: 0;">✕</button>
            <div style="position: absolute; bottom: 0; left: 0; height: 3px; background: ${color}; width: 100%; transform-origin: left; animation: resq-progress ${duration}ms linear forwards;"></div>
        `;

        if (!document.getElementById('resq-keyframes')) {
            const style = document.createElement('style');
            style.id = 'resq-keyframes';
            style.textContent = `
                @keyframes resq-progress { from { transform: scaleX(1); } to { transform: scaleX(0); } }
                @keyframes resq-pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
                @keyframes resq-shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-5px); } 40%, 80% { transform: translateX(5px); } }
            `;
            document.head.appendChild(style);
        }

        container.appendChild(toast);

        // trigger reflow
        void toast.offsetWidth;
        toast.style.transform = 'translateX(0)';

        const closeBtn = toast.querySelector('.toast-close');
        const actionBtn = toast.querySelector('.toast-action');

        let timeout;
        const dismiss = () => {
            toast.style.transform = 'translateX(120%)';
            toast.style.opacity = '0';
            setTimeout(() => { if (toast.parentNode) toast.remove(); }, 300);
            clearTimeout(timeout);
        };

        closeBtn.onclick = dismiss;
        if (actionBtn) {
            actionBtn.onclick = () => {
                action.callback();
                dismiss();
            };
        }

        timeout = setTimeout(dismiss, duration);
    }

    static async confirm(options = {}) {
        return new Promise((resolve) => {
            const { type = 'info', title = '', message = '', confirmText = 'Confirm', cancelText = 'Cancel', icon, details } = options;
            const color = this.getColor(type);
            const defaultIcon = this.getIcon(type);

            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.6);
                backdrop-filter: blur(4px);
                z-index: 10000;
                display: flex; justify-content: center; align-items: center;
                opacity: 0; transition: opacity 0.2s ease;
            `;

            let detailsHtml = '';
            if (details) {
                detailsHtml = `<pre style="background: rgba(0,0,0,0.1); padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px; margin-top: 15px; text-align: left; overflow-x: auto;">${details}</pre>`;
            }

            const modal = document.createElement('div');
            modal.style.cssText = `
                background: #fff;
                color: #333;
                padding: 30px;
                border-radius: 12px;
                width: 90%; max-width: 400px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                transform: scale(0.8); transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                border-top: 6px solid ${color};
            `;
            
            // Check for dark mode to style modal
            if (document.documentElement.getAttribute('data-theme') === 'dark' || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                modal.style.background = '#222';
                modal.style.color = '#eee';
            }

            modal.innerHTML = `
                <div style="font-size: 48px; margin-bottom: 15px;">${icon || defaultIcon}</div>
                <h3 style="margin: 0 0 10px 0; font-size: 20px; color: ${color};">${title}</h3>
                <p style="margin: 0; line-height: 1.5; color: inherit; opacity: 0.8;">${message}</p>
                ${detailsHtml}
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 25px;">
                    <button id="resq-confirm-cancel" style="flex: 1; padding: 10px; background: transparent; border: 1px solid #ccc; color: inherit; border-radius: 6px; cursor: pointer; font-weight: 500; transition: all 0.2s;">${cancelText}</button>
                    <button id="resq-confirm-ok" style="flex: 1; padding: 10px; background: ${color}; border: none; color: white; border-radius: 6px; cursor: pointer; font-weight: 500; transition: all 0.2s;">${confirmText}</button>
                </div>
            `;

            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            document.body.style.overflow = 'hidden';

            // reflow
            void overlay.offsetWidth;
            overlay.style.opacity = '1';
            modal.style.transform = 'scale(1)';

            const close = (result) => {
                overlay.style.opacity = '0';
                modal.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    if (overlay.parentNode) overlay.remove();
                    document.body.style.overflow = '';
                    resolve(result);
                }, 200);
                document.removeEventListener('keydown', handleKey);
            };

            const btnCancel = modal.querySelector('#resq-confirm-cancel');
            const btnOk = modal.querySelector('#resq-confirm-ok');

            btnCancel.onclick = () => close(false);
            btnOk.onclick = () => close(true);

            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    modal.style.animation = 'resq-shake 0.4s';
                    setTimeout(() => modal.style.animation = '', 400);
                }
            };

            const handleKey = (e) => {
                if (e.key === 'Escape') close(false);
                if (e.key === 'Enter') close(true);
            };
            document.addEventListener('keydown', handleKey);
            btnOk.focus();
        });
    }

    static async sosConfirm(data) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: linear-gradient(135deg, rgba(220, 53, 69, 0.95), rgba(139, 0, 0, 0.95));
                backdrop-filter: blur(10px);
                z-index: 100000;
                display: flex; flex-direction: column; justify-content: center; align-items: center;
                color: white;
                opacity: 0; transition: opacity 0.3s ease;
                padding: 20px;
                text-align: center;
            `;

            overlay.innerHTML = `
                <div style="font-size: 80px; margin-bottom: 20px; animation: resq-pulse 1s infinite;">🚨</div>
                <h1 style="margin: 0 0 10px 0; font-size: 32px; text-transform: uppercase; letter-spacing: 2px;">Emergency SOS</h1>
                <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 12px; width: 100%; max-width: 400px; margin-bottom: 30px;">
                    <div style="font-weight: bold; font-size: 20px; color: #ffcccc; margin-bottom: 10px;">${data.category}</div>
                    <div style="margin-bottom: 15px; font-size: 16px;">${data.description || 'No description provided'}</div>
                    <div style="font-family: monospace; font-size: 14px; color: #aaa;">
                        Loc: ${data.location.lat.toFixed(5)}, ${data.location.lng.toFixed(5)}<br>
                        Accuracy: ±${data.location.accuracy.toFixed(1)}m
                    </div>
                </div>
                
                <button id="resq-sos-send" disabled style="background: #fff; color: #dc3545; border: none; padding: 18px 40px; font-size: 20px; font-weight: bold; border-radius: 50px; cursor: not-allowed; opacity: 0.5; margin-bottom: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); transition: all 0.2s; width: 100%; max-width: 400px;">
                    SENDING IN 3...
                </button>
                <button id="resq-sos-cancel" style="background: transparent; color: white; border: 2px solid rgba(255,255,255,0.5); padding: 12px 30px; font-size: 16px; font-weight: bold; border-radius: 50px; cursor: pointer; transition: all 0.2s; width: 100%; max-width: 400px;">
                    CANCEL
                </button>
            `;

            document.body.appendChild(overlay);
            
            // reflow
            void overlay.offsetWidth;
            overlay.style.opacity = '1';

            const btnSend = overlay.querySelector('#resq-sos-send');
            const btnCancel = overlay.querySelector('#resq-sos-cancel');

            let countdown = 3;
            let timer;

            const close = (result) => {
                clearInterval(timer);
                overlay.style.opacity = '0';
                setTimeout(() => {
                    if (overlay.parentNode) overlay.remove();
                    resolve(result);
                }, 300);
            };

            btnCancel.onclick = () => close(false);
            btnSend.onclick = () => close(true);

            timer = setInterval(() => {
                countdown--;
                if (countdown > 0) {
                    btnSend.innerText = `SENDING IN ${countdown}...`;
                } else {
                    clearInterval(timer);
                    btnSend.innerText = 'CONFIRM EMERGENCY';
                    btnSend.disabled = false;
                    btnSend.style.cursor = 'pointer';
                    btnSend.style.opacity = '1';
                    btnSend.style.boxShadow = '0 0 30px rgba(255, 255, 255, 0.5)';
                }
            }, 1000);
        });
    }

    static banner(options = {}) {
        this.init();
        const { type = 'info', title = '', message = '', action, persistent = false } = options;
        const color = this.getColor(type);
        const icon = this.getIcon(type);

        const container = document.getElementById('resq-banner-container');
        const banner = document.createElement('div');
        
        banner.style.cssText = `
            background: #222;
            color: #fff;
            padding: 12px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-left: 5px solid ${color};
            transform: translateY(-100%);
            transition: transform 0.3s ease;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            ${type === 'critical' ? 'animation: resq-border-pulse 1.5s infinite;' : ''}
        `;

        if (type === 'critical' && !document.getElementById('resq-banner-pulse')) {
            const style = document.createElement('style');
            style.id = 'resq-banner-pulse';
            style.textContent = `@keyframes resq-border-pulse { 0% { border-left-color: #ff3333; } 50% { border-left-color: #880000; } 100% { border-left-color: #ff3333; } }`;
            document.head.appendChild(style);
        }

        let actionBtn = '';
        if (action) {
            actionBtn = `<button class="banner-action" style="margin-right: 10px; background: ${color}; color: #fff; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 13px;">${action.label}</button>`;
        }

        banner.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <span style="font-size: 20px;">${icon}</span>
                <div>
                    <strong style="color: ${color};">${title}</strong>: <span style="opacity: 0.9;">${message}</span>
                </div>
            </div>
            <div style="display: flex; align-items: center;">
                ${actionBtn}
                <button class="banner-close" style="background: none; border: none; color: #999; cursor: pointer; font-size: 18px;">✕</button>
            </div>
        `;

        container.appendChild(banner);
        
        void banner.offsetWidth;
        banner.style.transform = 'translateY(0)';

        const dismiss = () => {
            banner.style.transform = 'translateY(-100%)';
            setTimeout(() => { if (banner.parentNode) banner.remove(); }, 300);
        };

        banner.querySelector('.banner-close').onclick = dismiss;
        if (actionBtn) {
            banner.querySelector('.banner-action').onclick = () => {
                action.callback();
                dismiss();
            };
        }

        if (!persistent) {
            setTimeout(dismiss, 8000);
        }
    }

    static status(options = {}) {
        const { title, message, icon, progress } = options;
        this.toast({
            type: 'info',
            title: title,
            message: message + (progress !== undefined ? `<br><progress value="${progress}" max="100" style="width: 100%; margin-top: 5px;"></progress>` : ''),
            duration: 3000
        });
    }
}


window.ResQNotify = ResQNotify;

// Real API Client connecting to FastAPI backend
window.ResQAPI = {
    getBaseUrl: () => {
        let host = window.location.host;
        if (!host || host.includes('file:') || host.includes('127.0.0.1:5500') || host.includes('localhost:5500')) {
            return 'http://localhost:8000/api/v1';
        }
        return '/api/v1';
    },

    request: async (endpoint, options = {}) => {
        const baseUrl = window.ResQAPI.getBaseUrl();
        const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
        
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };
        
        const token = localStorage.getItem('resqnet_access_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const config = {
                method: options.method || (options.body ? 'POST' : 'GET'),
                headers,
                ...(options.body ? { body: typeof options.body === 'string' ? options.body : JSON.stringify(options.body) } : {})
            };

            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.detail || data.message || `HTTP ${response.status}`);
            }
            
            return { success: true, data: data.data !== undefined ? data.data : data, raw: data };
        } catch (error) {
            console.warn(`API Error [${endpoint}]:`, error);
            return { success: false, error: error.message };
        }
    },

    createSOS: async (sosData) => {
        if (!navigator.onLine || (window.ResQOffline && window.ResQOffline.isOffline)) {
            const offlineId = 'OFFLINE-RESQ-' + Math.random().toString(36).substr(2, 8).toUpperCase();
            const record = { id: offlineId, ...sosData, status: 'offline_queued', timestamp: new Date().toISOString() };
            if (window.ResQOffline) {
                await window.ResQOffline.saveSOS(record);
            }
            return { success: true, data: record, isOffline: true };
        }

        const res = await window.ResQAPI.request('/sos', { method: 'POST', body: sosData });
        if (!res.success && res.error && (res.error.includes('Failed to fetch') || res.error.includes('NetworkError') || res.error.includes('HTTP 504') || res.error.includes('HTTP 502'))) {
            const offlineId = 'OFFLINE-RESQ-' + Math.random().toString(36).substr(2, 8).toUpperCase();
            const record = { id: offlineId, ...sosData, status: 'offline_queued', timestamp: new Date().toISOString() };
            if (window.ResQOffline) {
                await window.ResQOffline.saveSOS(record);
            }
            return { success: true, data: record, isOffline: true };
        }
        return res;
    },
    getSOSList: () => window.ResQAPI.request('/sos'),
    getSOS: (id) => window.ResQAPI.request(`/sos/${id}`),
    updateSOSStatus: (id, status, assignedUnit) => window.ResQAPI.request(`/sos/${id}/status`, { method: 'PUT', body: { status, assigned_unit: assignedUnit } }),
    updateSOSLocation: (id, locData) => window.ResQAPI.request(`/sos/${id}/location`, { method: 'POST', body: locData }),
    markTeamReached: (id) => window.ResQAPI.request(`/sos/${id}/reached`, { method: 'POST' }),
    markPersonSafe: (id) => window.ResQAPI.request(`/sos/${id}/safe`, { method: 'POST' }),
    reportRescuedByCitizen: (id) => window.ResQAPI.request(`/sos/${id}/report_rescued`, { method: 'POST' }),
    confirmRescuedByOthers: (id) => window.ResQAPI.request(`/sos/${id}/confirm_rescued_by_others`, { method: 'POST' }),
    reportStillNeedsHelp: (id) => window.ResQAPI.request(`/sos/${id}/still_needs_help`, { method: 'POST' }),
    getRescueUnits: () => window.ResQAPI.request('/rescue'),
    dispatchUnit: (incidentId, unitId) => window.ResQAPI.request('/rescue/dispatch', { method: 'POST', body: { incident_id: incidentId, unit_id: unitId } }),
    getShelters: () => window.ResQAPI.request('/shelters'),
    getNearestShelters: (lat, lng) => window.ResQAPI.request('/shelters/nearest', { method: 'POST', body: { lat, lng } }),
    getWeather: (lat, lng) => window.ResQAPI.request(`/weather?lat=${lat || 17.385}&lng=${lng || 78.4867}`),
    getAnalytics: () => window.ResQAPI.request('/analytics/dashboard')
};


