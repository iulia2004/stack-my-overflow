import type { QuestionSummary } from '../types'
import { Link } from 'react-router-dom'
import { TagPill } from './TagPill'
import './QuestionsList.css'

interface QuestionCardProps {
  question: QuestionSummary
}

type QuestionTag = {
  tag: {
    name: string
  }
}

export function QuestionCard({ question }: QuestionCardProps) {
  const questionTags =
    (question.question_tags as QuestionTag[] | undefined)?.map((qt) => qt.tag) ?? []

  return (
    <div className="question-card">
      <div className="question-stats">
        <div className="stat">
          <div className="stat-value">{question.vote_count || 0}</div>
          <div className="stat-label">votes</div>
        </div>

        <div className="stat">
          <div className="stat-value">{question.answer_count || 0}</div>
          <div className="stat-label">answers</div>
        </div>

        <div className={`stat status ${question.is_solved ? 'solved' : 'unanswered'}`}>
          <div className="stat-value">{question.is_solved ? '✓' : '?'}</div>
          <div className="stat-label">{question.is_solved ? 'solved' : 'unanswered'}</div>
        </div>
      </div>

      <div className="question-content">
        <h3 className="question-title">
          <Link to={`/questions/${question.id}`}>
            {question.title}
          </Link>
        </h3>

        <div className="question-tags">
          {questionTags.map((tag) => (
            <TagPill key={tag.name} tag={tag} />
          ))}
        </div>

        <div className="question-meta">
          <span className="author">
            asked by <strong>{question.author?.username || 'Anonymous'}</strong>
          </span>

          <span className="date">
            {question.created_at
              ? new Date(question.created_at).toLocaleDateString()
              : ''}
          </span>
        </div>
      </div>
    </div>
  )
}