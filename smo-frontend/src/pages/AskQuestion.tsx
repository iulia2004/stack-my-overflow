import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TagPill } from '../components/TagPill'
import { useAuth } from '../hooks/useAuth'
import { suggestTags, aiHealth } from '../lib/api'
import type { Tag } from '../types'
import './AskQuestion.css'

export function AskQuestion() {
  const navigate = useNavigate()
  const { user, isLoggedIn } = useAuth()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<Tag[]>([])
  const [statusMessage, setStatusMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatingTags, setGeneratingTags] = useState(false)
  const [aiDisabled, setAiDisabled] = useState(false)

  useEffect(() => {
    const checkAiHealth = async () => {
      try {
        const health = await aiHealth()
        setAiDisabled(!health.ok || !!health.rateLimited)
      } catch {
        setAiDisabled(true)
      }
    }

    checkAiHealth()
  }, [])

  function normalizeTag(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, '-')
  }

  function addTagFromValue(value: string) {
    const name = normalizeTag(value)
    if (!name) return
    if (tags.some((t) => t.name === name)) return
    setTags((prev) => [...prev, { name }])
  }

  function mergeTags(newTags: string[]) {
    setTags((prev) => {
      const existingNames = new Set(prev.map((t) => t.name))
      const merged = [...prev]

      newTags.forEach((tag) => {
        const name = normalizeTag(tag)

        if (name && !existingNames.has(name)) {
          merged.push({ name })
          existingNames.add(name)
        }
      })

      return merged.slice(0, 5)
    })
  }

  const handleGenerateTags = async () => {
    if (!title.trim() || generatingTags || aiDisabled) return

    setGeneratingTags(true)

    try {
      const data = await suggestTags(title)
      mergeTags(data.tags ?? [])
    } catch {
      setAiDisabled(true)
    } finally {
      setGeneratingTags(false)
    }
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTagFromValue(tagInput)
      setTagInput('')
    }
  }

  const removeTag = (name: string) => {
    setTags((prev) => prev.filter((t) => t.name !== name))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isLoggedIn || !user) {
      setStatusMessage('Please sign in before asking a question.')
      return
    }

    if (!title.trim() || description.trim().length < 20) {
      setStatusMessage('Title is required and description must be at least 20 characters.')
      return
    }

    setIsSubmitting(true)
    setStatusMessage('')

    try {
      const token = localStorage.getItem('smo_token')

      const response = await fetch('http://localhost:3000/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          tags: tags.map((t) => t.name),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to post question')
      }

      navigate(`/questions/${data.id}`)
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to post question.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="ask-page">
      <header className="ask-navbar">
        <Link className="navbar-brand" to="/">
          <span className="navbar-logo">#</span>
          <span className="navbar-text">Stack My Overflow</span>
        </Link>
      </header>

      <main className="ask-main">
        <div className="ask-card">
          <h1>Ask a Question</h1>

          <form className="ask-form" onSubmit={handleSubmit}>
            {statusMessage && <div className="form-status">{statusMessage}</div>}

            <div className="form-field">
              <label>Title</label>

              <div className="title-row">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarize your question"
                />

                {!aiDisabled && (
                  <button
                    type="button"
                    className="generate-tags-button"
                    onClick={handleGenerateTags}
                    disabled={!title.trim() || generatingTags}
                  >
                    {generatingTags ? 'Generating tags...' : '✦ Generate tags'}
                  </button>
                )}
              </div>
            </div>

            <div className="form-field">
              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={8}
                placeholder="Describe your problem"
              />
            </div>

            <div className="form-field">
              <label>Tags optional</label>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Type a tag and press Enter"
              />

              <div className="tags-list">
                {tags.map((t) => (
                  <div className="tag-item" key={t.name}>
                    <TagPill tag={t} />
                    <button type="button" className="remove-tag" onClick={() => removeTag(t.name)}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Posting…' : 'Post Question'}
              </button>

              <Link className="button-link" to="/">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

export default AskQuestion