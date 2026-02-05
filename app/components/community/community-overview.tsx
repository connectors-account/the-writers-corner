'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog'
import { Users, PenTool, BookOpen, Heart, MessageCircle, Filter, Search, Trash2, X, Send, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

interface PostComment {
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
  const { data: session } = useSession()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [topicFilter, setTopicFilter] = useState('all')
  
  // Comment dialog state
  const [commentDialogOpen, setCommentDialogOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null)
  const [comments, setComments] = useState<PostComment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set())

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
    if (likingPosts.has(postId)) return
    
    setLikingPosts(prev => new Set([...prev, postId]))
    
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
        
        // Update selected post if in comment dialog
        if (selectedPost?.id === postId) {
          setSelectedPost(prev => prev 
            ? { ...prev, isLiked: data.liked, likeCount: data.likeCount }
            : null
          )
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    } finally {
      setLikingPosts(prev => {
        const newSet = new Set(prev)
        newSet.delete(postId)
        return newSet
      })
    }
  }

  const openCommentDialog = async (post: CommunityPost) => {
    setSelectedPost(post)
    setCommentDialogOpen(true)
    setLoadingComments(true)
    setNewComment('')
    
    try {
      const response = await fetch(`/api/community/posts/${post.id}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!selectedPost || !newComment.trim() || submittingComment) return
    
    if (newComment.trim().length > MAX_COMMENT_LENGTH) {
      return
    }
    
    setSubmittingComment(true)
    
    try {
      const response = await fetch(`/api/community/posts/${selectedPost.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newComment.trim() })
      })
      
      if (response.ok) {
        const data = await response.json()
        setComments(prev => [data.comment, ...prev])
        setNewComment('')
        
        // Update comment count in posts
        setPosts(prev => prev.map(post => 
          post.id === selectedPost.id 
            ? { ...post, commentCount: post.commentCount + 1 }
            : post
        ))
        setSelectedPost(prev => prev 
          ? { ...prev, commentCount: prev.commentCount + 1 }
          : null
        )
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedPost) return
    
    try {
      const response = await fetch(`/api/community/posts/${selectedPost.id}/comments/${commentId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId))
        
        // Update comment count
        setPosts(prev => prev.map(post => 
          post.id === selectedPost.id 
            ? { ...post, commentCount: Math.max(0, post.commentCount - 1) }
            : post
        ))
        setSelectedPost(prev => prev 
          ? { ...prev, commentCount: Math.max(0, prev.commentCount - 1) }
          : null
        )
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
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
                      <div className="flex items-center gap-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`${post.isLiked ? 'text-rust' : 'text-forest'} hover:text-rust transition-colors`}
                          onClick={() => handleLike(post.id)}
                          disabled={likingPosts.has(post.id)}
                        >
                          <Heart 
                            className={`w-4 h-4 mr-1 ${post.isLiked ? 'fill-rust' : ''}`} 
                          />
                          {post.likeCount > 0 ? post.likeCount : ''} {post.likeCount === 1 ? 'Like' : 'Likes'}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-forest hover:text-rust"
                          onClick={() => openCommentDialog(post)}
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

      {/* Comment Dialog */}
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-typewriter text-ink">
              {selectedPost?.title || 'Comments'}
            </DialogTitle>
            <DialogDescription className="font-serif text-forest">
              by {selectedPost && getUserDisplayName(selectedPost.user)}
            </DialogDescription>
          </DialogHeader>
          
          {/* Post preview */}
          <div className="bg-sepia/30 p-4 rounded-sm border border-ink/20 mb-4">
            <p className="font-serif text-forest text-sm leading-relaxed">
              {selectedPost && getExcerpt(selectedPost.content, 300)}
            </p>
          </div>

          {/* Like button in dialog */}
          {selectedPost && (
            <div className="flex items-center gap-4 mb-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`${selectedPost.isLiked ? 'text-rust' : 'text-forest'} hover:text-rust transition-colors`}
                onClick={() => handleLike(selectedPost.id)}
                disabled={likingPosts.has(selectedPost.id)}
              >
                <Heart 
                  className={`w-4 h-4 mr-1 ${selectedPost.isLiked ? 'fill-rust' : ''}`} 
                />
                {selectedPost.likeCount > 0 ? selectedPost.likeCount : ''} {selectedPost.likeCount === 1 ? 'Like' : 'Likes'}
              </Button>
              <span className="text-sm font-serif text-forest">
                {selectedPost.commentCount} {selectedPost.commentCount === 1 ? 'comment' : 'comments'}
              </span>
            </div>
          )}

          {/* Add comment form */}
          <div className="border-t border-ink/20 pt-4">
            <label className="font-typewriter text-ink text-sm block mb-2">Add a comment:</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Textarea
                  placeholder="Share your thoughts..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="font-serif border-2 border-ink focus:border-rust resize-none min-h-[80px]"
                  maxLength={MAX_COMMENT_LENGTH}
                />
                <span className={`absolute bottom-2 right-2 text-xs ${newComment.length > MAX_COMMENT_LENGTH - 50 ? 'text-rust' : 'text-forest/60'}`}>
                  {newComment.length}/{MAX_COMMENT_LENGTH}
                </span>
              </div>
              <Button 
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submittingComment || newComment.length > MAX_COMMENT_LENGTH}
                className="btn-vintage self-end"
              >
                {submittingComment ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Comments list */}
          <div className="flex-1 overflow-y-auto mt-4 border-t border-ink/20 pt-4">
            {loadingComments ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-forest" />
                <p className="font-serif text-forest mt-2">Loading comments...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-8 h-8 text-forest/40 mx-auto mb-2" />
                <p className="font-serif text-forest/60">No comments yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {comments.map((comment) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-parchment p-3 rounded-sm border border-ink/10"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="font-typewriter text-rust text-sm">
                            {getUserDisplayName(comment.user)}
                          </span>
                          <span className="text-forest/60 text-xs ml-2 font-serif">
                            {formatDateTime(comment.createdAt)}
                          </span>
                        </div>
                        {session?.user?.id === comment.user.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-forest/60 hover:text-rust h-6 w-6 p-0"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <p className="font-serif text-forest text-sm leading-relaxed">
                        {comment.content}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
