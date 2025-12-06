'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Edit2, Trash2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Comment {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  editHistory?: any
  user: {
    id: string
    firstName?: string
    lastName?: string
    name?: string
  }
  isOwner: boolean
}

interface CommentSectionProps {
  postId: string
  initialCount: number
}

export function CommentSection({ postId, initialCount }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentCount, setCommentCount] = useState(initialCount)

  useEffect(() => {
    if (showComments) {
      fetchComments()
    }
  }, [showComments])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments)
        setCommentCount(data.comments.length)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
      toast.error('Failed to load comments')
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || loading) return

    setLoading(true)
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      })

      if (!response.ok) {
        throw new Error('Failed to add comment')
      }

      const data = await response.json()
      setComments([...comments, data.comment])
      setCommentCount(commentCount + 1)
      setNewComment('')
      toast.success('Comment added successfully')
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Failed to add comment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim() || loading) return

    setLoading(true)
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent })
      })

      if (!response.ok) {
        throw new Error('Failed to edit comment')
      }

      const data = await response.json()
      setComments(
        comments.map((c) => (c.id === commentId ? data.comment : c))
      )
      setEditingId(null)
      setEditContent('')
      toast.success('Comment updated successfully')
    } catch (error) {
      console.error('Error editing comment:', error)
      toast.error('Failed to update comment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete comment')
      }

      setComments(comments.filter((c) => c.id !== commentId))
      setCommentCount(commentCount - 1)
      setDeleteDialogOpen(false)
      setDeletingId(null)
      toast.success('Comment deleted successfully')
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('Failed to delete comment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  const openDeleteDialog = (commentId: string) => {
    setDeletingId(commentId)
    setDeleteDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  const getUserDisplayName = (user: Comment['user']) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    return user.name || 'Anonymous'
  }

  return (
    <div className="mt-4">
      <Button
        variant="ghost"
        size="sm"
        className="text-forest hover:text-rust"
        onClick={() => setShowComments(!showComments)}
      >
        <MessageCircle className="w-4 h-4 mr-1" />
        <span className="font-typewriter">{commentCount}</span>
      </Button>

      {showComments && (
        <div className="mt-4 space-y-4">
          {/* Comment Form */}
          <Card className="card-vintage border-2">
            <CardContent className="pt-4">
              <Textarea
                placeholder="Share your thoughts..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="font-serif border-2 border-ink focus:border-rust min-h-[80px] resize-none"
                disabled={loading}
              />
              <div className="flex justify-end mt-2">
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || loading}
                  className="btn-vintage"
                  size="sm"
                >
                  <Send className="w-4 h-4 mr-1" />
                  Post Comment
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comments List */}
          <div className="space-y-3">
            {comments.length === 0 ? (
              <p className="text-center font-serif text-forest py-8">
                No comments yet. Be the first to share your thoughts!
              </p>
            ) : (
              comments.map((comment) => (
                <Card key={comment.id} className="card-vintage border">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-typewriter font-semibold text-ink">
                          {getUserDisplayName(comment.user)}
                        </p>
                        <p className="text-xs font-serif text-forest">
                          {formatDate(comment.createdAt)}
                          {comment.updatedAt !== comment.createdAt && (
                            <span className="ml-1 italic">(edited)</span>
                          )}
                        </p>
                      </div>
                      {comment.isOwner && !editingId && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(comment)}
                            className="h-8 px-2 text-forest hover:text-rust"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(comment.id)}
                            className="h-8 px-2 text-forest hover:text-rust"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {editingId === comment.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="font-serif border-2 border-ink focus:border-rust min-h-[80px] resize-none"
                          disabled={loading}
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={cancelEdit}
                            disabled={loading}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleEditComment(comment.id)}
                            disabled={!editContent.trim() || loading}
                            className="btn-vintage"
                            size="sm"
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="font-serif text-forest leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-typewriter">
              Delete Comment
            </AlertDialogTitle>
            <AlertDialogDescription className="font-serif">
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading} className="font-typewriter">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDeleteComment(deletingId)}
              disabled={loading}
              className="btn-vintage"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
