
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'

interface LikeButtonProps {
  submissionId: string
  initialLikeCount?: number
  initialLiked?: boolean
}

export function LikeButton({ submissionId, initialLikeCount = 0, initialLiked = false }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Fetch initial like status
    fetchLikeStatus()
  }, [submissionId])

  const fetchLikeStatus = async () => {
    try {
      const response = await fetch(`/api/submissions/${submissionId}/likes`)
      if (response.ok) {
        const data = await response.json()
        setLiked(data.liked)
        setLikeCount(data.likeCount)
      }
    } catch (error) {
      console.error('Error fetching like status:', error)
    }
  }

  const handleLikeToggle = async () => {
    if (loading) return

    setLoading(true)
    try {
      const response = await fetch(`/api/submissions/${submissionId}/like`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setLiked(data.liked)
        setLikeCount(data.likeCount)
        toast.success(data.liked ? 'Post liked!' : 'Like removed')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update like')
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      toast.error('Failed to update like')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`text-forest hover:text-rust ${liked ? 'text-rust' : ''}`}
      onClick={handleLikeToggle}
      disabled={loading}
    >
      <Heart
        className={`w-4 h-4 mr-1 ${liked ? 'fill-rust' : ''}`}
      />
      {likeCount > 0 ? likeCount : 'Like'}
    </Button>
  )
}
