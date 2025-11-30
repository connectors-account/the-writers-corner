
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Pencil, Trash2, Send, X, Check } from 'lucide-react'
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
  initialComments?: Comment[]
  onCommentCountChange?: (count: number) => void
}

export function CommentSection({ postId, initialComments = [], onCommentCountChange }: CommentSectionProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [postId])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
        onCommentCountChange?.(data.comments?.length || 0)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newComment })
      })

      if (response.ok) {
        const data = await response.json()
        setComments(prev => [...prev, data.comment])
        setNewComment('')
        onCommentCountChange?.(comments.length + 1)
      } else {
        const error = await response.json()
        console.error('Error creating comment:', error)
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim() || isSubmitting) return

    setIsSubmitting(true)
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
        setComments(prev =>
          prev.map(comment =>
            comment.id === commentId ? data.comment : comment
          )
        )
        setEditingId(null)
        setEditContent('')
      }
    } catch (error) {
      console.error('Error editing comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setComments(prev => prev.filter(comment => comment.id !== commentId))
        onCommentCountChange?.(comments.length - 1)
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
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
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getInitials = (user: Comment['user']) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    }
    if (user.name) {
      const names = user.name.split(' ')
      return names.length > 1 
        ? `${names[0][0]}${names[1][0]}`.toUpperCase()
        : names[0][0].toUpperCase()
    }
    return 'U'
  }

  const getUserName = (user: Comment['user']) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    return user.name || 'Anonymous'
  }

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-lg font-typewriter font-bold text-ink">
        Comments ({comments.length})
      </h3>

      {/* Comment Input */}
      {session && (
        <Card className="p-4 border-2 border-ink">
          <Textarea
            placeholder="Share your thoughts..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="font-serif border-2 border-ink focus:border-rust mb-2"
            rows={3}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
              className="btn-vintage"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </Card>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-center font-serif text-forest py-8">
            No comments yet. Be the first to share your thoughts!
          </p>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="p-4 border-2 border-ink">
              <div className="flex gap-3">
                <Avatar className="w-10 h-10 border-2 border-ink">
                  <AvatarFallback className="bg-sepia text-ink font-typewriter">
                    {getInitials(comment.user)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-typewriter font-semibold text-ink">
                        {getUserName(comment.user)}
                      </span>
                      <span className="text-sm font-serif text-forest ml-2">
                        {formatDate(comment.createdAt)}
                        {comment.updatedAt !== comment.createdAt && ' (edited)'}
                      </span>
                    </div>

                    {session?.user?.id === comment.user.id && (
                      <div className="flex gap-2">
                        {editingId !== comment.id && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing(comment)}
                              className="text-forest hover:text-rust"
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-forest hover:text-rust"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {editingId === comment.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="font-serif border-2 border-ink focus:border-rust"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleEditComment(comment.id)}
                          disabled={!editContent.trim() || isSubmitting}
                          className="btn-vintage text-xs"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEditing}
                          className="text-xs"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="font-serif text-forest leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
