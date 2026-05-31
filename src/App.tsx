import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import './App.css'
import { KnowledgeMap } from './components/KnowledgeMap'
import { LibraryShelf } from './components/LibraryShelf'
import { OverlayDialog } from './components/OverlayDialog'
import { ReaderArticle } from './components/ReaderArticle'
import { loadLibraryBundle } from './lib/library'
import {
  getBookCompletion,
  getChapterCompletion,
  getSectionKey,
  loadReaderState,
  normalizeBookProgress,
  normalizeReaderState,
  saveReaderState,
} from './lib/readerState'
import type {
  BookData,
  FocusRequest,
  LibraryManifestEntry,
  ReaderPanel,
  ReaderState,
} from './types'

type ThemeStyle = CSSProperties & {
  '--book-accent': string
  '--book-surface': string
  '--book-glow': string
  '--book-text': string
}

const workspacePanels: Array<{
  id: ReaderPanel
  label: string
  title: string
  description: string
}> = [
  {
    id: 'snapshot',
    label: 'Snapshot',
    title: 'Reading snapshot',
    description:
      'Quickly review the current chapter, bridge chapters, and the ideas worth keeping in short-term memory.',
  },
  {
    id: 'contents',
    label: 'Contents',
    title: 'Chapter contents',
    description:
      'Jump across the book without shrinking the reader. Every chapter stays one tap away.',
  },
  {
    id: 'cheatsheet',
    label: 'Cheat sheet',
    title: 'Cheat sheet',
    description:
      'Use the compressed recall layer when you want the big ideas without rereading the entire book.',
  },
  {
    id: 'appendix',
    label: 'Appendix',
    title: 'Appendix',
    description:
      'Open the support shelf for glossaries, routes, heuristics, and sample code patterns.',
  },
  {
    id: 'knowledge-map',
    label: 'Knowledge map',
    title: 'Knowledge map',
    description:
      'See the chapter graph at a readable size so the book works like a connected reference, not a narrow page stack.',
  },
]

function createFocusRequest(
  bookId: string,
  chapterId: string,
  sectionId: string,
): FocusRequest {
  return {
    bookId,
    chapterId,
    sectionId,
    nonce: Date.now(),
  }
}

function createThemeStyle(book: BookData): ThemeStyle {
  return {
    '--book-accent': book.theme.accent,
    '--book-surface': book.theme.surface,
    '--book-glow': book.theme.glow,
    '--book-text': book.theme.text,
  }
}

function App() {
  const [manifest, setManifest] = useState<LibraryManifestEntry[]>([])
  const [booksById, setBooksById] = useState<Record<string, BookData>>({})
  const [readerState, setReaderState] = useState<ReaderState>(() => loadReaderState())
  const [activePanel, setActivePanel] = useState<ReaderPanel>('snapshot')
  const [isShelfOpen, setIsShelfOpen] = useState(false)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isReaderFocus, setIsReaderFocus] = useState(false)
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadLibrary() {
      try {
        const bundle = await loadLibraryBundle()
        if (cancelled) {
          return
        }

        setManifest(bundle.manifest)
        setBooksById(bundle.booksById)
        setReaderState((current) =>
          normalizeReaderState(Object.values(bundle.booksById), current),
        )
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load the library.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadLibrary()

    return () => {
      cancelled = true
    }
  }, [])

  const orderedBooks = useMemo(
    () =>
      manifest.reduce<BookData[]>((items, entry) => {
        const book = booksById[entry.id]
        if (book) {
          items.push(book)
        }
        return items
      }, []),
    [booksById, manifest],
  )

  useEffect(() => {
    if (orderedBooks.length) {
      saveReaderState(readerState)
    }
  }, [orderedBooks.length, readerState])

  const activeBookId = readerState.activeBookId ?? manifest[0]?.id ?? null
  const activeBook = activeBookId ? booksById[activeBookId] ?? null : null
  const activeProgress = useMemo(
    () =>
      activeBook
        ? normalizeBookProgress(activeBook, readerState.bookProgress[activeBook.id])
        : null,
    [activeBook, readerState.bookProgress],
  )
  const currentChapter = useMemo(() => {
    if (!activeBook || !activeProgress) {
      return null
    }

    return (
      activeBook.chapters.find(
        (chapter) => chapter.id === activeProgress.lastChapterId,
      ) ?? activeBook.chapters[0]
    )
  }, [activeBook, activeProgress])
  const currentSection = useMemo(() => {
    if (!currentChapter || !activeProgress) {
      return null
    }

    return (
      currentChapter.sections.find(
        (section) => section.id === activeProgress.lastSectionId,
      ) ?? currentChapter.sections[0]
    )
  }, [activeProgress, currentChapter])
  const bookCompletion =
    activeBook && activeProgress ? getBookCompletion(activeBook, activeProgress) : 0
  const chapterCompletion =
    currentChapter && activeProgress
      ? getChapterCompletion(currentChapter, activeProgress)
      : 0
  const connectedChapters = useMemo(() => {
    if (!activeBook || !currentChapter) {
      return []
    }

    return currentChapter.connections
      .map((chapterId) => activeBook.chapters.find((chapter) => chapter.id === chapterId))
      .filter((chapter): chapter is NonNullable<typeof chapter> => Boolean(chapter))
  }, [activeBook, currentChapter])

  useEffect(() => {
    if (!activeBook || !currentChapter) {
      document.title = 'Bookscape'
      return
    }

    document.title = `${currentChapter.title} | ${activeBook.title}`
  }, [activeBook, currentChapter])

  const selectBook = useCallback(
    (bookId: string) => {
      const book = booksById[bookId]
      if (!book) {
        return
      }

      const progress = normalizeBookProgress(book, readerState.bookProgress[bookId])
      setReaderState((current) => ({
        ...current,
        activeBookId: bookId,
        bookProgress: {
          ...current.bookProgress,
          [bookId]: progress,
        },
      }))
      setFocusRequest(
        createFocusRequest(bookId, progress.lastChapterId, progress.lastSectionId),
      )
      setIsShelfOpen(false)
    },
    [booksById, readerState.bookProgress],
  )

  const toggleBookmark = useCallback(
    (bookId: string) => {
      const book = booksById[bookId]
      if (!book) {
        return
      }

      setReaderState((current) => {
        const progress = normalizeBookProgress(book, current.bookProgress[bookId])
        return {
          ...current,
          bookProgress: {
            ...current.bookProgress,
            [bookId]: {
              ...progress,
              bookmarked: !progress.bookmarked,
            },
          },
        }
      })
    },
    [booksById],
  )

  const navigateToSection = useCallback(
    (chapterId: string, sectionId?: string) => {
      if (!activeBook) {
        return
      }

      const chapter = activeBook.chapters.find((item) => item.id === chapterId)
      const nextSectionId =
        sectionId && chapter?.sections.some((section) => section.id === sectionId)
          ? sectionId
          : chapter?.sections[0]?.id

      if (!chapter || !nextSectionId) {
        return
      }

      const sectionKey = getSectionKey(chapter.id, nextSectionId)

      setReaderState((current) => {
        const progress = normalizeBookProgress(
          activeBook,
          current.bookProgress[activeBook.id],
        )
        const visitedSectionKeys = progress.visitedSectionKeys.includes(sectionKey)
          ? progress.visitedSectionKeys
          : [...progress.visitedSectionKeys, sectionKey]

        return {
          ...current,
          activeBookId: activeBook.id,
          bookProgress: {
            ...current.bookProgress,
            [activeBook.id]: {
              ...progress,
              lastChapterId: chapter.id,
              lastSectionId: nextSectionId,
              visitedSectionKeys,
            },
          },
        }
      })

      setFocusRequest(createFocusRequest(activeBook.id, chapter.id, nextSectionId))
    },
    [activeBook],
  )

  const navigateFromPanel = useCallback(
    (chapterId: string, sectionId?: string) => {
      navigateToSection(chapterId, sectionId)
      setIsPanelOpen(false)
    },
    [navigateToSection],
  )

  const handleSectionVisible = useCallback(
    (sectionId: string) => {
      if (!activeBook || !currentChapter) {
        return
      }

      const sectionKey = getSectionKey(currentChapter.id, sectionId)

      setReaderState((current) => {
        const progress = normalizeBookProgress(
          activeBook,
          current.bookProgress[activeBook.id],
        )

        if (
          progress.lastChapterId === currentChapter.id &&
          progress.lastSectionId === sectionId &&
          progress.visitedSectionKeys.includes(sectionKey)
        ) {
          return current
        }

        const visitedSectionKeys = progress.visitedSectionKeys.includes(sectionKey)
          ? progress.visitedSectionKeys
          : [...progress.visitedSectionKeys, sectionKey]

        return {
          ...current,
          activeBookId: activeBook.id,
          bookProgress: {
            ...current.bookProgress,
            [activeBook.id]: {
              ...progress,
              lastChapterId: currentChapter.id,
              lastSectionId: sectionId,
              visitedSectionKeys,
            },
          },
        }
      })
    },
    [activeBook, currentChapter],
  )

  const shelfBooks = useMemo(() => {
    if (!manifest.length) {
      return []
    }

    return [...manifest].sort((left, right) => {
      const leftProgress = readerState.bookProgress[left.id]
      const rightProgress = readerState.bookProgress[right.id]

      if (left.id === activeBookId) {
        return -1
      }

      if (right.id === activeBookId) {
        return 1
      }

      if (leftProgress?.bookmarked && !rightProgress?.bookmarked) {
        return -1
      }

      if (!leftProgress?.bookmarked && rightProgress?.bookmarked) {
        return 1
      }

      return left.title.localeCompare(right.title)
    })
  }, [activeBookId, manifest, readerState.bookProgress])

  const activePanelMeta = useMemo(
    () => workspacePanels.find((panel) => panel.id === activePanel) ?? workspacePanels[0],
    [activePanel],
  )

  const openPanel = useCallback((panel: ReaderPanel) => {
    setActivePanel(panel)
    setIsPanelOpen(true)
  }, [])

  const togglePanel = useCallback(
    (panel: ReaderPanel) => {
      if (isPanelOpen && activePanel === panel) {
        setIsPanelOpen(false)
        return
      }

      openPanel(panel)
    },
    [activePanel, isPanelOpen, openPanel],
  )

  if (loading) {
    return (
      <div className="app-shell">
        <div className="empty-state">
          <p className="eyebrow">Bookscape</p>
          <h1>Loading the shelf...</h1>
          <p>Preparing the local-first library and reader workspace.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-shell">
        <div className="empty-state" role="alert">
          <p className="eyebrow">Bookscape</p>
          <h1>Library unavailable</h1>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!activeBook || !activeProgress || !currentChapter || !currentSection) {
    return (
      <div className="app-shell">
        <div className="empty-state">
          <p className="eyebrow">Bookscape</p>
          <h1>No books yet</h1>
          <p>Add a JSON book to the manifest to populate the shelf.</p>
        </div>
      </div>
    )
  }

  const book = activeBook
  const progress = activeProgress
  const chapter = currentChapter
  const section = currentSection

  function renderWorkspacePanel() {
    if (activePanel === 'snapshot') {
      return (
        <div className="panel-stack">
          <section className="rail-card">
            <p className="eyebrow">Current chapter</p>
            <h3>{chapter.title}</h3>
            <p>{chapter.summary}</p>
            <div className="snapshot-grid">
              <div>
                <strong>{Math.round(bookCompletion * 100)}%</strong>
                <span>book explored</span>
              </div>
              <div>
                <strong>{Math.round(chapterCompletion * 100)}%</strong>
                <span>chapter complete</span>
              </div>
              <div>
                <strong>{section.heading}</strong>
                <span>current section</span>
              </div>
              <div>
                <strong>{chapter.estimatedMinutes} min</strong>
                <span>chapter reading time</span>
              </div>
            </div>
          </section>

          <section className="rail-card">
            <p className="eyebrow">Key ideas</p>
            <ul className="key-idea-list" role="list">
              {chapter.keyIdeas.map((idea) => (
                <li key={idea}>{idea}</li>
              ))}
            </ul>
          </section>

          <section className="rail-card">
            <p className="eyebrow">Bridge chapters</p>
            <ul className="bridge-list" role="list">
              {connectedChapters.map((chapter) => (
                <li key={chapter.id}>
                  <button
                    type="button"
                    className="bridge-button"
                    onClick={() => navigateFromPanel(chapter.id)}
                  >
                    <strong>{chapter.title}</strong>
                    <span>{chapter.summary}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )
    }

    if (activePanel === 'contents') {
      return (
        <ol className="toc-list">
          {book.chapters.map((chapterItem) => {
            const completion = getChapterCompletion(chapterItem, progress)
            const isCurrent = chapterItem.id === chapter.id

            return (
              <li key={chapterItem.id} className={isCurrent ? 'is-current' : undefined}>
                <button
                  type="button"
                  className="toc-button"
                  onClick={() => navigateFromPanel(chapterItem.id)}
                >
                  <span>{chapterItem.title}</span>
                  <strong>{Math.round(completion * 100)}%</strong>
                </button>
                <p>{chapterItem.summary}</p>
                <div
                  aria-hidden="true"
                  className="mini-progress"
                  style={
                    {
                      '--mini-progress': `${completion}`,
                    } as CSSProperties
                  }
                />
              </li>
            )
          })}
        </ol>
      )
    }

    if (activePanel === 'cheatsheet') {
      return (
        <dl className="cheat-sheet-list">
          {book.cheatSheet.map((entry) => (
            <div key={entry.concept}>
              <dt>{entry.concept}</dt>
              <dd>{entry.reminder}</dd>
              <p>{entry.useWhen}</p>
            </div>
          ))}
        </dl>
      )
    }

    if (activePanel === 'appendix') {
      return (
        <div className="appendix-list">
          {book.appendix.map((group) => (
            <section key={group.title}>
              <h3>{group.title}</h3>
              <ul>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )
    }

    return (
      <div className="panel-stack">
        <section className="rail-card">
          <p className="eyebrow">Map mode</p>
          <p>
            Use the enlarged graph to move by concept. Chapters closer together
            in the map are meant to be read as neighbors, not just as steps in a
            fixed order.
          </p>
          <KnowledgeMap
            book={book}
            currentChapterId={chapter.id}
            progress={progress}
            onSelectChapter={(chapterId) => navigateFromPanel(chapterId)}
            size="expanded"
          />
        </section>

        <section className="rail-card">
          <p className="eyebrow">Current bridges</p>
          <ul className="bridge-list" role="list">
            {connectedChapters.map((chapter) => (
              <li key={chapter.id}>
                <button
                  type="button"
                  className="bridge-button"
                  onClick={() => navigateFromPanel(chapter.id)}
                >
                  <strong>{chapter.title}</strong>
                  <span>{chapter.summary}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    )
  }

  return (
    <div className={`app-shell${isReaderFocus ? ' is-reader-focus' : ''}`}>
      <a className="skip-link" href="#reader-main">
        Skip to the reader
      </a>

      <header className="app-bar">
        <div className="app-bar__leading">
          <button
            type="button"
            className="button app-menu-button"
            aria-haspopup="dialog"
            aria-expanded={isShelfOpen}
            onClick={() => setIsShelfOpen(true)}
          >
            <span aria-hidden="true">☰</span>
            <span>Bookshelf</span>
          </button>

          <div className="brand-lockup">
            <p className="eyebrow">Bookscape</p>
            <h1>{book.title}</h1>
            <p>{book.subtitle}</p>
          </div>
        </div>

        <dl className="app-bar__stats">
          <div>
            <dt>Progress</dt>
            <dd>{Math.round(bookCompletion * 100)}%</dd>
          </div>
          <div>
            <dt>Current chapter</dt>
            <dd>{chapter.title}</dd>
          </div>
          <div>
            <dt>Library</dt>
            <dd>{manifest.length} books</dd>
          </div>
        </dl>
      </header>

      <div className="workspace-tools" role="toolbar" aria-label="Reader workspace">
        {workspacePanels.map((panel) => (
          <button
            key={panel.id}
            type="button"
            className="chip-button"
            aria-pressed={isPanelOpen && activePanel === panel.id}
            aria-haspopup="dialog"
            onClick={() => togglePanel(panel.id)}
          >
            {panel.label}
          </button>
        ))}

        <button
          type="button"
          className="chip-button"
          aria-pressed={isReaderFocus}
          onClick={() => setIsReaderFocus((current) => !current)}
        >
          {isReaderFocus ? 'Exit focus' : 'Reader focus'}
        </button>
      </div>

      <main
        className="workspace"
        id="reader-main"
        style={createThemeStyle(book)}
        tabIndex={-1}
      >
        <section className="chapter-overview">
          <div>
            <p className="eyebrow">Now reading</p>
            <h2>{chapter.title}</h2>
            <p>{chapter.summary}</p>
          </div>

          <dl className="chapter-overview__facts">
            <div>
              <dt>Current section</dt>
              <dd>{section.heading}</dd>
            </div>
            <div>
              <dt>Chapter progress</dt>
              <dd>{Math.round(chapterCompletion * 100)}%</dd>
            </div>
            <div>
              <dt>Reading time</dt>
              <dd>{chapter.estimatedMinutes} min</dd>
            </div>
            <div>
              <dt>Related chapters</dt>
              <dd>{connectedChapters.length}</dd>
            </div>
          </dl>
        </section>

        <section className="reader-stage">
          <ReaderArticle
            key={`${book.id}:${chapter.id}`}
            book={book}
            chapter={chapter}
            chapterCompletion={chapterCompletion}
            currentSectionId={section.id}
            focusRequest={focusRequest}
            onFocusHandled={() => setFocusRequest(null)}
            onJumpLink={navigateToSection}
            onSectionVisible={handleSectionVisible}
          />
        </section>

        {!isReaderFocus ? (
          <section className="bridge-strip">
            <div className="bridge-strip__header">
              <div>
                <p className="eyebrow">Continue by relationship</p>
                <h2>Bridge chapters</h2>
              </div>

              <button
                type="button"
                className="ghost-button"
                onClick={() => openPanel('knowledge-map')}
              >
                Expand map
              </button>
            </div>

            <ul className="bridge-list" role="list">
              {connectedChapters.map((chapter) => (
                <li key={chapter.id}>
                  <button
                    type="button"
                    className="bridge-button"
                    onClick={() => navigateToSection(chapter.id)}
                  >
                    <strong>{chapter.title}</strong>
                    <span>{chapter.summary}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>

      {!isReaderFocus ? (
        <footer className="app-footer">
          <p>
            Bookscape keeps the shelf, progress, and books local-first while the
            reader surface stays focused on the active chapter.
          </p>
        </footer>
      ) : null}

      <OverlayDialog
        open={isShelfOpen}
        variant="drawer"
        title="Bookshelf"
        description="Switch books without permanently shrinking the reading surface."
        onClose={() => setIsShelfOpen(false)}
      >
        <LibraryShelf
          activeBookId={book.id}
          booksById={booksById}
          entries={shelfBooks}
          readerState={readerState}
          onSelectBook={selectBook}
          onToggleBookmark={toggleBookmark}
        />
      </OverlayDialog>

      <OverlayDialog
        open={isPanelOpen}
        variant={activePanel === 'knowledge-map' ? 'wide' : 'panel'}
        title={activePanelMeta.title}
        description={activePanelMeta.description}
        onClose={() => setIsPanelOpen(false)}
      >
        {renderWorkspacePanel()}
      </OverlayDialog>
    </div>
  )
}

export default App
