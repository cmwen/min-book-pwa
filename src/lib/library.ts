import type { BookData, LibraryManifestEntry } from '../types'

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${import.meta.env.BASE_URL}${path}`)
  if (!response.ok) {
    throw new Error(`Failed to load ${path} (${response.status})`)
  }

  return (await response.json()) as T
}

function validateBook(book: BookData): void {
  if (!book.chapters.length) {
    throw new Error(`Book "${book.title}" must define at least one chapter.`)
  }

  for (const chapter of book.chapters) {
    if (!chapter.sections.length) {
      throw new Error(
        `Chapter "${chapter.title}" in "${book.title}" must define at least one section.`,
      )
    }
  }
}

export async function loadLibraryBundle(): Promise<{
  manifest: LibraryManifestEntry[]
  booksById: Record<string, BookData>
}> {
  const manifest = await fetchJson<LibraryManifestEntry[]>('books/library.json')
  const books = await Promise.all(
    manifest.map(async (entry) => {
      const book = await fetchJson<BookData>(entry.file)
      validateBook(book)
      if (book.id !== entry.id) {
        throw new Error(`Manifest entry "${entry.id}" does not match book "${book.id}".`)
      }

      return book
    }),
  )

  return {
    manifest,
    booksById: Object.fromEntries(books.map((book) => [book.id, book])),
  }
}
