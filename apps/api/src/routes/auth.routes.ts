import { Router } from 'express';
import { register, login, getMe, logout } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { authRateLimiter } from '../middleware/rateLimiter';
import { registerSchema, loginSchema } from '@ismo/shared';

const router = Router();

router.post('/register', authRateLimiter, validateBody(registerSchema), register);
router.post('/login', authRateLimiter, validateBody(loginSchema), login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export default router;
