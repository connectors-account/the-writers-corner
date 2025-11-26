'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, PenTool, BookOpen, Heart, MessageCircle, Filter, Search, Send, Edit2, Trash2, X } from 'lucide-react'
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

interface Comment {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  userId: string
  user: {
    id: string
    firstName?: string
    lastName?: string
    name?: string
  }
}

interface PostInteraction {
  likeCount: number
  isLiked: boolean
  commentCount: number
  showComments: boolean
  comments: Comment[]
  isLoadingComments: boolean
}

export function CommunityOverview() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [topicFilter, setTopicFilter] = useState('all')
  const [interactions, setInteractions] = useState<Record<string, PostInteraction>>({})
  const [newComment, setNewComment] = useState<Record<string, string>>({})
  const [editingComment, setEditingComment] = useState<{ postId: string; commentId: string; content: string } | null>(null)

  useEffect(() => {
    fetchCommunityPosts()
  }, [])

  const fetchCommunityPosts = async () => {
    try {
      const response = await fetch('/api/community/posts')
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
        
        // Initialize interactions for each post
        const initialInteractions: Record<string, PostInteraction> = {}
        data.posts.forEach((post: CommunityPost) => {
          initialInteractions[post.id] = {
            likeCount: 0,
            isLiked: false,
            commentCount: 0,
            showComments: false,
            comments: [],
            isLoadingComments: false
          }
        })
        setInteractions(initialInteractions)

        // Fetch likes for all posts
        data.posts.forEach((post: CommunityPost) => {
          fetchLikes(post.id)
        })
      }
    } catch (error) {
      console.error('Error fetching community posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLikes = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/likes`)
      if (response.ok) {
        const data = await response.json()
        setInteractions(prev => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            likeCount: data.count,
            isLiked: data.isLiked
          }
        }))
      }
    } catch (error) {
      console.error('Error fetching likes:', error)
    }
  }

  const toggleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/likes`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        setInteractions(prev => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            likeCount: data.count,
            isLiked: data.isLiked
          }
        }))
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const fetchComments = async (postId: string) => {
    try {
      setInteractions(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          isLoadingComments: true
        }
      }))

      const response = await fetch(`/api/posts/${postId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setInteractions(prev => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            comments: data.comments,
            commentCount: data.comments.length,
            isLoadingComments: false
          }
        }))
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
      setInteractions(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          isLoadingComments: false
        }
      }))
    }
  }

  const toggleComments = async (postId: string) => {
    const currentState = interactions[postId]?.showComments
    
    setInteractions(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        showComments: !currentState
      }
    }))

    // Fetch comments if showing and not already loaded
    if (!currentState && interactions[postId]?.comments.length === 0) {
      await fetchComments(postId)
    }
  }

  const addComment = async (postId: string) => {
    const content = newComment[postId]?.trim()
    if (!content) return

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      })

      if (response.ok) {
        const data = await response.json()
        setInteractions(prev => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            comments: [...prev[postId].comments, data.comment],
            commentCount: prev[postId].commentCount + 1
          }
        }))
        setNewComment(prev => ({ ...prev, [postId]: '' }))
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const updateComment = async (postId: string, commentId: string, content: string) => {
    if (!content.trim()) return

    try {
      const response = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: content.trim() })
      })

      if (response.ok) {
        const data = await response.json()
        setInteractions(prev => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            comments: prev[postId].comments.map(c => 
              c.id === commentId ? data.comment : c
            )
          }
        }))
        setEditingComment(null)
      }
    } catch (error) {
      console.error('Error updating comment:', error)
    }
  }

  const deleteComment = async (postId: string, commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      const response = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setInteractions(prev => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            comments: prev[postId].comments.filter(c => c.id !== commentId),
            commentCount: prev[postId].commentCount - 1
          }
        }))
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
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

  const formatCommentDate = (dateString: string) => {
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
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`text-forest hover:text-rust transition-colors ${
                            interactions[post.id]?.isLiked ? 'text-rust' : ''
                          }`}
                          onClick={() => toggleLike(post.id)}
                        >
                          <Heart 
                            className={`w-4 h-4 mr-1 ${
                              interactions[post.id]?.isLiked ? 'fill-rust' : ''
                            }`} 
                          />
                          {interactions[post.id]?.likeCount > 0 
                            ? interactions[post.id].likeCount 
                            : 'Like'
                          }
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-forest hover:text-rust"
                          onClick={() => toggleComments(post.id)}
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          {interactions[post.id]?.commentCount > 0
                            ? interactions[post.id].commentCount
                            : 'Comment'
                          }
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
                      {interactions[post.id]?.showComments && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-4 pt-4 border-t-2 border-sepia"
                        >
                          {/* Comments List */}
                          {interactions[post.id]?.isLoadingComments ? (
                            <div className="text-center py-4">
                              <p className="font-serif text-forest">Loading comments...</p>
                            </div>
                          ) : (
                            <div className="space-y-3 mb-4">
                              {interactions[post.id]?.comments.length === 0 ? (
                                <p className="font-serif text-forest text-sm italic text-center py-2">
                                  No comments yet. Be the first to share your thoughts!
                                </p>
                              ) : (
                                interactions[post.id]?.comments.map((comment) => (
                                  <div 
                                    key={comment.id} 
                                    className="bg-sepia/30 rounded p-3 border border-sepia"
                                  >
                                    {editingComment?.commentId === comment.id ? (
                                      // Edit mode
                                      <div className="space-y-2">
                                        <Textarea
                                          value={editingComment.content}
                                          onChange={(e) => setEditingComment({
                                            ...editingComment,
                                            content: e.target.value
                                          })}
                                          className="font-serif text-sm border-2 border-ink focus:border-rust"
                                          rows={3}
                                        />
                                        <div className="flex gap-2">
                                          <Button
                                            size="sm"
                                            onClick={() => updateComment(
                                              post.id,
                                              comment.id,
                                              editingComment.content
                                            )}
                                            className="btn-vintage text-xs"
                                          >
                                            Save
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setEditingComment(null)}
                                            className="text-xs"
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      // View mode
                                      <>
                                        <div className="flex items-start justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <span className="font-typewriter text-ink text-sm font-semibold">
                                              {getUserDisplayName(comment.user)}
                                            </span>
                                            <span className="font-serif text-forest text-xs">
                                              {formatCommentDate(comment.createdAt)}
                                              {comment.updatedAt !== comment.createdAt && ' (edited)'}
                                            </span>
                                          </div>
                                          
                                          {session?.user?.id === comment.userId && (
                                            <div className="flex gap-1">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setEditingComment({
                                                  postId: post.id,
                                                  commentId: comment.id,
                                                  content: comment.content
                                                })}
                                                className="h-6 w-6 p-0 text-forest hover:text-rust"
                                              >
                                                <Edit2 className="w-3 h-3" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => deleteComment(post.id, comment.id)}
                                                className="h-6 w-6 p-0 text-forest hover:text-rust"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                        <p className="font-serif text-forest text-sm leading-relaxed">
                                          {comment.content}
                                        </p>
                                      </>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          )}

                          {/* Add Comment Form */}
                          <div className="flex gap-2">
                            <Textarea
                              placeholder="Share your thoughts..."
                              value={newComment[post.id] || ''}
                              onChange={(e) => setNewComment(prev => ({
                                ...prev,
                                [post.id]: e.target.value
                              }))}
                              className="font-serif text-sm border-2 border-ink focus:border-rust"
                              rows={2}
                            />
                            <Button
                              onClick={() => addComment(post.id)}
                              disabled={!newComment[post.id]?.trim()}
                              className="btn-vintage self-end"
                              size="sm"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
