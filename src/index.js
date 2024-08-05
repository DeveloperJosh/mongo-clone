import NekoDB from './nekodb';

const baseUrl = 'http://localhost:3000';
const dbName = 'anidb';
const username = Bun.env.DB_USERNAME;
const password = Bun.env.DB_PASSWORD;

const db = new NekoDB(baseUrl, dbName, { username, password });

async function run() {
  try {
    await db.initialize();

    await db.createCollection('anime');

    // if no anime with title 'Naruto' exists, create one, if it exists, return it instead
    const naruto = await db.find('anime', { title: 'Naruto' });
    console.log(naruto);
    if (naruto.length === 0) {
      await db.create('anime', { title: 'Naruto', episodes: 220 });
    }

  } catch (error) {
    console.error(error.message);
  }
}

run();
