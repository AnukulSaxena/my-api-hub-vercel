import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  login,
  logout,
  me,
  refresh,
  register,
} from "../../controllers/auth/auth.controllers.js";
import { authenticate } from "../../middlewares/auth.middlewares.js";
import { loginValidator, registerValidator } from "../../validators/auth/auth.validators.js";
import { validate } from "../../validators/validate.js";

const router = Router();

const windowMs = 15 * 60 * 1000;

router.use(
  rateLimit({
    windowMs,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

const strictAuthLimiter = rateLimit({
  windowMs,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  "/register",
  strictAuthLimiter,
  registerValidator,
  validate,
  register
);
router.post("/login", strictAuthLimiter, loginValidator, validate, login);
router.post("/refresh", strictAuthLimiter, refresh);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);

export default router;
