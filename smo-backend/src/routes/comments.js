const express = require('express')
const router = express.Router()
const { supabase } = require('../supabase')
const { requireAuth } = require('../middleware/auth')

router.get('/:targetId/:targetType', async (req, res) => {
  const { targetId, targetType } = req.params

  if (!['question', 'answer'].includes(targetType))
    return res.status(400).json({ error: 'Invalid target type' })

  const { data, error } = await supabase
    .from('comments')
    .select('*, author:profiles!author_id(id, username)')
    .eq('target_id', targetId)
    .eq('target_type', targetType)
    .order('created_at', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })

  res.json(data || [])
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
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  res.status(201).json(comment)
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
