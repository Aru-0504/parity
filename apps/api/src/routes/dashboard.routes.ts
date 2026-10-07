import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Dashboard requires authentication
router.use(authenticate);

router.get('/', getDashboardStats);

export default router;
