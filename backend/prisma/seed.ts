import { PrismaClient, Role, SystemPhase } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting MongoDB Database Seeding ---');

  // 1. Initialize System State
  const existingState = await prisma.systemState.findFirst();
  if (!existingState) {
    await prisma.systemState.create({
      data: {
        currentPhase: SystemPhase.SETUP,
      },
    });
  }

  // 2. Initialize Default Rules
  const existingRules = await prisma.ruleConfig.findFirst();
  if (!existingRules) {
    await prisma.ruleConfig.create({
      data: {
        totalTeamBudget: 100000,
        minRosterSize: 15,
        academicSessions: ['2021-2022', '2022-2023', '2023-2024', '2024-2025', '2025-2026'],
        allowedPositions: ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF'],
      },
    });
  }

  // 3. Initialize Player Tiers with Base Prices
  const tiers = [
    { name: 'Platinum', basePrice: 5000 },
    { name: 'Gold', basePrice: 3000 },
    { name: 'Silver', basePrice: 1500 },
    { name: 'Bronze', basePrice: 800 },
  ];

  for (const tier of tiers) {
    const exists = await prisma.playerTier.findUnique({ where: { name: tier.name } });
    if (!exists) {
      await prisma.playerTier.create({ data: tier });
    }
  }

  // 4. Initialize Bidding Raise Tiers
  const raiseCount = await prisma.bidRaiseTier.count();
  if (raiseCount === 0) {
    const raiseTiers = [
      { minBudgetPercent: 0.00, maxBudgetPercent: 0.03, raisePercentage: 0.0015 },
      { minBudgetPercent: 0.03, maxBudgetPercent: 0.10, raisePercentage: 0.0050 },
      { minBudgetPercent: 0.10, maxBudgetPercent: 0.30, raisePercentage: 0.0100 },
      { minBudgetPercent: 0.30, maxBudgetPercent: 1.00, raisePercentage: 0.0200 },
    ];
    for (const rTier of raiseTiers) {
      await prisma.bidRaiseTier.create({ data: rTier });
    }
  }

  // 5. Seed Super Admin & Podium Admin
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const podiumPasswordHash = await bcrypt.hash('podium123', 10);

  const existingAdmin = await prisma.user.findUnique({ where: { email: 'superadmin@university.edu' } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'superadmin@university.edu',
        passwordHash: adminPasswordHash,
        role: Role.SUPER_ADMIN,
      },
    });
  }

  const existingPodium = await prisma.user.findUnique({ where: { email: 'podium@university.edu' } });
  if (!existingPodium) {
    await prisma.user.create({
      data: {
        name: 'Podium Auctioneer',
        email: 'podium@university.edu',
        passwordHash: podiumPasswordHash,
        role: Role.PODIUM_ADMIN,
      },
    });
  }

  console.log('MongoDB Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
