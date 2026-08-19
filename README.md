# RESQNET — Intelligent Real-Time Emergency Response & Disaster Management Platform

> **"One Signal. One Network. Faster Rescue."**

ResQNet is an intelligent emergency-response and disaster-management platform designed to connect:
**Citizens → Emergency Command Center → Rescue Teams → Shelters → Emergency Resources**

---

## 🌟 Key Features

1. **🚨 Offline-First SOS Emergency Signaling**
   - High-contrast, mobile-first SOS trigger with live GPS detection.
   - Offline queueing using **IndexedDB** & **Service Worker** fallback. Automatically synchronizes when connectivity is restored.
   - Device SMS (`sms:`) and Phone call (`tel:`) fallback links.

2. **⚡ Real-Time Emergency Command Center**
   - Dark-mode glassmorphic interface for emergency dispatchers.
   - Real-time updates via **FastAPI WebSockets** (no page refresh required).
   - Automated priority calculation engine (Critical, High, Medium, Low).
   - Smart rescue unit recommendation scoring algorithm based on proximity, capability, and availability.

3. **🌦 ResQ Weather Intelligence & Rainfall Forecasting**
   - Integrated with **Open-Meteo API** (free, no API key required).
   - Rainfall forecasting for 1h, 3h, 6h, 12h, 24h, 3d, and 7d horizons.
   - Prototype configurable rainfall risk zone classification (Low, Moderate, High, Very High, Extreme).
   - Interactive Weather Timeline slider updating map layers dynamically.

4. **📍 Interactive Multi-Layer GIS Maps**
   - Built with **Leaflet.js** and OpenStreetMap tiles (no API keys required).
   - Layers: SOS Markers, Rescue Units, Shelters, Hospitals, Disaster Zones, Rainfall Risk Overlay, Safe Places.
   - Dynamic marker clustering (`Leaflet.markercluster`), heatmap density visualization (`leaflet-heat`), and simulated live rescue unit route movement.

5. **🏠 Safe Place & Evacuation Recommendations**
   - Distance and capacity-aware ranking of relief shelters, hospitals, and high-ground evacuation points.
   - Dynamic re-routing warnings if rainfall/disaster risk changes.

6. **💬 Stunning UI/UX & Custom Confirmation System**
   - Modern glassmorphism design system using pure CSS with Light/Dark mode support.
   - **Custom ResQNotify System**: No plain browser `alert()` or `confirm()`. Features styled glassmorphic confirmation modals, 4 toast alert variants (Critical, Warning, Success, Info), full-screen SOS countdown confirmations, and full-width emergency banners.
   - Multilingual support: English (🇬🇧), Telugu (🇮🇳 తెలుగు), and Hindi (🇮🇳 हिन्दी).

7. **🌊 Disaster Simulation Engine**
   - Run realistic disaster scenarios (Flood, Cyclone, Heavy Rainfall, Urban Flood, Fire, Multi-Incident).
   - Generates simulated SOS calls, rainfall changes, unit dispatch, shelter occupancy, and resource consumption.

8. **🛡 Demo Mode (No Firebase Required)**
   - Complete functionality out of the box with built-in in-memory fallback datasets centered around Hyderabad, India.

---

## 🏗 Technology Stack

- **Frontend**: HTML5, CSS3 (Vanilla Glassmorphic Design System), JavaScript (ES6+ Vanilla Modular).
- **Libraries (CDN)**: Leaflet.js 1.9.4, Leaflet.markercluster, Leaflet.heat, Chart.js 4.4, Lucide Icons, Google Fonts (Inter).
- **Backend**: Python 3.10+, FastAPI, Uvicorn, Pydantic v2, WebSockets.
- **Database**: Firebase Firestore (Optional) / Demo Mode In-Memory Data Store.
- **Weather API**: Open-Meteo Free Public Weather API.
- **PWA**: Service Worker (`service-worker.js`), Web App Manifest (`manifest.json`), IndexedDB offline sync.

---

## 📁 Project Structure

```text
hackathon2/
├── backend/
│   ├── main.py                # FastAPI entry point & WebSocket manager
│   ├── config.py              # Environment configuration & demo settings
│   ├── requirements.txt        # Python dependencies
│   ├── api/                   # REST Endpoints (sos, rescue, weather, analytics, etc.)
│   ├── services/              # Business logic (priority, dispatch, weather, sync)
│   ├── database/              # Firebase & Demo In-memory database engine
│   └── utils/                 # Validation, security, and helper utilities
├── frontend/                  # HTML views (index, citizen, command-center, etc.)
├── css/                       # Modular CSS stylesheets (base, landing, citizen, dashboard, etc.)
├── js/                        # Modular JavaScript files (main, map, weather, offline, simulation, etc.)
├── translations/              # i18n translation dictionaries (en.json, te.json, hi.json)
├── assets/                    # SVG Logo and graphics
├── manifest.json              # PWA manifest
├── service-worker.js          # Service Worker cache logic
├── .env.example               # Environment variables template
└── README.md                  # Documentation
```

---

## 🚀 How to Run the Application

### 1. Requirements
- Python 3.10 or higher installed.

### 2. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 3. Start the FastAPI Backend Server
```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
or from the root folder:
```bash
cd backend
python main.py
```

### 4. Open in Browser
Open your browser and navigate to:
```text
http://localhost:8000/
```

---

## 🔑 Demo Credentials

- **Citizen Portal**: `citizen` / `demo123`
- **Command Center**: `admin` / `admin123`
- **Rescue Team**: `rescue` / `rescue123`

---

## ⚠️ Disclaimer & Terms of Use

> **IMPORTANT NOTICE**: **ResQNet** is a proof-of-concept software prototype developed exclusively for **hackathon demonstrations, academic evaluation, and technical feasibility research**.
>
> 1. **Not an Official Helpline**: ResQNet is **NOT** a replacement for official government emergency helplines or emergency response services (such as **112 / 100 / 101 / 108** in India or **911** internationally). In a real life-threatening emergency, always contact official national emergency services directly.
> 2. **No Operational Guarantee**: The software, off-grid P2P mesh algorithms, radio simulations, and dispatch routing formulas are provided **"AS IS"** without warranties of any kind, express or implied, including but not limited to uptime, network availability, or real-world rescue guarantee.
> 3. **Demonstration Datasets**: All sample data, emergency records, contact numbers (`+91 Mobile`), and map coordinates used within the platform are generic synthetic demonstration datasets created for testing purposes. No real personal data or confidential records are stored or exposed.
> 4. **Production Deployment Requirements**: Any future production deployment would require formal integration with accredited emergency dispatch agencies (NDRF/SDRF), government regulatory approval, end-to-end encryption audits, and certified hardware infrastructure.
