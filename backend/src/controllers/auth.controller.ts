import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess, sendCreated } from '../utils/response';
import type {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from '../schemas/auth.schema';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/v1/auth',
};

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, username, password, firstName, lastName]
 *             properties:
 *               email: { type: string, format: email }
 *               username: { type: string, minLength: 3 }
 *               password: { type: string, minLength: 8 }
 *               firstName: { type: string }
 *               lastName: { type: string }
 *     responses:
 *       201:
 *         description: User registered successfully
 *       409:
 *         description: Email or username already in use
 *       422:
 *         description: Validation error
 */
export const register = async (req: Request<{}, {}, RegisterInput>, res: Response): Promise<void> => {
  const tokens = await authService.register(req.body);
  res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
  sendCreated(res, { accessToken: tokens.accessToken, userId: tokens.userId }, 'Account created');
};

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     security: []
 */
export const login = async (req: Request<{}, {}, LoginInput>, res: Response): Promise<void> => {
  const tokens = await authService.login(req.body, {
    userAgent: req.get('user-agent'),
    ipAddress: req.ip,
  });
  res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
  sendSuccess(res, { accessToken: tokens.accessToken, userId: tokens.userId });
};

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     security: []
 */
export const refresh = async (req: Request<{}, {}, RefreshTokenInput>, res: Response): Promise<void> => {
  // Accept from cookie or request body
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  const tokens = await authService.refresh(refreshToken);
  res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
  sendSuccess(res, { accessToken: tokens.accessToken });
};

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout current session
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if (refreshToken) {
    await authService.logout(refreshToken);
  }
  res.clearCookie('refreshToken', { path: '/api/v1/auth' });
  sendSuccess(res, null, { message: 'Logged out successfully' });
};

export const logoutAll = async (req: Request, res: Response): Promise<void> => {
  await authService.logoutAll(req.user!.id);
  res.clearCookie('refreshToken', { path: '/api/v1/auth' });
  sendSuccess(res, null, { message: 'All sessions terminated' });
};

export const forgotPassword = async (
  req: Request<{}, {}, ForgotPasswordInput>,
  res: Response
): Promise<void> => {
  await authService.forgotPassword(req.body);
  // Always return success to prevent email enumeration
  sendSuccess(res, null, {
    message: 'If that email exists, a reset link has been sent',
  });
};

export const resetPassword = async (
  req: Request<{}, {}, ResetPasswordInput>,
  res: Response
): Promise<void> => {
  await authService.resetPassword(req.body);
  sendSuccess(res, null, { message: 'Password reset successfully' });
};

export const changePassword = async (
  req: Request<{}, {}, ChangePasswordInput>,
  res: Response
): Promise<void> => {
  await authService.changePassword(req.user!.id, req.body);
  res.clearCookie('refreshToken', { path: '/api/v1/auth' });
  sendSuccess(res, null, { message: 'Password changed. Please log in again.' });
};

export const me = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, req.user);
};
