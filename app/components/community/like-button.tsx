
'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface LikeButtonProps {
  postId: string
  className?: string
}

export function LikeButton({ postId, className = '' }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchLikeStatus()
  }, [postId])

  const fetchLikeStatus = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`)
      if (response.ok) {
        const data = await response.json()
        setIsLiked(data.isLiked)
        setLikeCount(data.likeCount)
      }
    } catch (error) {
      console.error('Error fetching like status:', error)
    }
  }

  const handleLikeToggle = async () => {
    if (isLoading) return

    setIsLoading(true)
    const previousIsLiked = isLiked
    const previousLikeCount = likeCount

    // Optimistic update
    setIsLiked(!isLiked)
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1)

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setIsLiked(data.liked)
        // Fetch the updated count to ensure accuracy
        fetchLikeStatus()
      } else {
        // Revert on error
        setIsLiked(previousIsLiked)
        setLikeCount(previousLikeCount)
        toast({
          title: 'Error',
          description: 'Failed to update like. Please try again.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      // Revert on error
      setIsLiked(previousIsLiked)
      setLikeCount(previousLikeCount)
      toast({
        title: 'Error',
        description: 'Failed to update like. Please try again.',
        variant: 'destructive'
      })
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
      className={`text-forest hover:text-rust transition-colors ${className}`}
    >
      <Heart
        className={`w-4 h-4 mr-1 transition-all ${
          isLiked ? 'fill-rust text-rust' : ''
        }`}
      />
      <span className="font-typewriter">
        {likeCount > 0 ? likeCount : 'Like'}
      </span>
    </Button>
  )
}
