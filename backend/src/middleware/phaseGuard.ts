import { Request, Response, NextFunction } from 'express';
import { SystemPhase } from '@prisma/client';
import { prisma } from '../config/database';

/**
 * Ensures the API route is only accessible when the system is in one of the allowed phases
 */
export const requirePhase = (...allowedPhases: SystemPhase[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const state = await prisma.systemState.findFirst();
      const currentPhase = state ? state.currentPhase : SystemPhase.SETUP;

      if (!allowedPhases.includes(currentPhase)) {
        return res.status(403).json({
          error: `Action locked! This operation is only available in [${allowedPhases.join(
            ', '
          )}] phase. Current system phase is: ${currentPhase}.`,
          currentPhase,
          allowedPhases,
        });
      }
      next();
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to evaluate system state', details: err.message });
    }
  };
};
