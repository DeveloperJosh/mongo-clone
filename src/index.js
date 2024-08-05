import ApiWrapper, { Model, SchemaManager } from './nekodb';

// Initialize the API wrapper with the base URL of your API
const api = new ApiWrapper('http://localhost:3000/db');

// Initialize the schema manager
const schemaManager = new SchemaManager();

// Define schemas
const AnimeListSchema = {
  type: 'object',
  properties: {
    animeId: { type: 'string' },
    name: { type: 'string' },
    image: { type: 'string' },
    status: { type: 'string', enum: ['Watching', 'Completed', 'On Hold', 'Dropped', 'Plan to Watch'] },
    lastWatchedAt: { type: 'string' }
  },
  required: ['animeId', 'name', 'image', 'status'],
  additionalProperties: false
};

const UserSchema = {
  type: 'object',
  properties: {
    _id: { type: 'string' },
    userId: { type: 'string' },
    name: { type: 'string' },
    email: { type: 'string' },
    image: { type: 'string' },
    role: { type: 'string', enum: ['user', 'moderator', 'admin'], default: 'user' },
    banned: { type: 'boolean', default: false },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
    animeList: { type: 'array', items: AnimeListSchema }
  },
  required: ['_id', 'userId', 'name', 'email'],
  additionalProperties: false
};

// Set schemas in the schema manager
schemaManager.setSchema('User', UserSchema);
schemaManager.setSchema('AnimeList', AnimeListSchema);

// Create models
const User = new Model('User', schemaManager, api);

async function run() {
  try {
    // Create a new user collection with the schema
    await api.createCollection('User', UserSchema);

    // Create a new user
    const user = await User.create({
      _id: '1',
      userId: 'user123',
      name: 'John Doe',
      email: 'john@example.com',
      image: 'http://example.com/image.png',
      role: 'user',
      banned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      animeList: []
    });
    console.log('Created User:', user);

    // Find users
    const users = await User.find({ name: 'John Doe' });
    console.log('Found Users:', users);

    // Update a user
    const updatedUser = await User.updateOne(user._id, { name: 'John Updated' });
    console.log('Updated User:', updatedUser);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

run();
