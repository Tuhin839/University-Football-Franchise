import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { Role, SystemPhase } from '@prisma/client';
import { bulkDeleteCloudinaryImages } from '../services/cloudinaryService';

const resetPhaseTo = async (phase: SystemPhase) => {
  const existing = await prisma.systemState.findFirst();
  if (existing) {
    await prisma.systemState.update({
      where: { id: existing.id },
      data: { currentPhase: phase },
    });
  } else {
    await prisma.systemState.create({
      data: { currentPhase: phase },
    });
  }
};

export const executeNuke = async (req: Request, res: Response) => {
  try {
    const { level } = req.body; // 1, 2, or 3
    const nukeLevel = Number(level);

    if (![1, 2, 3].includes(nukeLevel)) {
      return res.status(400).json({ error: 'Invalid Nuke Level. Must be 1, 2, or 3' });
    }

    console.log(`[NUKE WARNING] Executing Nuke Level ${nukeLevel} triggered by Super Admin`);

    if (nukeLevel === 1) {
      // LEVEL 1: TOURNAMENT WIPE
      await prisma.playerMatchStat.deleteMany();
      await prisma.match.deleteMany();
      await prisma.fixture.deleteMany();
      await prisma.teamStats.deleteMany();
      await resetPhaseTo(SystemPhase.AUCTION);

      return res.json({
        message: 'Level 1 Nuke executed: All matches, scores, fixtures, and points table wiped. Reverted to Auction completion state.',
        currentPhase: SystemPhase.AUCTION,
      });
    }

    if (nukeLevel === 2) {
      // LEVEL 2: ROSTER WIPE (MUST DELETE CLOUDINARY IMAGES)
      const allPlayers = await prisma.player.findMany({ select: { imageCloudinaryId: true } });
      const imageIds = allPlayers.map((p) => p.imageCloudinaryId).filter(Boolean);

      const cleanupResult = await bulkDeleteCloudinaryImages(imageIds);

      await prisma.playerMatchStat.deleteMany();
      await prisma.match.deleteMany();
      await prisma.fixture.deleteMany();
      await prisma.teamStats.deleteMany();
      await prisma.auctionBid.deleteMany();
      await prisma.player.deleteMany();
      await prisma.team.deleteMany();
      await prisma.user.deleteMany({ where: { role: Role.TEAM_MANAGER } });
      await resetPhaseTo(SystemPhase.SETUP);

      return res.json({
        message: `Level 2 Nuke executed: All rosters, players, teams, and managers wiped. Deleted ${cleanupResult.deletedCount} image assets from Cloudinary. Reverted to Phase 1 (SETUP).`,
        currentPhase: SystemPhase.SETUP,
      });
    }

    if (nukeLevel === 3) {
      // LEVEL 3: FACTORY RESET
      const allPlayers = await prisma.player.findMany({ select: { imageCloudinaryId: true } });
      const imageIds = allPlayers.map((p) => p.imageCloudinaryId).filter(Boolean);

      const cleanupResult = await bulkDeleteCloudinaryImages(imageIds);

      await prisma.playerMatchStat.deleteMany();
      await prisma.match.deleteMany();
      await prisma.fixture.deleteMany();
      await prisma.teamStats.deleteMany();
      await prisma.auctionBid.deleteMany();
      await prisma.player.deleteMany();
      await prisma.team.deleteMany();
      await prisma.user.deleteMany({ where: { role: { not: Role.SUPER_ADMIN } } });
      await prisma.bidRaiseTier.deleteMany();
      await prisma.playerTier.deleteMany();
      await prisma.ruleConfig.deleteMany();
      await resetPhaseTo(SystemPhase.SETUP);

      return res.json({
        message: `Level 3 Nuke (Factory Reset) executed: Platform completely reset. Deleted ${cleanupResult.deletedCount} media files. Super Admin preserved.`,
        currentPhase: SystemPhase.SETUP,
      });
    }
  } catch (err: any) {
    return res.status(500).json({ error: 'Nuke execution failed', details: err.message });
  }
};
