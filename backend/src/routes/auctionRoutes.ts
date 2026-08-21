import { Router } from 'express';
import {
  getStageState,
  introducePlayer,
  placeBid,
  submitBlindBid,
  hammerDecision,
  rollbackBid,
  cancelAuction,
  getUnsoldPool,
} from '../controllers/auctionController';
import { authenticateJWT, requireRoles } from '../middleware/auth';
import { requirePhase } from '../middleware/phaseGuard';
import { Role, SystemPhase } from '@prisma/client';

const router = Router();

// All auction endpoints strictly locked to Phase 3
router.use(requirePhase(SystemPhase.AUCTION));

router.get('/stage', getStageState);
router.get('/unsold-pool', getUnsoldPool);

// Podium Admin exclusive operations
router.post('/stage/introduce', authenticateJWT, requireRoles(Role.SUPER_ADMIN, Role.PODIUM_ADMIN), introducePlayer);
router.post('/stage/hammer', authenticateJWT, requireRoles(Role.SUPER_ADMIN, Role.PODIUM_ADMIN), hammerDecision);
router.post('/stage/rollback', authenticateJWT, requireRoles(Role.SUPER_ADMIN, Role.PODIUM_ADMIN), rollbackBid);
router.post('/stage/cancel', authenticateJWT, requireRoles(Role.SUPER_ADMIN, Role.PODIUM_ADMIN), cancelAuction);

// Team Manager Bidding operations
router.post('/bid/normal', authenticateJWT, requireRoles(Role.TEAM_MANAGER), placeBid);
router.post('/bid/blind', authenticateJWT, requireRoles(Role.TEAM_MANAGER), submitBlindBid);

export default router;
