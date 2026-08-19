/* ==========================================================================
   RESQNET LIVE CITIZEN RESCUE TRACKING MANAGER v5.1
   Displays Citizen Position, Assigned Rescue Team Position, Live Distance (km),
   and Dynamic Route Vectors on Citizen's Live Map.
   ========================================================================== */

class TrackingManager {
    constructor() {
        this.incidentId = new URLSearchParams(window.location.search).get('id') || localStorage.getItem('resqnet_active_sos') || 'RESQ-1042';
        this.ws = null;
        this.map = null;
        this.citizenMarker = null;
        this.unitMarker = null;
        this.routeLine = null;
        this.incidentData = null;

        this.init();
    }

    async init() {
        this.initMap();
        await this.loadIncident();
        this.initWebSocket();
        this.bindRescuedButton();
    }

    initMap() {
        const mapContainer = document.getElementById('tracking-map');
        if (mapContainer && typeof L !== 'undefined') {
            this.map = L.map('tracking-map', { zoomControl: false, attributionControl: false }).setView([17.3850, 78.4867], 14);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(this.map);
            L.control.zoom({ position: 'topright' }).addTo(this.map);
        }
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371.0;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    initWebSocket() {
        if (window.ResQWebSocket && this.incidentId) {
            this.ws = new window.ResQWebSocket('tracking', this.incidentId);

            this.ws.on('status_update', (data) => {
                if (data.id === this.incidentId) {
                    console.log('🔄 Real-time status update on Citizen Phone:', data);
                    this.loadIncident();
                }
            });

            this.ws.on('team_reached', (data) => {
                if (data.id === this.incidentId) {
                    window.ResQNotify.toast({
                        type: 'info',
                        title: '📍 RESCUE TEAM REACHED',
                        message: 'The rescue team has reached your location. Please follow their instructions.'
                    });
                    this.loadIncident();
                }
            });

            this.ws.on('person_safe', (data) => {
                if (data.id === this.incidentId) {
                    window.ResQNotify.toast({
                        type: 'success',
                        title: '🟢 YOU ARE SAFE',
                        message: 'The rescue has been completed successfully.'
                    });
                    this.loadIncident();
                }
            });

            this.ws.on('citizen_reported_rescued', (data) => {
                if (data.id === this.incidentId) {
                    this.loadIncident();
                }
            });

            this.ws.on('rescued_by_others_confirmed', (data) => {
                if (data.id === this.incidentId) {
                    window.ResQNotify.toast({
                        type: 'success',
                        title: '🟢 YOU ARE SAFE',
                        message: 'You have reported that you were rescued by others. The Command Center has confirmed your safety.'
                    });
                    this.loadIncident();
                }
            });

            this.ws.on('rescue_dispatched', (dispatchData) => {
                if (dispatchData.incident_id === this.incidentId) {
                    window.ResQNotify.toast({
                        type: 'success',
                        title: 'RESCUE TEAM DISPATCHED!',
                        message: `<strong>${dispatchData.unit_name}</strong> is on the way!`
                    });
                    this.loadIncident();
                }
            });
        }
    }

    async loadIncident() {
        const res = await window.ResQAPI.getSOS(this.incidentId);
        if (res.success && res.data) {
            const data = res.data;
            this.incidentData = data;

            // Set Header fields
            const idEl = document.getElementById('tracking-id');
            const priorityEl = document.getElementById('tracking-priority');
            const categoryEl = document.getElementById('tracking-category');
            const descEl = document.getElementById('tracking-desc');

            if (idEl) idEl.innerText = data.id;
            if (priorityEl) priorityEl.innerText = `${data.priority} SOS`;
            if (categoryEl) categoryEl.innerText = `${data.category_icon || '🚨'} ${data.category}`;
            if (descEl) descEl.innerText = data.description || 'Emergency Assistance Required';

            // Plot Citizen Marker on Map
            if (this.map && data.latitude && data.longitude) {
                const isSafe = data.status === 'safe' || data.status === 'resolved';
                const markerColor = isSafe ? '#00E676' : '#EF4444';
                const markerBg = isSafe ? 'rgba(0,230,118,0.2)' : 'rgba(239,68,68,0.2)';

                const citizenIcon = L.divIcon({
                    className: 'custom-leaflet-marker',
                    html: `
                        <div style="width:38px; height:38px; border-radius:50%; background:${markerBg}; display:flex; align-items:center; justify-content:center; border:2px solid ${markerColor}; animation:map-pulse 1.5s infinite;">
                            <span style="font-size:1.2rem;">${isSafe ? '🟢' : '📍'}</span>
                        </div>
                    `,
                    iconSize: [38, 38],
                    iconAnchor: [19, 19]
                });

                if (this.citizenMarker) this.map.removeLayer(this.citizenMarker);
                this.citizenMarker = L.marker([data.latitude, data.longitude], { icon: citizenIcon })
                    .bindPopup(`<b>Your Position</b><br>Emergency: ${data.category}<br>Status: ${data.status.toUpperCase()}`)
                    .addTo(this.map);

                this.map.setView([data.latitude, data.longitude], 14);
            }

            // Plot Assigned Rescue Team Position & Live Distance
            if (data.assigned_unit || data.nearest_unit_id) {
                const unitId = data.assigned_unit || data.nearest_unit_id;
                const unitRes = await window.ResQAPI.getRescueUnits();

                if (unitRes.success && unitRes.data) {
                    const assignedUnit = unitRes.data.find(u => u.id === unitId || u.name === unitId);

                    if (assignedUnit && assignedUnit.location) {
                        const unitLat = assignedUnit.location.lat;
                        const unitLng = assignedUnit.location.lng;

                        const distKm = this.calculateDistance(data.latitude, data.longitude, unitLat, unitLng);
                        const etaMins = Math.max(1, Math.min(3, Math.round(distKm * 0.5 + 1)));

                        const etaVal = document.getElementById('tracking-eta-val');
                        const unitName = document.getElementById('tracking-unit-name');
                        const distEl = document.getElementById('tracking-distance');
                        const progressBar = document.getElementById('tracking-progress-bar');

                        if (etaVal) etaVal.innerText = `${etaMins} MIN`;
                        if (unitName) unitName.innerText = `⚡ ${assignedUnit.name} (${assignedUnit.type})`;
                        if (distEl) distEl.innerText = `📍 Distance to Rapid Rescue Team: ${distKm.toFixed(2)} km away`;
                        if (progressBar) progressBar.style.width = data.status === 'reached' ? '95%' : '85%';

                        // Plot Rescue Unit Marker
                        const unitIcon = L.divIcon({
                            className: 'custom-leaflet-marker',
                            html: `
                                <div style="width:40px; height:40px; border-radius:50%; background:#1E293B; border:3px solid #06B6D4; display:flex; align-items:center; justify-content:center; box-shadow:0 0 15px #06B6D4; animation:map-pulse 1.5s infinite;">
                                    <span style="font-size:1.3rem;">${assignedUnit.icon || '🚑'}</span>
                                </div>
                            `,
                            iconSize: [40, 40],
                            iconAnchor: [20, 20]
                        });

                        if (this.unitMarker) this.map.removeLayer(this.unitMarker);
                        this.unitMarker = L.marker([unitLat, unitLng], { icon: unitIcon })
                            .bindPopup(`<b>${assignedUnit.name}</b><br>Distance: ${distKm.toFixed(2)} km away<br>Status: En Route`)
                            .addTo(this.map);

                        // Draw Dashed Polyline Route Vector between Rescue Team and Citizen
                        if (this.routeLine) this.map.removeLayer(this.routeLine);
                        this.routeLine = L.polyline([
                            [unitLat, unitLng],
                            [data.latitude, data.longitude]
                        ], {
                            color: '#06B6D4',
                            weight: 5,
                            opacity: 0.85,
                            dashArray: '10, 10'
                        }).addTo(this.map);

                        // Auto-fit map bounds so both citizen and rescue vehicle are visible
                        if (this.map) {
                            const bounds = L.latLngBounds([
                                [data.latitude, data.longitude],
                                [unitLat, unitLng]
                            ]);
                            this.map.fitBounds(bounds, { padding: [50, 50] });
                        }
                    }
                }
            }

            // Update Stepper and Render Status Banners
            this.updateStepper(data.status, data.outcome);
            this.renderStatusAlert(data);
        }
    }

    updateStepper(status, outcome) {
        const s1 = document.getElementById('step-sos-sent');
        const s2 = document.getElementById('step-team-assigned');
        const s3 = document.getElementById('step-team-enroute');
        const s4 = document.getElementById('step-team-reached');
        const s5 = document.getElementById('step-person-safe');
        const safeDetail = document.getElementById('step-safe-detail');

        const setStep = (el, active, completed, text) => {
            if (!el) return;
            const dot = el.querySelector('.step-dot');
            const title = el.querySelector('div[style*="font-size:0.875rem"]');

            if (completed) {
                el.style.opacity = '1';
                if (dot) { dot.style.background = 'var(--success)'; dot.style.boxShadow = '0 0 10px var(--success)'; }
                if (title) { title.style.color = 'var(--text-primary)'; if (text) title.innerText = text; }
            } else if (active) {
                el.style.opacity = '1';
                if (dot) { dot.style.background = 'var(--info)'; dot.style.boxShadow = '0 0 10px var(--info)'; }
                if (title) { title.style.color = 'var(--info)'; if (text) title.innerText = text; }
            } else {
                el.style.opacity = '0.4';
                if (dot) { dot.style.background = 'var(--border-color)'; dot.style.boxShadow = 'none'; }
            }
        };

        setStep(s1, false, true, "✓ 1. SOS Signal Sent");
        setStep(s2, false, false, "○ 2. Rescue Team Assigned");
        setStep(s3, false, false, "○ 3. Team En Route");
        setStep(s4, false, false, "○ 4. Team Reached Location");
        setStep(s5, false, false, "○ 5. Person Rescued / Safe");

        if (status === 'assigned' || status === 'dispatched' || status === 'en_route') {
            setStep(s2, false, true, "✓ 2. Rescue Team Assigned");
            setStep(s3, true, false, "○ 3. Team En Route");
        } else if (status === 'reached') {
            setStep(s2, false, true, "✓ 2. Rescue Team Assigned");
            setStep(s3, false, true, "✓ 3. Team En Route");
            setStep(s4, true, false, "📍 4. Rescue Team Reached Location");
        } else if (status === 'safe' || status === 'resolved' || status === 'completed') {
            setStep(s2, false, true, "✓ 2. Rescue Team Assigned");
            setStep(s3, false, true, "✓ 3. Team En Route");
            setStep(s4, false, true, "✓ 4. Team Reached Location");
            setStep(s5, false, true, "🟢 5. Person Rescued / Safe");

            if (safeDetail) {
                safeDetail.innerText = outcome === 'RESCUED_BY_OTHERS' ? 'Rescued by Others (Confirmed by EOC)' : 'Rescued by ResQNet Team';
            }
        } else if (status === 'citizen_reported_rescued') {
            setStep(s2, false, true, "✓ 2. Rescue Team Assigned");
            setStep(s3, false, true, "✓ 3. Team En Route");
            setStep(s4, true, false, "🟡 4. Safety Report Under Verification");
        }
    }

    renderStatusAlert(data) {
        const container = document.getElementById('tracking-status-alert-container');
        const alreadyRescuedBtnContainer = document.getElementById('already-rescued-container');
        const etaCard = document.getElementById('tracking-eta-card');

        if (!container) return;

        if (data.status === 'safe' || data.status === 'resolved' || data.status === 'completed') {
            if (alreadyRescuedBtnContainer) alreadyRescuedBtnContainer.style.display = 'none';
            if (etaCard) etaCard.style.display = 'none';
        } else {
            if (alreadyRescuedBtnContainer) alreadyRescuedBtnContainer.style.display = 'block';
            if (etaCard) etaCard.style.display = 'block';
        }

        if (data.status === 'reached') {
            container.innerHTML = `
                <div class="glass-panel" style="padding:1.25rem; margin-top:1rem; border-left:4px solid var(--info); background:rgba(6, 182, 212, 0.12);">
                    <div style="font-weight:900; font-size:1.1rem; color:var(--info); display:flex; align-items:center; gap:0.5rem; margin-bottom:0.35rem;">
                        <span>📍 RESCUE TEAM REACHED</span>
                    </div>
                    <div style="font-size:0.875rem; color:var(--text-primary); line-height:1.4;">
                        "The rescue team has reached your location. Please follow their instructions."
                    </div>
                </div>
            `;
        } else if (data.status === 'citizen_reported_rescued') {
            container.innerHTML = `
                <div class="glass-panel" style="padding:1.25rem; margin-top:1rem; border-left:4px solid var(--warning); background:rgba(255, 179, 0, 0.12);">
                    <div style="font-weight:900; font-size:1.1rem; color:var(--warning); display:flex; align-items:center; gap:0.5rem; margin-bottom:0.35rem;">
                        <span>🟡 Safety Report Sent</span>
                    </div>
                    <div style="font-size:0.875rem; color:var(--text-primary); line-height:1.4;">
                        "The Command Center has been notified that you have already received help. Please remain in a safe location while verification is being completed."
                    </div>
                </div>
            `;
        } else if (data.status === 'safe' || data.status === 'resolved' || data.status === 'completed') {
            const isRescuedByOthers = data.outcome === 'RESCUED_BY_OTHERS';

            container.innerHTML = `
                <div class="glass-panel" style="padding:1.5rem; margin-top:1rem; border-left:4px solid var(--success); background:rgba(0, 230, 118, 0.12);">
                    <div style="font-weight:900; font-size:1.4rem; color:var(--success); display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
                        <span>🟢 YOU ARE SAFE</span>
                    </div>

                    <p style="font-size:0.9rem; color:var(--text-primary); margin-bottom:1rem; line-height:1.5;">
                        ${isRescuedByOthers ? 
                            '"You have reported that you were rescued by others. The Command Center has confirmed your safety."' : 
                            '"The rescue has been completed successfully by the assigned ResQNet team."'
                        }
                    </p>

                    <div style="background:var(--bg-panel); padding:1rem; border-radius:var(--radius-md); font-size:0.825rem; border:1px solid var(--border-color);">
                        <div style="font-weight:800; font-size:0.9rem; color:var(--success); margin-bottom:0.5rem;">RESCUE COMPLETED</div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.3rem;">
                            <span style="color:var(--text-secondary);">SOS ID:</span>
                            <strong style="font-family:var(--font-mono);">${data.id}</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.3rem;">
                            <span style="color:var(--text-secondary);">Rescue Team:</span>
                            <strong>${data.assigned_unit_name || data.assigned_unit || 'NDRF Rescue Unit'}</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.3rem;">
                            <span style="color:var(--text-secondary);">Emergency:</span>
                            <strong>${data.category}</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.3rem;">
                            <span style="color:var(--text-secondary);">Status:</span>
                            <strong style="color:var(--success);">SAFE</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.3rem;">
                            <span style="color:var(--text-secondary);">Completed At:</span>
                            <strong>${data.completed_time ? new Date(data.completed_time).toLocaleTimeString() : 'Just now'}</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-top:0.5rem; padding-top:0.5rem; border-top:1px solid var(--border-color);">
                            <span style="color:var(--text-secondary); font-weight:700;">Final Outcome:</span>
                            <strong style="color:var(--success); font-weight:800;">${isRescuedByOthers ? 'Rescued by Others' : 'Rescued by ResQNet Team'}</strong>
                        </div>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = '';
        }
    }

    bindRescuedButton() {
        const btn = document.getElementById('btnAlreadyRescued');
        if (!btn) return;

        btn.onclick = async (e) => {
            e.preventDefault();

            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.85); backdrop-filter: blur(6px);
                z-index: 99999; display: flex; justify-content: center; align-items: center; padding: 20px;
            `;

            const modal = document.createElement('div');
            modal.style.cssText = `
                background: var(--bg-surface-solid); color: var(--text-primary);
                padding: 24px; border-radius: 18px; width: 100%; max-width: 480px;
                border: 1px solid var(--border-color); box-shadow: 0 25px 60px rgba(0,0,0,0.7); text-align: center;
            `;

            modal.innerHTML = `
                <div style="font-size:3rem; margin-bottom:0.5rem;">🟢</div>
                <h3 style="margin:0 0 0.5rem 0; font-size:1.25rem; font-weight:900;">Have you already received help and are you currently safe?</h3>
                
                <p style="font-size:0.875rem; color:var(--text-secondary); line-height:1.5; margin-bottom:1.5rem;">
                    Your assigned rescue team may still be travelling to your location. Confirming this will notify the Command Center to verify your safety and release the rescue team for other emergencies.
                </p>

                <div style="display:flex; flex-direction:column; gap:0.75rem;">
                    <button id="btnConfirmRescuedYes" class="btn btn-primary" style="padding:0.75rem; font-size:0.95rem; background:linear-gradient(135deg, var(--success) 0%, #00C853 100%) !important; color:#050811 !important;">
                        ✓ Yes, I'm Safe
                    </button>

                    <button id="btnConfirmRescuedNo" class="btn btn-secondary" style="padding:0.75rem; font-size:0.95rem; border-color:var(--danger); color:var(--danger);">
                        ❌ No, I Still Need Help
                    </button>
                </div>
            `;

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            modal.querySelector('#btnConfirmRescuedYes').onclick = async () => {
                overlay.remove();
                window.ResQNotify.status({ title: 'Sending Safety Report', message: 'Notifying Command Center...', progress: 50 });

                const res = await window.ResQAPI.reportRescuedByCitizen(this.incidentId);
                if (res.success) {
                    window.ResQNotify.toast({
                        type: 'warning',
                        title: '🟡 Safety Report Sent',
                        message: 'The Command Center has been notified that you have received help.'
                    });
                    this.loadIncident();
                } else {
                    window.ResQNotify.toast({ type: 'danger', title: 'Report Failed', message: res.error || 'Could not send report.' });
                }
            };

            modal.querySelector('#btnConfirmRescuedNo').onclick = async () => {
                overlay.remove();
                window.ResQNotify.status({ title: 'Help Requirement Confirmed', message: 'Rescue team remains en route.', progress: 50 });

                const res = await window.ResQAPI.reportStillNeedsHelp(this.incidentId);
                if (res.success) {
                    window.ResQNotify.toast({
                        type: 'info',
                        title: '🚨 Rescue Team En Route',
                        message: 'Your emergency remains active. The rescue team is coming.'
                    });
                    this.loadIncident();
                }
            };
        };
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.ResQTracking) window.ResQTracking = new TrackingManager();
    });
} else {
    if (!window.ResQTracking) window.ResQTracking = new TrackingManager();
}
