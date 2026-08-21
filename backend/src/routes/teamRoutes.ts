import { Router } from 'express';
import { createTeam, getTeams } from '../controllers/teamController';
import { authenticateJWT, requireRoles } from '../middleware/auth';
import { Role, SystemPhase } from '@prisma/client';
import { requirePhase } from '../middleware/phaseGuard';

const router = Router();

router.post('/', authenticateJWT, requireRoles(Role.SUPER_ADMIN), requirePhase(SystemPhase.SETUP, SystemPhase.REGISTRATION), createTeam);
router.get('/', getTeams);

export default router;
