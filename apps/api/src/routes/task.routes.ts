import { Router } from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/task.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import { createTaskSchema, updateTaskSchema, taskQuerySchema } from '@ismo/shared';

const router = Router();

// All task routes require authentication
router.use(authenticate);

router.get('/', validateQuery(taskQuerySchema), getTasks);
router.get('/:id', getTaskById);
router.post('/', validateBody(createTaskSchema), createTask);
router.put('/:id', validateBody(updateTaskSchema), updateTask);
router.delete('/:id', deleteTask);

export default router;
