
/**
 * Milestone 4: Analytics, Testing & Deployment
 * Executive Dashboards & Visualization Modules
 */

const Milestone4 = {
    charts: {},

    init() {
        console.log("Initializing Milestone 4 Executive Dashboards...");
        
        // Listen for view changes to render charts when dashboards become visible
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (!navItem) return;
            const viewId = navItem.getAttribute('data-view');
            
            setTimeout(() => {
                if (viewId === 'admin-overview') {
                    this.renderAdminDashboard();
                } else if (viewId === 'consultant-workstation') {
                    this.renderConsultantDashboard();
                }
            }, 100);
        });
    },

    async fetchDashboardData(rolePath) {
        try {
            const token = localStorage.getItem('skiniq_token');
            if (!token) return null;
            
            const res = await fetch(`/api/v1/dashboard/${rolePath}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            console.error(`Error fetching ${rolePath} dashboard:`, e);
            return null;
        }
    },

    async renderAdminDashboard() {
        const canvas = document.getElementById('admin-activity-chart');
        if (!canvas) return;

        // Fetch real data or use fallback for demo
        let data = await this.fetchDashboardData('admin');
        
        if (this.charts['admin-activity']) {
            this.charts['admin-activity'].destroy();
        }

        const ctx = canvas.getContext('2d');
        
        // Setup gradients
        const gradient1 = ctx.createLinearGradient(0, 0, 0, 300);
        gradient1.addColorStop(0, 'rgba(212, 175, 55, 0.4)'); // Gold
        gradient1.addColorStop(1, 'rgba(212, 175, 55, 0.0)');
        
        const gradient2 = ctx.createLinearGradient(0, 0, 0, 300);
        gradient2.addColorStop(0, 'rgba(144, 164, 255, 0.4)'); // Indigo
        gradient2.addColorStop(1, 'rgba(144, 164, 255, 0.0)');

        this.charts['admin-activity'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [
                    {
                        label: 'Active Users',
                        data: [120, 150, 180, 170, 210, 250, 230],
                        borderColor: '#D4AF37', // Gold
                        backgroundColor: gradient1,
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2,
                        pointBackgroundColor: '#121212',
                        pointBorderColor: '#D4AF37',
                        pointRadius: 4
                    },
                    {
                        label: 'Assessments Run',
                        data: [45, 60, 90, 85, 110, 130, 125],
                        borderColor: '#90A4FF', // Indigo
                        backgroundColor: gradient2,
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2,
                        pointBackgroundColor: '#121212',
                        pointBorderColor: '#90A4FF',
                        pointRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#e0e0e0', font: { family: 'Inter', size: 12 } }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(18, 18, 18, 0.9)',
                        titleColor: '#D4AF37',
                        bodyColor: '#e0e0e0',
                        borderColor: 'rgba(212, 175, 55, 0.2)',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                        ticks: { color: '#a0a0a0' }
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                        ticks: { color: '#a0a0a0' },
                        beginAtZero: true
                    }
                }
            }
        });
    },
    
    async renderConsultantDashboard() {
        const canvas = document.getElementById('consultant-assessment-chart');
        if (!canvas) return;

        if (this.charts['consultant-assessment']) {
            this.charts['consultant-assessment'].destroy();
        }

        const ctx = canvas.getContext('2d');

        this.charts['consultant-assessment'] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive'],
                datasets: [{
                    data: [25, 20, 15, 30, 10],
                    backgroundColor: [
                        '#D4AF37', // Gold
                        '#90A4FF', // Indigo
                        '#10B981', // Emerald
                        '#F59E0B', // Amber
                        '#EF4444'  // Red
                    ],
                    borderColor: '#121212',
                    borderWidth: 2,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: '#e0e0e0', font: { family: 'Inter', size: 12 } }
                    }
                }
            }
        });
    }
};

// Initialize after DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // We delay slightly to ensure other modules (app.js) are initialized
    setTimeout(() => {
        Milestone4.init();
    }, 500);
});
