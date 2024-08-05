// nekodb.js
import axios from 'axios';

class NekoDB {
  constructor(baseUrl, dbName, { username, password }) {
    this.baseUrl = baseUrl;
    this.dbUrl = `${baseUrl}/${dbName}`;
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

  async createCollection(collectionName) {
    try {
      const response = await axios.post(`${this.dbUrl}/collections/${collectionName}`, {}, {
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

  async create(collectionName, document) {
    try {
      const response = await axios.post(`${this.dbUrl}/${collectionName}`, document, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async find(collectionName, query = {}) {
    try {
      const queryString = new URLSearchParams(query).toString();
      const response = await axios.get(`${this.dbUrl}/${collectionName}?${queryString}`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findById(collectionName, id) {
    try {
      const response = await axios.get(`${this.dbUrl}/${collectionName}/${id}`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateOne(collectionName, query, update) {
    try {
      const queryString = new URLSearchParams(query).toString();
      const response = await axios.put(`${this.dbUrl}/${collectionName}?${queryString}`, update, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteOne(collectionName, query) {
    try {
      const queryString = new URLSearchParams(query).toString();
      const response = await axios.delete(`${this.dbUrl}/${collectionName}?${queryString}`, {
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

export default NekoDB;
