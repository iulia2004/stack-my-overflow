import type { Tag } from '../types'
import './TagPill.css'

interface TagPillProps {
  tag: Tag
}

export function TagPill({ tag }: TagPillProps) {
  return <span className="tag-pill">{tag.name}</span>
}
