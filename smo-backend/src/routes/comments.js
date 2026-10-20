const express = require('express')
const router = express.Router()
const { supabase } = require('../supabase')
const { requireAuth } = require('../middleware/auth')

router.get('/:targetId/:targetType', async (req, res) => {
  const { targetId, targetType } = req.params

  if (!['question', 'answer'].includes(targetType))
    return res.status(400).json({ error: 'Invalid target type' })

  const { data: comments, error: commentsError } = await supabase
    .from('comments')
    .select('*, author:profiles!author_id(id, username)')
    .eq('target_id', targetId)
    .eq('target_type', targetType)
    .order('created_at', { ascending: true })

  if (commentsError) return res.status(500).json({ error: commentsError.message })

  const commentIds = (comments || []).map((comment) => comment.id)
  let voteCounts = {}

  if (commentIds.length > 0) {
    const { data: voteData, error: voteError } = await supabase
      .from('votes')
      .select('target_id, value')
      .eq('target_type', 'comment')
      .in('target_id', commentIds)

    if (voteError) return res.status(500).json({ error: voteError.message })

    voteCounts = (voteData || []).reduce((acc, vote) => {
      acc[vote.target_id] = (acc[vote.target_id] || 0) + vote.value
      return acc
    }, {})
  }

  res.json(
    (comments || []).map((comment) => ({
      ...comment,
      vote_count: voteCounts[comment.id] || 0,
    }))
  )
})

router.post('/', requireAuth, async (req, res) => {
  const { body, target_id, target_type } = req.body

  if (!body || !body.trim())
    return res.status(400).json({ error: 'Body is required' })

  if (!target_id)
    return res.status(400).json({ error: 'Target ID is required' })

  if (!['question', 'answer'].includes(target_type))
    return res.status(400).json({ error: 'Invalid target type' })

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      body,
      target_id,
      target_type,
      author_id: req.user.id
    })
    .select('*, author:profiles!author_id(id, username)')
    .single()

  if (error) return res.status(500).json({ error: error.message })

  res.status(201).json({ ...comment, vote_count: 0 })
})

router.patch('/:id/vote', requireAuth, async (req, res) => {
  const commentId = req.params.id
  const { value } = req.body
  const userId = req.user.id

  if (value !== 1 && value !== -1)
    return res.status(400).json({ error: 'Invalid vote value' })

  const { data: comment, error: commentError } = await supabase
    .from('comments')
    .select('id')
    .eq('id', commentId)
    .maybeSingle()

  if (commentError) return res.status(500).json({ error: commentError.message })
  if (!comment) return res.status(404).json({ error: 'Comment not found' })

  const { data: existingVote, error: existingVoteError } = await supabase
    .from('votes')
    .select('id, value')
    .eq('user_id', userId)
    .eq('target_id', commentId)
    .eq('target_type', 'comment')
    .maybeSingle()

  if (existingVoteError) return res.status(500).json({ error: existingVoteError.message })
  if (existingVote && existingVote.value === value)
    return res.status(400).json({ error: 'You can only vote once in the same direction' })

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
        .insert({ user_id: userId, target_id: commentId, target_type: 'comment', value })

      if (insertVoteError) throw insertVoteError
    }

    const { data: voteRows, error: voteCountError } = await supabase
      .from('votes')
      .select('value')
      .eq('target_id', commentId)
      .eq('target_type', 'comment')

    if (voteCountError) throw voteCountError

    const vote_count = (voteRows || []).reduce((sum, vote) => sum + vote.value, 0)
    res.json({ vote_count })
  } catch (error) {
    console.error('COMMENT VOTE ERROR:', error)
    res.status(500).json({ error: error.message || 'Failed to vote' })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  const commentId = req.params.id
  const uid = req.user.id

  const { data: comment, error: commentError } = await supabase
    .from('comments')
    .select('author_id')
    .eq('id', commentId)
    .single()

  if (commentError || !comment)
    return res.status(404).json({ error: 'Comment not found' })

  if (comment.author_id !== uid)
    return res.status(403).json({ error: 'Can only delete your own comments' })

  const { error } = await supabase.from('comments').delete().eq('id', commentId)

  if (error) return res.status(500).json({ error: error.message })

  res.json({ message: 'Comment deleted' })
})

module.exports = router
