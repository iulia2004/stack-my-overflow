import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { TagPill } from '../components/TagPill'
import { VoteButton } from '../components/VoteButton'
import { useAuth } from '../hooks/useAuth'
import { questionApi, answerApi, commentApi } from '../lib/api'
import type { Question, Answer as AnswerType, Comment } from '../types'
import './QuestionDetails.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export function QuestionDetails() {
  const { id } = useParams<{ id: string }>()
  const { user, isLoggedIn } = useAuth()

  const [question, setQuestion] = useState<Question | null>(null)
  const [answers, setAnswers] = useState<AnswerType[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [answerBody, setAnswerBody] = useState('')
  const [commentBody, setCommentBody] = useState('')
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadQuestion = async () => {
    if (!id) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/questions/${id}`)

      if (!response.ok) {
        throw new Error('Question not found')
      }

      const data = await response.json()

      setQuestion({
        ...data,
        question_tags: data.question_tags || [],
        answers: data.answers || [],
        comments: data.comments || [],
      })

      setAnswers(data.answers || [])
      setComments(data.comments || [])
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load question'
      console.error(errorMsg, err)
      setError(errorMsg)
      setQuestion(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuestion()
  }, [id])

  const handleVoteQuestion = async (value: 1 | -1) => {
    if (!question) return
    const response = await questionApi.voteQuestion(question.id, value)
    setQuestion({
      ...question,
      vote_count: response.vote_count,
    })
  }

  const handleVoteAnswer = async (answerId: string, value: 1 | -1) => {
    const response = await answerApi.voteAnswer(answerId, value)
    setAnswers(
      answers.map((a) =>
        a.id === answerId ? { ...a, vote_count: response.vote_count } : a
      )
    )
  }

  const handlePostAnswer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question || !answerBody.trim()) return

    setIsSubmittingAnswer(true)
    setError(null)

    try {
      const newAnswer = await answerApi.postAnswer(question.id, answerBody)
      setAnswers([newAnswer, ...answers])
      setAnswerBody('')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to post answer'
      setError(errorMsg)
    } finally {
      setIsSubmittingAnswer(false)
    }
  }

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question || !commentBody.trim()) return

    setIsSubmittingComment(true)
    setError(null)

    try {
      const newComment = await commentApi.postComment(question.id, 'question', commentBody)
      setComments([...comments, newComment])
      setCommentBody('')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to post comment'
      setError(errorMsg)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleAcceptAnswer = async (answerId: string) => {
    if (!question) return

    setError(null)

    try {
      const updatedAnswer = await answerApi.acceptAnswer(answerId)
      setAnswers(
        answers.map((a) =>
          a.id === answerId ? { ...a, is_accepted: true } : a
        )
      )
      setQuestion({ ...question, is_solved: true })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to accept answer'
      setError(errorMsg)
    }
  }

  if (loading) {
    return (
      <div className="question-details-page">
        <p>Loading...</p>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="question-details-page">
        <div className="question-details-navbar">
          <Link className="navbar-brand" to="/">
            <span className="navbar-logo">#</span>
            <span>Stack My Overflow</span>
          </Link>
        </div>

        <div className="question-details-card">
          <h1>Question not found</h1>
          <p>{error || 'The question you requested does not exist.'}</p>

          <Link className="button-link" to="/">
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  const tags = question.question_tags?.map((qt) => qt.tag.name) || []

  return (
    <div className="question-details-page">
      <div className="question-details-navbar">
        <Link className="navbar-brand" to="/">
          <span className="navbar-logo">#</span>
          <span>Stack My Overflow</span>
        </Link>
      </div>

      <div className="question-details-card">
        {error && <div className="error-message">{error}</div>}

        <div className="question-detail-header">
          <h1>{question.title}</h1>

          <span className={`status-pill ${question.is_solved ? 'solved' : 'unanswered'}`}>
            {question.is_solved ? 'Solved' : 'Unanswered'}
          </span>
        </div>

        <div className="question-detail-meta">
          <div className="meta-item">
            {isLoggedIn ? (
              <VoteButton
                count={question.vote_count || 0}
                onVote={handleVoteQuestion}
              />
            ) : (
              <>
                <strong>Votes:</strong> {question.vote_count || 0}
              </>
            )}
          </div>

          <div>
            <strong>Answers:</strong> {answers.length}
          </div>

          <div>
            <strong>Asked by:</strong> {question.author?.username || 'Anonymous'}
          </div>

          <div>
            <strong>Created:</strong>{' '}
            {question.created_at
              ? new Date(question.created_at).toLocaleDateString()
              : 'Unknown'}
          </div>
        </div>

        <div className="question-detail-description">
          <p>{question.description}</p>
        </div>

        <div className="question-detail-tags">
          {tags.map((tagName: string) => (
            <TagPill key={tagName} tag={{ name: tagName }} />
          ))}
        </div>

        <hr />

        <div className="question-comments">
          <h3>Comments ({comments.length})</h3>

          {comments.map((comment) => (
            <div key={comment.id} className="comment">
              <p>
                <strong>{comment.author?.username || 'Anonymous'}:</strong>{' '}
                {comment.body}
              </p>

              <small>
                {comment.created_at
                  ? new Date(comment.created_at).toLocaleDateString()
                  : ''}
              </small>
            </div>
          ))}

          {isLoggedIn && (
            <form onSubmit={handlePostComment} className="comment-form">
              <input
                type="text"
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Add a comment..."
              />

              <button type="submit" disabled={isSubmittingComment}>
                {isSubmittingComment ? 'Posting...' : 'Comment'}
              </button>
            </form>
          )}
        </div>

        <hr />

        <div className="answers-section">
          <h2>Answers ({answers.length})</h2>

          {isLoggedIn && (
            <form onSubmit={handlePostAnswer} className="answer-form">
              <textarea
                value={answerBody}
                onChange={(e) => setAnswerBody(e.target.value)}
                placeholder="Write your answer here..."
                rows={5}
              />

              <button type="submit" disabled={isSubmittingAnswer}>
                {isSubmittingAnswer ? 'Posting...' : 'Post Answer'}
              </button>
            </form>
          )}

          {answers.map((answer) => (
            <div key={answer.id} className="answer">
              <div className="answer-header">
                <strong>{answer.author?.username || 'Anonymous'}</strong>

                {answer.is_accepted && (
                  <span className="accepted-badge">✓ Accepted</span>
                )}
              </div>

              <p>{answer.body}</p>

              <small>
                {answer.created_at
                  ? new Date(answer.created_at).toLocaleDateString()
                  : ''}
              </small>

              <div className="answer-stats">
                {isLoggedIn ? (
                  <VoteButton
                    count={answer.vote_count || 0}
                    onVote={(value) => handleVoteAnswer(answer.id, value)}
                  />
                ) : (
                  <span>Votes: {answer.vote_count || 0}</span>
                )}
                {answer.comments && <span>Comments: {answer.comments.length}</span>}
              </div>

              <div className="answer-actions">
                {isLoggedIn && question.author?.id === user?.id && !answer.is_accepted && (
                  <button type="button" onClick={() => handleAcceptAnswer(answer.id)}>
                    ✓ Accept
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="question-detail-actions">
          <Link className="button-link" to="/">
            Back to questions
          </Link>
        </div>
      </div>
    </div>
  )
}