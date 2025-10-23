
'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Send, Edit, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
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
  submissionId: string
  initialCount: number
}

export function CommentSection({ submissionId, initialCount }: CommentSectionProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [commentCount, setCommentCount] = useState(initialCount)

  useEffect(() => {
    if (showComments && comments.length === 0) {
      fetchComments()
    }
  }, [showComments])

  const fetchComments = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/comments?submissionId=${submissionId}`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
        setCommentCount(data.comments?.length || 0)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
      toast.error('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error('Please enter a comment')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          submissionId,
          content: newComment
        })
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
      setSubmitting(false)
    }
  }

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) {
      toast.error('Please enter a comment')
      return
    }

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: editContent })
      })

      if (!response.ok) {
        throw new Error('Failed to update comment')
      }

      const data = await response.json()
      setComments(comments.map(c => c.id === commentId ? data.comment : c))
      setEditingId(null)
      setEditContent('')
      toast.success('Comment updated successfully')
    } catch (error) {
      console.error('Error updating comment:', error)
      toast.error('Failed to update comment. Please try again.')
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

      if (!response.ok) {
        throw new Error('Failed to delete comment')
      }

      setComments(comments.filter(c => c.id !== commentId))
      setCommentCount(commentCount - 1)
      toast.success('Comment deleted successfully')
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('Failed to delete comment. Please try again.')
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

  return (
    <div>
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-forest hover:text-rust"
        onClick={() => setShowComments(!showComments)}
      >
        <MessageCircle className="w-4 h-4 mr-1" />
        {commentCount > 0 && <span className="ml-1">{commentCount}</span>}
        <span className="ml-1">{showComments ? 'Hide Comments' : 'Comment'}</span>
      </Button>

      {showComments && (
        <div className="mt-4 space-y-4">
          {/* Add Comment Form */}
          <Card className="border-2 border-ink/20">
            <CardContent className="pt-4">
              <Textarea
                placeholder="Share your thoughts..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="font-serif border-2 border-ink focus:border-rust min-h-[100px]"
              />
              <div className="flex justify-end mt-2">
                <Button
                  onClick={handleAddComment}
                  disabled={submitting || !newComment.trim()}
                  className="btn-vintage"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Post Comment
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comments List */}
          {loading ? (
            <div className="text-center py-4">
              <p className="font-serif text-forest">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-4">
              <p className="font-serif text-forest">
                No comments yet. Be the first to share your thoughts!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <Card key={comment.id} className="border-2 border-ink/20">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-rust/20 text-rust font-typewriter text-xs">
                          {getUserName(comment.user)}
                        </Badge>
                        <span className="text-xs font-serif text-forest">
                          {formatDate(comment.createdAt)}
                          {comment.updatedAt !== comment.createdAt && ' (edited)'}
                        </span>
                      </div>
                      {session?.user?.id === comment.user.id && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-forest hover:text-rust"
                            onClick={() => startEditing(comment)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-forest hover:text-rust"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {editingId === comment.id ? (
                      <div>
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="font-serif border-2 border-ink focus:border-rust mb-2"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={cancelEditing}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateComment(comment.id)}
                            disabled={!editContent.trim()}
                            className="btn-vintage"
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
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
