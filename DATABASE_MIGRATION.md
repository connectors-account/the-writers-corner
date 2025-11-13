# Database Migration: Likes and Comments Feature

## Overview
This migration adds like and comment functionality to community posts (exercise submissions).

## New Models Added

### SubmissionLike
Tracks likes on exercise submissions:
- `id`: Unique identifier (cuid)
- `userId`: Reference to User who liked
- `submissionId`: Reference to ExerciseSubmission
- `createdAt`: Timestamp when like was created
- **Unique constraint**: `[userId, submissionId]` - prevents duplicate likes

### SubmissionComment
Tracks comments on exercise submissions:
- `id`: Unique identifier (cuid)
- `content`: Comment text (Text field)
- `userId`: Reference to User who commented
- `submissionId`: Reference to ExerciseSubmission
- `createdAt`: Timestamp when comment was created
- `updatedAt`: Timestamp when comment was last updated

### PostLike
Tracks likes on community posts:
- `id`: Unique identifier (cuid)
- `userId`: Reference to User who liked
- `postId`: Reference to CommunityPost
- `createdAt`: Timestamp when like was created
- **Unique constraint**: `[userId, postId]` - prevents duplicate likes

### PostComment
Tracks comments on community posts:
- `id`: Unique identifier (cuid)
- `content`: Comment text (Text field)
- `userId`: Reference to User who commented
- `postId`: Reference to CommunityPost
- `createdAt`: Timestamp when comment was created
- `updatedAt`: Timestamp when comment was last updated

## Updated Models

### User
Added new relations:
- `postLikes`: PostLike[]
- `postComments`: PostComment[]
- `submissionLikes`: SubmissionLike[]
- `submissionComments`: SubmissionComment[]

### ExerciseSubmission
Added new relations:
- `likes`: SubmissionLike[]
- `comments`: SubmissionComment[]

### CommunityPost
Added new relations:
- `likes`: PostLike[]
- `comments`: PostComment[]

## Migration Commands

To apply this migration to your database:

```bash
# Navigate to the app directory
cd app

# Generate Prisma client with new models
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_likes_and_comments

# Or if database is already in sync
npx prisma db push
```

## Rollback Instructions

If you need to rollback this migration:

1. Remove the SubmissionLike, SubmissionComment, PostLike, and PostComment models from schema.prisma
2. Remove the relations from User, ExerciseSubmission, and CommunityPost models
3. Run: `npx prisma migrate dev --name rollback_likes_and_comments`

## Notes

- The unique constraints on likes prevent users from liking the same post multiple times
- Comments support editing (tracked via `updatedAt`)
- All foreign keys use `onDelete: Cascade` to maintain referential integrity
- Users can only edit/delete their own comments (enforced in API layer)
