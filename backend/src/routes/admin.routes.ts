import { Router } from 'express';
import { getUsers, toggleUserStatus, getPlatformStats } from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/users', getUsers);
router.patch('/users/:id/status', toggleUserStatus);
router.get('/stats', getPlatformStats);

export default router;
