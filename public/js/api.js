// API Helper Module
const API_BASE = '/api';

class API {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(method, endpoint, body = null) {
    const options = {
      method,
      headers: this.getHeaders(),
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  // Auth
  async login(email, password) {
    const data = await this.request('POST', '/auth/login', { email, password });
    this.setToken(data.token);
    return data;
  }

  async register(userData) {
    const data = await this.request('POST', '/auth/register', userData);
    this.setToken(data.token);
    return data;
  }

  async getMe() {
    return this.request('GET', '/auth/me');
  }

  // Properties
  async getProperties(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request('GET', `/properties?${query}`);
  }

  async getProperty(id) {
    return this.request('GET', `/properties/${id}`);
  }

  async createProperty(propertyData) {
    return this.request('POST', '/properties', propertyData);
  }

  async updateProperty(id, propertyData) {
    return this.request('PUT', `/properties/${id}`, propertyData);
  }

  async deleteProperty(id) {
    return this.request('DELETE', `/properties/${id}`);
  }

  async toggleFavorite(propertyId) {
    return this.request('POST', `/properties/${propertyId}/favorite`);
  }

  // Bookings
  async createBooking(bookingData) {
    return this.request('POST', '/bookings', bookingData);
  }

  async getMyTrips(status = '') {
    const query = status ? `?status=${status}` : '';
    return this.request('GET', `/bookings/my-trips${query}`);
  }

  async getHostBookings(status = '') {
    const query = status ? `?status=${status}` : '';
    return this.request('GET', `/bookings/hosting${query}`);
  }

  async getBooking(id) {
    return this.request('GET', `/bookings/${id}`);
  }

  async updateBookingStatus(id, status) {
    return this.request('PATCH', `/bookings/${id}/status`, { status });
  }

  // Reviews
  async createReview(reviewData) {
    return this.request('POST', '/reviews', reviewData);
  }

  async getPropertyReviews(propertyId, page = 1) {
    return this.request('GET', `/reviews/property/${propertyId}?page=${page}`);
  }

  // Users
  async getUserProfile(id) {
    return this.request('GET', `/users/${id}`);
  }

  async updateProfile(profileData) {
    return this.request('PUT', '/users/profile', profileData);
  }

  async getFavorites() {
    return this.request('GET', '/users/favorites/list');
  }

  async getMyProperties() {
    return this.request('GET', '/users/my/properties');
  }

  // Messages
  async sendMessage(messageData) {
    return this.request('POST', '/messages', messageData);
  }

  async getConversations() {
    return this.request('GET', '/messages/conversations');
  }

  async getConversation(userId) {
    return this.request('GET', `/messages/conversation/${userId}`);
  }
}

const api = new API();
