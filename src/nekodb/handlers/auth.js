import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import InMemoryDatabase from '../db/database.js';

const SECRET_KEY = Bun.env.SECRET_KEY; 

const usersDb = new InMemoryDatabase('nekodb_users');

try {
  usersDb.createCollection('users');
} catch (error) {
  if (error.message !== 'Collection users already exists') {
    console.error('Error creating users collection:', error);
  }
}

export const register = async (username, password) => {
  if (!username || !password) {
    throw new Error('Username and password are required.');
  }

  const existingUser = usersDb.find('users', { username });
  if (existingUser.length > 0) {
    throw new Error('Username already exists.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = usersDb.insert('users', { username, password: hashedPassword });
  return `User ${newUser.username} registered successfully.`;
};

export const login = async (username, password) => {
  if (!username || !password) {
    throw new Error('Username and password are required.');
  }

  const user = usersDb.find('users', { username })[0];
  if (!user) {
    throw new Error('Invalid credentials.');
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    throw new Error('Invalid credentials.');
  }

  const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '1h' });
  return token;
};

export const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send('Access denied. No token provided.');
  }

  const token = authHeader.substring(7, authHeader.length); // Remove "Bearer " from the token
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).send('Invalid token.');
  }
};