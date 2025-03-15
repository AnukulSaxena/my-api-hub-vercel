import { asyncHandler } from "../../utils/asyncHandler.js";
import { StackItem } from "../../models/todo/stackItem.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const createStackItem = asyncHandler(async (req, res) => {
  const { title, content, owner } = req.body;
  
  if (!title || !content || !owner) {
    return res.status(400).json(
      new ApiResponse(400, null, "All fields are required")
    );
  }

  const stackItem = await StackItem.create({
    title,
    content,
    owner
  });

  return res.status(201).json(
    new ApiResponse(201, stackItem, "Stack item created successfully")
  );
});

const getStackItems = asyncHandler(async (req, res) => {
  const { owner } = req.query;
  
  if (!owner) {
    return res.status(400).json(
      new ApiResponse(400, null, "Owner is required")
    );
  }

  const stackItems = await StackItem.find({ owner }).sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, stackItems, "Stack items fetched successfully")
  );
});

const updateStackItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  
  if (!id) {
    return res.status(400).json(
      new ApiResponse(400, null, "Stack item ID is required")
    );
  }

  if (!title && !content) {
    return res.status(400).json(
      new ApiResponse(400, null, "At least one field (title or content) is required for update")
    );
  }

  const updatedStackItem = await StackItem.findByIdAndUpdate(
    id,
    { 
      ...(title && { title }),
      ...(content && { content })
    },
    { new: true } // Return the updated document
  );

  if (!updatedStackItem) {
    return res.status(404).json(
      new ApiResponse(404, null, "Stack item not found")
    );
  }

  return res.status(200).json(
    new ApiResponse(200, updatedStackItem, "Stack item updated successfully")
  );
});

const deleteStackItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json(
      new ApiResponse(400, null, "Stack item ID is required")
    );
  }

  const deletedStackItem = await StackItem.findByIdAndDelete(id);

  if (!deletedStackItem) {
    return res.status(404).json(
      new ApiResponse(404, null, "Stack item not found")
    );
  }

  return res.status(200).json(
    new ApiResponse(200, deletedStackItem, "Stack item deleted successfully")
  );
});

export { createStackItem, getStackItems, updateStackItem, deleteStackItem }; 