import mongoose from 'mongoose';
import { configureDatabaseDns } from './dns.js';
import { isConnectionReset } from './database-error.js';
import { setTimeout as delay } from 'node:timers/promises';

export async function connectDB(uri = process.env.MONGODB_URI) {
  if (!uri) {
    throw new Error('MONGODB_URI is required. Use npm run dev for the local database.');
  }
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  const dnsOptions = configureDatabaseDns();
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await mongoose.connect(uri, {
        ...dnsOptions,
        dbName: process.env.MONGODB_DB_NAME || 'portfolio',
        maxPoolSize: 10,
        minPoolSize: 0,
        serverSelectionTimeoutMS: 10_000,
        connectTimeoutMS: 10_000,
      });
      break;
    } catch (error) {
      if (!isConnectionReset(error) || attempt === 3) throw error;
      console.warn(`MongoDB connection reset; retrying startup (${attempt}/2).`);
      await delay(attempt * 1_000);
    }
  }
  console.log('MongoDB connected');
  return mongoose.connection;
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}

export default connectDB;
