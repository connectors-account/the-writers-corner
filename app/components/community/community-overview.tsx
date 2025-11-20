
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Users, PenTool, BookOpen, Heart, MessageCircle, Filter, Search, Edit, Trash2, Send } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { toast } from 'sonner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

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

export function CommunityOverview() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [topicFilter, setTopicFilter] = useState('all')
  
  // Like states
  const [likes, setLikes] = useState<Record<string, { count: number; liked: boolean }>>({})
  const [likingPosts, setLikingPosts] = useState<Record<string, boolean>>({})
  
  // Comment states
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [showComments, setShowComments] = useState<Record<string, boolean>>({})
  const [commentText, setCommentText] = useState<Record<string, string>>({})
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({})
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editCommentText, setEditCommentText] = useState('')
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null)

  useEffect(() => {
    fetchCommunityPosts()
  }, [])

  const fetchCommunityPosts = async () => {
    try {
      const response = await fetch('/api/community/posts')
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
        
        // Fetch likes for all posts
        data.posts.forEach((post: CommunityPost) => {
          fetchLikes(post.id)
        })
      }
    } catch (error) {
      console.error('Error fetching community posts:', error)
      toast.error('Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  const fetchLikes = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/likes`)
      if (response.ok) {
        const data = await response.json()
        setLikes(prev => ({
          ...prev,
          [postId]: { count: data.count, liked: data.liked }
        }))
      }
    } catch (error) {
      console.error('Error fetching likes:', error)
    }
  }

  const toggleLike = async (postId: string) => {
    setLikingPosts(prev => ({ ...prev, [postId]: true }))
    
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Update likes state
        setLikes(prev => {
          const current = prev[postId] || { count: 0, liked: false }
          return {
            ...prev,
            [postId]: {
              count: data.liked ? current.count + 1 : current.count - 1,
              liked: data.liked
            }
          }
        })
      } else {
        toast.error('Failed to toggle like')
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      toast.error('Failed to toggle like')
    } finally {
      setLikingPosts(prev => ({ ...prev, [postId]: false }))
    }
  }

  const toggleComments = async (postId: string) => {
    const isCurrentlyShown = showComments[postId]
    
    setShowComments(prev => ({
      ...prev,
      [postId]: !isCurrentlyShown
    }))
    
    // Fetch comments if showing and not already loaded
    if (!isCurrentlyShown && !comments[postId]) {
      await fetchComments(postId)
    }
  }

  const fetchComments = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(prev => ({
          ...prev,
          [postId]: data.comments
        }))
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
      toast.error('Failed to load comments')
    }
  }

  const submitComment = async (postId: string) => {
    const content = commentText[postId]?.trim()
    
    if (!content) {
      toast.error('Please enter a comment')
      return
    }
    
    setSubmittingComment(prev => ({ ...prev, [postId]: true }))
    
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
        
        // Add new comment to state
        setComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), data.comment]
        }))
        
        // Clear input
        setCommentText(prev => ({ ...prev, [postId]: '' }))
        
        toast.success('Comment posted successfully')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to post comment')
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
      toast.error('Failed to post comment')
    } finally {
      setSubmittingComment(prev => ({ ...prev, [postId]: false }))
    }
  }

  const startEditComment = (comment: Comment) => {
    setEditingComment(comment.id)
    setEditCommentText(comment.content)
  }

  const cancelEditComment = () => {
    setEditingComment(null)
    setEditCommentText('')
  }

  const updateComment = async (commentId: string, postId: string) => {
    const content = editCommentText.trim()
    
    if (!content) {
      toast.error('Comment cannot be empty')
      return
    }
    
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Update comment in state
        setComments(prev => ({
          ...prev,
          [postId]: prev[postId].map(c => 
            c.id === commentId ? data.comment : c
          )
        }))
        
        cancelEditComment()
        toast.success('Comment updated successfully')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update comment')
      }
    } catch (error) {
      console.error('Error updating comment:', error)
      toast.error('Failed to update comment')
    }
  }

  const deleteComment = async (commentId: string, postId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Remove comment from state
        setComments(prev => ({
          ...prev,
          [postId]: prev[postId].filter(c => c.id !== commentId)
        }))
        
        toast.success('Comment deleted successfully')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete comment')
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('Failed to delete comment')
    } finally {
      setDeleteCommentId(null)
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getUserName = (user: { firstName?: string; lastName?: string; name?: string; id?: string }) => {
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
                {new Set(posts.map(p => getUserName(p.user))).size}
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
              const postLikes = likes[post.id] || { count: 0, liked: false }
              const postComments = comments[post.id] || []
              const isCommentsShown = showComments[post.id]
              
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
                      
                      <div className="flex items-center justify-between border-t pt-4">
                        <div className="flex items-center gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`${postLikes.liked ? 'text-rust' : 'text-forest'} hover:text-rust transition-colors`}
                            onClick={() => toggleLike(post.id)}
                            disabled={likingPosts[post.id]}
                          >
                            <Heart className={`w-4 h-4 mr-1 ${postLikes.liked ? 'fill-rust' : ''}`} />
                            {postLikes.count > 0 && <span>{postLikes.count}</span>}
                            {postLikes.count === 0 && 'Like'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-forest hover:text-rust"
                            onClick={() => toggleComments(post.id)}
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            {postComments.length > 0 && <span>{postComments.length}</span>}
                            {postComments.length === 0 && 'Comment'}
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
                      {isCommentsShown && (
                        <div className="mt-6 pt-6 border-t space-y-4">
                          <h4 className="font-typewriter font-semibold text-ink mb-4">
                            Comments ({postComments.length})
                          </h4>
                          
                          {/* Comment Form */}
                          <div className="flex gap-2">
                            <Textarea
                              placeholder="Share your thoughts..."
                              value={commentText[post.id] || ''}
                              onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                              className="font-serif border-2 border-ink focus:border-rust resize-none"
                              rows={3}
                            />
                            <Button
                              onClick={() => submitComment(post.id)}
                              disabled={submittingComment[post.id] || !commentText[post.id]?.trim()}
                              className="btn-vintage self-end"
                              size="sm"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Comments List */}
                          <div className="space-y-3">
                            {postComments.map((comment) => (
                              <div key={comment.id} className="bg-sepia/30 p-4 rounded-sm border border-ink/20">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <span className="font-typewriter font-semibold text-ink text-sm">
                                      {getUserName(comment.user)}
                                    </span>
                                    <span className="text-xs text-forest ml-2">
                                      {formatDateTime(comment.createdAt)}
                                      {comment.updatedAt !== comment.createdAt && ' (edited)'}
                                    </span>
                                  </div>
                                  
                                  {/* Edit/Delete buttons - show only for comment author */}
                                  {session?.user?.id === comment.user.id && (
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-forest hover:text-rust"
                                        onClick={() => startEditComment(comment)}
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-forest hover:text-rust"
                                        onClick={() => setDeleteCommentId(comment.id)}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                
                                {editingComment === comment.id ? (
                                  <div className="space-y-2">
                                    <Textarea
                                      value={editCommentText}
                                      onChange={(e) => setEditCommentText(e.target.value)}
                                      className="font-serif text-sm border-2 border-ink focus:border-rust"
                                      rows={3}
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => updateComment(comment.id, post.id)}
                                        className="btn-vintage text-xs"
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={cancelEditComment}
                                        className="text-xs"
                                      >
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
                            ))}
                          </div>
                        </div>
                      )}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteCommentId} onOpenChange={() => setDeleteCommentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-typewriter">Delete Comment</AlertDialogTitle>
            <AlertDialogDescription className="font-serif">
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-typewriter">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const postId = Object.keys(comments).find(pid => 
                  comments[pid].some(c => c.id === deleteCommentId)
                )
                if (postId && deleteCommentId) {
                  deleteComment(deleteCommentId, postId)
                }
              }}
              className="bg-rust hover:bg-rust/90 font-typewriter"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
