-- Migration: Add Like and Comment functionality to community posts
-- Created: 2025-10-23

-- Create PostLike table
CREATE TABLE IF NOT EXISTS "PostLike" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "submissionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostLike_pkey" PRIMARY KEY ("id")
);

-- Create PostComment table
CREATE TABLE IF NOT EXISTS "PostComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "submissionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostComment_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for user-post like combination
CREATE UNIQUE INDEX IF NOT EXISTS "PostLike_userId_postId_key" ON "PostLike"("userId", "postId");

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "PostLike_postId_idx" ON "PostLike"("postId");
CREATE INDEX IF NOT EXISTS "PostLike_submissionId_idx" ON "PostLike"("submissionId");
CREATE INDEX IF NOT EXISTS "PostComment_postId_idx" ON "PostComment"("postId");
CREATE INDEX IF NOT EXISTS "PostComment_submissionId_idx" ON "PostComment"("submissionId");
CREATE INDEX IF NOT EXISTS "PostComment_userId_idx" ON "PostComment"("userId");
