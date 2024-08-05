import ApiWrapper from './nekodb';

const api = new ApiWrapper('http://localhost:3000/db');

async function main() {
  try {
    await api.createCollection('users');

    const user = await api.insert('users', { name: 'John Doe', age: 30 });
    console.log('Inserted User:', user);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();