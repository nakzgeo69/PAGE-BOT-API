// DOM Elements
const loadingOverlay = document.getElementById('loadingOverlay');
const sideNav = document.getElementById('sideNav');
const menuToggle = document.getElementById('menuToggle');
const categoryNav = document.getElementById('categoryNav');
const apiList = document.getElementById('apiList');
const emptyState = document.getElementById('emptyState');
const statsOverview = document.getElementById('statsOverview');
const tryApiSection = document.getElementById('tryApiSection');
const apiEndpoint = document.getElementById('apiEndpoint');
const fullApiUrl = document.getElementById('fullApiUrl');
const tryApiBtn = document.getElementById('tryApiBtn');
const getApiBtn = document.getElementById('getApiBtn');
const queryParamsSection = document.getElementById('queryParamsSection');
const queryParamsContainer = document.getElementById('queryParamsContainer');
const responseContainer = document.getElementById('responseContainer');
const responseContent = document.getElementById('responseContent');
const responseTime = document.getElementById('responseTime');
const responseSize = document.getElementById('responseSize');
const responseStatus = document.getElementById('responseStatus');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const successMessage = document.getElementById('successMessage');
const successText = document.getElementById('successText');

// Current state
let currentApi = null;
let allApis = [];
let categories = {};

// ============================================================
// MOCK API DATA (para hindi na kailangan ng server)
// ============================================================
const mockApiData = [
    {
        id: 'api-1',
        name: 'Generate Content',
        category: 'AI Services',
        method: 'POST',
        route: '/api/generate',
        description: 'Generate content based on prompt and UID',
        usage: '/api/generate?uid=<user_id>&prompt=<your_prompt>'
    },
    {
        id: 'api-2',
        name: 'User Profile',
        category: 'User',
        method: 'GET',
        route: '/api/user/profile',
        description: 'Get user profile by UID',
        usage: '/api/user/profile?uid=<user_id>'
    },
    {
        id: 'api-3',
        name: 'Health Check',
        category: 'System',
        method: 'GET',
        route: '/api/health',
        description: 'Check API health status',
        usage: '/api/health'
    },
    {
        id: 'api-4',
        name: 'Update Settings',
        category: 'User',
        method: 'PUT',
        route: '/api/user/settings',
        description: 'Update user settings (requires UID)',
        usage: '/api/user/settings?uid=<user_id>&theme=<dark|light>'
    },
    {
        id: 'api-5',
        name: 'Delete Account',
        category: 'User',
        method: 'DELETE',
        route: '/api/user/delete',
        description: 'Delete user account by UID',
        usage: '/api/user/delete?uid=<user_id>'
    }
];

// ============================================================
// INITIALIZATION
// ============================================================
async function init() {
    try {
        // Use mock data instead of fetching from server
        allApis = mockApiData;
        
        // Group APIs by category
        categories = {};
        allApis.forEach(api => {
            if (!categories[api.category]) {
                categories[api.category] = [];
            }
            categories[api.category].push(api);
        });
        
        // Render everything
        renderCategoryNav(categories);
        renderStats(allApis, categories);
        
        // Load first API by default
        if (allApis.length > 0) {
            const firstCategory = Object.keys(categories)[0];
            const firstApi = categories[firstCategory][0];
            currentApi = firstApi;
            loadApiDetails(firstApi.id);
            updateTryApiSection(firstApi);
            
            // Set first nav item as active
            const firstNavItem = document.querySelector('.nav-item');
            if (firstNavItem) firstNavItem.classList.add('active');
            
            // Set first category as active
            const firstCategoryElement = document.querySelector('.category');
            if (firstCategoryElement) firstCategoryElement.classList.add('active');
        }
        
        // Hide loading overlay
        setTimeout(() => {
            loadingOverlay.classList.add('hidden');
        }, 500);
        
    } catch (error) {
        console.error('Error loading APIs:', error);
        showError(`Unable to load API data: ${error.message}. Please refresh the page.`);
        loadingOverlay.innerHTML = `
            <div style="text-align: center; color: white;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px;"></i>
                <h3>Failed to Load Dashboard</h3>
                <p>${error.message}</p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #4361ee; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
}

// ============================================================
// RENDER FUNCTIONS
// ============================================================

// Render category navigation
function renderCategoryNav(categories) {
    let navHTML = '';
    
    for (const [categoryName, apis] of Object.entries(categories)) {
        navHTML += `
            <div class="category">
                <div class="category-title">
                    <span>${categoryName} (${apis.length})</span>
                    <i class="fas fa-chevron-right"></i>
                </div>
                <div class="api-list">
        `;
        
        apis.forEach(api => {
            const methodIcon = getMethodIcon(api.method);
            navHTML += `
                <div class="nav-item" data-api-id="${api.id}">
                    ${methodIcon} ${api.name}
                </div>
            `;
        });
        
        navHTML += `</div></div>`;
    }
    
    categoryNav.innerHTML = navHTML;
    
    // Add event listeners
    document.querySelectorAll('.category-title').forEach(title => {
        title.addEventListener('click', function() {
            const category = this.parentElement;
            category.classList.toggle('active');
        });
    });
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.nav-item').forEach(navItem => {
                navItem.classList.remove('active');
            });
            
            this.classList.add('active');
            
            const apiId = this.getAttribute('data-api-id');
            const api = allApis.find(cmd => cmd.id === apiId);
            
            if (api) {
                currentApi = api;
                loadApiDetails(apiId);
                updateTryApiSection(api);
            }
            
            // Close mobile menu if open
            if (window.innerWidth <= 768) {
                sideNav.classList.remove('active');
                menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
                menuToggle.classList.remove('active');
            }
        });
    });
}

// Render stats
function renderStats(commands, categories) {
    const totalAPIs = commands.length;
    const totalCategories = Object.keys(categories).length;
    
    // Count methods
    const methodCounts = {
        GET: 0,
        POST: 0,
        PUT: 0,
        DELETE: 0,
        PATCH: 0
    };
    
    commands.forEach(cmd => {
        if (methodCounts[cmd.method] !== undefined) {
            methodCounts[cmd.method]++;
        }
    });
    
    const mostCommonMethod = Object.entries(methodCounts)
        .sort((a, b) => b[1] - a[1])[0][0];
    
    statsOverview.innerHTML = `
        <div class="stat-card">
            <i class="fas fa-link"></i>
            <h4>${totalAPIs}</h4>
            <p>Total APIs</p>
        </div>
        <div class="stat-card">
            <i class="fas fa-folder"></i>
            <h4>${totalCategories}</h4>
            <p>Categories</p>
        </div>
        <div class="stat-card">
            <i class="fas fa-exchange-alt"></i>
            <h4>${mostCommonMethod}</h4>
            <p>Most Common Method</p>
        </div>
        <div class="stat-card">
            <i class="fas fa-bolt"></i>
            <h4>${commands.filter(cmd => cmd.method === 'GET').length}</h4>
            <p>GET Endpoints</p>
        </div>
    `;
}

// Load API details
function loadApiDetails(apiId) {
    const api = allApis.find(cmd => cmd.id === apiId);
    
    if (!api) {
        emptyState.style.display = 'block';
        apiList.innerHTML = '';
        tryApiSection.style.display = 'none';
        return;
    }
    
    emptyState.style.display = 'none';
    tryApiSection.style.display = 'block';
    
    const methodClass = `method-${api.method.toLowerCase()}`;
    const methodIcon = getMethodIcon(api.method);
    
    // Parse usage for parameters
    const queryParams = parseQueryParameters(api.usage);
    
    let paramsHTML = '';
    if (queryParams.length > 0) {
        paramsHTML = `
            <div class="api-info">
                <strong>Query Parameters:</strong>
                <ul style="margin-left: 20px; margin-top: 5px;">
                    ${queryParams.map(param => `<li><code>${param.name}</code> - ${param.description || 'No description'}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    const apiHTML = `
        <div class="api-container">
            <div class="api-header">
                <h3>${methodIcon} ${api.name}</h3>
                <span class="method-badge ${methodClass}">${api.method}</span>
            </div>
            
            <div class="api-info">
                <strong>Description:</strong> ${api.description}
            </div>
            
            <div class="api-info">
                <strong>Route:</strong> <code>${api.route}</code>
            </div>
            
            <div class="api-info">
                <strong>Method:</strong> ${api.method}
            </div>
            
            <div class="api-info">
                <strong>Category:</strong> ${api.category}
            </div>
            
            ${paramsHTML}
            
            <div class="api-info">
                <strong>Usage:</strong> <code>${api.usage}</code>
            </div>
            
            <div class="api-info">
                <strong>Full URL:</strong> <code>${window.location.origin}${api.route}</code>
            </div>
        </div>
    `;
    
    apiList.innerHTML = apiHTML;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Parse query parameters from usage string
function parseQueryParameters(usage) {
    const params = [];
    
    if (!usage || !usage.includes('?')) {
        return params;
    }
    
    // Extract the query string part
    const queryString = usage.split('?')[1];
    
    // Split by & to get individual parameters
    const paramStrings = queryString.split('&');
    
    paramStrings.forEach(paramStr => {
        if (paramStr.includes('=')) {
            const [name, value] = paramStr.split('=');
            
            // Extract parameter info from value like <spotify_track_url>
            let description = '';
            let isRequired = false;
            
            if (value.startsWith('<') && value.endsWith('>')) {
                isRequired = true;
                const paramName = value.slice(1, -1).replace(/_/g, ' ');
                description = `Required. ${paramName.charAt(0).toUpperCase() + paramName.slice(1)}`;
            } else {
                description = `Optional. Example: ${value}`;
            }
            
            params.push({
                name: name.trim(),
                value: value.trim(),
                description: description,
                required: isRequired
            });
        }
    });
    
    return params;
}

// Get icon for HTTP method
function getMethodIcon(method) {
    const icons = {
        'GET': 'fas fa-download',
        'POST': 'fas fa-plus-circle',
        'PUT': 'fas fa-edit',
        'DELETE': 'fas fa-trash',
        'PATCH': 'fas fa-pen'
    };
    return `<i class="${icons[method] || 'fas fa-code'}"></i>`;
}

// Format bytes to human readable format
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// ============================================================
// UI UPDATE FUNCTIONS
// ============================================================

// Update the Try API section
function updateTryApiSection(api) {
    const baseUrl = `${window.location.origin}${api.route}`;
    
    // Display route and full URL
    apiEndpoint.textContent = api.route;
    fullApiUrl.textContent = baseUrl;
    
    // Update button text based on method
    let buttonText = 'Test API';
    if (api.method === 'GET') buttonText = 'Test GET API';
    if (api.method === 'POST') buttonText = 'Test POST API';
    if (api.method === 'PUT') buttonText = 'Test PUT API';
    if (api.method === 'DELETE') buttonText = 'Test DELETE API';
    
    tryApiBtn.innerHTML = `<i class="fas fa-play-circle"></i> ${buttonText}`;
    
    // Update GET API button
    if (api.route && api.route !== '/') {
        getApiBtn.style.display = 'inline-flex';
        getApiBtn.href = baseUrl;
    } else {
        getApiBtn.style.display = 'none';
    }
    
    // Parse and display query parameters
    const queryParams = parseQueryParameters(api.usage);
    let paramsHTML = '';
    
    if (queryParams.length > 0) {
        queryParams.forEach(param => {
            paramsHTML += `
                <div class="param-row">
                    <div class="param-label">
                        ${param.name}
                        ${param.required ? '<span class="param-required">*</span>' : ''}
                    </div>
                    <input type="text" 
                           class="param-input" 
                           id="param-${param.name}" 
                           placeholder="${param.description || `Enter value for ${param.name}`}"
                           data-param="${param.name}"
                           ${param.required ? 'required' : ''}>
                </div>
            `;
        });
        
        queryParamsContainer.innerHTML = paramsHTML;
        queryParamsSection.classList.add('show');
        
        // Add input listeners to update GET URL
        document.querySelectorAll('.param-input').forEach(input => {
            input.addEventListener('input', function() {
                if (currentApi) {
                    updateGetApiButton(currentApi);
                }
            });
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    tryApiBtn.click();
                }
            });
        });
    } else {
        queryParamsContainer.innerHTML = '<p class="no-params">No query parameters needed for this endpoint.</p>';
        queryParamsSection.classList.remove('show');
    }
    
    // Hide response container
    responseContainer.classList.remove('show');
    
    // Clear any messages
    hideMessages();
}

// Update GET API button URL with parameters
function updateGetApiButton(api) {
    const urlWithParams = buildUrlWithParams(api);
    const fullUrl = `${window.location.origin}${urlWithParams}`;
    
    // Update the GET button
    getApiBtn.href = fullUrl;
    fullApiUrl.textContent = fullUrl;
}

// Build URL with query parameters
function buildUrlWithParams(api) {
    let url = api.route;
    
    // Add query parameters if they exist
    const queryParams = parseQueryParameters(api.usage);
    const queryStrings = [];
    
    queryParams.forEach(param => {
        const input = document.getElementById(`param-${param.name}`);
        if (input && input.value.trim()) {
            queryStrings.push(`${param.name}=${encodeURIComponent(input.value.trim())}`);
        } else if (param.required) {
            // For required parameters with no value, use "example" as default
            queryStrings.push(`${param.name}=example`);
        }
    });
    
    // Add query string if there are parameters
    if (queryStrings.length > 0) {
        url += '?' + queryStrings.join('&');
    }
    
    return url;
}

// ============================================================
// MESSAGE FUNCTIONS
// ============================================================

// Show error message
function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.add('show');
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 5000);
}

// Show success message
function showSuccess(message) {
    successText.textContent = message;
    successMessage.classList.add('show');
    setTimeout(() => {
        successMessage.classList.remove('show');
    }, 3000);
}

// Hide all messages
function hideMessages() {
    errorMessage.classList.remove('show');
    successMessage.classList.remove('show');
}

// ============================================================
// MOCK API TEST FUNCTION (para hindi na kailangan ng totoong server)
// ============================================================
async function mockApiTest(api, url) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));
    
    // Get parameter values for display
    const params = parseQueryParameters(api.usage);
    const paramValues = {};
    params.forEach(p => {
        const input = document.getElementById(`param-${p.name}`);
        paramValues[p.name] = input ? input.value.trim() || 'example' : 'example';
    });
    
    // Generate mock response based on API
    let mockData = {
        success: true,
        message: 'API test successful (mock)',
        endpoint: api.route,
        method: api.method,
        timestamp: new Date().toISOString(),
        parameters: paramValues
    };
    
    // Add specific data based on API
    if (api.id === 'api-1') {
        mockData.data = {
            uid: paramValues.uid || '123',
            prompt: paramValues.prompt || 'Hello world',
            result: 'Generated content based on your prompt and UID'
        };
    } else if (api.id === 'api-2') {
        mockData.data = {
            uid: paramValues.uid || '123',
            name: 'John Doe',
            email: 'john@example.com',
            role: 'user'
        };
    } else if (api.id === 'api-3') {
        mockData.status = 'healthy';
        mockData.uptime = '99.9%';
    } else if (api.id === 'api-4') {
        mockData.data = {
            uid: paramValues.uid || '123',
            theme: paramValues.theme || 'dark',
            updated: true
        };
    } else if (api.id === 'api-5') {
        mockData.data = {
            uid: paramValues.uid || '123',
            deleted: true,
            message: 'Account deleted successfully'
        };
    }
    
    return {
        ok: true,
        status: 200,
        json: async () => mockData,
        text: async () => JSON.stringify(mockData, null, 2)
    };
}

// ============================================================
// EVENT LISTENERS
// ============================================================

// Try API button click handler
tryApiBtn.addEventListener('click', async function() {
    if (!currentApi) {
        showError('No API selected. Please select an API from the sidebar.');
        return;
    }
    
    // Show loading state
    const originalText = tryApiBtn.innerHTML;
    tryApiBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
    tryApiBtn.disabled = true;
    
    // Build URL with parameters
    const url = buildUrlWithParams(currentApi);
    const fullUrl = `${window.location.origin}${url}`;
    
    // Update displayed URL
    fullApiUrl.textContent = fullUrl;
    
    try {
        const startTime = Date.now();
        
        // Use mock API test instead of real fetch
        const response = await mockApiTest(currentApi, url);
        
        const endTime = Date.now();
        
        // Calculate response time
        const responseTimeMs = endTime - startTime;
        let responseData;
        
        // Parse response
        try {
            responseData = await response.json();
        } catch (e) {
            responseData = await response.text();
        }
        
        // Format response data
        const formattedResponse = typeof responseData === 'object' 
            ? JSON.stringify(responseData, null, 2)
            : responseData;
        
        // Calculate response size
        const responseSizeBytes = new Blob([formattedResponse]).size;
        const responseSizeFormatted = formatBytes(responseSizeBytes);
        
        // Update response container
        responseContent.textContent = formattedResponse;
        responseTime.textContent = `${responseTimeMs}ms`;
        responseSize.textContent = responseSizeFormatted;
        responseStatus.textContent = response.status;
        responseStatus.style.color = response.ok ? '#2e7d32' : '#c62828';
        
        // Show response container
        responseContainer.classList.add('show');
        
        // Scroll to response
        responseContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Show success message
        if (response.ok) {
            showSuccess(`API test successful! Status: ${response.status}`);
        } else {
            showError(`API test failed with status: ${response.status}`);
        }
        
    } catch (error) {
        console.error('API test failed:', error);
        showError(`API test failed: ${error.message}`);
        
        // Still show response container with error
        responseContent.textContent = `Error: ${error.message}\n\nURL tested: ${fullUrl}`;
        responseTime.textContent = '0ms';
        responseSize.textContent = '0 B';
        responseStatus.textContent = 'Error';
        responseStatus.style.color = '#c62828';
        responseContainer.classList.add('show');
    } finally {
        // Restore button
        tryApiBtn.innerHTML = originalText;
        tryApiBtn.disabled = false;
    }
});

// Mobile menu toggle
menuToggle.addEventListener('click', function() {
    sideNav.classList.toggle('active');
    this.classList.toggle('active');
    
    if (sideNav.classList.contains('active')) {
        this.innerHTML = '<i class="fas fa-times"></i>';
    } else {
        this.innerHTML = '<i class="fas fa-bars"></i>';
    }
});

// Close mobile menu when clicking outside on mobile
document.addEventListener('click', function(event) {
    if (window.innerWidth <= 768) {
        const isClickInsideNav = sideNav.contains(event.target);
        const isClickOnToggle = menuToggle.contains(event.target);
        
        if (!isClickInsideNav && !isClickOnToggle && sideNav.classList.contains('active')) {
            sideNav.classList.remove('active');
            menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            menuToggle.classList.remove('active');
        }
    }
});

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
