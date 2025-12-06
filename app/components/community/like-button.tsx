'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface LikeButtonProps {
  postId: string
  initialLiked: boolean
  initialCount: number
}

export function LikeButton({ postId, initialLiked, initialCount }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  const handleToggleLike = async () => {
    if (loading) return

    setLoading(true)
    const previousLiked = liked
    const previousCount = count

    // Optimistic update
    setLiked(!liked)
    setCount(liked ? count - 1 : count + 1)

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to toggle like')
      }

      const data = await response.json()
      
      // Update with actual state from server
      setLiked(data.liked)
      
      // Refresh the count from server to ensure accuracy
      const likesResponse = await fetch(`/api/posts/${postId}/likes`)
      if (likesResponse.ok) {
        const likesData = await likesResponse.json()
        setCount(likesData.count)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      toast.error('Failed to update like. Please try again.')
      // Revert on error
      setLiked(previousLiked)
      setCount(previousCount)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`text-forest hover:text-rust ${liked ? 'text-rust' : ''}`}
      onClick={handleToggleLike}
      disabled={loading}
    >
      <Heart
        className={`w-4 h-4 mr-1 ${liked ? 'fill-rust' : ''}`}
      />
      <span className="font-typewriter">{count}</span>
    </Button>
  )
}
