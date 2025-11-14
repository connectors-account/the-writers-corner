# Migration Guide: Like and Comment Functionality

## Overview
This update adds like and comment functionality to community posts in The Writer's Corner application.

## Database Changes

### New Models Added
1. **PostLike** - Tracks user likes on posts
   - Unique constraint: one like per user per post
   - Cascading deletes when user or post is deleted

2. **PostComment** - Stores user comments on posts
   - Supports editing and deletion by comment owner
   - Timestamps for creation and updates
   - Cascading deletes when user or post is deleted

## Setup Instructions

### 1. Install Dependencies (if not already installed)
```bash
cd app
npm install
# or
yarn install
```

### 2. Generate Prisma Migration
```bash
cd app
npx prisma migrate dev --name add-likes-and-comments
```

This will:
- Create the new database tables (PostLike and PostComment)
- Update the Prisma Client with the new models
- Add foreign key constraints

### 3. Generate Prisma Client (if needed)
```bash
cd app
npx prisma generate
```

### 4. Start Development Server
```bash
cd app
npm run dev
```

## Features Implemented

### Like Functionality
- ✅ Toggle like/unlike on posts
- ✅ Display like count on each post
- ✅ Visual indication when user has liked a post (filled heart icon)
- ✅ Prevent duplicate likes (unique constraint)
- ✅ Real-time UI updates

### Comment Functionality
- ✅ Add comments to posts
- ✅ Display comments in chronological order (newest first)
- ✅ Edit own comments
- ✅ Delete own comments
- ✅ Show commenter name and timestamp
- ✅ Relative time display (e.g., "2h ago", "just now")
- ✅ Expandable comment section per post

### UI Updates
- ✅ Like button with heart icon and count
- ✅ Comment button with message icon and count
- ✅ Comments section with input form
- ✅ Edit/delete buttons for own comments
- ✅ Toast notifications for user actions
- ✅ Loading states and error handling
- ✅ Responsive design matching existing UI theme

### API Endpoints Added
1. `POST /api/community/posts/[id]/like` - Toggle like on a post
2. `GET /api/community/posts/[id]/like` - Get like status and count
3. `GET /api/community/posts/[id]/comments` - Get comments for a post
4. `POST /api/community/posts/[id]/comments` - Create a new comment
5. `PATCH /api/community/posts/[id]/comments/[commentId]` - Edit a comment
6. `DELETE /api/community/posts/[id]/comments/[commentId]` - Delete a comment

## Testing Checklist

### Like Features
- [ ] Like a post (verify heart fills and count increases)
- [ ] Unlike a post (verify heart empties and count decreases)
- [ ] Like count persists across page refreshes
- [ ] Cannot like a post multiple times
- [ ] Unauthenticated users cannot like posts

### Comment Features
- [ ] Add a comment to a post
- [ ] Comments appear in correct order (newest first)
- [ ] Edit own comment
- [ ] Delete own comment with confirmation
- [ ] Cannot edit/delete other users' comments
- [ ] Comment count updates correctly
- [ ] Timestamps display correctly
- [ ] Unauthenticated users cannot comment

### UI/UX
- [ ] Like/comment buttons respond quickly
- [ ] Toast notifications appear for all actions
- [ ] Loading states show during API calls
- [ ] Error messages display when actions fail
- [ ] Design matches existing vintage theme
- [ ] Responsive on mobile devices

## File Changes

### Modified Files
- `app/prisma/schema.prisma` - Added PostLike and PostComment models
- `app/app/api/community/posts/route.ts` - Include like/comment counts in posts
- `app/components/community/community-overview.tsx` - Added like/comment UI
- `app/components/providers.tsx` - Added Sonner toast provider

### New Files
- `app/app/api/community/posts/[id]/like/route.ts` - Like API endpoint
- `app/app/api/community/posts/[id]/comments/route.ts` - Comments list/create API
- `app/app/api/community/posts/[id]/comments/[commentId]/route.ts` - Edit/delete comment API
- `app/components/community/comments-section.tsx` - Comments UI component

## Notes

- All features require user authentication
- Database migrations must be applied before testing
- Existing posts will have 0 likes and 0 comments initially
- Comments support multi-line text with preserved formatting
- Like/comment counts are calculated in real-time from the database

## Troubleshooting

### "Table does not exist" error
Run the Prisma migration:
```bash
cd app
npx prisma migrate dev
```

### TypeScript errors
Regenerate Prisma Client:
```bash
cd app
npx prisma generate
```

### UI not updating
- Clear browser cache
- Check browser console for errors
- Verify API endpoints are responding correctly

## Future Enhancements (Not Implemented)
- Reply to comments (nested comments)
- Like comments
- Sort comments by different criteria
- Pagination for large comment lists
- Rich text formatting in comments
- Notifications for likes/comments
