import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import InMemoryDatabase from '../db/database.js';
import { register, login, authenticate } from '../handlers/auth.js';

const app = express();
const port = 3000;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// Register endpoint
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const message = await register(username, password);
    res.status(201).send(message);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const token = await login(username, password);
    res.json({ token });
  } catch (error) {
    res.status(401).send(error.message);
  }
});

// Middleware to initialize database
app.use((req, res, next) => {
  const dbName = req.path.split('/')[1];
  if (!dbName) {
    return res.status(400).send('Database name is required in the URL.');
  }
  req.db = new InMemoryDatabase(dbName);
  req.db.load();
  next();
});

// Create collection
app.post('/:db/collections/:collection', authenticate, (req, res) => {
  const { collection } = req.params;
  try {
    req.db.createCollection(collection);
    res.status(201).send(`Collection ${collection} created.`);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Insert document
app.post('/:db/:collection', authenticate, (req, res) => {
  const { collection } = req.params;
  try {
    const document = req.db.insert(collection, req.body);
    res.status(201).json(document);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Find documents
app.get('/:db/:collection', authenticate, (req, res) => {
  const { collection } = req.params;
  try {
    const documents = req.db.find(collection, req.query);
    res.json(documents);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Find document by ID
app.get('/:db/:collection/:id', authenticate, (req, res) => {
  const { collection, id } = req.params;
  try {
    const document = req.db.findById(collection, id);
    res.json(document);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Update document by ID
app.put('/:db/:collection/:id', authenticate, (req, res) => {
  const { collection, id } = req.params;
  try {
    const updatedDocument = req.db.updateOne(collection, { _id: id }, req.body);
    res.json(updatedDocument);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Update documents
app.put('/:db/:collection', authenticate, (req, res) => {
  const { collection } = req.params;
  try {
    const updatedDocuments = req.db.update(collection, req.query, req.body);
    res.json(updatedDocuments);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Delete documents
app.delete('/:db/:collection', authenticate, (req, res) => {
  const { collection } = req.params;
  try {
    const deletedCount = req.db.delete(collection, req.query);
    res.send(`Deleted ${deletedCount} documents.`);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
