// Main JavaScript for Fake News Detection System

// API Configuration
const API_BASE_URL = window.location.origin;
const API_ENDPOINTS = {
    predict: `${API_BASE_URL}/api/predict`,
    history: `${API_BASE_URL}/api/history`,
    modelInfo: `${API_BASE_URL}/api/model-info`,
    health: `${API_BASE_URL}/api/health`
};

// State Management
let appState = {
    isAnalyzing: false,
    lastResult: null,
    history: []
};

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    checkAPIHealth();
    loadModelInfo();
    initializeFormHandlers();
    loadHistory();
    initializeMobileMenu();
}

// Check API Health
async function checkAPIHealth() {
    try {
        const response = await fetch(API_ENDPOINTS.health);
        const data = await response.json();
        
        if (data.status === 'healthy') {
            showNotification('System is ready!', 'success');
        } else {
            showNotification('System is starting up...', 'warning');
        }
    } catch (error) {
        console.error('Health check failed:', error);
        showNotification('Cannot connect to server', 'error');
    }
}

// Load Model Info
async function loadModelInfo() {
    try {
        const response = await fetch(API_ENDPOINTS.modelInfo);
        const data = await response.json();
        appState.modelInfo = data;
    } catch (error) {
        console.error('Failed to load model info:', error);
    }
}

// Initialize Form Handlers
function initializeFormHandlers() {
    const detectionForm = document.getElementById('detectionForm');
    if (detectionForm) {
        detectionForm.addEventListener('submit', handleFormSubmit);
    }
    
    const titleInput = document.getElementById('title');
    const textInput = document.getElementById('text');
    
    if (titleInput) {
        titleInput.addEventListener('input', validateForm);
    }
    
    if (textInput) {
        textInput.addEventListener('input', validateForm);
    }
    
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearForm);
    }
    
    const exampleBtns = document.querySelectorAll('.example-btn');
    exampleBtns.forEach(btn => {
        btn.addEventListener('click', () => loadExample(btn.dataset.example));
    });
}

// Handle Form Submit
async function handleFormSubmit(event) {
    event.preventDefault();
    
    if (appState.isAnalyzing) {
        showNotification('Already analyzing...', 'warning');
        return;
    }
    
    const title = document.getElementById('title').value;
    const text = document.getElementById('text').value;
    
    if (!validateInput(title, text)) {
        return;
    }
    
    setLoadingState(true);
    
    try {
        const response = await fetch(API_ENDPOINTS.predict, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, text })
        });
        
        const data = await response.json();
        
        if (data.success) {
            appState.lastResult = data.prediction;
            displayResult(data.prediction, data.preview);
            await loadHistory();
            showNotification('Analysis complete!', 'success');
        } else {
            showNotification(data.error || 'Analysis failed', 'error');
        }
    } catch (error) {
        console.error('Prediction error:', error);
        showNotification('Network error. Please try again.', 'error');
    } finally {
        setLoadingState(false);
    }
}

// Validate Input
function validateInput(title, text) {
    if (!title && !text) {
        showNotification('Please enter a title or text to analyze', 'warning');
        return false;
    }
    return true;
}

// Validate Form
function validateForm() {
    const title = document.getElementById('title').value;
    const text = document.getElementById('text').value;
    const submitBtn = document.getElementById('submitBtn');
    
    if (submitBtn) {
        submitBtn.disabled = !title && !text;
    }
}

// Set Loading State
function setLoadingState(isLoading) {
    appState.isAnalyzing = isLoading;
    
    const submitBtn = document.getElementById('submitBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    if (submitBtn) {
        submitBtn.disabled = isLoading;
        submitBtn.innerHTML = isLoading ? 
            '<i class="fas fa-spinner fa-spin"></i> Analyzing...' : 
            '<i class="fas fa-search"></i> Detect Fake News';
    }
    
    if (loadingSpinner) {
        loadingSpinner.style.display = isLoading ? 'block' : 'none';
    }
}

// Display Result
function displayResult(prediction, preview) {
    const resultsSection = document.getElementById('resultsSection');
    if (!resultsSection) return;
    
    resultsSection.style.display = 'block';
    
    const resultHTML = `
        <div class="result-card">
            <div class="result-icon">${prediction.icon}</div>
            <h2 class="result-title" style="color: ${prediction.color}">${prediction.result}</h2>
            <div class="confidence-meter">
                <div class="confidence-fill" style="width: ${prediction.confidence_percentage}; background: ${prediction.color}"></div>
            </div>
            <div class="confidence-label">
                <strong>Confidence:</strong> ${prediction.confidence_percentage} (${prediction.confidence_level})
            </div>
            <div class="result-message">
                <i class="fas fa-info-circle"></i> ${prediction.message}
            </div>
            <div class="preview-text">
                <p><strong>Title:</strong> ${preview.title}</p>
                <p><strong>Text:</strong> ${preview.text}</p>
            </div>
        </div>
    `;
    
    resultsSection.innerHTML = resultHTML;
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Load History
async function loadHistory() {
    try {
        const response = await fetch(API_ENDPOINTS.history);
        const data = await response.json();
        appState.history = data.history;
        updateHistoryTable(data.history);
    } catch (error) {
        console.error('Failed to load history:', error);
    }
}

// Update History Table
function updateHistoryTable(history) {
    const tableBody = document.getElementById('historyTableBody');
    if (!tableBody) return;
    
    if (history.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>No predictions yet. Start analyzing!</p>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    history.slice(0, 5).forEach(item => {
        const statusClass = item.result === 'FAKE NEWS' ? 'status-fake' : 
                           item.result === 'REAL NEWS' ? 'status-real' : 'status-suspicious';
        
        html += `
            <tr>
                <td>${new Date(item.timestamp).toLocaleString()}</td>
                <td>${item.title}</td>
                <td><span class="status-badge ${statusClass}">${item.result}</span></td>
                <td>${(item.confidence * 100).toFixed(1)}%</td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

// Clear Form
function clearForm() {
    document.getElementById('title').value = '';
    document.getElementById('text').value = '';
    
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.style.display = 'none';
    }
    
    validateForm();
}

// Load Example
function loadExample(exampleId) {
    const examples = {
        fake: {
            title: 'BREAKING: Aliens Found on Mars! NASA Confirms!',
            text: 'In a shocking revelation today, NASA scientists have confirmed the discovery of alien life on Mars. The evidence includes photos showing what appears to be structures and moving objects on the red planet. This groundbreaking discovery will change everything we know about life in the universe. Scientists are planning a press conference for later today to discuss the implications of this historic finding.'
        },
        real: {
            title: 'Local Community Center Opens New Library Wing',
            text: 'The Downtown Community Center celebrated the opening of its new library wing today. The expansion adds 5000 square feet of space and includes a children\'s reading room, computer lab, and study areas. Funding was provided by local donations and a state grant. The new facilities will be open to the public starting next Monday, with a special story time for children scheduled for the weekend.'
        }
    };
    
    const example = examples[exampleId];
    if (example) {
        document.getElementById('title').value = example.title;
        document.getElementById('text').value = example.text;
        validateForm();
    }
}

// Initialize Mobile Menu
function initializeMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
        
        document.addEventListener('click', (e) => {
            if (!menuToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
            }
        });
    }
}

// Show Notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${getNotificationIcon(type)}"></i>
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

function getNotificationIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
}