import { useState } from 'react'

/**
 * Text clamped to a few lines, with a "Show more" toggle when it is longer. The toggle stops the click from
 * reaching a surrounding button, so opening a long message does not also mark it as read.
 */
export default function ExpandableText({ text, lines = 2, className = '' }: { text: string; lines?: number; className?: string }) {
  const [open, setOpen] = useState(false)
  const long = text.length > 160 || text.split('\n').length > lines

  return (
    <span className={`block min-w-0 ${className}`}>
      <span
        className="block whitespace-pre-line break-words"
        style={open || !long ? undefined : { display: '-webkit-box', WebkitLineClamp: lines, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
      >
        {text}
      </span>
      {long && (
        <span
          role="button"
          tabIndex={0}
          aria-expanded={open}
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            setOpen((v) => !v)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              e.stopPropagation()
              setOpen((v) => !v)
            }
          }}
          className="mt-0.5 inline-block cursor-pointer text-xs font-semibold text-brand-700 hover:underline dark:text-brand-400"
        >
          {open ? 'Show less' : 'Show more'}
        </span>
      )}
    </span>
  )
}
