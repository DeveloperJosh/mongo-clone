import DatabaseWrapper from './nekodb';

const baseUrl = 'http://localhost:3000';
const username = `${process.env.USERNAME}` || 'admin';
const password = `${process.env.PASSWORD}` || 'password';

const db = new DatabaseWrapper(baseUrl, { username, password });

async function run() {
  try {
    await db.initialize();

    const dbName = 'anidb';
    const collectionName = 'anime';

    await db.createCollection(dbName, collectionName);

    const newAnime = await db.insert(dbName, collectionName, { title: 'Naruto', episodes: 220 });

    console.log('Inserted Anime:', newAnime);

    const animes = await db.find(dbName, collectionName, { title: 'Naruto' });
    console.log('Found Animes:', animes);

  } catch (error) {
    console.error(error.message);
  }
}

run();