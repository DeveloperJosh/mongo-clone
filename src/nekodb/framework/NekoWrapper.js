import axios from 'axios';
import { Schema } from './Schema.js';

class NekoDB {
  constructor(baseUrl, dbName, { username, password }) {
    this.baseUrl = baseUrl;
    this.dbUrl = `${baseUrl}/${dbName}`;
    this.credentials = { username, password };
    this.token = null;
    this.tokenExpiry = null; // Timestamp when the token expires
    this.schemas = {};  // Store schemas by collection name
  }

  async initialize() {
    if (!this.token || this.isTokenExpired()) {
      await this.login(this.credentials.username, this.credentials.password);
    }
    // Optionally, start a background task to refresh the token
    this.startTokenRefreshTask();
  }

  async login(username, password) {
    try {
      const response = await axios.post(`${this.baseUrl}/login`, { username, password });
      this.token = response.data.token;
      this.tokenExpiry = Date.now() + response.data.expiresIn * 1000; // Assuming expiresIn is in seconds
      return this.token;
    } catch (error) {
      this.handleError(error);
    }
  }

  isTokenExpired() {
    return !this.tokenExpiry || Date.now() > this.tokenExpiry;
  }

  startTokenRefreshTask() {
    const refreshInterval = (this.tokenExpiry - Date.now()) - 60000; // Refresh 1 minute before expiry
    setTimeout(async () => {
      await this.login(this.credentials.username, this.credentials.password);
      this.startTokenRefreshTask(); // Schedule the next refresh
    }, refreshInterval);
  }

  createSchema(collectionName, schemaDefinition) {
    this.schemas[collectionName] = new Schema(schemaDefinition);
  }

  async createCollection(collectionName) {
    try {
      if (this.isTokenExpired()) await this.login(this.credentials.username, this.credentials.password);
      const response = await axios.post(`${this.dbUrl}/collections/${collectionName}`, {}, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 400 && error.response.data.includes('already exists')) {
        return;
      } else {
        this.handleError(error);
      }
    }
  }

  async create(collectionName, document) {
    try {
      if (this.isTokenExpired()) await this.login(this.credentials.username, this.credentials.password);
      const schema = this.schemas[collectionName];
      if (schema) {
        schema.validate(document);
      }

      const response = await axios.post(`${this.dbUrl}/${collectionName}`, document, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async insert(collectionName, documents) {
    if (!Array.isArray(documents)) {
      documents = [documents];
    }

    for (const document of documents) {
      this._assignIds(document);
    }

    const schema = this.schemas[collectionName];
    if (schema) {
      documents.forEach(doc => schema.validate(doc));
    }

    try {
      if (this.isTokenExpired()) await this.login(this.credentials.username, this.credentials.password);
      const response = await axios.post(`${this.dbUrl}/${collectionName}`, documents, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  _assignIds(document) {
    if (!document._id) {
      document._id = this._generateId();
    }
    for (const key in document) {
      if (Array.isArray(document[key])) {
        document[key].forEach(item => this._assignIds(item));
      } else if (typeof document[key] === 'object' && document[key] !== null) {
        this._assignIds(document[key]);
      }
    }
  }

  async find(collectionName, query = {}) {
    try {
      if (this.isTokenExpired()) await this.login(this.credentials.username, this.credentials.password);
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
      if (this.isTokenExpired()) await this.login(this.credentials.username, this.credentials.password);
      const response = await axios.get(`${this.dbUrl}/${collectionName}/${id}`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateOne(collectionName, query, update) {
    return this.update(collectionName, query, update, { multi: false });
  }

  async updateMany(collectionName, query, update) {
    return this.update(collectionName, query, update, { multi: true });
  }

  async update(collectionName, query, update, options = { multi: false }) {
    try {
      if (this.isTokenExpired()) await this.login(this.credentials.username, this.credentials.password);

      // Find the documents to update
      const documents = await this.find(collectionName, query);
      if (documents.length === 0) {
        throw new Error(`Document not found in ${collectionName}`);
      }

      const schema = this.schemas[collectionName];
      if (schema) {
        schema.validateUpdate(update);
      }

      const updatedDocs = [];
      for (const document of documents) {
        const id = document._id;

        // Handle $push operation
        if (update.$push) {
          for (const [key, value] of Object.entries(update.$push)) {
            if (!Array.isArray(document[key])) {
              throw new Error(`Field ${key} is not an array`);
            }
            // Ensure each pushed item has a unique ID
            if (typeof value === 'object' && value !== null && !value._id) {
              value._id = this._generateId();
            }
            document[key].push(value);
          }
          delete update.$push;
        }

        // Handle $pull operation
        if (update.$pull) {
          for (const [key, value] of Object.entries(update.$pull)) {
            if (!Array.isArray(document[key])) {
              throw new Error(`Field ${key} is not an array`);
            }
            document[key] = document[key].filter(item => {
              if (typeof value === 'object') {
                return !Object.keys(value).every(k => item[k] === value[k]);
              }
              return item !== value;
            });
          }
          delete update.$pull;
        }

        // Apply other updates
        Object.assign(document, update);

        // Send the updated document to the server
        const response = await axios.put(`${this.dbUrl}/${collectionName}/${id}`, document, {
          headers: { Authorization: `Bearer ${this.token}` }
        });

        updatedDocs.push(response.data);

        if (!options.multi) break; // If not updating multiple documents, exit loop after first update
      }

      return updatedDocs.length === 1 ? updatedDocs[0] : updatedDocs;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteOne(collectionName, query) {
    return this.delete(collectionName, query, { multi: false });
  }

  async deleteMany(collectionName, query) {
    return this.delete(collectionName, query, { multi: true });
  }

  async delete(collectionName, query, options = { multi: false }) {
    try {
      if (this.isTokenExpired()) await this.login(this.credentials.username, this.credentials.password);
      const queryString = new URLSearchParams(query).toString();
      const response = await axios.delete(`${this.dbUrl}/${collectionName}?${queryString}`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });

      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  _generateId() {
    return Math.random().toString(36).slice(2, 11);
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
