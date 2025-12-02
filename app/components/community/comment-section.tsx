
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { MessageCircle, Edit2, Trash2, X, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

interface Comment {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  userId: string
  user: {
    id: string
    firstName?: string
    lastName?: string
    name?: string
  }
}

interface CommentSectionProps {
  submissionId: string
  initialCommentCount?: number
}

export function CommentSection({ submissionId, initialCommentCount = 0 }: CommentSectionProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  useEffect(() => {
    if (showComments) {
      fetchComments()
    }
  }, [showComments, submissionId])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/submissions/${submissionId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || loading) return

    setLoading(true)
    try {
      const response = await fetch(`/api/submissions/${submissionId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newComment })
      })

      if (response.ok) {
        const data = await response.json()
        setComments([data.comment, ...comments])
        setNewComment('')
        toast.success('Comment added!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add comment')
      }
    } catch (error) {
      console.error('Error creating comment:', error)
      toast.error('Failed to add comment')
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
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: editContent })
      })

      if (response.ok) {
        const data = await response.json()
        setComments(comments.map(c => c.id === commentId ? data.comment : c))
        setEditingCommentId(null)
        setEditContent('')
        toast.success('Comment updated!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update comment')
      }
    } catch (error) {
      console.error('Error updating comment:', error)
      toast.error('Failed to update comment')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setComments(comments.filter(c => c.id !== commentId))
        toast.success('Comment deleted!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete comment')
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('Failed to delete comment')
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (comment: Comment) => {
    setEditingCommentId(comment.id)
    setEditContent(comment.content)
  }

  const cancelEditing = () => {
    setEditingCommentId(null)
    setEditContent('')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getUserDisplayName = (user: Comment['user']) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    return user.name || 'Anonymous'
  }

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="text-forest hover:text-rust"
        onClick={() => setShowComments(!showComments)}
      >
        <MessageCircle className="w-4 h-4 mr-1" />
        {comments.length > 0 ? `${comments.length} Comment${comments.length !== 1 ? 's' : ''}` : 'Comment'}
      </Button>

      {showComments && (
        <div className="mt-4 space-y-4">
          {/* Comment Input Form */}
          <form onSubmit={handleSubmitComment} className="space-y-2">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="font-serif border-2 border-ink focus:border-rust resize-none"
              rows={3}
              disabled={loading}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                className="btn-vintage"
                disabled={loading || !newComment.trim()}
              >
                {loading ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-3">
            {comments.length === 0 ? (
              <p className="font-serif text-forest text-center py-4">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              comments.map((comment) => (
                <Card key={comment.id} className="border-2 border-sepia">
                  <CardContent className="p-4">
                    {editingCommentId === comment.id ? (
                      /* Edit Mode */
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="font-serif border-2 border-ink focus:border-rust resize-none"
                          rows={3}
                          disabled={loading}
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditing}
                            disabled={loading}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="btn-vintage"
                            onClick={() => handleEditComment(comment.id)}
                            disabled={loading || !editContent.trim()}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* View Mode */
                      <>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-typewriter font-semibold text-ink text-sm">
                              {getUserDisplayName(comment.user)}
                            </p>
                            <p className="font-serif text-forest text-xs">
                              {formatDate(comment.createdAt)}
                              {comment.updatedAt !== comment.createdAt && ' (edited)'}
                            </p>
                          </div>
                          {session?.user?.id === comment.userId && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => startEditing(comment)}
                                disabled={loading}
                              >
                                <Edit2 className="w-3 h-3 text-forest hover:text-rust" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => handleDeleteComment(comment.id)}
                                disabled={loading}
                              >
                                <Trash2 className="w-3 h-3 text-forest hover:text-rust" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <p className="font-serif text-forest leading-relaxed whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
