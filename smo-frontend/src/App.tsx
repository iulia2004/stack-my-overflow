import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { SignIn } from './pages/SignIn'
import { SignUp } from './pages/SignUp'
import { QuestionDetails } from './pages/QuestionDetails'
import { AskQuestion } from './pages/AskQuestion'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/questions/new" element={<AskQuestion />} />
        <Route path="/questions/:id" element={<QuestionDetails />} />
      </Routes>
    </Router>
  )
}

export default App
