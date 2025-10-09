
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Heart, MessageCircle, ArrowLeft, Send } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

interface Comment {
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

interface Post {
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
  likesCount: number
  commentsCount: number
  isLikedByCurrentUser: boolean
}

interface PostDetailProps {
  postId: string
}

export function PostDetail({ postId }: PostDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [commenting, setCommenting] = useState(false)
  const [liking, setLiking] = useState(false)
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    fetchPostAndComments()
  }, [postId])

  const fetchPostAndComments = async () => {
    try {
      // Fetch post details from the posts list
      const postsResponse = await fetch('/api/community/posts')
      if (postsResponse.ok) {
        const postsData = await postsResponse.json()
        const foundPost = postsData.posts.find((p: Post) => p.id === postId)
        if (foundPost) {
          setPost(foundPost)
        }
      }

      // Fetch comments
      const commentsResponse = await fetch(`/api/community/posts/${postId}/comments`)
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json()
        setComments(commentsData.comments || [])
      }
    } catch (error) {
      console.error('Error fetching post details:', error)
      toast({
        title: 'Error',
        description: 'Failed to load post details',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!post || liking) return

    setLiking(true)
    try {
      const method = post.isLikedByCurrentUser ? 'DELETE' : 'POST'
      const response = await fetch(`/api/community/posts/${postId}/like`, {
        method
      })

      if (response.ok) {
        const data = await response.json()
        setPost({
          ...post,
          likesCount: data.likesCount,
          isLikedByCurrentUser: !post.isLikedByCurrentUser
        })
        toast({
          title: post.isLikedByCurrentUser ? 'Like removed' : 'Post liked!',
          description: post.isLikedByCurrentUser 
            ? 'You unliked this post' 
            : 'You liked this post',
        })
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      toast({
        title: 'Error',
        description: 'Failed to update like',
        variant: 'destructive'
      })
    } finally {
      setLiking(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || commenting) return

    setCommenting(true)
    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newComment })
      })

      if (response.ok) {
        const data = await response.json()
        setComments([...comments, data.comment])
        if (post) {
          setPost({
            ...post,
            commentsCount: post.commentsCount + 1
          })
        }
        setNewComment('')
        toast({
          title: 'Comment added!',
          description: 'Your comment has been posted'
        })
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive'
      })
    } finally {
      setCommenting(false)
    }
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

  const getUserName = (user: { firstName?: string; lastName?: string; name?: string }) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    return user.name || 'Anonymous Writer'
  }

  if (loading) {
    return (
      <section className="py-12 px-4 paper-texture min-h-screen">
        <div className="max-w-3xl mx-auto text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-sepia rounded w-1/2 mx-auto mb-4"></div>
            <div className="h-4 bg-sepia rounded w-1/3 mx-auto"></div>
          </div>
        </div>
      </section>
    )
  }

  if (!post) {
    return (
      <section className="py-12 px-4 paper-texture min-h-screen">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-typewriter font-bold text-ink mb-4">
            Post not found
          </h2>
          <Link href="/community">
            <Button className="btn-vintage">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Community
            </Button>
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 px-4 paper-texture min-h-screen">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <Link href="/community">
          <Button variant="ghost" className="mb-6 text-forest hover:text-rust">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Community
          </Button>
        </Link>

        {/* Post Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="card-vintage border-2 mb-8">
            <CardHeader>
              <CardTitle className="font-typewriter text-ink text-2xl mb-4">
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
                <p className="text-sm font-serif text-forest">
                  From exercise: <span className="font-semibold">{post.exercise.title}</span>
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="font-serif text-forest leading-relaxed whitespace-pre-wrap mb-6">
                {post.content}
              </div>

              <div className="flex items-center gap-4 pt-4 border-t-2 border-sepia">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLike}
                  disabled={liking}
                  className={`${post.isLikedByCurrentUser ? 'text-rust' : 'text-forest'} hover:text-rust`}
                >
                  <Heart className={`w-4 h-4 mr-1 ${post.isLikedByCurrentUser ? 'fill-current' : ''}`} />
                  {post.likesCount} {post.likesCount === 1 ? 'Like' : 'Likes'}
                </Button>
                <div className="flex items-center text-forest">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  {post.commentsCount} {post.commentsCount === 1 ? 'Comment' : 'Comments'}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Add Comment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="card-vintage border-2 mb-8">
            <CardHeader>
              <CardTitle className="font-typewriter text-ink flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Add a Comment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Share your thoughts..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="font-serif border-2 border-ink focus:border-rust min-h-[100px] mb-4"
              />
              <Button 
                onClick={handleAddComment}
                disabled={!newComment.trim() || commenting}
                className="btn-vintage"
              >
                <Send className="w-4 h-4 mr-2" />
                {commenting ? 'Posting...' : 'Post Comment'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Comments List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h3 className="text-2xl font-typewriter font-bold text-ink mb-6">
            Comments ({comments.length})
          </h3>
          
          {comments.length === 0 ? (
            <Card className="card-vintage border-2">
              <CardContent className="py-8 text-center">
                <MessageCircle className="w-12 h-12 text-forest mx-auto mb-4 opacity-50" />
                <p className="font-serif text-forest">
                  No comments yet. Be the first to share your thoughts!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {comments.map((comment, index) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className="card-vintage border-2">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3 mb-3">
                        <Badge className="bg-rust/20 text-rust font-typewriter">
                          {getUserName(comment.user)}
                        </Badge>
                        <span className="text-sm font-serif text-forest">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="font-serif text-forest leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
