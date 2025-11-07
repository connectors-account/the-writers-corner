# Implementation Notes: Like and Comment Features

## Overview
This PR adds like and comment functionality to community posts in The Writers Corner application. Users can now interact with shared exercise submissions by liking posts and leaving comments.

## Changes Made

### 1. Database Schema Updates (`app/prisma/schema.prisma`)

#### New Models:
- **PostLike**: Stores likes on posts
  - `id`: Unique identifier
  - `userId`: Reference to User who liked
  - `submissionId`: Reference to ExerciseSubmission (post)
  - `createdAt`: Timestamp
  - Constraints: Unique constraint on (userId, submissionId) to prevent duplicate likes
  - Indexes: Index on submissionId for faster queries

- **PostComment**: Stores comments on posts
  - `id`: Unique identifier
  - `content`: Comment text
  - `userId`: Reference to User who commented
  - `submissionId`: Reference to ExerciseSubmission (post)
  - `createdAt`, `updatedAt`: Timestamps
  - Indexes: Indexes on submissionId and userId for faster queries

#### Updated Models:
- **User**: Added relations for `likes` and `comments`
- **ExerciseSubmission**: Added relations for `likes` and `comments`

### 2. API Endpoints

#### Like Endpoints (`app/app/api/community/posts/[postId]/likes/route.ts`)
- **GET**: Get like count and user's like status for a post
  - Returns: `{ count: number, isLiked: boolean }`
  - Auth: Required

- **POST**: Toggle like on a post (like/unlike)
  - Returns: `{ success: boolean, isLiked: boolean, count: number }`
  - Auth: Required
  - Logic: If already liked, removes like; otherwise adds like

#### Comment Endpoints (`app/app/api/community/posts/[postId]/comments/route.ts`)
- **GET**: Get all comments for a post
  - Returns: `{ comments: Comment[] }`
  - Auth: Required
  - Sorted by createdAt ascending (oldest first)

- **POST**: Create a new comment
  - Body: `{ content: string }`
  - Returns: `{ comment: Comment }`
  - Auth: Required
  - Validation: Content must not be empty

#### Individual Comment Endpoints (`app/app/api/community/posts/[postId]/comments/[commentId]/route.ts`)
- **PUT**: Update a comment (only by author)
  - Body: `{ content: string }`
  - Returns: `{ comment: Comment }`
  - Auth: Required
  - Authorization: Only comment author can edit

- **DELETE**: Delete a comment (only by author)
  - Returns: `{ success: boolean }`
  - Auth: Required
  - Authorization: Only comment author can delete

### 3. Posts API Updates (`app/app/api/community/posts/route.ts`)
Enhanced to include:
- Like count for each post
- Comment count for each post
- User's like status (isLikedByUser)

### 4. Frontend Updates (`app/components/community/community-overview.tsx`)

#### New Features:
- **Like Button**: 
  - Shows like count
  - Heart icon fills when liked
  - Changes color when liked
  - Toggles on click

- **Comment Button**:
  - Shows comment count
  - Expands/collapses comment section on click

- **Comment Section** (expandable):
  - Comment form with textarea
  - List of all comments
  - Each comment shows:
    - Author name
    - Timestamp
    - Comment content
    - Edit/Delete buttons (only for comment author)
  
- **Comment Editing**:
  - Inline editing with Save/Cancel buttons
  - Only available to comment author

- **Comment Deletion**:
  - Confirmation dialog before deletion
  - Only available to comment author

#### State Management:
- `expandedComments`: Track which posts have comments section expanded
- `comments`: Store fetched comments per post
- `newComment`: Track new comment input per post
- `editingComment`: Track which comment is being edited
- `editContent`: Store content for comment being edited

#### UI/UX Enhancements:
- Seamless integration with existing vintage/typewriter theme
- Responsive design
- Optimistic UI updates for better user experience
- Clear visual feedback for interactions

## Security & Authorization

### Authentication:
- All API endpoints require user authentication
- Enforced via NextAuth session check

### Authorization:
- Users can only edit their own comments
- Users can only delete their own comments
- API returns 403 Forbidden if unauthorized

### Data Validation:
- Comment content must not be empty
- Content is trimmed before saving
- Post existence validated before operations

## Database Migration Required

After merging, run the following commands to apply the schema changes:

```bash
cd app
npx prisma migrate dev --name add_likes_and_comments
npx prisma generate
```

## Testing Recommendations

1. **Like Functionality**:
   - Test liking a post (heart should fill and color change)
   - Test unliking a post
   - Verify like count updates correctly
   - Test multiple users liking the same post

2. **Comment Functionality**:
   - Test adding a comment
   - Test viewing comments (expand/collapse)
   - Test editing own comment
   - Test deleting own comment
   - Verify users cannot edit/delete others' comments
   - Test empty comment validation

3. **Edge Cases**:
   - Test with non-existent post IDs
   - Test concurrent likes/comments
   - Test with unauthenticated users

## Future Enhancements (Out of Scope)

Potential improvements for future iterations:
- Real-time updates using WebSockets
- Pagination for comments
- Nested/threaded comments
- Like notifications
- Comment notifications
- Rich text support for comments
- Emoji reactions beyond likes
- Comment sorting options (newest first, oldest first)

## Notes

- The implementation uses ExerciseSubmission as the "post" model since that's how community posts are currently stored in the database
- All timestamps are stored in UTC
- Comment updates preserve the original createdAt timestamp
- The UI follows the existing vintage/typewriter design theme
- All API responses include proper error handling and status codes
