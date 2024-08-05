import axios from 'axios';
import SchemaManager from './SchemaManager';

class ApiWrapper {
  constructor(baseURL) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.schemaManager = new SchemaManager();
  }

  setSchema(collectionName, schema) {
    this.schemaManager.setSchema(collectionName, schema);
  }

  async createCollection(collectionName, schema) {
    try {
      if (schema) {
        this.setSchema(collectionName, schema);
      }
      const response = await this.client.post(`/collections/${collectionName}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async insert(collectionName, document) {
    try {
      this.schemaManager.validateDocument(collectionName, document);
      const response = await this.client.post(`/collections/${collectionName}/documents`, document);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async find(collectionName, query) {
    try {
      const response = await this.client.get(`/collections/${collectionName}/documents`, { params: query });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findById(collectionName, id) {
    try {
      const response = await this.client.get(`/collections/${collectionName}/documents/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async update(collectionName, query, update) {
    try {
      const response = await this.client.put(`/collections/${collectionName}/documents`, { query, update });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateOne(collectionName, id, update) {
    try {
      const response = await this.client.put(`/collections/${collectionName}/documents/${id}`, update);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async delete(collectionName, query) {
    try {
      const response = await this.client.delete(`/collections/${collectionName}/documents`, { data: query });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.error);
    } else {
      throw new Error(error.message);
    }
  }
}

export default ApiWrapper;
