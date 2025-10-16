# Like and Comment Features for Community Posts

## Overview

This document describes the new like and comment functionality added to the community posts feature in The Writer's Corner application.

## Features

### 1. Like System
- **Anonymous Liking**: Users can like posts without authentication
- **Session-Based Tracking**: Uses browser cookies to track likes per session
- **Real-time Updates**: Like counts update instantly without page refresh
- **Visual Feedback**: Heart icon fills when liked, shows count when > 0

### 2. Comment System
- **Anonymous Commenting**: Users can comment without authentication
- **Author Name**: Users provide their name when commenting
- **Real-time Display**: Comments appear immediately after posting
- **Chronological Order**: Comments displayed newest first
- **Modal Interface**: Clean dialog interface for viewing and adding comments

## Database Schema

### PostLike Model
```prisma
model PostLike {
  id        String   @id @default(cuid())
  postId    String   // Reference to ExerciseSubmission id
  userId    String?  // Optional for future authenticated likes
  sessionId String?  // For tracking anonymous users
  ipAddress String?  // Additional tracking
  createdAt DateTime @default(now())

  @@unique([postId, sessionId])
  @@index([postId])
}
```

### PostComment Model
```prisma
model PostComment {
  id          String   @id @default(cuid())
  postId      String   // Reference to ExerciseSubmission id
  content     String   @db.Text
  authorName  String   // Display name for anonymous comments
  userId      String?  // Optional for future authenticated comments
  sessionId   String?  // For tracking anonymous users
  ipAddress   String?  // Additional tracking
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([postId])
}
```

## API Endpoints

### Likes

#### GET /api/community/posts/[id]/likes
Get like count and user's like status for a post.

**Response:**
```json
{
  "count": 5,
  "liked": true
}
```

#### POST /api/community/posts/[id]/likes
Toggle like status for a post (like or unlike).

**Response:**
```json
{
  "liked": true,
  "count": 6
}
```

### Comments

#### GET /api/community/posts/[id]/comments
Get all comments for a post.

**Response:**
```json
{
  "comments": [
    {
      "id": "clxy...",
      "content": "Great work!",
      "authorName": "John Doe",
      "createdAt": "2025-10-16T12:00:00Z"
    }
  ]
}
```

#### POST /api/community/posts/[id]/comments
Create a new comment on a post.

**Request:**
```json
{
  "content": "Great work!",
  "authorName": "John Doe"
}
```

**Response:**
```json
{
  "comment": {
    "id": "clxy...",
    "content": "Great work!",
    "authorName": "John Doe",
    "createdAt": "2025-10-16T12:00:00Z"
  }
}
```

## Components

### PostLikes Component
Location: `app/components/community/post-likes.tsx`

**Props:**
- `postId`: string - The ID of the post
- `initialCount?`: number - Initial like count (optional)

**Features:**
- Fetches like status on mount
- Optimistic updates for instant feedback
- Error handling with toast notifications
- Visual state changes (filled heart when liked)

### PostComments Component
Location: `app/components/community/post-comments.tsx`

**Props:**
- `postId`: string - The ID of the post
- `initialCount?`: number - Initial comment count (optional)

**Features:**
- Modal dialog interface
- Comment form with name and content fields
- Real-time comment display
- Relative timestamps (e.g., "2h ago", "Just now")
- Error handling with toast notifications

## Setup Instructions

### 1. Database Migration

After pulling this branch, run the Prisma migration:

```bash
cd app
npx prisma generate
npx prisma db push
```

### 2. Environment Variables

Ensure your `.env` file has the `DATABASE_URL` configured:

```env
DATABASE_URL="postgresql://user:password@host:port/database"
```

### 3. Install Dependencies

All required dependencies should already be in `package.json`. If needed:

```bash
cd app
npm install
```

### 4. Run the Application

```bash
cd app
npm run dev
```

## Technical Notes

### Session Management
- Uses browser cookies (`anonymous_session`) to track user sessions
- Cookie expires in 1 year
- HttpOnly and SameSite=Lax for security

### Anonymous User Tracking
- Each anonymous user gets a unique session ID
- IP addresses are stored for moderation purposes
- Session ID ensures one like per user per post

### Future Enhancements
- User authentication integration (userId field is prepared)
- Comment editing and deletion
- Comment threading/replies
- Like list showing who liked
- Moderation tools for comments
- Spam protection and rate limiting

## Testing

### Manual Testing Steps

1. **Like Feature:**
   - Navigate to community page
   - Click heart icon on any post
   - Verify count increases and icon fills
   - Click again to unlike
   - Verify count decreases and icon unfills
   - Refresh page and verify like persists

2. **Comment Feature:**
   - Click "Comment" button on any post
   - Enter name and comment text
   - Submit comment
   - Verify comment appears in list
   - Add multiple comments
   - Verify chronological ordering
   - Refresh page and verify comments persist

## Files Modified/Created

### New Files
- `app/app/api/community/posts/[id]/likes/route.ts`
- `app/app/api/community/posts/[id]/comments/route.ts`
- `app/components/community/post-likes.tsx`
- `app/components/community/post-comments.tsx`
- `FEATURES_LIKES_COMMENTS.md`

### Modified Files
- `app/prisma/schema.prisma` - Added PostLike and PostComment models
- `app/app/api/community/posts/route.ts` - Added like/comment counts
- `app/components/community/community-overview.tsx` - Integrated new components
- `app/components/providers.tsx` - Added Sonner toast notifications

## Support

For questions or issues, please refer to the main README or create an issue in the repository.
