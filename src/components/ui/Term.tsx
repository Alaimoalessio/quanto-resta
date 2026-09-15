'use client';

import { useId, useState, type ReactNode } from 'react';

interface TermProps {
  help: string; // una riga
  children: ReactNode;
}

/** Termine tecnico con tooltip di una riga, accessibile da tastiera (focus) e da puntatore. */
export function Term({ help, children }: TermProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        type="button"
        aria-describedby={id}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onPointerEnter={() => setOpen(true)}
        onPointerLeave={() => setOpen(false)}
        className="cursor-help rounded font-[inherit] tracking-[inherit] underline decoration-secondary/60 decoration-dotted underline-offset-2 [text-transform:inherit]"
      >
        {children}
      </button>
      <span
        id={id}
        role="tooltip"
        hidden={!open}
        className="absolute bottom-full left-0 z-20 mb-1.5 w-64 rounded border border-border bg-surface px-2.5 py-1.5 text-left text-xs font-normal text-ink normal-case tracking-normal shadow-sm"
      >
        {help}
      </span>
    </span>
  );
}
