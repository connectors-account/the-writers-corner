'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, PenTool, BookOpen, Heart, MessageCircle, Filter, Search, Send, Edit2, Trash2, X, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

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
}

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

interface PostEngagement {
  likeCount: number
  userHasLiked: boolean
  comments: PostComment[]
  commentCount: number
}

export function CommunityOverview() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [topicFilter, setTopicFilter] = useState('all')
  const [engagements, setEngagements] = useState<Record<string, PostEngagement>>({})
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [newComments, setNewComments] = useState<Record<string, string>>({})
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editCommentContent, setEditCommentContent] = useState('')
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchCommunityPosts()
  }, [])

  const fetchCommunityPosts = async () => {
    try {
      const response = await fetch('/api/community/posts')
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
        
        // Fetch engagement data for each post
        for (const post of data.posts || []) {
          fetchPostEngagement(post.id)
        }
      }
    } catch (error) {
      console.error('Error fetching community posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPostEngagement = async (postId: string) => {
    try {
      const [likesRes, commentsRes] = await Promise.all([
        fetch(`/api/community/posts/${postId}/likes`),
        fetch(`/api/community/posts/${postId}/comments`)
      ])

      const likesData = likesRes.ok ? await likesRes.json() : { likeCount: 0, userHasLiked: false }
      const commentsData = commentsRes.ok ? await commentsRes.json() : { comments: [], commentCount: 0 }

      setEngagements(prev => ({
        ...prev,
        [postId]: {
          likeCount: likesData.likeCount || 0,
          userHasLiked: likesData.userHasLiked || false,
          comments: commentsData.comments || [],
          commentCount: commentsData.commentCount || 0
        }
      }))
    } catch (error) {
      console.error('Error fetching engagement:', error)
    }
  }

  const handleLike = async (postId: string) => {
    if (!session?.user) return
    
    const engagement = engagements[postId]
    const isLiked = engagement?.userHasLiked

    setLoadingStates(prev => ({ ...prev, [`like-${postId}`]: true }))

    try {
      const response = await fetch(`/api/community/posts/${postId}/likes`, {
        method: isLiked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const data = await response.json()
        setEngagements(prev => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            likeCount: data.likeCount,
            userHasLiked: data.userHasLiked
          }
        }))
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, [`like-${postId}`]: false }))
    }
  }

  const handleAddComment = async (postId: string) => {
    if (!session?.user || !newComments[postId]?.trim()) return

    setLoadingStates(prev => ({ ...prev, [`comment-${postId}`]: true }))

    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComments[postId] })
      })

      if (response.ok) {
        const data = await response.json()
        setEngagements(prev => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            comments: [...(prev[postId]?.comments || []), data.comment],
            commentCount: (prev[postId]?.commentCount || 0) + 1
          }
        }))
        setNewComments(prev => ({ ...prev, [postId]: '' }))
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, [`comment-${postId}`]: false }))
    }
  }

  const handleEditComment = async (postId: string, commentId: string) => {
    if (!editCommentContent.trim()) return

    setLoadingStates(prev => ({ ...prev, [`edit-${commentId}`]: true }))

    try {
      const response = await fetch(`/api/community/posts/${postId}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editCommentContent })
      })

      if (response.ok) {
        const data = await response.json()
        setEngagements(prev => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            comments: prev[postId]?.comments.map(c => 
              c.id === commentId ? data.comment : c
            ) || []
          }
        }))
        setEditingComment(null)
        setEditCommentContent('')
      }
    } catch (error) {
      console.error('Error editing comment:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, [`edit-${commentId}`]: false }))
    }
  }

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    setLoadingStates(prev => ({ ...prev, [`delete-${commentId}`]: true }))

    try {
      const response = await fetch(`/api/community/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setEngagements(prev => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            comments: prev[postId]?.comments.filter(c => c.id !== commentId) || [],
            commentCount: Math.max((prev[postId]?.commentCount || 1) - 1, 0)
          }
        }))
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, [`delete-${commentId}`]: false }))
    }
  }

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(postId)) {
        newSet.delete(postId)
      } else {
        newSet.add(postId)
      }
      return newSet
    })
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getUserDisplayName = (user: { firstName?: string; lastName?: string; name?: string }) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    return user.name || 'Anonymous Writer'
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
            Writer's Community
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
            {filteredPosts.map((post, index) => {
              const engagement = engagements[post.id] || { likeCount: 0, userHasLiked: false, comments: [], commentCount: 0 }
              const isCommentsExpanded = expandedComments.has(post.id)

              return (
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
                        <div className="flex items-center gap-4">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`text-forest hover:text-rust ${engagement.userHasLiked ? 'text-rust' : ''}`}
                            onClick={() => handleLike(post.id)}
                            disabled={loadingStates[`like-${post.id}`] || !session?.user}
                            title={!session?.user ? 'Sign in to like posts' : ''}
                          >
                            <Heart 
                              className={`w-4 h-4 mr-1 ${engagement.userHasLiked ? 'fill-rust' : ''}`} 
                            />
                            {engagement.likeCount > 0 ? engagement.likeCount : ''} Like{engagement.likeCount !== 1 ? 's' : ''}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-forest hover:text-rust"
                            onClick={() => toggleComments(post.id)}
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            {engagement.commentCount > 0 ? engagement.commentCount : ''} Comment{engagement.commentCount !== 1 ? 's' : ''}
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
                        {isCommentsExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4 pt-4 border-t-2 border-ink/20"
                          >
                            {/* Add Comment Form */}
                            {session?.user ? (
                              <div className="flex gap-2 mb-4">
                                <Textarea
                                  placeholder="Add a comment..."
                                  value={newComments[post.id] || ''}
                                  onChange={(e) => setNewComments(prev => ({ ...prev, [post.id]: e.target.value }))}
                                  className="font-serif border-2 border-ink/50 focus:border-rust min-h-[60px] resize-none"
                                  maxLength={2000}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleAddComment(post.id)}
                                  disabled={loadingStates[`comment-${post.id}`] || !newComments[post.id]?.trim()}
                                  className="btn-vintage self-end"
                                >
                                  <Send className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <p className="text-sm font-serif text-forest mb-4 italic">
                                <Link href="/auth/signin" className="text-rust hover:underline">Sign in</Link> to leave a comment
                              </p>
                            )}

                            {/* Comments List */}
                            <div className="space-y-3">
                              {engagement.comments.length === 0 ? (
                                <p className="text-sm font-serif text-forest/60 text-center py-2">
                                  No comments yet. Be the first to comment!
                                </p>
                              ) : (
                                engagement.comments.map((comment) => {
                                  const isOwner = session?.user?.id === comment.user.id
                                  const isEditing = editingComment === comment.id

                                  return (
                                    <div key={comment.id} className="bg-sepia/30 rounded p-3">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="font-typewriter text-sm text-ink font-semibold">
                                              {getUserDisplayName(comment.user)}
                                            </span>
                                            <span className="text-xs font-serif text-forest/60">
                                              {formatDateTime(comment.createdAt)}
                                              {comment.updatedAt !== comment.createdAt && ' (edited)'}
                                            </span>
                                          </div>
                                          
                                          {isEditing ? (
                                            <div className="flex gap-2">
                                              <Textarea
                                                value={editCommentContent}
                                                onChange={(e) => setEditCommentContent(e.target.value)}
                                                className="font-serif border border-ink/50 focus:border-rust min-h-[60px] resize-none text-sm"
                                                maxLength={2000}
                                              />
                                              <div className="flex flex-col gap-1">
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={() => handleEditComment(post.id, comment.id)}
                                                  disabled={loadingStates[`edit-${comment.id}`]}
                                                  className="text-forest hover:text-rust p-1"
                                                >
                                                  <Check className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={() => {
                                                    setEditingComment(null)
                                                    setEditCommentContent('')
                                                  }}
                                                  className="text-forest hover:text-rust p-1"
                                                >
                                                  <X className="w-4 h-4" />
                                                </Button>
                                              </div>
                                            </div>
                                          ) : (
                                            <p className="font-serif text-forest text-sm leading-relaxed">
                                              {comment.content}
                                            </p>
                                          )}
                                        </div>
                                        
                                        {isOwner && !isEditing && (
                                          <div className="flex items-center gap-1">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => {
                                                setEditingComment(comment.id)
                                                setEditCommentContent(comment.content)
                                              }}
                                              className="text-forest hover:text-rust p-1 h-auto"
                                            >
                                              <Edit2 className="w-3 h-3" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => handleDeleteComment(post.id, comment.id)}
                                              disabled={loadingStates[`delete-${comment.id}`]}
                                              className="text-forest hover:text-red-600 p-1 h-auto"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
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
