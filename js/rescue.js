/* ==========================================================================
   RESQNET RESCUE UNITS MANAGEMENT CONTROLLER v5.1
   100% Dynamic Multilingual i18n Translation Support
   ========================================================================== */

class RescueUnitsManager {
    constructor() {
        this.units = [];
        this.init();
    }

    async init() {
        await this.loadUnits();

        window.addEventListener('language-changed', () => {
            this.renderTable(this.units);
            this.updateSummaryStats(this.units);
            if (window.ResQTranslation) window.ResQTranslation.applyTranslations();
        });
    }

    async loadUnits() {
        const res = await window.ResQAPI.getRescueUnits();
        if (res.success && res.data) {
            this.units = res.data;
            this.renderTable(this.units);
            this.updateSummaryStats(this.units);
        } else {
            console.warn('Failed to load rescue units:', res.error);
        }
    }

    getDict(key) {
        const lang = window.ResQTranslation ? window.ResQTranslation.currentLang : 'en';
        const dict = {
            te: {
                specialty: "ప్రత్యేకత",
                coords: "మూల స్థానం",
                contact: "సంప్రదింపు",
                task: "ప్రస్తుత విధి",
                ping: "📡 బీకన్ పింగ్",
                markBusy: "బిజీగా మార్క్ చేయి",
                markAvail: "అందుబాటులో మార్క్ చేయి",
                avail: "అందుబాటులో ఉంది",
                busy: "డిస్పాచ్ చేయబడింది",
                availForTask: "డిస్పాచ్‌కి అందుబాటులో ఉంది"
            },
            hi: {
                specialty: "विशेषज्ञता",
                coords: "आधार निर्देशांक",
                contact: "संपर्क",
                task: "वर्तमान कार्य",
                ping: "📡 बीकन पिंग",
                markBusy: "व्यस्त चिह्नित करें",
                markAvail: "उपलब्ध चिह्नित करें",
                avail: "उपलब्ध",
                busy: "तैनात",
                availForTask: "रवानगी के लिए उपलब्ध"
            }
        };
        const defaults = {
            specialty: "Specialty",
            coords: "Base Coords",
            contact: "Contact",
            task: "Current Task",
            ping: "📡 Ping Beacon",
            markBusy: "Mark Busy",
            markAvail: "Mark Available",
            avail: "AVAILABLE",
            busy: "DISPATCHED",
            availForTask: "Available for Dispatch"
        };
        if (dict[lang] && dict[lang][key]) return dict[lang][key];
        return defaults[key] || key;
    }

    updateSummaryStats(units) {
        const total = units.length;
        const available = units.filter(u => u.status === 'available').length;
        const busy = units.filter(u => u.status === 'busy' || u.status === 'dispatched').length;

        const elTotal = document.getElementById('stat-total-units');
        const elAvail = document.getElementById('stat-avail-units');
        const elBusy = document.getElementById('stat-busy-units');

        if (elTotal) elTotal.innerText = total;
        if (elAvail) elAvail.innerText = available;
        if (elBusy) elBusy.innerText = busy;
    }

    renderTable(units) {
        const container = document.getElementById('rescueUnitsGrid');
        if (!container) return;

        if (!units || units.length === 0) {
            container.innerHTML = '<div style="grid-column:1/-1; padding:3rem; text-align:center; color:var(--text-secondary);" data-i18n="dashboard.noResults">No rescue units registered</div>';
            return;
        }

        const lblSpec = this.getDict('specialty');
        const lblCoords = this.getDict('coords');
        const lblContact = this.getDict('contact');
        const lblTask = this.getDict('task');
        const lblPing = this.getDict('ping');
        const lblAvailTask = this.getDict('availForTask');

        container.innerHTML = units.map(u => {
            const isAvail = u.status === 'available';
            const badgeBg = isAvail ? 'var(--success-bg)' : 'var(--warning-bg)';
            const badgeColor = isAvail ? 'var(--success)' : 'var(--warning)';
            const statusLabel = isAvail ? this.getDict('avail') : this.getDict('busy');
            const toggleLabel = isAvail ? this.getDict('markBusy') : this.getDict('markAvail');

            return `
                <div class="glass-panel" style="padding:1.35rem; display:flex; flex-direction:column; justify-content:space-between; border-left:4px solid ${badgeColor};">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                            <div style="font-weight:900; font-size:1.15rem; color:var(--text-primary); display:flex; align-items:center; gap:0.5rem;">
                                <span>${u.icon || '🚑'}</span>
                                <span>${u.name}</span>
                            </div>
                            <span class="badge-tag" style="background:${badgeBg}; color:${badgeColor}; border:1px solid ${badgeColor}; font-weight:800;">
                                ${statusLabel}
                            </span>
                        </div>

                        <div style="font-size:0.875rem; color:var(--text-secondary); margin-bottom:0.85rem;">
                            <strong>${lblSpec}:</strong> ${u.type}
                        </div>

                        <div style="background:var(--bg-panel); padding:0.75rem 0.85rem; border-radius:var(--radius-md); font-size:0.785rem; color:var(--text-primary); margin-bottom:1rem; border:1px solid var(--border-color);">
                            <div>📍 <strong>${lblCoords}:</strong> ${u.location ? `${u.location.lat.toFixed(4)}, ${u.location.lng.toFixed(4)}` : '17.3850, 78.4867'}</div>
                            <div style="margin-top:0.3rem;">📞 <strong>${lblContact}:</strong> ${u.contact || '+91 EOC Direct'}</div>
                            <div style="margin-top:0.3rem;">🎯 <strong>${lblTask}:</strong> ${u.assigned_incident_id ? `<span style="color:var(--warning); font-weight:800;">${u.assigned_incident_id}</span>` : `<span style="color:var(--success);">${lblAvailTask}</span>`}</div>
                        </div>
                    </div>

                    <div style="display:flex; gap:0.5rem;">
                        <button class="btn btn-sm btn-secondary" style="flex:1;" onclick="window.ResQRescueManager.pingUnit('${u.id}', '${u.name}')">
                            ${lblPing}
                        </button>
                        <button class="btn btn-sm ${isAvail ? 'btn-primary' : 'btn-secondary'}" style="flex:1;" onclick="window.ResQRescueManager.toggleStatus('${u.id}')">
                            ${toggleLabel}
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
        if (window.ResQTranslation) window.ResQTranslation.applyTranslations();
    }

    pingUnit(id, name) {
        window.ResQNotify.toast({
            type: 'info',
            title: '📡 BEACON SIGNAL SENT',
            message: `Pinged rescue team <strong>${name}</strong> (${id}). GPS telematics OK.`
        });
    }

    async toggleStatus(id) {
        const u = this.units.find(item => item.id === id);
        if (!u) return;

        const newStatus = u.status === 'available' ? 'busy' : 'available';
        u.status = newStatus;
        if (newStatus === 'available') u.assigned_incident_id = null;

        window.ResQNotify.toast({
            type: 'success',
            title: 'Status Updated',
            message: `Team <strong>${u.name}</strong> status changed to <strong>${newStatus.toUpperCase()}</strong>.`
        });

        this.renderTable(this.units);
        this.updateSummaryStats(this.units);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.ResQRescueManager) window.ResQRescueManager = new RescueUnitsManager();
    });
} else {
    if (!window.ResQRescueManager) window.ResQRescueManager = new RescueUnitsManager();
}
