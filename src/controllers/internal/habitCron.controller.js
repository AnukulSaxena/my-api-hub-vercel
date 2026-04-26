import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { markOverduePendingAsMissed } from "../../services/habit/missedOccurrenceSweep.service.js";

const markMissed = asyncHandler(async (_req, res) => {
  const result = await markOverduePendingAsMissed();
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { scanned: result.scanned, markedMissed: result.markedMissed },
        "Missed occurrence sweep completed"
      )
    );
});

export { markMissed };
