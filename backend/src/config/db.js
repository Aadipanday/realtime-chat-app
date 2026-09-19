import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

export const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI || "";

    // If database name is not already present in the URI, append it properly
    if (uri && !uri.includes(`/${DB_NAME}`)) {
      if (uri.includes("?")) {
        uri = uri.replace("?", `/${DB_NAME}?`);
      } else {
        uri = `${uri.replace(/\/$/, "")}/${DB_NAME}`;
      }
    }

    const conn = await mongoose.connect(uri);
    console.log(`\nMongoDB Connected: DB HOST: ${conn.connection.host}, DB NAME: ${conn.connection.name}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};
