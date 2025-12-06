
'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Edit2, Trash2, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useSession } from 'next-auth/react'

interface Comment {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  editHistory: string[]
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
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const { toast } = useToast()
  const { data: session } = useSession()

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
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || isLoading) return

    setIsLoading(true)

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
        setComments([data.comment, ...comments])
        setNewComment('')
        toast({
          title: 'Success',
          description: 'Comment added successfully'
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to add comment. Please try again.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      toast({
        title: 'Error',
        description: 'Failed to add comment. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim() || isLoading) return

    setIsLoading(true)

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
        toast({
          title: 'Success',
          description: 'Comment updated successfully'
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update comment. Please try again.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error updating comment:', error)
      toast({
        title: 'Error',
        description: 'Failed to update comment. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (isLoading) return

    if (!confirm('Are you sure you want to delete this comment?')) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setComments(comments.filter(c => c.id !== commentId))
        toast({
          title: 'Success',
          description: 'Comment deleted successfully'
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete comment. Please try again.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete comment. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
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
    <div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowComments(!showComments)}
        className="text-forest hover:text-rust"
      >
        <MessageCircle className="w-4 h-4 mr-1" />
        <span className="font-typewriter">
          {comments.length > 0 ? `${comments.length} Comment${comments.length !== 1 ? 's' : ''}` : 'Comment'}
        </span>
      </Button>

      {showComments && (
        <div className="mt-4 space-y-4">
          {/* Add Comment Form */}
          <Card className="card-vintage border">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="font-serif border-2 border-ink focus:border-rust resize-none"
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isLoading}
                    className="btn-vintage"
                    size="sm"
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Post Comment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments List */}
          {comments.length === 0 ? (
            <div className="text-center py-8 text-forest font-serif">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 text-forest/50" />
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <Card key={comment.id} className="card-vintage border">
                  <CardContent className="pt-4">
                    {editingCommentId === comment.id ? (
                      // Edit Mode
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="font-serif border-2 border-ink focus:border-rust resize-none"
                          rows={3}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCommentId(null)
                              setEditContent('')
                            }}
                            disabled={isLoading}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleEditComment(comment.id)}
                            disabled={!editContent.trim() || isLoading}
                            className="btn-vintage"
                            size="sm"
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="font-typewriter font-semibold text-ink">
                              {getUserDisplayName(comment.user)}
                            </span>
                            <span className="text-sm font-serif text-forest ml-2">
                              {formatDate(comment.createdAt)}
                              {comment.editHistory.length > 0 && ' (edited)'}
                            </span>
                          </div>
                          {session?.user?.id === comment.user.id && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingCommentId(comment.id)
                                  setEditContent(comment.content)
                                }}
                                className="h-8 w-8 p-0 text-forest hover:text-rust"
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteComment(comment.id)}
                                className="h-8 w-8 p-0 text-forest hover:text-rust"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <p className="font-serif text-forest whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
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
