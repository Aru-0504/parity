import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getActivityLogs } from '../controllers/activity.controller';

const router = Router();

router.get('/', authenticate, getActivityLogs);

export default router;
