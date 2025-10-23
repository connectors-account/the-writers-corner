
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import toast from 'react-hot-toast'

interface PostLikeButtonProps {
  postId: string
  initialLiked?: boolean
  initialLikeCount?: number
}

export function PostLikeButton({ 
  postId, 
  initialLiked = false, 
  initialLikeCount = 0 
}: PostLikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [isLoading, setIsLoading] = useState(false)

  const handleLikeToggle = async () => {
    setIsLoading(true)
    
    // Optimistic update
    const previousLiked = isLiked
    const previousCount = likeCount
    
    setIsLiked(!isLiked)
    setLikeCount(prev => isLiked ? Math.max(0, prev - 1) : prev + 1)

    try {
      const response = await fetch(`/api/community/posts/${postId}/like`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setIsLiked(data.liked)
        setLikeCount(data.likeCount)
      } else {
        // Revert on error
        setIsLiked(previousLiked)
        setLikeCount(previousCount)
        toast.error('Failed to update like')
      }
    } catch (error) {
      // Revert on error
      setIsLiked(previousLiked)
      setLikeCount(previousCount)
      console.error('Error toggling like:', error)
      toast.error('Error updating like')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLikeToggle}
      disabled={isLoading}
      className={`font-typewriter ${
        isLiked 
          ? 'text-rust hover:text-rust/80' 
          : 'text-forest hover:text-rust'
      }`}
    >
      <Heart 
        className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} 
      />
      {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
    </Button>
  )
}
