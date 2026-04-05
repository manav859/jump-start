import mongoose from "mongoose";

const isLocalMongoUri = (uri = "") =>
  /^mongodb(?:\+srv)?:\/\/(?:localhost|127\.0\.0\.1|\[::1\]|::1)(?:[:/]|$)/i.test(
    uri
  );

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);

    if (
      isLocalMongoUri(process.env.MONGODB_URI) &&
      error.message.includes("ECONNREFUSED")
    ) {
      console.error(
        "No local MongoDB server is running on the configured host."
      );
      console.error("Start Docker Desktop, then run `npm run db:up` in backend/.");
      console.error(
        "If you prefer MongoDB Atlas, replace MONGODB_URI in backend/.env with your cloud connection string."
      );
    }

    process.exit(1);
  }
};

export default connectDB;
