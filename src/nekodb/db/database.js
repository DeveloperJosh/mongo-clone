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
    this._assignIdRecursively(document);
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

  findById(collectionName, id) {
    const collection = this.collections[collectionName];
    if (!collection) {
      throw new Error(`Collection ${collectionName} does not exist`);
    }
    const document = collection.find(doc => doc._id === id);
    if (!document) {
      throw new Error(`Document with id ${id} does not exist`);
    }
    return document;
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

  updateOne(collectionName, query, update) {
    const collection = this.collections[collectionName];
    if (!collection) {
      throw new Error(`Collection ${collectionName} does not exist`);
    }
    const doc = collection.find(doc => Object.keys(query).every(key => doc[key] === query[key]));
    if (!doc) {
      throw new Error(`Document not found in ${collectionName}`);
    }

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
    this.saveCollection(collectionName);
    return doc;
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

  _assignIdRecursively(document) {
    if (Array.isArray(document)) {
      document.forEach(item => this._assignIdRecursively(item));
    } else if (typeof document === 'object' && document !== null) {
      if (!document._id) {
        document._id = this._generateId();
      }
      for (const key in document) {
        if (Array.isArray(document[key]) || (typeof document[key] === 'object' && document[key] !== null)) {
          this._assignIdRecursively(document[key]);
        }
      }
    }
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
