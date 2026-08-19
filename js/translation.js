/* ==========================================================================
   RESQNET MULTILINGUAL TRANSLATION ENGINE v5.3
   100% Instant In-Memory Translation Engine (EN, TE, HI)
   Guarantees 100% Zero-Latency Dynamic UI Language Switching Across All Pages
   ========================================================================== */

class TranslationManager {
    constructor() {
        this.currentLang = localStorage.getItem('resqnet_lang') || localStorage.getItem('resq-lang') || 'en';
        this.translations = {
            en: {
                nav: { home: "Home", citizen: "Citizen SOS", commandCenter: "EOC Command Center", rescueTeam: "Rescue Teams", weather: "Weather Intelligence", analytics: "Analytics", shelters: "Evacuation Shelters", resources: "Emergency Resources", login: "Login", logout: "Logout" },
                citizen: { title: "Citizen Emergency Portal", emergencySOS: "EMERGENCY SOS", sosSubtitle: "TAP THE RED BUTTON TO ASK FOR HELP", myLocation: "📍 My Location", locationDetected: "Location Found (Exact)", locationUnavailable: "Location Unavailable", accuracy: "Exact Pinpoint Accuracy", pickOnMap: "📍 Pick on Map", connection: "Connection", online: "ONLINE", offline: "OFFLINE", safePlaces: "Safe Places", currentRisk: "Current Area Risk" },
                mesh: { title: "📡 Offline", peers: "Phones Connected Nearby", subtitle: "Works even without SIM or Internet", saved: "Help Requests Saved", testBtn: "📡 Test Offline Helper" },
                sos: { selectCategory: "What help do you need?", flood: "Water / Flood Help", medical: "Medical / Health Help", fire: "Fire Emergency", trapped: "Person Trapped", collapse: "Building Collapse", food: "Food & Clean Water", descriptionPlaceholder: "Provide details about trapped people, water level, or urgent medical needs..." },
                tracking: { title: "Live Rescue Unit Tracking", statusHeading: "Rescue Status", assignedUnit: "Assigned Unit", eta: "Estimated Arrival", distance: "Distance to Citizen", rescuedBtn: "🟢 I Have Been Rescued", rescuedConfirmTitle: "Confirm Safety Status", rescuedConfirmMsg: "Are you safe and rescued by emergency services or volunteers?", yesSafe: "✓ Yes, I'm Safe", cancel: "Cancel" },
                weather: { title: "Weather Intelligence & Risk Mapping", current: "Current Conditions", riskScore: "Disaster Risk Score", precipitation: "Precipitation", windSpeed: "Wind Speed", humidity: "Humidity", rainProbability: "Rain Prob", safePlaces: "Recommended Safe Evacuation Points", timeline: "Weather Forecast Timeline Projection", safeRouteMap: "Safe Evacuation Route Map" },
                shelters: { title: "Evacuation Shelters Hub", available: "Available Beds", occupancy: "Current Occupancy", capacity: "Total Capacity", amenities: "Amenities", navigate: "Safe Route Map" },
                resources: { title: "Emergency Logistics & Inventory", available: "Available Units", total: "Total Inventory", type: "Resource Category" },
                dashboard: { title: "EOC Command Center Dashboard", activeSOS: "Live Active SOS", solvedSOS: "Solved / Rescued SOS", callCitizen: "📞 Call Citizen", sendSMS: "💬 Send Verification SMS", verifySolved: "✅ Verify & Move to Solved SOS", reportedRescued: "Citizen Reported Safe (Verification Required)" }
            },
            te: {
                nav: { home: "హోమ్", citizen: "పౌరుల SOS", commandCenter: "కమాండ్ సెంటర్", rescueTeam: "రక్షణ బృందాలు", weather: "వాతావరణ సమాచారం", analytics: "విశ్లేషణలు", shelters: "పునరావాస కేంద్రాలు", resources: "అత్యవసర వనరులు", login: "లాగిన్", logout: "లాగౌట్" },
                citizen: { title: "పౌరుల అత్యవసర పోర్టల్", emergencySOS: "అత్యవసర SOS", sosSubtitle: "సహాయం కోసం ఎరుపు బటన్‌ను నొక్కండి", myLocation: "📍 నా లొకేషన్", locationDetected: "లొకేషన్ దొరికింది (ఖచ్చితమైనది)", locationUnavailable: "లొకేషన్ అందుబాటులో లేదు", accuracy: "ఖచ్చితమైన లొకేషన్ పిన్‌పాయింట్", pickOnMap: "📍 మ్యాప్‌లో ఎంచుకోండి", connection: "కనెక్షన్", online: "ఆన్‌లైన్", offline: "ఆఫ్‌లైన్", safePlaces: "సురక్షిత ప్రాంతాలు", currentRisk: "ప్రస్తుత ప్రాంత ప్రమాదం" },
                mesh: { title: "📡 ఆఫ్‌లైన్", peers: "సమీప ఫోన్లు కనెక్ట్ అయ్యాయి", subtitle: "SIM లేదా ఇంటర్నెట్ లేకపోయినా పనిచేస్తుంది", saved: "సహాయక అభ్యర్థనలు భద్రపరచబడ్డాయి", testBtn: "📡 ఆఫ్‌లైన్ సాయం పరీక్షించండి" },
                sos: { selectCategory: "మీకు ఏ సహాయం కావాలి?", flood: "వరద / నీటి సహాయం", medical: "వైద్య / ఆరోగ్య సహాయం", fire: "అగ్నిప్రమాదం", trapped: "చిక్కుకున్న వ్యక్తి", collapse: "భవనం కూలిపోవడం", food: "ఆహారం & మంచినీరు", descriptionPlaceholder: "చిక్కుకున్న వ్యక్తులు, నీటి మట్టం లేదా అత్యవసర వైద్య వివరాలను తెలపండి..." },
                tracking: { title: "లైవ్ రక్షణ బృందం ట్రాకింగ్", statusHeading: "రక్షణ స్థితి", assignedUnit: "కేటాయించిన బృందం", eta: "అంచనా సమయం", distance: "పౌరునికి దూరం", rescuedBtn: "🟢 నేను రక్షించబడ్డాను", rescuedConfirmTitle: "భద్రతా స్థితిని నిర్ధారించండి", rescuedConfirmMsg: "మీరు రక్షించబడి సురక్షితంగా ఉన్నారా?", yesSafe: "✓ అవును, నేను సురక్షితంగా ఉన్నాను", cancel: "రద్దు చేయి" },
                weather: { title: "వాతావరణ సమాచారం & ప్రమాద మ్యాపింగ్", current: "ప్రస్తుత పరిస్థితులు", riskScore: "విపత్తు ప్రమాద స్కోరు", precipitation: "వర్షపాతం", windSpeed: "గాలి వేగం", humidity: "తేమ శాతం", rainProbability: "వర్షం సంభావ్యత", safePlaces: "ప్రతిపాదిత సురక్షిత పునరావాస ప్రాంతాలు", timeline: "వాతావరణ అంచనా టైమ్‌లైన్", safeRouteMap: "సురక్షిత పునరావాస మార్గ మ్యాప్" },
                shelters: { title: "పునరావాస కేంద్రాల నిలయం", available: "అందుబాటులో ఉన్న బెడ్‌లు", occupancy: "ప్రస్తుత నివాసితులు", capacity: "మొత్తం సామర్థ్యం", amenities: "సౌకర్యాలు", navigate: "సురక్షిత మార్గ మ్యాప్" },
                resources: { title: "అత్యవసర వనరులు & లాజిస్టిక్స్", available: "అందుబాటులో ఉన్న యూనిట్లు", total: "మొత్తం వనరులు", type: "వనరుల వర్గం" },
                dashboard: { title: "EOC కమాండ్ సెంటర్ డాష్‌బోర్డ్", activeSOS: "లైవ్ యాక్టివ్ SOS", solvedSOS: "పరిష్కరించబడిన SOS", callCitizen: "📞 కాల్ చేయి", sendSMS: "💬 వివరాలు పరిశీలన SMS పంపు", verifySolved: "✅ పరిశీలించి Solved SOS కి మార్చు", reportedRescued: "పౌరుడు సురక్షితమని తెలిపారు (పరిశీలన అవసరం)" }
            },
            hi: {
                nav: { home: "होम", citizen: "नागरिक SOS", commandCenter: "कमांड सेंटर", rescueTeam: "बचाव दल", weather: "मौसम विश्लेषण", analytics: "विश्लेषण", shelters: "राहत शिविर", resources: "आपातकालीन संसाधन", login: "लॉग इन", logout: "लॉग आउट" },
                citizen: { title: "नागरिक आपातकालीन पोर्टल", emergencySOS: "आपातकालीन SOS", sosSubtitle: "मदद के लिए लाल बटन दबाएं", myLocation: "📍 मेरा स्थान", locationDetected: "स्थान मिल गया (सटीक)", locationUnavailable: "स्थान उपलब्ध नहीं है", accuracy: "सटीक स्थान पिनपॉइंट", pickOnMap: "📍 मानचित्र पर चुनें", connection: "कनेक्शन", online: "ऑनलाइन", offline: "ऑफलाइन", safePlaces: "सुरक्षित स्थान", currentRisk: "वर्तमान क्षेत्र जोखिम" },
                mesh: { title: "📡 ऑफलाइन", peers: "पास के फोन कनेक्टेड", subtitle: "बिना सिम या इंटरनेट के भी काम करता है", saved: "मदद अनुरोध सहेजे गए", testBtn: "📡 ऑफ-लाइन मदद टेस्ट करें" },
                sos: { selectCategory: "आपको क्या मदद चाहिए?", flood: "बाढ़ / जल सहायता", medical: "चिकित्सा / स्वास्थ्य सहायता", fire: "आगजनी", trapped: "फंसा हुआ व्यक्ति", collapse: "इमारत ढहना", food: "भोजन और साफ पानी", descriptionPlaceholder: "फंसे हुए लोगों, पानी के स्तर या जरूरी चिकित्सा की जानकारी दें..." },
                tracking: { title: "लाइव बचाव दल ट्रैकिंग", statusHeading: "बचाव स्थिति", assignedUnit: "तैनात टीम", eta: "अनुमानित समय", distance: "नागरिक से दूरी", rescuedBtn: "🟢 मुझे बचा लिया गया है", rescuedConfirmTitle: "सुरक्षा स्थिति की पुष्टि करें", rescuedConfirmMsg: "क्या आप सुरक्षित और बचाए जा चुके हैं?", yesSafe: "✓ हां, मैं सुरक्षित हूं", cancel: "रद्द करें" },
                weather: { title: "मौसम विश्लेषण और जोखिम मैपिंग", current: "वर्तमान स्थिति", riskScore: "आपदा जोखिम स्कोर", precipitation: "वर्षा", windSpeed: "हवा की गति", humidity: "आर्द्रता", rainProbability: "वर्षा की संभावना", safePlaces: "अनुशंसित सुरक्षित स्थान", timeline: "मौसम पूर्वानुमान टाइमलाइन", safeRouteMap: "सुरक्षित मार्ग मानचित्र" },
                shelters: { title: "राहत शिविर केंद्र", available: "उपलब्ध बेड", occupancy: "वर्तमान निवासी", capacity: "कुल क्षमता", amenities: "सुविधाएं", navigate: "सुरक्षित मार्ग मानचित्र" },
                resources: { title: "आपातकालीन रसद और संसाधन", available: "उपलब्ध इकाइयां", total: "कुल संसाधन", type: "संसाधन श्रेणी" },
                dashboard: { title: "EOC कमांड सेंटर डैशबोर्ड", activeSOS: "लाइव सक्रिय SOS", solvedSOS: "हल किए गए SOS", callCitizen: "📞 कॉल करें", sendSMS: "💬 सत्यापन SMS भेजें", verifySolved: "✅ सत्यापित कर Solved SOS में भेजें", reportedRescued: "नागरिक ने सुरक्षित होने की सूचना दी (सत्यापन आवश्यक)" }
            }
        };

        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupLanguageUI());
        } else {
            this.setupLanguageUI();
        }
    }

    setupLanguageUI() {
        this.applyTranslations();

        const langSelects = document.querySelectorAll('#langSelect, .lang-select');
        langSelects.forEach(select => {
            select.value = this.currentLang;
            select.addEventListener('change', (e) => {
                const newLang = e.target.value;
                this.setLanguage(newLang);
            });
        });
    }

    setLanguage(lang) {
        if (!lang) return;
        this.currentLang = lang;
        localStorage.setItem('resqnet_lang', lang);
        localStorage.setItem('resq-lang', lang);

        this.applyTranslations();

        document.querySelectorAll('#langSelect, .lang-select').forEach(s => s.value = lang);
        window.dispatchEvent(new CustomEvent('language-changed', { detail: lang }));
    }

    get(key, lang = this.currentLang) {
        if (!key) return '';
        const keys = key.split('.');
        let val = this.translations[lang] || this.translations['en'];
        if (!val) return key;

        for (let k of keys) {
            if (val && typeof val === 'object' && k in val) {
                val = val[k];
            } else {
                return key;
            }
        }
        return typeof val === 'string' ? val : key;
    }

    applyTranslations() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.get(key);
            if (translation && translation !== key) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = translation;
                } else {
                    const span = el.querySelector('span');
                    if (span && span !== el) {
                        span.innerHTML = translation;
                    } else if (el.children.length === 0) {
                        el.innerHTML = translation;
                    } else {
                        let textFound = false;
                        for (let i = 0; i < el.childNodes.length; i++) {
                            const node = el.childNodes[i];
                            if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim().length > 0) {
                                node.nodeValue = translation;
                                textFound = true;
                                break;
                            }
                        }
                        if (!textFound) {
                            el.innerHTML = translation;
                        }
                    }
                }
            }
        });

        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    }
}

if (!window.ResQTranslation) {
    window.ResQTranslation = new TranslationManager();
}
