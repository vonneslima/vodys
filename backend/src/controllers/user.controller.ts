import { Request, Response } from 'express';
import path from 'path';
import multer from 'multer';
import { userService } from '../services/user.service';
import { sendSuccess } from '../utils/response';
import { env } from '../config/env';
import type { UpdateProfileInput } from '../schemas/user.schema';

const storage = multer.diskStorage({
  destination: env.UPLOAD_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${Date.now()}${ext}`);
  },
});

export const avatarUpload = multer({
  storage,
  limits: { fileSize: env.MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP and GIF images are allowed'));
    }
  },
});

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  const profile = await userService.getProfile(req.user!.id);
  sendSuccess(res, profile);
};

export const updateProfile = async (
  req: Request<{}, {}, UpdateProfileInput>,
  res: Response
): Promise<void> => {
  const profile = await userService.updateProfile(req.user!.id, req.body);
  sendSuccess(res, profile, { message: 'Profile updated' });
};

export const uploadAvatar = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No file uploaded' });
    return;
  }

  const avatarUrl = `/uploads/${req.file.filename}`;
  const result = await userService.updateAvatar(req.user!.id, avatarUrl);
  sendSuccess(res, result, { message: 'Avatar updated' });
};

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  const stats = await userService.getDashboardStats(req.user!.id);
  sendSuccess(res, stats);
};

export const getWeeklyProgress = async (req: Request, res: Response): Promise<void> => {
  const progress = await userService.getWeeklyProgress(req.user!.id);
  sendSuccess(res, progress);
};
