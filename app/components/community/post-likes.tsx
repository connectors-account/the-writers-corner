'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'

interface PostLikesProps {
  postId: string
  initialCount?: number
}

export function PostLikes({ postId, initialCount = 0 }: PostLikesProps) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Fetch like status on mount
    fetchLikeStatus()
  }, [postId])

  const fetchLikeStatus = async () => {
    try {
      const response = await fetch(`/api/community/posts/${postId}/likes`)
      if (response.ok) {
        const data = await response.json()
        setLiked(data.liked)
        setLikeCount(data.count)
      }
    } catch (error) {
      console.error('Error fetching like status:', error)
    }
  }

  const toggleLike = async () => {
    if (loading) return

    setLoading(true)
    
    // Optimistic update
    const previousLiked = liked
    const previousCount = likeCount
    setLiked(!liked)
    setLikeCount(liked ? likeCount - 1 : likeCount + 1)

    try {
      const response = await fetch(`/api/community/posts/${postId}/likes`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setLiked(data.liked)
        setLikeCount(data.count)
      } else {
        // Revert on error
        setLiked(previousLiked)
        setLikeCount(previousCount)
        toast.error('Failed to update like')
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      // Revert on error
      setLiked(previousLiked)
      setLikeCount(previousCount)
      toast.error('Failed to update like')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLike}
      disabled={loading}
      className={`transition-all ${
        liked 
          ? 'text-rust hover:text-rust/80' 
          : 'text-forest hover:text-rust'
      }`}
    >
      <Heart 
        className={`w-4 h-4 mr-1 transition-all ${
          liked ? 'fill-current' : ''
        }`} 
      />
      {likeCount > 0 ? likeCount : 'Like'}
    </Button>
  )
}
