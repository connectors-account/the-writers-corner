# Like and Comment Feature Migration Guide

## Overview
This document describes the changes made to add like and comment functionality to community posts.

## Database Changes

### New Models Added
1. **PostLike** - Stores user likes on posts
   - Fields: id, userId, postId, submissionId, createdAt
   - Supports both CommunityPost and ExerciseSubmission types
   - Unique constraint ensures one like per user per post

2. **PostComment** - Stores user comments on posts
   - Fields: id, content, userId, postId, submissionId, createdAt, updatedAt
   - Supports both CommunityPost and ExerciseSubmission types
   - Users can edit and delete their own comments

### Modified Models
- **User** - Added relations: likes, comments
- **ExerciseSubmission** - Added relations: likes, comments
- **CommunityPost** - Added relations: likes, comments

## API Endpoints Created

### Likes
- `GET /api/community/posts/[id]/likes` - Get like count and user's like status
- `POST /api/community/posts/[id]/likes` - Add a like
- `DELETE /api/community/posts/[id]/likes` - Remove a like

### Comments
- `GET /api/community/posts/[id]/comments` - Get all comments for a post
- `POST /api/community/posts/[id]/comments` - Create a comment
- `PUT /api/community/comments/[id]` - Edit a comment (own comments only)
- `DELETE /api/community/comments/[id]` - Delete a comment (own comments only)

## Frontend Changes

### Community Overview Component
- Added like button with counter and filled/unfilled heart icon
- Added comment button with counter
- Added expandable comment section with:
  - List of existing comments with author info and timestamps
  - Edit/delete buttons for own comments
  - Comment input form
  - Real-time updates after actions

## Deployment Steps

1. **Generate Prisma Migration**
   ```bash
   cd app
   npx prisma migrate dev --name add_likes_and_comments
   ```

2. **Apply Migration to Production**
   ```bash
   npx prisma migrate deploy
   ```

3. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

4. **Build and Deploy**
   ```bash
   npm run build
   npm run start
   ```

## Features Implemented

✅ Like functionality
  - Users can like/unlike posts
  - Real-time like count display
  - Visual feedback (filled heart for liked posts)
  - Authentication required

✅ Comment functionality
  - Users can add comments
  - Users can edit their own comments
  - Users can delete their own comments
  - Comments show author name and timestamp
  - "Edited" indicator for modified comments
  - Authentication required

## Testing Checklist

- [ ] Like a post
- [ ] Unlike a post
- [ ] Like count updates correctly
- [ ] Add a comment
- [ ] Edit own comment
- [ ] Delete own comment
- [ ] Cannot edit/delete others' comments
- [ ] Comment count updates correctly
- [ ] All features require authentication

## Notes

- All features require user authentication
- Comments are limited to 2000 characters
- Comments support basic text content
- Likes are unique per user per post
- Deleting a post cascades to delete all likes and comments
