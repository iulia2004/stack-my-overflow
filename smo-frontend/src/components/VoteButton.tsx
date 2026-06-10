import { useState } from 'react'
import './VoteButton.css'

interface VoteButtonProps {
  count: number
  onVote: (value: 1 | -1) => Promise<void>
  disabled?: boolean
}

export function VoteButton({ count, onVote, disabled }: VoteButtonProps) {
  const [displayCount, setDisplayCount] = useState(count)
  const [isVoting, setIsVoting] = useState(false)

  const handleVote = async (value: 1 | -1) => {
    if (isVoting || disabled) return

    const previousCount = displayCount

    setDisplayCount((prev) => prev + value)
    setIsVoting(true)

    try {
      await onVote(value)
    } catch (error) {
      setDisplayCount(previousCount)
      console.error('Vote failed:', error)
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <div className="vote-button">
      <button
        onClick={() => handleVote(1)}
        disabled={isVoting || disabled}
        className="vote-btn upvote"
        title="Upvote"
      >
        👍
      </button>
      <span className="vote-count">{displayCount}</span>
      <button
        onClick={() => handleVote(-1)}
        disabled={isVoting || disabled}
        className="vote-btn downvote"
        title="Downvote"
      >
        👎
      </button>
    </div>
  )
}
