export interface LibraryManifestEntry {
  id: string
  title: string
  subtitle: string
  description: string
  coverEmoji: string
  durationMinutes: number
  tags: string[]
  file: string
  accent: string
  surface: string
}

export interface BookTheme {
  accent: string
  surface: string
  glow: string
  text: string
}

export interface BookCallout {
  label: string
  tone: 'note' | 'insight' | 'warning'
  text: string
}

export interface SectionLink {
  label: string
  targetChapterId: string
  targetSectionId?: string
  reason: string
}

export interface ChapterSection {
  id: string
  heading: string
  lede: string
  body: string[]
  callout?: BookCallout
  links: SectionLink[]
}

export interface ChapterMapPosition {
  x: number
  y: number
}

export interface BookChapter {
  id: string
  title: string
  summary: string
  estimatedMinutes: number
  keyIdeas: string[]
  connections: string[]
  mapPosition: ChapterMapPosition
  sections: ChapterSection[]
}

export interface CheatSheetEntry {
  concept: string
  reminder: string
  useWhen: string
}

export interface AppendixGroup {
  title: string
  items: string[]
}

export interface BookData {
  id: string
  title: string
  subtitle: string
  description: string
  coverEmoji: string
  durationMinutes: number
  tags: string[]
  theme: BookTheme
  cheatSheet: CheatSheetEntry[]
  appendix: AppendixGroup[]
  chapters: BookChapter[]
}

export interface BookProgress {
  bookmarked: boolean
  lastChapterId: string
  lastSectionId: string
  visitedSectionKeys: string[]
}

export interface ReaderState {
  activeBookId: string | null
  bookProgress: Record<string, BookProgress>
}

export type ReaderPanel =
  | 'snapshot'
  | 'contents'
  | 'cheatsheet'
  | 'appendix'
  | 'knowledge-map'

export interface FocusRequest {
  bookId: string
  chapterId: string
  sectionId: string
  nonce: number
}
