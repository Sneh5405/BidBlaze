-- AlterTable
ALTER TABLE "Auction" ADD COLUMN     "winnerId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'upcoming';

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
