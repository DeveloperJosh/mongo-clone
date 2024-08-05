import { Schema } from '../nekodb';

// for testing purposes

export const animeSchema = new Schema({
  title: { type: 'string', required: true },
  episodes: { 
    type: 'array', 
    required: true,
    items: {
      type: 'object',
      properties: {
        title: { type: 'string', required: true },
        number: { type: 'number', required: true },
        airDate: { type: 'string', required: true },
        duration: { type: 'string', required: true }
      }
    }
  }
});
