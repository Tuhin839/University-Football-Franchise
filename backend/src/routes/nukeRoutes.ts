import { Router } from 'express';
import { executeNuke } from '../controllers/nukeController';
import { authenticateJWT, requireRoles } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Nuke protocols can ONLY be executed by Super Admin
router.post('/execute', authenticateJWT, requireRoles(Role.SUPER_ADMIN), executeNuke);

export default router;
