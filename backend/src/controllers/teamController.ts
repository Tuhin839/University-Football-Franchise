import { Request, Response } from 'express';
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

export const createTeam = async (req: Request, res: Response) => {
  try {
    const { teamName, logoUrl, managerName, managerEmail, managerPassword } = req.body;

    if (!teamName || !managerName || !managerEmail || !managerPassword) {
      return res.status(400).json({ error: 'Team name and manager details are mandatory' });
    }

    const rules = await prisma.ruleConfig.findFirst();
    const allocatedBudget = rules ? rules.totalTeamBudget : 100000;

    const passwordHash = await bcrypt.hash(managerPassword, 10);

    const team = await prisma.$transaction(async (tx) => {
      const manager = await tx.user.create({
        data: {
          name: managerName,
          email: managerEmail,
          passwordHash,
          role: Role.TEAM_MANAGER,
        },
      });

      return await tx.team.create({
        data: {
          name: teamName,
          logoUrl: logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(teamName)}&background=random`,
          managerId: manager.id,
          allocatedBudget,
          remainingBudget: allocatedBudget,
        },
        include: { manager: true },
      });
    });

    return res.status(201).json({ message: 'Team and Manager created successfully', team });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create team', details: err.message });
  }
};

export const getTeams = async (req: Request, res: Response) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        manager: { select: { id: true, name: true, email: true } },
        players: { include: { tier: true } },
        tournamentStats: true,
      },
    });

    return res.json({ teams });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch teams', details: err.message });
  }
};
