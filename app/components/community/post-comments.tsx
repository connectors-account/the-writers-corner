
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Trash2, Send } from 'lucide-react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    firstName?: string
    lastName?: string
    name?: string
  }
}

interface PostCommentsProps {
  postId: string
  isOpen: boolean
  onClose: () => void
}

export function PostComments({ postId, isOpen, onClose }: PostCommentsProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchComments()
    }
  }, [isOpen, postId])

  const fetchComments = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
      toast.error('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newComment.trim()) {
      toast.error('Please enter a comment')
      return
    }

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
        setComments([data.comment, ...comments])
        setNewComment('')
        toast.success('Comment added!')
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

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return
    }

    try {
      const response = await fetch(
        `/api/community/posts/${postId}/comments/${commentId}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        setComments(comments.filter(c => c.id !== commentId))
        toast.success('Comment deleted')
      } else {
        toast.error('Failed to delete comment')
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('Failed to delete comment')
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

  if (!isOpen) return null

  return (
    <div className="mt-4 space-y-4">
      {/* Comment Form */}
      <form onSubmit={handleSubmitComment} className="space-y-2">
        <Textarea
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="font-serif border-2 border-ink focus:border-rust resize-none"
          rows={3}
          disabled={submitting}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="btn-vintage"
            size="sm"
          >
            <Send className="w-4 h-4 mr-2" />
            {submitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-4">
          <p className="font-serif text-forest">Loading comments...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <p className="font-serif text-forest">
            No comments yet. Be the first to share your thoughts!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <Card key={comment.id} className="p-4 border-2 border-sepia">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-typewriter text-ink font-semibold text-sm">
                      {getUserDisplayName(comment.user)}
                    </span>
                    <span className="text-xs font-serif text-forest">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="font-serif text-forest whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
                {session?.user?.id === comment.user.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-rust hover:text-rust/80 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
