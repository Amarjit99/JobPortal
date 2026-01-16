import axios from 'axios';

class CSRFService {
    constructor() {
        this.token = null;
        this.tokenExpiry = null;
        this.fetchPromise = null;
    }

    async getToken() {
        // Return cached token if still valid
        if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            console.log('[CSRF Service] Returning cached token');
            return this.token;
        }

        // If already fetching, return the same promise
        if (this.fetchPromise) {
            console.log('[CSRF Service] Token fetch already in progress, waiting...');
            return this.fetchPromise;
        }

        console.log('[CSRF Service] Fetching new token...');
        // Fetch new token
        this.fetchPromise = this._fetchToken();
        
        try {
            const token = await this.fetchPromise;
            console.log('[CSRF Service] Token fetched successfully:', token.substring(0, 16) + '...');
            return token;
        } finally {
            this.fetchPromise = null;
        }
    }

    async _fetchToken() {
        try {
            const response = await axios.get('http://localhost:8000/api/v1/csrf-token', {
                withCredentials: true
            });
            if (response.data.success && response.data.csrfToken) {
                this.token = response.data.csrfToken;
                // Set expiry to 14 minutes (token expires in 15, refresh 1 min early)
                this.tokenExpiry = Date.now() + (14 * 60 * 1000);
                return this.token;
            }
            throw new Error('Failed to get CSRF token');
        } catch (error) {
            console.error('CSRF token fetch error:', error);
            this.clearToken();
            throw error;
        }
    }

    clearToken() {
        this.token = null;
        this.tokenExpiry = null;
        this.fetchPromise = null;
    }

    hasValidToken() {
        return this.token && this.tokenExpiry && Date.now() < this.tokenExpiry;
    }
}

export const csrfService = new CSRFService();
