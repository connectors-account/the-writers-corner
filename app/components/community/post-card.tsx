
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Heart, MessageCircle, Edit2, Trash2, X, Check } from 'lucide-react'
import Link from 'next/link'
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
  index: number
}

export function PostCard({ post, index }: PostCardProps) {
  const { data: session } = useSession()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchLikeStatus()
  }, [post.id])

  useEffect(() => {
    if (showComments) {
      fetchComments()
    }
  }, [showComments, post.id])

  const fetchLikeStatus = async () => {
    try {
      const response = await fetch(`/api/posts/${post.id}/likes`)
      if (response.ok) {
        const data = await response.json()
        setLiked(data.liked)
        setLikeCount(data.likeCount)
      }
    } catch (error) {
      console.error('Error fetching like status:', error)
    }
  }

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST'
      })
      if (response.ok) {
        const data = await response.json()
        setLiked(data.liked)
        setLikeCount(data.likeCount)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
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
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editingContent.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: editingContent })
      })

      if (response.ok) {
        const data = await response.json()
        setComments(comments.map(c => c.id === commentId ? data.comment : c))
        setEditingCommentId(null)
        setEditingContent('')
      }
    } catch (error) {
      console.error('Error editing comment:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setComments(comments.filter(c => c.id !== commentId))
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    } finally {
      setLoading(false)
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

  const getUserName = (user: any) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    return user.name || 'Anonymous Writer'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      <Card className="card-vintage border-2 hover:shadow-xl transition-all duration-300">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="font-typewriter text-ink text-xl mb-2">
                {post.title || 'Exercise Response'}
              </CardTitle>
              <div className="flex items-center gap-3 mb-3">
                <Badge className="bg-rust/20 text-rust font-typewriter">
                  {getUserName(post.user)}
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
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`${liked ? 'text-rust' : 'text-forest'} hover:text-rust transition-colors`}
                onClick={handleLike}
              >
                <Heart className={`w-4 h-4 mr-1 ${liked ? 'fill-current' : ''}`} />
                {likeCount > 0 ? likeCount : 'Like'}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-forest hover:text-rust"
                onClick={() => setShowComments(!showComments)}
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                {comments.length > 0 ? comments.length : 'Comment'}
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
          {showComments && (
            <div className="mt-4 pt-4 border-t border-sepia">
              {/* Add Comment */}
              <div className="mb-4">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="font-serif border-2 border-ink focus:border-rust mb-2 min-h-[80px]"
                />
                <Button
                  size="sm"
                  className="btn-vintage"
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || loading}
                >
                  Post Comment
                </Button>
              </div>

              {/* Comments List */}
              <div className="space-y-3">
                {comments.length === 0 ? (
                  <p className="text-sm font-serif text-forest text-center py-4">
                    No comments yet. Be the first to comment!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-sepia/30 p-3 rounded-sm border border-sepia">
                      {editingCommentId === comment.id ? (
                        <div>
                          <Textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="font-serif border-2 border-ink focus:border-rust mb-2"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="btn-vintage"
                              onClick={() => handleEditComment(comment.id)}
                              disabled={loading}
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingCommentId(null)
                                setEditingContent('')
                              }}
                            >
                              <X className="w-3 h-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <span className="font-typewriter text-ink text-sm font-semibold">
                                {getUserName(comment.user)}
                              </span>
                              <span className="text-xs font-serif text-forest ml-2">
                                {formatDate(comment.createdAt)}
                                {comment.updatedAt !== comment.createdAt && ' (edited)'}
                              </span>
                            </div>
                            {session?.user?.id === comment.user.id && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-forest hover:text-rust"
                                  onClick={() => {
                                    setEditingCommentId(comment.id)
                                    setEditingContent(comment.content)
                                  }}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-forest hover:text-rust"
                                  onClick={() => handleDeleteComment(comment.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                          <p className="text-sm font-serif text-forest leading-relaxed">
                            {comment.content}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
