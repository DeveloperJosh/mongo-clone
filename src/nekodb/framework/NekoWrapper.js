import axios from 'axios';
import { Schema } from './Schema.js';

class NekoDB {
  constructor(baseUrl, dbName, { username, password }) {
    this.baseUrl = baseUrl;
    this.dbUrl = `${baseUrl}/${dbName}`;
    this.token = null;
    this.credentials = { username, password };
    this.schemas = {};  // Store schemas by collection name
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

  createSchema(collectionName, schemaDefinition) {
    this.schemas[collectionName] = new Schema(schemaDefinition);
  }

  async createCollection(collectionName) {
    try {
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
      // Find the document to update
      const documents = await this.find(collectionName, query);
      if (documents.length === 0) {
        throw new Error(`Document not found in ${collectionName}`);
      }
      const document = documents[0];
      const id = document._id;

      // Validate the update against the schema
      const schema = this.schemas[collectionName];
      if (schema) {
        if (update.$push || update.$pull) {
          schema.validateUpdate(update);
        } else {
          schema.validate(update);
        }
      }

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
export { Schema };
