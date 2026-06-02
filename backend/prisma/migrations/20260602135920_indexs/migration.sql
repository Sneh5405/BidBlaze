-- CreateIndex
CREATE INDEX "Auction_status_idx" ON "Auction"("status");

-- CreateIndex
CREATE INDEX "Auction_category_idx" ON "Auction"("category");

-- CreateIndex
CREATE INDEX "Auction_sellerId_idx" ON "Auction"("sellerId");

-- CreateIndex
CREATE INDEX "Auction_winnerId_idx" ON "Auction"("winnerId");

-- CreateIndex
CREATE INDEX "Auction_endTime_idx" ON "Auction"("endTime");

-- CreateIndex
CREATE INDEX "Auction_startTime_idx" ON "Auction"("startTime");

-- CreateIndex
CREATE INDEX "Auction_createdAt_idx" ON "Auction"("createdAt");

-- CreateIndex
CREATE INDEX "Auction_status_category_idx" ON "Auction"("status", "category");

-- CreateIndex
CREATE INDEX "Auction_status_createdAt_idx" ON "Auction"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Bid_auctionId_idx" ON "Bid"("auctionId");

-- CreateIndex
CREATE INDEX "Bid_bidderId_idx" ON "Bid"("bidderId");

-- CreateIndex
CREATE INDEX "Bid_auctionId_amount_idx" ON "Bid"("auctionId", "amount");

-- CreateIndex
CREATE INDEX "Bid_bidderId_createdAt_idx" ON "Bid"("bidderId", "createdAt");

-- CreateIndex
CREATE INDEX "ChatRoom_sellerId_idx" ON "ChatRoom"("sellerId");

-- CreateIndex
CREATE INDEX "ChatRoom_winnerId_idx" ON "ChatRoom"("winnerId");

-- CreateIndex
CREATE INDEX "ChatRoom_sellerId_winnerId_idx" ON "ChatRoom"("sellerId", "winnerId");

-- CreateIndex
CREATE INDEX "Message_chatRoomId_idx" ON "Message"("chatRoomId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_chatRoomId_createdAt_idx" ON "Message"("chatRoomId", "createdAt");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");
