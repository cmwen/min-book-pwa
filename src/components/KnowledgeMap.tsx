import { getChapterCompletion } from '../lib/readerState'
import type { BookData, BookProgress } from '../types'

interface KnowledgeMapProps {
  book: BookData
  currentChapterId: string
  progress: BookProgress
  onSelectChapter: (chapterId: string) => void
  size?: 'compact' | 'expanded'
}

export function KnowledgeMap({
  book,
  currentChapterId,
  progress,
  onSelectChapter,
  size = 'compact',
}: KnowledgeMapProps) {
  const chapterById = new Map(book.chapters.map((chapter) => [chapter.id, chapter]))
  const lines = Array.from(
    book.chapters.reduce<
      Map<
        string,
        {
          key: string
          from: (typeof book.chapters)[number]['mapPosition']
          to: (typeof book.chapters)[number]['mapPosition']
        }
      >
    >((edgeMap, chapter) => {
      chapter.connections.forEach((targetId) => {
        const target = chapterById.get(targetId)
        if (!target) {
          return
        }

        const key = [chapter.id, targetId].sort().join('--')
        if (!edgeMap.has(key)) {
          edgeMap.set(key, {
            key,
            from: chapter.mapPosition,
            to: target.mapPosition,
          })
        }
      })

      return edgeMap
    }, new Map()).values(),
  )

  return (
    <div className={`knowledge-map knowledge-map--${size}`}>
      <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none">
        {lines.map((line) => (
          <line
            key={line.key}
            x1={line.from.x}
            y1={line.from.y}
            x2={line.to.x}
            y2={line.to.y}
          />
        ))}
      </svg>

      {book.chapters.map((chapter) => {
        const completion = getChapterCompletion(chapter, progress)
        const isCurrent = chapter.id === currentChapterId
        const isComplete = completion === 1
        const completionLabel = `${Math.round(completion * 100)}% explored`

        return (
          <button
            key={chapter.id}
            type="button"
            className={`map-node${isCurrent ? ' is-current' : ''}${isComplete ? ' is-complete' : ''}`}
            aria-label={`${chapter.title}, ${completionLabel}${isCurrent ? ', current chapter' : ''}`}
            style={{
              insetInlineStart: `${chapter.mapPosition.x}%`,
              insetBlockStart: `${chapter.mapPosition.y}%`,
            }}
            onClick={() => onSelectChapter(chapter.id)}
          >
            <strong>{chapter.title}</strong>
            <span>{completionLabel}</span>
          </button>
        )
      })}
    </div>
  )
}
