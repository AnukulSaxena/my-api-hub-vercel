import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middlewares.js";
import { mongoIdPathVariableValidator } from "../../validators/common/mongodb.validators.js";
import { validate } from "../../validators/validate.js";
import { transitionValidator } from "../../validators/habit/habit.validators.js";
import {
  getOccurrence,
  listOccurrenceEvents,
  transition,
} from "../../controllers/habit/habitOccurrence.controller.js";

const router = Router();

router.use(authenticate);

router.get(
  "/:occurrenceId",
  mongoIdPathVariableValidator("occurrenceId"),
  validate,
  getOccurrence
);

router.get(
  "/:occurrenceId/events",
  mongoIdPathVariableValidator("occurrenceId"),
  validate,
  listOccurrenceEvents
);

router.post(
  "/:occurrenceId/transition",
  mongoIdPathVariableValidator("occurrenceId"),
  transitionValidator,
  validate,
  transition
);

export default router;
