/* ==========================================================================
   RESQBOT — INTELLIGENT PLATFORM GUIDANCE & EMERGENCY ASSISTANT v1.0
   Provides interactive step-by-step guidance, quick help chips, multilingual
   assistance (English, Telugu, Hindi), and DOM element highlighting.
   ========================================================================== */

class ResQBotEngine {
    constructor() {
        this.isOpen = false;
        this.currentLang = localStorage.getItem('resq-lang') || 'en';
        this.messages = [];
        
        this.knowledgeBase = {
            en: {
                welcome: "Hello! I am <strong>ResQBot</strong>, your emergency assistant. Need help navigating the platform or sending an SOS?",
                quickChips: [
                    { label: "🚨 How to Send SOS", query: "how to send sos" },
                    { label: "📍 Pick Location on Map", query: "how to set location" },
                    { label: "📡 Offline Mode Info", query: "offline mode" },
                    { label: "💻 Command Center Help", query: "command center" },
                    { label: "🎯 Track Rescue Team", query: "track rescue" },
                    { label: "🏠 Shelters & Weather", query: "shelters and weather" }
                ],
                responses: {
                    sos: "<strong>To Send an Emergency SOS Signal:</strong><br>1. Select your emergency type (e.g. 🌊 <i>Flood</i>, 🚑 <i>Medical</i>, 🔥 <i>Fire</i>).<br>2. Optionally type urgent details in the text box.<br>3. Press the <strong>GIANT PULSING 🚨 SOS BUTTON</strong>.<br>4. A 3-second safety countdown confirmation modal will appear. Tap <strong>Confirm</strong> to transmit!",
                    location: "<strong>To Set Your Emergency Location:</strong><br>1. Tap the <strong>📍 Pick on Map</strong> button at the top location header.<br>2. Type any area name or landmark across India (e.g. <i>Banjara Hills, Marine Drive, Connaught Place</i>) for live autocomplete suggestions.<br>3. Or drag the marker pin directly on the map and tap <strong>Set Pinpoint Location</strong>.",
                    offline: "<strong>Offline Emergency Mode:</strong><br>• If cellular network or internet drops, the app automatically switches to <strong>OFFLINE (QUEUED)</strong> mode.<br>• Pressing SOS saves your emergency securely to your browser's IndexedDB storage.<br>• When network returns, ResQBot will <strong>auto-sync</strong> and upload your emergency signal to Command Center!",
                    command: "<strong>Command Center Operator Guide:</strong><br>• Open <strong>command-center.html</strong> on the operator laptop.<br>• New citizen emergencies pop up in real-time <strong>without refreshing the page</strong>.<br>• View incidents on the Leaflet Tactical Map.<br>• Click <strong>DISPATCH RESCUE TEAM</strong> on any card to select available units and animate their route line!",
                    track: "<strong>How to Track Your Rescue Team:</strong><br>• After sending SOS, you are automatically redirected to <strong>tracking.html</strong>.<br>• View real-time status timeline (*Pending → Assigned → En-Route → Resolved*).<br>• See approaching unit distance & estimated time of arrival (ETA).",
                    shelter: "<strong>Shelters & Weather Risk:</strong><br>• Go to <strong>weather.html</strong> to view real-time Open-Meteo rainfall forecasting.<br>• View nearby safe evacuation shelters calculated using Haversine distance."
                },
                fallback: "I can guide you on sending SOS signals, pinpointing map locations, offline queueing, or operating the Command Center. Tap one of the quick chips below or type your question!"
            },
            te: {
                welcome: "నమస్కారం! నేను <strong>ResQBot</strong>, మీ అత్యవసర సహాయక బాట్. ప్లాట్‌ఫారమ్ వాడకం పై సహాయం కావాలా?",
                quickChips: [
                    { label: "🚨 SOS ఎలా పంపాలి?", query: "how to send sos" },
                    { label: "📍 మ్యాప్‌లో లొకేషన్ ఎంచుకోండి", query: "how to set location" },
                    { label: "📡 ఆఫ్‌లైన్ మోడ్ సమాచారం", query: "offline mode" },
                    { label: "💻 కమాండ్ సెంటర్ మార్గదర్శి", query: "command center" },
                    { label: "🎯 రెస్క్యూ టీమ్‌ను ట్రాక్ చేయండి", query: "track rescue" }
                ],
                responses: {
                    sos: "<strong>అత్యవసర SOS సిగ్నల్ పంపడానికి:</strong><br>1. అత్యవసర రకాన్ని ఎంచుకోండి (उदा. 🌊 వరదలు, 🚑 వైద్యం, 🔥 అగ్ని ప్రమాదం).<br>2. పెద్ద ఎరుపు రంగు 🚨 <strong>SOS బటన్</strong> పై నొక్కండి.<br>3. 3-సెకన్ల కౌంట్‌డౌన్ పూర్తయ్యాక <strong>Confirm</strong> చేయండి!",
                    location: "<strong>మీ లొకేషన్ ఎంచుకోవడానికి:</strong><br>1. <strong>📍 Pick on Map</strong> బటన్‌పై నొక్కండి.<br>2. మీ ప్రాంతం పేరు టైప్ చేయండి లేదా మ్యాప్‌లో పిన్ డ్రాగ్ చేసి <strong>Set Pinpoint Location</strong> పై నొక్కండి.",
                    offline: "<strong>ఆఫ్‌లైన్ ఎమర్జెన్సీ మోడ్:</strong><br>ఇంటర్నెట్ లేనప్పుడు కూడా మీ SOS వివరాలు సురక్షితంగా సేవ్ అవుతాయి. నెట్‌వర్క్ రాగానే కమాండ్ సెంటర్‌కు ఆటో-సింక్ అవుతాయి!",
                    command: "<strong>కమాండ్ సెంటర్ డ్యాష్‌బోర్డ్:</strong><br>కమాండ్ సెంటర్‌లో కొత్త ఎమర్జెన్సీ కార్డ్‌లు పేజీ రీఫ్రెష్ లేకుండా వెంటనే కనిపిస్తాయి. DISPATCH బటన్ నొక్కి రెస్క్యూ టీమ్‌ను కేటాయించండి."
                },
                fallback: "నేను మీకు SOS పంపడం, లొకేషన్ మార్చడం, ఆఫ్‌లైన్ మోడ్ మరియు కమాండ్ సెంటర్ వాడకం పై మార్గదర్శనం చేయగలను. కింద ఉన్న ఆప్షన్లను ఎంచుకోండి!"
            },
            hi: {
                welcome: "नमस्ते! मैं <strong>ResQBot</strong> हूँ, आपका आपातकालीन सहायक। प्लेटफार्म का उपयोग करने में मदद चाहिए?",
                quickChips: [
                    { label: "🚨 SOS कैसे भेजें?", query: "how to send sos" },
                    { label: "📍 मैप पर लोकेशन चुनें", query: "how to set location" },
                    { label: "📡 ऑफलाइन मोड जानकारी", query: "offline mode" },
                    { label: "💻 कमांड सेंटर गाइड", query: "command center" },
                    { label: "🎯 रेस्क्यू टीम ट्रैक करें", query: "track rescue" }
                ],
                responses: {
                    sos: "<strong>SOS सिग्नल भेजने के लिए:</strong><br>1. आपातकाल का प्रकार चुनें (जैसे 🌊 बाढ़, 🚑 मेडिकल, 🔥 आग)।<br>2. बड़े लाल 🚨 <strong>SOS बटन</strong> पर क्लिक करें।<br>3. 3-सेकंड काउंटडाउन के बाद <strong>Confirm</strong> करें!",
                    location: "<strong>अपनी सटीक लोकेशन चुनने के लिए:</strong><br>1. <strong>📍 Pick on Map</strong> बटन पर क्लिक करें।<br>2. भारत का कोई भी इलाका टाइप करें या मैप पर पिन ड्रैग करके <strong>Set Pinpoint Location</strong> दबाएं।",
                    offline: "<strong>ऑफलाइन आपातकालीन मोड:</strong><br>इंटरनेट न होने पर भी आपका SOS सुरक्षित रूप से सेव हो जाता है और नेटवर्क आते ही कमांड सेंटर में ऑटो-अपलोड हो जाता है!",
                    command: "<strong>कमांड सेंटर गाइड:</strong><br>कमांड सेंटर लैपटॉप पर बिना पेज रिफ्रेश किए नए आपातकालीन सिग्नल दिखाई देते हैं। DISPATCH दबाकर रेस्क्यू टीम भेजें।"
                },
                fallback: "मैं SOS भेजने, मैप लोकेशन चुनने, ऑफलाइन मोड और कमांड सेंटर के उपयोग में आपकी सहायता कर सकता हूँ। नीचे दिए गए विकल्पों पर क्लिक करें!"
            }
        };

        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.renderBotUI());
        } else {
            this.renderBotUI();
        }

        window.addEventListener('language-changed', (e) => {
            this.currentLang = e.detail || 'en';
            this.updateBotLanguage();
        });
    }

    renderBotUI() {
        if (document.getElementById('resqbot-container')) return;

        const container = document.createElement('div');
        container.id = 'resqbot-container';
        container.innerHTML = `
            <!-- Floating Launcher Button -->
            <button id="resqbot-launcher" class="resqbot-launcher-btn" aria-label="Open ResQBot Assistant">
                <span class="resqbot-icon">🛡️</span>
                <span class="resqbot-pulse-ring"></span>
                <span class="resqbot-label">Need Help?</span>
            </button>

            <!-- Chat Window Panel -->
            <div id="resqbot-window" class="resqbot-window-panel glass-panel">
                <div class="resqbot-header">
                    <div style="display:flex; align-items:center; gap:0.6rem;">
                        <span style="font-size:1.5rem;">🤖</span>
                        <div>
                            <div style="font-weight:900; font-size:1rem; color:#FFF; display:flex; align-items:center; gap:0.4rem;">
                                ResQBot <span class="badge-tag" style="background:var(--primary-bg); color:var(--primary); font-size:0.65rem; padding:0.1rem 0.4rem;">AI GUIDE</span>
                            </div>
                            <div style="font-size:0.75rem; color:var(--text-secondary);">Platform Emergency Guide</div>
                        </div>
                    </div>
                    <button id="resqbot-close" class="resqbot-close-btn">✕</button>
                </div>

                <div id="resqbot-chat-body" class="resqbot-chat-body">
                    <!-- Dynamic Messages Populated Here -->
                </div>

                <div id="resqbot-chips-container" class="resqbot-chips-wrapper">
                    <!-- Quick Action Chips -->
                </div>

                <div class="resqbot-input-bar">
                    <input type="text" id="resqbot-input" placeholder="Ask ResQBot a question..." autocomplete="off">
                    <button id="resqbot-send-btn" class="btn btn-primary btn-sm">Send</button>
                </div>
            </div>
        `;

        document.body.appendChild(container);
        this.injectBotStyles();
        this.bindEvents();

        // Initial welcome message
        const langData = this.knowledgeBase[this.currentLang] || this.knowledgeBase.en;
        this.addBotMessage(langData.welcome);
        this.renderQuickChips();
    }

    injectBotStyles() {
        if (document.getElementById('resqbot-styles')) return;

        const style = document.createElement('style');
        style.id = 'resqbot-styles';
        style.textContent = `
            #resqbot-container {
                position: fixed;
                bottom: 24px;
                right: 24px;
                z-index: 99999;
                font-family: var(--font-main, sans-serif);
            }

            .resqbot-launcher-btn {
                background: linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%);
                color: #050811;
                border: 2px solid rgba(255, 255, 255, 0.4);
                padding: 0.75rem 1.25rem;
                border-radius: 9999px;
                display: flex;
                align-items: center;
                gap: 0.6rem;
                font-weight: 800;
                font-size: 0.925rem;
                cursor: pointer;
                box-shadow: 0 10px 30px rgba(0, 242, 254, 0.45), 0 0 20px rgba(0, 242, 254, 0.3);
                transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
                position: relative;
            }

            .resqbot-launcher-btn:hover {
                transform: scale(1.08) translateY(-3px);
                box-shadow: 0 15px 40px rgba(0, 242, 254, 0.6);
            }

            .resqbot-pulse-ring {
                position: absolute;
                top: -4px; left: -4px; right: -4px; bottom: -4px;
                border-radius: 9999px;
                border: 2px solid var(--primary, #00F2FE);
                animation: resqbot-ring-pulse 2s infinite ease-in-out;
            }

            @keyframes resqbot-ring-pulse {
                0% { transform: scale(1); opacity: 0.8; }
                100% { transform: scale(1.25); opacity: 0; }
            }

            .resqbot-window-panel {
                position: absolute;
                bottom: 70px;
                right: 0;
                width: 380px;
                max-width: calc(100vw - 32px);
                height: 500px;
                max-height: calc(100vh - 120px);
                background: rgba(10, 15, 29, 0.92) !important;
                backdrop-filter: blur(24px) saturate(200%) !important;
                border: 1px solid var(--border-hover, rgba(0, 242, 254, 0.4)) !important;
                border-radius: 20px !important;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 242, 254, 0.15) !important;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                opacity: 0;
                visibility: hidden;
                transform: translateY(20px) scale(0.95);
                transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), visibility 0.25s ease;
            }

            .resqbot-window-panel.open {
                opacity: 1;
                visibility: visible;
                transform: translateY(0) scale(1);
            }

            .resqbot-header {
                padding: 1rem 1.25rem;
                background: rgba(15, 23, 42, 0.9);
                border-bottom: 1px solid var(--border-color);
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .resqbot-close-btn {
                background: none;
                border: none;
                color: var(--text-secondary);
                font-size: 1.2rem;
                cursor: pointer;
                padding: 0.2rem 0.5rem;
                border-radius: 6px;
                transition: background 0.15s ease;
            }

            .resqbot-close-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #FFF;
            }

            .resqbot-chat-body {
                flex: 1;
                padding: 1rem;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 0.85rem;
            }

            .resqbot-msg {
                max-width: 85%;
                padding: 0.75rem 1rem;
                border-radius: 14px;
                font-size: 0.875rem;
                line-height: 1.5;
                animation: resqbot-msg-appear 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            }

            @keyframes resqbot-msg-appear {
                from { opacity: 0; transform: translateY(8px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .resqbot-msg.bot {
                background: rgba(30, 41, 59, 0.85);
                color: var(--text-primary);
                border: 1px solid rgba(255, 255, 255, 0.08);
                align-self: flex-start;
                border-bottom-left-radius: 4px;
            }

            .resqbot-msg.user {
                background: linear-gradient(135deg, #00F2FE 0%, #00C6FF 100%);
                color: #050811;
                font-weight: 700;
                align-self: flex-end;
                border-bottom-right-radius: 4px;
            }

            .resqbot-chips-wrapper {
                padding: 0.6rem 0.85rem;
                display: flex;
                gap: 0.5rem;
                overflow-x: auto;
                white-space: nowrap;
                background: rgba(15, 23, 42, 0.6);
                border-top: 1px solid rgba(255, 255, 255, 0.06);
            }

            .resqbot-chip {
                background: rgba(0, 242, 254, 0.12);
                color: var(--primary, #00F2FE);
                border: 1px solid rgba(0, 242, 254, 0.3);
                padding: 0.35rem 0.75rem;
                border-radius: 9999px;
                font-size: 0.775rem;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.15s ease;
                display: inline-flex;
                align-items: center;
                gap: 0.35rem;
            }

            .resqbot-chip:hover {
                background: rgba(0, 242, 254, 0.25);
                transform: translateY(-1px);
                box-shadow: 0 0 10px rgba(0, 242, 254, 0.3);
            }

            .resqbot-input-bar {
                padding: 0.75rem;
                background: rgba(15, 23, 42, 0.95);
                border-top: 1px solid var(--border-color);
                display: flex;
                gap: 0.5rem;
            }

            .resqbot-input-bar input {
                flex: 1;
                background: var(--bg-input, #0F172A);
                border: 1px solid var(--border-color);
                color: #FFF;
                padding: 0.55rem 0.85rem;
                border-radius: 10px;
                font-size: 0.875rem;
                outline: none;
            }

            .resqbot-input-bar input:focus {
                border-color: var(--primary);
            }

            /* Highlight Pulse Effect for Target UI Elements */
            .resqbot-target-highlight {
                animation: resqbot-element-glow 2s infinite alternate !important;
            }

            @keyframes resqbot-element-glow {
                0% { box-shadow: 0 0 0px rgba(0, 242, 254, 0); }
                100% { box-shadow: 0 0 35px rgba(0, 242, 254, 0.9), 0 0 0 4px #00F2FE; }
            }
        `;
        document.head.appendChild(style);
    }

    bindEvents() {
        const launcher = document.getElementById('resqbot-launcher');
        const windowPanel = document.getElementById('resqbot-window');
        const closeBtn = document.getElementById('resqbot-close');
        const sendBtn = document.getElementById('resqbot-send-btn');
        const input = document.getElementById('resqbot-input');

        const toggleBot = () => {
            this.isOpen = !this.isOpen;
            if (this.isOpen) {
                windowPanel.classList.add('open');
                input.focus();
            } else {
                windowPanel.classList.remove('open');
            }
        };

        launcher.onclick = toggleBot;
        closeBtn.onclick = () => {
            this.isOpen = false;
            windowPanel.classList.remove('open');
        };

        const handleSend = () => {
            const query = input.value.trim();
            if (!query) return;
            this.addUserMessage(query);
            input.value = '';
            setTimeout(() => this.processQuery(query), 300);
        };

        sendBtn.onclick = handleSend;
        input.onkeypress = (e) => {
            if (e.key === 'Enter') handleSend();
        };
    }

    renderQuickChips() {
        const chipsContainer = document.getElementById('resqbot-chips-container');
        if (!chipsContainer) return;

        const langData = this.knowledgeBase[this.currentLang] || this.knowledgeBase.en;
        chipsContainer.innerHTML = langData.quickChips.map(chip => `
            <button class="resqbot-chip" data-query="${chip.query}">
                ${chip.label}
            </button>
        `).join('');

        chipsContainer.querySelectorAll('.resqbot-chip').forEach(btn => {
            btn.onclick = () => {
                const query = btn.getAttribute('data-query');
                const label = btn.innerText;
                this.addUserMessage(label);
                setTimeout(() => this.processQuery(query), 300);
            };
        });
    }

    addBotMessage(htmlContent) {
        const body = document.getElementById('resqbot-chat-body');
        if (!body) return;

        const msg = document.createElement('div');
        msg.className = 'resqbot-msg bot';
        msg.innerHTML = htmlContent;
        body.appendChild(msg);
        body.scrollTop = body.scrollHeight;
    }

    addUserMessage(text) {
        const body = document.getElementById('resqbot-chat-body');
        if (!body) return;

        const msg = document.createElement('div');
        msg.className = 'resqbot-msg user';
        msg.innerText = text;
        body.appendChild(msg);
        body.scrollTop = body.scrollHeight;
    }

    processQuery(query) {
        const q = query.toLowerCase();
        const langData = this.knowledgeBase[this.currentLang] || this.knowledgeBase.en;
        const resp = langData.responses;

        if (q.includes('sos') || q.includes('help') || q.includes('emergency') || q.includes('send') || q.includes('press')) {
            this.addBotMessage(resp.sos || resp.fallback);
            this.highlightElement('#mainSosBtn');
        } else if (q.includes('loc') || q.includes('map') || q.includes('pin') || q.includes('place') || q.includes('area')) {
            this.addBotMessage(resp.location || resp.fallback);
            this.highlightElement('#manualMapPickerBtn');
            this.highlightElement('#changeLocBtn');
        } else if (q.includes('off') || q.includes('net') || q.includes('sync')) {
            this.addBotMessage(resp.offline || resp.fallback);
            this.highlightElement('#network-badge');
        } else if (q.includes('command') || q.includes('eoc') || q.includes('dispatch') || q.includes('laptop')) {
            this.addBotMessage(resp.command || resp.fallback);
        } else if (q.includes('track') || q.includes('eta') || q.includes('route')) {
            this.addBotMessage(resp.track || resp.fallback);
        } else if (q.includes('shelter') || q.includes('weather') || q.includes('rain')) {
            this.addBotMessage(resp.shelter || resp.fallback);
        } else {
            this.addBotMessage(langData.fallback);
        }
    }

    highlightElement(selector) {
        const el = document.querySelector(selector);
        if (!el) return;

        el.classList.add('resqbot-target-highlight');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
            el.classList.remove('resqbot-target-highlight');
        }, 4000);
    }

    updateBotLanguage() {
        const langData = this.knowledgeBase[this.currentLang] || this.knowledgeBase.en;
        this.renderQuickChips();
        this.addBotMessage(langData.welcome);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.ResQBot) window.ResQBot = new ResQBotEngine();
    });
} else {
    if (!window.ResQBot) window.ResQBot = new ResQBotEngine();
}
