
'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface LikeButtonProps {
  submissionId: string
  initialLiked: boolean
  initialCount: number
}

export function LikeButton({ submissionId, initialLiked, initialCount }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  const handleLike = async () => {
    if (loading) return
    
    setLoading(true)
    const previousLiked = liked
    const previousCount = likeCount

    // Optimistic update
    setLiked(!liked)
    setLikeCount(liked ? likeCount - 1 : likeCount + 1)

    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ submissionId })
      })

      if (!response.ok) {
        throw new Error('Failed to toggle like')
      }

      const data = await response.json()
      
      // Update UI based on server response
      if (data.action === 'liked') {
        toast.success('You liked this post')
      } else {
        toast.success('You unliked this post')
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      // Revert optimistic update on error
      setLiked(previousLiked)
      setLikeCount(previousCount)
      toast.error('Failed to update like. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className={`text-forest hover:text-rust ${liked ? 'text-rust' : ''}`}
      onClick={handleLike}
      disabled={loading}
    >
      <Heart 
        className={`w-4 h-4 mr-1 ${liked ? 'fill-current' : ''}`}
      />
      {likeCount > 0 && <span className="ml-1">{likeCount}</span>}
      <span className="ml-1">{liked ? 'Liked' : 'Like'}</span>
    </Button>
  )
}
