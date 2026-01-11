'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Edit2, Trash2, Send } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'

interface Comment {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    firstName?: string
    lastName?: string
    name?: string
  }
}

interface CommentsSectionProps {
  postId: string
  onCommentsUpdate: (count: number) => void
}

export function CommentsSection({ postId, onCommentsUpdate }: CommentsSectionProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  useEffect(() => {
    fetchComments()
  }, [postId])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
        onCommentsUpdate(data.comments?.length || 0)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newComment })
      })

      if (response.ok) {
        const data = await response.json()
        setComments([...comments, data.comment])
        setNewComment('')
        onCommentsUpdate(comments.length + 1)
        toast.success('Comment added!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add comment')
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
      toast.error('Failed to add comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return

    try {
      const response = await fetch(`/api/community/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: editContent })
      })

      if (response.ok) {
        const data = await response.json()
        setComments(comments.map(c => c.id === commentId ? data.comment : c))
        setEditingId(null)
        setEditContent('')
        toast.success('Comment updated!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update comment')
      }
    } catch (error) {
      console.error('Error updating comment:', error)
      toast.error('Failed to update comment')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      const response = await fetch(`/api/community/comments/${commentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setComments(comments.filter(c => c.id !== commentId))
        onCommentsUpdate(comments.length - 1)
        toast.success('Comment deleted!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete comment')
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('Failed to delete comment')
    }
  }

  const startEditing = (comment: Comment) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditContent('')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  if (loading) {
    return (
      <div className="text-center py-4">
        <p className="font-serif text-forest text-sm">Loading comments...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Comment Form */}
      <form onSubmit={handleSubmitComment} className="space-y-2">
        <Textarea
          placeholder="Share your thoughts..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="font-serif border-2 border-ink/20 focus:border-rust min-h-[80px] resize-none"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            className="btn-vintage"
            disabled={isSubmitting || !newComment.trim()}
          >
            <Send className="w-3 h-3 mr-1" />
            Post Comment
          </Button>
        </div>
      </form>

      {/* Comments List */}
      {comments.length === 0 ? (
        <p className="text-center py-4 font-serif text-forest text-sm">
          No comments yet. Be the first to share your thoughts!
        </p>
      ) : (
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="p-4 bg-parchment/50 rounded border-2 border-ink/10"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-rust/20 text-rust font-typewriter text-xs">
                    {comment.user.firstName && comment.user.lastName
                      ? `${comment.user.firstName} ${comment.user.lastName}`
                      : comment.user.name || 'Anonymous'}
                  </Badge>
                  <span className="text-xs font-serif text-forest">
                    {formatDate(comment.createdAt)}
                    {comment.updatedAt !== comment.createdAt && ' (edited)'}
                  </span>
                </div>

                {session?.user?.id === comment.user.id && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-forest hover:text-ink"
                      onClick={() => startEditing(comment)}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-forest hover:text-rust"
                      onClick={() => handleDeleteComment(comment.id)}
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
                    className="font-serif border-2 border-ink/20 focus:border-rust min-h-[60px] resize-none text-sm"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={cancelEditing}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="btn-vintage text-xs"
                      onClick={() => handleEditComment(comment.id)}
                      disabled={!editContent.trim()}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="font-serif text-forest text-sm leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
