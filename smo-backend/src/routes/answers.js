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

router.patch('/:answerId/vote', requireAuth, async (req, res) => {
    const { answerId } = req.params
    const { value } = req.body
    const userId = req.user.id

    if (value !== 1 && value !== -1) {
        return res.status(400).json({ error: 'Invalid vote value' })
    }

    const { data: answer, error: answerError } = await supabase
        .from('answers')
        .select('vote_count')
        .eq('id', answerId)
        .maybeSingle()

    if (answerError) {
        console.error('ANSWER VOTE LOAD ERROR:', answerError)
        return res.status(500).json({ error: answerError.message })
    }

    if (!answer) {
        return res.status(404).json({ error: 'Answer not found' })
    }

    const { data: existingVote, error: existingVoteError } = await supabase
        .from('votes')
        .select('id, value')
        .eq('user_id', userId)
        .eq('target_id', answerId)
        .eq('target_type', 'answer')
        .maybeSingle()

    if (existingVoteError) {
        console.error('ANSWER VOTE CHECK ERROR:', existingVoteError)
        return res.status(500).json({ error: existingVoteError.message })
    }

    if (existingVote && existingVote.value === value) {
        return res.status(400).json({ error: 'You can only vote once in the same direction' })
    }

    let voteDiff = value
    if (existingVote) {
        voteDiff = value * 2
    }

    try {
        if (existingVote) {
            const { error: updateVoteError } = await supabase
                .from('votes')
                .update({ value })
                .eq('id', existingVote.id)

            if (updateVoteError) throw updateVoteError
        } else {
            const { error: insertVoteError } = await supabase
                .from('votes')
                .insert({ user_id: userId, target_id: answerId, target_type: 'answer', value })

            if (insertVoteError) throw insertVoteError
        }

        const { data: updatedAnswer, error: updateError } = await supabase
            .from('answers')
            .update({ vote_count: (answer.vote_count || 0) + voteDiff })
            .eq('id', answerId)
            .select('vote_count')
            .single()

        if (updateError) throw updateError

        res.json({ vote_count: updatedAnswer.vote_count })
    } catch (error) {
        console.error('ANSWER VOTE TRANSACTION ERROR:', error)
        res.status(500).json({ error: error.message || 'Failed to apply vote' })
    }
})

module.exports = router