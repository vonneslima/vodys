import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  changePassword,
  me,
} from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { authRateLimit, passwordResetRateLimit } from '../middlewares/rateLimit.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../schemas/auth.schema';

const router = Router();

router.post('/register', authRateLimit, validate(registerSchema), register);
router.post('/login', authRateLimit, validate(loginSchema), login);
router.post('/refresh', validate(refreshTokenSchema), refresh);
router.post('/logout', logout);
router.post('/logout-all', authenticate, logoutAll);
router.post('/forgot-password', passwordResetRateLimit, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.patch('/change-password', authenticate, validate(changePasswordSchema), changePassword);
router.get('/me', authenticate, me);

export default router;
