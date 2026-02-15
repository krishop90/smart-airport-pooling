# Smart Airport Ride Pooling System

## Overview
A production-ready backend system for grouping airport passengers into shared cabs with intelligent route optimization, dynamic pricing, and real-time matching.

---

## Tech Stack
- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Database**: PostgreSQL 15+
- **ORM**: Prisma v5
- **Queue**: Redis + BullMQ
- **API Docs**: Swagger/OpenAPI
- **Containerization**: Docker

---

## Features
✅ Real-time ride matching with intelligent pooling  
✅ Seat & luggage constraint validation  
✅ Detour tolerance enforcement  
✅ Dynamic pricing based on distance, luggage, and surge  
✅ Async job processing for high throughput  
✅ Transaction-based concurrency control  
✅ Real-time cancellation with pool rebalancing  
✅ Database indexing for fast geo-queries  

---

## Architecture Highlights
- **Queue-based processing**: API returns immediately, matching happens async
- **Connection pooling**: Prisma manages DB connections efficiently
- **Transaction safety**: All critical operations use `$transaction`
- **Horizontal scalability**: Redis queue allows multiple workers

---

## Prerequisites
- Docker & Docker Compose
- Node.js v18+
- npm or yarn

---

## Quick Start

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd smart-airport-pooling
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Infrastructure (PostgreSQL + Redis)
```bash
docker-compose up -d
```

### 4. Configure Environment
Create `.env` file:
```env
DATABASE_URL="postgresql://postgres:krish20@localhost:5433/airport_pool?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3000
```

### 5. Run Database Migrations
```bash
npx prisma migrate dev
```

### 6. Start Server
```bash
npm run dev
```

Server runs at: **http://localhost:3000**  
Swagger UI: **http://localhost:3000/api-docs**

---

## API Documentation

### Swagger UI
Access interactive API docs at: **http://localhost:3000/api-docs**

### Available Endpoints

#### Rides
- `POST /rides/request` - Request a ride
- `GET /rides/:id` - Get ride status
- `POST /rides/:id/cancel` - Cancel ride

#### Users
- `POST /users` - Create user
- `GET /users/:id` - Get user details

#### Drivers
- `POST /drivers` - Create driver
- `PUT /drivers/:id/location` - Update driver location/status

---

## Testing

### Reset Database
```bash
node scripts/reset-db.js
```

### Test Complete Flow
Follow the guide in `FINAL_TESTING_GUIDE.md`

### Load Testing
```bash
npx autocannon -c 100 -d 10 http://localhost:3000/
```

**Expected Results**:
- Latency: <50ms (P99)
- Throughput: >200 req/sec
- 0% error rate

---

## Sample Test Data

### Create Driver
```json
{
  "name": "John Driver",
  "phone": "+1234567890",
  "seats": 4,
  "luggage": 2,
  "lat": 12.9716,
  "lng": 77.5946
}
```

### Create User
```json
{
  "name": "Alice Passenger",
  "phone": "+0987654321"
}
```

### Request Ride
```json
{
  "userId": "<user-id>",
  "pickupLat": 12.97,
  "pickupLng": 77.59,
  "dropLat": 13.0,
  "dropLng": 77.65,
  "seats": 1,
  "luggage": 0
}
```

---

## Database Schema

See `prisma/schema.prisma` for full schema.

### Key Models
- **User**: Passengers
- **Driver**: Available drivers with capacity
- **RideRequest**: Individual ride requests
- **RidePool**: Shared cab pools
- **PoolPassenger**: Join table linking requests to pools

### Indexes
- `@@index([pickupLat, pickupLng])` on RideRequest - Fast geo-queries
- `@@index([status])` - Fast status filtering
- `@@index([currentLat, currentLng])` on Driver - Driver location queries

---

## Concurrency Strategy

### 1. Database Transactions
All critical operations use Prisma `$transaction`:
```javascript
await prisma.$transaction(async (tx) => {
  // Atomic operations
});
```

### 2. Queue-based Processing
- Redis + BullMQ for async job processing
- Prevents race conditions on pool creation
- Enables horizontal scaling

### 3. Optimistic Locking
- Check pool capacity inside transaction
- Fail safely if capacity exceeded

---

## Dynamic Pricing Formula

**Implementation**: `src/utils/pricing.js`

```
baseFare = 50
distanceFare = distance_km × 12
luggageFee = luggage_count × 20
surgePricing = 1.0 to 2.0 (based on demand)
poolDiscount = 0.8 (20% off for pooling)

finalFare = (baseFare + distanceFare + luggageFee) × surgePricing × poolDiscount
```

---

## Algorithm Complexity

See `ALGORITHM_ANALYSIS.md` for detailed analysis.

**Matching Algorithm**:
- Time: O(P × C) where P = active pools, C = passengers per pool
- Space: O(P)
- Optimized with geo-indexing

---

## Project Structure

```
smart-airport-pooling/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # DB migrations
│   └── seed.js               # Sample data
├── src/
│   ├── config/               # DB config
│   ├── controllers/          # API controllers
│   ├── routes/              # Express routes
│   ├── services/            # Business logic
│   │   ├── matchingService.js   # Core matching algorithm
│   │   └── queueService.js      # Redis queue
│   ├── utils/               # Helpers
│   │   ├── geo.js          # Distance calculations
│   │   └── pricing.js      # Fare calculation
│   └── index.js            # Server entry point
├── scripts/
│   └── reset-db.js         # Database reset
├── docker-compose.yml      # Infrastructure
├── ALGORITHM_ANALYSIS.md   # Complexity analysis
├── ARCHITECTURE.md         # Design diagrams
└── README.md              # This file
```

---

## Design Documentation

- **Algorithm Analysis**: `ALGORITHM_ANALYSIS.md`
- **Architecture Diagrams**: `ARCHITECTURE.md`
- **Testing Guide**: `FINAL_TESTING_GUIDE.md`

---

## Assumptions

1. **Geo-coordinates**: Uses Haversine distance (not actual road distance)
2. **Detour tolerance**: Default 5.0 km per passenger
3. **Matching radius**: Drivers within 5 km of pickup
4. **Pool size**: No hard limit, constrained by driver capacity
5. **Surge pricing**: Simplified (not real-time demand-based)

---

## Future Enhancements

- [ ] Real-time driver tracking via WebSocket
- [ ] Advanced TSP-based route optimization
- [ ] ML-based surge pricing
- [ ] Multi-region support with geo-sharding
- [ ] Payment integration
- [ ] Rating & review system

---

## License
MIT

---

## Author
Developed as part of Backend Engineer Assignment

---

## Support
For issues or questions, check:
- `FINAL_TESTING_GUIDE.md` for testing
- `ARCHITECTURE.md` for design details
- Swagger UI for API reference
