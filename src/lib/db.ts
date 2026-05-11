import mongoose from "mongoose";

declare global {
  var mongooseConnectionPromise: Promise<typeof mongoose> | undefined;
}

export async function connectToDatabase(): Promise<typeof mongoose | null> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    return null;
  }

  if (!global.mongooseConnectionPromise) {
    global.mongooseConnectionPromise = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB_NAME || "specdiff"
    });
  }

  return global.mongooseConnectionPromise;
}
