const express = require('express');
const dotenv = require('dotenv');
const rideRoutes = require('./routes/rideRoutes');
const driverRoutes = require('./routes/driverRoutes');

dotenv.config();

const app = express();
app.use(express.json());

// Swagger Setup
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = {
    openapi: '3.0.0',
    info: {
        title: 'Smart Airport Pooling API',
        version: '1.0.0',
        description: 'API for airport cab pooling system'
    },
    paths: {
        '/rides/request': {
            post: {
                summary: 'Request a ride',
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    userId: { type: 'string' },
                                    pickupLat: { type: 'number' },
                                    pickupLng: { type: 'number' },
                                    dropLat: { type: 'number' },
                                    dropLng: { type: 'number' },
                                    seats: { type: 'integer' },
                                    luggage: { type: 'integer' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Ride requested' },
                    400: { description: 'Bad request' }
                }
            }
        }
        // More paths can be added
    }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/rides', rideRoutes);
app.use('/drivers', driverRoutes);

// Health Check
app.get('/', (req, res) => {
    res.json({ message: 'Smart Airport Pooling API is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Swagger docs at http://localhost:${PORT}/api-docs`);
});
