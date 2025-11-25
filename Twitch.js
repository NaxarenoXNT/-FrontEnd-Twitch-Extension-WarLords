import { showSection, updateAuthLinks, mostrarNotificacion } from './ui.js';
import { cargarPersonajes } from './api.js';
import { AuthManager } from './authfront.js';
import { API_BASE_URL } from './config.js';




// Función para manejar el login de Twitch
async function handleTwitchLogin() {
    try {
        window.location.href = `${API_BASE_URL}/auth/twitch`;
    } catch (error) {
        console.error('Error al iniciar sesión con Twitch:', error);
        mostrarNotificacion('Error al conectar con Twitch', 'error');
    }
}

// Función para vincular cuenta de Twitch
async function handleTwitchLink(twitchData) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/link-twitch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
            },
            body: JSON.stringify({
                twitch_id: twitchData.id
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al vincular cuenta');
        }

        alert('Cuenta de Twitch vinculada exitosamente');
        const userData = JSON.parse(localStorage.getItem('user_data'));
        userData.twitch_id = twitchData.id;
        localStorage.setItem('user_data', JSON.stringify(userData));
        setCurrentUser(userData);
        showSection('personajes-section');
        await cargarPersonajes();

    } catch (error) {
        console.error('Error:', error);
        alert('Error al vincular cuenta de Twitch');
    }
}

// Función para manejar el callback de Twitch
async function handleTwitchCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    
    if (error) {
        console.error('Error en autenticación de Twitch:', error);
        alert('Error al autenticar con Twitch');
        return;
    }

    try {
        // Obtener datos del usuario actual
        const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener datos del usuario');
        }

        const userData = await response.json();
        localStorage.setItem('user_data', JSON.stringify(userData));
        setCurrentUser(userData);
        
        updateAuthLinks(true);
        showSection('twitch-logout-section');
        showSection('personajes-section');

        // Vincular streamers seguidos por el usuario de Twitch
        const streamersResponse = await fetch(`${API_BASE_URL}/api/twitch/seguidores`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
            }
        });

        if (!streamersResponse.ok) {
            throw new Error('Error al obtener streamers de Twitch');
        }

        const streamers = await streamersResponse.json();
        await vincularStreamers(streamers);

        await cargarPersonajes();
    } catch (error) {
        console.error('Error:', error);
        updateAuthLinks(false);
        showSection('login-section');
    }
}

async function vincularStreamers(streamers) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/personajes/vincular-streamers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
            },
            body: JSON.stringify({ streamers })
        });

        if (!response.ok) {
            throw new Error('Error al vincular streamers');
        }

        console.log('Streamers vinculados correctamente');
    } catch (error) {
        console.error('Error al vincular streamers:', error);
    }
}

async function handleTwitchLogout() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/twitch/revoke`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al desvincular cuenta de Twitch');
        }

        // Actualizar datos del usuario
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        delete userData.twitch_id;
        localStorage.setItem('user_data', JSON.stringify(userData));

        // Actualizar UI
        setCurrentUser(userData);
        checkTwitchLinkStatus();
        showSection('twitch-integration-section');
        mostrarNotificacion('Cuenta de Twitch desvinculada exitosamente', 'success');
    } catch (error) {
        console.error('Error al desvincular cuenta de Twitch:', error);
        mostrarNotificacion('Error al desvincular cuenta de Twitch', 'error');
    }
}

function initializeTwitchIntegration() {
    const twitchLoginBtn = document.getElementById('twitch-login');
    const twitchLogoutBtn = document.getElementById('twitch-logout-button');

    if (twitchLoginBtn) {
        twitchLoginBtn.addEventListener('click', handleTwitchLogin);
    }
    if (twitchLogoutBtn) {
        twitchLogoutBtn.addEventListener('click', handleTwitchLogout);
    }

    // Verificar estado inicial
    checkTwitchLinkStatus();
}

// Función para verificar el estado de vinculación con Twitch
function checkTwitchLinkStatus() {
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    const twitchLinkContent = document.getElementById('twitch-link-content');
    const twitchUnlinkContent = document.getElementById('twitch-unlink-content');
    const twitchIntegrationSection = document.getElementById('twitch-integration-section');

    if (userData && userData.twitch_id) {
        if (twitchLinkContent) twitchLinkContent.style.display = 'none';
        if (twitchUnlinkContent) twitchUnlinkContent.style.display = 'block';
        if (twitchIntegrationSection) twitchIntegrationSection.style.display = 'block';
    } else {
        if (twitchLinkContent) twitchLinkContent.style.display = 'block';
        if (twitchUnlinkContent) twitchUnlinkContent.style.display = 'none';
        if (twitchIntegrationSection) twitchIntegrationSection.style.display = 'block';
    }
}

export{
    handleTwitchCallback,
    handleTwitchLink,
    handleTwitchLogin,
    handleTwitchLogout,
    vincularStreamers,
    initializeTwitchIntegration,
    checkTwitchLinkStatus
};