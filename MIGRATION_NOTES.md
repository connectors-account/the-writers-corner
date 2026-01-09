# Database Migration Required

This branch introduces new database models for likes and comments functionality on community posts.

## Changes

### New Models Added:
- `PostLike` - Stores user likes on posts
- `PostComment` - Stores user comments on posts

### Modified Models:
- `ExerciseSubmission` - Added relations to likes and comments
- `User` - Added relations to likes and comments

## Migration Steps

After merging this PR, you need to run the following commands:

```bash
cd app
npx prisma migrate dev --name add_likes_and_comments
npx prisma generate
```

This will:
1. Create the new database tables (PostLike, PostComment)
2. Add the necessary relationships
3. Regenerate the Prisma client with the new types

## Features Added

### Like Functionality:
- Users can like/unlike posts
- Like counts are displayed on posts
- Each user can only like a post once
- Liked posts are visually indicated

### Comment Functionality:
- Users can add comments to posts
- Users can edit their own comments
- Users can delete their own comments
- Comment counts are displayed on posts
- Comments show author name and timestamp
- Real-time comment section with expand/collapse

All functionality requires authentication.
