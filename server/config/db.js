import mongoose from "mongoose";
import { configureDatabaseDns } from './dns.js';

export async function connectDB(uri = process.env.MONGODB_URI) {
  if (!uri) {
    throw new Error(
      "MONGODB_URI is required. Use npm run dev for the local database."
    );
  }

  // Already connected
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  configureDatabaseDns();
  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB_NAME || "portfolio",
    maxPoolSize: 10,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 10_000,
  });

  console.log("MongoDB connected");

  return mongoose.connection;
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export default connectDB;
