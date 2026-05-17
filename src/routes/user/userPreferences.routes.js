import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middlewares.js";
import { validate } from "../../validators/validate.js";
import { patchDashboardSortValidator } from "../../validators/user/userPreferences.validators.js";
import {
  getDashboardSort,
  patchDashboardSort,
} from "../../controllers/user/userPreferences.controller.js";

const router = Router();

router.use(authenticate);

router
  .route("/dashboard-sort")
  .get(getDashboardSort)
  .patch(patchDashboardSortValidator, validate, patchDashboardSort);

export default router;
