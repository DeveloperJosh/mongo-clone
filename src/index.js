import NekoDB from './nekodb';
import { animeSchema } from './models/anime.js';

const baseUrl = 'http://localhost:3000';
const dbName = 'anidb';
const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;

const db = new NekoDB(baseUrl, dbName, { username, password });
db.createSchema('anime', animeSchema.schemaDefinition);

async function run() {
  try {
    await db.initialize();

    await db.createCollection('anime');

    // If no anime with title 'Neko' exists, create one, if it exists, return it instead
    const neko = await db.find('anime', { title: 'Neko' });
    if (neko.length === 0) {
      const newAnime = {
        title: 'Neko',
        episodes: [
          {
            title: 'Neko',
            number: 1,
            airDate: '2021-02-01',
            duration: '24:00',
          },
          {
            title: 'Neko',
            number: 2,
            airDate: '2021-02-02',
            duration: '24:00',
          }
        ]
      };

      // Validate and insert the new anime document using the schema
      await db.insert('anime', newAnime);
      console.log('Neko created');
    } else {
      const update = {
        $push: {
          episodes: {
            title: 'Neko',
            number: 3,
            airDate: '2021-02-03',
            duration: '24:00',
          }
        }
      };

      // Validate the update using the schema
      animeSchema.validateUpdate(update);

      await db.updateOne('anime', { title: 'Neko' }, update);
      console.log('Neko episode added');

      // Example usage of $pull
      const pullUpdate = {
        $pull: {
          episodes: {
            title: 'Neko',
            number: 3,
            airDate: '2021-02-03',
            duration: '24:00',
          }
        }
      };

      // Validate the pull update using the schema
      animeSchema.validateUpdate(pullUpdate);

      await db.updateOne('anime', { title: 'Neko' }, pullUpdate);
      console.log('Neko episode removed');
    }

  } catch (error) {
    console.error(error.message);
  }
}

run();
