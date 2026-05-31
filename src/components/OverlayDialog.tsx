import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

interface OverlayDialogProps {
  open: boolean
  title: string
  description?: string
  variant?: 'drawer' | 'panel' | 'wide'
  onClose: () => void
  children: ReactNode
}

export function OverlayDialog({
  open,
  title,
  description,
  variant = 'panel',
  onClose,
  children,
}: OverlayDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      return
    }

    if (open) {
      if (!dialog.open) {
        dialog.showModal()
      }
      return
    }

    if (dialog.open) {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      return
    }

    const handleClose = () => {
      onClose()
    }

    dialog.addEventListener('close', handleClose)
    return () => {
      dialog.removeEventListener('close', handleClose)
    }
  }, [onClose])

  return (
    <dialog
      ref={dialogRef}
      className={`overlay-dialog overlay-dialog--${variant}`}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          dialogRef.current?.close()
        }
      }}
    >
      <div className="overlay-dialog__surface">
        <header className="overlay-dialog__header">
          <div>
            <p className="eyebrow">Workspace panel</p>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>

          <button
            type="button"
            className="ghost-button"
            onClick={() => dialogRef.current?.close()}
          >
            Close
          </button>
        </header>

        <div className="overlay-dialog__body">{children}</div>
      </div>
    </dialog>
  )
}
