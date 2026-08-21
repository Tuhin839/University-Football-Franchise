import { Router } from 'express';
import { getSystemState, updateSystemPhase, updateRules } from '../controllers/configController';
import { authenticateJWT, requireRoles } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.get('/state', getSystemState);
router.post('/phase', authenticateJWT, requireRoles(Role.SUPER_ADMIN), updateSystemPhase);
router.post('/rules', authenticateJWT, requireRoles(Role.SUPER_ADMIN), updateRules);

export default router;
