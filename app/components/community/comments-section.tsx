
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Edit2, Trash2, Send } from 'lucide-react'
import { toast } from 'sonner'

interface Comment {
  id: string
  content: string
  userId: string
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
  onCommentChange: (delta: number) => void
}

export function CommentsSection({ postId, onCommentChange }: CommentsSectionProps) {
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
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    setSubmitting(true)
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
        setComments(prev => [data.comment, ...prev])
        setNewComment('')
        onCommentChange(1)
        toast.success('Comment added successfully')
      } else {
        toast.error('Failed to add comment')
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
      toast.error('Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/community/posts/${postId}/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: editContent })
      })

      if (response.ok) {
        const data = await response.json()
        setComments(prev => 
          prev.map(c => c.id === commentId ? data.comment : c)
        )
        setEditingId(null)
        setEditContent('')
        toast.success('Comment updated successfully')
      } else {
        toast.error('Failed to update comment')
      }
    } catch (error) {
      console.error('Error editing comment:', error)
      toast.error('Failed to update comment')
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
        onCommentChange(-1)
        toast.success('Comment deleted successfully')
      } else {
        toast.error('Failed to delete comment')
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('Failed to delete comment')
    }
  }

  const getUserName = (user: Comment['user']) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    return user.name || 'Anonymous Writer'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  if (loading) {
    return (
      <div className="text-center py-4">
        <p className="text-sm font-serif text-forest">Loading comments...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Comment Input */}
      <div className="space-y-2">
        <label className="font-typewriter text-ink text-sm">Add a comment:</label>
        <div className="flex gap-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            className="font-serif border-2 border-ink focus:border-rust min-h-[80px]"
            disabled={submitting}
          />
        </div>
        <Button
          onClick={handleSubmitComment}
          disabled={submitting || !newComment.trim()}
          className="btn-vintage"
          size="sm"
        >
          <Send className="w-4 h-4 mr-1" />
          Post Comment
        </Button>
      </div>

      {/* Comments List */}
      {comments.length === 0 ? (
        <p className="text-center text-sm font-serif text-forest py-4">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map(comment => (
            <div key={comment.id} className="bg-sepia/30 p-3 rounded-sm border border-ink/20">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-rust/20 text-rust font-typewriter text-xs">
                    {getUserName(comment.user)}
                  </Badge>
                  <span className="text-xs font-serif text-forest">
                    {formatDate(comment.createdAt)}
                    {comment.createdAt !== comment.updatedAt && ' (edited)'}
                  </span>
                </div>
                
                {session?.user?.id === comment.userId && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingId(comment.id)
                        setEditContent(comment.content)
                      }}
                      className="h-6 px-2 text-forest hover:text-rust"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteComment(comment.id)}
                      className="h-6 px-2 text-forest hover:text-rust"
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
                    className="font-serif border-2 border-ink focus:border-rust min-h-[60px]"
                    disabled={submitting}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEditComment(comment.id)}
                      disabled={submitting || !editContent.trim()}
                      className="btn-vintage"
                      size="sm"
                    >
                      Save
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingId(null)
                        setEditContent('')
                      }}
                      variant="outline"
                      size="sm"
                      className="border-2 border-ink"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="font-serif text-ink text-sm leading-relaxed whitespace-pre-wrap">
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
