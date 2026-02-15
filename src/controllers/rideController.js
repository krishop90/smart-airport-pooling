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
                pool: {
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
            poolId: request.pool ? request.pool.poolId : null,
            driver: request.pool?.pool?.driver || null
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
        // Update status to cancelled
        const request = await prisma.rideRequest.update({
            where: { id },
            data: { status: 'CANCELLED' }
        });

        // Logic to remove from pool if already matched would go here

        res.json({ message: 'Ride cancelled', requestId: id });
    } catch (error) {
        console.error('Cancel Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
