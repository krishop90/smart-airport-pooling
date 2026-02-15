const BASE_FARE = 50; // Base fare in currency units
const RATE_PER_KM = 12; // Rate per KM
const LUGGAGE_FEE = 20;

const calculateFare = (distanceKm, luggageCount = 0, activeRequests = 10, activeDrivers = 5) => {
    const demand = activeRequests;
    const supply = activeDrivers || 1;
    const ratio = demand / supply;

    let surgeFactor = 1.0;
    // Simple surge logic
    if (ratio > 1.5) surgeFactor = 1.2;
    if (ratio > 2.5) surgeFactor = 1.5;
    if (ratio > 5.0) surgeFactor = 2.0;

    let fare = BASE_FARE + (distanceKm * RATE_PER_KM);
    fare *= surgeFactor;

    // Add luggage fee
    if (luggageCount > 0) {
        fare += (luggageCount * LUGGAGE_FEE);
    }

    // Pooling discount (fixed for now, could be dynamic)
    const POOL_DISCOUNT = 0.2; // 20% discount for pooling
    fare = fare * (1 - POOL_DISCOUNT);

    return Math.round(fare);
};

module.exports = { calculateFare };
