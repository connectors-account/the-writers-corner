'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LikeButtonProps {
  postId: string
  initialLikeCount?: number
  initialLiked?: boolean
}

export function LikeButton({ postId, initialLikeCount = 0, initialLiked = false }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Fetch initial like status
  useEffect(() => {
    const fetchLikeStatus = async () => {
      try {
        const response = await fetch(`/api/posts/${postId}/likes`)
        if (response.ok) {
          const data = await response.json()
          setLiked(data.userLiked)
          setLikeCount(data.likeCount)
        }
      } catch (error) {
        console.error('Error fetching like status:', error)
      } finally {
        setInitialized(true)
      }
    }

    fetchLikeStatus()
  }, [postId])

  const toggleLike = async () => {
    if (loading) return

    setLoading(true)
    
    // Optimistic update
    const newLiked = !liked
    const newCount = newLiked ? likeCount + 1 : likeCount - 1
    setLiked(newLiked)
    setLikeCount(newCount)

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setLiked(data.liked)
        setLikeCount(data.likeCount)
      } else {
        // Revert on error
        setLiked(liked)
        setLikeCount(likeCount)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      // Revert on error
      setLiked(!newLiked)
      setLikeCount(newLiked ? newCount - 1 : newCount + 1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLike}
      disabled={loading || !initialized}
      className={cn(
        "text-forest hover:text-rust transition-colors",
        liked && "text-rust"
      )}
    >
      <Heart
        className={cn(
          "w-4 h-4 mr-1 transition-all",
          liked && "fill-rust"
        )}
      />
      {likeCount > 0 ? likeCount : ''} {likeCount === 1 ? 'Like' : likeCount > 1 ? 'Likes' : 'Like'}
    </Button>
  )
}
