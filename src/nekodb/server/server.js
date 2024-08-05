import express from 'express';
import bodyParser from 'body-parser';
import InMemoryDatabase from '../db/database.js'; // Adjust the import path according to your project structure

const app = express();
app.use(bodyParser.json());

const databases = {};

// Utility function to get database instance
const getDatabaseInstance = (req, res, next) => {
  const dbName = req.params.dbname || 'default';
  if (!databases[dbName]) {
    databases[dbName] = new InMemoryDatabase(dbName);
  }
  req.db = databases[dbName];
  next();
};

app.post('/:dbname/collections/:collectionName', getDatabaseInstance, async (req, res) => {
  try {
    await req.db.createCollection(req.params.collectionName);
    res.status(201).send({ message: 'Collection created' });
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log(`Collection ${req.params.collectionName} already exists`);
      res.status(200).send({ message: 'Collection already exists' });
    } else {
      res.status(400).send({ error: err.message });
    }
  }
});

app.post('/:dbname/collections/:collectionName/documents', getDatabaseInstance, async (req, res) => {
  try {
    const document = await req.db.insert(req.params.collectionName, req.body);
    res.status(201).send(document);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

app.get('/:dbname/collections/:collectionName/documents', getDatabaseInstance, (req, res) => {
  try {
    const documents = req.db.find(req.params.collectionName, req.query);
    res.send(documents);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

app.get('/:dbname/collections/:collectionName/documents/:id', getDatabaseInstance, (req, res) => {
  try {
    const document = req.db.findById(req.params.collectionName, req.params.id);
    res.send(document);
  } catch (err) {
    res.status(404).send({ error: err.message });
  }
});

app.put('/:dbname/collections/:collectionName/documents', getDatabaseInstance, async (req, res) => {
  try {
    const updatedDocs = await req.db.update(req.params.collectionName, req.body.query, req.body.update);
    res.send(updatedDocs);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

app.put('/:dbname/collections/:collectionName/documents/:id', getDatabaseInstance, async (req, res) => {
  try {
    const updatedDoc = await req.db.updateOne(req.params.collectionName, { _id: req.params.id }, req.body);
    res.send(updatedDoc);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

app.delete('/:dbname/collections/:collectionName/documents', getDatabaseInstance, async (req, res) => {
  try {
    const deletedCount = await req.db.delete(req.params.collectionName, req.body);
    res.send({ deletedCount });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
