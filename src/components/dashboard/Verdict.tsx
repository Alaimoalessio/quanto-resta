'use client';

import type { Verdict as VerdictModel } from '@/domain/verdict';

const TONE = {
  green: 'border-accent',
  amber: 'border-warning',
  red: 'border-danger',
} as const;

/** Rende `**testo**` in grassetto. */
export function RichText({ text }: { text: string }) {
  const parts = text.split('**');
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="tnum font-semibold text-ink">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export function Verdict({ verdict }: { verdict: VerdictModel }) {
  const key = verdict.sentences.join('|');
  return (
    <section
      aria-live="polite"
      aria-label="Verdetto"
      className={`border-l-4 ${TONE[verdict.tone]} py-1 pl-4`}
    >
      <p
        key={key}
        className="verdict-enter font-display text-[1.25rem] leading-snug text-ink/85 md:text-[1.4rem]"
      >
        {verdict.sentences.map((s, i) => (
          <span key={i}>
            <RichText text={s} />{' '}
          </span>
        ))}
      </p>
    </section>
  );
}
