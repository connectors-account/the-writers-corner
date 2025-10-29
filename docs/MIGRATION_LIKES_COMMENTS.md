# Database Migration: Add Likes and Comments Support

## Overview
This migration adds support for likes and comments on community posts (ExerciseSubmissions).

## New Tables

### PostLike
Stores user likes on community posts.

**Fields:**
- `id` (String, PK): Unique identifier
- `userId` (String, FK): References User.id
- `submissionId` (String, FK): References ExerciseSubmission.id
- `createdAt` (DateTime): Timestamp of when like was created

**Constraints:**
- Unique constraint on `[userId, submissionId]` - ensures one like per user per post
- Index on `submissionId` for efficient querying
- Index on `userId` for user-specific queries
- Cascade delete when user or submission is deleted

### PostComment
Stores user comments on community posts.

**Fields:**
- `id` (String, PK): Unique identifier
- `content` (Text): Comment content (max 500 characters validated in API)
- `userId` (String, FK): References User.id
- `submissionId` (String, FK): References ExerciseSubmission.id
- `createdAt` (DateTime): Timestamp of creation
- `updatedAt` (DateTime): Timestamp of last update

**Constraints:**
- Index on `submissionId` for efficient querying
- Index on `userId` for user-specific queries
- Cascade delete when user or submission is deleted

## Updated Tables

### User
**Added Relations:**
- `likes` (PostLike[]): User's likes
- `comments` (PostComment[]): User's comments

### ExerciseSubmission
**Added Relations:**
- `likes` (PostLike[]): Likes on this submission
- `comments` (PostComment[]): Comments on this submission

## Migration Steps

1. Apply Prisma schema changes:
   ```bash
   cd app
   npx prisma migrate dev --name add_likes_and_comments
   ```

2. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

## Rollback Plan

If needed, the migration can be rolled back by:
1. Removing the PostLike and PostComment tables
2. Removing the relations from User and ExerciseSubmission models
3. Running `npx prisma migrate dev` to apply the rollback

## Testing Checklist

- [ ] Users can like a post
- [ ] Users can unlike a post they've liked
- [ ] Like count displays correctly
- [ ] Users cannot like the same post twice
- [ ] Users can add comments (up to 500 characters)
- [ ] Comments display with author and timestamp
- [ ] Users can delete their own comments
- [ ] Users cannot delete others' comments
- [ ] Comment count displays correctly
