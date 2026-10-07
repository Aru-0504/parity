import { Router } from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/project.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import { createProjectSchema, updateProjectSchema, projectQuerySchema } from '@ismo/shared';

const router = Router();

// All project routes require authentication
router.use(authenticate);

router.get('/', validateQuery(projectQuerySchema), getProjects);
router.get('/:id', getProjectById);
router.post('/', validateBody(createProjectSchema), createProject);
router.put('/:id', validateBody(updateProjectSchema), updateProject);
router.delete('/:id', deleteProject);

export default router;
