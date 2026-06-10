const express = require('express')
const router = express.Router()
const { supabase } = require('../supabase')
const { requireAuth } = require('../middleware/auth')

router.patch('/:answerId/accept', requireAuth, async (req, res) => {
    const { answerId } = req.params
    const userId = req.user.id

    const { data: answer, error: answerError } = await supabase
        .from('answers')
        .select(`
            *,
            question:questions!question_id(
                id,
                author_id
            )
        `)
        .eq('id', answerId)
        .maybeSingle()

    if (answerError) {
        return res.status(500).json({ error: answerError.message })
    }

    if (!answer) {
        return res.status(404).json({ error: 'Answer not found' })
    }

    if (answer.question.author_id !== userId) {
        return res.status(403).json({ error: 'Only the question author can accept answers' })
    }

    const questionId = answer.question.id

    const { error: unacceptError } = await supabase
        .from('answers')
        .update({ is_accepted: false })
        .eq('question_id', questionId)

    if (unacceptError) {
        return res.status(500).json({ error: unacceptError.message })
    }

    const { data: updatedAnswer, error: updateAnswerError } = await supabase
        .from('answers')
        .update({ is_accepted: true })
        .eq('id', answerId)
        .select()
        .single()

    if (updateAnswerError) {
        return res.status(500).json({ error: updateAnswerError.message })
    }

    const { error: updateQuestionError } = await supabase
        .from('questions')
        .update({ is_solved: true })
        .eq('id', questionId)

    if (updateQuestionError) {
        return res.status(500).json({ error: updateQuestionError.message })
    }

    res.json({ answer: updatedAnswer })
})

module.exports = router