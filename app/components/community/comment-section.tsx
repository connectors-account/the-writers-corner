'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Edit2, Trash2, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import toast from 'react-hot-toast'
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
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  useEffect(() => {
    if (showComments) {
      fetchComments()
    }
  }, [postId, showComments])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
      toast.error('Failed to load comments')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error('Please enter a comment')
      return
    }

    if (newComment.trim().length > 2000) {
      toast.error('Comment is too long (max 2000 characters)')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newComment.trim() })
      })

      if (response.ok) {
        const data = await response.json()
        setComments([...comments, data.comment])
        setNewComment('')
        toast.success('Comment added!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add comment')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Failed to add comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) {
      toast.error('Please enter comment content')
      return
    }

    if (editContent.trim().length > 2000) {
      toast.error('Comment is too long (max 2000 characters)')
      return
    }

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: editContent.trim() })
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
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return
    }

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
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
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
    <div className="space-y-4">
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-forest hover:text-rust"
        onClick={() => setShowComments(!showComments)}
      >
        <MessageCircle className="w-4 h-4 mr-1" />
        {comments.length > 0 ? `${comments.length} ${comments.length === 1 ? 'Comment' : 'Comments'}` : 'Comment'}
      </Button>

      {showComments && (
        <div className="space-y-4 pl-4">
          {/* Comment Form */}
          <Card className="p-4 border-2 border-ink">
            <Textarea
              placeholder="Share your thoughts..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="font-serif border-2 border-ink focus:border-rust mb-2 resize-none"
              rows={3}
              maxLength={2000}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs font-serif text-forest">
                {newComment.length}/2000
              </span>
              <Button
                onClick={handleAddComment}
                disabled={isSubmitting || !newComment.trim()}
                size="sm"
                className="btn-vintage"
              >
                <Send className="w-4 h-4 mr-1" />
                Post Comment
              </Button>
            </div>
          </Card>

          {/* Comments List */}
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-pulse">
                <div className="h-4 bg-sepia rounded w-1/2 mx-auto"></div>
              </div>
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center font-serif text-forest py-4">
              No comments yet. Be the first to share your thoughts!
            </p>
          ) : (
            <div className="space-y-3">
              {comments.map(comment => (
                <Card key={comment.id} className="p-4 border border-ink">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-typewriter font-semibold text-ink text-sm">
                        {getUserDisplayName(comment.user)}
                      </span>
                      <span className="text-xs font-serif text-forest ml-2">
                        {formatDate(comment.createdAt)}
                        {comment.updatedAt !== comment.createdAt && ' (edited)'}
                      </span>
                    </div>
                    {session?.user?.id === comment.user.id && (
                      <div className="flex gap-1">
                        {editingCommentId !== comment.id && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing(comment)}
                              className="h-6 w-6 p-0 text-forest hover:text-rust"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteComment(comment.id)}
                              className="h-6 w-6 p-0 text-forest hover:text-rust"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {editingCommentId === comment.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="font-serif border-2 border-ink focus:border-rust resize-none"
                        rows={3}
                        maxLength={2000}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-serif text-forest">
                          {editContent.length}/2000
                        </span>
                        <div className="flex gap-2">
                          <Button
                            onClick={cancelEditing}
                            variant="outline"
                            size="sm"
                            className="h-7"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleEditComment(comment.id)}
                            disabled={!editContent.trim()}
                            size="sm"
                            className="btn-vintage h-7"
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="font-serif text-forest leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
