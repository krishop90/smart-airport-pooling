```

Link to diagrams :

https://drive.google.com/drive/folders/1F2onQdx2L-E7Z2X_evt7K-40DymeLZhV?usp=sharing

```

## Design Patterns Used

### 1. **Repository Pattern**
- **Implementation**: Prisma Client
- **Purpose**: Abstract database operations
- **Benefit**: Easy to swap DB or mock for testing

### 2. **Queue Pattern (Producer-Consumer)**
- **Implementation**: BullMQ + Redis
- **Purpose**: Async job processing
- **Benefit**: Non-blocking API, horizontal scaling

### 3. **Transaction Script Pattern**
- **Implementation**: Controllers call services
- **Purpose**: Organize business logic
- **Benefit**: Clean separation of concerns

### 4. **Service Layer Pattern**
- **Implementation**: `matchingService`, `queueService`
- **Purpose**: Encapsulate business logic
- **Benefit**: Reusable, testable

### 5. **Unit of Work Pattern**
- **Implementation**: Prisma `$transaction`
- **Purpose**: Atomic operations
- **Benefit**: ACID guarantees, prevents race conditions

---

## Concurrency Strategy

### Problem: Race Conditions

**Scenario**: Two passengers request rides simultaneously for the same pool

**Without Protection**:
```
Time T1: Passenger A checks pool capacity → 1 seat left
Time T2: Passenger B checks pool capacity → 1 seat left
Time T3: Passenger A added to pool → pool full
Time T4: Passenger B added to pool → OVERBOOKING! ❌
```

### Solution 1: Database Transactions

**Implementation**:
```javascript
await prisma.$transaction(async (tx) => {
  const pool = await tx.ridePool.findUnique({ ... });
  
  // Check capacity inside transaction
  if (currentSeats + request.seats > pool.driver.totalSeats) {
    throw new Error('Pool full');
  }
  
  // Atomic update
  await tx.poolPassenger.create({ ... });
});
```

**Guarantee**: Serializable isolation → No double-booking

### Solution 2: Queue-Based Processing

```
Request A ──┐
Request B ──┤─► Redis Queue ─► Worker (processes one at a time)
Request C ──┘
```

**Guarantee**: FIFO processing → Deterministic matching

### Solution 3: Optimistic Locking (Future)

**Approach**: Version field on pools
```sql
UPDATE RidePool SET passengers_count = passengers_count + 1, version = version + 1
WHERE id = ? AND version = ?
```

---

## Indexing Strategy

### Database Indexes

```sql
-- Fast geo-queries for ride matching
CREATE INDEX idx_riderequest_pickup ON RideRequest(pickupLat, pickupLng);

-- Fast status filtering
CREATE INDEX idx_riderequest_status ON RideRequest(status);
CREATE INDEX idx_ridepool_status ON RidePool(status);

-- Fast driver location queries
CREATE INDEX idx_driver_location ON Driver(currentLat, currentLng);
CREATE INDEX idx_driver_status ON Driver(status);

-- Composite index for common query
CREATE INDEX idx_driver_available ON Driver(status, currentLat, currentLng) 
WHERE status = 'AVAILABLE';
```

### Query Performance

**Before Indexing**:
```sql
SELECT * FROM Driver WHERE status = 'AVAILABLE';
-- Full table scan: O(N)
```

**After Indexing**:
```sql
SELECT * FROM Driver WHERE status = 'AVAILABLE';
-- Index scan: O(log N) + O(M) where M = matching rows
```

---

## Scalability Considerations

### Horizontal Scaling

1. **API Servers**: Stateless → Add more instances behind load balancer
2. **Workers**: Independent → Add more workers to process queue faster
3. **Database**: Read replicas for queries, write to primary
4. **Redis**: Cluster mode for high availability

### Vertical Scaling

1. **Database**: More RAM for larger connection pool
2. **Redis**: More memory for larger queue
3. **API Server**: More CPU for concurrent requests

---

## Security Considerations (Future)

1. **Authentication**: JWT tokens for API access
2. **Authorization**: User can only view their own rides
3. **Input Validation**: Sanitize coordinates, prevent SQL injection
4. **Rate Limiting**: Prevent abuse (100 req/min per user)

---

## Monitoring & Observability (Future)

1. **Metrics**: Prometheus + Grafana
   - Request latency (P50, P95, P99)
   - Queue depth
   - Match success rate

2. **Logging**: Structured JSON logs
   - Request ID tracking
   - Error stack traces

3. **Tracing**: OpenTelemetry for distributed tracing

---

## Conclusion

This architecture demonstrates:
- ✅ Clean separation of concerns (Controller → Service → Data)
- ✅ Scalable queue-based processing
- ✅ Transaction-safe concurrency control
- ✅ Optimized database queries with indexing
- ✅ Production-ready patterns (Repository, Service Layer)

**Trade-offs Accepted**:
- Simple detour calculation (vs. real routing API)
- Linear pool search (vs. geo-spatial index)
- Simplified surge pricing (vs. ML model)

These are **documented technical debt** for future enhancement while maintaining a **fully functional MVP**.
