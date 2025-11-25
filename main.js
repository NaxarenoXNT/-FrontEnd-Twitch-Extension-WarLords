import { AuthManager, AUTH_STORAGE } from './authfront.js';
import { cargarPersonajes } from './api.js';
import { API_BASE_URL } from './config.js';
import { showSection, updateAuthLinks, showModal, hideModal, hideAllModals, mostrarNotificacion, hideSection } from './ui.js';
import { handleTwitchCallback, handleTwitchLogout, handleTwitchLogin, checkTwitchLinkStatus, initializeTwitchIntegration, vincularStreamers } from './Twitch.js';

let currentUser = null;

// Función para inicializar la autenticación
async function initializeAuth() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        console.log('No hay token, omitiendo verificación');
        updateAuthLinks(false);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify-main`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401) {
            console.log('No autorizado, el token puede haber expirado');
            // Redirigir al usuario a la página de inicio de sesión solo si no está ya en la página principal
            if (window.location.pathname !== '/index.html') {
                window.location.href = '/index.html';
            }
            return;
        }
    } catch (error) {
        console.error('Error al verificar:', error);
        return;
    }

    const isAuthenticated = await AuthManager.verifySession();
    updateAuthLinks(isAuthenticated);
    
    if (isAuthenticated) {
        const userData = AuthManager.getUserData();
        updateUIAfterLogin(userData);
    }
}

// Función para verificar y refrescar el token si es necesario
async function verifySession() {
    return await AuthManager.verifySession();
}

// Función para manejar el logout
async function handleLogout() {
    const { accessToken } = AuthManager.getTokens();
    
    try {
        if (accessToken) {
            const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    } finally {
        AuthManager.clearAuth();
        updateAuthLinks(false);
        window.location.href = '/';
        mostrarNotificacion('Sesión cerrada exitosamente', 'success');
    }
}

// Función para actualizar la UI después del login
function updateUIAfterLogin(userData) {
    localStorage.setItem(AUTH_STORAGE.USER_DATA, JSON.stringify(userData));
    
    document.querySelectorAll('.auth-links').forEach(link => link.style.display = 'none');
    document.querySelectorAll('.user-links').forEach(link => link.style.display = 'block');
    
    if (userData.twitch_id) {
        showSection('twitch-logout-section');
        document.getElementById('streamer-cards-root').style.display = 'block';
    } else {
        showSection('link-twitch-section');
    }
}

// Función para verificar el estado de autenticación
async function checkAuthStatus() {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        updateAuthLinks(false);
        const authSections = ['personajes-section', 'dashboard-section', 'twitch-integration-section'];
        authSections.forEach(id => hideSection(id));
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Token inválido');
        }

        const userData = await response.json();
        localStorage.setItem('user_data', JSON.stringify(userData));
        setCurrentUser(userData);
        updateAuthLinks(true);

        showSection('twitch-integration-section');
        checkTwitchLinkStatus();

        if (userData.twitch_id) {
            showSection('personajes-section');
            await cargarPersonajes();
        }
    } catch (error) {
        console.error('Error:', error);
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_data');
        updateAuthLinks(false);
        const authSections = ['personajes-section', 'dashboard-section', 'twitch-integration-section'];
        authSections.forEach(id => hideSection(id));
    }
}

// Función para inicializar botones de autenticación
function initializeAuthButtons() {
    const showLoginBtn = document.getElementById('show-login');
    const showRegisterBtn = document.getElementById('show-register');
    const switchToRegister = document.getElementById('switch-to-register');
    const switchToLogin = document.getElementById('switch-to-login');

    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showModal('login-modal');
        });
    }

    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showModal('register-modal');
        });
    }

    if (switchToRegister) {
        switchToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            hideModal('login-modal');
            showModal('register-modal');
        });
    }

    if (switchToLogin) {
        switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            hideModal('register-modal');
            showModal('login-modal');
        });
    }
}

// Función para configurar formularios
function setupForms() {
    const loginForm = document.getElementById('web-login-form');
    const registerForm = document.getElementById('web-register-form');

    if (loginForm) {
        loginForm.addEventListener('submit', handleWebLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleWebRegister);
    }
}

// Manejadores de formularios
async function handleWebLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
            email,
            password
        });

        const { user, access_token, refresh_token } = response.data;
        
        // Guardar tokens y datos del usuario
        AuthManager.setTokens({ access_token, refresh_token });
        AuthManager.setUserData(user);
        
        // Actualizar UI
        updateUIAfterLogin(user);
        hideModal('login-modal');
        mostrarNotificacion('Inicio de sesión exitoso', 'success');

    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion(error.response?.data?.error || 'Error en el inicio de sesión', 'error');
    }
}

async function handleWebRegister(event) {
    event.preventDefault();
    
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value.trim();
    const username = document.getElementById('register-username').value.trim();
    
    if (!email || !password || !username) {
        mostrarNotificacion('Todos los campos son obligatorios', 'error');
        return;
    }

    try {
        const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
            email,
            password,
            username
        });

        const { user, access_token, refresh_token } = response.data;
        
        // Guardar tokens y datos del usuario
        AuthManager.setTokens({ access_token, refresh_token });
        AuthManager.setUserData(user);
        
        // Actualizar UI
        updateUIAfterLogin(user);
        hideModal('register-modal');
        mostrarNotificacion('Registro exitoso', 'success');
    } catch (error) {
        console.error('Error en registro:', error);
        mostrarNotificacion(error.response?.data?.error || 'Error en el registro', 'error');
    }
}

// Función para mejorar estadísticas
async function mejorarStat(tipo, personajeId) {
    try {
        const responsePersonaje = await fetch(`${API_BASE_URL}/api/personajes/${personajeId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
            }
        });
        
        if (!responsePersonaje.ok) {
            if (responsePersonaje.status === 404) {
                alert('Personaje no encontrado');
                return;
            } else if (responsePersonaje.status === 500) {
                alert('Error en el servidor al obtener el personaje');
                return;
            }
            throw new Error(`Error ${responsePersonaje.status} al obtener el personaje`);
        }

        const personaje = await responsePersonaje.json();
        
        let nuevaVida = personaje.puntos_de_vida;
        let nuevoAtaque = personaje.ataque;

        if (tipo === 'vida') {
            nuevaVida += 10;
        } else if (tipo === 'ataque') {
            nuevoAtaque += 5;
        }

        const responseUpdate = await fetch(`${API_BASE_URL}/api/personajes/${personajeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
            },
            body: JSON.stringify({
                puntos_de_vida: nuevaVida,
                ataque: nuevoAtaque
            })
        });

        if (responseUpdate.ok) {
            await cargarPersonajes();
        } else {
            throw new Error('Error al actualizar personaje');
        }
    } catch (error) {
        console.error('Error:', error);
        if (error.message.includes('401')) {
            handleLogout();
        } else {
            alert(error.message);
        }
    }
}

// Función para probar la conexión
async function pruebaConexion() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/test`);
        if (response.ok) {
            console.log('Conexión establecida');
        } else {
            console.error('Error en la conexión');
        }
    } catch (error) {
        console.error('Error al probar la conexión:', error);
    }
}

// Event Listener principal
document.addEventListener('DOMContentLoaded', async () => {
    // Ocultar secciones de autenticación al inicio
    const authSections = [
        'personajes-section', 
        'dashboard-section', 
        'link-twitch-section',
        'twitch-integration-section'
    ];
    
    authSections.forEach(id => {
        const section = document.getElementById(id);
        if (section) {
            section.style.display = 'none';
        }
    });

    await initializeAuth();

    // Verificar parámetros de URL para Twitch
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('error')) {
        handleTwitchCallback();
    } else {
        await checkAuthStatus();
    }

    // Referencias a elementos DOM
    const burgerMenu = document.querySelector('.burger-menu');
    const navbar = document.querySelector('.navbar');
    const burgerIcon = document.querySelector('.burger-icon');

    // Configuración del menú hamburguesa
    if (burgerMenu) {
        burgerMenu.addEventListener('click', () => {
            navbar.classList.toggle('active');
            burgerIcon.classList.toggle('active');
        });
    }

    // Inicializar componentes de la aplicación
    initializeAuthButtons();
    setupForms();
    checkTwitchLinkStatus();

    // Configurar cierre de modales
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', hideAllModals);
    });

    const overlay = document.getElementById('auth-modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', hideAllModals);
    }

    // Configurar manejo de clicks fuera del menú
    document.addEventListener('click', (event) => {
        if (navbar.classList.contains('active') &&
            !event.target.closest('.navbar') &&
            !event.target.closest('.burger-menu')) {
            navbar.classList.remove('active');
            burgerIcon.classList.remove('active');
        }
    });

    // Verificar estado de autenticación inicial
    if (typeof AuthManager !== 'undefined' && AuthManager.isAuthenticated()) {
        updateAuthLinks(true);
        const userData = JSON.parse(localStorage.getItem('user_data'));
        if (userData && !userData.twitch_id) {
            showSection('link-twitch-section');
            showSection('twitch-integration-section');
        } else {
            showSection('personajes-section');
            if (typeof cargarPersonajes === 'function') {
                await cargarPersonajes();
            }
        }
    } else {
        updateAuthLinks(false);
    }

    // Inicializar conexión
    pruebaConexion();
});


