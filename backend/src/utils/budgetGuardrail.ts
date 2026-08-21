import { prisma } from '../config/database';

export interface GuardrailValidationResult {
  allowed: boolean;
  reason?: string;
  remainingBudget: number;
  requiredReserve: number;
  neededPlayers: number;
  lowestBasePrice: number;
}

/**
 * Validates whether placing this bid would prevent the team from satisfying
 * the minimum roster requirement at the lowest base price in the system.
 */
export async function validateBudgetGuardrail(
  teamId: string,
  proposedBid: number
): Promise<GuardrailValidationResult> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { players: true },
  });

  if (!team) {
    return {
      allowed: false,
      reason: 'Team not found',
      remainingBudget: 0,
      requiredReserve: 0,
      neededPlayers: 0,
      lowestBasePrice: 0,
    };
  }

  const rule = await prisma.ruleConfig.findFirst();
  const minRosterSize = rule ? rule.minRosterSize : 15;

  // Find lowest base price across all tiers
  const lowestTier = await prisma.playerTier.findFirst({
    orderBy: { basePrice: 'asc' },
  });
  const lowestBasePrice = lowestTier ? lowestTier.basePrice : 500;

  const currentRosterCount = team.players.length;
  // If team wins this player, roster count becomes currentRosterCount + 1
  const neededPlayers = Math.max(0, minRosterSize - (currentRosterCount + 1));
  const requiredReserve = neededPlayers * lowestBasePrice;

  // Check 1: Does the team have enough remaining budget for this bid?
  if (proposedBid > team.remainingBudget) {
    return {
      allowed: false,
      reason: `Proposed bid ($${proposedBid}) exceeds remaining team budget ($${team.remainingBudget}).`,
      remainingBudget: team.remainingBudget,
      requiredReserve,
      neededPlayers,
      lowestBasePrice,
    };
  }

  // Check 2: Does remaining budget after this bid satisfy the reserve requirement?
  const budgetAfterBid = team.remainingBudget - proposedBid;
  if (budgetAfterBid < requiredReserve) {
    return {
      allowed: false,
      reason: `Budget guardrail violation! You need to reserve at least $${requiredReserve} to buy ${neededPlayers} remaining player(s) at base price ($${lowestBasePrice}). Remaining after bid would only be $${budgetAfterBid}.`,
      remainingBudget: team.remainingBudget,
      requiredReserve,
      neededPlayers,
      lowestBasePrice,
    };
  }

  return {
    allowed: true,
    remainingBudget: team.remainingBudget,
    requiredReserve,
    neededPlayers,
    lowestBasePrice,
  };
}
