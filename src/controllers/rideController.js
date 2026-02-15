const prisma = require('../config/db');
const queueService = require('../services/queueService');

exports.requestRide = async (req, res) => {
    try {
        const { userId, pickupLat, pickupLng, dropLat, dropLng, seats, luggage } = req.body;

        // Basic Check
        if (!userId || !pickupLat || !pickupLng || !dropLat || !dropLng) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const request = await prisma.rideRequest.create({
            data: {
                userId,
                pickupLat: parseFloat(pickupLat),
                pickupLng: parseFloat(pickupLng),
                dropLat: parseFloat(dropLat),
                dropLng: parseFloat(dropLng),
                seats: parseInt(seats || 1),
                luggage: parseInt(luggage || 0),
                status: 'PENDING'
            }
        });

        // Push to matching queue
        await queueService.addMatchJob(request.id);

        res.status(201).json({
            message: 'Ride requested successfully',
            requestId: request.id,
            status: 'PENDING'
        });
    } catch (error) {
        console.error('Request Ride Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getRideStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await prisma.rideRequest.findUnique({
            where: { id },
            include: {
                poolPassenger: {
                    include: {
                        pool: {
                            include: { driver: true }
                        }
                    }
                }
            }
        });

        if (!request) {
            return res.status(404).json({ error: 'Ride request not found' });
        }

        let response = {
            id: request.id,
            status: request.status,
            pickupLocation: {
                lat: request.pickupLat,
                lng: request.pickupLng
            },
            dropLocation: {
                lat: request.dropLat,
                lng: request.dropLng
            },
            seats: request.seats,
            luggage: request.luggage,
            poolId: request.poolPassenger ? request.poolPassenger.poolId : null,
            assignedFare: request.poolPassenger ? request.poolPassenger.assignedFare : null,
            pickupOrder: request.poolPassenger ? request.poolPassenger.pickupOrder : null,
            dropOrder: request.poolPassenger ? request.poolPassenger.dropOrder : null,
            driver: request.poolPassenger?.pool?.driver || null
        };

        res.json(response);
    } catch (error) {
        console.error('Get Status Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.cancelRide = async (req, res) => {
    try {
        const { id } = req.params;

        // Use transaction to ensure consistency
        await prisma.$transaction(async (tx) => {
            const request = await tx.rideRequest.findUnique({
                where: { id },
                include: {
                    poolPassenger: {
                        include: {
                            pool: {
                                include: { passengers: true, driver: true }
                            }
                        }
                    }
                }
            });

            if (!request) {
                throw new Error('Request not found');
            }

            // Update request status to CANCELLED
            await tx.rideRequest.update({
                where: { id },
                data: { status: 'CANCELLED' }
            });

            // If matched to a pool, remove from pool
            if (request.poolPassenger) {
                const poolPassenger = request.poolPassenger;
                const pool = poolPassenger.pool;

                // Update passenger status
                await tx.poolPassenger.update({
                    where: { id: poolPassenger.id },
                    data: { status: 'CANCELLED' }
                });

                // Check if pool is now empty (all passengers cancelled)
                const activePassengers = pool.passengers.filter(
                    p => p.status !== 'CANCELLED' && p.id !== poolPassenger.id
                );

                if (activePassengers.length === 0) {
                    // Pool is empty, complete it and free the driver
                    await tx.ridePool.update({
                        where: { id: pool.id },
                        data: { status: 'COMPLETED' }
                    });

                    if (pool.driver) {
                        await tx.driver.update({
                            where: { id: pool.driver.id },
                            data: { status: 'AVAILABLE' }
                        });
                    }
                }
            }
        });

        res.json({ message: 'Ride cancelled successfully', requestId: id });
    } catch (error) {
        console.error('Cancel Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
