# Like and Comment Feature Implementation

## Overview
This document describes the implementation of Like and Comment functionality for community posts in The Writer's Corner application.

## Features Implemented

### 1. Like Functionality
- ✅ Users can like/unlike posts
- ✅ Like count displayed on each post
- ✅ Visual indication when user has liked a post (filled heart icon)
- ✅ Likes are stored persistently in the database
- ✅ Requires user authentication

### 2. Comment Functionality
- ✅ Users can add comments to posts
- ✅ Users can edit their own comments
- ✅ Users can delete their own comments
- ✅ Comments are stored persistently in the database
- ✅ Display comments with user information and timestamps
- ✅ Expandable/collapsible comment sections
- ✅ Requires user authentication

## Database Changes

### New Models Added to Prisma Schema

#### Like Model
```prisma
model Like {
  id        String   @id @default(cuid())
  userId    String
  postId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  post      CommunityPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([userId, postId])
  @@index([postId])
}
```

#### Comment Model
```prisma
model Comment {
  id        String   @id @default(cuid())
  content   String   @db.Text
  userId    String
  postId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  post      CommunityPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([postId])
  @@index([userId])
}
```

### Modified Models
- **User**: Added `likes` and `comments` relations
- **CommunityPost**: Added `likes` and `comments` relations

## API Endpoints Created

### Likes
- **GET** `/api/community/posts/[id]/likes` - Get likes for a post
- **POST** `/api/community/posts/[id]/likes` - Like a post
- **DELETE** `/api/community/posts/[id]/likes` - Unlike a post

### Comments
- **GET** `/api/community/posts/[id]/comments` - Get comments for a post
- **POST** `/api/community/posts/[id]/comments` - Create a comment
- **PUT** `/api/community/comments/[commentId]` - Update a comment (own comments only)
- **DELETE** `/api/community/comments/[commentId]` - Delete a comment (own comments only)

## UI Changes

### Updated Components
- **CommunityOverview** (`app/components/community/community-overview.tsx`)
  - Added like button with count and visual feedback
  - Added comment button with count
  - Added expandable comment section
  - Added comment input field
  - Added edit/delete functionality for own comments
  - Added user authentication checks

### New Features in UI
- Heart icon fills when user has liked a post
- Like and comment counts display dynamically
- Comments expand/collapse on button click
- Edit mode for own comments with textarea
- Delete confirmation dialog
- Only show edit/delete buttons for user's own comments

## Setup Instructions

### 1. Database Migration
After pulling these changes, you need to run the Prisma migration to create the new tables:

```bash
cd app
npx prisma migrate dev --name add_likes_and_comments
```

This will:
- Create the `Like` and `Comment` tables
- Update the `User` and `CommunityPost` relations
- Generate a new Prisma Client

### 2. Generate Prisma Client
If not done automatically during migration:

```bash
npx prisma generate
```

### 3. Install Dependencies
Ensure all dependencies are installed:

```bash
npm install
```

### 4. Run the Application
```bash
npm run dev
```

## Testing the Features

### Test Like Functionality
1. Navigate to the Community page
2. Click the "Like" button on any post
3. Verify the like count increases and the heart icon fills
4. Click again to unlike
5. Verify the like count decreases and the heart icon becomes outlined

### Test Comment Functionality
1. Navigate to the Community page
2. Click the "Comment" button on any post
3. The comment section should expand
4. Type a comment and press "Post" or hit Enter
5. Verify the comment appears with your name and timestamp
6. Verify the comment count increases
7. Click "Edit" on your own comment
8. Modify the comment and click "Save"
9. Click "Delete" on your own comment
10. Confirm deletion and verify the comment is removed

### Test Authentication
1. Verify edit/delete buttons only appear on your own comments
2. Verify likes and comments require being logged in
3. Test that API endpoints return 401 for unauthenticated requests

## Security Features

- All API endpoints require authentication via NextAuth
- Users can only edit/delete their own comments (enforced in both API and UI)
- Proper error handling and validation
- SQL injection protection via Prisma ORM
- Cascade deletes ensure data integrity

## File Structure

```
app/
├── app/api/community/
│   ├── comments/
│   │   └── [commentId]/
│   │       └── route.ts          # Edit/Delete comment endpoints
│   └── posts/
│       ├── [id]/
│       │   ├── comments/
│       │   │   └── route.ts      # Get/Create comments endpoints
│       │   └── likes/
│       │       └── route.ts      # Like/Unlike endpoints
│       └── route.ts              # Updated to include like/comment counts
├── components/community/
│   └── community-overview.tsx    # Updated with like/comment UI
└── prisma/
    └── schema.prisma             # Updated with Like and Comment models
```

## Future Enhancements (Not Implemented)

Potential improvements for future iterations:
- Reply to comments (nested comments)
- Like comments
- Notification system for likes and comments
- Mention users in comments (@username)
- Rich text formatting in comments
- Image attachments in comments
- Report inappropriate comments
- Admin moderation tools
- Real-time updates using WebSockets

## Dependencies

No new dependencies were required. The implementation uses existing packages:
- `next` - Server and client framework
- `next-auth` - Authentication
- `@prisma/client` - Database ORM
- `lucide-react` - Icons (Heart, MessageCircle, Pencil, Trash2)
- `framer-motion` - Animations (already in use)

## Notes

- Likes are stored against both exercise submissions and community posts
- Exercise submissions currently show 0 likes/comments (can be enhanced in future)
- Comments use cascade delete to remove all associated data when post or user is deleted
- Timestamps are displayed in a user-friendly format
- The UI maintains the existing vintage/typewriter theme of the application
