import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { tournamentEngine } from '../services/tournamentEngine';

export const generateFixtures = async (req: Request, res: Response) => {
  try {
    const { isTwoLegged, roundName } = req.body;
    const teams = await prisma.team.findMany();

    if (teams.length < 2) {
      return res.status(400).json({ error: 'At least 2 teams are required to generate fixtures' });
    }

    // Round-robin pairing algorithm
    const fixturesToCreate = [];
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        fixturesToCreate.push({
          homeTeamId: teams[i].id,
          awayTeamId: teams[j].id,
          name: `${teams[i].name} vs ${teams[j].name}`,
        });
      }
    }

    const createdFixtures = [];
    const now = new Date();

    for (let idx = 0; idx < fixturesToCreate.length; idx++) {
      const pair = fixturesToCreate[idx];
      const fixture = await prisma.fixture.create({
        data: {
          name: pair.name,
          round: roundName || 'League Stage',
          isTwoLegged: Boolean(isTwoLegged),
          matches: {
            create: [
              {
                legNumber: 1,
                homeTeamId: pair.homeTeamId,
                awayTeamId: pair.awayTeamId,
                kickoffTime: new Date(now.getTime() + (idx + 1) * 24 * 60 * 60 * 1000),
                venue: 'Main Stadium',
              },
              ...(isTwoLegged
                ? [
                    {
                      legNumber: 2,
                      homeTeamId: pair.awayTeamId,
                      awayTeamId: pair.homeTeamId,
                      kickoffTime: new Date(now.getTime() + (idx + 1) * 48 * 60 * 60 * 1000),
                      venue: 'University Ground B',
                    },
                  ]
                : []),
            ],
          },
        },
        include: { matches: true },
      });
      createdFixtures.push(fixture);
    }

    // Initialize team stats
    await tournamentEngine.recalculatePointsTable();

    return res.status(201).json({ message: 'Fixtures generated successfully', fixtures: createdFixtures });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to generate fixtures', details: err.message });
  }
};

export const getFixtures = async (req: Request, res: Response) => {
  try {
    const fixtures = await tournamentEngine.getFixturesWithAggregate();
    return res.json({ fixtures });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch fixtures', details: err.message });
  }
};

export const updateMatchScore = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { homeScore, awayScore, isLive, isCompleted, stats } = req.body;

    const match = await prisma.match.update({
      where: { id },
      data: {
        homeScore: homeScore !== undefined ? Number(homeScore) : undefined,
        awayScore: awayScore !== undefined ? Number(awayScore) : undefined,
        isLive: isLive !== undefined ? Boolean(isLive) : undefined,
        isCompleted: isCompleted !== undefined ? Boolean(isCompleted) : undefined,
      },
      include: { homeTeam: true, awayTeam: true, fixture: true },
    });

    // If player stats are supplied (goals, assists, cards), record them
    if (Array.isArray(stats)) {
      await prisma.playerMatchStat.deleteMany({ where: { matchId: id } });
      for (const stat of stats) {
        await prisma.playerMatchStat.create({
          data: {
            matchId: id,
            playerId: stat.playerId,
            goals: Number(stat.goals) || 0,
            assists: Number(stat.assists) || 0,
            cleanSheet: Boolean(stat.cleanSheet),
            yellowCards: Number(stat.yellowCards) || 0,
            redCards: Number(stat.redCards) || 0,
          },
        });
      }
    }

    // Recalculate standings table if match completion or scores changed
    await tournamentEngine.recalculatePointsTable();

    // Stream match score update to all connected spectators
    tournamentEngine.broadcastLiveScore(match);

    return res.json({ message: 'Match score updated and broadcasted in real-time', match });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update match score', details: err.message });
  }
};

export const getPointsTable = async (req: Request, res: Response) => {
  try {
    const standings = await tournamentEngine.getStandings();
    return res.json({ standings });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch points table', details: err.message });
  }
};

export const getPlayerStats = async (req: Request, res: Response) => {
  try {
    const leaderboards = await tournamentEngine.getPlayerLeaderboards();
    return res.json(leaderboards);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch player stats', details: err.message });
  }
};
