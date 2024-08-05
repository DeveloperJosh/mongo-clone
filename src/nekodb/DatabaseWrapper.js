import axios from 'axios';

class DatabaseWrapper {
  constructor(baseUrl, { username, password }) {
    this.baseUrl = baseUrl;
    this.token = null;
    this.credentials = { username, password };
  }

  async initialize() {
    await this.login(this.credentials.username, this.credentials.password);
  }

  async register(username, password) {
    try {
      const response = await axios.post(`${this.baseUrl}/register`, { username, password });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async login(username, password) {
    try {
      const response = await axios.post(`${this.baseUrl}/login`, { username, password });
      this.token = response.data.token;
      return this.token;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createCollection(dbName, collectionName) {
    try {
      const response = await axios.post(`${this.baseUrl}/${dbName}/collections/${collectionName}`, {}, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 400 && error.response.data.includes('already exists')) {
        console.warn(`Collection ${collectionName} already exists. Proceeding.`);
      } else {
        this.handleError(error);
      }
    }
  }

  async insert(dbName, collectionName, document) {
    try {
      const response = await axios.post(`${this.baseUrl}/${dbName}/${collectionName}`, document, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async find(dbName, collectionName, query = {}) {
    try {
      const queryString = new URLSearchParams(query).toString();
      const response = await axios.get(`${this.baseUrl}/${dbName}/${collectionName}?${queryString}`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async update(dbName, collectionName, query, update) {
    try {
      const queryString = new URLSearchParams(query).toString();
      const response = await axios.put(`${this.baseUrl}/${dbName}/${collectionName}?${queryString}`, update, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async delete(dbName, collectionName, query) {
    try {
      const queryString = new URLSearchParams(query).toString();
      const response = await axios.delete(`${this.baseUrl}/${dbName}/${collectionName}?${queryString}`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      throw new Error(`Error: ${error.response.data} (Status: ${error.response.status})`);
    } else if (error.request) {
      throw new Error('Error: No response received from the server.');
    } else {
      throw new Error(`Error: ${error.message}`);
    }
  }
}

export default DatabaseWrapper;
