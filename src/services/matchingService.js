const prisma = require('../config/db');
const { calculateDistance } = require('../utils/geo');
const { calculateFare } = require('../utils/pricing');

// Constants
const MATCHING_RADIUS_KM = 5;

// Core matching logic
async function matchRequest(requestId) {
    const request = await prisma.rideRequest.findUnique({
        where: { id: requestId },
    });

    if (!request) throw new Error('Request not found');
    if (request.status !== 'PENDING') return null; // Already matched or cancelled

    // 1. Try to find an existing active pool
    const pools = await prisma.ridePool.findMany({
        where: {
            status: 'MATCHING', // Only join matchmaking pools
        },
        include: {
            driver: true,
            passengers: {
                include: { request: true }
            }
        }
    });

    for (const pool of pools) {
        if (!pool.driver) continue;

        // Check Constraints
        const currentSeats = pool.passengers.reduce((sum, p) => sum + p.request.seats, 0);
        const currentLuggage = pool.passengers.reduce((sum, p) => sum + p.request.luggage, 0);

        // Capacity check
        if (currentSeats + request.seats > pool.driver.totalSeats) continue;
        if (currentLuggage + request.luggage > pool.driver.luggageCapacity) continue;

        // Proximity check (driver to new pickup)
        const distDriverToPickup = calculateDistance(
            pool.driver.currentLat, pool.driver.currentLng,
            request.pickupLat, request.pickupLng
        );

        if (distDriverToPickup > MATCHING_RADIUS_KM) continue;

        // Check detour tolerance (simplified: ensure pickup is somewhat along the route)
        // For this version, we trust the radius check and capacity.
        // real implementation would simulate route insertion.

        return await addToPool(pool.id, request);
    }

    // 2. If no existing pool, find a driver
    const driver = await findNearestDriver(request);
    if (driver) {
        return await createPool(driver.id, request);
    }

    return null; // No match found yet
}

async function findNearestDriver(request) {
    const drivers = await prisma.driver.findMany({
        where: {
            status: 'AVAILABLE',
            totalSeats: { gte: request.seats },
            luggageCapacity: { gte: request.luggage }
        }
    });

    let bestDriver = null;
    let minDistance = MATCHING_RADIUS_KM;

    for (const d of drivers) {
        const dist = calculateDistance(d.currentLat, d.currentLng, request.pickupLat, request.pickupLng);
        if (dist < minDistance) {
            minDistance = dist;
            bestDriver = d;
        }
    }
    return bestDriver;
}

async function addToPool(poolId, request) {
    // Transaction to ensure consistency
    return await prisma.$transaction(async (tx) => {
        // Double check pool status in tx?

        // Add passenger
        const passenger = await tx.poolPassenger.create({
            data: {
                poolId: poolId,
                requestId: request.id,
                assignedFare: calculateFare(
                    calculateDistance(request.pickupLat, request.pickupLng, request.dropLat, request.dropLng),
                    request.luggage || 0
                ),
                pickupOrder: 1, // simplified
                dropOrder: 1    // simplified
            }
        });

        // Update request status
        await tx.rideRequest.update({
            where: { id: request.id },
            data: { status: 'MATCHED' }
        });

        return { type: 'JOINED_POOL', poolId, passengerId: passenger.id };
    });
}

async function createPool(driverId, request) {
    return await prisma.$transaction(async (tx) => {
        // Create Pool
        const pool = await tx.ridePool.create({
            data: {
                driverId: driverId,
                status: 'MATCHING',
                route: [], // Initialize route
            }
        });

        // Add Passenger
        await tx.poolPassenger.create({
            data: {
                poolId: pool.id,
                requestId: request.id,
                assignedFare: calculateFare(
                    calculateDistance(request.pickupLat, request.pickupLng, request.dropLat, request.dropLng),
                    request.luggage || 0
                ),
                pickupOrder: 0,
                dropOrder: 0
            }
        });

        // Update Request
        await tx.rideRequest.update({
            where: { id: request.id },
            data: { status: 'MATCHED' }
        });

        // Update Driver Status
        await tx.driver.update({
            where: { id: driverId },
            data: { status: 'BUSY' } // Driver is now on a job (even if matching more)
        });

        return { type: 'CREATED_POOL', poolId: pool.id, driverId };
    });
}

module.exports = { matchRequest };
