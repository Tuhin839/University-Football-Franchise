# ⚽ The University Football Franchise & Tournament Platform

A high-concurrency, state-machine driven web application designed for university football franchise leagues. Fully implements all requirements from the Official PRD: Dynamic Rules, Cloudinary Media uploads, Real-time Auction with Mutex concurrency locks & Budget Guardrails, Football Tournament Management with Single/Two-legged aggregate scoring, and Irreversible 3-Level Nuke Protocols.

---

## 🏗️ Architecture & Tech Stack

- **Backend**: Node.js, Express, TypeScript, Socket.io (Real-time Event Streaming), Prisma ORM (PostgreSQL), Cloudinary SDK.
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Lucide Icons, Socket.io Client.
- **Concurrency & State Safety**:
  - Global Phase Gatekeeper Middleware (`SETUP`, `REGISTRATION`, `AUCTION`, `TOURNAMENT`).
  - Mutex-serialized bidding transactions to prevent double spending and race conditions.
  - Strict Mathematical Budget Guardrail calculation.
  - Zero-polling event-driven architecture via WebSockets.

---

## 🚀 Quick Setup & Run Instructions

### 1. Backend Setup

```bash
cd backend
npm install

# Configure environment variables
cp .env.example .env
# Fill in your DATABASE_URL, JWT_SECRET, and CLOUDINARY credentials

# Run database migrations and seed default Super Admin & Tiers
npx prisma migrate dev --name init
npx prisma db seed

# Start development server
npm run dev
```

The backend starts on `http://localhost:5000` with WebSocket listeners on the same port.

### 2. Frontend Setup

```bash
cd frontend
npm install

# Start Vite dev server
npm run dev
```

The frontend SPA opens at `http://localhost:3000`.

---

## 👥 Default Credentials (From Seed)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `superadmin@university.edu` | `admin123` |
| **Podium Admin** | `podium@university.edu` | `podium123` |
| **Team Managers** | Created via Super Admin Console | Defined upon creation |

---

## 📋 Event Lifecycle (Global State Machine)

1. **Phase 1: SETUP (Pre-Event)**
   - Super Admin configures team budget allowances, minimum roster size, player tiers (Platinum, Gold, Silver, Bronze), dynamic bidding raise percentages, and creates Team Managers.
   - Public Landing renders the pre-event rules and budget breakdown.

2. **Phase 2: REGISTRATION**
   - Player Portal opens for registration with Student ID, Session, Jersey Name, Primary position, and secondary positions.
   - Profile images upload directly to Cloudinary (storing `public_id` for automated Nuke deletion).
   - Registrations can be updated or withdrawn before the auction.

3. **Phase 3: THE AUCTION**
   - Public landing transforms into the **Live Podium Stage**.
   - Socket.io broadcasts live timer, current highest bid, holding franchise, and real-time ledger.
   - **Podium Admin** introduces candidates in **Normal Mode** (incremental) or **Blind Mode** (sealed envelope bids).
   - **Budget Guardrail Formula**:
     $$\text{Remaining Budget} - P_{\text{bid}} \ge (R_{\text{min}} - R_{\text{cur}} - 1) \times BP_{\text{min}}$$
   - **Dispute Resolver**: Podium Admin can rollback bids or cancel stage auctions.

4. **Phase 4: TOURNAMENT**
   - Public landing transforms into the **Championship Dashboard**.
   - Features 3 tabs: **Matches & Fixtures** (with Single & Two-Legged Home/Away aggregate results), **Automated Points Table** (W=3, D=1, L=0, GD, GF), and **Player Statistics** (Top Scorers, Assists, Clean Sheets, Cards).

---

## 💥 Module 4: The Lifecycle Reset (Nuke Protocols)

Executed exclusively by Super Admin with confirmation typing:
- **Level 1 (Tournament Wipe)**: Deletes all fixtures, scores, match statistics, and points table. Reverts system to post-auction state.
- **Level 2 (Roster Wipe)**: Deletes all players, teams, managers, bidding ledgers, and **triggers Cloudinary API batch deletion** of all player image assets. Retains configuration rules and reverts to Phase 1.
- **Level 3 (Factory Reset)**: Wipes all tables, configurations, and media folders except Super Admin credentials.
