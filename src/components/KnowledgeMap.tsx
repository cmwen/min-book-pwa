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
  const lines = book.chapters.flatMap((chapter) =>
    chapter.connections
      .filter((targetId) => chapter.id < targetId)
      .map((targetId) => {
        const target = chapterById.get(targetId)
        if (!target) {
          return null
        }

        return {
          key: `${chapter.id}-${targetId}`,
          from: chapter.mapPosition,
          to: target.mapPosition,
        }
      })
      .filter((line): line is NonNullable<typeof line> => Boolean(line)),
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

        return (
          <button
            key={chapter.id}
            type="button"
            className={`map-node${isCurrent ? ' is-current' : ''}${isComplete ? ' is-complete' : ''}`}
            style={{
              insetInlineStart: `${chapter.mapPosition.x}%`,
              insetBlockStart: `${chapter.mapPosition.y}%`,
            }}
            onClick={() => onSelectChapter(chapter.id)}
          >
            <strong>{chapter.title}</strong>
            <span>{Math.round(completion * 100)}% explored</span>
          </button>
        )
      })}
    </div>
  )
}
