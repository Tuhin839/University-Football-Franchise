import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '../config/database';

class TournamentEngine {
  private io: SocketIOServer | null = null;

  public setSocketServer(io: SocketIOServer) {
    this.io = io;
  }

  /**
   * Recalculates the entire tournament standings table from all completed matches
   */
  public async recalculatePointsTable() {
    const teams = await prisma.team.findMany();
    const completedMatches = await prisma.match.findMany({
      where: { isCompleted: true },
    });

    const statsMap = new Map<
      string,
      {
        played: number;
        won: number;
        drawn: number;
        lost: number;
        goalsFor: number;
        goalsAgainst: number;
        goalDiff: number;
        points: number;
      }
    >();

    // Initialize all teams
    for (const team of teams) {
      statsMap.set(team.id, {
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
        points: 0,
      });
    }

    // Process all completed matches
    for (const match of completedMatches) {
      const home = statsMap.get(match.homeTeamId);
      const away = statsMap.get(match.awayTeamId);

      if (home && away) {
        home.played += 1;
        away.played += 1;

        home.goalsFor += match.homeScore;
        home.goalsAgainst += match.awayScore;

        away.goalsFor += match.awayScore;
        away.goalsAgainst += match.homeScore;

        if (match.homeScore > match.awayScore) {
          home.won += 1;
          home.points += 3;
          away.lost += 1;
        } else if (match.homeScore < match.awayScore) {
          away.won += 1;
          away.points += 3;
          home.lost += 1;
        } else {
          home.drawn += 1;
          away.drawn += 1;
          home.points += 1;
          away.points += 1;
        }

        home.goalDiff = home.goalsFor - home.goalsAgainst;
        away.goalDiff = away.goalsFor - away.goalsAgainst;
      }
    }

    // Update database records in transaction
    const updatePromises = Array.from(statsMap.entries()).map(([teamId, stats]) =>
      prisma.teamStats.upsert({
        where: { teamId },
        update: stats,
        create: { teamId, ...stats },
      })
    );

    await prisma.$transaction(updatePromises);

    const standings = await this.getStandings();
    if (this.io) {
      this.io.emit('tournament:standings_updated', standings);
    }
    return standings;
  }

  /**
   * Fetches sorted standings table (Points > Goal Difference > Goals For)
   */
  public async getStandings() {
    const standings = await prisma.teamStats.findMany({
      include: {
        team: {
          select: { id: true, name: true, logoUrl: true },
        },
      },
      orderBy: [
        { points: 'desc' },
        { goalDiff: 'desc' },
        { goalsFor: 'desc' },
      ],
    });
    return standings;
  }

  /**
   * Generates or fetches two-legged fixture aggregations
   */
  public async getFixturesWithAggregate() {
    const fixtures = await prisma.fixture.findMany({
      include: {
        matches: {
          include: {
            homeTeam: { select: { id: true, name: true, logoUrl: true } },
            awayTeam: { select: { id: true, name: true, logoUrl: true } },
            stats: {
              include: {
                player: { select: { id: true, name: true, jerseyName: true } },
              },
            },
          },
          orderBy: { legNumber: 'asc' },
        },
      },
    });

    // Compute two-legged aggregate if applicable
    return fixtures.map((fixture) => {
      if (!fixture.isTwoLegged || fixture.matches.length < 2) {
        return { ...fixture, aggregateResult: null };
      }

      const leg1 = fixture.matches.find((m) => m.legNumber === 1);
      const leg2 = fixture.matches.find((m) => m.legNumber === 2);

      if (!leg1 || !leg2) return { ...fixture, aggregateResult: null };

      // In Leg 1: Team A is home, Team B is away
      // In Leg 2: Team B is home, Team A is away
      const teamAId = leg1.homeTeamId;
      const teamBId = leg1.awayTeamId;

      const teamAScore = leg1.homeScore + (leg2.awayTeamId === teamAId ? leg2.awayScore : leg2.homeScore);
      const teamBScore = leg1.awayScore + (leg2.homeTeamId === teamBId ? leg2.homeScore : leg2.awayScore);

      return {
        ...fixture,
        aggregateResult: {
          teamA: { id: teamAId, totalGoals: teamAScore },
          teamB: { id: teamBId, totalGoals: teamBScore },
          isAggregateComplete: leg1.isCompleted && leg2.isCompleted,
        },
      };
    });
  }

  /**
   * Broadcasts live match updates across WebSockets
   */
  public broadcastLiveScore(match: any) {
    if (this.io) {
      this.io.emit('tournament:match_score_update', match);
    }
  }

  /**
   * Player statistics leaderboards
   */
  public async getPlayerLeaderboards() {
    const [topScorers, topAssists, cleanSheets, cards] = await Promise.all([
      // Top Scorers
      prisma.playerMatchStat.groupBy({
        by: ['playerId'],
        _sum: { goals: true },
        having: { goals: { _sum: { gt: 0 } } },
        orderBy: { _sum: { goals: 'desc' } },
        take: 10,
      }),
      // Top Assists
      prisma.playerMatchStat.groupBy({
        by: ['playerId'],
        _sum: { assists: true },
        having: { assists: { _sum: { gt: 0 } } },
        orderBy: { _sum: { assists: 'desc' } },
        take: 10,
      }),
      // Clean Sheets
      prisma.playerMatchStat.findMany({
        where: { cleanSheet: true },
        include: { player: { include: { team: true } } },
        take: 10,
      }),
      // Cards
      prisma.playerMatchStat.groupBy({
        by: ['playerId'],
        _sum: { yellowCards: true, redCards: true },
        orderBy: { _sum: { redCards: 'desc' } },
        take: 10,
      }),
    ]);

    // Enrich player details for top scorers and assists
    const enrichedScorers = await Promise.all(
      topScorers.map(async (item) => {
        const player = await prisma.player.findUnique({
          where: { id: item.playerId },
          include: { team: true },
        });
        return { player, totalGoals: item._sum.goals || 0 };
      })
    );

    const enrichedAssists = await Promise.all(
      topAssists.map(async (item) => {
        const player = await prisma.player.findUnique({
          where: { id: item.playerId },
          include: { team: true },
        });
        return { player, totalAssists: item._sum.assists || 0 };
      })
    );

    return {
      topScorers: enrichedScorers,
      topAssists: enrichedAssists,
      cleanSheets,
      cards: yellowCards,
    };
  }
}

export const tournamentEngine = new TournamentEngine();
