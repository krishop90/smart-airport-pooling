-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('AVAILABLE', 'BUSY', 'OFFLINE');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'MATCHED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PoolStatus" AS ENUM ('MATCHING', 'ON_RIDE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PassengerStatus" AS ENUM ('WAITING', 'PICKED_UP', 'DROPPED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "totalSeats" INTEGER NOT NULL DEFAULT 4,
    "luggageCapacity" INTEGER NOT NULL DEFAULT 2,
    "status" "DriverStatus" NOT NULL DEFAULT 'AVAILABLE',
    "currentLat" DOUBLE PRECISION NOT NULL,
    "currentLng" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RideRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pickupLat" DOUBLE PRECISION NOT NULL,
    "pickupLng" DOUBLE PRECISION NOT NULL,
    "dropLat" DOUBLE PRECISION NOT NULL,
    "dropLng" DOUBLE PRECISION NOT NULL,
    "seats" INTEGER NOT NULL DEFAULT 1,
    "luggage" INTEGER NOT NULL DEFAULT 0,
    "detourTolerance" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RideRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RidePool" (
    "id" TEXT NOT NULL,
    "driverId" TEXT,
    "status" "PoolStatus" NOT NULL DEFAULT 'MATCHING',
    "route" JSONB NOT NULL,
    "totalFare" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RidePool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoolPassenger" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "assignedFare" DOUBLE PRECISION NOT NULL,
    "pickupOrder" INTEGER NOT NULL,
    "dropOrder" INTEGER NOT NULL,
    "status" "PassengerStatus" NOT NULL DEFAULT 'WAITING',

    CONSTRAINT "PoolPassenger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_phone_key" ON "Driver"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "PoolPassenger_requestId_key" ON "PoolPassenger"("requestId");

-- AddForeignKey
ALTER TABLE "RideRequest" ADD CONSTRAINT "RideRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RidePool" ADD CONSTRAINT "RidePool_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolPassenger" ADD CONSTRAINT "PoolPassenger_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "RidePool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolPassenger" ADD CONSTRAINT "PoolPassenger_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RideRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
