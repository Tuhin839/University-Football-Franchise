import { Request, Response } from 'express';
import { auctionEngine } from '../services/auctionEngine';
import { prisma } from '../config/database';
import { AuctionMode, PlayerStatus } from '@prisma/client';

export const getStageState = async (req: Request, res: Response) => {
  try {
    const state = auctionEngine.getStageState();
    return res.json(state);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch stage state', details: err.message });
  }
};

export const introducePlayer = async (req: Request, res: Response) => {
  try {
    const { playerId, mode, duration } = req.body;
    if (!playerId) return res.status(400).json({ error: 'Player ID is required' });

    const auctionMode = mode === 'BLIND' ? AuctionMode.BLIND : AuctionMode.NORMAL;
    const stage = await auctionEngine.introducePlayerToStage(playerId, auctionMode, duration || 30);

    return res.json({ message: 'Player brought to live auction podium', stage });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const placeBid = async (req: Request, res: Response) => {
  try {
    const teamId = req.user?.teamId;
    if (!teamId) {
      return res.status(403).json({ error: 'Only authenticated Team Managers can place bids' });
    }

    const { amount } = req.body;
    const stage = await auctionEngine.placeNormalBid(teamId, amount ? Number(amount) : undefined);

    return res.json({ message: 'Bid placed successfully', stage });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const submitBlindBid = async (req: Request, res: Response) => {
  try {
    const teamId = req.user?.teamId;
    if (!teamId) {
      return res.status(403).json({ error: 'Only authenticated Team Managers can place bids' });
    }

    const { amount } = req.body;
    if (!amount) return res.status(400).json({ error: 'Bid amount is required for sealed bid' });

    const result = await auctionEngine.submitBlindBid(teamId, Number(amount));
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const hammerDecision = async (req: Request, res: Response) => {
  try {
    const { decision } = req.body; // 'SOLD' or 'UNSOLD'
    if (!['SOLD', 'UNSOLD'].includes(decision)) {
      return res.status(400).json({ error: 'Decision must be SOLD or UNSOLD' });
    }

    const result = await auctionEngine.finalizeCurrentPlayer(decision as 'SOLD' | 'UNSOLD');
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const rollbackBid = async (req: Request, res: Response) => {
  try {
    const stage = await auctionEngine.rollbackLastBid();
    return res.json({ message: 'Last bid rolled back successfully', stage });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const cancelAuction = async (req: Request, res: Response) => {
  try {
    const result = await auctionEngine.cancelStageAuction();
    return res.json({ message: 'Stage auction cancelled', result });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const getUnsoldPool = async (req: Request, res: Response) => {
  try {
    const players = await prisma.player.findMany({
      where: { status: { in: [PlayerStatus.REGISTERED, PlayerStatus.UNSOLD] } },
      include: { tier: true },
      orderBy: { tier: { basePrice: 'desc' } },
    });
    return res.json({ players });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch unsold pool', details: err.message });
  }
};
