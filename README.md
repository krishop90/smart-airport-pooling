# Smart Airport Pooling Backend

A backend system for an airport ride-pooling service (like Uber Pool for airports).

## Tech Stack
- **Node.js + Express.js**: API Framework
- **PostgreSQL + Prisma**: Database and ORM
- **Redis + BullMQ**: Job Queue for asynchronous matching
- **Swagger**: API Documentation

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- PostgreSQL (running locally or via Docker)
- Redis (running locally or via Docker)

### Installation
1. Navigate to the project directory:
   ```bash
   cd smart-airport-pooling
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env`. Ensure `DATABASE_URL` and `REDIS_HOST` are correct.
   
4. Start Postgres and Redis (if using Docker):
   ```bash
   docker-compose up -d
   ```

5. Run Database Migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

### Running the App
- **Development**:
  ```bash
  npm run dev
  ```
- **Production**:
  ```bash
  npm start
  ```

## Architecture Overview

1. **API Layer**: Express.js handles incoming HTTP requests for rides, cancellations, and driver updates. `rideController` and `driverController` manage validation and delegation.
2. **Matching Engine**: Located in `src/services/matchingService.js`. It finds the best driver or existing pool for a passenger using Haversine distance and capacity constraints.
3. **Queue System**: BullMQ (`src/services/queueService.js`) handles ride requests asynchronously. Requests are pushed to a Redis queue and processed by a worker to prevent API blocking.
4. **Database**: PostgreSQL stores persistent data for Users, Drivers, Requests, and Pools. Prisma ORM manages the schema and queries.

## Assumptions
- Distance is calculated using straight-line (Haversine) formula for simplicity.
- Drivers have fixed capacity (default 4 seats).
- A pool is considered "active" for matching until it is full or departs (logic simplified to 'MATCHING' status).
- Pricing uses a basic formula with surge multipliers based on mock demand for this demo.

## Complexity Analysis

### Matching Algorithm
- **Time Complexity**: O(N) where N is the number of active pools/drivers. We iterate through available pools to find a match.
- **Space Complexity**: O(1) auxiliary space (excluding DB result set).
- **Optimization**: Using PostGIS for geospatial indexing would reduce lookup to O(log N).

### Pricing Logic
- **Complexity**: O(1). Formula-based calculation.

## Testing
Load testing with Autocannon (simulating 100 concurrent connections):
```bash
npx autocannon -c 100 -d 10 http://localhost:3000/rides/request
```

## API Docs
Swagger UI is available at `http://localhost:3000/api-docs` when the server is running.
