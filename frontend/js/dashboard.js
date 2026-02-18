// Dashboard JavaScript for Fake News Detection System

// Dashboard State
let dashboardState = {
    predictions: [],
    statistics: {
        total: 0,
        fake: 0,
        real: 0,
        suspicious: 0
    },
    charts: {}
};

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
    setupEventListeners();
    startRealTimeUpdates();
});

async function initializeDashboard() {
    showLoading();
    
    try {
        await loadPredictions();
        await loadStatistics();
        initializeCharts();
        updateDashboardUI();
    } catch (error) {
        console.error('Dashboard initialization failed:', error);
        showNotification('Failed to load dashboard data', 'error');
    } finally {
        hideLoading();
    }
}

// Load Predictions
async function loadPredictions() {
    try {
        const response = await fetch('/api/history');
        const data = await response.json();
        dashboardState.predictions = data.history || [];
    } catch (error) {
        console.error('Failed to load predictions:', error);
        throw error;
    }
}

// Load Statistics
async function loadStatistics() {
    const predictions = dashboardState.predictions;
    
    dashboardState.statistics = {
        total: predictions.length,
        fake: predictions.filter(p => p.result === 'FAKE NEWS').length,
        real: predictions.filter(p => p.result === 'REAL NEWS').length,
        suspicious: predictions.filter(p => p.result === 'SUSPICIOUS').length
    };
}

// Initialize Charts
function initializeCharts() {
    // Time Chart
    const timeCtx = document.getElementById('timeChart');
    if (timeCtx) {
        dashboardState.charts.time = new Chart(timeCtx, {
            type: 'line',
            data: getTimeChartData(),
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
    
    // Distribution Chart
    const distCtx = document.getElementById('distributionChart');
    if (distCtx) {
        dashboardState.charts.distribution = new Chart(distCtx, {
            type: 'doughnut',
            data: getDistributionData(),
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                cutout: '60%'
            }
        });
    }
    
    // Confidence Chart
    const confCtx = document.getElementById('confidenceChart');
    if (confCtx) {
        dashboardState.charts.confidence = new Chart(confCtx, {
            type: 'bar',
            data: getConfidenceData(),
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
}

// Get Time Chart Data
function getTimeChartData() {
    const last7Days = getLastNDays(7);
    const fakeCounts = new Array(7).fill(0);
    const realCounts = new Array(7).fill(0);
    const suspiciousCounts = new Array(7).fill(0);
    
    dashboardState.predictions.forEach(p => {
        const date = new Date(p.timestamp).toLocaleDateString();
        const index = last7Days.indexOf(date);
        
        if (index !== -1) {
            if (p.result === 'FAKE NEWS') fakeCounts[index]++;
            else if (p.result === 'REAL NEWS') realCounts[index]++;
            else if (p.result === 'SUSPICIOUS') suspiciousCounts[index]++;
        }
    });
    
    return {
        labels: last7Days,
        datasets: [
            {
                label: 'Fake News',
                data: fakeCounts,
                borderColor: '#f72585',
                backgroundColor: 'rgba(247, 37, 133, 0.1)',
                tension: 0.4
            },
            {
                label: 'Real News',
                data: realCounts,
                borderColor: '#4cc9f0',
                backgroundColor: 'rgba(76, 201, 240, 0.1)',
                tension: 0.4
            },
            {
                label: 'Suspicious',
                data: suspiciousCounts,
                borderColor: '#f8961e',
                backgroundColor: 'rgba(248, 150, 30, 0.1)',
                tension: 0.4
            }
        ]
    };
}

// Get Distribution Data
function getDistributionData() {
    return {
        labels: ['Fake News', 'Real News', 'Suspicious'],
        datasets: [{
            data: [
                dashboardState.statistics.fake,
                dashboardState.statistics.real,
                dashboardState.statistics.suspicious
            ],
            backgroundColor: ['#f72585', '#4cc9f0', '#f8961e'],
            borderWidth: 0
        }]
    };
}

// Get Confidence Data
function getConfidenceData() {
    const ranges = {
        '0-20%': 0,
        '21-40%': 0,
        '41-60%': 0,
        '61-80%': 0,
        '81-100%': 0
    };
    
    dashboardState.predictions.forEach(p => {
        const conf = p.confidence * 100;
        if (conf <= 20) ranges['0-20%']++;
        else if (conf <= 40) ranges['21-40%']++;
        else if (conf <= 60) ranges['41-60%']++;
        else if (conf <= 80) ranges['61-80%']++;
        else ranges['81-100%']++;
    });
    
    return {
        labels: Object.keys(ranges),
        datasets: [{
            label: 'Number of Predictions',
            data: Object.values(ranges),
            backgroundColor: '#4361ee',
            borderRadius: 5
        }]
    };
}

// Get Last N Days
function getLastNDays(n) {
    const dates = [];
    for (let i = n - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toLocaleDateString());
    }
    return dates;
}

// Update Dashboard UI
function updateDashboardUI() {
    updateKPIs();
    updateRecentPredictions();
    updateModelMetrics();
}

// Update KPIs
function updateKPIs() {
    document.getElementById('totalPredictions').textContent = dashboardState.statistics.total;
    document.getElementById('fakeCount').textContent = dashboardState.statistics.fake;
    document.getElementById('realCount').textContent = dashboardState.statistics.real;
    document.getElementById('suspiciousCount').textContent = dashboardState.statistics.suspicious;
}

// Update Recent Predictions
function updateRecentPredictions() {
    const tableBody = document.getElementById('recentPredictions');
    if (!tableBody) return;
    
    const recent = dashboardState.predictions.slice(0, 10);
    
    if (recent.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-state">
                    <i class="fas fa-chart-line"></i>
                    <p>No predictions yet</p>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    recent.forEach(p => {
        const statusClass = p.result === 'FAKE NEWS' ? 'status-fake' :
                           p.result === 'REAL NEWS' ? 'status-real' : 'status-suspicious';
        
        html += `
            <tr>
                <td>${new Date(p.timestamp).toLocaleString()}</td>
                <td>${p.title}</td>
                <td><span class="status-badge ${statusClass}">${p.result}</span></td>
                <td>${(p.confidence * 100).toFixed(1)}%</td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

// Update Model Metrics
function updateModelMetrics() {
    const avgConfidence = dashboardState.predictions.length > 0
        ? dashboardState.predictions.reduce((sum, p) => sum + p.confidence, 0) / dashboardState.predictions.length
        : 0;
    
    const avgConfidenceEl = document.getElementById('avgConfidence');
    if (avgConfidenceEl) {
        avgConfidenceEl.textContent = `${(avgConfidence * 100).toFixed(1)}%`;
    }
}

// Setup Event Listeners
function setupEventListeners() {
    const refreshBtn = document.getElementById('refreshDashboard');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshDashboard);
    }
}

// Refresh Dashboard
async function refreshDashboard() {
    showLoading();
    
    try {
        await loadPredictions();
        await loadStatistics();
        
        // Update charts
        if (dashboardState.charts.time) {
            dashboardState.charts.time.data = getTimeChartData();
            dashboardState.charts.time.update();
        }
        
        if (dashboardState.charts.distribution) {
            dashboardState.charts.distribution.data = getDistributionData();
            dashboardState.charts.distribution.update();
        }
        
        if (dashboardState.charts.confidence) {
            dashboardState.charts.confidence.data = getConfidenceData();
            dashboardState.charts.confidence.update();
        }
        
        updateDashboardUI();
        showNotification('Dashboard refreshed', 'success');
    } catch (error) {
        console.error('Refresh failed:', error);
        showNotification('Failed to refresh', 'error');
    } finally {
        hideLoading();
    }
}

// Real-time Updates
function startRealTimeUpdates() {
    setInterval(async () => {
        await loadPredictions();
        await loadStatistics();
        
        if (dashboardState.charts.time) {
            dashboardState.charts.time.data = getTimeChartData();
            dashboardState.charts.time.update();
        }
        
        if (dashboardState.charts.distribution) {
            dashboardState.charts.distribution.data = getDistributionData();
            dashboardState.charts.distribution.update();
        }
        
        if (dashboardState.charts.confidence) {
            dashboardState.charts.confidence.data = getConfidenceData();
            dashboardState.charts.confidence.update();
        }
        
        updateDashboardUI();
    }, 30000);
}

// Loading Functions
function showLoading() {
    const loader = document.getElementById('dashboardLoader');
    if (loader) {
        loader.style.display = 'flex';
    }
}

function hideLoading() {
    const loader = document.getElementById('dashboardLoader');
    if (loader) {
        loader.style.display = 'none';
    }
}

// Show Notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                       type === 'error' ? 'fa-exclamation-circle' : 
                       type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        background: type === 'success' ? '#4cc9f0' :
                   type === 'error' ? '#f72585' :
                   type === 'warning' ? '#f8961e' : '#4361ee',
        color: '#fff',
        borderRadius: '10px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        zIndex: '9999',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        animation: 'slideInRight 0.3s ease',
        cursor: 'pointer'
    });
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    notification.addEventListener('click', () => notification.remove());
}