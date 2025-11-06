
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, PenTool, BookOpen, Heart, MessageCircle, Filter, Search, Edit2, Trash2, X, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

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

export function CommunityOverview() {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [topicFilter, setTopicFilter] = useState('all')
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [comments, setComments] = useState<{ [postId: string]: Comment[] }>({})
  const [newCommentContent, setNewCommentContent] = useState<{ [postId: string]: string }>({})
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editCommentContent, setEditCommentContent] = useState('')
  const [loadingComments, setLoadingComments] = useState<Set<string>>(new Set())

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

  const handleLike = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId)
      if (!post) return

      const method = post.isLiked ? 'DELETE' : 'POST'
      const response = await fetch(`/api/community/posts/${postId}/likes`, { method })
      
      if (response.ok) {
        const data = await response.json()
        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, likeCount: data.likeCount, isLiked: data.isLiked }
            : p
        ))
      }
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  const fetchComments = async (postId: string) => {
    try {
      setLoadingComments(prev => new Set(prev).add(postId))
      const response = await fetch(`/api/community/posts/${postId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(prev => ({ ...prev, [postId]: data.comments }))
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoadingComments(prev => {
        const next = new Set(prev)
        next.delete(postId)
        return next
      })
    }
  }

  const toggleComments = async (postId: string) => {
    const isExpanded = expandedComments.has(postId)
    
    if (isExpanded) {
      setExpandedComments(prev => {
        const next = new Set(prev)
        next.delete(postId)
        return next
      })
    } else {
      setExpandedComments(prev => new Set(prev).add(postId))
      if (!comments[postId]) {
        await fetchComments(postId)
      }
    }
  }

  const handleAddComment = async (postId: string) => {
    const content = newCommentContent[postId]
    if (!content || content.trim().length === 0) return

    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() })
      })

      if (response.ok) {
        const data = await response.json()
        setComments(prev => ({
          ...prev,
          [postId]: [data.comment, ...(prev[postId] || [])]
        }))
        setNewCommentContent(prev => ({ ...prev, [postId]: '' }))
        
        // Update comment count
        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, commentCount: p.commentCount + 1 }
            : p
        ))
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const handleEditComment = async (postId: string, commentId: string) => {
    if (!editCommentContent.trim()) return

    try {
      const response = await fetch(`/api/community/posts/${postId}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editCommentContent.trim() })
      })

      if (response.ok) {
        const data = await response.json()
        setComments(prev => ({
          ...prev,
          [postId]: prev[postId].map(c => c.id === commentId ? data.comment : c)
        }))
        setEditingComment(null)
        setEditCommentContent('')
      }
    } catch (error) {
      console.error('Error editing comment:', error)
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
        
        // Update comment count
        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, commentCount: p.commentCount - 1 }
            : p
        ))
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const startEditComment = (commentId: string, content: string) => {
    setEditingComment(commentId)
    setEditCommentContent(content)
  }

  const cancelEditComment = () => {
    setEditingComment(null)
    setEditCommentContent('')
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
                          onClick={() => handleLike(post.id)}
                          className={`text-forest hover:text-rust ${post.isLiked ? 'text-rust' : ''}`}
                        >
                          <Heart className={`w-4 h-4 mr-1 ${post.isLiked ? 'fill-rust' : ''}`} />
                          {post.likeCount > 0 ? post.likeCount : 'Like'}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => toggleComments(post.id)}
                          className="text-forest hover:text-rust"
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          {post.commentCount > 0 ? `${post.commentCount} ${post.commentCount === 1 ? 'Comment' : 'Comments'}` : 'Comment'}
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
                    {expandedComments.has(post.id) && (
                      <div className="mt-6 pt-6 border-t-2 border-sepia">
                        {/* Add Comment Form */}
                        <div className="mb-4">
                          <Textarea
                            placeholder="Write a comment..."
                            value={newCommentContent[post.id] || ''}
                            onChange={(e) => setNewCommentContent(prev => ({ ...prev, [post.id]: e.target.value }))}
                            className="font-serif border-2 border-ink focus:border-rust resize-none"
                            rows={3}
                          />
                          <div className="flex justify-end mt-2">
                            <Button
                              onClick={() => handleAddComment(post.id)}
                              disabled={!newCommentContent[post.id]?.trim()}
                              className="btn-vintage text-xs"
                            >
                              Post Comment
                            </Button>
                          </div>
                        </div>

                        {/* Comments List */}
                        <div className="space-y-4">
                          {loadingComments.has(post.id) ? (
                            <div className="text-center py-4">
                              <div className="animate-pulse text-forest font-serif">Loading comments...</div>
                            </div>
                          ) : comments[post.id]?.length > 0 ? (
                            comments[post.id].map((comment) => (
                              <div key={comment.id} className="bg-sepia/30 rounded p-4 border border-ink/10">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-typewriter text-ink font-semibold text-sm">
                                        {comment.user.firstName && comment.user.lastName
                                          ? `${comment.user.firstName} ${comment.user.lastName}`
                                          : comment.user.name || 'Anonymous'}
                                      </span>
                                      <span className="text-xs text-forest font-serif">
                                        {formatDate(comment.createdAt)}
                                        {comment.createdAt !== comment.updatedAt && ' (edited)'}
                                      </span>
                                    </div>
                                    {editingComment === comment.id ? (
                                      <div className="mt-2">
                                        <Textarea
                                          value={editCommentContent}
                                          onChange={(e) => setEditCommentContent(e.target.value)}
                                          className="font-serif border-2 border-ink focus:border-rust resize-none mb-2"
                                          rows={3}
                                        />
                                        <div className="flex gap-2">
                                          <Button
                                            size="sm"
                                            onClick={() => handleEditComment(post.id, comment.id)}
                                            className="btn-vintage text-xs"
                                          >
                                            <Check className="w-3 h-3 mr-1" />
                                            Save
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={cancelEditComment}
                                            className="text-xs"
                                          >
                                            <X className="w-3 h-3 mr-1" />
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="font-serif text-forest text-sm leading-relaxed">
                                        {comment.content}
                                      </p>
                                    )}
                                  </div>
                                  {comment.isOwner && editingComment !== comment.id && (
                                    <div className="flex gap-2 ml-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => startEditComment(comment.id, comment.content)}
                                        className="text-forest hover:text-rust p-1 h-auto"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteComment(post.id, comment.id)}
                                        className="text-forest hover:text-rust p-1 h-auto"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-4">
                              <p className="font-serif text-forest text-sm">No comments yet. Be the first to comment!</p>
                            </div>
                          )}
                        </div>
                      </div>
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
