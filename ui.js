function showSection(sectionId) {
    // Verificar autenticación antes de mostrar secciones protegidas
    const isAuthenticated = localStorage.getItem('jwt_token') !== null;
    const protectedSections = ['personajes-section', 'dashboard-section', 'link-twitch-section'];
    
    if (protectedSections.includes(sectionId) && !isAuthenticated) {
        return; // No mostrar secciones protegidas si no está autenticado
    }

    // Ocultar todas las secciones protegidas primero
    protectedSections.forEach(id => {
        const section = document.getElementById(id);
        if (section) {
            section.style.display = 'none';
        }
    });

    // Secciones que siempre deben estar visibles
    const alwaysVisibleSections = [
        'general',
        'info-1',
        'footer'
    ];

    // Mostrar secciones que siempre deben estar visibles
    alwaysVisibleSections.forEach(className => {
        document.querySelectorAll(`.${className}`).forEach(section => {
            section.style.display = 'block';
        });
    });

    // Mostrar la sección solicitada solo si existe
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'block';
    }
}

function updateAuthLinks(isLoggedIn) {
    const authLinks = document.querySelectorAll('.auth-links');
    const userLinks = document.querySelectorAll('.user-links');
    
    authLinks.forEach(link => {
        link.style.display = isLoggedIn ? 'none' : 'block';
    });
    
    userLinks.forEach(link => {
        link.style.display = isLoggedIn ? 'block' : 'none';
    });

    // Mostrar/ocultar el botón de cerrar sesión de Twitch
    const twitchLogoutButton = document.getElementById('twitch-logout-button');
    if (twitchLogoutButton) {
        const userData = JSON.parse(localStorage.getItem('user_data'));
        twitchLogoutButton.style.display = userData && userData.twitch_id ? 'block' : 'none';
    }

    // Mantener visible las secciones generales
    document.querySelectorAll('.general, .info-1, .footer').forEach(section => {
        section.style.display = 'block';
    });
}

function showModal(modalId) {
    console.log('Showing modal:', modalId);
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('auth-modal-overlay');
    
    if (modal && overlay) {
        console.log('Modal and overlay found');
        modal.style.display = 'block';
        overlay.style.display = 'block';
    } else {
        console.error('Modal or overlay not found');
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('auth-modal-overlay');
    if (modal && overlay) {
        modal.style.display = 'none';
        overlay.style.display = 'none';
    }
}

function hideAllModals() {
    const modals = document.querySelectorAll('.modal');
    const overlay = document.getElementById('auth-modal-overlay');
    modals.forEach(modal => modal.style.display = 'none');
    if (overlay) overlay.style.display = 'none';
}

function mostrarNotificacion(mensaje, tipo = 'info') {
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion ${tipo}`;
    notificacion.textContent = mensaje;
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.remove();
    }, 3000);
}
// Función auxiliar para ocultar secciones
function hideSection(id) {
    const section = document.getElementById(id);
    if (section) {
        section.style.display = 'none';
    }
}

export {
    showSection,
    updateAuthLinks,
    showModal,
    hideModal,
    hideAllModals,
    mostrarNotificacion,
    hideSection
};