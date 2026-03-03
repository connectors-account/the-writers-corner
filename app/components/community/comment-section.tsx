'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageCircle, Send, Edit2, Trash2, X, Check, ChevronDown, ChevronUp } from 'lucide-react'
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

interface CommentUser {
  id: string
  firstName?: string
  lastName?: string
  name?: string
}

interface Comment {
  id: string
  content: string
  user: CommentUser
  createdAt: string
  updatedAt: string
  isOwner: boolean
}

interface CommentSectionProps {
  postId: string
  initialCommentCount: number
}

export function CommentSection({ postId, initialCommentCount }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [commentCount, setCommentCount] = useState(initialCommentCount)
  const [isExpanded, setIsExpanded] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null)

  const fetchComments = async () => {
    if (comments.length > 0) return // Already loaded
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments)
        setCommentCount(data.comments.length)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleExpand = () => {
    if (!isExpanded) {
      fetchComments()
    }
    setIsExpanded(!isExpanded)
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() })
      })

      if (response.ok) {
        const data = await response.json()
        setComments(prev => [...prev, data.comment])
        setCommentCount(prev => prev + 1)
        setNewComment('')
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return

    try {
      const response = await fetch(`/api/community/posts/${postId}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() })
      })

      if (response.ok) {
        const data = await response.json()
        setComments(prev =>
          prev.map(c => (c.id === commentId ? data.comment : c))
        )
        setEditingCommentId(null)
        setEditContent('')
      }
    } catch (error) {
      console.error('Error editing comment:', error)
    }
  }

  const handleDeleteComment = async () => {
    if (!deleteCommentId) return

    try {
      const response = await fetch(`/api/community/posts/${postId}/comments/${deleteCommentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setComments(prev => prev.filter(c => c.id !== deleteCommentId))
        setCommentCount(prev => prev - 1)
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    } finally {
      setDeleteCommentId(null)
    }
  }

  const startEdit = (comment: Comment) => {
    setEditingCommentId(comment.id)
    setEditContent(comment.content)
  }

  const cancelEdit = () => {
    setEditingCommentId(null)
    setEditContent('')
  }

  const getUserDisplayName = (user: CommentUser) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    return user.name || 'Anonymous'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="mt-2">
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggleExpand}
        className="text-forest hover:text-rust"
      >
        <MessageCircle className="w-4 h-4 mr-1" />
        {commentCount > 0 ? (
          <>
            {commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}
          </>
        ) : (
          'Comment'
        )}
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 ml-1" />
        ) : (
          <ChevronDown className="w-4 h-4 ml-1" />
        )}
      </Button>

      {/* Comment Section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-4 bg-sepia/30 rounded-sm border border-ink/20">
              {/* Add Comment Form */}
              <div className="mb-4">
                <Textarea
                  placeholder="Share your thoughts..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="font-serif border-2 border-ink/30 focus:border-rust bg-parchment resize-none"
                  rows={2}
                />
                <div className="flex justify-end mt-2">
                  <Button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || isSubmitting}
                    size="sm"
                    className="btn-vintage"
                  >
                    <Send className="w-4 h-4 mr-1" />
                    {isSubmitting ? 'Posting...' : 'Post'}
                  </Button>
                </div>
              </div>

              {/* Comments List */}
              {isLoading ? (
                <div className="text-center py-4">
                  <p className="font-serif text-forest text-sm">Loading comments...</p>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-4">
                  <p className="font-serif text-forest text-sm">No comments yet. Be the first to share your thoughts!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-parchment p-3 rounded-sm border border-ink/10"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-typewriter text-sm font-semibold text-ink">
                            {getUserDisplayName(comment.user)}
                          </span>
                          <span className="text-xs text-forest ml-2">
                            {formatDate(comment.createdAt)}
                            {comment.createdAt !== comment.updatedAt && (
                              <span className="italic ml-1">(edited)</span>
                            )}
                          </span>
                        </div>
                        {comment.isOwner && editingCommentId !== comment.id && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEdit(comment)}
                              className="h-6 w-6 p-0 text-forest hover:text-rust"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteCommentId(comment.id)}
                              className="h-6 w-6 p-0 text-forest hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {editingCommentId === comment.id ? (
                        <div>
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="font-serif border border-ink/30 focus:border-rust bg-parchment resize-none text-sm"
                            rows={2}
                          />
                          <div className="flex justify-end gap-2 mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEdit}
                              className="h-7 text-forest hover:text-ink"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleEditComment(comment.id)}
                              disabled={!editContent.trim()}
                              className="h-7 btn-vintage"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="font-serif text-forest text-sm whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteCommentId} onOpenChange={() => setDeleteCommentId(null)}>
        <AlertDialogContent className="bg-parchment border-2 border-ink">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-typewriter text-ink">
              Delete Comment?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-serif text-forest">
              This action cannot be undone. Your comment will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-typewriter">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteComment}
              className="bg-red-600 hover:bg-red-700 font-typewriter"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
