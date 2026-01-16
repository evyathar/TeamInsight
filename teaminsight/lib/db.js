import mongoose from "mongoose";


// connect to online mongo db
const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  throw new Error("Missing MONGODB_URI environment variable");
}



// singelton design pattern :
// to avoid multiple connections in dev

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;

  await mongoose.connect(MONGO_URI);
}
