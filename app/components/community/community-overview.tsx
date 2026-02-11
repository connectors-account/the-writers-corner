
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, PenTool, BookOpen, Heart, MessageCircle, Filter, Search, Send, Edit2, Trash2, X, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

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
  isOwner: boolean
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
  commentCount: number
  isLiked: boolean
}

const MAX_COMMENT_LENGTH = 500

export function CommunityOverview() {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [topicFilter, setTopicFilter] = useState('all')
  const [expandedPost, setExpandedPost] = useState<string | null>(null)
  const [comments, setComments] = useState<{ [postId: string]: Comment[] }>({})
  const [loadingComments, setLoadingComments] = useState<{ [postId: string]: boolean }>({})
  const [newComment, setNewComment] = useState<{ [postId: string]: string }>({})
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [submittingComment, setSubmittingComment] = useState<{ [postId: string]: boolean }>({})
  const [likingPost, setLikingPost] = useState<{ [postId: string]: boolean }>({})

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

  const handleLike = async (postId: string) => {
    if (likingPost[postId]) return

    setLikingPost(prev => ({ ...prev, [postId]: true }))

    try {
      const response = await fetch(`/api/community/posts/${postId}/like`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, isLiked: data.liked, likeCount: data.likeCount }
            : post
        ))
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    } finally {
      setLikingPost(prev => ({ ...prev, [postId]: false }))
    }
  }

  const fetchComments = async (postId: string) => {
    setLoadingComments(prev => ({ ...prev, [postId]: true }))

    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(prev => ({ ...prev, [postId]: data.comments || [] }))
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }))
    }
  }

  const toggleComments = (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null)
    } else {
      setExpandedPost(postId)
      if (!comments[postId]) {
        fetchComments(postId)
      }
    }
  }

  const handleSubmitComment = async (postId: string) => {
    const content = newComment[postId]?.trim()
    if (!content || submittingComment[postId]) return

    if (content.length > MAX_COMMENT_LENGTH) {
      alert(`Comment must be ${MAX_COMMENT_LENGTH} characters or less`)
      return
    }

    setSubmittingComment(prev => ({ ...prev, [postId]: true }))

    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })

      if (response.ok) {
        const data = await response.json()
        setComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), data.comment]
        }))
        setNewComment(prev => ({ ...prev, [postId]: '' }))
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, commentCount: post.commentCount + 1 }
            : post
        ))
      }
    } catch (error) {
      console.error('Error creating comment:', error)
    } finally {
      setSubmittingComment(prev => ({ ...prev, [postId]: false }))
    }
  }

  const handleEditComment = async (postId: string, commentId: string) => {
    const content = editContent.trim()
    if (!content) return

    if (content.length > MAX_COMMENT_LENGTH) {
      alert(`Comment must be ${MAX_COMMENT_LENGTH} characters or less`)
      return
    }

    try {
      const response = await fetch(`/api/community/posts/${postId}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })

      if (response.ok) {
        const data = await response.json()
        setComments(prev => ({
          ...prev,
          [postId]: prev[postId].map(c => c.id === commentId ? data.comment : c)
        }))
        setEditingComment(null)
        setEditContent('')
      }
    } catch (error) {
      console.error('Error updating comment:', error)
    }
  }

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      const response = await fetch(`/api/community/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setComments(prev => ({
          ...prev,
          [postId]: prev[postId].filter(c => c.id !== commentId)
        }))
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, commentCount: Math.max(0, post.commentCount - 1) }
            : post
        ))
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const startEditing = (comment: Comment) => {
    setEditingComment(comment.id)
    setEditContent(comment.content)
  }

  const cancelEditing = () => {
    setEditingComment(null)
    setEditContent('')
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
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getUserName = (user: { firstName?: string; lastName?: string; name?: string }) => {
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
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`text-forest hover:text-rust ${post.isLiked ? 'text-rust' : ''}`}
                          onClick={() => handleLike(post.id)}
                          disabled={likingPost[post.id]}
                        >
                          <Heart className={`w-4 h-4 mr-1 ${post.isLiked ? 'fill-current' : ''}`} />
                          {post.likeCount > 0 ? post.likeCount : ''} {post.likeCount === 1 ? 'Like' : 'Likes'}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`text-forest hover:text-rust ${expandedPost === post.id ? 'text-rust' : ''}`}
                          onClick={() => toggleComments(post.id)}
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          {post.commentCount > 0 ? post.commentCount : ''} {post.commentCount === 1 ? 'Comment' : 'Comments'}
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
                    {expandedPost === post.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-6 pt-4 border-t-2 border-ink/20"
                      >
                        <h4 className="font-typewriter text-ink text-sm mb-4">Comments</h4>

                        {/* Comment Form */}
                        <div className="mb-4">
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Textarea
                                placeholder="Write a comment..."
                                value={newComment[post.id] || ''}
                                onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                                className="font-serif border-2 border-ink focus:border-rust min-h-[80px] resize-none"
                                maxLength={MAX_COMMENT_LENGTH}
                              />
                              <div className="text-xs font-serif text-forest mt-1 text-right">
                                {(newComment[post.id]?.length || 0)}/{MAX_COMMENT_LENGTH}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className="btn-vintage self-start"
                              onClick={() => handleSubmitComment(post.id)}
                              disabled={!newComment[post.id]?.trim() || submittingComment[post.id]}
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Comments List */}
                        {loadingComments[post.id] ? (
                          <div className="text-center py-4">
                            <div className="animate-pulse font-serif text-forest">Loading comments...</div>
                          </div>
                        ) : comments[post.id]?.length > 0 ? (
                          <div className="space-y-3">
                            {comments[post.id].map((comment) => (
                              <div key={comment.id} className="bg-sepia/30 rounded p-3">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-typewriter text-ink text-sm font-semibold">
                                      {getUserName(comment.user)}
                                    </span>
                                    <span className="text-xs font-serif text-forest">
                                      {formatCommentDate(comment.createdAt)}
                                      {comment.updatedAt !== comment.createdAt && ' (edited)'}
                                    </span>
                                  </div>
                                  {comment.isOwner && editingComment !== comment.id && (
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-forest hover:text-rust"
                                        onClick={() => startEditing(comment)}
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-forest hover:text-red-600"
                                        onClick={() => handleDeleteComment(post.id, comment.id)}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                
                                {editingComment === comment.id ? (
                                  <div>
                                    <Textarea
                                      value={editContent}
                                      onChange={(e) => setEditContent(e.target.value)}
                                      className="font-serif border-2 border-ink focus:border-rust min-h-[60px] resize-none mb-2"
                                      maxLength={MAX_COMMENT_LENGTH}
                                    />
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-serif text-forest">
                                        {editContent.length}/{MAX_COMMENT_LENGTH}
                                      </span>
                                      <div className="flex gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 text-forest hover:text-ink"
                                          onClick={cancelEditing}
                                        >
                                          <X className="w-3 h-3 mr-1" />
                                          Cancel
                                        </Button>
                                        <Button
                                          size="sm"
                                          className="h-7 btn-vintage"
                                          onClick={() => handleEditComment(post.id, comment.id)}
                                          disabled={!editContent.trim()}
                                        >
                                          <Check className="w-3 h-3 mr-1" />
                                          Save
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="font-serif text-forest text-sm">{comment.content}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center font-serif text-forest text-sm py-4">
                            No comments yet. Be the first to comment!
                          </p>
                        )}
                      </motion.div>
                    )}
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
