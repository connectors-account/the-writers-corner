'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface LikeUser {
  id: string
  firstName?: string
  lastName?: string
  name?: string
}

interface LikeButtonProps {
  postId: string
  initialLikeCount: number
  initialUserLiked: boolean
  onLikeChange?: (liked: boolean, count: number) => void
}

export function LikeButton({
  postId,
  initialLikeCount,
  initialUserLiked,
  onLikeChange
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialUserLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [isLoading, setIsLoading] = useState(false)
  const [showHeart, setShowHeart] = useState(false)
  const [likedUsers, setLikedUsers] = useState<LikeUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const handleLike = async () => {
    if (isLoading) return

    setIsLoading(true)
    
    // Optimistic update
    const newLiked = !liked
    setLiked(newLiked)
    setLikeCount(prev => newLiked ? prev + 1 : prev - 1)
    
    // Show animation on like
    if (newLiked) {
      setShowHeart(true)
      setTimeout(() => setShowHeart(false), 600)
    }

    try {
      const response = await fetch(`/api/community/posts/${postId}/like`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setLiked(data.liked)
        setLikeCount(data.likeCount)
        onLikeChange?.(data.liked, data.likeCount)
      } else {
        // Revert on error
        setLiked(!newLiked)
        setLikeCount(prev => newLiked ? prev - 1 : prev + 1)
      }
    } catch (error) {
      // Revert on error
      setLiked(!newLiked)
      setLikeCount(prev => newLiked ? prev - 1 : prev + 1)
      console.error('Error toggling like:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchLikedUsers = async () => {
    if (likeCount === 0) return
    
    setLoadingUsers(true)
    try {
      const response = await fetch(`/api/community/posts/${postId}/likes`)
      if (response.ok) {
        const data = await response.json()
        setLikedUsers(data.likes.map((l: { user: LikeUser }) => l.user))
      }
    } catch (error) {
      console.error('Error fetching liked users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const getUserDisplayName = (user: LikeUser) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    return user.name || 'Anonymous'
  }

  return (
    <div className="flex items-center gap-1 relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLike}
        disabled={isLoading}
        className={`text-forest hover:text-rust transition-colors ${
          liked ? 'text-rust' : ''
        }`}
      >
        <motion.div
          animate={liked ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.2 }}
        >
          <Heart
            className={`w-4 h-4 mr-1 transition-all ${
              liked ? 'fill-rust text-rust' : ''
            }`}
          />
        </motion.div>
        {likeCount > 0 ? likeCount : 'Like'}
      </Button>

      {/* Floating heart animation */}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ opacity: 1, scale: 0.5, y: 0 }}
            animate={{ opacity: 0, scale: 1.5, y: -30 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute -top-2 left-4 pointer-events-none"
          >
            <Heart className="w-6 h-6 fill-rust text-rust" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show who liked - popover */}
      {likeCount > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              onClick={fetchLikedUsers}
              className="text-xs text-forest hover:text-rust underline cursor-pointer ml-1"
            >
              {likeCount === 1 ? '1 like' : `${likeCount} likes`}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3 bg-parchment border-2 border-ink">
            <h4 className="font-typewriter text-sm font-semibold text-ink mb-2">
              Liked by
            </h4>
            {loadingUsers ? (
              <p className="text-xs text-forest">Loading...</p>
            ) : likedUsers.length > 0 ? (
              <ul className="space-y-1">
                {likedUsers.slice(0, 10).map((user) => (
                  <li key={user.id} className="text-sm font-serif text-forest">
                    {getUserDisplayName(user)}
                  </li>
                ))}
                {likedUsers.length > 10 && (
                  <li className="text-xs text-forest italic">
                    and {likedUsers.length - 10} more...
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-xs text-forest">No likes yet</p>
            )}
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
