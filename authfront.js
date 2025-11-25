const AUTH_STORAGE = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data'
};

let refreshPromise = null;

class AuthManager {
    static getTokens() {
        return {
            accessToken: localStorage.getItem(AUTH_STORAGE.ACCESS_TOKEN),
            refreshToken: localStorage.getItem(AUTH_STORAGE.REFRESH_TOKEN)
        };
    }

    static setTokens(token) {
        if (typeof token === 'string') {
            localStorage.setItem(AUTH_STORAGE.ACCESS_TOKEN, token);
        } else if (typeof token === 'object') {
            if (token.access_token) {
                localStorage.setItem(AUTH_STORAGE.ACCESS_TOKEN, token.access_token);
            }
            if (token.refresh_token) {
                localStorage.setItem(AUTH_STORAGE.REFRESH_TOKEN, token.refresh_token);
            }
        }
    }

    static clearAuth() {
        localStorage.removeItem(AUTH_STORAGE.ACCESS_TOKEN);
        localStorage.removeItem(AUTH_STORAGE.REFRESH_TOKEN);
        localStorage.removeItem(AUTH_STORAGE.USER_DATA);
    }

    static isAuthenticated() {
        return !!localStorage.getItem(AUTH_STORAGE.ACCESS_TOKEN);
    }

    static async refreshTokenIfNeeded() { 
        if (refreshPromise) return refreshPromise;

        const { refreshToken } = this.getTokens();
        console.log('Refresh Token actual:', refreshToken);

        if (!refreshToken) {
            console.warn('No refresh token found, clearing auth...');
            this.clearAuth();
            return false;
        }

        refreshPromise = (async () => {
            try {
                const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
                    userId: this.getUserData().id,
                    refresh_token: refreshToken
                });

                if (response.status !== 200) {
                    throw new Error('Failed to refresh token');
                }

                const { access_token, refresh_token: newRefreshToken } = response.data;
                this.setTokens({ access_token, refresh_token: newRefreshToken });
                return true;
            } catch (error) {
                console.error('Error refreshing token:', error);
                this.clearAuth();
                return false;
            } finally {
                refreshPromise = null;
            }
        })();

        return refreshPromise;
    }

    static async verifySession() {
        if (!this.isAuthenticated()) {
            return false;
        }

        try {
            const { accessToken } = this.getTokens();
            const response = await axios.get(`${API_BASE_URL}/api/auth/verify-main`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (response.status === 401) {
                return await this.refreshTokenIfNeeded();
            }

            return response.status === 200;
        } catch (error) {
            console.error('Error verifying session:', error);
            return false;
        }
    }

    static setUserData(userData) {
        if (!userData) {
            throw new Error('userData is required');
        }
        localStorage.setItem(AUTH_STORAGE.USER_DATA, JSON.stringify(userData));
    }

    static getUserData() {
        const userData = localStorage.getItem(AUTH_STORAGE.USER_DATA);
        return userData ? JSON.parse(userData) : null;
    }
}

// Interceptor de Axios actualizado
axios.interceptors.request.use(
    async config => {
        if (AuthManager.isAuthenticated()) {
            const { accessToken } = AuthManager.getTokens();
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

axios.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshSuccessful = await AuthManager.refreshTokenIfNeeded();
            if (refreshSuccessful) {
                const { accessToken } = AuthManager.getTokens();
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return axios(originalRequest);
            }
        }

        return Promise.reject(error);
    }
);

async function fetchWithAuth(url, options = {}) {
    const { accessToken } = AuthManager.getTokens();
    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
    };

    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
        const refreshSuccessful = await AuthManager.refreshTokenIfNeeded();
        if (refreshSuccessful) {
            const { accessToken } = AuthManager.getTokens();
            headers.Authorization = `Bearer ${accessToken}`;
            return fetch(url, { ...options, headers });
        }
    }
    return response;
}

export { AuthManager, AUTH_STORAGE, fetchWithAuth };