require('dotenv').config()

const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/auth')
const questionRoutes = require('./routes/questions')
const answerRoutes = require('./routes/answers')
const commentRoutes = require('./routes/comments')
const aiRoutes = require('./routes/ai')

const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ ok: true })
})

app.use('/auth', authRoutes)
app.use('/questions', questionRoutes)
app.use('/answers', answerRoutes)
app.use('/comments', commentRoutes)
app.use('/ai', aiRoutes)

app.get('/', (req, res) => {
  res.json({ status: 'ok' })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})