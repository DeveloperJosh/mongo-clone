import ApiWrapper from './nekodb/wrapper/NekoWrapper.js';

async function run() {
  const api = new ApiWrapper('ws://localhost:3000/db');

  await api.waitForConnection();

  const userSchema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'number' }
    },
    required: ['name', 'age'],
    additionalProperties: false
  };

  await api.createCollection('users', userSchema); 

  await api.insert('users', { name: 'Alice', age: 30 });
}

run().catch(console.error);
