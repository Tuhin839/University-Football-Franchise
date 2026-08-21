import { prisma } from '../config/database';

export interface NextBidCalculation {
  currentBid: number;
  minimumRaise: number;
  nextMinimumBid: number;
  raisePercentage: number;
}

/**
 * Calculates dynamic bidding increments based on percentage rules and total team budget
 */
export async function calculateNextMinimumBid(currentBid: number, totalTeamBudget: number): Promise<NextBidCalculation> {
  const currentRatio = currentBid / totalTeamBudget;

  // Fetch configured raise tiers sorted by minimum percentage
  const tiers = await prisma.bidRaiseTier.findMany({
    orderBy: { minBudgetPercent: 'asc' },
  });

  let applicableTier = tiers.find(
    (t) => currentRatio >= t.minBudgetPercent && currentRatio < t.maxBudgetPercent
  );

  // Fallback to highest tier or default 1% raise if not matched
  if (!applicableTier && tiers.length > 0) {
    applicableTier = tiers[tiers.length - 1];
  }

  const raisePercentage = applicableTier ? applicableTier.raisePercentage : 0.01;
  const minimumRaise = Math.round(totalTeamBudget * raisePercentage);
  const nextMinimumBid = currentBid + minimumRaise;

  return {
    currentBid,
    minimumRaise,
    nextMinimumBid,
    raisePercentage,
  };
}
