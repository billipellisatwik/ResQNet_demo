/* ==========================================================================
   RESQNET RESOURCES MANAGEMENT CONTROLLER v5.1
   100% Dynamic Multilingual i18n Translation Support
   ========================================================================== */

class ResourcesManager {
    constructor() {
        this.resources = [];
        this.init();
    }

    async init() {
        await this.loadResources();

        window.addEventListener('language-changed', () => {
            this.renderGrid(this.resources);
            this.updateSummaryStats(this.resources);
            if (window.ResQTranslation) window.ResQTranslation.applyTranslations();
        });
    }

    async loadResources() {
        const res = await window.ResQAPI.request('/resources');
        if (res.success && res.data) {
            this.resources = res.data;
            this.renderGrid(this.resources);
            this.updateSummaryStats(this.resources);
        } else {
            console.warn('Failed to load resources:', res.error);
        }
    }

    getDict(key) {
        const lang = window.ResQTranslation ? window.ResQTranslation.currentLang : 'en';
        const dict = {
            te: {
                availInv: "అందుబాటులో ఉన్న నిల్వ",
                units: "యూనిట్లు",
                dispatch: "📦 స్టాక్ డిస్పాచ్ చేయి",
                restock: "🚚 స్టాక్ జతచేయి +10",
                equipment: "పరికరాలు",
                good: "మంచి నిల్వ",
                lowStock: "తక్కువ నిల్వ"
            },
            hi: {
                availInv: "उपलब्ध इन्वेंटरी",
                units: "इकाइयां",
                dispatch: "📦 स्टॉक रवाना करें",
                restock: "🚚 रीस्टॉक +10",
                equipment: "उपकरण",
                good: "अच्छा स्टॉक",
                lowStock: "कम स्टॉक"
            }
        };
        const defaults = {
            availInv: "Available Inventory",
            units: "Units",
            dispatch: "📦 Dispatch Stock",
            restock: "🚚 Restock +10",
            equipment: "Equipment",
            good: "Good",
            lowStock: "Low Stock"
        };
        if (dict[lang] && dict[lang][key]) return dict[lang][key];
        return defaults[key] || key;
    }

    updateSummaryStats(resources) {
        const totalItems = resources.reduce((acc, r) => acc + (r.quantity || 0), 0);
        const availItems = resources.reduce((acc, r) => acc + (r.available || 0), 0);

        const elTotal = document.getElementById('stat-total-res');
        const elAvail = document.getElementById('stat-avail-res');

        if (elTotal) elTotal.innerText = totalItems;
        if (elAvail) elAvail.innerText = availItems;
    }

    renderGrid(resources) {
        const container = document.getElementById('resourcesGrid');
        if (!container) return;

        if (!resources || resources.length === 0) {
            container.innerHTML = '<div style="grid-column:1/-1; padding:3rem; text-align:center; color:var(--text-secondary);" data-i18n="dashboard.noResults">No resources registered</div>';
            return;
        }

        const lblInv = this.getDict('availInv');
        const lblUnits = this.getDict('units');
        const lblDisp = this.getDict('dispatch');
        const lblRe = this.getDict('restock');

        container.innerHTML = resources.map(r => {
            const pct = Math.min(100, Math.round(((r.available || 0) / (r.quantity || 1)) * 100));
            const isLow = pct <= 30;
            const barColor = isLow ? 'var(--danger)' : 'var(--success)';
            const badgeBg = isLow ? 'var(--danger-bg)' : 'var(--success-bg)';
            const badgeColor = isLow ? 'var(--danger)' : 'var(--success)';

            return `
                <div class="glass-panel" style="padding:1.35rem; display:flex; flex-direction:column; justify-content:space-between; border-left:4px solid ${barColor};">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                            <div style="font-weight:900; font-size:1.1rem; color:var(--text-primary); display:flex; align-items:center; gap:0.5rem;">
                                <span>📦</span>
                                <span>${r.name}</span>
                            </div>
                            <span class="badge-tag" style="background:${badgeBg}; color:${badgeColor}; border:1px solid ${badgeColor}; font-weight:800;">
                                ${r.type || this.getDict('equipment')}
                            </span>
                        </div>

                        <div style="background:var(--bg-panel); padding:0.85rem; border-radius:var(--radius-md); font-size:0.8rem; color:var(--text-primary); margin-bottom:1rem; border:1px solid var(--border-color);">
                            <div style="display:flex; justify-content:space-between; font-weight:700; margin-bottom:0.4rem;">
                                <span>${lblInv}</span>
                                <span>${r.available} / ${r.quantity} ${lblUnits}</span>
                            </div>
                            <div style="height:9px; background:rgba(255,255,255,0.1); border-radius:999px; overflow:hidden;">
                                <div style="height:100%; width:${pct}%; background:${barColor}; border-radius:999px; transition:width 500ms ease;"></div>
                            </div>
                        </div>
                    </div>

                    <div style="display:flex; gap:0.5rem;">
                        <button class="btn btn-sm btn-secondary" style="flex:1;" onclick="window.ResQResourcesManager.dispatchItem('${r.id}')">
                            ${lblDisp}
                        </button>
                        <button class="btn btn-sm btn-primary" style="flex:1;" onclick="window.ResQResourcesManager.restockItem('${r.id}')">
                            ${lblRe}
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
        if (window.ResQTranslation) window.ResQTranslation.applyTranslations();
    }

    dispatchItem(id) {
        const item = this.resources.find(r => r.id === id);
        if (!item || item.available <= 0) {
            window.ResQNotify.toast({ type: 'danger', title: 'Low Stock', message: 'No available stock left to dispatch.' });
            return;
        }

        item.available = Math.max(0, item.available - 1);
        window.ResQNotify.toast({
            type: 'info',
            title: 'Stock Dispatched',
            message: `1 unit of <strong>${item.name}</strong> dispatched to field team.`
        });

        this.renderGrid(this.resources);
        this.updateSummaryStats(this.resources);
    }

    restockItem(id) {
        const item = this.resources.find(r => r.id === id);
        if (!item) return;

        item.quantity += 10;
        item.available += 10;

        window.ResQNotify.toast({
            type: 'success',
            title: 'Restock Complete',
            message: `Added 10 units to <strong>${item.name}</strong> inventory.`
        });

        this.renderGrid(this.resources);
        this.updateSummaryStats(this.resources);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.ResQResourcesManager) window.ResQResourcesManager = new ResourcesManager();
    });
} else {
    if (!window.ResQResourcesManager) window.ResQResourcesManager = new ResourcesManager();
}
