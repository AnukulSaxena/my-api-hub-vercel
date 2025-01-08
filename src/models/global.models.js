import { z } from "zod"; 

export const mongoIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, {
    message: "Invalid MongoDB ObjectId",
  });