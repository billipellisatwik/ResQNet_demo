/* ==========================================================================
   RESQNET ANALYTICS DASHBOARD CONTROLLER v5.0
   ========================================================================== */

class AnalyticsManager {
    constructor() {
        this.init();
    }

    async init() {
        await this.loadAnalytics();
    }

    async loadAnalytics() {
        const res = await window.ResQAPI.getAnalytics();
        if (res.success && res.data) {
            this.renderCharts(res.data);
        } else {
            // Render default dataset if endpoint is empty
            this.renderCharts({
                total_sos: 18,
                critical_sos: 6,
                avg_response_minutes: 4.8,
                category_breakdown: { 'Flood Emergency': 8, 'Medical Emergency': 5, 'Person Trapped': 3, 'Fire Emergency': 2 }
            });
        }
    }

    renderCharts(data) {
        if (typeof Chart === 'undefined') return;

        Chart.defaults.color = '#94A3B8';
        Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";

        // Chart 1: SOS Category Breakdown
        const catCanvas = document.getElementById('categoryChart');
        if (catCanvas) {
            const categories = Object.keys(data.category_breakdown || {});
            const counts = Object.values(data.category_breakdown || {});

            new Chart(catCanvas, {
                type: 'doughnut',
                data: {
                    labels: categories.length ? categories : ['Flood Emergency', 'Medical Emergency', 'Person Trapped', 'Fire Emergency'],
                    datasets: [{
                        data: counts.length ? counts : [8, 5, 3, 2],
                        backgroundColor: ['#06B6D4', '#EF4444', '#F59E0B', '#3B82F6'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { padding: 15 } }
                    }
                }
            });
        }

        // Chart 2: 24-Hour Response Time Trend
        const respCanvas = document.getElementById('responseTimeChart');
        if (respCanvas) {
            new Chart(respCanvas, {
                type: 'line',
                data: {
                    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Now'],
                    datasets: [{
                        label: 'Avg Response Time (minutes)',
                        data: [6.5, 5.2, 7.8, 8.1, 4.5, 3.9, 4.2],
                        borderColor: '#06B6D4',
                        backgroundColor: 'rgba(6, 182, 212, 0.15)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                        x: { grid: { color: 'rgba(255,255,255,0.05)' } }
                    }
                }
            });
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.ResQAnalyticsManager) window.ResQAnalyticsManager = new AnalyticsManager();
    });
} else {
    if (!window.ResQAnalyticsManager) window.ResQAnalyticsManager = new AnalyticsManager();
}
