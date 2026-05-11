import type { QuestionSummary } from './types'

export const mockQuestions: QuestionSummary[] = [
  {
    id: '1',
    title: 'How to center a div using CSS?',
    is_solved: true,
    vote_count: 245,
    created_at: '2024-05-10T10:30:00Z',
    author: {
      id: 'user1',
      username: 'alex_dev'
    },
    question_tags: [
      { tag: { name: 'CSS' } },
      { tag: { name: 'HTML' } },
      { tag: { name: 'Web Design' } }
    ],
    answer_count: 8
  },
  {
    id: '2',
    title: 'Best practices for React component state management',
    is_solved: true,
    vote_count: 156,
    created_at: '2024-05-09T14:20:00Z',
    author: {
      id: 'user2',
      username: 'jane_smith'
    },
    question_tags: [
      { tag: { name: 'React' } },
      { tag: { name: 'JavaScript' } },
      { tag: { name: 'State Management' } }
    ],
    answer_count: 5
  },
  {
    id: '3',
    title: 'TypeScript union types vs intersection types',
    is_solved: false,
    vote_count: 89,
    created_at: '2024-05-08T09:15:00Z',
    author: {
      id: 'user3',
      username: 'michael_code'
    },
    question_tags: [
      { tag: { name: 'TypeScript' } },
      { tag: { name: 'Types' } }
    ],
    answer_count: 3
  },
  {
    id: '4',
    title: 'How to optimize database queries for large datasets?',
    is_solved: true,
    vote_count: 312,
    created_at: '2024-05-07T16:45:00Z',
    author: {
      id: 'user4',
      username: 'database_pro'
    },
    question_tags: [
      { tag: { name: 'Database' } },
      { tag: { name: 'SQL' } },
      { tag: { name: 'Performance' } }
    ],
    answer_count: 12
  },
  {
    id: '5',
    title: 'Getting started with Vue.js',
    is_solved: false,
    vote_count: 67,
    created_at: '2024-05-06T11:30:00Z',
    author: {
      id: 'user5',
      username: 'vue_learner'
    },
    question_tags: [
      { tag: { name: 'Vue.js' } },
      { tag: { name: 'JavaScript' } },
      { tag: { name: 'Beginner' } }
    ],
    answer_count: 4
  }
]
