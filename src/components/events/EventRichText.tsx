import type { ReactNode } from 'react';

const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  const pushWithUrls = (value: string) => {
    let innerCursor = 0;
    for (const match of value.matchAll(URL_PATTERN)) {
      const url = match[0];
      const index = match.index ?? 0;
      if (index > innerCursor) {
        nodes.push(value.slice(innerCursor, index));
      }
      nodes.push(
        <a
          key={`url-${key++}`}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-cyan-300 transition hover:text-cyan-200"
        >
          {url}
        </a>,
      );
      innerCursor = index + url.length;
    }

    if (innerCursor < value.length) {
      nodes.push(value.slice(innerCursor));
    }
  };

  for (const match of text.matchAll(MARKDOWN_LINK_PATTERN)) {
    const full = match[0];
    const label = match[1];
    const url = match[2];
    const index = match.index ?? 0;

    if (index > cursor) {
      pushWithUrls(text.slice(cursor, index));
    }

    nodes.push(
      <a
        key={`md-${key++}`}
        href={url}
        target="_blank"
        rel="noreferrer"
        className="font-semibold text-cyan-300 transition hover:text-cyan-200"
      >
        {label}
      </a>,
    );

    cursor = index + full.length;
  }

  if (cursor < text.length) {
    pushWithUrls(text.slice(cursor));
  }

  return nodes;
}

export default function EventRichText({
  text,
  className = '',
}: {
  text?: string | null;
  className?: string;
}) {
  if (!text) {
    return null;
  }

  const paragraphs = text.split(/\n{2,}/);

  return (
    <div className={className}>
      {paragraphs.map((paragraph, paragraphIndex) => {
        const lines = paragraph.split('\n');
        return (
          <p key={`paragraph-${paragraphIndex}`} className="whitespace-pre-wrap text-sm leading-7 text-[var(--foreground-soft)] md:text-base">
            {lines.map((line, lineIndex) => (
              <span key={`line-${paragraphIndex}-${lineIndex}`}>
                {renderInline(line)}
                {lineIndex < lines.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
