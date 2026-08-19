/* ==========================================================================
   RESQNET SHELTERS MANAGEMENT CONTROLLER v5.1
   100% Dynamic Multilingual i18n Translation Support
   ========================================================================== */

class SheltersManager {
    constructor() {
        this.shelters = [];
        this.init();
    }

    async init() {
        await this.loadShelters();

        window.addEventListener('language-changed', () => {
            this.renderGrid(this.shelters);
            this.updateSummaryStats(this.shelters);
            if (window.ResQTranslation) window.ResQTranslation.applyTranslations();
        });
    }

    async loadShelters() {
        const res = await window.ResQAPI.getShelters();
        if (res.success && res.data) {
            this.shelters = res.data;
            this.renderGrid(this.shelters);
            this.updateSummaryStats(this.shelters);
        } else {
            console.warn('Failed to load shelters:', res.error);
        }
    }

    getDict(key) {
        const lang = window.ResQTranslation ? window.ResQTranslation.currentLang : 'en';
        const dict = {
            te: {
                address: "చిరునామా",
                occupancy: "ఆక్రమణ స్థితి",
                bedsAvail: "పడకలు అందుబాటులో ఉన్నాయి",
                amenities: "వసతులు & సరఫరాలు",
                directions: "📍 దిశలు",
                updateBeds: "డిస్పాచ్ పడకలు",
                full: "నిండిపోయింది",
                open: "తెరిచి ఉంది"
            },
            hi: {
                address: "पता",
                occupancy: "उपस्थिति स्थिति",
                bedsAvail: "बिस्तर उपलब्ध",
                amenities: "सुविधाएं और आपूर्ति",
                directions: "📍 दिशा-निर्देश",
                updateBeds: "बिस्तर अद्यतन",
                full: "पूरा भरा",
                open: "खुला"
            }
        };
        const defaults = {
            address: "Address",
            occupancy: "Occupancy",
            bedsAvail: "Beds Available",
            amenities: "AMENITIES & SUPPLIES",
            directions: "📍 Directions",
            updateBeds: "🛌 Update Beds",
            full: "FULL",
            open: "OPEN"
        };
        if (dict[lang] && dict[lang][key]) return dict[lang][key];
        return defaults[key] || key;
    }

    updateSummaryStats(shelters) {
        const totalShelters = shelters.length;
        const totalBeds = shelters.reduce((acc, s) => acc + (s.capacity || 0), 0);
        const totalAvailBeds = shelters.reduce((acc, s) => acc + (s.available_beds || 0), 0);

        const elTotalShelters = document.getElementById('stat-total-shelters');
        const elTotalBeds = document.getElementById('stat-total-beds');
        const elAvailBeds = document.getElementById('stat-avail-beds');

        if (elTotalShelters) elTotalShelters.innerText = totalShelters;
        if (elTotalBeds) elTotalBeds.innerText = totalBeds;
        if (elAvailBeds) elAvailBeds.innerText = totalAvailBeds;
    }

    renderGrid(shelters) {
        const container = document.getElementById('sheltersGrid');
        if (!container) return;

        if (!shelters || shelters.length === 0) {
            container.innerHTML = '<div style="grid-column:1/-1; padding:3rem; text-align:center; color:var(--text-secondary);" data-i18n="dashboard.noResults">No shelters registered</div>';
            return;
        }

        const lblAddr = this.getDict('address');
        const lblOcc = this.getDict('occupancy');
        const lblBeds = this.getDict('bedsAvail');
        const lblAmen = this.getDict('amenities');
        const lblDir = this.getDict('directions');
        const lblUpdBeds = this.getDict('updateBeds');

        container.innerHTML = shelters.map(s => {
            const pct = Math.min(100, Math.round((s.occupancy / s.capacity) * 100));
            const isFull = pct >= 90;
            const barColor = isFull ? 'var(--danger)' : pct > 70 ? 'var(--warning)' : 'var(--success)';
            const statusBadgeBg = isFull ? 'var(--danger-bg)' : 'var(--success-bg)';
            const statusBadgeColor = isFull ? 'var(--danger)' : 'var(--success)';
            const statusText = isFull ? this.getDict('full') : this.getDict('open');

            const amenitiesHtml = (s.amenities || []).map(a => `
                <span class="badge-tag" style="background:rgba(255,255,255,0.06); color:var(--text-primary); font-size:0.7rem; margin-right:0.3rem; margin-bottom:0.3rem; display:inline-block;">
                    ✓ ${a}
                </span>
            `).join('');

            return `
                <div class="glass-panel" style="padding:1.35rem; display:flex; flex-direction:column; justify-content:space-between; border-left:4px solid ${barColor};">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                            <div style="font-weight:900; font-size:1.15rem; color:var(--text-primary); display:flex; align-items:center; gap:0.5rem;">
                                <span>🏠</span>
                                <span>${s.name}</span>
                            </div>
                            <span class="badge-tag" style="background:${statusBadgeBg}; color:${statusBadgeColor}; border:1px solid ${statusBadgeColor}; font-weight:800;">
                                ${statusText}
                            </span>
                        </div>

                        <div style="font-size:0.875rem; color:var(--text-secondary); margin-bottom:0.85rem;">
                            📍 <strong>${lblAddr}:</strong> ${s.address} &bull; 📞 ${s.contact || '+91 Helpline'}
                        </div>

                        <!-- Capacity Bar -->
                        <div style="background:var(--bg-panel); padding:0.85rem; border-radius:var(--radius-md); font-size:0.8rem; color:var(--text-primary); margin-bottom:1rem; border:1px solid var(--border-color);">
                            <div style="display:flex; justify-content:space-between; font-weight:700; margin-bottom:0.4rem;">
                                <span>${lblOcc}</span>
                                <span>${s.occupancy} / ${s.capacity} (${s.available_beds} ${lblBeds})</span>
                            </div>
                            <div style="height:9px; background:rgba(255,255,255,0.1); border-radius:999px; overflow:hidden;">
                                <div style="height:100%; width:${pct}%; background:${barColor}; border-radius:999px; transition:width 500ms ease;"></div>
                            </div>
                        </div>

                        <div style="margin-bottom:1rem;">
                            <div style="font-size:0.75rem; font-weight:700; color:var(--text-secondary); margin-bottom:0.35rem; text-transform:uppercase;">${lblAmen}:</div>
                            <div>${amenitiesHtml || '<span style="font-size:0.75rem; color:var(--text-secondary);">Basic Shelter Supplies</span>'}</div>
                        </div>
                    </div>

                    <div style="display:flex; gap:0.5rem;">
                        <button class="btn btn-sm btn-secondary" style="flex:1;" onclick="window.ResQSheltersManager.getDirections('${s.name}')">
                            ${lblDir}
                        </button>
                        <button class="btn btn-sm btn-primary" style="flex:1;" onclick="window.ResQSheltersManager.updateCapacity('${s.id}')">
                            ${lblUpdBeds}
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
        if (window.ResQTranslation) window.ResQTranslation.applyTranslations();
    }

    getDirections(name) {
        window.ResQNotify.toast({
            type: 'info',
            title: '🗺️ EVACUATION ROUTE GENERATED',
            message: `Route directions to <strong>${name}</strong> sent to GPS navigation.`
        });
    }

    async updateCapacity(id) {
        const s = this.shelters.find(item => item.id === id);
        if (!s) return;

        const newOcc = Math.max(0, s.occupancy + 10);
        s.occupancy = newOcc;
        s.available_beds = Math.max(0, s.capacity - newOcc);

        window.ResQNotify.toast({
            type: 'success',
            title: 'Capacity Updated',
            message: `Occupancy for <strong>${s.name}</strong> updated to <strong>${newOcc}</strong>.`
        });

        this.renderGrid(this.shelters);
        this.updateSummaryStats(this.shelters);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.ResQSheltersManager) window.ResQSheltersManager = new SheltersManager();
    });
} else {
    if (!window.ResQSheltersManager) window.ResQSheltersManager = new SheltersManager();
}
