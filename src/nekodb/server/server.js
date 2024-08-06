import express from 'express';
import { createServer } from 'http';
import { Server } from 'ws';
import bodyParser from 'body-parser';
import { createPool } from 'generic-pool';
import InMemoryDatabase from '../db/database.js'; // Adjust the import path according to your project structure

const app = express();
app.use(bodyParser.json());

// Maintain a map of pools for different databases
const pools = {};

const createPoolForDb = (dbName) => {
  const factory = {
    create: () => Promise.resolve(new InMemoryDatabase(dbName)),
    destroy: (db) => Promise.resolve(),
  };

  return createPool(factory, {
    max: 10, // maximum size of the pool
    min: 2, // minimum size of the pool
  });
};

const getPool = (dbName) => {
  if (!pools[dbName]) {
    pools[dbName] = createPoolForDb(dbName);
  }
  return pools[dbName];
};

const server = createServer(app);
const wss = new Server({ server });

wss.on('connection', (ws, req) => {
  const dbName = req.url.split('/').pop(); // Extract the database name from the URL
  console.log(`Client connected to database: ${dbName}`);
  const pool = getPool(dbName);

  ws.on('message', async (message) => {
    const { action, collectionName, payload } = JSON.parse(message);
    console.log('Received message:', { action, dbName, collectionName, payload });
    let dbInstance;

    try {
      dbInstance = await pool.acquire();

      switch (action) {
        case 'createCollection':
          await dbInstance.createCollection(collectionName);
          ws.send(JSON.stringify({ message: 'Collection created' }));
          break;

        case 'insert':
          const document = await dbInstance.insert(collectionName, payload);
          ws.send(JSON.stringify(document));
          break;

        case 'find':
          const documents = await dbInstance.find(collectionName, payload);
          ws.send(JSON.stringify(documents));
          break;

        case 'findById':
          const documentById = await dbInstance.findById(collectionName, payload.id);
          ws.send(JSON.stringify(documentById));
          break;

        case 'update':
          const updatedDocs = await dbInstance.update(collectionName, payload.query, payload.update);
          ws.send(JSON.stringify(updatedDocs));
          break;

        case 'updateOne':
          const updatedDoc = await dbInstance.updateOne(collectionName, { _id: payload.id }, payload.update);
          ws.send(JSON.stringify(updatedDoc));
          break;

        case 'delete':
          const deletedCount = await dbInstance.delete(collectionName, payload);
          ws.send(JSON.stringify({ deletedCount }));
          break;

        default:
          ws.send(JSON.stringify({ error: 'Unknown action' }));
      }
    } catch (err) {
      ws.send(JSON.stringify({ error: err.message }));
    } finally {
      if (dbInstance) {
        await pool.release(dbInstance);
      }
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
