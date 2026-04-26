import { body, query } from "express-validator";

const RECURRENCE_KINDS = [
  "daily",
  "every_n_days",
  "weekly",
  "monthly",
  "yearly",
  "completion_based",
  "once",
];

const createHabitValidator = [
  body("title").trim().notEmpty().withMessage("title is required"),
  body("description").optional().isString().trim(),
  body("priority").optional().isInt({ min: 0, max: 10 }),
  body("tags").optional().isArray(),
  body("tags.*").optional().isString().trim(),
  body("timezone").optional().isString().trim(),
  body("definitionStatus")
    .optional()
    .isIn(["active", "paused", "archived"])
    .withMessage("Invalid definitionStatus"),
  body("metadata").optional().isObject(),
  body("recurrence").isObject().withMessage("recurrence object is required"),
  body("recurrence.kind")
    .isIn(RECURRENCE_KINDS)
    .withMessage("Invalid recurrence.kind"),
  body("recurrence.payload").optional().isObject(),
  body("recurrence.startsOn")
    .notEmpty()
    .isISO8601()
    .withMessage("recurrence.startsOn must be ISO8601 date"),
  body("recurrence.endsOn").optional().isISO8601(),
  body("immediateMaterializeDays")
    .optional()
    .isInt({ min: 0, max: 90 })
    .withMessage("immediateMaterializeDays must be 0-90"),
];

const patchHabitValidator = [
  body("title").optional().trim().notEmpty(),
  body("description").optional().isString(),
  body("priority").optional().isInt({ min: 0, max: 10 }),
  body("tags").optional().isArray(),
  body("timezone").optional().isString().trim(),
  body("definitionStatus")
    .optional()
    .isIn(["active", "paused", "archived"]),
  body("metadata").optional().isObject(),
];

const addRecurrenceValidator = [
  body("kind").isIn(RECURRENCE_KINDS).withMessage("Invalid kind"),
  body("payload").optional().isObject(),
  body("startsOn").notEmpty().isISO8601(),
  body("endsOn").optional().isISO8601(),
];

const materializeValidator = [
  body("from").notEmpty().isISO8601().withMessage("from is required ISO8601"),
  body("to").notEmpty().isISO8601().withMessage("to is required ISO8601"),
];

const transitionValidator = [
  body("action")
    .isIn(["complete", "skip"])
    .withMessage("action must be complete or skip"),
  body("completedAt").optional().isISO8601(),
];

const listHabitsQueryValidator = [
  query("definitionStatus")
    .optional()
    .isIn(["active", "paused", "archived"]),
  query("tag").optional().isString().trim(),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
];

const listOccurrencesQueryValidator = [
  query("from").notEmpty().isISO8601(),
  query("to").notEmpty().isISO8601(),
  query("status")
    .optional()
    .isIn(["pending", "completed", "missed", "skipped"]),
];

/** Same query shape as list occurrences, for GET /habits/agenda */
const userAgendaQueryValidator = listOccurrencesQueryValidator;

export {
  createHabitValidator,
  patchHabitValidator,
  addRecurrenceValidator,
  materializeValidator,
  transitionValidator,
  listHabitsQueryValidator,
  listOccurrencesQueryValidator,
  userAgendaQueryValidator,
};
