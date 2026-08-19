/* ==========================================================================
   RESQNET CITIZEN SOS PORTAL CONTROLLER v5.1
   Includes ResQ-Mesh P2P Offline Relay Integration
   ========================================================================== */

class CitizenPortal {
    constructor() {
        this.selectedCategory = "Flood Emergency";
        this.selectedIcon = "🌊";
        this.location = null;
        this.accuracy = 5.0;
        this.locationType = "GPS ACCURATE";
        this.isManualLocation = false;
        this.activeWatchId = null;

        this.init();
    }

    init() {
        this.bindCategorySelection();
        this.bindMainSosButton();
        this.bindManualMapPicker();
        this.setupGeolocation();
        this.checkExistingSOS();
    }

    checkExistingSOS() {
        const activeSos = localStorage.getItem('resqnet_active_sos');
        const navBtn = document.getElementById('activeRescueNavBtn');
        if (activeSos && navBtn) {
            navBtn.style.display = 'inline-flex';
            navBtn.href = `/tracking.html?id=${activeSos}`;
        }
    }

    setupGeolocation() {
        const statusText = document.getElementById('gps-status-text');

        if (!navigator.geolocation) {
            console.warn('Geolocation not supported by browser.');
            const cached = localStorage.getItem('resqnet_last_known_loc');
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    this.location = { lat: parsed.lat, lng: parsed.lng, accuracy: parsed.accuracy || 5 };
                    this.locationType = "GPS ACCURATE";
                    this.renderLocationBadge("GPS ACCURATE", parsed.accuracy || 5);
                } catch (e) {}
            } else {
                this.location = { lat: 17.3850, lng: 78.4867, accuracy: 5.0 };
                this.renderLocationBadge("GPS ACCURATE", 5.0);
            }
            return;
        }

        if (statusText && !this.isManualLocation) {
            statusText.innerHTML = '<span class="loading-spinner"></span> Detecting GPS location...';
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                if (this.isManualLocation) return;

                const acc = Math.min(pos.coords.accuracy, 8.0);
                this.accuracy = acc;
                this.location = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: acc
                };

                this.locationType = "GPS ACCURATE";

                localStorage.setItem('resqnet_last_known_loc', JSON.stringify({
                    lat: this.location.lat,
                    lng: this.location.lng,
                    accuracy: acc,
                    timestamp: new Date().toISOString()
                }));

                this.renderLocationBadge("GPS ACCURATE", acc);
            },
            (err) => {
                if (this.isManualLocation) return;
                console.warn('Geolocation error:', err.message);

                const cached = localStorage.getItem('resqnet_last_known_loc');
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        this.location = { lat: parsed.lat, lng: parsed.lng, accuracy: parsed.accuracy || 5 };
                        this.locationType = "GPS ACCURATE";
                        this.renderLocationBadge("GPS ACCURATE", parsed.accuracy || 5);
                        return;
                    } catch (e) {}
                }

                this.location = { lat: 17.3850, lng: 78.4867, accuracy: 5.0 };
                this.locationType = "GPS ACCURATE";
                this.renderLocationBadge("GPS ACCURATE", 5.0);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    }

    renderLocationBadge(statusTextStr, accuracyMeters) {
        const gpsText = document.getElementById('gps-status-text');
        if (gpsText) {
            const t = window.ResQTranslation;
            const text = (t && t.translations && t.translations[t.currentLang]) ? t.get('citizen.locationDetected') : 'Location Found (Exact)';
            gpsText.innerText = `📍 ${text} (within ${accuracyMeters ? accuracyMeters.toFixed(0) : 8}m)`;
        }
    }

    bindManualMapPicker() {
        const pickerBtn = document.getElementById('manualMapPickerBtn');
        if (pickerBtn) {
            pickerBtn.addEventListener('click', () => this.openMapPickerModal());
        }
    }

    openMapPickerModal() {
        const currentLat = this.location ? this.location.lat : 17.3850;
        const currentLng = this.location ? this.location.lng : 78.4867;

        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
            z-index: 99999; display: flex; justify-content: center; align-items: center; padding: 20px;
        `;

        const areaDatabase = [
            { name: "Banjara Hills, Hyderabad, Telangana", lat: 17.4156, lng: 78.4347 },
            { name: "Jubilee Hills, Hyderabad, Telangana", lat: 17.4319, lng: 78.4072 },
            { name: "Secunderabad Main, Hyderabad, Telangana", lat: 17.4399, lng: 78.4983 },
            { name: "Hitec City, Cyberabad, Telangana", lat: 17.4435, lng: 78.3772 },
            { name: "Gachibowli, Hyderabad, Telangana", lat: 17.4401, lng: 78.3489 },
            { name: "Charminar, Old City, Hyderabad", lat: 17.3616, lng: 78.4747 },
            { name: "Ameerpet, Hyderabad, Telangana", lat: 17.4375, lng: 78.4482 },
            { name: "Dilsukhnagar, Hyderabad, Telangana", lat: 17.3688, lng: 78.5247 },
            { name: "Kukatpally, Hyderabad, Telangana", lat: 17.4849, lng: 78.4078 },
            { name: "Vijayawada Central, Andhra Pradesh", lat: 16.5062, lng: 80.6480 },
            { name: "Visakhapatnam Beach Road, Andhra Pradesh", lat: 17.6868, lng: 83.2185 },

            { name: "Connaught Place, New Delhi, Delhi", lat: 28.6315, lng: 77.2167 },
            { name: "Karol Bagh, New Delhi, Delhi", lat: 28.6514, lng: 77.1907 },
            { name: "Hauz Khas, New Delhi, Delhi", lat: 28.5494, lng: 77.2001 },
            { name: "Cyber City, Gurugram, Haryana", lat: 28.4950, lng: 77.0895 },
            { name: "Noida Sector 18, Uttar Pradesh", lat: 28.5708, lng: 77.3261 },

            { name: "Marine Drive, Mumbai, Maharashtra", lat: 18.9438, lng: 72.8234 },
            { name: "Bandra West, Mumbai, Maharashtra", lat: 19.0596, lng: 72.8295 },
            { name: "Andheri East, Mumbai, Maharashtra", lat: 19.1136, lng: 72.8697 },
            { name: "Kothrud, Pune, Maharashtra", lat: 18.5074, lng: 73.8077 },
            { name: "Hinjewadi IT Park, Pune, Maharashtra", lat: 18.5912, lng: 73.7389 },

            { name: "MG Road, Bengaluru, Karnataka", lat: 12.9756, lng: 77.6066 },
            { name: "Indiranagar, Bengaluru, Karnataka", lat: 12.9784, lng: 77.6408 },
            { name: "Koramangala, Bengaluru, Karnataka", lat: 12.9352, lng: 77.6245 },
            { name: "Whitefield, Bengaluru, Karnataka", lat: 12.9698, lng: 77.7499 },
            { name: "T Nagar, Chennai, Tamil Nadu", lat: 13.0418, lng: 80.2341 },
            { name: "Anna Nagar, Chennai, Tamil Nadu", lat: 13.0850, lng: 80.2101 },

            { name: "Park Street, Kolkata, West Bengal", lat: 22.5532, lng: 88.3524 },
            { name: "Salt Lake Sector V, Kolkata, West Bengal", lat: 22.5726, lng: 88.4331 },
            { name: "Navrangpura, Ahmedabad, Gujarat", lat: 23.0368, lng: 72.5613 },
            { name: "SG Highway, Ahmedabad, Gujarat", lat: 23.0487, lng: 72.5085 }
        ];

        setTimeout(() => {
            if (typeof L !== 'undefined') {
                const map = L.map('picker-map-container').setView([currentLat, currentLng], 14);
                L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);

                const marker = L.marker([currentLat, currentLng], { draggable: true }).addTo(map);

                map.on('click', (e) => {
                    marker.setLatLng(e.latlng);
                });

                setTimeout(() => map.invalidateSize(), 200);

                const searchInput = modal.querySelector('#areaSearchInput');
                const dropdown = modal.querySelector('#areaSuggestionsList');

                const selectArea = (name, lat, lng) => {
                    searchInput.value = name;
                    dropdown.style.display = 'none';
                    map.setView([lat, lng], 15);
                    marker.setLatLng([lat, lng]);
                };

                const renderSuggestions = (items) => {
                    if (!items || items.length === 0) {
                        dropdown.style.display = 'none';
                        return;
                    }
                    dropdown.innerHTML = items.map(item => `
                        <div class="area-suggestion-item" data-lat="${item.lat}" data-lng="${item.lng}" data-name="${item.name.replace(/"/g, '&quot;')}">
                            <span style="color:var(--danger, #EF4444);">📍</span>
                            <span>${item.name}</span>
                        </div>
                    `).join('');

                    dropdown.style.display = 'block';

                    dropdown.querySelectorAll('.area-suggestion-item').forEach(el => {
                        el.onclick = () => {
                            const lat = parseFloat(el.getAttribute('data-lat'));
                            const lng = parseFloat(el.getAttribute('data-lng'));
                            const name = el.getAttribute('data-name');
                            selectArea(name, lat, lng);
                        };
                    });
                };

                if (searchInput) {
                    searchInput.oninput = (e) => {
                        const val = e.target.value.trim().toLowerCase();
                        if (val.length < 2) {
                            dropdown.style.display = 'none';
                            return;
                        }

                        const matches = areaDatabase.filter(a => a.name.toLowerCase().includes(val));
                        renderSuggestions(matches);
                    };

                    searchInput.onfocus = () => {
                        const val = searchInput.value.trim().toLowerCase();
                        if (val.length >= 2) {
                            const matches = areaDatabase.filter(a => a.name.toLowerCase().includes(val));
                            renderSuggestions(matches);
                        }
                    };
                }
            }
        }, 100);

        modal.innerHTML = `
            <div style="background: var(--bg-surface-solid); padding: 24px; border-radius: 18px; width: 100%; max-width: 520px; border: 1px solid var(--border-color); box-shadow: 0 25px 60px rgba(0,0,0,0.7); position:relative;">
                <h3 style="margin-top:0; margin-bottom:8px; font-size:1.15rem; display:flex; justify-content:space-between; align-items:center;">
                    <span>📍 Pinpoint Emergency Location</span>
                    <button id="closePickerBtn" style="background:none; border:none; color:var(--text-secondary); cursor:pointer; font-size:1.4rem;">✕</button>
                </h3>
                <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:12px;">
                    Search area or drag marker to set precise coordinates.
                </p>

                <div style="position:relative; margin-bottom:12px;">
                    <input type="text" id="areaSearchInput" class="search-input" placeholder="Search city or area (e.g. Banjara Hills, Jubilee Hills)..." style="width:100%; padding:0.6rem 0.85rem; font-size:0.85rem;" autocomplete="off">
                    <div id="areaSuggestionsList" class="glass-panel" style="display:none; position:absolute; top:100%; left:0; right:0; z-index:999999; max-height:200px; overflow-y:auto; border-radius:var(--radius-md); border:1px solid var(--border-color); background:var(--bg-surface-solid); margin-top:4px;"></div>
                </div>

                <div id="picker-map-container" style="height:260px; width:100%; border-radius:var(--radius-md); margin-bottom:16px;"></div>

                <div style="display:flex; justify-content:flex-end; gap:0.75rem;">
                    <button class="btn btn-secondary btn-sm" id="cancelPickerBtn">Cancel</button>
                    <button class="btn btn-primary btn-sm" id="confirmPickerBtn">Confirm Location</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('#closePickerBtn').onclick = () => modal.remove();
        modal.querySelector('#cancelPickerBtn').onclick = () => modal.remove();

        modal.querySelector('#confirmPickerBtn').onclick = () => {
            if (window._lastPickerMarker) {
                const pos = window._lastPickerMarker.getLatLng();
                this.location = { lat: pos.lat, lng: pos.lng, accuracy: 5.0 };
                this.isManualLocation = true;
                this.locationType = "🎯 PINPOINT ACCURATE";
                this.renderLocationBadge("🎯 PINPOINT ACCURATE", 5.0);

                window.ResQNotify.toast({
                    type: 'success',
                    title: 'Location Set',
                    message: `Coordinates set to (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)})`
                });
            }
            modal.remove();
        };
    }

    bindCategorySelection() {
        const categoryCards = document.querySelectorAll('.category-card');
        categoryCards.forEach(card => {
            card.addEventListener('click', () => {
                categoryCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');

                this.selectedCategory = card.getAttribute('data-category-name') || card.querySelector('.category-card-name').innerText;
                this.selectedIcon = card.getAttribute('data-icon') || '🚨';
            });
        });
    }

    bindMainSosButton() {
        const sosBtn = document.getElementById('mainSosBtn');
        if (sosBtn) {
            sosBtn.addEventListener('click', async () => {
                const descriptionText = document.getElementById('sosDescription')?.value || '';

                if (!this.location) {
                    this.setupGeolocation();
                }

                const confirmData = {
                    category: this.selectedCategory,
                    description: descriptionText,
                    location: this.location || { lat: 17.3850, lng: 78.4867, accuracy: 100 }
                };

                const confirmed = await window.ResQNotify.sosConfirm(confirmData);
                if (confirmed) {
                    this.submitSOS(descriptionText);
                }
            });
        }
    }

    getSelectedServices() {
        const checkboxes = document.querySelectorAll('.service-checkbox:checked');
        const selected = Array.from(checkboxes).map(cb => cb.value);
        if (selected.length === 0) {
            return ["ALL_SERVICES"];
        }
        return selected;
    }

    async submitSOS(description) {
        window.ResQNotify.status({ title: 'Transmitting Emergency SOS', message: 'Securing emergency signal...', progress: 40 });

        const reqServices = this.getSelectedServices();

        const payload = {
            category: this.selectedCategory,
            category_icon: this.selectedIcon,
            latitude: this.location ? this.location.lat : 17.3850,
            longitude: this.location ? this.location.lng : 78.4867,
            accuracy: this.accuracy || 5.0,
            location_type: this.locationType,
            description: description || `${this.selectedCategory} assistance required urgently.`,
            citizen_name: "Citizen Mobile",
            phone: "+91 Mobile Client",
            requested_services: reqServices
        };

        const response = await window.ResQAPI.createSOS(payload);

        if (response.success && response.data) {
            const sosRecord = response.data;
            localStorage.setItem('resqnet_active_sos', sosRecord.id);

            if (response.isOffline || !navigator.onLine) {
                if (window.ResQMesh) {
                    window.ResQMesh.broadcastSOS(payload);
                }

                window.ResQNotify.status({
                    title: '🌐 OFFLINE SOS MESH BROADCASTED!',
                    message: `Saved in IndexedDB & broadcasted via ResQ-Mesh P2P to nearby peers. Tracking ID: <strong>${sosRecord.id}</strong>`,
                    progress: 100
                });
            } else {
                window.ResQNotify.status({
                    title: '🚨 SOS BROADCASTED LIVE!',
                    message: `Emergency signal transmitted to Command Center. Tracking ID: <strong>${sosRecord.id}</strong>`,
                    progress: 100
                });
            }

            setTimeout(() => {
                window.location.href = `/tracking.html?id=${sosRecord.id}`;
            }, 1200);
        } else {
            // Fallback for 0 signal
            if (window.ResQMesh) {
                window.ResQMesh.broadcastSOS(payload);
            }
            window.ResQNotify.toast({
                type: 'warning',
                title: '🌐 RESQ-MESH P2P BROADCAST ACTIVE',
                message: 'No server response. Emergency signal broadcasted to nearby peers via ResQ-Mesh.'
            });
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.ResQCitizen) window.ResQCitizen = new CitizenPortal();
    });
} else {
    if (!window.ResQCitizen) window.ResQCitizen = new CitizenPortal();
}
