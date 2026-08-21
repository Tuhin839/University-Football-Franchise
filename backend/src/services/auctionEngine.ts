import { Mutex } from 'async-mutex';
import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '../config/database';
import { calculateNextMinimumBid } from '../utils/biddingMath';
import { validateBudgetGuardrail } from '../utils/budgetGuardrail';
import { AuctionMode, PlayerStatus, Role } from '@prisma/client';

export interface StageState {
  player: any | null;
  mode: AuctionMode;
  currentBid: number;
  currentWinningTeam: { id: string; name: string } | null;
  timerSeconds: number;
  timerActive: boolean;
  bidHistory: Array<{
    teamId: string;
    teamName: string;
    amount: number;
    timestamp: Date;
  }>;
  blindEnvelopes: Array<{
    teamId: string;
    teamName: string;
    amount: number;
  }>;
  nextMinimumBid: number;
  minimumRaise: number;
}

class AuctionEngine {
  private io: SocketIOServer | null = null;
  private stageState: StageState = {
    player: null,
    mode: AuctionMode.NORMAL,
    currentBid: 0,
    currentWinningTeam: null,
    timerSeconds: 0,
    timerActive: false,
    bidHistory: [],
    blindEnvelopes: [],
    nextMinimumBid: 0,
    minimumRaise: 0,
  };

  private timerInterval: NodeJS.Timeout | null = null;
  private stageMutex = new Mutex();

  public setSocketServer(io: SocketIOServer) {
    this.io = io;
  }

  public getStageState(): StageState {
    // In blind mode, hide the envelope amounts until T=0
    if (this.stageState.mode === AuctionMode.BLIND && this.stageState.timerActive) {
      return {
        ...this.stageState,
        blindEnvelopes: this.stageState.blindEnvelopes.map((e) => ({
          teamId: e.teamId,
          teamName: e.teamName,
          amount: -1, // Hidden
        })),
      };
    }
    return this.stageState;
  }

  /**
   * Pulls a player from the Unsold/Registered Pool to the Live Podium Stage
   */
  public async introducePlayerToStage(playerId: string, mode: AuctionMode, defaultDuration: number = 30) {
    return await this.stageMutex.runExclusive(async () => {
      // Clear previous timer
      this.stopTimer();

      const player = await prisma.player.findUnique({
        where: { id: playerId },
        include: { tier: true },
      });

      if (!player) throw new Error('Player not found');
      if (player.status === PlayerStatus.SOLD) throw new Error('Player is already SOLD');

      const rules = await prisma.ruleConfig.findFirst();
      const totalBudget = rules ? rules.totalTeamBudget : 100000;

      const math = await calculateNextMinimumBid(player.tier.basePrice, totalBudget);

      // Update player status to ON_STAGE
      await prisma.player.update({
        where: { id: playerId },
        data: { status: PlayerStatus.ON_STAGE },
      });

      this.stageState = {
        player,
        mode,
        currentBid: player.tier.basePrice,
        currentWinningTeam: null,
        timerSeconds: defaultDuration,
        timerActive: true,
        bidHistory: [],
        blindEnvelopes: [],
        nextMinimumBid: mode === AuctionMode.NORMAL ? math.nextMinimumBid : player.tier.basePrice,
        minimumRaise: math.minimumRaise,
      };

      this.startTimer(defaultDuration);
      this.broadcastState('auction:player_introduced');
      return this.stageState;
    });
  }

  /**
   * Processes an incoming bid in Normal Mode with Mutex locking to eliminate race conditions
   */
  public async placeNormalBid(teamId: string, proposedAmount?: number) {
    return await this.stageMutex.runExclusive(async () => {
      if (!this.stageState.player || !this.stageState.timerActive) {
        throw new Error('No active player auction in progress');
      }

      if (this.stageState.mode !== AuctionMode.NORMAL) {
        throw new Error('Cannot place incremental bid in Blind Mode');
      }

      const team = await prisma.team.findUnique({ where: { id: teamId } });
      if (!team) throw new Error('Team not found');

      // Amount to bid is either requested amount or automatically calculated next minimum bid
      const bidAmount = proposedAmount || this.stageState.nextMinimumBid;

      if (bidAmount < this.stageState.nextMinimumBid) {
        throw new Error(`Bid of $${bidAmount} is lower than required minimum of $${this.stageState.nextMinimumBid}`);
      }

      // Check if this team is already the highest bidder
      if (this.stageState.currentWinningTeam?.id === teamId) {
        throw new Error('Your team already holds the highest bid');
      }

      // Validate Budget Guardrail Formula
      const guardrail = await validateBudgetGuardrail(teamId, bidAmount);
      if (!guardrail.allowed) {
        throw new Error(guardrail.reason);
      }

      // Calculate next step
      const rules = await prisma.ruleConfig.findFirst();
      const totalBudget = rules ? rules.totalTeamBudget : 100000;
      const math = await calculateNextMinimumBid(bidAmount, totalBudget);

      // Record bid in history & update state
      this.stageState.currentBid = bidAmount;
      this.stageState.currentWinningTeam = { id: team.id, name: team.name };
      this.stageState.nextMinimumBid = math.nextMinimumBid;
      this.stageState.minimumRaise = math.minimumRaise;
      this.stageState.bidHistory.unshift({
        teamId: team.id,
        teamName: team.name,
        amount: bidAmount,
        timestamp: new Date(),
      });

      // Reset timer back to 15 seconds on every valid bid
      this.stageState.timerSeconds = 15;

      this.broadcastState('auction:bid_placed');
      return this.stageState;
    });
  }

  /**
   * Submits a sealed envelope bid in Blind Mode
   */
  public async submitBlindBid(teamId: string, amount: number) {
    return await this.stageMutex.runExclusive(async () => {
      if (!this.stageState.player || !this.stageState.timerActive) {
        throw new Error('No active auction in progress');
      }
      if (this.stageState.mode !== AuctionMode.BLIND) {
        throw new Error('Blind bids are only accepted during Blind Mode auctions');
      }

      const team = await prisma.team.findUnique({ where: { id: teamId } });
      if (!team) throw new Error('Team not found');

      if (amount < this.stageState.player.tier.basePrice) {
        throw new Error(`Blind bid must be at least the base price ($${this.stageState.player.tier.basePrice})`);
      }

      // Validate Budget Guardrail
      const guardrail = await validateBudgetGuardrail(teamId, amount);
      if (!guardrail.allowed) {
        throw new Error(guardrail.reason);
      }

      // Update or insert blind envelope
      const existingIdx = this.stageState.blindEnvelopes.findIndex((e) => e.teamId === teamId);
      if (existingIdx >= 0) {
        this.stageState.blindEnvelopes[existingIdx].amount = amount;
      } else {
        this.stageState.blindEnvelopes.push({
          teamId: team.id,
          teamName: team.name,
          amount,
        });
      }

      this.broadcastState('auction:blind_bid_acknowledged');
      return { success: true, message: 'Sealed bid received securely.' };
    });
  }

  /**
   * Resolves blind envelopes when countdown reaches T=0
   */
  private async resolveBlindAuction() {
    this.stopTimer();

    if (this.stageState.blindEnvelopes.length === 0) {
      this.stageState.currentWinningTeam = null;
    } else {
      // Sort envelopes by highest amount descending
      this.stageState.blindEnvelopes.sort((a, b) => b.amount - a.amount);
      const topEnvelope = this.stageState.blindEnvelopes[0];
      this.stageState.currentBid = topEnvelope.amount;
      this.stageState.currentWinningTeam = {
        id: topEnvelope.teamId,
        name: topEnvelope.teamName,
      };
    }

    this.stageState.timerActive = false;
    this.broadcastState('auction:blind_resolved');
  }

  /**
   * Finalizes the player on stage: marks as SOLD to winning team or UNSOLD
   */
  public async finalizeCurrentPlayer(decision: 'SOLD' | 'UNSOLD') {
    return await this.stageMutex.runExclusive(async () => {
      const player = this.stageState.player;
      if (!player) throw new Error('No player on stage');

      this.stopTimer();

      if (decision === 'SOLD') {
        if (!this.stageState.currentWinningTeam) {
          throw new Error('Cannot sell player with no winning bid');
        }

        const winningTeamId = this.stageState.currentWinningTeam.id;
        const finalPrice = this.stageState.currentBid;

        // Atomic DB transaction: Deduct team budget, assign player, save winning bid
        await prisma.$transaction(async (tx) => {
          await tx.team.update({
            where: { id: winningTeamId },
            data: { remainingBudget: { decrement: finalPrice } },
          });

          await tx.player.update({
            where: { id: player.id },
            data: {
              status: PlayerStatus.SOLD,
              teamId: winningTeamId,
              soldPrice: finalPrice,
            },
          });

          await tx.auctionBid.create({
            data: {
              playerId: player.id,
              teamId: winningTeamId,
              amount: finalPrice,
              mode: this.stageState.mode,
              isWinning: true,
            },
          });
        });

        this.broadcastState('auction:player_sold', {
          soldTo: this.stageState.currentWinningTeam,
          price: finalPrice,
        });
      } else {
        // Mark UNSOLD
        await prisma.player.update({
          where: { id: player.id },
          data: { status: PlayerStatus.UNSOLD },
        });

        this.broadcastState('auction:player_unsold', { player });
      }

      // Reset stage
      this.stageState = {
        player: null,
        mode: AuctionMode.NORMAL,
        currentBid: 0,
        currentWinningTeam: null,
        timerSeconds: 0,
        timerActive: false,
        bidHistory: [],
        blindEnvelopes: [],
        nextMinimumBid: 0,
        minimumRaise: 0,
      };

      return { success: true };
    });
  }

  /**
   * Podium Admin offline dispute resolver: Rolls back the last placed bid
   */
  public async rollbackLastBid() {
    return await this.stageMutex.runExclusive(async () => {
      if (this.stageState.bidHistory.length <= 1) {
        // Reset to initial base price
        this.stageState.currentBid = this.stageState.player.tier.basePrice;
        this.stageState.currentWinningTeam = null;
        this.stageState.bidHistory = [];
      } else {
        // Pop the highest bid and revert to previous
        this.stageState.bidHistory.shift();
        const prevBid = this.stageState.bidHistory[0];
        this.stageState.currentBid = prevBid.amount;
        this.stageState.currentWinningTeam = {
          id: prevBid.teamId,
          name: prevBid.teamName,
        };
      }

      const rules = await prisma.ruleConfig.findFirst();
      const totalBudget = rules ? rules.totalTeamBudget : 100000;
      const math = await calculateNextMinimumBid(this.stageState.currentBid, totalBudget);

      this.stageState.nextMinimumBid = math.nextMinimumBid;
      this.stageState.minimumRaise = math.minimumRaise;
      this.stageState.timerSeconds = 15;

      this.broadcastState('auction:bid_rollback');
      return this.stageState;
    });
  }

  /**
   * Cancels current stage auction and returns player to REGISTERED pool
   */
  public async cancelStageAuction() {
    return await this.stageMutex.runExclusive(async () => {
      if (this.stageState.player) {
        await prisma.player.update({
          where: { id: this.stageState.player.id },
          data: { status: PlayerStatus.REGISTERED },
        });
      }

      this.stopTimer();
      this.stageState = {
        player: null,
        mode: AuctionMode.NORMAL,
        currentBid: 0,
        currentWinningTeam: null,
        timerSeconds: 0,
        timerActive: false,
        bidHistory: [],
        blindEnvelopes: [],
        nextMinimumBid: 0,
        minimumRaise: 0,
      };

      this.broadcastState('auction:cancelled');
      return { success: true };
    });
  }

  private startTimer(duration: number) {
    this.stageState.timerSeconds = duration;
    this.stageState.timerActive = true;

    this.timerInterval = setInterval(() => {
      if (this.stageState.timerSeconds > 0) {
        this.stageState.timerSeconds -= 1;
        if (this.io) {
          this.io.emit('auction:timer_tick', { timerSeconds: this.stageState.timerSeconds });
        }
      } else {
        this.stageState.timerActive = false;
        if (this.stageState.mode === AuctionMode.BLIND) {
          this.resolveBlindAuction();
        } else {
          this.stopTimer();
          if (this.io) {
            this.io.emit('auction:timer_expired', {
              player: this.stageState.player,
              winningTeam: this.stageState.currentWinningTeam,
              finalBid: this.stageState.currentBid,
            });
          }
        }
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private broadcastState(eventName: string, extraPayload?: any) {
    if (this.io) {
      this.io.emit(eventName, {
        stageState: this.getStageState(),
        ...extraPayload,
      });
      this.io.emit('auction:state_update', this.getStageState());
    }
  }
}

export const auctionEngine = new AuctionEngine();
