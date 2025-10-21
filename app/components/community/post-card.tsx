'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Heart, MessageCircle, Send, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Comment {
  id: string
  content: string
  authorName: string
  createdAt: string
}

interface PostCardProps {
  post: {
    id: string
    title: string
    content: string
    createdAt: string
    user: {
      firstName?: string
      lastName?: string
      name?: string
    }
    exercise?: {
      title: string
      topic: {
        title: string
        slug: string
      }
    }
  }
}

export function PostCard({ post }: PostCardProps) {
  const [likeCount, setLikeCount] = useState(0)
  const [hasLiked, setHasLiked] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  
  const [comments, setComments] = useState<Comment[]>([])
  const [commentCount, setCommentCount] = useState(0)
  const [showComments, setShowComments] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  
  const [newComment, setNewComment] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [isPostingComment, setIsPostingComment] = useState(false)

  // Fetch like count and status
  useEffect(() => {
    fetchLikeData()
  }, [post.id])

  // Fetch comments when comment section is opened
  useEffect(() => {
    if (showComments && comments.length === 0) {
      fetchComments()
    }
  }, [showComments])

  const fetchLikeData = async () => {
    try {
      const response = await fetch(`/api/posts/${post.id}/likes`)
      if (response.ok) {
        const data = await response.json()
        setLikeCount(data.likeCount)
        setHasLiked(data.hasLiked)
      }
    } catch (error) {
      console.error('Error fetching like data:', error)
    }
  }

  const fetchComments = async () => {
    setIsLoadingComments(true)
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments)
        setCommentCount(data.count)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
      toast.error('Failed to load comments')
    } finally {
      setIsLoadingComments(false)
    }
  }

  const toggleLike = async () => {
    if (isLiking) return
    
    setIsLiking(true)
    const previousLiked = hasLiked
    const previousCount = likeCount

    // Optimistic update
    setHasLiked(!hasLiked)
    setLikeCount(hasLiked ? likeCount - 1 : likeCount + 1)

    try {
      const response = await fetch(`/api/posts/${post.id}/likes`, {
        method: 'POST'
      })

      if (!response.ok) {
        // Revert on error
        setHasLiked(previousLiked)
        setLikeCount(previousCount)
        toast.error('Failed to update like')
      } else {
        const data = await response.json()
        // Fetch actual counts to ensure sync
        fetchLikeData()
      }
    } catch (error) {
      // Revert on error
      setHasLiked(previousLiked)
      setLikeCount(previousCount)
      toast.error('Failed to update like')
    } finally {
      setIsLiking(false)
    }
  }

  const postComment = async () => {
    if (!newComment.trim()) {
      toast.error('Comment cannot be empty')
      return
    }

    setIsPostingComment(true)
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newComment,
          authorName: authorName || 'Anonymous'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setComments([data.comment, ...comments])
        setCommentCount(commentCount + 1)
        setNewComment('')
        toast.success('Comment posted!')
      } else {
        toast.error('Failed to post comment')
      }
    } catch (error) {
      console.error('Error posting comment:', error)
      toast.error('Failed to post comment')
    } finally {
      setIsPostingComment(false)
    }
  }

  const getExcerpt = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatRelativeTime = (dateString: string) => {
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
    return formatDate(dateString)
  }

  return (
    <Card className="card-vintage border-2 hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="font-typewriter text-ink text-xl mb-2">
              {post.title || 'Exercise Response'}
            </CardTitle>
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <Badge className="bg-rust/20 text-rust font-typewriter">
                {post.user?.firstName && post.user?.lastName 
                  ? `${post.user.firstName} ${post.user.lastName}`
                  : post.user?.name || 'Anonymous Writer'
                }
              </Badge>
              {post.exercise && (
                <Badge className="bg-gold/20 text-ink font-typewriter">
                  {post.exercise.topic.title}
                </Badge>
              )}
              <span className="text-sm font-serif text-forest">
                {formatDate(post.createdAt)}
              </span>
            </div>
            {post.exercise && (
              <p className="text-sm font-serif text-forest mb-2">
                From exercise: <span className="font-semibold">{post.exercise.title}</span>
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="font-serif text-forest leading-relaxed mb-4">
          {getExcerpt(post.content)}
        </p>
        
        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`font-typewriter transition-colors ${
                hasLiked 
                  ? 'text-rust hover:text-rust/80' 
                  : 'text-forest hover:text-rust'
              }`}
              onClick={toggleLike}
              disabled={isLiking}
            >
              <Heart 
                className={`w-4 h-4 mr-1 transition-all ${
                  hasLiked ? 'fill-rust' : ''
                }`}
              />
              {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-forest hover:text-rust font-typewriter"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              {commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}
            </Button>
          </div>
          
          {post.exercise && (
            <Link href={`/topics/${post.exercise.topic.slug}`}>
              <Button variant="outline" size="sm" className="btn-vintage text-xs">
                Try This Exercise
              </Button>
            </Link>
          )}
        </div>

        {/* Comments Section */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t-2 border-sepia pt-4"
            >
              {/* Comment Form */}
              <div className="mb-4 space-y-3">
                <Input
                  placeholder="Your name (optional)"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="font-serif border-2 border-ink/30 focus:border-rust"
                />
                <div className="relative">
                  <Textarea
                    placeholder="Share your thoughts..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="font-serif border-2 border-ink/30 focus:border-rust min-h-[80px]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        postComment()
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={postComment}
                    disabled={isPostingComment || !newComment.trim()}
                    className="btn-vintage absolute bottom-2 right-2"
                  >
                    {isPostingComment ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-1" />
                        Post
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs font-serif text-forest/70">
                  Press Ctrl+Enter to post
                </p>
              </div>

              {/* Comments List */}
              {isLoadingComments ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-rust" />
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {comments.map((comment, index) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-sepia/30 p-3 rounded border border-ink/10"
                    >
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="font-typewriter text-sm text-ink font-semibold">
                          {comment.authorName}
                        </span>
                        <span className="text-xs font-serif text-forest/70">
                          {formatRelativeTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="font-serif text-forest text-sm leading-relaxed">
                        {comment.content}
                      </p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-forest/30 mx-auto mb-2" />
                  <p className="font-serif text-forest/70 text-sm">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
