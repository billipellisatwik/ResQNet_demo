/* ==========================================================================
   RESQNET COMMAND CENTER DASHBOARD MANAGER v5.3
   3 Specialized Operational Views with 100% Dynamic Multilingual i18n Translation:
   - Translates Category Titles, Priority Badges, Status Badges, Card Field Labels,
     Filter Tabs, Action Buttons, and Safety Verification Alerts across EN / TE / HI.
   ========================================================================== */

class DashboardManager {
    constructor() {
        this.sosRecords = [];
        this.rescueUnits = [];
        this.shelters = [];
        this.mapManager = null;
        this.fullMapManager = null;
        this.ws = null;
        this.activeView = 'overview';
        this.currentSosFilter = 'all';

        this.init();
    }

    async init() {
        this.bindNavigation();
        this.initMap();
        this.initWebSocket();
        await this.loadInitialData();
        this.bindSearchFilter();
        this.bindSosTabFilters();

        // Listen for site-wide language changes
        window.addEventListener('language-changed', (e) => {
            console.log('🌐 Command Center switching language to:', e.detail);
            this.updateTabLabels();
            this.renderSOSQueue(this.sosRecords);
            this.renderCategorizedSOSGrid(this.sosRecords, this.currentSosFilter);
            this.renderOverviewUnits(this.rescueUnits);
            this.renderOverviewShelters(this.shelters);
            if (window.ResQTranslation) window.ResQTranslation.applyTranslations();
        });
    }

    initMap() {
        if (typeof window.ResQMap !== 'undefined' && document.getElementById('main-map')) {
            this.mapManager = new window.ResQMap('main-map', { lat: 17.3850, lng: 78.4867, zoom: 13 });
        }
    }

    initFullMap() {
        if (typeof window.ResQMap !== 'undefined' && document.getElementById('full-map') && !this.fullMapManager) {
            this.fullMapManager = new window.ResQMap('full-map', { lat: 17.3850, lng: 78.4867, zoom: 13 });
            this.plotSOSOnMap(this.sosRecords, this.fullMapManager);
            this.plotUnitsOnMap(this.rescueUnits, this.fullMapManager);
        } else if (this.fullMapManager) {
            setTimeout(() => {
                this.fullMapManager.map.invalidateSize();
            }, 100);
        }
    }

    recenterMap() {
        if (this.fullMapManager && this.fullMapManager.map) {
            this.fullMapManager.map.setView([17.3850, 78.4867], 13);
        } else if (this.mapManager && this.mapManager.map) {
            this.mapManager.map.setView([17.3850, 78.4867], 13);
        }
    }

    // =========================================================================
    // MULTILINGUAL TRANSLATION DICTIONARY HELPERS
    // =========================================================================

    getCategoryTranslation(cat) {
        const lang = window.ResQTranslation ? window.ResQTranslation.currentLang : 'en';
        const dict = {
            te: {
                "Flood Emergency": "🌊 వరద అత్యవసర పరిస్థితి",
                "Medical Emergency": "🚑 వైద్య అత్యవసర పరిస్థితి",
                "Fire Emergency": "🔥 అగ్ని ప్రమాదం",
                "Person Trapped": "🆘 వ్యక్తి చిక్కుకున్నాడు",
                "Building Collapse": "🏢 భవనం కూలిపోయింది",
                "Food / Water Shortage": "🍲 ఆహారం / నీటి కొరత",
                "General Emergency": "🚨 సాధారణ అత్యవసర పరిస్థితి"
            },
            hi: {
                "Flood Emergency": "🌊 बाढ़ आपातकाल",
                "Medical Emergency": "🚑 चिकित्सा आपातकाल",
                "Fire Emergency": "🔥 अग्नि आपातकाल",
                "Person Trapped": "🆘 फंसा हुआ व्यक्ति",
                "Building Collapse": "🏢 इमारत ढहना",
                "Food / Water Shortage": "🍲 भोजन / पानी की कमी",
                "General Emergency": "🚨 सामान्य आपातकाल"
            }
        };
        if (dict[lang] && dict[lang][cat]) return dict[lang][cat];
        return cat;
    }

    getPriorityTranslation(prio) {
        const lang = window.ResQTranslation ? window.ResQTranslation.currentLang : 'en';
        const dict = {
            te: {
                "CRITICAL": "అత్యంత అనివార్యం",
                "HIGH": "అధిక ప్రాధాన్యత",
                "MEDIUM": "మధ్యస్థ ప్రాధాన్యత",
                "LOW": "తక్కువ ప్రాధాన్యత"
            },
            hi: {
                "CRITICAL": "अत्यंत गंभीर",
                "HIGH": "उच्च प्राथमिकता",
                "MEDIUM": "मध्यम प्राथमिकता",
                "LOW": "कम प्राथमिकता"
            }
        };
        if (dict[lang] && dict[lang][prio]) return dict[lang][prio];
        return `${prio} PRIORITY`;
    }

    getStatusTranslation(status) {
        const lang = window.ResQTranslation ? window.ResQTranslation.currentLang : 'en';
        const dict = {
            te: {
                "pending": "స్వీకరించబడింది",
                "assigned": "కేటాయించబడింది",
                "dispatched": "బయలుదేరారు",
                "en_route": "రవాణాలో ఉన్నారు",
                "reached": "చేరుకున్నారు",
                "citizen_reported_rescued": "సహాయం పొందినట్లు నివేదిక",
                "safe": "సురక్షితం",
                "resolved": "పరిష్కరించబడింది",
                "completed": "పూర్తయింది"
            },
            hi: {
                "pending": "प्राप्त",
                "assigned": "आवंटित",
                "dispatched": "रवाना",
                "en_route": "मार्ग में",
                "reached": "पहुंच गए",
                "citizen_reported_rescued": "नागरिक रिपोर्ट सुरक्षित",
                "safe": "सुरक्षित",
                "resolved": "हल हुआ",
                "completed": "पूरा हुआ"
            }
        };
        const key = status ? status.toLowerCase() : 'pending';
        if (dict[lang] && dict[lang][key]) return dict[lang][key].toUpperCase();
        return status ? status.toUpperCase() : 'RECEIVED';
    }

    getLabelTranslation(key) {
        const lang = window.ResQTranslation ? window.ResQTranslation.currentLang : 'en';
        const dict = {
            te: {
                "location": "లొకేషన్",
                "citizen": "పౌరుడు",
                "assignedTeam": "కేటాయించిన బృందం",
                "status": "స్థితి",
                "dispatchNearest": "⚡ సమీప రక్షణ బృందాన్ని పంపు",
                "reassignTeam": "🔄 బృందాన్ని మళ్లీ కేటాయించు",
                "markReached": "📍 చేరుకున్నారని మార్క్ చేయి",
                "markSafe": "🟢 సురక్షితంగా మార్క్ చేయి",
                "rescuedByOthers": "ఇతరులచే రక్షించబడ్డారు",
                "rescuedByResQNet": "ResQNet బృందంచే రక్షించబడ్డారు",
                "citizenReport": "⚠️ పౌరుడి నివేదిక",
                "citizenReportText": "తాము ఇప్పటికే రక్షించబడ్డామని పౌరుడు తెలిపారు. పరిశీలన అవసరం.",
                "contactCitizen": "📞 పౌరుడిని సంప్రదించు",
                "confirmRescuedByOthers": "✅ ఇతరులచే రక్షణ ధృవీకరించు",
                "personStillNeedsHelp": "🚨 ఇప్పటికీ సహాయం కావాలి",
                "safeTag": "🟢 సురక్షితం",
                "allSos": "📋 అన్ని SOS",
                "received": "📥 స్వీకరించబడినవి",
                "onProgress": "🚑 పురోగతిలో ఉన్నవి",
                "completed": "✅ పూర్తయినవి"
            },
            hi: {
                "location": "स्थान",
                "citizen": "नागरिक",
                "assignedTeam": "आवंटित टीम",
                "status": "स्थिति",
                "dispatchNearest": "⚡ निकटतम टीम रवाना करें",
                "reassignTeam": "🔄 पुनः टीम आवंटित करें",
                "markReached": "📍 पहुंचने की पुष्टि करें",
                "markSafe": "🟢 सुरक्षित की पुष्टि करें",
                "rescuedByOthers": "दूसरों द्वारा बचाया गया",
                "rescuedByResQNet": "ResQNet टीम द्वारा बचाया गया",
                "citizenReport": "⚠️ नागरिक रिपोर्ट",
                "citizenReportText": "नागरिक ने बताया है कि उन्हें बचा लिया गया है। सत्यापन आवश्यक है।",
                "contactCitizen": "📞 नागरिक से संपर्क करें",
                "confirmRescuedByOthers": "✅ दूसरों द्वारा बचाव की पुष्टि करें",
                "personStillNeedsHelp": "🚨 अभी भी सहायता चाहिए",
                "safeTag": "🟢 सुरक्षित",
                "allSos": "📋 सभी एसओएस",
                "received": "📥 प्राप्त",
                "onProgress": "🚑 प्रगति में",
                "completed": "✅ पूरा हुआ"
            }
        };
        if (dict[lang] && dict[lang][key]) return dict[lang][key];

        const englishDefaults = {
            "location": "Location",
            "citizen": "Citizen",
            "assignedTeam": "Assigned Team",
            "status": "STATUS",
            "dispatchNearest": "⚡ DISPATCH NEAREST RESCUE TEAM",
            "reassignTeam": "🔄 RE-ASSIGN TEAM",
            "markReached": "📍 Mark Person Reached",
            "markSafe": "🟢 Mark Person Safe",
            "rescuedByOthers": "Rescued by Others",
            "rescuedByResQNet": "Rescued by ResQNet Team",
            "citizenReport": "⚠️ CITIZEN REPORT",
            "citizenReportText": "The citizen reports that they have already been rescued. Verification Required.",
            "contactCitizen": "📞 Contact Citizen",
            "confirmRescuedByOthers": "✅ Confirm Rescued by Others",
            "personStillNeedsHelp": "🚨 Person Still Needs Help",
            "safeTag": "🟢 SAFE",
            "allSos": "📋 All SOS",
            "received": "📥 Received",
            "onProgress": "🚑 On Progress",
            "completed": "✅ Completed"
        };
        return englishDefaults[key] || key;
    }

    updateTabLabels() {
        const btnAll = document.getElementById('tab-btn-all');
        const btnRec = document.getElementById('tab-btn-received');
        const btnProg = document.getElementById('tab-btn-progress');
        const btnComp = document.getElementById('tab-btn-completed');

        const cAll = document.getElementById('count-tab-all')?.innerText || '0';
        const cRec = document.getElementById('count-tab-received')?.innerText || '0';
        const cProg = document.getElementById('count-tab-progress')?.innerText || '0';
        const cComp = document.getElementById('count-tab-completed')?.innerText || '0';

        if (btnAll) btnAll.innerHTML = `${this.getLabelTranslation('allSos')} (<span id="count-tab-all">${cAll}</span>)`;
        if (btnRec) btnRec.innerHTML = `${this.getLabelTranslation('received')} (<span id="count-tab-received">${cRec}</span>)`;
        if (btnProg) btnProg.innerHTML = `${this.getLabelTranslation('onProgress')} (<span id="count-tab-progress">${cProg}</span>)`;
        if (btnComp) btnComp.innerHTML = `${this.getLabelTranslation('completed')} (<span id="count-tab-completed">${cComp}</span>)`;
    }

    initWebSocket() {
        if (window.ResQWebSocket) {
            const cid = 'eoc_laptop_' + Math.random().toString(36).substr(2, 6);
            this.ws = new window.ResQWebSocket('command_center', cid);

            this.ws.on('connection', status => {
                const indicator = document.querySelector('.nav-controls .live-dot');
                if (indicator) {
                    indicator.className = status.status === 'connected' ? 'live-dot green' : 'live-dot red';
                }
            });

            this.ws.on('sos_created', (sosData) => {
                console.log('⚡ Real-time SOS created:', sosData);
                this.addActivityLog('INCIDENT BROADCAST', `🚨 New SOS Received: ${sosData.category} (${sosData.id})`, `Location: ${sosData.location_type || 'GPS ACCURATE'} • Nearest: ${sosData.nearest_unit_name || 'NDRF Team'}`, 'var(--danger)');
                this.handleRealtimeSOS(sosData);
            });

            this.ws.on('location_update', (locData) => {
                this.handleRealtimeLocation(locData);
            });

            this.ws.on('status_update', (statusData) => {
                console.log('🔄 Real-time status update:', statusData);
                this.handleRealtimeStatus(statusData);
            });

            this.ws.on('team_reached', (data) => {
                window.ResQNotify.toast({
                    type: 'info',
                    title: '📍 TEAM REACHED CITIZEN',
                    message: `Team has reached SOS <strong>${data.id}</strong>.`
                });
                this.addActivityLog('TEAM MOVEMENT', `📍 Rescue Team Reached Citizen (${data.id})`, `On scene & initiating evacuation`, 'var(--info)');
                this.loadInitialData();
            });

            this.ws.on('person_safe', (data) => {
                window.ResQNotify.toast({
                    type: 'success',
                    title: '🟢 PERSON RESCUED & SAFE',
                    message: `SOS <strong>${data.id}</strong> completed by ResQNet team.`
                });
                this.addActivityLog('RESCUE COMPLETED', `🟢 Person Rescued by ResQNet Team (${data.id})`, `Outcome: RESCUED_BY_RESQNET_TEAM • Team released`, 'var(--success)');
                this.loadInitialData();
            });

            this.ws.on('citizen_reported_rescued', (data) => {
                window.ResQNotify.toast({
                    type: 'warning',
                    title: '⚠️ CITIZEN SAFETY REPORT',
                    message: `SOS <strong>${data.id}</strong> reports already rescued by others. Verification required!`
                });
                this.addActivityLog('CITIZEN REPORT', `⚠️ Citizen Reports Rescued by Others (${data.id})`, `Verification Required by EOC Dispatcher`, 'var(--warning)');
                this.loadInitialData();
            });

            this.ws.on('rescued_by_others_confirmed', (data) => {
                window.ResQNotify.toast({
                    type: 'success',
                    title: '🟢 CONFIRMED RESCUED BY OTHERS',
                    message: `SOS <strong>${data.id}</strong> closed. Assigned team released to AVAILABLE.`
                });
                this.addActivityLog('VERIFICATION COMPLETE', `🟢 Confirmed Rescued by Others (${data.id})`, `Outcome: RESCUED_BY_OTHERS • Team released`, 'var(--success)');
                this.loadInitialData();
            });

            this.ws.on('rescue_dispatched', (dispatchData) => {
                console.log('🚑 Real-time unit dispatched:', dispatchData);
                this.addActivityLog('UNIT DISPATCHED', `🚑 ${dispatchData.unit_name} Dispatched to ${dispatchData.incident_id}`, `ETA: ${dispatchData.eta_minutes} mins • Distance: ${dispatchData.distance_km} km`, 'var(--info)');
                if (this.mapManager && dispatchData.waypoints) {
                    this.mapManager.animateUnitAlongRoute(dispatchData.unit_id, dispatchData.waypoints);
                }
                if (this.fullMapManager && dispatchData.waypoints) {
                    this.fullMapManager.animateUnitAlongRoute(dispatchData.unit_id, dispatchData.waypoints);
                }
            });
        }
    }

    async loadInitialData() {
        try {
            const sosRes = await window.ResQAPI.getSOSList();
            if (sosRes.success && sosRes.data) {
                this.sosRecords = sosRes.data;
                this.renderSOSQueue(this.sosRecords);
                this.renderCategorizedSOSGrid(this.sosRecords, this.currentSosFilter);
                this.plotSOSOnMap(this.sosRecords, this.mapManager);
                if (this.fullMapManager) this.plotSOSOnMap(this.sosRecords, this.fullMapManager);
            }

            const unitRes = await window.ResQAPI.getRescueUnits();
            if (unitRes.success && unitRes.data) {
                this.rescueUnits = unitRes.data;
                this.renderOverviewUnits(this.rescueUnits);
                this.plotUnitsOnMap(this.rescueUnits, this.mapManager);
                if (this.fullMapManager) this.plotUnitsOnMap(this.rescueUnits, this.fullMapManager);
            }

            const shelterRes = await window.ResQAPI.getShelters();
            if (shelterRes.success && shelterRes.data) {
                this.shelters = shelterRes.data;
                this.renderOverviewShelters(this.shelters);
            }

            this.updateStats();
            this.updateTabLabels();

            if (window.ResQTranslation) window.ResQTranslation.applyTranslations();
        } catch (e) {
            console.error('Error loading command center data:', e);
        }
    }

    switchView(viewName) {
        this.activeView = viewName;

        const viewOverview = document.getElementById('view-overview');
        const viewLiveMap = document.getElementById('view-live-map');
        const viewLiveSos = document.getElementById('view-live-sos');

        if (viewOverview) viewOverview.style.display = 'none';
        if (viewLiveMap) viewLiveMap.style.display = 'none';
        if (viewLiveSos) viewLiveSos.style.display = 'none';

        if (viewName === 'overview') {
            if (viewOverview) viewOverview.style.display = 'block';
            if (this.mapManager && this.mapManager.map) {
                setTimeout(() => this.mapManager.map.invalidateSize(), 150);
            }
        } else if (viewName === 'live-map') {
            if (viewLiveMap) viewLiveMap.style.display = 'block';
            this.initFullMap();
            if (this.fullMapManager && this.fullMapManager.map) {
                setTimeout(() => this.fullMapManager.map.invalidateSize(), 150);
            }
        } else if (viewName === 'live-sos') {
            if (viewLiveSos) viewLiveSos.style.display = 'block';
            this.renderCategorizedSOSGrid(this.sosRecords, this.currentSosFilter);
        }

        if (window.ResQTranslation) window.ResQTranslation.applyTranslations();
    }

    addActivityLog(type, title, detail, colorHex) {
        const container = document.getElementById('overviewActivityLog');
        if (!container) return;

        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const logItem = document.createElement('div');
        logItem.className = 'glass-panel';
        logItem.style.cssText = `padding:0.9rem; border-left:4px solid ${colorHex || 'var(--primary)'};`;

        logItem.innerHTML = `
            <div style="font-size:0.725rem; color:var(--text-secondary); display:flex; justify-content:space-between;">
                <span>${type}</span>
                <span>${timeStr}</span>
            </div>
            <div style="font-weight:800; font-size:0.875rem; margin-top:0.25rem;">${title}</div>
            <div style="font-size:0.785rem; color:var(--text-secondary);">${detail}</div>
        `;

        container.insertBefore(logItem, container.firstChild);
        if (container.children.length > 20) {
            container.removeChild(container.lastChild);
        }
    }

    renderOverviewUnits(units) {
        const container = document.getElementById('overviewUnitsMeters');
        if (!container) return;

        container.innerHTML = units.slice(0, 4).map(u => {
            const isAvail = u.status === 'available';
            const badgeBg = isAvail ? 'var(--success-bg)' : 'var(--warning-bg)';
            const badgeColor = isAvail ? 'var(--success)' : 'var(--warning)';
            const statusStr = this.getStatusTranslation(u.status);

            return `
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-panel); padding:0.75rem 0.85rem; border-radius:var(--radius-md); border:1px solid var(--border-color);">
                    <div>
                        <div style="font-weight:800; font-size:0.875rem;">${u.icon || '🚑'} ${u.name}</div>
                        <div style="font-size:0.75rem; color:var(--text-secondary);">${u.type} &bull; ${u.contact || 'EOC Line'}</div>
                    </div>
                    <span class="badge-tag" style="background:${badgeBg}; color:${badgeColor}; border:1px solid ${badgeColor}; text-transform:uppercase;">${statusStr}</span>
                </div>
            `;
        }).join('');

        if (window.ResQTranslation) window.ResQTranslation.applyTranslations();
    }

    renderOverviewShelters(shelters) {
        const container = document.getElementById('overviewShelterMeters');
        if (!container) return;

        container.innerHTML = shelters.slice(0, 3).map(s => {
            const pct = Math.min(100, Math.round((s.occupancy / s.capacity) * 100));
            const barColor = pct > 80 ? 'var(--warning)' : 'var(--success)';

            return `
                <div style="background:var(--bg-panel); padding:0.75rem 0.85rem; border-radius:var(--radius-md); border:1px solid var(--border-color);">
                    <div style="display:flex; justify-content:space-between; font-size:0.825rem; font-weight:700; margin-bottom:0.35rem;">
                        <span>${s.name}</span>
                        <span>${s.occupancy} / ${s.capacity} (${s.available_beds} ${this.getLabelTranslation('shelterBeds') || 'Beds Avail'})</span>
                    </div>
                    <div style="height:7px; background:rgba(255,255,255,0.1); border-radius:999px; overflow:hidden;">
                        <div style="height:100%; width:${pct}%; background:${barColor}; border-radius:999px;"></div>
                    </div>
                </div>
            `;
        }).join('');

        if (window.ResQTranslation) window.ResQTranslation.applyTranslations();
    }

    handleRealtimeSOS(sosData) {
        window.ResQNotify.playSound('critical');

        const nearestInfo = sosData.nearest_unit_name ? `<br><strong>Nearest Team:</strong> ${sosData.nearest_unit_name} (${sosData.nearest_unit_distance_km} km away)` : '';

        window.ResQNotify.toast({
            type: 'critical',
            title: `🚨 NEW EMERGENCY SOS: ${sosData.category.toUpperCase()}`,
            message: `<strong>ID:</strong> ${sosData.id} &bull; <strong>Loc:</strong> ${sosData.location_type}${nearestInfo}<br>${sosData.description}`,
            sound: true,
            duration: 8000
        });

        const existingIdx = this.sosRecords.findIndex(s => s.id === sosData.id);
        if (existingIdx >= 0) {
            this.sosRecords[existingIdx] = sosData;
        } else {
            this.sosRecords.unshift(sosData);
        }

        this.renderSOSQueue(this.sosRecords);
        this.renderCategorizedSOSGrid(this.sosRecords, this.currentSosFilter);

        if (this.mapManager) this.mapManager.addSOSMarker(sosData);
        if (this.fullMapManager) this.fullMapManager.addSOSMarker(sosData);

        this.updateStats();
    }

    handleRealtimeLocation(locData) {
        const item = this.sosRecords.find(s => s.id === locData.id);
        if (item) {
            item.latitude = locData.latitude;
            item.longitude = locData.longitude;
            if (locData.accuracy) item.accuracy = locData.accuracy;
            if (locData.location_type) item.location_type = locData.location_type;

            this.renderSOSQueue(this.sosRecords);
            this.renderCategorizedSOSGrid(this.sosRecords, this.currentSosFilter);

            if (this.mapManager) this.mapManager.addSOSMarker(item);
            if (this.fullMapManager) this.fullMapManager.addSOSMarker(item);
        }
    }

    handleRealtimeStatus(statusData) {
        const item = this.sosRecords.find(s => s.id === statusData.id);
        if (item) {
            item.status = statusData.status;
            if (statusData.assigned_unit) item.assigned_unit = statusData.assigned_unit;
            if (statusData.outcome) item.outcome = statusData.outcome;
            this.renderSOSQueue(this.sosRecords);
            this.renderCategorizedSOSGrid(this.sosRecords, this.currentSosFilter);
            this.updateStats();
        }
    }

    plotSOSOnMap(records, targetMapManager) {
        const mapMgr = targetMapManager || this.mapManager;
        if (!mapMgr) return;
        records.forEach(r => mapMgr.addSOSMarker(r));
    }

    plotUnitsOnMap(units, targetMapManager) {
        const mapMgr = targetMapManager || this.mapManager;
        if (!mapMgr) return;
        units.forEach(u => mapMgr.addRescueUnitMarker(u));
    }

    updateStats() {
        const activeSos = this.sosRecords.filter(s => s.status !== 'safe' && s.status !== 'resolved' && s.status !== 'completed').length;
        const criticalSos = this.sosRecords.filter(s => s.priority === 'CRITICAL' && s.status !== 'safe' && s.status !== 'resolved').length;
        const dispatchedUnits = this.rescueUnits.filter(u => u.status === 'busy' || u.status === 'dispatched').length;
        const openShelters = this.shelters.filter(s => s.status === 'Open').length;

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        };

        setVal('stat-active-sos', activeSos);
        setVal('stat-critical-sos', criticalSos);
        setVal('stat-units', dispatchedUnits);
        setVal('stat-shelters', openShelters);

        const sidebarCount = document.getElementById('sidebar-sos-count');
        if (sidebarCount) sidebarCount.innerText = activeSos;

        const receivedCount = this.sosRecords.filter(s => s.status === 'pending' || !s.status || s.status === 'offline_queued').length;
        const progressCount = this.sosRecords.filter(s => s.status === 'assigned' || s.status === 'dispatched' || s.status === 'en_route' || s.status === 'reached' || s.status === 'citizen_reported_rescued').length;
        const completedCount = this.sosRecords.filter(s => s.status === 'safe' || s.status === 'resolved' || s.status === 'completed').length;

        setVal('count-tab-all', this.sosRecords.length);
        setVal('count-tab-received', receivedCount);
        setVal('count-tab-progress', progressCount);
        setVal('count-tab-completed', completedCount);

        this.updateTabLabels();
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

    renderSOSQueue(records) {
        const container = document.getElementById('sosListContainer');
        if (!container) return;

        if (!records || records.length === 0) {
            container.innerHTML = `<div style="padding:2rem; text-align:center; color:var(--text-secondary);" data-i18n="dashboard.noResults">No active emergency signals</div>`;
            return;
        }

        const lblLoc = this.getLabelTranslation('location');
        const lblCitizen = this.getLabelTranslation('citizen');
        const lblAssigned = this.getLabelTranslation('assignedTeam');
        const lblDispatch = this.getLabelTranslation('dispatchNearest');
        const lblReassign = this.getLabelTranslation('reassignTeam');
        const lblMarkReached = this.getLabelTranslation('markReached');
        const lblMarkSafe = this.getLabelTranslation('markSafe');
        const lblRescuedByOthers = this.getLabelTranslation('rescuedByOthers');
        const lblRescuedByResQNet = this.getLabelTranslation('rescuedByResQNet');

        container.innerHTML = records.map(s => {
            const priorityClass = s.priority === 'CRITICAL' ? 'danger' : s.priority === 'HIGH' ? 'warning' : 'info';
            const priorityText = this.getPriorityTranslation(s.priority);
            const categoryText = this.getCategoryTranslation(s.category);
            const locTypeBadge = s.location_type || 'GPS ACCURATE';
            const statusLabel = this.getStatusTranslation(s.status);
            const isSafe = s.status === 'safe' || s.status === 'resolved' || s.status === 'completed';
            const isReportedRescued = s.status === 'citizen_reported_rescued' || s.verification_required;

            const unitObj = this.rescueUnits.find(u => u.id === s.assigned_unit || u.name === s.assigned_unit);
            const assignedUnitName = s.assigned_unit_name || (unitObj ? unitObj.name : s.assigned_unit || 'Team Alpha');

            const urgencyBadgeHtml = s.urgency_badge ? `
                <div style="background:${s.is_all_services !== false ? 'rgba(239,68,68,0.18)' : 'rgba(6,182,212,0.15)'}; border:1px solid ${s.is_all_services !== false ? 'var(--danger)' : 'var(--cyan)'}; color:${s.is_all_services !== false ? '#FF5252' : 'var(--cyan)'}; font-size:0.75rem; font-weight:800; padding:0.35rem 0.6rem; border-radius:var(--radius-sm); margin-bottom:0.5rem; display:flex; align-items:center; gap:0.3rem;">
                    <span>${s.urgency_badge}</span>
                </div>
            ` : '';

            return `
                <div class="glass-panel sos-feed-card" style="padding:1.15rem; margin-bottom:0.85rem; border-left:4px solid var(--${priorityClass});">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
                        <div>
                            <span class="badge-tag" style="background:var(--${priorityClass}-bg); color:var(--${priorityClass}); border:1px solid var(--${priorityClass}); font-weight:800;">${priorityText}</span>
                            <span class="badge-tag" style="background:var(--bg-panel); color:var(--text-secondary); margin-left:0.35rem; font-size:0.7rem;">${locTypeBadge}</span>
                        </div>
                        <span style="font-family:var(--font-mono); font-size:0.75rem; color:var(--text-secondary); font-weight:700;">${s.id}</span>
                    </div>

                    ${urgencyBadgeHtml}

                    <h4 style="font-size:1rem; font-weight:800; margin-bottom:0.35rem;">
                        ${categoryText}
                    </h4>

                    <p style="font-size:0.825rem; color:var(--text-secondary); margin-bottom:0.6rem; line-height:1.4;">
                        ${s.description}
                    </p>

                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.775rem; color:var(--text-secondary); margin-bottom:0.85rem;">
                        <span>📍 ${lblLoc}: ${s.latitude.toFixed(4)}, ${s.longitude.toFixed(4)}</span>
                        <span class="badge-tag" style="background:${isSafe ? 'var(--success-bg)' : isReportedRescued ? 'var(--warning-bg)' : 'rgba(255,255,255,0.08)'}; color:${isSafe ? 'var(--success)' : isReportedRescued ? 'var(--warning)' : 'var(--text-primary)'};">${statusLabel}</span>
                    </div>

                    ${isReportedRescued ? `
                        <div style="background:rgba(255,179,0,0.14); border:1px solid var(--warning); border-radius:var(--radius-md); padding:0.75rem; margin-bottom:0.85rem;">
                            <div style="font-weight:900; color:var(--warning); font-size:0.8rem; margin-bottom:0.25rem;">${this.getLabelTranslation('citizenReport')}</div>
                            <div style="font-size:0.75rem; color:var(--text-primary); line-height:1.4;">
                                ${this.getLabelTranslation('citizenReportText')}<br>
                                <strong>${lblAssigned}:</strong> ${assignedUnitName}
                            </div>
                            <div style="display:flex; flex-direction:column; gap:0.35rem; margin-top:0.5rem;">
                                <button class="btn btn-sm btn-secondary" onclick="window.ResQDashboard.contactCitizen('${s.phone}', '${s.id}')">${this.getLabelTranslation('contactCitizen')}</button>
                                <button class="btn btn-sm btn-primary" style="background:var(--success-bg) !important; color:var(--success) !important; border:1px solid var(--success) !important;" onclick="window.ResQDashboard.confirmRescuedByOthers('${s.id}')">${this.getLabelTranslation('confirmRescuedByOthers')}</button>
                                <button class="btn btn-sm btn-secondary" style="border-color:var(--danger); color:var(--danger);" onclick="window.ResQDashboard.reportStillNeedsHelp('${s.id}')">${this.getLabelTranslation('personStillNeedsHelp')}</button>
                            </div>
                        </div>
                    ` : ''}

                    ${isSafe ? 
                        `<div style="font-size:0.8rem; color:var(--success); font-weight:800; text-align:center; padding:0.5rem; background:var(--success-bg); border-radius:var(--radius-md); border:1px solid var(--success);">
                            🟢 ${this.getLabelTranslation('safeTag')} &bull; ${s.outcome === 'RESCUED_BY_OTHERS' ? lblRescuedByOthers : lblRescuedByResQNet}
                        </div>` :
                        `
                        <div style="display:flex; flex-direction:column; gap:0.4rem;">
                            ${(s.status === 'assigned' || s.status === 'dispatched' || s.status === 'en_route') ? `
                                <button class="btn btn-sm btn-secondary" style="border-color:var(--info); color:var(--info);" onclick="window.ResQDashboard.markTeamReached('${s.id}')">
                                    ${lblMarkReached}
                                </button>
                            ` : ''}
                            ${(s.status === 'reached') ? `
                                <button class="btn btn-sm btn-primary" style="background:var(--success-bg) !important; color:var(--success) !important; border:1px solid var(--success) !important;" onclick="window.ResQDashboard.markPersonSafe('${s.id}')">
                                    ${lblMarkSafe}
                                </button>
                            ` : ''}
                            <button class="btn btn-sm btn-primary" style="font-size:0.825rem;" onclick="window.ResQDashboard.openDispatchModal('${s.id}')">
                                <i data-lucide="navigation" style="width:14px;"></i> ${s.assigned_unit ? lblReassign : lblDispatch}
                            </button>
                        </div>
                        `
                    }
                </div>
            `;
        }).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
        if (window.ResQTranslation) window.ResQTranslation.applyTranslations();
    }

    renderCategorizedSOSGrid(records, activeFilter) {
        const container = document.getElementById('fullSosGridContainer');
        if (!container) return;

        let filtered = records;
        if (activeFilter === 'received') {
            filtered = records.filter(s => s.status === 'pending' || !s.status || s.status === 'offline_queued');
        } else if (activeFilter === 'progress') {
            filtered = records.filter(s => s.status === 'assigned' || s.status === 'dispatched' || s.status === 'en_route' || s.status === 'reached' || s.status === 'citizen_reported_rescued');
        } else if (activeFilter === 'completed') {
            filtered = records.filter(s => s.status === 'safe' || s.status === 'resolved' || s.status === 'completed');
        }

        if (!filtered || filtered.length === 0) {
            container.innerHTML = `<div style="grid-column:1/-1; padding:3rem; text-align:center; color:var(--text-secondary); background:var(--bg-surface); border-radius:var(--radius-lg); border:1px solid var(--border-color);">
                <div style="font-size:2rem; margin-bottom:0.5rem;">📭</div>
                <div style="font-weight:800; font-size:1.1rem;" data-i18n="dashboard.noResults">No Emergency Records Found</div>
            </div>`;
            return;
        }

        const lblLoc = this.getLabelTranslation('location');
        const lblCitizen = this.getLabelTranslation('citizen');
        const lblAssigned = this.getLabelTranslation('assignedTeam');
        const lblDispatch = this.getLabelTranslation('dispatchNearest');
        const lblReassign = this.getLabelTranslation('reassignTeam');
        const lblMarkReached = this.getLabelTranslation('markReached');
        const lblMarkSafe = this.getLabelTranslation('markSafe');
        const lblRescuedByOthers = this.getLabelTranslation('rescuedByOthers');
        const lblRescuedByResQNet = this.getLabelTranslation('rescuedByResQNet');

        container.innerHTML = filtered.map(s => {
            const priorityClass = s.priority === 'CRITICAL' ? 'danger' : s.priority === 'HIGH' ? 'warning' : 'info';
            const priorityText = this.getPriorityTranslation(s.priority);
            const categoryText = this.getCategoryTranslation(s.category);
            const statusLabel = this.getStatusTranslation(s.status);
            const isSafe = s.status === 'safe' || s.status === 'resolved' || s.status === 'completed';
            const isReportedRescued = s.status === 'citizen_reported_rescued' || s.verification_required;

            const unitObj = this.rescueUnits.find(u => u.id === s.assigned_unit || u.name === s.assigned_unit);
            const assignedUnitName = s.assigned_unit_name || (unitObj ? unitObj.name : s.assigned_unit || 'Team Alpha');

            return `
                <div class="glass-panel" style="padding:1.35rem; display:flex; flex-direction:column; justify-content:space-between; border-left:4px solid var(--${priorityClass});">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
                            <span class="badge-tag" style="background:var(--${priorityClass}-bg); color:var(--${priorityClass}); border:1px solid var(--${priorityClass}); font-weight:800;">${priorityText}</span>
                            <span style="font-family:var(--font-mono); font-size:0.8rem; color:var(--text-secondary); font-weight:700;">${s.id}</span>
                        </div>

                        <h3 style="font-size:1.1rem; font-weight:900; margin-bottom:0.4rem; color:var(--text-primary);">
                            ${categoryText}
                        </h3>

                        <p style="font-size:0.875rem; color:var(--text-secondary); margin-bottom:0.85rem; line-height:1.5;">
                            ${s.description}
                        </p>

                        <div style="background:var(--bg-panel); padding:0.65rem 0.85rem; border-radius:var(--radius-md); font-size:0.785rem; color:var(--text-primary); margin-bottom:1rem; border:1px solid var(--border-color);">
                            <div>📍 <strong>${lblLoc}:</strong> ${s.latitude.toFixed(4)}, ${s.longitude.toFixed(4)}</div>
                            <div style="margin-top:0.2rem;">👤 <strong>${lblCitizen}:</strong> ${s.citizen_name || 'Citizen Mobile'} (${s.phone || 'N/A'})</div>
                            ${assignedUnitName ? `<div style="margin-top:0.2rem; color:var(--info);">🚑 <strong>${lblAssigned}:</strong> ${assignedUnitName}</div>` : ''}
                        </div>

                        ${isReportedRescued ? `
                            <div style="background:rgba(255,179,0,0.14); border:1px solid var(--warning); border-radius:var(--radius-md); padding:1rem; margin-bottom:1rem;">
                                <div style="font-weight:900; color:var(--warning); font-size:0.9rem; margin-bottom:0.35rem;">${this.getLabelTranslation('citizenReport')}</div>
                                <div style="font-size:0.8rem; color:var(--text-primary); line-height:1.4;">
                                    ${this.getLabelTranslation('citizenReportText')}<br>
                                    <strong>${lblAssigned}:</strong> ${assignedUnitName}
                                </div>

                                <div style="display:flex; flex-direction:column; gap:0.4rem; margin-top:0.75rem;">
                                    <button class="btn btn-sm btn-secondary" onclick="window.ResQDashboard.contactCitizen('${s.phone}', '${s.id}')">
                                        ${this.getLabelTranslation('contactCitizen')}
                                    </button>
                                    <button class="btn btn-sm btn-primary" style="background:var(--success-bg) !important; color:var(--success) !important; border:1px solid var(--success) !important;" onclick="window.ResQDashboard.confirmRescuedByOthers('${s.id}')">
                                        ${this.getLabelTranslation('confirmRescuedByOthers')}
                                    </button>
                                    <button class="btn btn-sm btn-secondary" style="border-color:var(--danger); color:var(--danger);" onclick="window.ResQDashboard.reportStillNeedsHelp('${s.id}')">
                                        ${this.getLabelTranslation('personStillNeedsHelp')}
                                    </button>
                                </div>
                            </div>
                        ` : ''}
                    </div>

                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.85rem;">
                            <span style="font-size:0.775rem; color:var(--text-secondary); font-weight:700;">${this.getLabelTranslation('status')}:</span>
                            <span class="badge-tag" style="background:${isSafe ? 'var(--success-bg)' : isReportedRescued ? 'var(--warning-bg)' : 'var(--primary-bg)'}; color:${isSafe ? 'var(--success)' : isReportedRescued ? 'var(--warning)' : 'var(--primary)'}; border:1px solid currentColor;">
                                ${statusLabel}
                            </span>
                        </div>

                        ${isSafe ?
                            `<div style="font-size:0.85rem; color:var(--success); font-weight:800; text-align:center; padding:0.65rem; background:var(--success-bg); border-radius:var(--radius-md); border:1px solid var(--success);">
                                🟢 ${this.getLabelTranslation('safeTag')} &bull; ${s.outcome === 'RESCUED_BY_OTHERS' ? lblRescuedByOthers : lblRescuedByResQNet}
                            </div>` :
                            `
                            <div style="display:flex; flex-direction:column; gap:0.5rem;">
                                ${(s.status === 'assigned' || s.status === 'dispatched' || s.status === 'en_route') ? `
                                    <button class="btn btn-secondary" style="border-color:var(--info); color:var(--info); font-size:0.85rem;" onclick="window.ResQDashboard.markTeamReached('${s.id}')">
                                        ${lblMarkReached}
                                    </button>
                                ` : ''}
                                ${(s.status === 'reached') ? `
                                    <button class="btn btn-primary" style="background:var(--success-bg) !important; color:var(--success) !important; border:1px solid var(--success) !important; font-size:0.85rem;" onclick="window.ResQDashboard.markPersonSafe('${s.id}')">
                                        ${lblMarkSafe}
                                    </button>
                                ` : ''}
                                <button class="btn btn-primary" style="width:100%; font-size:0.875rem; padding:0.65rem;" onclick="window.ResQDashboard.openDispatchModal('${s.id}')">
                                    <i data-lucide="navigation" style="width:16px;"></i> ${s.assigned_unit ? lblReassign : lblDispatch}
                                </button>
                            </div>
                            `
                        }
                    </div>
                </div>
            `;
        }).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
        if (window.ResQTranslation) window.ResQTranslation.applyTranslations();
    }

    async markTeamReached(sosId) {
        window.ResQNotify.status({ title: 'Updating Rescue Progress', message: 'Marking team reached location...', progress: 50 });
        const res = await window.ResQAPI.markTeamReached(sosId);
        if (res.success) {
            window.ResQNotify.toast({ type: 'info', title: '📍 TEAM REACHED', message: 'Citizen notified that rescue team has reached location.' });
            this.loadInitialData();
        }
    }

    async markPersonSafe(sosId) {
        window.ResQNotify.status({ title: 'Completing Rescue', message: 'Marking person safe & releasing team...', progress: 50 });
        const res = await window.ResQAPI.markPersonSafe(sosId);
        if (res.success) {
            window.ResQNotify.toast({ type: 'success', title: '🟢 PERSON SAFE', message: 'Rescue completed by ResQNet team. Team released to AVAILABLE.' });
            this.loadInitialData();
        }
    }

    async confirmRescuedByOthers(sosId) {
        window.ResQNotify.status({ title: 'Confirming Safety', message: 'Confirming rescued by others & releasing team...', progress: 50 });
        const res = await window.ResQAPI.confirmRescuedByOthers(sosId);
        if (res.success) {
            window.ResQNotify.toast({ type: 'success', title: '🟢 CONFIRMED RESCUED BY OTHERS', message: 'Safety verified. Assigned team released to AVAILABLE.' });
            this.loadInitialData();
        }
    }

    async reportStillNeedsHelp(sosId) {
        window.ResQNotify.status({ title: 'Re-affirming Emergency', message: 'Keeping rescue team en route...', progress: 50 });
        const res = await window.ResQAPI.reportStillNeedsHelp(sosId);
        if (res.success) {
            window.ResQNotify.toast({ type: 'warning', title: '🚨 HELP STILL REQUIRED', message: 'Emergency active. Rescue team remains en route.' });
            this.loadInitialData();
        }
    }

    contactCitizen(phone, sosId) {
        const item = this.sosRecords.find(s => s.id === sosId);
        const citizenName = item ? (item.citizen_name || 'Citizen') : 'Citizen';
        const phoneNumber = phone || (item ? item.phone : '+91 98765 43210');

        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
            z-index: 99999; display: flex; justify-content: center; align-items: center; padding: 20px;
        `;

        modal.innerHTML = `
            <div style="background: var(--bg-surface-solid); padding: 24px; border-radius: 18px; width: 100%; max-width: 480px; border: 1px solid var(--border-color); box-shadow: 0 25px 60px rgba(0,0,0,0.7); text-align: center;">
                <div style="font-size:2.8rem; margin-bottom:0.5rem;">📞</div>
                <h3 style="margin:0 0 0.5rem 0; font-size:1.25rem; font-weight:900; color:var(--text-primary);">Verify Citizen Safety</h3>
                <p style="font-size:0.875rem; color:var(--text-secondary); margin-bottom:1.25rem; line-height:1.4;">
                    Contact <strong>${citizenName}</strong> (${phoneNumber}) for SOS <strong>${sosId}</strong> to verify safety before resolving the emergency.
                </p>

                <div style="display:flex; flex-direction:column; gap:0.75rem; margin-bottom:1.25rem;">
                    <a href="tel:${phoneNumber}" class="btn btn-primary" style="padding:0.75rem; font-size:0.9rem; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:0.5rem;">
                        📞 Call Citizen (${phoneNumber})
                    </a>

                    <button id="btnSendSmsVerify" class="btn btn-secondary" style="padding:0.75rem; font-size:0.9rem; display:flex; align-items:center; justify-content:center; gap:0.5rem;">
                        💬 Send Verification SMS
                    </button>
                </div>

                <div style="padding-top:1rem; border-top:1px solid var(--border-color); display:flex; flex-direction:column; gap:0.6rem;">
                    <button id="btnModalConfirmSafe" class="btn btn-primary" style="padding:0.75rem; font-size:0.9rem; background:linear-gradient(135deg, var(--success) 0%, #00C853 100%) !important; color:#050811 !important; font-weight:800;">
                        ✅ Verified & Move to Solved SOS
                    </button>

                    <button id="btnCloseModal" class="btn btn-secondary" style="padding:0.5rem; font-size:0.85rem;">
                        Close / Pending Verification
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('#btnCloseModal').onclick = () => modal.remove();

        modal.querySelector('#btnSendSmsVerify').onclick = () => {
            window.ResQNotify.toast({
                type: 'info',
                title: '💬 VERIFICATION SMS SENT',
                message: `SMS verification prompt sent to <strong>${phoneNumber}</strong>.`
            });
        };

        modal.querySelector('#btnModalConfirmSafe').onclick = async () => {
            modal.remove();
            await this.confirmRescuedByOthers(sosId);
        };
    }

    bindSosTabFilters() {
        const tabsContainer = document.getElementById('sosStatusTabs');
        if (tabsContainer) {
            tabsContainer.querySelectorAll('.sos-tab-btn').forEach(btn => {
                btn.onclick = () => {
                    tabsContainer.querySelectorAll('.sos-tab-btn').forEach(b => {
                        b.classList.remove('btn-primary', 'active');
                        b.classList.add('btn-secondary');
                    });
                    btn.classList.remove('btn-secondary');
                    btn.classList.add('btn-primary', 'active');

                    this.currentSosFilter = btn.getAttribute('data-filter');
                    this.renderCategorizedSOSGrid(this.sosRecords, this.currentSosFilter);
                };
            });
        }

        const fullSearch = document.getElementById('fullSosSearchInput');
        if (fullSearch) {
            fullSearch.oninput = (e) => {
                const query = e.target.value.toLowerCase().trim();
                if (!query) {
                    this.renderCategorizedSOSGrid(this.sosRecords, this.currentSosFilter);
                    return;
                }
                const filtered = this.sosRecords.filter(s =>
                    s.id.toLowerCase().includes(query) ||
                    s.category.toLowerCase().includes(query) ||
                    (s.description && s.description.toLowerCase().includes(query))
                );
                this.renderCategorizedSOSGrid(filtered, this.currentSosFilter);
            };
        }
    }

    async openDispatchModal(sosId) {
        const sos = this.sosRecords.find(s => s.id === sosId) || { id: sosId, category: "Emergency SOS", latitude: 17.3850, longitude: 78.4867 };

        const rankedUnits = this.rescueUnits.map(u => {
            const uLat = u.location ? u.location.lat : 17.3850;
            const uLng = u.location ? u.location.lng : 78.4867;
            const distKm = this.calculateDistance(sos.latitude, sos.longitude, uLat, uLng);
            const etaMins = Math.max(2, Math.round(distKm * 2.5 + 2));
            return {
                ...u,
                distance_km: parseFloat(distKm.toFixed(2)),
                eta_minutes: etaMins,
                is_nearby: distKm <= 30.0
            };
        }).sort((a, b) => a.distance_km - b.distance_km);

        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
            z-index: 99999; display: flex; justify-content: center; align-items: center; padding: 20px;
        `;

        const unitsListHtml = rankedUnits.map((u, index) => {
            const isNearest = index === 0 && u.status === 'available';
            const isFar = u.distance_km > 30.0;
            const badgeBg = isNearest ? 'var(--success-bg)' : isFar ? 'var(--danger-bg)' : 'var(--primary-bg)';
            const badgeColor = isNearest ? 'var(--success)' : isFar ? 'var(--danger)' : 'var(--primary)';
            const distanceLabel = isNearest ? `⭐ NEAREST UNIT (${u.distance_km} km • ETA ${u.eta_minutes} mins)` : isFar ? `⚠️ FAR AWAY (${u.distance_km} km • Not Recommended)` : `📍 ${u.distance_km} km away • ETA ${u.eta_minutes} mins`;

            return `
                <div class="glass-panel" style="padding:1rem 1.15rem; margin-bottom:0.75rem; display:flex; justify-content:space-between; align-items:center; border-left:4px solid ${isNearest ? 'var(--success)' : isFar ? 'var(--danger)' : 'var(--primary)'}; background:${isNearest ? 'rgba(0, 230, 118, 0.06)' : 'var(--bg-surface)'};">
                    <div>
                        <div style="font-weight:900; font-size:1rem; display:flex; align-items:center; gap:0.5rem;">
                            <span>${u.icon || '🚑'} ${u.name}</span>
                            <span class="badge-tag" style="background:${badgeBg}; color:${badgeColor}; border:1px solid ${badgeColor}; font-size:0.68rem; padding:0.18rem 0.55rem;">${distanceLabel}</span>
                        </div>
                        <div style="font-size:0.785rem; color:var(--text-secondary); margin-top:0.25rem;">
                            ${u.type} &bull; Contact: <strong>${u.contact || 'EOC Direct Line'}</strong> &bull; Status: <span style="text-transform:uppercase; color:${u.status==='available'?'var(--success)':'var(--warning)'}; font-weight:800;">${u.status}</span>
                        </div>
                    </div>
                    <button class="btn btn-sm ${isNearest ? 'btn-primary' : u.status === 'available' ? 'btn-secondary' : 'btn-secondary'}" style="flex-shrink:0; font-size:0.825rem; font-weight:800;" onclick="window.ResQDashboard.confirmDispatch('${sos.id}', '${u.id}', '${u.name}')">
                        ${isNearest ? '⚡ Dispatch Nearest' : u.status === 'available' ? 'Dispatch Unit' : 'Re-assign'}
                    </button>
                </div>
            `;
        }).join('');

        const modal = document.createElement('div');
        modal.style.cssText = `
            background: var(--bg-surface-solid); color: var(--text-primary);
            padding: 24px; border-radius: 18px; width: 100%; max-width: 600px;
            border: 1px solid var(--border-color); box-shadow: 0 25px 60px rgba(0,0,0,0.7);
        `;

        modal.innerHTML = `
            <h3 style="margin-top:0; margin-bottom:6px; font-size:1.25rem; display:flex; justify-content:space-between; align-items:center;">
                <span>🎯 Select Nearest Rescue Service</span>
                <button id="closeDispatchModal" style="background:none; border:none; color:var(--text-secondary); cursor:pointer; font-size:1.4rem;">✕</button>
            </h3>
            <div style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:16px;">
                Emergency Target: <strong>${sos.category}</strong> at coordinates (${sos.latitude.toFixed(4)}, ${sos.longitude.toFixed(4)})
            </div>
            
            <div style="max-height:360px; overflow-y:auto; margin-bottom:15px; padding-right:4px;">
                ${unitsListHtml || '<p>No units available</p>'}
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        modal.querySelector('#closeDispatchModal').onclick = () => overlay.remove();
        this.activeDispatchOverlay = overlay;
    }

    async confirmDispatch(incidentId, unitId, unitName) {
        if (this.activeDispatchOverlay) {
            this.activeDispatchOverlay.remove();
        }

        window.ResQNotify.status({ title: 'Dispatching Unit', message: `Sending command to ${unitName}...`, progress: 50 });

        const result = await window.ResQAPI.dispatchUnit(incidentId, unitId);

        if (result.success) {
            const distInfo = result.data && result.data.distance_km ? ` (${result.data.distance_km} km away)` : '';
            window.ResQNotify.toast({
                type: 'success',
                title: 'Nearest Unit Dispatched!',
                message: `<strong>${unitName}</strong>${distInfo} dispatched to emergency <strong>${incidentId}</strong>.`
            });

            const item = this.sosRecords.find(s => s.id === incidentId);
            if (item) {
                item.status = 'assigned';
                item.assigned_unit = unitId;
                this.renderSOSQueue(this.sosRecords);
                this.renderCategorizedSOSGrid(this.sosRecords, this.currentSosFilter);
                this.updateStats();
            }
        } else {
            window.ResQNotify.toast({ type: 'danger', title: 'Dispatch Failed', message: result.error || 'Could not dispatch unit.' });
        }
    }

    bindSearchFilter() {
        const searchInput = document.getElementById('sosSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                if (!query) {
                    this.renderSOSQueue(this.sosRecords);
                    return;
                }
                const filtered = this.sosRecords.filter(s =>
                    s.id.toLowerCase().includes(query) ||
                    s.category.toLowerCase().includes(query) ||
                    (s.description && s.description.toLowerCase().includes(query))
                );
                this.renderSOSQueue(filtered);
            });
        }
    }

    bindNavigation() {
        const navItems = document.querySelectorAll('.sidebar-nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const section = item.getAttribute('data-section');
                const href = item.getAttribute('href');

                if (section || (href && href.startsWith('#'))) {
                    e.preventDefault();
                    navItems.forEach(i => i.classList.remove('active'));
                    item.classList.add('active');

                    const targetView = section || (href ? href.replace('#', '') : 'overview');
                    this.switchView(targetView);
                }
            });
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.ResQDashboard) window.ResQDashboard = new DashboardManager();
    });
} else {
    if (!window.ResQDashboard) window.ResQDashboard = new DashboardManager();
}
