import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});
import { httpServer } from "./src/app.js";
import connectDB from "./src/db/index.js";

const PORT = Number(process.env.PORT) || 8080;

const startServer = () => {
  // Cloud Run / containers: bind all interfaces (not localhost-only)
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.info(`⚙️  Server listening on 0.0.0.0:${PORT}`);
  });
};

try {
  console.log(`PORT=${PORT} (from env: ${process.env.PORT ?? "unset"})`);
  console.log("Connecting to database...");
  await connectDB();
  console.log("Database connected successfully.");
  startServer();
} catch (err) {
  console.error("MongoDB connection error:", err);
}
