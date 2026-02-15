const http = require('http');

const data = JSON.stringify({
    userId: 'eb92ae69-196d-4dc4-ba3f-00084f7b9a1b',
    pickupLat: 12.97,
    pickupLng: 77.59,
    dropLat: 13.00,
    dropLng: 77.65,
    seats: 1,
    luggage: 0
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/rides/request',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', (d) => {
        process.stdout.write(d);
    });
});

req.on('error', (error) => {
    console.error('Error:', error.message);
});

req.write(data);
req.end();
