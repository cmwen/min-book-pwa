import type { BookChapter, BookData, BookProgress, ReaderState } from '../types'

const STORAGE_KEY = 'bookscape-reader-state-v1'

export function getSectionKey(chapterId: string, sectionId: string): string {
  return `${chapterId}:${sectionId}`
}

function getAllSectionKeys(book: BookData): Set<string> {
  return new Set(
    book.chapters.flatMap((chapter) =>
      chapter.sections.map((section) => getSectionKey(chapter.id, section.id)),
    ),
  )
}

function getFirstReadableNode(book: BookData): { chapterId: string; sectionId: string } {
  const firstChapter = book.chapters[0]
  const firstSection = firstChapter?.sections[0]

  if (!firstChapter || !firstSection) {
    throw new Error(`Book "${book.title}" must contain readable sections.`)
  }

  return {
    chapterId: firstChapter.id,
    sectionId: firstSection.id,
  }
}

export function normalizeBookProgress(
  book: BookData,
  progress?: BookProgress,
): BookProgress {
  const allSectionKeys = getAllSectionKeys(book)
  const fallback = getFirstReadableNode(book)

  const chapter =
    book.chapters.find((item) => item.id === progress?.lastChapterId) ?? book.chapters[0]
  const section =
    chapter.sections.find((item) => item.id === progress?.lastSectionId) ??
    chapter.sections[0]

  const visitedSectionKeys = [
    ...new Set(
      (progress?.visitedSectionKeys ?? []).filter((key) => allSectionKeys.has(key)),
    ),
  ]
  const currentKey = getSectionKey(chapter.id, section.id)

  if (!visitedSectionKeys.includes(currentKey)) {
    visitedSectionKeys.unshift(currentKey)
  }

  return {
    bookmarked: progress?.bookmarked ?? false,
    lastChapterId: chapter?.id ?? fallback.chapterId,
    lastSectionId: section?.id ?? fallback.sectionId,
    visitedSectionKeys,
  }
}

export function normalizeReaderState(
  books: BookData[],
  state: ReaderState,
): ReaderState {
  const activeBookId =
    state.activeBookId && books.some((book) => book.id === state.activeBookId)
      ? state.activeBookId
      : books[0]?.id ?? null

  return {
    activeBookId,
    bookProgress: Object.fromEntries(
      books.map((book) => [
        book.id,
        normalizeBookProgress(book, state.bookProgress[book.id]),
      ]),
    ),
  }
}

export function loadReaderState(): ReaderState {
  if (typeof window === 'undefined') {
    return { activeBookId: null, bookProgress: {} }
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return { activeBookId: null, bookProgress: {} }
  }

  try {
    return JSON.parse(raw) as ReaderState
  } catch {
    return { activeBookId: null, bookProgress: {} }
  }
}

export function saveReaderState(state: ReaderState): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function getChapterCompletion(
  chapter: BookChapter,
  progress: BookProgress,
): number {
  const visited = chapter.sections.filter((section) =>
    progress.visitedSectionKeys.includes(getSectionKey(chapter.id, section.id)),
  )

  return chapter.sections.length ? visited.length / chapter.sections.length : 0
}

export function getBookCompletion(book: BookData, progress: BookProgress): number {
  const totalSections = book.chapters.reduce(
    (count, chapter) => count + chapter.sections.length,
    0,
  )

  return totalSections ? progress.visitedSectionKeys.length / totalSections : 0
}
