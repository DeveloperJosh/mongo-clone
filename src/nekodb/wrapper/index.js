import axios from 'axios';

class ApiWrapper {
  constructor(baseURL) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async createCollection(collectionName) {
    try {
      const response = await this.client.post(`/collections/${collectionName}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response.data.error);
    }
  }

  async insert(collectionName, document) {
    try {
      const response = await this.client.post(`/collections/${collectionName}/documents`, document);
      return response.data;
    } catch (error) {
      throw new Error(error.response.data.error);
    }
  }

  async find(collectionName, query) {
    try {
      const response = await this.client.get(`/collections/${collectionName}/documents`, {
        params: query,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response.data.error);
    }
  }

  async findById(collectionName, id) {
    try {
      const response = await this.client.get(`/collections/${collectionName}/documents/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response.data.error);
    }
  }

  async update(collectionName, query, update) {
    try {
      const response = await this.client.put(`/collections/${collectionName}/documents`, {
        query,
        update,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response.data.error);
    }
  }

  async updateOne(collectionName, id, update) {
    try {
      const response = await this.client.put(`/collections/${collectionName}/documents/${id}`, update);
      return response.data;
    } catch (error) {
      throw new Error(error.response.data.error);
    }
  }

  async delete(collectionName, query) {
    try {
      const response = await this.client.delete(`/collections/${collectionName}/documents`, {
        data: query,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response.data.error);
    }
  }
}

export default ApiWrapper;
