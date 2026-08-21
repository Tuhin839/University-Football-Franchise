import { Router } from 'express';
import { registerPlayer, getAllPlayers, withdrawPlayer } from '../controllers/playerController';
import { requirePhase } from '../middleware/phaseGuard';
import { uploadPlayerImage } from '../middleware/upload';
import { SystemPhase } from '@prisma/client';

const router = Router();

// Registration open in Phase 2
router.post('/register', requirePhase(SystemPhase.REGISTRATION), uploadPlayerImage.single('image'), registerPlayer);
router.get('/', getAllPlayers);
router.delete('/:id', requirePhase(SystemPhase.REGISTRATION), withdrawPlayer);

export default router;
