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

    // Ensure default rules exist
    let rules = await prisma.ruleConfig.findFirst();
    if (!rules) {
      rules = await prisma.ruleConfig.create({
        data: {
          totalTeamBudget: 100000,
          minRosterSize: 15,
          academicSessions: ['2021-2022', '2022-2023', '2023-2024', '2024-2025', '2025-2026'],
          allowedPositions: ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF'],
        },
      });
    }

    // Ensure default player tiers exist
    let tiers = await prisma.playerTier.findMany();
    if (tiers.length === 0) {
      const defaultTiers = [
        { name: 'Platinum', basePrice: 5000 },
        { name: 'Gold', basePrice: 3000 },
        { name: 'Silver', basePrice: 1500 },
        { name: 'Bronze', basePrice: 800 },
      ];
      for (const t of defaultTiers) {
        await prisma.playerTier.create({ data: t });
      }
      tiers = await prisma.playerTier.findMany();
    }

    // Ensure default bidding raise tiers exist
    let raiseTiers = await prisma.bidRaiseTier.findMany({ orderBy: { minBudgetPercent: 'asc' } });
    if (raiseTiers.length === 0) {
      const defaultRaises = [
        { minBudgetPercent: 0.00, maxBudgetPercent: 0.03, raisePercentage: 0.0015 },
        { minBudgetPercent: 0.03, maxBudgetPercent: 0.10, raisePercentage: 0.0050 },
        { minBudgetPercent: 0.10, maxBudgetPercent: 0.30, raisePercentage: 0.0100 },
        { minBudgetPercent: 0.30, maxBudgetPercent: 1.00, raisePercentage: 0.0200 },
      ];
      for (const r of defaultRaises) {
        await prisma.bidRaiseTier.create({ data: r });
      }
      raiseTiers = await prisma.bidRaiseTier.findMany({ orderBy: { minBudgetPercent: 'asc' } });
    }

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
