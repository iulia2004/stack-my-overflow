const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'


async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('smo_token')

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(data?.error || data?.message || 'Request failed')
  }

  return data
}

export const suggestTags = async (title: string) => {
  return request('/ai/tags', {
    method: 'POST',
    body: JSON.stringify({ title }),
  })
}

export const aiHealth = async () => {
  return request('/ai/health')
}

export const questionApi = {
  voteQuestion: async (questionId: string, value: 1 | -1): Promise<{ vote_count: number }> => {
    return request(`/questions/${questionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ value }),
    })
  },
}

export const answerApi = {
  postAnswer: async (questionId: string, body: string) => {
    return request(`/answers`, {
      method: 'POST',
      body: JSON.stringify({ question_id: questionId, body }),
    })
  },

  voteAnswer: async (answerId: string, value: 1 | -1): Promise<{ vote_count: number }> => {
    return request(`/answers/${answerId}/vote`, {
      method: 'PATCH',
      body: JSON.stringify({ value }),
    })
  },

  acceptAnswer: async (answerId: string) => {
    return request(`/answers/${answerId}/accept`, {
      method: 'PATCH',
    })
  },

  deleteAnswer: async (answerId: string) => {
    return request(`/answers/${answerId}`, {
      method: 'DELETE',
    })
  },
}

export const commentApi = {
  getComments: async (targetId: string, targetType: 'question' | 'answer') => {
    return request(`/comments/${targetId}/${targetType}`)
  },

  postComment: async (targetId: string, targetType: 'question' | 'answer', body: string) => {
    return request(`/comments`, {
      method: 'POST',
      body: JSON.stringify({ target_id: targetId, target_type: targetType, body }),
    })
  },

  deleteComment: async (commentId: string) => {
    return request(`/comments/${commentId}`, {
      method: 'DELETE',
    })
  },
}
