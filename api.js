import { API_BASE_URL } from './config.js';



async function cargarPersonajes() {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        console.log('No hay sesión activa');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/personajes/ver`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar personajes');
        }

        const personajes = await response.json();
        mostrarPersonajes(personajes);
    } catch (error) {
        console.error('Error al cargar personajes:', error);
        if (error.message.includes('401')) {
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('user_data');
            updateAuthLinks(false);
        }
    }
}

async function cargarStreamersYPersonajes() {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        console.log('No hay sesión activa');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/personajes/detalles/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar streamers y personajes');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al cargar streamers y personajes:', error);
        if (error.message.includes('401')) {
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('user_data');
            updateAuthLinks(false);
        }
    }
}

export { cargarPersonajes, cargarStreamersYPersonajes };