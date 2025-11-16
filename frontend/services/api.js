/**
 * API Client for Localist Frontend
 *
 * Handles all API communication with authentication, WebSocket, and error handling
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration
const API_URL = __DEV__
  ? 'http://localhost:8000'  // Development
  : 'https://api.localist.app';  // Production

const WS_URL = __DEV__
  ? 'ws://localhost:8000'
  : 'wss://api.localist.app';

// Storage keys
const TOKEN_KEY = '@localist_access_token';
const REFRESH_TOKEN_KEY = '@localist_refresh_token';
const USER_KEY = '@localist_user';

// ============================================================================
// Authentication
// ============================================================================

class AuthService {
  static async login(email, password, userType) {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, user_type: userType }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();

    // Store tokens
    await AsyncStorage.setItem(TOKEN_KEY, data.access_token);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);

    // Fetch and store user info
    const user = await this.getCurrentUser();
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

    return user;
  }

  static async signup(email, password, name, userType) {
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, user_type: userType }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Signup failed');
    }

    const data = await response.json();

    // Store tokens
    await AsyncStorage.setItem(TOKEN_KEY, data.access_token);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);

    // Fetch and store user info
    const user = await this.getCurrentUser();
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

    return user;
  }

  static async logout() {
    // Call logout endpoint
    try {
      await apiClient.post('/api/auth/logout');
    } catch (error) {
      console.log('Logout API call failed:', error);
    }

    // Clear local storage
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
  }

  static async getAccessToken() {
    return await AsyncStorage.getItem(TOKEN_KEY);
  }

  static async getRefreshToken() {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  }

  static async refreshAccessToken() {
    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      // Refresh token expired - need to login again
      await this.logout();
      throw new Error('Session expired. Please login again.');
    }

    const data = await response.json();

    // Update tokens
    await AsyncStorage.setItem(TOKEN_KEY, data.access_token);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);

    return data.access_token;
  }

  static async getCurrentUser() {
    const token = await this.getAccessToken();
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to get current user');
    }

    return await response.json();
  }

  static async getCachedUser() {
    const userJson = await AsyncStorage.getItem(USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  static async isAuthenticated() {
    const token = await this.getAccessToken();
    return !!token;
  }
}

// ============================================================================
// API Client
// ============================================================================

class APIClient {
  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const token = await AuthService.getAccessToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      let response = await fetch(url, { ...options, headers });

      // Handle 401 - try to refresh token
      if (response.status === 401 && token) {
        try {
          await AuthService.refreshAccessToken();
          const newToken = await AuthService.getAccessToken();

          // Retry request with new token
          response = await fetch(url, {
            ...options,
            headers: {
              ...headers,
              'Authorization': `Bearer ${newToken}`,
            },
          });
        } catch (refreshError) {
          // Refresh failed - logout
          await AuthService.logout();
          throw new Error('Session expired. Please login again.');
        }
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || `Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  async get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  async uploadImage(file, folder = 'general') {
    const token = await AuthService.getAccessToken();

    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.fileName || 'image.jpg',
    });

    const response = await fetch(`${API_URL}/api/images/upload?folder=${folder}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Image upload failed');
    }

    return await response.json();
  }
}

const apiClient = new APIClient();

// ============================================================================
// Business API
// ============================================================================

const BusinessAPI = {
  async search(query, lat, lon, radiusMiles = 10) {
    return apiClient.get('/api/search', { query, lat, lon, radius_miles: radiusMiles });
  },

  async list(category, lat, lon, radiusMiles = 10) {
    return apiClient.get('/api/businesses', { category, lat, lon, radius_miles: radiusMiles });
  },

  async getById(id) {
    return apiClient.get(`/api/businesses/${id}`);
  },

  async create(businessData) {
    return apiClient.post('/api/businesses', businessData);
  },

  async update(id, businessData) {
    return apiClient.put(`/api/businesses/${id}`, businessData);
  },

  async uploadPhoto(businessId, photo) {
    const urls = await apiClient.uploadImage(photo, `businesses/${businessId}`);
    return urls;
  },

  async postBulletin(businessId, content, imageUri = null) {
    const data = { content };

    if (imageUri) {
      const urls = await apiClient.uploadImage({ uri: imageUri }, `bulletin/${businessId}`);
      data.image_url = urls.medium;
    }

    return apiClient.post(`/api/businesses/${businessId}/bulletin`, data);
  },
};

// ============================================================================
// Recommendations API
// ============================================================================

const RecommendationsAPI = {
  async getForUser(lat, lon, limit = 5) {
    const user = await AuthService.getCachedUser();
    return apiClient.get(`/api/recommendations/${user.id}`, { lat, lon, limit });
  },

  async recordInteraction(businessId, interactionType) {
    const user = await AuthService.getCachedUser();
    return apiClient.post('/api/interactions', {
      user_id: user.id,
      business_id: businessId,
      interaction_type: interactionType,
    });
  },
};

// ============================================================================
// Reviews API
// ============================================================================

const ReviewsAPI = {
  async getForBusiness(businessId) {
    return apiClient.get(`/api/businesses/${businessId}/reviews`);
  },

  async create(businessId, rating, text) {
    return apiClient.post(`/api/businesses/${businessId}/reviews`, { rating, review_text: text });
  },

  async markPurchase(businessId) {
    return apiClient.post(`/api/businesses/${businessId}/mark-visit`);
  },
};

// ============================================================================
// WebSocket Client
// ============================================================================

class WebSocketClient {
  constructor() {
    this.ws = null;
    this.messageHandlers = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async connect() {
    const token = await AuthService.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const wsUrl = `${WS_URL}/ws/messages?token=${token}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.messageHandlers.forEach(handler => handler(message));
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
      this.attemptReconnect();
    };
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

      console.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`);

      setTimeout(() => {
        this.connect();
      }, delay);
    }
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket not connected');
    }
  }

  sendMessage(toUserId, text) {
    this.send({
      to_user_id: toUserId,
      text,
      type: 'text',
    });
  }

  sendTypingIndicator(toUserId, isTyping) {
    this.send({
      to_user_id: toUserId,
      type: 'typing',
      is_typing: isTyping,
    });
  }

  onMessage(handler) {
    this.messageHandlers.push(handler);
  }

  removeMessageHandler(handler) {
    const index = this.messageHandlers.indexOf(handler);
    if (index > -1) {
      this.messageHandlers.splice(index, 1);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers = [];
  }
}

const wsClient = new WebSocketClient();

// ============================================================================
// Notifications API
// ============================================================================

const NotificationsAPI = {
  async registerPushToken(expoPushToken) {
    return apiClient.post('/api/notifications/register-token', {
      expo_push_token: expoPushToken,
    });
  },

  async unregisterPushToken() {
    return apiClient.delete('/api/notifications/unregister-token');
  },

  async getPreferences() {
    return apiClient.get('/api/notifications/preferences');
  },

  async updatePreferences(preferences) {
    return apiClient.put('/api/notifications/preferences', preferences);
  },

  async sendTestNotification(title, body) {
    return apiClient.post('/api/notifications/test', { title, body });
  },
};

// ============================================================================
// Exports
// ============================================================================

export {
  AuthService,
  apiClient,
  BusinessAPI,
  RecommendationsAPI,
  ReviewsAPI,
  NotificationsAPI,
  wsClient,
  API_URL,
};

export default {
  auth: AuthService,
  api: apiClient,
  business: BusinessAPI,
  recommendations: RecommendationsAPI,
  reviews: ReviewsAPI,
  notifications: NotificationsAPI,
  ws: wsClient,
};
