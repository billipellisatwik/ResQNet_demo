/**
 * ResQNet GIS Map Manager v2.0
 * High-performance Leaflet integration with Dark Glassmorphic styling,
 * animated radar markers, custom popups, polyline routes, clusters, heatmap, and risk overlays.
 */

class MapManager {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.options = options;
        this.map = null;
        this.layers = {
            sos: null,
            units: null,
            shelters: null,
            hospitals: null,
            zones: null,
            rainfall: null,
            risk: null,
            safePlaces: null,
            routes: null
        };
        this.unitMarkers = {};
        
        if (document.getElementById(containerId)) {
            this.init();
        }
    }

    init() {
        if (typeof L === 'undefined') {
            console.warn('Leaflet library not found');
            return;
        }

        const centerLat = this.options.lat || 17.385;
        const centerLng = this.options.lng || 78.487;
        const zoom = this.options.zoom || 13;

        // Initialize Map
        this.map = L.map(this.containerId, {
            zoomControl: false,
            attributionControl: false
        }).setView([centerLat, centerLng], zoom);

        // Add Zoom Control to top-right
        L.control.zoom({ position: 'topright' }).addTo(this.map);

        // Dark Mode Tile Layer (CartoDB Dark Matter)
        const darkTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            subdomains: 'abcd'
        });

        // Light Mode Tile Layer (CartoDB Positron)
        const lightTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            subdomains: 'abcd'
        });

        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        (isDark ? darkTiles : lightTiles).addTo(this.map);

        // Initialize Layer Groups
        this.layers.sos = L.layerGroup().addTo(this.map);
        this.layers.units = L.layerGroup().addTo(this.map);
        this.layers.shelters = L.layerGroup().addTo(this.map);
        this.layers.hospitals = L.layerGroup().addTo(this.map);
        this.layers.zones = L.layerGroup().addTo(this.map);
        this.layers.rainfall = L.layerGroup().addTo(this.map);
        this.layers.risk = L.layerGroup().addTo(this.map);
        this.layers.safePlaces = L.layerGroup().addTo(this.map);
        this.layers.routes = L.layerGroup().addTo(this.map);

        // Layer Control
        const baseMaps = {
            "Dark Tactical Map": darkTiles,
            "Light Standard Map": lightTiles
        };

        const overlayMaps = {
            "🚨 Critical SOS": this.layers.sos,
            "🚑 Rescue Teams": this.layers.units,
            "🏠 Shelters": this.layers.shelters,
            "🏥 Hospitals": this.layers.hospitals,
            "⚠ Disaster Zones": this.layers.zones,
            "🌧 Rainfall Grid": this.layers.rainfall,
            "📍 Safe Places": this.layers.safePlaces
        };

        L.control.layers(baseMaps, overlayMaps, { position: 'topright', collapsed: true }).addTo(this.map);

        // Listen for Theme Changes
        window.addEventListener('theme-changed', (e) => {
            if (e.detail === 'light') {
                this.map.removeLayer(darkTiles);
                lightTiles.addTo(this.map);
            } else {
                this.map.removeLayer(lightTiles);
                darkTiles.addTo(this.map);
            }
        });
    }

    /**
     * Add SOS Emergency Marker with pulsating radar aura
     */
    addSOSMarker(data) {
        if (!this.map) return;

        const isCritical = data.priority === 'CRITICAL';
        const color = isCritical ? '#EF4444' : data.priority === 'HIGH' ? '#F59E0B' : '#3B82F6';

        const iconHtml = `
            <div class="map-radar-marker ${isCritical ? 'critical' : ''}">
                <div class="marker-pulse" style="background: ${color};"></div>
                <div class="marker-core" style="background: ${color};">
                    <span>${data.category_icon || '🚨'}</span>
                </div>
            </div>
        `;

        const customIcon = L.divIcon({
            className: 'custom-leaflet-marker',
            html: iconHtml,
            iconSize: [36, 36],
            iconAnchor: [18, 18]
        });

        const popupContent = `
            <div class="map-popup-card">
                <div class="popup-badge ${data.priority.toLowerCase()}">${data.priority}</div>
                <h3>${data.category}</h3>
                <p><strong>ID:</strong> ${data.id}</p>
                <p><strong>Description:</strong> ${data.description || 'N/A'}</p>
                <p><strong>Status:</strong> <span class="popup-status">${data.status}</span></p>
                <div class="popup-actions">
                    <button class="btn btn-sm btn-primary" onclick="window.ResQDashboard?.openDispatchModal('${data.id}')">Dispatch Rescue</button>
                </div>
            </div>
        `;

        const marker = L.marker([data.latitude, data.longitude], { icon: customIcon }).bindPopup(popupContent);
        this.layers.sos.addLayer(marker);

        if (isCritical) {
            // Add geographic risk circle
            const riskCircle = L.circle([data.latitude, data.longitude], {
                radius: 400,
                color: color,
                fillColor: color,
                fillOpacity: 0.15,
                weight: 1.5,
                dashArray: '4, 4'
            });
            this.layers.risk.addLayer(riskCircle);
        }
    }

    /**
     * Add Rescue Unit Marker
     */
    addRescueUnitMarker(unit) {
        if (!this.map) return;

        const iconHtml = `
            <div class="map-unit-marker ${unit.status.toLowerCase()}">
                <div class="unit-core">
                    <span>${unit.icon || '🚑'}</span>
                </div>
            </div>
        `;

        const customIcon = L.divIcon({
            className: 'custom-leaflet-marker',
            html: iconHtml,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });

        const popupContent = `
            <div class="map-popup-card">
                <div class="popup-badge info">${unit.status}</div>
                <h3>${unit.name}</h3>
                <p><strong>Type:</strong> ${unit.type}</p>
                <p><strong>Assigned Incident:</strong> ${unit.assigned_incident_id || 'None'}</p>
            </div>
        `;

        const marker = L.marker([unit.location.lat, unit.location.lng], { icon: customIcon }).bindPopup(popupContent);
        this.layers.units.addLayer(marker);
        this.unitMarkers[unit.id] = marker;
    }

    /**
     * Animate Rescue Unit along a Polyline Route
     */
    animateUnitAlongRoute(unitId, waypoints, durationMs = 8000) {
        const marker = this.unitMarkers[unitId];
        if (!marker || !waypoints || waypoints.length < 2) return;

        // Draw animated Polyline Route
        const routeLine = L.polyline(waypoints, {
            color: '#06B6D4',
            weight: 4,
            opacity: 0.8,
            dashArray: '8, 8',
            className: 'animated-route-line'
        }).addTo(this.layers.routes);

        let start = null;
        const totalPoints = waypoints.length;

        const step = (timestamp) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / durationMs, 1);

            // Interpolate position
            const currentIndex = Math.floor(progress * (totalPoints - 1));
            const nextIndex = Math.min(currentIndex + 1, totalPoints - 1);
            const segmentProgress = (progress * (totalPoints - 1)) - currentIndex;

            const currentPoint = waypoints[currentIndex];
            const nextPoint = waypoints[nextIndex];

            const lat = currentPoint[0] + (nextPoint[0] - currentPoint[0]) * segmentProgress;
            const lng = currentPoint[1] + (nextPoint[1] - currentPoint[1]) * segmentProgress;

            marker.setLatLng([lat, lng]);

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                setTimeout(() => this.layers.routes.removeLayer(routeLine), 3000);
            }
        };

        requestAnimationFrame(step);
    }

    /**
     * Add Disaster Polygon Zone
     */
    addDisasterZone(polygonPoints, zoneInfo) {
        if (!this.map) return;

        const colorMap = {
            'EXTREME': '#8B5CF6',
            'VERY HIGH': '#EF4444',
            'HIGH': '#F59E0B',
            'MODERATE': '#3B82F6',
            'LOW': '#10B981'
        };

        const color = colorMap[zoneInfo.risk_level] || '#EF4444';

        const polygon = L.polygon(polygonPoints, {
            color: color,
            fillColor: color,
            fillOpacity: 0.25,
            weight: 2,
            dashArray: '5, 5'
        }).bindPopup(`<b>${zoneInfo.name}</b><br>Risk Level: ${zoneInfo.risk_level}<br>Rainfall: ${zoneInfo.rainfall_mm}mm`);

        this.layers.zones.addLayer(polygon);
    }

    clearAll() {
        if (!this.map) return;
        Object.values(this.layers).forEach(layer => layer && layer.clearLayers());
    }
}

// Add Custom Map CSS Styles dynamically
const mapStyles = document.createElement('style');
mapStyles.textContent = `
.map-radar-marker {
    position: relative;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
}
.map-radar-marker .marker-core {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.9rem;
    box-shadow: 0 0 12px currentColor;
    z-index: 2;
}
.map-radar-marker .marker-pulse {
    position: absolute;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    opacity: 0.6;
    animation: map-pulse 1.8s infinite cubic-bezier(0, 0.2, 0.8, 1);
}
@keyframes map-pulse {
    0% { transform: scale(0.6); opacity: 0.9; }
    100% { transform: scale(1.8); opacity: 0; }
}
.map-unit-marker .unit-core {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #1E293B;
    border: 2px solid #06B6D4;
    box-shadow: 0 0 10px rgba(6, 182, 212, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
}
.leaflet-popup-content-wrapper {
    background: #111827 !important;
    color: #F8FAFC !important;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px !important;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5) !important;
}
.leaflet-popup-tip {
    background: #111827 !important;
}
.map-popup-card {
    padding: 0.25rem;
}
.map-popup-card h3 {
    font-size: 1.05rem;
    margin-bottom: 0.35rem;
}
.popup-badge {
    display: inline-block;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 700;
    margin-bottom: 0.4rem;
}
.popup-badge.critical { background: rgba(239, 68, 68, 0.2); color: #EF4444; border: 1px solid #EF4444; }
.popup-badge.info { background: rgba(6, 182, 212, 0.2); color: #06B6D4; border: 1px solid #06B6D4; }
`;
document.head.appendChild(mapStyles);

window.ResQMap = MapManager;
