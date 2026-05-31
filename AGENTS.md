# AGENTS.md

## Project purpose

Build and extend **Bookscape**, a PWA for AI-generated books. The app renders books from JSON, stores user progress in local storage, and favors a connected, reference-style reading experience over a purely linear reader.

## When adding a new book

1. Add a manifest entry to `public/books/library.json`.
2. Create a matching `public/books/<slug>.json`.
3. Keep the file valid against `public/schemas/interactive-book.schema.json`.
4. Make sure every chapter has:
   - a concise summary,
   - at least one section,
   - at least one meaningful connection to another chapter when the concept graph benefits from it.
5. Include both:
   - a **cheat sheet** for quick reminders,
   - an **appendix** for supporting detail, glossaries, or operating notes.

## Authoring principles for generated books

- Write for **nonlinear reading**. Readers should be able to start from a question, not only from chapter one.
- Prefer **short, linkable sections** over very long chapters.
- Use section links to explain **why** the reader should jump somewhere else.
- Make the tone feel closer to a **living reference** or **field guide** than a traditional ebook.
- Keep headings specific so the knowledge map and table of contents stay meaningful.
- Keep JSON plain and deterministic: stable IDs, no markdown, no HTML.

## Schema expectations

- `id` values should be kebab-case and stable.
- `mapPosition.x` and `mapPosition.y` should stay within `0..100`.
- `links[].targetChapterId` must point to an existing chapter.
- `links[].targetSectionId`, when present, must point to a valid section in that chapter.
- Theme colors should preserve good contrast against the dark app shell.

## QA checklist

- The new book appears on the bookshelf.
- Chapters can be opened from the table of contents and the knowledge map.
- Related section links jump correctly.
- Progress persists after refresh.
