import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectMongo() {
  if (!env.MONGODB_URI) return false;
  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DB_NAME,
    serverSelectionTimeoutMS: 10000,
  });
  return true;
}

export function ensureMongo() {
  if (mongoose.connection.readyState !== 1) {
    const error = new Error(
      "MongoDB is not connected. Add MONGODB_URI to backend/.env.",
    );
    error.statusCode = 503;
    error.expose = true;
    throw error;
  }
}
