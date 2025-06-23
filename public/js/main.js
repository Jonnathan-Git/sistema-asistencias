// Utility functions for the attendance management system

// Show notification messages
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Confirm deletion
function confirmDelete(message = '¿Estás seguro de que deseas eliminar este elemento?') {
    return confirm(message);
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Get URL parameters
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// API request helper
async function apiRequest(url, options = {}) {
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const config = { ...defaultOptions, ...options };

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// Load data from API
async function loadData(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `/api/${endpoint}${queryString ? `?${queryString}` : ''}`;
    return await apiRequest(url);
}

// Save data to API
async function saveData(endpoint, data, method = 'POST') {
    try {
        const response = await apiRequest(`/api/${endpoint}`, {
            method: method,
            body: JSON.stringify(data)
        });
        showNotification('Datos guardados correctamente', 'success');
        return response;
    } catch (error) {
        console.error(`Error saving ${endpoint}:`, error);
        showNotification('Error al guardar los datos', 'error');
        throw error;
    }
}

// Delete data from API
async function deleteData(endpoint, id) {
    const response = await apiRequest(`/api/${endpoint}/${id}`, {
        method: 'DELETE'
    });

    if (response.message) {
        showNotification(response.message, 'success');
    }

    return response;
}

// Initialize page
function initPage() {
    // Add active class to current nav item
    const currentPage = window.location.pathname;
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');

    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });

    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Pagination functions
function createPaginationControls(pagination, onPageChange) {
    if (pagination.totalPages <= 1) {
        return '';
    }

    let paginationHTML = `
        <nav aria-label="Navegación de páginas">
            <ul class="pagination justify-content-center">
    `;

    // Previous button
    if (pagination.hasPrev) {
        paginationHTML += `
            <li class="page-item">
                <button class="page-link" onclick="onPageChange(${pagination.page - 1})">
                    <i class="bi bi-chevron-left"></i>
                    Anterior
                </button>
            </li>
        `;
    } else {
        paginationHTML += `
            <li class="page-item disabled">
                <span class="page-link">
                    <i class="bi bi-chevron-left"></i>
                    Anterior
                </span>
            </li>
        `;
    }

    // Page numbers
    const startPage = Math.max(1, pagination.page - 2);
    const endPage = Math.min(pagination.totalPages, pagination.page + 2);

    for (let i = startPage; i <= endPage; i++) {
        if (i === pagination.page) {
            paginationHTML += `
                <li class="page-item active">
                    <span class="page-link">${i}</span>
                </li>
            `;
        } else {
            paginationHTML += `
                <li class="page-item">
                    <button class="page-link" onclick="onPageChange(${i})">${i}</button>
                </li>
            `;
        }
    }

    // Next button
    if (pagination.hasNext) {
        paginationHTML += `
            <li class="page-item">
                <button class="page-link" onclick="onPageChange(${pagination.page + 1})">
                    Siguiente
                    <i class="bi bi-chevron-right"></i>
                </button>
            </li>
        `;
    } else {
        paginationHTML += `
            <li class="page-item disabled">
                <span class="page-link">
                    Siguiente
                    <i class="bi bi-chevron-right"></i>
                </span>
            </li>
        `;
    }

    paginationHTML += `
            </ul>
        </nav>
    `;

    return paginationHTML;
}

function updatePaginationInfo(pagination, containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        const startItem = (pagination.page - 1) * pagination.limit + 1;
        const endItem = Math.min(pagination.page * pagination.limit, pagination.total);

        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div class="text-muted">
                    <i class="bi bi-info-circle"></i>
                    Mostrando ${startItem} a ${endItem} de ${pagination.total} registros
                </div>
                <div class="d-flex gap-2">
                    <select class="form-select form-select-sm" style="width: auto;" onchange="changePageSize(this.value)">
                        <option value="5" ${pagination.limit === 5 ? 'selected' : ''}>5 por página</option>
                        <option value="10" ${pagination.limit === 10 ? 'selected' : ''}>10 por página</option>
                        <option value="20" ${pagination.limit === 20 ? 'selected' : ''}>20 por página</option>
                        <option value="50" ${pagination.limit === 50 ? 'selected' : ''}>50 por página</option>
                    </select>
                </div>
            </div>
        `;
    }
}

// Global pagination state
let currentPage = 1;
let currentLimit = 10;

function changePageSize(newLimit) {
    currentLimit = parseInt(newLimit);
    currentPage = 1;

    // Reload current page data
    if (window.location.pathname.includes('grupos')) {
        if (typeof loadGroups === 'function') {
            loadGroups(1);
        }
    } else if (window.location.pathname.includes('estudiantes')) {
        if (typeof loadStudents === 'function') {
            loadStudents(1);
        }
    }
}

// Export functions to global scope
window.showNotification = showNotification;
window.confirmDelete = confirmDelete;
window.formatDate = formatDate;
window.getUrlParameter = getUrlParameter;
window.apiRequest = apiRequest;
window.loadData = loadData;
window.saveData = saveData;
window.deleteData = deleteData;
window.createPaginationControls = createPaginationControls;
window.updatePaginationInfo = updatePaginationInfo;
window.changePageSize = changePageSize;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initPage); 