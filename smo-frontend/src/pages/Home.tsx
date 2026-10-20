import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { QuestionsList } from '../components/QuestionsList'
import type { QuestionSummary } from '../types'
import { useAuth } from '../hooks/useAuth'
import './Home.css'

export function Home() {
  const { user, isLoggedIn, signOut } = useAuth()

  const [questions, setQuestions] = useState<QuestionSummary[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(true)

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setQuestionsLoading(true)

        const response = await fetch('http://localhost:3000/questions')

        const data = await response.json()

        console.log('QUESTIONS STATUS:', response.status)
        console.log('QUESTIONS DATA:', data)

        if (!response.ok) {
          throw new Error(data?.error || 'Failed to load questions')
        }

        setQuestions(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Failed to load questions', error)
      } finally {
        setQuestionsLoading(false)
      }
    }

    loadQuestions()
  }, [])

  return (
    <div className="home-page">
      <header className="home-navbar">
        <Link className="navbar-brand" to="/">
          <span className="navbar-logo">#</span>
          <span className="navbar-text">Stack My Overflow</span>
        </Link>

        <nav className="navbar-links">
          {isLoggedIn && user ? (
            <>
              <span className="navbar-user">
                Welcome, {user.username}
              </span>

              <Link
                to="/questions/new"
                className="signup-link"
              >
                Ask Question
              </Link>

              <button
                className="signup-link"
                type="button"
                onClick={signOut}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/signin">Sign In</Link>

              <Link
                to="/signup"
                className="signup-link"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="home-main">
        <div className="page-header">
          <h1>Latest Questions</h1>

          {isLoggedIn && (
            <Link
              className="button-link"
              to="/questions/new"
            >
              Create Question
            </Link>
          )}
        </div>

        <section className="questions-area">
          {questionsLoading ? (
            <p>Loading questions...</p>
          ) : questions.length === 0 ? (
            <p>No questions yet.</p>
          ) : (
            <QuestionsList questions={questions} />
          )}
        </section>
      </main>
    </div>
  )
}