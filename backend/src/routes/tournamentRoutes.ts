import { Router } from 'express';
import {
  generateFixtures,
  getFixtures,
  updateMatchScore,
  getPointsTable,
  getPlayerStats,
} from '../controllers/tournamentController';
import { authenticateJWT, requireRoles } from '../middleware/auth';
import { requirePhase } from '../middleware/phaseGuard';
import { Role, SystemPhase } from '@prisma/client';

const router = Router();

// Tournament operations locked to Phase 4
router.get('/fixtures', getFixtures);
router.get('/standings', getPointsTable);
router.get('/stats', getPlayerStats);

router.post('/fixtures/generate', authenticateJWT, requireRoles(Role.SUPER_ADMIN), requirePhase(SystemPhase.TOURNAMENT), generateFixtures);
router.patch('/matches/:id/score', authenticateJWT, requireRoles(Role.SUPER_ADMIN), requirePhase(SystemPhase.TOURNAMENT), updateMatchScore);

export default router;
