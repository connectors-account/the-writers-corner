'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { MessageCircle, Send, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Comment {
  id: string
  content: string
  authorName: string
  createdAt: string
}

interface PostCommentsProps {
  postId: string
  initialCount?: number
}

export function PostComments({ postId, initialCount = 0 }: PostCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [commentCount, setCommentCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  
  // Form state
  const [authorName, setAuthorName] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    if (showDialog) {
      fetchComments()
    }
  }, [showDialog, postId])

  const fetchComments = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments)
        setCommentCount(data.comments.length)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
      toast.error('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!authorName.trim() || !content.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          authorName: authorName.trim(),
          content: content.trim()
        })
      })

      if (response.ok) {
        const data = await response.json()
        setComments([data.comment, ...comments])
        setCommentCount(commentCount + 1)
        setContent('')
        setAuthorName('')
        toast.success('Comment added successfully!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add comment')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInMinutes = Math.floor(diffInMs / 60000)
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-forest hover:text-rust"
        >
          <MessageCircle className="w-4 h-4 mr-1" />
          {commentCount > 0 ? commentCount : 'Comment'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto card-vintage">
        <DialogHeader>
          <DialogTitle className="font-typewriter text-ink text-2xl">
            Comments ({commentCount})
          </DialogTitle>
          <DialogDescription className="font-serif text-forest">
            Share your thoughts and feedback with the writer
          </DialogDescription>
        </DialogHeader>

        {/* Add Comment Form */}
        <form onSubmit={handleSubmit} className="space-y-4 border-b-2 border-sepia pb-6">
          <div>
            <label className="font-typewriter text-ink text-sm block mb-2">
              Your Name
            </label>
            <Input
              placeholder="Enter your name"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="font-serif border-2 border-ink focus:border-rust"
              required
            />
          </div>
          <div>
            <label className="font-typewriter text-ink text-sm block mb-2">
              Comment
            </label>
            <Textarea
              placeholder="Share your thoughts..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="font-serif border-2 border-ink focus:border-rust min-h-[100px]"
              required
            />
          </div>
          <Button 
            type="submit" 
            disabled={submitting}
            className="btn-vintage w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            {submitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </form>

        {/* Comments List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-pulse font-serif text-forest">
                Loading comments...
              </div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-forest mx-auto mb-3 opacity-50" />
              <p className="font-serif text-forest">
                No comments yet. Be the first to share your thoughts!
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <Card 
                key={comment.id} 
                className="p-4 border-2 border-sepia bg-parchment/50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="font-typewriter text-ink font-semibold">
                    {comment.authorName}
                  </div>
                  <div className="text-xs font-serif text-forest">
                    {formatDate(comment.createdAt)}
                  </div>
                </div>
                <p className="font-serif text-forest leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
