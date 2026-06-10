const express = require('express')
const router = express.Router()
const { supabase } = require('../supabase')
const { requireAuth } = require('../middleware/auth')

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('QUESTIONS LOAD ERROR:', error)
    return res.status(500).json({ error: error.message })
  }

  res.json(data || [])
})

router.get('/:id', async (req, res) => {
    const { id } = req.params

    const { data: question, error } = await supabase
        .from('questions')
        .select('*')
        .eq('id', id)
        .maybeSingle()

    if (error) {
        console.error('QUESTION LOAD ERROR:', error)
        return res.status(500).json({ error: error.message })
    }

    if (!question) {
        return res.status(404).json({ error: 'Question not found' })
    }

    res.json({
        ...question,
        tags: [],
        answers: [],
        comments: []
    })
})

router.post('/', requireAuth, async (req, res) => {
    const { title, description, tags = [] } = req.body

    if (!title?.trim() || !description?.trim()) {
        return res.status(400).json({ error: 'Titlu si descriere sunt obligatorii' })
    }

    const { data: question, error } = await supabase
        .from('questions')
        .insert({
            title: title.trim(),
            description: description.trim(),
            author_id: req.user.id
        })
        .select()
        .single()

    if (error) {
        console.error('QUESTION CREATE ERROR:', error)
        return res.status(500).json({ error: error.message })
    }

    for (const tagName of tags) {
        const cleanTag = String(tagName).trim().toLowerCase()

        if (!cleanTag) continue

        const { data: tag, error: tagError } = await supabase
            .from('tags')
            .upsert({ name: cleanTag }, { onConflict: 'name' })
            .select()
            .single()

        if (tagError) {
            console.error('TAG CREATE ERROR:', tagError)
            continue
        }

        await supabase
            .from('question_tags')
            .insert({
                question_id: question.id,
                tag_id: tag.id
            })
    }

    res.status(201).json(question)
})

router.post('/:questionId/answers', requireAuth, async (req, res) => {
    const { questionId } = req.params
    const { body } = req.body

    if (!body || !body.trim()) {
        return res.status(400).json({ error: 'Body is required' })
    }

    const { data: question, error: questionError } = await supabase
        .from('questions')
        .select('id')
        .eq('id', questionId)
        .maybeSingle()

    if (questionError) {
        return res.status(500).json({ error: questionError.message })
    }

    if (!question) {
        return res.status(404).json({ error: 'Question not found' })
    }

    const { data: answer, error: answerError } = await supabase
        .from('answers')
        .insert({
            body: body.trim(),
            question_id: questionId,
            author_id: req.user.id,
            is_accepted: false
        })
        .select()
        .single()

    if (answerError) {
        return res.status(500).json({ error: answerError.message })
    }

    res.status(201).json({ answer })
})

router.patch('/:id/vote', requireAuth, async (req, res) =>  {
    const { value } = req.body

    if (value !== 1 && value !== -1) {
        return res.status(400).json({ error: 'Valoare invalida pentru vot' })
    }

    res.json({ vote_count: 0 })
})

module.exports = router