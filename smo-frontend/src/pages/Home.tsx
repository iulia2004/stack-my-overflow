import { Link } from 'react-router-dom'
import { QuestionsList } from '../components/QuestionsList'
import { mockQuestions } from '../mockData'
import './Home.css'

export function Home() {
  return (
    <div className="home-page">
      <header className="home-navbar">
        <Link className="navbar-brand" to="/">
          <span className="navbar-logo">#</span>
          <span className="navbar-text">Stack My Overflow</span>
        </Link>

        <nav className="navbar-links">
          <Link to="/signin">Sign In</Link>
          <Link to="/signup" className="signup-link">
            Sign Up
          </Link>
        </nav>
      </header>

      <main className="home-main">
        <div className="page-header">
          <h1>Latest Questions</h1>
        </div>

        <section className="questions-area">
          <QuestionsList questions={mockQuestions} />
        </section>
      </main>
    </div>
  )
}
