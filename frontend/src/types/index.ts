export type SystemPhase = 'SETUP' | 'REGISTRATION' | 'AUCTION' | 'TOURNAMENT';
export type Role = 'SUPER_ADMIN' | 'PODIUM_ADMIN' | 'TEAM_MANAGER' | 'PLAYER' | 'SPECTATOR';
export type AuctionMode = 'NORMAL' | 'BLIND';
export type PlayerStatus = 'REGISTERED' | 'ON_STAGE' | 'SOLD' | 'UNSOLD';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  team?: {
    id: string;
    name: string;
    remainingBudget: number;
    allocatedBudget: number;
  };
}

export interface RuleConfig {
  id: string;
  totalTeamBudget: number;
  minRosterSize: number;
  academicSessions: string[];
  allowedPositions: string[];
}

export interface PlayerTier {
  id: string;
  name: string;
  basePrice: number;
}

export interface BidRaiseTier {
  id: string;
  minBudgetPercent: number;
  maxBudgetPercent: number;
  raisePercentage: number;
}

export interface Player {
  id: string;
  name: string;
  studentId: string;
  academicSession: string;
  jerseyName: string;
  primaryPosition: string;
  secondaryPositions: string[];
  imageUrl: string;
  imageCloudinaryId: string;
  tierId: string;
  tier: PlayerTier;
  teamId?: string;
  team?: { id: string; name: string; logoUrl?: string };
  status: PlayerStatus;
  soldPrice?: number;
}

export interface Team {
  id: string;
  name: string;
  logoUrl?: string;
  allocatedBudget: number;
  remainingBudget: number;
  manager?: { id: string; name: string; email: string };
  players?: Player[];
}

export interface StageState {
  player: Player | null;
  mode: AuctionMode;
  currentBid: number;
  currentWinningTeam: { id: string; name: string } | null;
  timerSeconds: number;
  timerActive: boolean;
  bidHistory: Array<{
    teamId: string;
    teamName: string;
    amount: number;
    timestamp: string;
  }>;
  blindEnvelopes: Array<{
    teamId: string;
    teamName: string;
    amount: number;
  }>;
  nextMinimumBid: number;
  minimumRaise: number;
}

export interface Match {
  id: string;
  fixtureId: string;
  legNumber: number;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  isLive: boolean;
  isCompleted: boolean;
  venue: string;
  kickoffTime: string;
  homeTeam: { id: string; name: string; logoUrl?: string };
  awayTeam: { id: string; name: string; logoUrl?: string };
}

export interface Fixture {
  id: string;
  name: string;
  round: string;
  isTwoLegged: boolean;
  matches: Match[];
  aggregateResult?: {
    teamA: { id: string; totalGoals: number };
    teamB: { id: string; totalGoals: number };
    isAggregateComplete: boolean;
  } | null;
}

export interface TeamStanding {
  id: string;
  teamId: string;
  team: { id: string; name: string; logoUrl?: string };
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}
