import type { QuestionSummary } from '../types'
import { TagPill } from './TagPill'
import './QuestionsList.css'

interface QuestionsListProps {
  questions: QuestionSummary[]
}

export function QuestionsList({ questions }: QuestionsListProps) {
  return (
    <div className="questions-container">
      <h2>Questions</h2>
      <div className="questions-list">
        {questions.map((question) => (
          <div key={question.id} className="question-card">
            <div className="question-stats">
              <div className="stat">
                <div className="stat-value">{question.vote_count}</div>
                <div className="stat-label">votes</div>
              </div>
              <div className="stat">
                <div className="stat-value">{question.answer_count}</div>
                <div className="stat-label">answers</div>
              </div>
              <div className={`stat status ${question.is_solved ? 'solved' : 'unanswered'}`}>
                <div className="stat-value">
                  {question.is_solved ? '✓' : '?'}
                </div>
                <div className="stat-label">
                  {question.is_solved ? 'solved' : 'unanswered'}
                </div>
              </div>
            </div>

            <div className="question-content">
              <h3 className="question-title">{question.title}</h3>

              <div className="question-tags">
                {question.question_tags.map((qt) => (
                  <TagPill key={qt.tag.name} tag={qt.tag} />
                ))}
              </div>

              <div className="question-meta">
                <span className="author">
                  asked by <strong>{question.author?.username || 'Anonymous'}</strong>
                </span>
                <span className="date">
                  {new Date(question.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
