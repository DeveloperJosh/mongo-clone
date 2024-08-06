import WebSocket from 'isomorphic-ws';
import SchemaManager from './SchemaManager';

class ApiWrapper {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.schemaManager = new SchemaManager();
    this.isConnected = false;
    this.messageQueue = [];

    this.connect();
  }

  connect() {
    this.client = new WebSocket(this.baseURL);

    this.client.onopen = () => {
      console.log('WebSocket connection opened');
      this.isConnected = true;
      this.processQueue();
      this.keepAlive();
    };

    this.client.onclose = () => {
      console.log('WebSocket connection closed');
      this.isConnected = false;
      setTimeout(() => this.connect(), 1000); // Reconnect after 1 second
    };

    this.client.onerror = error => {
      console.error('WebSocket error:', error);
    };

    this.client.onmessage = event => {
      const data = JSON.parse(event.data);
      console.log('Received response:', data);
      if (this.currentResolve) {
        this.currentResolve(data);
        this.currentResolve = null;
      }
    };
  }

  keepAlive() {
    setInterval(() => {
      if (this.isConnected) {
        this.client.send(JSON.stringify({ action: 'ping' }));
      }
    }, 30000); // Send a ping every 30 seconds
  }

  waitForConnection() {
    return new Promise(resolve => {
      if (this.isConnected) {
        resolve();
      } else {
        this.client.onopen = () => {
          this.isConnected = true;
          resolve();
        };
      }
    });
  }

  processQueue() {
    while (this.messageQueue.length > 0) {
      const { action, collectionName, payload, resolve, reject } = this.messageQueue.shift();
      this.sendMessage(action, collectionName, payload).then(resolve).catch(reject);
    }
  }

  setSchema(collectionName, schema) {
    this.schemaManager.setSchema(collectionName, schema);
  }

  async sendMessage(action, collectionName, payload) {
    await this.waitForConnection();
    return new Promise((resolve, reject) => {
      this.currentResolve = resolve;
      const message = JSON.stringify({ action, collectionName, payload });
      console.log('Sending message:', message);
      this.client.send(message);
    });
  }

  async createCollection(collectionName, schema) {
    if (schema) {
      this.setSchema(collectionName, schema);
    }
    return this.sendMessage('createCollection', collectionName);
  }

  async insert(collectionName, document) {
    this.schemaManager.validateDocument(collectionName, document);
    return this.sendMessage('insert', collectionName, document);
  }

  async find(collectionName, query) {
    return this.sendMessage('find', collectionName, query);
  }

  async findById(collectionName, id) {
    return this.sendMessage('findById', collectionName, { id });
  }

  async update(collectionName, query, update) {
    return this.sendMessage('update', collectionName, { query, update });
  }

  async updateOne(collectionName, id, update) {
    return this.sendMessage('updateOne', collectionName, { id, update });
  }

  async delete(collectionName, query) {
    return this.sendMessage('delete', collectionName, query);
  }

  handleError(error) {
    throw new Error(error.message);
  }
}

export default ApiWrapper;
