'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { CommentsSection } from './comments-section'
import { useSession } from 'next-auth/react'

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
    likesCount: number
    commentsCount: number
  }
  index: number
}

export function PostCard({ post, index }: PostCardProps) {
  const { data: session } = useSession()
  const [likesCount, setLikesCount] = useState(post.likesCount)
  const [isLiked, setIsLiked] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentsCount, setCommentsCount] = useState(post.commentsCount)
  const [isLiking, setIsLiking] = useState(false)

  useEffect(() => {
    // Fetch user's like status
    const fetchLikeStatus = async () => {
      try {
        const response = await fetch(`/api/community/posts/${post.id}/likes`)
        if (response.ok) {
          const data = await response.json()
          setIsLiked(data.isLiked)
          setLikesCount(data.count)
        }
      } catch (error) {
        console.error('Error fetching like status:', error)
      }
    }

    if (session?.user?.id) {
      fetchLikeStatus()
    }
  }, [post.id, session])

  const handleLikeToggle = async () => {
    if (!session?.user?.id || isLiking) return

    setIsLiking(true)
    try {
      const method = isLiked ? 'DELETE' : 'POST'
      const response = await fetch(`/api/community/posts/${post.id}/likes`, {
        method
      })

      if (response.ok) {
        const data = await response.json()
        setIsLiked(data.isLiked)
        setLikesCount(data.count)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    } finally {
      setIsLiking(false)
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

  const handleCommentsUpdate = (newCount: number) => {
    setCommentsCount(newCount)
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
                  {post.user?.firstName && post.user?.lastName
                    ? `${post.user.firstName} ${post.user.lastName}`
                    : post.user?.name || 'Anonymous Writer'}
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
                className={`font-serif transition-colors ${
                  isLiked
                    ? 'text-rust hover:text-rust/80'
                    : 'text-forest hover:text-rust'
                }`}
                onClick={handleLikeToggle}
                disabled={isLiking}
              >
                <Heart
                  className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`}
                />
                {likesCount > 0 && <span>{likesCount}</span>}
                {likesCount === 0 && <span>Like</span>}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-forest hover:text-rust font-serif"
                onClick={() => setShowComments(!showComments)}
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                {commentsCount > 0 && <span>{commentsCount}</span>}
                {commentsCount === 0 && <span>Comment</span>}
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

          {showComments && (
            <div className="mt-6 pt-6 border-t-2 border-ink/10">
              <CommentsSection
                postId={post.id}
                onCommentsUpdate={handleCommentsUpdate}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
