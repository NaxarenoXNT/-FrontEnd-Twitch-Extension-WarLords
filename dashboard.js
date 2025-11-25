const API_BASE_URL = 'http://localhost:3000';

class Dashboard {
    constructor() {
        this.user = null;
        this.personajes = [];
        this.followedStreamers = [];
        this.init();
        this.refreshInterval = null;
        this.initializeStreamerCards();
    }

    async init() {
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            document.getElementById('dashboard-section').style.display = 'none';
            return;
        }
    
        await this.checkAuthStatus();
        if (this.user) {
            this.setupEventListeners();
            this.startAutoRefresh();
        }
    }

    async checkAuthStatus() {
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            console.log('No hay token disponible');
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
            this.user = userData;
            
            if (userData.twitch_id) {
                await Promise.all([
                    this.cargarPersonajes(),
                    this.cargarStreamers()
                ]);
                this.renderDashboard();
            }
        } catch (err) {
            console.error('Error de autenticación:', err);
            localStorage.removeItem('jwt_token');
            window.location.href = '/login.html';
        }
    }

    /*
    async cargarPersonajes() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/personajes/ver`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
                }
            });

            if (!response.ok) throw new Error('Error al cargar personajes');
            
            this.personajes = await response.json();
        } catch (err) {
            console.error('Error al cargar personajes:', err);
        }
    }

    async cargarStreamers() {
        const token = localStorage.getItem('jwt_token');
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/twitch/seguidores`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar streamers');
            }
            
            this.followedStreamers = await response.json();
        } catch (err) {
            console.error('Error al cargar streamers:', err);
        }
    }

    async mejorarStat(tipo, personajeId) {
        try {
            const personaje = this.personajes.find(p => p.id === personajeId);
            if (!personaje) return;

            const nuevaVida = tipo === 'vida' ? personaje.puntos_de_vida + 10 : personaje.puntos_de_vida;
            const nuevoAtaque = tipo === 'ataque' ? personaje.ataque + 5 : personaje.ataque;

            const response = await fetch(`${API_BASE_URL}/api/personajes/${personajeId}`, {
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

            if (!response.ok) throw new Error('Error al actualizar personaje');
            
            await this.cargarPersonajes();
            this.renderPersonajes();
        } catch (err) {
            console.error('Error al mejorar estadística:', err);
        }
    }
    */
   
    renderDashboard() {
        document.getElementById('dashboard-section').style.display = 'block';
        document.getElementById('username-display').textContent = this.user.nombre_usuario_twitch;
        
        const twitchButton = document.getElementById('twitch-login');
        const twitchLogoutButton = document.getElementById('twitch-logout-button');
        const personajesSection = document.getElementById('personajes-section');
    
        if (this.user.twitch_id) {
            twitchButton.style.display = 'none';
            twitchLogoutButton.style.display = 'block';
            personajesSection.style.display = 'block';
        } else {
            twitchButton.style.display = 'block';
            twitchLogoutButton.style.display = 'none';
            personajesSection.style.display = 'none';
        }
        this.renderStreamers();
        this.renderPersonajes();
    }

    startAutoRefresh() {
        this.refreshInterval = setInterval(async () => {
            await Promise.all([
                this.cargarPersonajes(),
                this.cargarStreamers()
            ]);
            this.renderDashboard();
        }, 30000);
    }

    renderStreamers() {
        const streamersContainer = document.getElementById('streamers-list');
        streamersContainer.innerHTML = this.followedStreamers.map(streamer => `
            <div class="streamer-card">
                <h4>${streamer.to_name}</h4>
                <p>Seguido desde: ${new Date(streamer.followed_at).toLocaleDateString()}</p>
            </div>
        `).join('');
    }

    renderPersonajes() {
        const personajesContainer = document.getElementById('characters-list');
        personajesContainer.innerHTML = this.personajes.map(personaje => `
            <div class="character-card">
                <h4>${personaje.nombre_usuario_twitch}</h4>
                <div class="stats">
                    <p>Nivel: ${personaje.nivel}</p>
                    <p>Vida: ${personaje.puntos_de_vida}</p>
                    <p>Ataque: ${personaje.ataque}</p>
                </div>
                <div class="stat-buttons">
                    <button class="stat-button" onclick="dashboard.mejorarStat('vida', ${personaje.id})">
                        Mejorar Vida
                    </button>
                    <button class="stat-button" onclick="dashboard.mejorarStat('ataque', ${personaje.id})">
                        Mejorar Ataque
                    </button>
                </div>
            </div>
        `).join('');
    }

    setupEventListeners() {
        document.getElementById('twitch-login')?.addEventListener('click', () => {
            window.location.href = `${API_BASE_URL}/auth/twitch`;
        });

        document.getElementById('logout-button')?.addEventListener('click', () => {
            handleLogout();
        });
    }

    cleanup() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }

    initializeStreamerCards() {
        const root = document.getElementById('streamer-cards-root');
        if (root) {
            import('./StreamerCards.jsx').then(module => {
                const StreamerCards = module.default;
                ReactDOM.render(<StreamerCards />, root);
            });
        }
    }
}

// Inicializar el dashboard cuando el documento esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});
