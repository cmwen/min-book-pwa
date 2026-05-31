import { useEffect, useRef } from 'react'
import type { BookChapter, BookData, FocusRequest } from '../types'

interface ReaderArticleProps {
  book: BookData
  chapter: BookChapter
  chapterCompletion: number
  currentSectionId: string
  focusRequest: FocusRequest | null
  onFocusHandled: () => void
  onJumpLink: (chapterId: string, sectionId?: string) => void
  onSectionVisible: (sectionId: string) => void
}

function getMotionBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth'
}

export function ReaderArticle({
  book,
  chapter,
  chapterCompletion,
  currentSectionId,
  focusRequest,
  onFocusHandled,
  onJumpLink,
  onSectionVisible,
}: ReaderArticleProps) {
  const articleRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const scroller = articleRef.current
    if (!scroller || CSS.supports('animation-timeline', 'scroll()')) {
      return
    }

    const syncProgress = () => {
      const scrollable = scroller.scrollHeight - scroller.clientHeight
      const progress = scrollable <= 0 ? 1 : scroller.scrollTop / scrollable
      scroller.style.setProperty('--scroll-progress', progress.toFixed(4))
    }

    syncProgress()
    scroller.addEventListener('scroll', syncProgress, { passive: true })
    window.addEventListener('resize', syncProgress)

    return () => {
      scroller.removeEventListener('scroll', syncProgress)
      window.removeEventListener('resize', syncProgress)
    }
  }, [chapter.id])

  useEffect(() => {
    const scroller = articleRef.current
    if (!scroller) {
      return
    }

    const sections = Array.from(
      scroller.querySelectorAll<HTMLElement>('[data-section-id]'),
    )
    const observer = new IntersectionObserver(
      (entries) => {
        const activeEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0]

        const sectionId = activeEntry?.target.getAttribute('data-section-id')
        if (sectionId) {
          onSectionVisible(sectionId)
        }
      },
      {
        root: scroller,
        threshold: [0.35, 0.6, 0.85],
      },
    )

    for (const section of sections) {
      observer.observe(section)
    }

    return () => {
      observer.disconnect()
    }
  }, [chapter.id, onSectionVisible])

  useEffect(() => {
    if (!focusRequest || focusRequest.chapterId !== chapter.id) {
      return
    }

    const scroller = articleRef.current
    if (!scroller) {
      return
    }

    const target = scroller.querySelector<HTMLElement>(
      `[data-section-id="${focusRequest.sectionId}"]`,
    )

    if (target) {
      target.focus()
      target.scrollIntoView({ behavior: getMotionBehavior(), block: 'start' })
    } else {
      scroller.scrollTo({ top: 0, behavior: getMotionBehavior() })
    }

    onFocusHandled()
  }, [chapter.id, focusRequest, onFocusHandled])

  return (
    <article className="reader-article" ref={articleRef}>
      <div className="reader-progress" aria-hidden="true">
        <span className="reader-progress__fill" />
      </div>

      <header className="chapter-hero">
        <p className="eyebrow">{book.title}</p>
        <h2>{chapter.title}</h2>
        <p>{chapter.summary}</p>

        <dl className="chapter-hero__facts">
          <div>
            <dt>Reader mode</dt>
            <dd>Connected chapters</dd>
          </div>
          <div>
            <dt>Chapter progress</dt>
            <dd>{Math.round(chapterCompletion * 100)}%</dd>
          </div>
          <div>
            <dt>Estimated time</dt>
            <dd>{chapter.estimatedMinutes} min</dd>
          </div>
        </dl>

        <ul className="key-idea-list" role="list">
          {chapter.keyIdeas.map((idea) => (
            <li key={idea}>{idea}</li>
          ))}
        </ul>
      </header>

      {chapter.sections.map((section, index) => (
        <section
          key={section.id}
          className={`chapter-section${section.id === currentSectionId ? ' is-active' : ''}`}
          data-section-id={section.id}
          tabIndex={-1}
        >
          <div className="section-header">
            <span className="section-number">
              {chapter.id}.{index + 1}
            </span>
            <span>{section.links.length} jump links</span>
          </div>

          <div>
            <h3>{section.heading}</h3>
            <p className="section-lede">{section.lede}</p>
          </div>

          {section.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          {section.callout ? (
            <aside className="callout" data-tone={section.callout.tone}>
              <strong>{section.callout.label}</strong>
              <p>{section.callout.text}</p>
            </aside>
          ) : null}

          {section.links.length ? (
            <div className="section-links">
              <h4>Jump by relationship</h4>
              <ul>
                {section.links.map((link) => (
                  <li key={`${section.id}-${link.label}`}>
                    <button
                      type="button"
                      onClick={() => onJumpLink(link.targetChapterId, link.targetSectionId)}
                    >
                      <span>{link.label}</span>
                      <span>{link.reason}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ))}
    </article>
  )
}
