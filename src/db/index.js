import mongoose from "mongoose";
import { getDbName } from "../constants.js";

/** @type {typeof mongoose | undefined} */
export let dbInstance = undefined;

const connectDB = async () => {
  try {
    const uri = `${process.env.MONGODB_URI}/${getDbName()}`;
    const connectionInstance = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 20_000,
      connectTimeoutMS: 20_000,
    });
    dbInstance = connectionInstance;
    console.log(
      `\n☘️  MongoDB Connected! Db host: ${connectionInstance.connection.host}\n`
    );
  } catch (error) {
    console.log("MongoDB connection error: ", error);
    process.exit(1);
  }
};

export default connectDB;
