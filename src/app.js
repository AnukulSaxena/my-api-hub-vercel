import express from "express";
import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});
import { createServer } from "http";
import requestIp from "request-ip";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middlewares.js";
import { ApiResponse } from "./utils/ApiResponse.js";
import cors from "cors";

const app = express();
const httpServer = createServer(app);
app.use(
  cors({
    origin:
      process.env.CORS_ORIGIN === "*"
        ? "*" // This might give CORS error for some origins due to credentials set to true
        : process.env.CORS_ORIGIN?.split(","), // For multiple cors origin for production.
    credentials: true,
  })
);

app.use(requestIp.mw()); // extracting IP
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public")); // configure static file to save images locally
app.use(cookieParser());

app.get("/", (req, res) => {
  console.log(req.clientIp);
  res.status(200).json(new ApiResponse(200, {}, "Gotcha"));
});

// import Routers

import todoRouter from "./routes/todo/todo.routes.js";
import dailyTaskRouter from "./routes/todo/dailyTask.routes.js";
import taskCompletionRouter from "./routes/todo/taskCompletion.routes.js";
import stackItemRouter from "./routes/todo/stackItem.routes.js";

app.use("/api/v1/todos", todoRouter);
app.use("/api/v1/daily-task", dailyTaskRouter);
app.use("/api/v1/task-completion", taskCompletionRouter);
app.use("/api/v1/stack-items", stackItemRouter);

// common error handling middleware
app.use(errorHandler);

export { httpServer };
