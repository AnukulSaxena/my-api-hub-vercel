import { body } from "express-validator";

const patchDashboardSortValidator = [
  body("dashboardSort").isObject().withMessage("dashboardSort object is required"),
  body("dashboardSort.version").equals("1"),
  body("dashboardSort.primary").isObject(),
  body("dashboardSort.primary.field")
    .isIn(["priority", "scheduledStartAt", "title", "recurrenceKind"]),
  body("dashboardSort.primary.direction").isIn(["asc", "desc"]),
  body("dashboardSort.secondary").isObject(),
  body("dashboardSort.secondary.field")
    .isIn(["priority", "scheduledStartAt", "title", "recurrenceKind"]),
  body("dashboardSort.secondary.direction").isIn(["asc", "desc"]),
  body("dashboardSort.recurrenceKindOrder").isArray({ min: 7, max: 7 }),
];

export { patchDashboardSortValidator };
