import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});
import { httpServer } from "./src/app.js";
import connectDB from "./src/db/index.js";

const startServer = () => {
  httpServer.listen(process.env.PORT || 8080, () => {
    console.info(
      `⚙️  Server is running on port: http://localhost:${
        process.env.PORT || 8080
      }`
    );
  });
};

try {
  console.log("Connecting to database...");
  await connectDB();
  console.log("Database connected successfully.");
  startServer();
} catch (err) {
  console.error("MongoDB connection error:", err);
}
