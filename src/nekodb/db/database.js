import fs from 'fs';
import path from 'path';

class InMemoryDatabase {
  constructor(dbName) {
    this.dbName = dbName;
    this.collections = {};
    this.load(); // Load existing data from disk
  }

  createCollection(collectionName) {
    if (!this.collections[collectionName]) {
      this.collections[collectionName] = [];
      this.saveCollection(collectionName);
    } else {
      throw new Error(`Collection ${collectionName} already exists`);
    }
  }

  insert(collectionName, document) {
    const collection = this.collections[collectionName];
    if (!collection) {
      throw new Error(`Collection ${collectionName} does not exist`);
    }
    document._id = this._generateId();
    collection.push(document);
    this.saveCollection(collectionName);
    return document;
  }

  find(collectionName, query = {}) {
    const collection = this.collections[collectionName];
    if (!collection) {
      throw new Error(`Collection ${collectionName} does not exist`);
    }
    return collection.filter(doc => {
      return Object.keys(query).every(key => doc[key] === query[key]);
    });
  }

  update(collectionName, query, update) {
    const collection = this.collections[collectionName];
    if (!collection) {
      throw new Error(`Collection ${collectionName} does not exist`);
    }
    const updatedDocs = [];
    collection.forEach(doc => {
      if (Object.keys(query).every(key => doc[key] === query[key])) {
        Object.assign(doc, update);
        updatedDocs.push(doc);
      }
    });
    this.saveCollection(collectionName);
    return updatedDocs;
  }

  delete(collectionName, query) {
    const collection = this.collections[collectionName];
    if (!collection) {
      throw new Error(`Collection ${collectionName} does not exist`);
    }
    const initialLength = collection.length;
    this.collections[collectionName] = collection.filter(doc => {
      return !Object.keys(query).every(key => doc[key] === query[key]);
    });
    this.saveCollection(collectionName);
    return initialLength - this.collections[collectionName].length;
  }

  _generateId() {
    return Math.random().toString(36).slice(2, 11);
  }

  saveCollection(collectionName) {
    const dir = path.join('databases', this.dbName);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filename = path.join(dir, `${collectionName}.json`);
    fs.writeFileSync(filename, JSON.stringify(this.collections[collectionName], null, 2));
  }

  loadCollection(collectionName) {
    const filename = path.join('databases', this.dbName, `${collectionName}.json`);
    if (fs.existsSync(filename)) {
      const rawData = fs.readFileSync(filename);
      this.collections[collectionName] = JSON.parse(rawData);
    }
  }

  load() {
    const dir = path.join('databases', this.dbName);
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        if (file.endsWith('.json')) {
          const collectionName = path.basename(file, '.json');
          this.loadCollection(collectionName);
        }
      });
    }
  }
}

export default InMemoryDatabase;
