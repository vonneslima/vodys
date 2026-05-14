import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  avatarUpload,
  getDashboardStats,
  getWeeklyProgress,
} from '../controllers/user.controller';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { uploadRateLimit } from '../middlewares/rateLimit.middleware';
import { updateProfileSchema } from '../schemas/user.schema';

const router = Router();

router.use(authenticate);

router.get('/profile', getProfile);
router.patch('/profile', validate(updateProfileSchema), updateProfile);
router.post('/avatar', uploadRateLimit, avatarUpload.single('avatar'), uploadAvatar);
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/weekly-progress', getWeeklyProgress);

export default router;
