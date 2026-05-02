import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});
import { httpServer } from "./src/app.js";
import connectDB from "./src/db/index.js";

const PORT = Number(process.env.PORT) || 8080;

function listen() {
  return new Promise((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(PORT, "0.0.0.0", () => {
      httpServer.removeListener("error", reject);
      resolve(undefined);
    });
  });
}

try {
  console.log(`PORT=${PORT} (from env: ${process.env.PORT ?? "unset"})`);
  // Bind HTTP first so Cloud Run passes its "listening on PORT" probe even if DB is slow.
  await listen();
  console.info(`⚙️  Server listening on 0.0.0.0:${PORT}`);

  console.log("Connecting to database...");
  await connectDB();
  console.log("Database connected successfully.");
} catch (err) {
  console.error("Startup error:", err);
  process.exit(1);
}
