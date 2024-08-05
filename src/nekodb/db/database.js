import fs from 'fs';
import path from 'path';

class InMemoryDatabase {
  constructor(dbName) {
    if (!dbName) {
      throw new Error('Database name is required');
    }
    this.dbName = dbName;
    this.collections = {};
    this.load();
  }

  async createCollection(collectionName) {
    if (this.collections[collectionName]) {
      console.log(`Collection ${collectionName} already exists`);
      return; // No error thrown, just return
    }
    this.collections[collectionName] = new Map();
    await this.saveCollection(collectionName);
  }

  async insert(collectionName, document) {
    const collection = this.getCollection(collectionName);
    document._id = this._generateId();
    this._assignIdRecursively(document);
    collection.set(document._id, document);
    await this.saveCollection(collectionName);
    return document;
  }

  find(collectionName, query = {}) {
    const collection = this.getCollection(collectionName);
    const results = [];
    for (let doc of collection.values()) {
      if (this.matchesQuery(doc, query)) {
        results.push(doc);
      }
    }
    return results;
  }

  findById(collectionName, id) {
    const collection = this.getCollection(collectionName);
    const document = collection.get(id);
    if (!document) {
      throw new Error(`Document with id ${id} does not exist`);
    }
    return document;
  }

  async update(collectionName, query, update) {
    const collection = this.getCollection(collectionName);
    const updatedDocs = [];
    for (let doc of collection.values()) {
      if (this.matchesQuery(doc, query)) {
        this.applyUpdate(doc, update);
        updatedDocs.push(doc);
      }
    }
    await this.saveCollection(collectionName);
    return updatedDocs;
  }

  async updateOne(collectionName, query, update) {
    const collection = this.getCollection(collectionName);
    for (let doc of collection.values()) {
      if (this.matchesQuery(doc, query)) {
        this.applyUpdate(doc, update);
        await this.saveCollection(collectionName);
        return doc;
      }
    }
    throw new Error(`Document not found in ${collectionName}`);
  }

  async delete(collectionName, query) {
    const collection = this.getCollection(collectionName);
    let deletedCount = 0;
    for (let [id, doc] of collection.entries()) {
      if (this.matchesQuery(doc, query)) {
        collection.delete(id);
        deletedCount++;
      }
    }
    await this.saveCollection(collectionName);
    return deletedCount;
  }

  _generateId() {
    return Math.random().toString(36).slice(2, 11);
  }

  _assignIdRecursively(document) {
    if (Array.isArray(document)) {
      document.forEach(item => this._assignIdRecursively(item));
    } else if (document && typeof document === 'object') {
      if (!document._id) {
        document._id = this._generateId();
      }
      Object.values(document).forEach(value => {
        if (Array.isArray(value) || (value && typeof value === 'object')) {
          this._assignIdRecursively(value);
        }
      });
    }
  }

  async saveCollection(collectionName) {
    const dir = path.join('databases', this.dbName);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filename = path.join(dir, `${collectionName}.json`);
    const collectionArray = Array.from(this.collections[collectionName].values());
    await fs.promises.writeFile(filename, JSON.stringify(collectionArray, null, 2));
  }

  async loadCollection(collectionName) {
    const filename = path.join('databases', this.dbName, `${collectionName}.json`);
    if (fs.existsSync(filename)) {
      const rawData = await fs.promises.readFile(filename);
      const collectionArray = JSON.parse(rawData);
      this.collections[collectionName] = new Map(collectionArray.map(doc => [doc._id, doc]));
    }
  }

  async load() {
    const dir = path.join('databases', this.dbName);
    if (fs.existsSync(dir)) {
      const files = await fs.promises.readdir(dir);
      await Promise.all(files.map(file => {
        if (file.endsWith('.json')) {
          const collectionName = path.basename(file, '.json');
          return this.loadCollection(collectionName);
        }
      }));
    }
  }

  getCollection(collectionName) {
    if (!this.collections[collectionName]) {
      this.collections[collectionName] = new Map(); // Initialize collection if it doesn't exist
    }
    return this.collections[collectionName];
  }

  matchesQuery(doc, query) {
    return Object.keys(query).every(key => doc[key] === query[key]);
  }

  applyUpdate(doc, update) {
    if (update.$push) {
      for (const [key, value] of Object.entries(update.$push)) {
        if (!Array.isArray(doc[key])) {
          throw new Error(`Field ${key} is not an array`);
        }
        doc[key].push(value);
      }
      delete update.$push; // Remove $push from update object to avoid saving it to the db
    }
    Object.assign(doc, update);
  }
}

export default InMemoryDatabase;
