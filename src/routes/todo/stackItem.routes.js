import { Router } from "express";
import {
  createStackItem,
  getStackItems,
  updateStackItem,
  deleteStackItem
} from "../../controllers/todo/stackItem.controller.js";

const router = Router();

// Create a new stack item
router.post("/", createStackItem);

// Get all stack items for a specific owner
router.get("/", getStackItems);

// Update a stack item by ID
router.put("/:id", updateStackItem);

// Delete a stack item by ID
router.delete("/:id", deleteStackItem);

export default router; 