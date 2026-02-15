const prisma = require('../config/db');

exports.createDriver = async (req, res) => {
    try {
        const { name, phone, seats, luggage, lat, lng } = req.body;

        const driver = await prisma.driver.create({
            data: {
                name,
                phone,
                totalSeats: seats || 4,
                luggageCapacity: luggage || 2,
                currentLat: lat || 0.0,
                currentLng: lng || 0.0,
                status: 'AVAILABLE'
            }
        });

        res.status(201).json(driver);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const { lat, lng, status } = req.body;

        const driver = await prisma.driver.update({
            where: { id },
            data: {
                currentLat: parseFloat(lat),
                currentLng: parseFloat(lng),
                status: status || undefined
            }
        });

        res.json(driver);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
