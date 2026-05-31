import type { CSSProperties } from 'react'
import { getBookCompletion, normalizeBookProgress } from '../lib/readerState'
import type { BookData, LibraryManifestEntry, ReaderState } from '../types'

interface LibraryShelfProps {
  activeBookId: string
  booksById: Record<string, BookData>
  entries: LibraryManifestEntry[]
  readerState: ReaderState
  onSelectBook: (bookId: string) => void
  onToggleBookmark: (bookId: string) => void
}

export function LibraryShelf({
  activeBookId,
  booksById,
  entries,
  readerState,
  onSelectBook,
  onToggleBookmark,
}: LibraryShelfProps) {
  return (
    <aside className="bookshelf-panel" aria-label="Bookshelf">
      <div className="bookshelf-panel__header">
        <p className="eyebrow">Bookshelf</p>
        <h2>Switch books without leaving the reader</h2>
        <p>
          Every title lives in JSON so the reading app can scale to a much larger
          library without changing the shell.
        </p>
      </div>

      <ol className="shelf-grid">
        {entries.map((entry) => {
          const book = booksById[entry.id]
          if (!book) {
            return null
          }

          const progress = normalizeBookProgress(book, readerState.bookProgress[entry.id])
          const completion = getBookCompletion(book, progress)
          const isActive = entry.id === activeBookId
          const cardStyle = {
            '--card-accent': entry.accent,
            '--card-surface': entry.surface,
          } as CSSProperties

          return (
            <li key={entry.id}>
              <article className={`book-card${isActive ? ' is-active' : ''}`} style={cardStyle}>
                <div className="book-card__topline">
                  <div className="book-card__emoji" aria-hidden="true">
                    {entry.coverEmoji}
                  </div>
                  <button
                    type="button"
                    className="bookmark-button"
                    aria-pressed={progress.bookmarked}
                    aria-label={`${progress.bookmarked ? 'Remove bookmark from' : 'Bookmark'} ${entry.title}`}
                    onClick={() => onToggleBookmark(entry.id)}
                  >
                    {progress.bookmarked ? 'Pinned' : 'Pin'}
                  </button>
                </div>

                <div>
                  <h3>{entry.title}</h3>
                  <p className="book-card__subtitle">{entry.subtitle}</p>
                </div>

                <p className="book-card__description">{entry.description}</p>

                <ul className="tag-list" role="list">
                  {entry.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>

                <dl className="book-card__meta">
                  <div>
                    <dt>Progress</dt>
                    <dd>{Math.round(completion * 100)}%</dd>
                  </div>
                  <div>
                    <dt>Reading time</dt>
                    <dd>{entry.durationMinutes} min</dd>
                  </div>
                </dl>

                <div className="book-card__footer">
                  <p>
                    {completion > 0 ? 'Resume from where you stopped.' : 'Start the first chapter.'}
                  </p>
                  <div className="book-card__actions">
                    <button
                      type="button"
                      className="button"
                      onClick={() => onSelectBook(entry.id)}
                    >
                      {isActive ? 'Reading now' : completion > 0 ? 'Resume' : 'Open book'}
                    </button>
                  </div>
                </div>
              </article>
            </li>
          )
        })}
      </ol>
    </aside>
  )
}
