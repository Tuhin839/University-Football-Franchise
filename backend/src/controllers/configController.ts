import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { SystemPhase } from '@prisma/client';

export const getSystemState = async (req: Request, res: Response) => {
  try {
    let state = await prisma.systemState.findFirst();
    if (!state) {
      state = await prisma.systemState.create({
        data: { currentPhase: SystemPhase.SETUP },
      });
    }
    const rules = await prisma.ruleConfig.findFirst();
    const tiers = await prisma.playerTier.findMany();
    const raiseTiers = await prisma.bidRaiseTier.findMany({ orderBy: { minBudgetPercent: 'asc' } });

    return res.json({
      currentPhase: state.currentPhase,
      rules,
      tiers,
      raiseTiers,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch configuration', details: err.message });
  }
};

export const updateSystemPhase = async (req: Request, res: Response) => {
  try {
    const { phase } = req.body;
    if (!Object.values(SystemPhase).includes(phase)) {
      return res.status(400).json({ error: `Invalid phase: ${phase}` });
    }

    let state = await prisma.systemState.findFirst();
    if (state) {
      state = await prisma.systemState.update({
        where: { id: state.id },
        data: { currentPhase: phase },
      });
    } else {
      state = await prisma.systemState.create({
        data: { currentPhase: phase },
      });
    }

    // Notify all connected clients via Socket
    const io = req.app.get('io');
    if (io) {
      io.emit('system:phase_changed', { phase: state.currentPhase });
    }

    return res.json({ message: `System transitioned to phase: ${phase}`, currentPhase: state.currentPhase });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to transition phase', details: err.message });
  }
};

export const updateRules = async (req: Request, res: Response) => {
  try {
    const { totalTeamBudget, minRosterSize, academicSessions, allowedPositions } = req.body;

    const currentRule = await prisma.ruleConfig.findFirst();
    let updated;

    if (currentRule) {
      updated = await prisma.ruleConfig.update({
        where: { id: currentRule.id },
        data: {
          totalTeamBudget: totalTeamBudget !== undefined ? Number(totalTeamBudget) : undefined,
          minRosterSize: minRosterSize !== undefined ? Number(minRosterSize) : undefined,
          academicSessions: academicSessions || undefined,
          allowedPositions: allowedPositions || undefined,
        },
      });
    } else {
      updated = await prisma.ruleConfig.create({
        data: {
          totalTeamBudget: Number(totalTeamBudget) || 100000,
          minRosterSize: Number(minRosterSize) || 15,
          academicSessions: academicSessions || ['2023-2024'],
          allowedPositions: allowedPositions || ['GK', 'CB', 'CM', 'ST'],
        },
      });
    }

    return res.json({ message: 'Rules updated successfully', rules: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update rules', details: err.message });
  }
};
