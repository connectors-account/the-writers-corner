# Migration Notes: Likes and Comments Feature

## Database Changes

This feature adds likes and comments functionality to community posts (exercise submissions).

### New Models Added

1. **PostLike**: Tracks user likes on posts
   - userId (relation to User)
   - postId (relation to ExerciseSubmission)
   - createdAt
   - Unique constraint on [userId, postId]

2. **PostComment**: Stores comments on posts
   - content (text)
   - userId (relation to User)
   - postId (relation to ExerciseSubmission)
   - createdAt
   - updatedAt

### Updated Models

1. **User**: Added relations for postLikes and postComments
2. **ExerciseSubmission**: Added relations for likes and comments

## Required Migration Steps

After pulling these changes, run the following commands:

```bash
cd app
npm install  # Install dependencies if not already installed
npx prisma generate  # Generate Prisma client with new models
npx prisma migrate dev --name add-likes-comments  # Create and apply migration
```

## Features Implemented

### Like Functionality
- Users can like/unlike posts with a single click
- Like count is displayed on posts
- Visual indicator shows when a user has liked a post
- Requires authentication

### Comment Functionality
- Users can add comments to posts
- Users can edit their own comments
- Users can delete their own comments
- Comments display user information and timestamps
- Shows "edited" indicator for modified comments
- Requires authentication

## API Routes Added

- `POST /api/community/posts/[postId]/likes` - Toggle like on a post
- `GET /api/community/posts/[postId]/likes` - Get like count and user's like status
- `GET /api/community/posts/[postId]/comments` - Get all comments for a post
- `POST /api/community/posts/[postId]/comments` - Add a comment to a post
- `PUT /api/community/posts/[postId]/comments/[commentId]` - Edit a comment
- `DELETE /api/community/posts/[postId]/comments/[commentId]` - Delete a comment

## UI Components Added

- `PostComments` component - Handles comment display and management
- Updated `CommunityOverview` component with interactive likes and comments

## Dependencies

All dependencies are already in package.json:
- react-hot-toast (for notifications)
- next-auth (for authentication)
- @prisma/client (for database operations)
