-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enableServerOCR" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Friend" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameUserId" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Friend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "matchExternalId" TEXT,
    "playedAt" TIMESTAMP(3) NOT NULL,
    "mode" TEXT,
    "result" TEXT NOT NULL,
    "partySize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchPlayer" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "friendId" TEXT,
    "isOwnerParty" BOOLEAN NOT NULL DEFAULT false,
    "gameUserId" TEXT NOT NULL,
    "hero" TEXT,
    "k" INTEGER,
    "d" INTEGER,
    "a" INTEGER,
    "gpm" INTEGER,
    "dmgDealt" INTEGER,
    "dmgTaken" INTEGER,

    CONSTRAINT "MatchPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Upload" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ocrEngine" TEXT,
    "parseNotes" TEXT,

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FriendStats" (
    "id" TEXT NOT NULL,
    "friendId" TEXT NOT NULL,
    "gamesTogether" INTEGER NOT NULL DEFAULT 0,
    "winsTogether" INTEGER NOT NULL DEFAULT 0,
    "avgK" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgD" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgA" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "synergyScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "synergyJSON" JSONB,
    "lastComputedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FriendStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelFit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "intercept" DOUBLE PRECISION NOT NULL,
    "coef" JSONB NOT NULL,
    "features" TEXT[] NOT NULL,
    "samples" INTEGER NOT NULL,

    CONSTRAINT "ModelFit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Friend_userId_gameUserId_key" ON "Friend"("userId", "gameUserId");

-- CreateIndex
CREATE UNIQUE INDEX "FriendStats_friendId_key" ON "FriendStats"("friendId");

-- AddForeignKey
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "Friend"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendStats" ADD CONSTRAINT "FriendStats_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "Friend"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelFit" ADD CONSTRAINT "ModelFit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
