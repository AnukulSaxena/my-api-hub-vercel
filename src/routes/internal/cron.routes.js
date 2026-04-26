import { Router } from "express";
import { requireCronSecret } from "../../middlewares/cronAuth.middlewares.js";
import { markMissed } from "../../controllers/internal/habitCron.controller.js";

const router = Router();

router.use(requireCronSecret);

router.get("/habits/mark-missed", markMissed);

export default router;
