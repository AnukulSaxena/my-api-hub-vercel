import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middlewares.js";
import { mongoIdPathVariableValidator } from "../../validators/common/mongodb.validators.js";
import { validate } from "../../validators/validate.js";
import {
  addRecurrenceValidator,
  createHabitValidator,
  listHabitsQueryValidator,
  listOccurrencesQueryValidator,
  materializeValidator,
  patchHabitValidator,
  userAgendaQueryValidator,
} from "../../validators/habit/habit.validators.js";
import {
  addRecurrence,
  createHabit,
  getHabit,
  listHabits,
  listOccurrences,
  listUserAgenda,
  materializeOccurrences,
  patchHabit,
  deleteHabit,
} from "../../controllers/habit/habit.controller.js";

const router = Router();

router.use(authenticate);

router
  .route("/")
  .post(createHabitValidator, validate, createHabit)
  .get(listHabitsQueryValidator, validate, listHabits);

router.get(
  "/agenda",
  userAgendaQueryValidator,
  validate,
  listUserAgenda
);

router
  .route("/:habitTaskId")
  .get(mongoIdPathVariableValidator("habitTaskId"), validate, getHabit)
  .patch(
    mongoIdPathVariableValidator("habitTaskId"),
    patchHabitValidator,
    validate,
    patchHabit
  )
  .delete(mongoIdPathVariableValidator("habitTaskId"), validate, deleteHabit);

router.post(
  "/:habitTaskId/recurrence",
  mongoIdPathVariableValidator("habitTaskId"),
  addRecurrenceValidator,
  validate,
  addRecurrence
);

router.post(
  "/:habitTaskId/occurrences/materialize",
  mongoIdPathVariableValidator("habitTaskId"),
  materializeValidator,
  validate,
  materializeOccurrences
);

router.get(
  "/:habitTaskId/occurrences",
  mongoIdPathVariableValidator("habitTaskId"),
  listOccurrencesQueryValidator,
  validate,
  listOccurrences
);

export default router;
