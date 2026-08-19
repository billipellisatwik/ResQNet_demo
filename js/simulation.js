class SimulationEngine {
    constructor() {
        this.interval = null;
        this.isRunning = false;
        this.incidents = 0;
    }

    async start() {
        if (this.isRunning) return;
        
        const confirmed = await window.ResQNotify.confirm({
            type: 'danger',
            title: 'Start Simulation?',
            message: 'This will generate test data and alert units. Proceed?'
        });
        
        if (confirmed) {
            this.isRunning = true;
            this.incidents = 0;
            window.ResQNotify.toast({ type: 'info', title: 'Simulation Started', message: 'Generating incidents...' });
            
            this.interval = setInterval(() => this.tick(), 3000);
        }
    }

    stop() {
        if (!this.isRunning) return;
        clearInterval(this.interval);
        this.isRunning = false;
        window.ResQNotify.toast({ type: 'warning', title: 'Simulation Stopped', message: `Generated ${this.incidents} incidents.` });
    }

    tick() {
        this.incidents++;
        if (this.incidents % 3 === 0) {
            // Generate real simulated SOS to backend
            const fakeCategory = ["Flood Emergency", "Medical Emergency", "Fire Emergency", "Person Trapped"][Math.floor(Math.random() * 4)];
            const fakeLat = 17.3850 + (Math.random() - 0.5) * 0.08;
            const fakeLng = 78.4867 + (Math.random() - 0.5) * 0.08;

            window.ResQAPI.createSOS({
                category: fakeCategory,
                description: `Simulated Emergency Signal #${this.incidents} - High Priority Alert`,
                latitude: fakeLat,
                longitude: fakeLng,
                location_type: 'GPS ACCURATE',
                accuracy: 10
            });
        }
    }
}

window.ResQSimulation = new SimulationEngine();

const initSim = () => {
    const startBtn = document.getElementById('startSimBtn');
    const stopBtn = document.getElementById('stopSimBtn');
    if (startBtn) startBtn.onclick = () => window.ResQSimulation.start();
    if (stopBtn) stopBtn.onclick = () => window.ResQSimulation.stop();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSim);
} else {
    initSim();
}


