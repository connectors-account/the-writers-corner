# Like and Comment Functionality Implementation

## Overview
This implementation adds comprehensive like and comment functionality to community posts in The Writer's Corner application.

## Database Schema Changes

### New Models Added

#### Like Model
```prisma
model Like {
  id           String             @id @default(cuid())
  userId       String
  submissionId String
  user         User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  submission   ExerciseSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  createdAt    DateTime           @default(now())

  @@unique([userId, submissionId])
}
```
- Tracks which users liked which submissions
- Unique constraint prevents duplicate likes from the same user
- Cascade delete when user or submission is deleted

#### Comment Model
```prisma
model Comment {
  id           String             @id @default(cuid())
  text         String             @db.Text
  userId       String
  submissionId String
  user         User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  submission   ExerciseSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt
}
```
- Stores comment text, author, and timestamps
- Auto-updates `updatedAt` on edits
- Cascade delete when user or submission is deleted

### Model Relations Updated
- **User**: Added `likes` and `comments` relations
- **ExerciseSubmission**: Added `likes` and `comments` relations

## Backend API Endpoints

### Like Endpoints

#### GET /api/community/posts/[id]/like
- **Purpose**: Get like count and check if current user has liked the post
- **Authentication**: Required (JWT)
- **Response**:
  ```json
  {
    "likeCount": 5,
    "isLiked": true
  }
  ```

#### POST /api/community/posts/[id]/like
- **Purpose**: Toggle like (like if not liked, unlike if liked)
- **Authentication**: Required (JWT)
- **Response**:
  ```json
  {
    "success": true,
    "isLiked": true,
    "likeCount": 6
  }
  ```

### Comment Endpoints

#### GET /api/community/posts/[id]/comments
- **Purpose**: Fetch all comments for a post
- **Authentication**: Required (JWT)
- **Response**:
  ```json
  {
    "comments": [
      {
        "id": "comment123",
        "text": "Great work!",
        "createdAt": "2024-11-19T10:00:00Z",
        "updatedAt": "2024-11-19T10:00:00Z",
        "user": {
          "id": "user123",
          "firstName": "John",
          "lastName": "Doe",
          "name": "John Doe"
        }
      }
    ]
  }
  ```

#### POST /api/community/posts/[id]/comments
- **Purpose**: Create a new comment
- **Authentication**: Required (JWT)
- **Body**:
  ```json
  {
    "text": "This is a comment"
  }
  ```
- **Validation**: Comment text must not be empty
- **Response**: Returns created comment with user info

#### PATCH /api/community/comments/[id]
- **Purpose**: Update an existing comment
- **Authentication**: Required (JWT)
- **Authorization**: Only comment author can edit
- **Body**:
  ```json
  {
    "text": "Updated comment text"
  }
  ```
- **Response**: Returns updated comment

#### DELETE /api/community/comments/[id]
- **Purpose**: Delete a comment
- **Authentication**: Required (JWT)
- **Authorization**: Only comment author can delete
- **Response**:
  ```json
  {
    "success": true
  }
  ```

### Updated Community Posts Endpoint

The existing `/api/community/posts` endpoint was enhanced to include:
- `likeCount`: Number of likes for each post
- `isLiked`: Boolean indicating if current user liked the post
- `commentCount`: Number of comments on the post

## Frontend Implementation

### Component Updates

#### CommunityOverview Component
**Location**: `app/components/community/community-overview.tsx`

**New Features**:
1. **Like Functionality**
   - Interactive like button with visual feedback
   - Shows like count (or "Like" if 0)
   - Filled heart icon when liked
   - Color changes: gray (not liked) → rust (liked)
   - Optimistic UI updates

2. **Comment Toggle**
   - Comment button shows comment count
   - Toggles comment section visibility
   - Smooth expand/collapse animation

**State Management**:
- `expandedComments`: Set of post IDs with open comment sections
- Real-time updates for like counts and comment counts
- Proper state synchronization after API calls

#### CommentSection Component (New)
**Location**: `app/components/community/comment-section.tsx`

**Features**:
1. **Display Comments**
   - Chronological order (oldest first)
   - Shows author name and timestamp
   - Relative time display (e.g., "2h ago", "3d ago")
   - Edit indicator for modified comments

2. **Post New Comments**
   - Textarea for writing comments
   - Character validation (no empty comments)
   - Submit button with loading state
   - Real-time UI update on success

3. **Edit Comments**
   - Inline editing with textarea
   - Only visible to comment author
   - Cancel/Save buttons
   - Validation on update

4. **Delete Comments**
   - Delete button only for comment author
   - Confirmation dialog
   - Real-time UI update on success

**User Experience**:
- Smooth animations and transitions
- Loading states for all async operations
- Error handling with console logging
- Vintage design matching app theme
- Responsive layout

## Authentication & Authorization

### Authentication Requirements
- All endpoints require valid JWT session
- Unauthenticated requests return 401 Unauthorized
- User ID extracted from session token

### Authorization Rules
1. **Likes**
   - Any authenticated user can like any public post
   - Users can toggle their own likes

2. **Comments - Create**
   - Any authenticated user can comment on public posts

3. **Comments - Edit**
   - Only comment author can edit their comments
   - Non-authors receive 403 Forbidden

4. **Comments - Delete**
   - Only comment author can delete their comments
   - Non-authors receive 403 Forbidden

## Testing Checklist

### Like Functionality
- [ ] User can like a post
- [ ] Like count increments
- [ ] Heart icon fills and turns rust
- [ ] User can unlike a post
- [ ] Like count decrements
- [ ] Heart icon unfills and turns gray
- [ ] Like state persists on page refresh
- [ ] Unauthenticated users cannot like

### Comment Functionality
- [ ] User can view comments
- [ ] User can post new comment
- [ ] Comment appears immediately in UI
- [ ] Comment count updates
- [ ] User can edit their own comment
- [ ] User cannot edit others' comments
- [ ] User can delete their own comment
- [ ] User cannot delete others' comments
- [ ] Confirmation dialog shows before delete
- [ ] Comments show correct timestamps
- [ ] Edit indicator shows for edited comments

### General
- [ ] All API endpoints require authentication
- [ ] Proper error handling for network failures
- [ ] Loading states show during operations
- [ ] UI updates are smooth and responsive
- [ ] No TypeScript errors
- [ ] No console errors in browser

## Design Consistency
- Uses existing vintage/parchment theme
- Matches color scheme (rust, forest, ink, sepia)
- Uses Radix UI components for consistency
- Follows existing typography (typewriter for headings, serif for body)
- Responsive design for mobile/tablet/desktop

## Migration Notes
After pulling these changes, run:
```bash
cd app
npx prisma generate
npx prisma migrate dev --name add_likes_and_comments
```

This will:
1. Generate the updated Prisma client with Like and Comment models
2. Create database migration for new tables
3. Add foreign key constraints
4. Set up cascade delete rules

## Future Enhancements (Optional)
- Nested/threaded comment replies
- Comment reactions/likes
- Rich text formatting for comments
- @mentions in comments
- Comment notifications
- Pagination for large comment threads
- Sort comments (newest/oldest/most liked)
- Comment search/filtering
