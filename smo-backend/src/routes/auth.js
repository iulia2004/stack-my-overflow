const express = require('express')
const router = express.Router()
const { supabase } = require('../supabase')
const { requireAuth } = require('../middleware/auth')

router.post('/register', async (req, res) => {
    const { email, password, username } = req.body

    if (!email || !password || !username) {
        return res.status(400).json({ error: 'Email, parola si username sunt obligatorii' })
    }

    const { data: existing, error: existingError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle()

    if (existingError) {
        return res.status(500).json({ error: existingError.message })
    }

    if (existing) {
        return res.status(400).json({ error: 'Username deja folosit' })
    }

    const { data: createData, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    })

    if (createErr) {
        return res.status(400).json({ error: createErr.message })
    }

    const user = createData.user

    const { error: profileErr } = await supabase.from('profiles').insert({
    id: user.id,
    username
    });

    if (profileErr) {
        console.error('PROFILE INSERT ERROR:', profileErr)

        await supabase.auth.admin.deleteUser(user.id)

        return res.status(500).json({
            error: profileErr.message,
            details: profileErr
        })
    }

    const { data: sess, error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password
    })

    if (signInErr || !sess.session) {
        return res.status(500).json({ error: 'Account created, but login failed' })
    }

    res.status(201).json({
        accessToken: sess.session.access_token,
        refreshToken: sess.session.refresh_token,
        user: {
            id: user.id,
            email,
            username
        }
    })
})

router.post('/login', async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({ error: 'Email si parola sunt obligatorii' })
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    })

    if (error) {
        return res.status(401).json({ error: 'Email sau parola incorecte' })
    }

    const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle()

    if (profileErr) {
        return res.status(500).json({ error: profileErr.message })
    }

    res.json({
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        user: {
            id: data.user.id,
            email: data.user.email,
            username: profile?.username
        }
    })
})

router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body

    if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token este obligatoriu' })
    }

    const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken
    })

    if (error) {
        return res.status(401).json({ error: 'Refresh token invalid sau expirat' })
    }

    res.json({
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token
    })
})

router.get('/me', requireAuth, async (req, res) => {
    const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', req.user.id)
        .maybeSingle()

    if (profileErr) {
        return res.status(500).json({ error: profileErr.message })
    }

    res.json({
        user: {
            id: req.user.id,
            email: req.user.email,
            username: profile?.username
        }
    })
})

router.post('/logout', requireAuth, (req, res) => {
    res.json({ message: 'Logged out' })
})

module.exports = router