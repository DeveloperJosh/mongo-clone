import DatabaseWrapper from './nekodb';

const baseUrl = 'http://localhost:3000';
const username = '';
const password = '';

const db = new DatabaseWrapper(baseUrl, { username, password });

async function run() {
  try {
    await db.initialize();

    const dbName = 'anidb';
    const collectionName = 'anime';

    const animes = await db.find(dbName, collectionName, { title: 'Naruto' });
    console.log('Found Animes:', animes);

  } catch (error) {
    console.error(error.message);
  }
}

run();