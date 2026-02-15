const express = require('express');
const dotenv = require('dotenv');
const rideRoutes = require('./routes/rideRoutes');
const driverRoutes = require('./routes/driverRoutes');
const userRoutes = require('./routes/userRoutes');

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
        },
        '/rides/{id}': {
            get: {
                summary: 'Get ride status',
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                responses: {
                    200: { description: 'Ride details' },
                    404: { description: 'Ride not found' }
                }
            }
        },
        '/rides/{id}/cancel': {
            post: {
                summary: 'Cancel ride',
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                responses: {
                    200: { description: 'Ride cancelled' }
                }
            }
        },
        '/users': {
            post: {
                summary: 'Create a new user',
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    phone: { type: 'string' }
                                },
                                required: ['name', 'phone']
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'User created' },
                    400: { description: 'Bad request' }
                }
            }
        },
        '/users/{id}': {
            get: {
                summary: 'Get user by ID',
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                responses: {
                    200: { description: 'User details' },
                    404: { description: 'User not found' }
                }
            }
        },
        '/drivers': {
            post: {
                summary: 'Create a new driver',
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    phone: { type: 'string' },
                                    seats: { type: 'integer', default: 4 },
                                    luggage: { type: 'integer', default: 2 },
                                    lat: { type: 'number' },
                                    lng: { type: 'number' }
                                },
                                required: ['name', 'phone', 'lat', 'lng']
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Driver created' },
                    500: { description: 'Server error' }
                }
            }
        },
        '/drivers/{id}/location': {
            put: {
                summary: 'Update driver location and status',
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' }
                    }
                ],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    lat: { type: 'number' },
                                    lng: { type: 'number' },
                                    status: {
                                        type: 'string',
                                        enum: ['AVAILABLE', 'BUSY', 'OFFLINE']
                                    }
                                },
                                required: ['lat', 'lng']
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Driver updated' },
                    500: { description: 'Server error' }
                }
            }
        }
    }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/rides', rideRoutes);
app.use('/drivers', driverRoutes);
app.use('/users', userRoutes);

// Health Check
app.get('/', (req, res) => {
    res.json({ message: 'Smart Airport Pooling API is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Swagger docs at http://localhost:${PORT}/api-docs`);
});