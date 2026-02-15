const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.create({
        data: {
            name: 'John Doe',
            phone: '+1234567890',
        },
    });
    console.log('Created user:', user);

    const driver = await prisma.driver.create({
        data: {
            name: 'Jane Driver',
            phone: '+0987654321',
            currentLat: 12.9716,
            currentLng: 77.5946,
            status: 'AVAILABLE'
        },
    });
    console.log('Created driver:', driver);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
