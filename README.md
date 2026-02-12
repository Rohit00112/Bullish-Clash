# Bullish Battle - Nepal Stock Market Trading Simulator

A real-time competitive trading simulator for NEPSE (Nepal Stock Exchange) stocks. Built for live competition events where participants trade virtual stocks and compete for the highest portfolio value.

## Features

- **Real-time Trading**: Buy and sell NEPSE-listed stocks with market/limit orders
- **Live Competition**: Compete with other traders in timed competitions
- **Admin Price Control**: Administrators can trigger price changes via news/events
- **Live Leaderboard**: Real-time rankings based on portfolio value
- **WebSocket Updates**: Instant price updates and trade notifications
- **Portfolio Analytics**: Track P&L, positions, and trade history

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, Zustand, React Query
- **Backend**: NestJS, Drizzle ORM, PostgreSQL, Redis
- **Real-time**: Socket.IO for WebSocket connections
- **Infrastructure**: Docker, Nginx, pnpm workspaces, Turborepo

## Prerequisites

- Node.js 20+
- pnpm 8+
- Docker and Docker Compose
- PostgreSQL 15+ (or use Docker)
- Redis 7+ (or use Docker)

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd bullish-clash
pnpm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start with Docker (Recommended)

```bash
# Start all services (PostgreSQL, Redis, API, Web)
docker compose up -d

# Or for development with hot reload
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### 4. Manual Setup (Alternative)

```bash
# Start PostgreSQL and Redis (or use Docker)
docker compose up -d postgres redis

# Run database migrations
pnpm db:push

# Seed initial data
pnpm db:seed

# Start development servers
pnpm dev
```

## Project Structure

```
bullish-clash/
├── apps/
│   ├── api/                 # NestJS backend
│   │   ├── src/
│   │   │   ├── database/    # Drizzle schema & migrations
│   │   │   └── modules/     # Feature modules
│   │   │       ├── auth/        # JWT authentication
│   │   │       ├── users/       # User management
│   │   │       ├── symbols/     # Stock symbols CRUD
│   │   │       ├── prices/      # Price engine
│   │   │       ├── trading/     # Order execution
│   │   │       ├── portfolio/   # Portfolio tracking
│   │   │       ├── leaderboard/ # Rankings with Redis
│   │   │       ├── competition/ # Competition settings
│   │   │       ├── events/      # Admin price scripts
│   │   │       └── websocket/   # Real-time updates
│   │   └── Dockerfile
│   │
│   └── web/                 # Next.js frontend
│       ├── src/
│       │   ├── app/         # App router pages
│       │   │   ├── dashboard/   # Main trading UI
│       │   │   │   ├── trade/       # Trading interface
│       │   │   │   ├── portfolio/   # Portfolio view
│       │   │   │   ├── leaderboard/ # Rankings
│       │   │   │   └── admin/       # Admin panel
│       │   │   ├── login/
│       │   │   └── register/
│       │   ├── components/  # React components
│       │   ├── hooks/       # Custom hooks
│       │   ├── lib/         # API client, utilities
│       │   └── stores/      # Zustand state
│       └── Dockerfile
│
├── packages/
│   └── shared/              # Shared types & constants
│
├── nginx/                   # Nginx configuration
├── docker-compose.yml       # Production compose
├── docker-compose.dev.yml   # Development override
└── turbo.json              # Turborepo config
```

## Available Scripts

```bash
# Development
pnpm dev              # Start all apps in development mode
pnpm dev:api          # Start API only
pnpm dev:web          # Start Web only

# Build
pnpm build            # Build all apps
pnpm build:api        # Build API only
pnpm build:web        # Build Web only

# Database
pnpm db:generate      # Generate Drizzle migrations
pnpm db:push          # Push schema changes to DB
pnpm db:seed          # Seed initial data

# Docker
docker compose up -d                    # Start production
docker compose down                     # Stop all services
docker compose logs -f api              # View API logs
docker compose -f docker-compose.yml -f docker-compose.dev.yml up  # Development
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user

### Trading
- `POST /api/trading/orders` - Place order (buy/sell)
- `GET /api/trading/orders` - Get user's orders
- `GET /api/trading/history` - Get trade history

### Portfolio
- `GET /api/portfolio` - Get portfolio with positions
- `GET /api/portfolio/summary` - Get portfolio summary

### Market
- `GET /api/symbols` - Get all symbols
- `GET /api/prices` - Get current prices
- `GET /api/leaderboard` - Get rankings

### Admin (requires admin role)
- `POST /api/admin/prices/update` - Update stock price
- `POST /api/admin/events` - Create market event
- `POST /api/admin/events/:id/execute` - Execute event
- `PUT /api/competition/settings` - Update competition settings

## WebSocket Events

Connect to `ws://localhost:4000` with Socket.IO client.

### Client -> Server
- `subscribe` - Subscribe to symbol price updates
- `unsubscribe` - Unsubscribe from symbol

### Server -> Client
- `price_update` - Price change notification
- `trade_executed` - Trade confirmation
- `leaderboard_update` - Ranking changes
- `competition_status` - Competition state changes
- `market_event` - Admin-triggered news/events

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_URL` | Redis connection string | - |
| `JWT_SECRET` | Secret for JWT signing | - |
| `JWT_EXPIRES_IN` | JWT expiration time | 7d |
| `PORT` | API server port | 4000 |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:3000 |
| `NEXT_PUBLIC_API_URL` | API URL for frontend | http://localhost:4000 |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | ws://localhost:4000 |

## Admin Setup

1. Register a user account
2. Manually update the user's role in the database:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

3. Login and access `/dashboard/admin`

## Competition Flow

1. **Setup**: Admin configures competition settings (starting cash, duration, symbols)
2. **Registration**: Participants register and receive virtual starting cash
3. **Trading**: Participants trade stocks; admin triggers price events
4. **Live Updates**: Leaderboard updates in real-time
5. **Completion**: Competition ends; final rankings displayed

## Production Deployment

1. Update `.env` with production values
2. Configure SSL certificates in `nginx/ssl/`
3. Update `nginx/nginx.conf` for HTTPS
4. Build and deploy:

```bash
docker compose --profile production up -d
```

## License

MIT
