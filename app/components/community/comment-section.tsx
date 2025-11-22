
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Pencil, Trash2, Send } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface Comment {
  id: string
  text: string
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
  const [newComment, setNewComment] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [loading, setLoading] = useState(true)
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

  const handlePostComment = async () => {
    if (!newComment.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newComment })
      })

      if (response.ok) {
        const data = await response.json()
        setComments([...comments, data.comment])
        setNewComment('')
        onCommentCountChange(comments.length + 1)
      }
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editText.trim()) return

    try {
      const response = await fetch(`/api/community/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editText })
      })

      if (response.ok) {
        const data = await response.json()
        setComments(comments.map(c => c.id === commentId ? data.comment : c))
        setEditingCommentId(null)
        setEditText('')
      }
    } catch (error) {
      console.error('Error editing comment:', error)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      const response = await fetch(`/api/community/comments/${commentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const newComments = comments.filter(c => c.id !== commentId)
        setComments(newComments)
        onCommentCountChange(newComments.length)
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const getUserDisplayName = (user: Comment['user']) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    return user.name || 'Anonymous'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  if (loading) {
    return (
      <div className="mt-4 p-4 bg-sepia/30 rounded-sm border border-ink/20">
        <p className="font-serif text-forest text-sm">Loading comments...</p>
      </div>
    )
  }

  return (
    <div className="mt-4 p-4 bg-sepia/30 rounded-sm border border-ink/20">
      <h4 className="font-typewriter font-bold text-ink mb-4">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h4>

      {/* Comment Form */}
      <div className="mb-4">
        <Textarea
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="font-serif border-2 border-ink/30 focus:border-rust min-h-[80px] mb-2"
        />
        <div className="flex justify-end">
          <Button
            onClick={handlePostComment}
            disabled={!newComment.trim() || submitting}
            className="btn-vintage"
            size="sm"
          >
            <Send className="w-4 h-4 mr-1" />
            {submitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </div>

      {/* Comments List */}
      {comments.length === 0 ? (
        <p className="font-serif text-forest text-sm text-center py-4">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <Card key={comment.id} className="border border-ink/20 bg-parchment/50">
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-typewriter font-semibold text-ink text-sm">
                      {getUserDisplayName(comment.user)}
                    </span>
                    <span className="font-serif text-forest text-xs">
                      {formatDate(comment.createdAt)}
                      {comment.updatedAt !== comment.createdAt && ' (edited)'}
                    </span>
                  </div>
                  
                  {session?.user?.id === comment.user.id && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-forest hover:text-rust"
                        onClick={() => {
                          setEditingCommentId(comment.id)
                          setEditText(comment.text)
                        }}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-forest hover:text-rust"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {editingCommentId === comment.id ? (
                  <div>
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="font-serif border-2 border-ink/30 focus:border-rust min-h-[60px] mb-2"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingCommentId(null)
                          setEditText('')
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="btn-vintage"
                        onClick={() => handleEditComment(comment.id)}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="font-serif text-forest text-sm whitespace-pre-wrap">
                    {comment.text}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
