'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface PostLikeButtonProps {
  postId: string
}

export function PostLikeButton({ postId }: PostLikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchLikeStatus()
  }, [postId])

  const fetchLikeStatus = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/likes`)
      if (response.ok) {
        const data = await response.json()
        setLikeCount(data.count)
        setIsLiked(data.isLiked)
      }
    } catch (error) {
      console.error('Error fetching like status:', error)
    }
  }

  const handleLikeToggle = async () => {
    if (loading) return

    setLoading(true)
    const previousIsLiked = isLiked
    const previousCount = likeCount

    // Optimistic update
    setIsLiked(!isLiked)
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1)

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: isLiked ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        // Revert on error
        setIsLiked(previousIsLiked)
        setLikeCount(previousCount)
        
        const error = await response.json()
        toast.error(error.error || 'Failed to update like')
      } else {
        toast.success(isLiked ? 'Like removed' : 'Post liked!')
      }
    } catch (error) {
      // Revert on error
      setIsLiked(previousIsLiked)
      setLikeCount(previousCount)
      toast.error('Failed to update like')
      console.error('Error toggling like:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLikeToggle}
      disabled={loading}
      className={`text-forest hover:text-rust transition-colors ${
        isLiked ? 'text-rust' : ''
      }`}
    >
      <Heart
        className={`w-4 h-4 mr-1 transition-all ${
          isLiked ? 'fill-current' : ''
        }`}
      />
      <span>{likeCount > 0 ? likeCount : 'Like'}</span>
    </Button>
  )
}
