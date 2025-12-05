'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

interface LikeButtonProps {
  postId: string
}

export function LikeButton({ postId }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchLikes()
  }, [postId])

  const fetchLikes = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/likes`)
      if (response.ok) {
        const data = await response.json()
        setIsLiked(data.isLiked)
        setLikeCount(data.likeCount)
      }
    } catch (error) {
      console.error('Error fetching likes:', error)
    }
  }

  const toggleLike = async () => {
    if (isLoading) return

    setIsLoading(true)
    
    // Optimistic update
    const previousIsLiked = isLiked
    const previousLikeCount = likeCount
    
    setIsLiked(!isLiked)
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1)

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST'
      })

      if (!response.ok) {
        // Revert on error
        setIsLiked(previousIsLiked)
        setLikeCount(previousLikeCount)
        toast.error('Failed to update like')
      }
    } catch (error) {
      // Revert on error
      setIsLiked(previousIsLiked)
      setLikeCount(previousLikeCount)
      console.error('Error toggling like:', error)
      toast.error('Failed to update like')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className={`text-forest hover:text-rust transition-colors ${isLiked ? 'text-rust' : ''}`}
      onClick={toggleLike}
      disabled={isLoading}
    >
      <Heart 
        className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`}
      />
      {likeCount > 0 ? likeCount : 'Like'}
    </Button>
  )
}
