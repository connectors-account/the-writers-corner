'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Edit2, Trash2, Send, X } from 'lucide-react'
import { useSession } from 'next-auth/react'

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

interface CommentSectionProps {
  postId: string
  onCommentCountChange: (count: number) => void
}

export function CommentSection({ postId, onCommentCountChange }: CommentSectionProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [postId])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
        onCommentCountChange(data.comments?.length || 0)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim() || submitting) return
    setSubmitting(true)
    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() })
      })
      if (response.ok) {
        const data = await response.json()
        setComments(prev => [...prev, data.comment])
        onCommentCountChange(comments.length + 1)
        setNewComment('')
      }
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim() || submitting) return
    setSubmitting(true)
    try {
      const response = await fetch(`/api/community/posts/${postId}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() })
      })
      if (response.ok) {
        const data = await response.json()
        setComments(prev => prev.map(c => c.id === commentId ? data.comment : c))
        setEditingId(null)
        setEditContent('')
      }
    } catch (error) {
      console.error('Error editing comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return
    try {
      const response = await fetch(`/api/community/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId))
        onCommentCountChange(comments.length - 1)
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getUserName = (user: Comment['user']) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    return user.name || 'Anonymous'
  }

  if (loading) {
    return <div className="text-center py-4 font-serif text-forest">Loading comments...</div>
  }

  return (
    <div className="mt-4 pt-4 border-t-2 border-sepia">
      <h4 className="font-typewriter font-bold text-ink mb-4">Comments</h4>
      
      {/* New Comment Form */}
      <div className="mb-6">
        <Textarea
          placeholder="Share your thoughts..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="font-serif border-2 border-ink focus:border-rust mb-2 resize-none"
          rows={3}
        />
        <Button
          onClick={handleSubmitComment}
          disabled={!newComment.trim() || submitting}
          className="btn-vintage"
          size="sm"
        >
          <Send className="w-4 h-4 mr-2" />
          {submitting ? 'Posting...' : 'Post Comment'}
        </Button>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="font-serif text-forest text-center py-4">
            No comments yet. Be the first to share your thoughts!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-sepia/30 rounded-sm p-4 border border-ink">
              {editingId === comment.id ? (
                <div>
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="font-serif border-2 border-ink focus:border-rust mb-2 resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEditComment(comment.id)}
                      disabled={!editContent.trim() || submitting}
                      size="sm"
                      className="btn-vintage"
                    >
                      Save
                    </Button>
                    <Button
                      onClick={cancelEdit}
                      disabled={submitting}
                      size="sm"
                      variant="outline"
                      className="border-ink"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-typewriter font-semibold text-ink">
                        {getUserName(comment.user)}
                      </span>
                      <span className="font-serif text-sm text-forest ml-2">
                        {formatDate(comment.createdAt)}
                        {comment.createdAt !== comment.updatedAt && ' (edited)'}
                      </span>
                    </div>
                    {session?.user?.id === comment.user.id && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => startEdit(comment)}
                          size="sm"
                          variant="ghost"
                          className="text-forest hover:text-ink"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteComment(comment.id)}
                          size="sm"
                          variant="ghost"
                          className="text-rust hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="font-serif text-forest whitespace-pre-wrap">{comment.content}</p>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
