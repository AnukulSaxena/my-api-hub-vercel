import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import {
  getDashboardSortForUser,
  setDashboardSortForUser,
} from "../../services/user/dashboardSortPreferences.service.js";

const getDashboardSort = asyncHandler(async (req, res) => {
  const config = await getDashboardSortForUser(req.user.id);
  return res
    .status(200)
    .json(new ApiResponse(200, { dashboardSort: config }, "OK"));
});

const patchDashboardSort = asyncHandler(async (req, res) => {
  const config = await setDashboardSortForUser(req.user.id, req.body.dashboardSort);
  return res
    .status(200)
    .json(new ApiResponse(200, { dashboardSort: config }, "Updated"));
});

export { getDashboardSort, patchDashboardSort };
