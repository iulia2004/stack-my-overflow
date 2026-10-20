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

    const { data: question, error: questionError } = await supabase
        .from('questions')
        .select('*, author:profiles!author_id(id, username)')
        .eq('id', id)
        .maybeSingle()

    if (questionError) {
        console.error('QUESTION LOAD ERROR:', questionError)
        return res.status(500).json({ error: questionError.message })
    }

    if (!question) {
        return res.status(404).json({ error: 'Question not found' })
    }

    const [{ data: questionTags, error: tagsError }, { data: answers, error: answersError }, { data: questionComments, error: questionCommentsError }] = await Promise.all([
        supabase.from('question_tags').select('tag:tags(*)').eq('question_id', id),
        supabase.from('answers').select('*, author:profiles!author_id(id, username)').eq('question_id', id).order('created_at', { ascending: false }),
        supabase.from('comments').select('*, author:profiles!author_id(id, username)').eq('target_id', id).eq('target_type', 'question').order('created_at', { ascending: true }),
    ])

    if (tagsError || answersError || questionCommentsError) {
        console.error('QUESTION RELATED DATA LOAD ERROR:', tagsError || answersError || questionCommentsError)
        return res.status(500).json({ error: (tagsError || answersError || questionCommentsError).message })
    }

    const answerIds = (answers || []).map((answer) => answer.id)
    let answerComments = []

    if (answerIds.length > 0) {
        const { data: answerCommentsData, error: answerCommentsError } = await supabase
            .from('comments')
            .select('*, author:profiles!author_id(id, username)')
            .in('target_id', answerIds)
            .eq('target_type', 'answer')
            .order('created_at', { ascending: true })

        if (answerCommentsError) {
            console.error('ANSWER COMMENTS LOAD ERROR:', answerCommentsError)
            return res.status(500).json({ error: answerCommentsError.message })
        }

        answerComments = answerCommentsData || []
    }

    const allCommentIds = [
        ...(questionComments || []).map((comment) => comment.id),
        ...(answerComments || []).map((comment) => comment.id),
    ]
    let commentVoteCounts = {}

    if (allCommentIds.length > 0) {
        const { data: voteData, error: voteError } = await supabase
            .from('votes')
            .select('target_id, value')
            .eq('target_type', 'comment')
            .in('target_id', allCommentIds)

        if (voteError) {
            console.error('COMMENT VOTE LOAD ERROR:', voteError)
            return res.status(500).json({ error: voteError.message })
        }

        commentVoteCounts = (voteData || []).reduce((acc, vote) => {
            acc[vote.target_id] = (acc[vote.target_id] || 0) + vote.value
            return acc
        }, {})
    }

    const addVoteCount = (comment) => ({
        ...comment,
        vote_count: commentVoteCounts[comment.id] || 0,
    })

    const answersWithComments = (answers || []).map((answer) => ({
        ...answer,
        comments: answerComments
            .filter((comment) => comment.target_id === answer.id)
            .map(addVoteCount),
    }))

    res.json({
        ...question,
        question_tags: questionTags || [],
        answers: answersWithComments,
        comments: (questionComments || []).map(addVoteCount),
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

    res.status(201).json(answer)
})

router.patch('/:id/vote', requireAuth, async (req, res) => {
    const { id } = req.params
    const { value } = req.body
    const userId = req.user.id

    if (value !== 1 && value !== -1) {
        return res.status(400).json({ error: 'Valoare invalida pentru vot' })
    }

    const { data: question, error: questionError } = await supabase
        .from('questions')
        .select('vote_count')
        .eq('id', id)
        .maybeSingle()

    if (questionError) {
        console.error('QUESTION VOTE LOAD ERROR:', questionError)
        return res.status(500).json({ error: questionError.message })
    }

    if (!question) {
        return res.status(404).json({ error: 'Question not found' })
    }

    const { data: existingVote, error: existingVoteError } = await supabase
        .from('votes')
        .select('id, value')
        .eq('user_id', userId)
        .eq('target_id', id)
        .eq('target_type', 'question')
        .maybeSingle()

    if (existingVoteError) {
        console.error('QUESTION VOTE CHECK ERROR:', existingVoteError)
        return res.status(500).json({ error: existingVoteError.message })
    }

    let voteDiff = value
    let voteRecordId = null

    if (existingVote) {
        if (existingVote.value === value) {
            return res.status(400).json({ error: 'You can only vote once in the same direction' })
        }

        voteDiff = value * 2
        voteRecordId = existingVote.id
    }

    const transaction = async () => {
        if (voteRecordId) {
            const { error: updateVoteError } = await supabase
                .from('votes')
                .update({ value })
                .eq('id', voteRecordId)

            if (updateVoteError) throw updateVoteError
        } else {
            const { error: insertVoteError } = await supabase
                .from('votes')
                .insert({ user_id: userId, target_id: id, target_type: 'question', value })

            if (insertVoteError) throw insertVoteError
        }

        const { data: updatedQuestion, error: updateError } = await supabase
            .from('questions')
            .update({ vote_count: (question.vote_count || 0) + voteDiff })
            .eq('id', id)
            .select('vote_count')
            .single()

        if (updateError) throw updateError

        return updatedQuestion
    }

    try {
        const updatedQuestion = await transaction()
        res.json({ vote_count: updatedQuestion.vote_count })
    } catch (error) {
        console.error('QUESTION VOTE TRANSACTION ERROR:', error)
        res.status(500).json({ error: error.message || 'Failed to apply vote' })
    }
})

module.exports = router