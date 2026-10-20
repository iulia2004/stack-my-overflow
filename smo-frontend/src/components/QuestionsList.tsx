import type { QuestionSummary } from '../types'
import { QuestionCard } from './QuestionCard'
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
          <QuestionCard key={question.id} question={question} />
        ))}
      </div>
    </div>
  )
}
