import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { PlayerStatus } from '@prisma/client';
import cloudinary from '../config/cloudinary';

export const registerPlayer = async (req: Request, res: Response) => {
  try {
    const { name, studentId, academicSession, jerseyName, primaryPosition, secondaryPositions, tierId } = req.body;

    if (!name || !studentId || !academicSession || !jerseyName || !primaryPosition || !tierId) {
      return res.status(400).json({ error: 'All mandatory fields including primary position and tier are required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Player profile image is mandatory and must be uploaded via Cloudinary' });
    }

    // Parse secondary positions
    let secPositions: string[] = [];
    if (typeof secondaryPositions === 'string') {
      try {
        secPositions = JSON.parse(secondaryPositions);
      } catch {
        secPositions = secondaryPositions.split(',').map((p) => p.trim());
      }
    } else if (Array.isArray(secondaryPositions)) {
      secPositions = secondaryPositions;
    }

    // Ensure primary position is not duplicated in secondary positions
    secPositions = secPositions.filter((p) => p !== primaryPosition);

    const existing = await prisma.player.findUnique({ where: { studentId } });
    if (existing) {
      return res.status(400).json({ error: `Player with Student ID ${studentId} is already registered` });
    }

    const file = req.file as any;
    const imageUrl = file.path;
    const imageCloudinaryId = file.filename; // Stored public_id for Nuke cascade deletion

    const player = await prisma.player.create({
      data: {
        name,
        studentId,
        academicSession,
        jerseyName,
        primaryPosition,
        secondaryPositions: secPositions,
        tierId,
        imageUrl,
        imageCloudinaryId,
        status: PlayerStatus.REGISTERED,
      },
      include: { tier: true },
    });

    return res.status(201).json({ message: 'Player registered successfully', player });
  } catch (err: any) {
    return res.status(500).json({ error: 'Player registration failed', details: err.message });
  }
};

export const getAllPlayers = async (req: Request, res: Response) => {
  try {
    const { status, tierId, position } = req.query;

    const players = await prisma.player.findMany({
      where: {
        status: status ? (status as PlayerStatus) : undefined,
        tierId: tierId ? (tierId as string) : undefined,
        primaryPosition: position ? (position as string) : undefined,
      },
      include: {
        tier: true,
        team: { select: { id: true, name: true, logoUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ players });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch players', details: err.message });
  }
};

export const withdrawPlayer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const player = await prisma.player.findUnique({ where: { id } });
    if (!player) return res.status(404).json({ error: 'Player not found' });

    if (player.status === PlayerStatus.SOLD) {
      return res.status(400).json({ error: 'Cannot withdraw a player who has already been SOLD in the auction' });
    }

    // Delete image from Cloudinary
    if (player.imageCloudinaryId) {
      await cloudinary.uploader.destroy(player.imageCloudinaryId);
    }

    await prisma.player.delete({ where: { id } });
    return res.json({ message: 'Player registration withdrawn and media cleared successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to withdraw registration', details: err.message });
  }
};
