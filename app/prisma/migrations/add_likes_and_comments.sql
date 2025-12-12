-- Migration: Add likes and comments functionality to community posts
-- This migration adds PostLike and PostComment tables to enable user interactions

-- Create PostLike table
CREATE TABLE IF NOT EXISTS "PostLike" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PostLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ExerciseSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create unique constraint to prevent duplicate likes
CREATE UNIQUE INDEX IF NOT EXISTS "PostLike_userId_postId_key" ON "PostLike"("userId", "postId");

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS "PostLike_postId_idx" ON "PostLike"("postId");

-- Create PostComment table
CREATE TABLE IF NOT EXISTS "PostComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PostComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PostComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ExerciseSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS "PostComment_postId_idx" ON "PostComment"("postId");
