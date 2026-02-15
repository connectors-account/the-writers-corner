'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, PenTool, BookOpen, Heart, MessageCircle, Filter, Search, Send, Edit2, Trash2, X, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

interface PostComment {
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

interface CommunityPost {
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
  likeCount: number
  isLikedByUser: boolean
  commentCount: number
}

const MAX_COMMENT_LENGTH = 2000

function getUserDisplayName(user: { firstName?: string; lastName?: string; name?: string }) {
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`
  return user.name || 'Anonymous Writer'
}

function CommentSection({ postId, initialCommentCount }: { postId: string; initialCommentCount: number }) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<PostComment[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [commentCount, setCommentCount] = useState(initialCommentCount)
  const [error, setError] = useState('')

  const fetchComments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments || [])
        setCommentCount(data.comments?.length || 0)
      }
    } catch (err) {
      console.error('Error fetching comments:', err)
    } finally {
      setLoading(false)
    }
  }, [postId])

  const toggleOpen = () => {
    if (!isOpen) {
      fetchComments()
    }
    setIsOpen(!isOpen)
  }

  const handleAddComment = async () => {
    const trimmed = newComment.trim()
    if (!trimmed) return
    if (trimmed.length > MAX_COMMENT_LENGTH) {
      setError(`Comment must be ${MAX_COMMENT_LENGTH} characters or less`)
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed })
      })
      if (res.ok) {
        const data = await res.json()
        setComments(prev => [...prev, data.comment])
        setCommentCount(prev => prev + 1)
        setNewComment('')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to add comment')
      }
    } catch (err) {
      setError('Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    const trimmed = editContent.trim()
    if (!trimmed) return
    if (trimmed.length > MAX_COMMENT_LENGTH) {
      setError(`Comment must be ${MAX_COMMENT_LENGTH} characters or less`)
      return
    }

    setError('')
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed })
      })
      if (res.ok) {
        const data = await res.json()
        setComments(prev => prev.map(c => c.id === commentId ? data.comment : c))
        setEditingId(null)
        setEditContent('')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to edit comment')
      }
    } catch (err) {
      setError('Failed to edit comment')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId))
        setCommentCount(prev => prev - 1)
      }
    } catch (err) {
      console.error('Error deleting comment:', err)
    }
  }

  const startEditing = (comment: PostComment) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
    setError('')
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditContent('')
    setError('')
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

  return (
    <div className="w-full">
      <Button
        variant="ghost"
        size="sm"
        className="text-forest hover:text-rust"
        onClick={toggleOpen}
      >
        <MessageCircle className="w-4 h-4 mr-1" />
        {commentCount > 0 ? `${commentCount} Comment${commentCount !== 1 ? 's' : ''}` : 'Comment'}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 border-t-2 border-ink/10 pt-4"
          >
            {/* Comment list */}
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-pulse font-serif text-forest">Loading comments...</div>
              </div>
            ) : comments.length === 0 ? (
              <p className="text-center font-serif text-forest/60 py-4">
                No comments yet. Be the first to share your thoughts!
              </p>
            ) : (
              <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                {comments.map(comment => (
                  <div key={comment.id} className="bg-sepia/30 rounded-sm p-3 border border-ink/10">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-typewriter text-sm font-semibold text-ink">
                            {getUserDisplayName(comment.user)}
                          </span>
                          <span className="text-xs font-serif text-forest/60">
                            {formatDate(comment.createdAt)}
                            {comment.updatedAt !== comment.createdAt && ' (edited)'}
                          </span>
                        </div>

                        {editingId === comment.id ? (
                          <div className="mt-2">
                            <Textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="font-serif border-2 border-ink/30 focus:border-rust min-h-[60px] text-sm"
                              maxLength={MAX_COMMENT_LENGTH}
                            />
                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                size="sm"
                                className="btn-vintage text-xs"
                                onClick={() => handleEditComment(comment.id)}
                                disabled={!editContent.trim()}
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Save
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={cancelEditing}
                              >
                                <X className="w-3 h-3 mr-1" />
                                Cancel
                              </Button>
                              <span className="text-xs text-forest/50 ml-auto">
                                {editContent.length}/{MAX_COMMENT_LENGTH}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="font-serif text-forest text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {comment.content}
                          </p>
                        )}
                      </div>

                      {/* Edit/Delete buttons for own comments */}
                      {session?.user?.id === comment.user.id && editingId !== comment.id && (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-forest/50 hover:text-rust"
                            onClick={() => startEditing(comment)}
                            title="Edit comment"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-forest/50 hover:text-red-600"
                            onClick={() => handleDeleteComment(comment.id)}
                            title="Delete comment"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error display */}
            {error && (
              <p className="text-red-600 text-sm font-serif mb-2">{error}</p>
            )}

            {/* New comment form */}
            <div className="flex gap-2">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => {
                  setNewComment(e.target.value)
                  setError('')
                }}
                className="font-serif border-2 border-ink/30 focus:border-rust min-h-[60px] text-sm flex-1"
                maxLength={MAX_COMMENT_LENGTH}
              />
              <Button
                size="sm"
                className="btn-vintage self-end"
                onClick={handleAddComment}
                disabled={submitting || !newComment.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-xs text-forest/50 mt-1 text-right">
              {newComment.length}/{MAX_COMMENT_LENGTH}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function LikeButton({ postId, initialCount, initialIsLiked }: {
  postId: string
  initialCount: number
  initialIsLiked: boolean
}) {
  const [likeCount, setLikeCount] = useState(initialCount)
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [loading, setLoading] = useState(false)

  const handleToggleLike = async () => {
    if (loading) return
    setLoading(true)

    // Optimistic update
    setIsLiked(prev => !prev)
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1)

    try {
      const res = await fetch(`/api/community/posts/${postId}/like`, {
        method: 'POST'
      })
      if (res.ok) {
        const data = await res.json()
        setIsLiked(data.isLiked)
        setLikeCount(data.likeCount)
      } else {
        // Revert optimistic update
        setIsLiked(prev => !prev)
        setLikeCount(prev => isLiked ? prev + 1 : prev - 1)
      }
    } catch (err) {
      // Revert optimistic update
      setIsLiked(prev => !prev)
      setLikeCount(prev => isLiked ? prev + 1 : prev - 1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`transition-colors ${isLiked ? 'text-rust' : 'text-forest hover:text-rust'}`}
      onClick={handleToggleLike}
      disabled={loading}
    >
      <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-rust' : ''}`} />
      {likeCount > 0 ? `${likeCount} Like${likeCount !== 1 ? 's' : ''}` : 'Like'}
    </Button>
  )
}

export function CommunityOverview() {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [topicFilter, setTopicFilter] = useState('all')

  useEffect(() => {
    fetchCommunityPosts()
  }, [])

  const fetchCommunityPosts = async () => {
    try {
      const response = await fetch('/api/community/posts')
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
      }
    } catch (error) {
      console.error('Error fetching community posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTopic = topicFilter === 'all' || post.exercise?.topic.slug === topicFilter
    return matchesSearch && matchesTopic
  })

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

  if (loading) {
    return (
      <section className="py-12 px-4 paper-texture min-h-screen">
        <div className="max-w-content mx-auto text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-sepia rounded w-1/2 mx-auto mb-4"></div>
            <div className="h-4 bg-sepia rounded w-1/3 mx-auto"></div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 px-4 paper-texture min-h-screen">
      <div className="max-w-content mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-typewriter font-bold text-ink mb-6">
            Writer&apos;s Community
          </h1>
          <p className="text-xl font-serif text-forest max-w-3xl mx-auto leading-relaxed mb-8">
            Connect with fellow writers, share your exercise responses, and discover inspiration 
            from the creative work of others in our supportive community.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-3xl font-typewriter font-bold text-rust mb-1">
                {posts.length}
              </div>
              <p className="font-serif text-forest text-sm">Shared Works</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-typewriter font-bold text-rust mb-1">
                {new Set(posts.map(p => p.user?.name || `${p.user?.firstName} ${p.user?.lastName}`)).size}
              </div>
              <p className="font-serif text-forest text-sm">Active Writers</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-typewriter font-bold text-rust mb-1">
                4
              </div>
              <p className="font-serif text-forest text-sm">Topics</p>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <Card className="card-vintage border-2">
            <CardHeader>
              <CardTitle className="font-typewriter text-ink flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Find Writing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="font-typewriter text-ink block mb-2">Search:</label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-forest" />
                    <Input
                      placeholder="Search posts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 font-serif border-2 border-ink focus:border-rust"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-typewriter text-ink block mb-2">Topic:</label>
                  <Select value={topicFilter} onValueChange={setTopicFilter}>
                    <SelectTrigger className="font-serif border-2 border-ink focus:border-rust">
                      <SelectValue placeholder="All Topics" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Topics</SelectItem>
                      <SelectItem value="character-development">Character Development</SelectItem>
                      <SelectItem value="plot-structure">Plot Structure</SelectItem>
                      <SelectItem value="world-building">World-Building</SelectItem>
                      <SelectItem value="writing-tension">Writing Tension</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Posts */}
        {filteredPosts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center py-16"
          >
            <PenTool className="w-16 h-16 text-forest mx-auto mb-4" />
            <h3 className="text-2xl font-typewriter font-bold text-ink mb-4">
              {searchTerm || topicFilter !== 'all' ? 'No matches found' : 'No shared work yet'}
            </h3>
            <p className="font-serif text-forest mb-6 max-w-md mx-auto">
              {searchTerm || topicFilter !== 'all' 
                ? 'Try adjusting your search terms or filters.'
                : 'Be the first to share your exercise responses with the community! Complete exercises and make them public to start building our creative library.'
              }
            </p>
            {!searchTerm && topicFilter === 'all' && (
              <Link href="/topics">
                <Button className="btn-vintage">
                  Start Writing Exercises
                </Button>
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="space-y-6">
            {filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
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
                            {getUserDisplayName(post.user)}
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
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <LikeButton
                          postId={post.id}
                          initialCount={post.likeCount}
                          initialIsLiked={post.isLikedByUser}
                        />
                        <CommentSection
                          postId={post.id}
                          initialCommentCount={post.commentCount}
                        />
                      </div>
                      
                      {post.exercise && (
                        <Link href={`/topics/${post.exercise.topic.slug}`}>
                          <Button variant="outline" size="sm" className="btn-vintage text-xs">
                            Try This Exercise
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mt-16 p-8 bg-sepia/50 rounded-sm border-2 border-ink"
        >
          <h3 className="text-2xl font-typewriter font-bold text-ink mb-4">
            Share Your Creative Work
          </h3>
          <p className="font-serif text-forest mb-6 max-w-2xl mx-auto">
            When you complete writing exercises, you can choose to share them with the community. 
            Your work might inspire another writer or receive helpful feedback!
          </p>
          <Link href="/topics">
            <Button className="btn-vintage">
              Start Writing
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
