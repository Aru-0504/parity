import { Router } from 'express';
import authRoutes from './auth.routes';
import projectRoutes from './project.routes';
import taskRoutes from './task.routes';
import dashboardRoutes from './dashboard.routes';
import eventRoutes from './event.routes';
import activityRoutes from './activity.routes';

const router = Router();

// Root API info endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    name: 'Parity Project Management API',
    status: 'online',
    version: '1.0.0',
    health: '/api/health',
    endpoints: ['/api/auth', '/api/projects', '/api/tasks', '/api/dashboard', '/api/events', '/api/activity'],
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/events', eventRoutes);
router.use('/activity', activityRoutes);

export default router;
