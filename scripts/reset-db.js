const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reset() {
    console.log('🗑️  Deleting all data...');

    // Delete in correct order (foreign keys)
    await prisma.poolPassenger.deleteMany({});
    console.log('✅ Deleted pool passengers');

    await prisma.ridePool.deleteMany({});
    console.log('✅ Deleted ride pools');

    await prisma.rideRequest.deleteMany({});
    console.log('✅ Deleted ride requests');

    await prisma.driver.deleteMany({});
    console.log('✅ Deleted drivers');

    await prisma.user.deleteMany({});
    console.log('✅ Deleted users');

    console.log('\n✨ Database reset complete!\n');
}

reset()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
