'use client';

import type { ReactNode } from 'react';

type SafeMarkdownProps = {
  content?: string | null;
  className?: string;
  textClassName?: string;
  linkClassName?: string;
};

type Block =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'blockquote'; lines: string[] }
  | { type: 'unordered-list'; items: string[] }
  | { type: 'ordered-list'; items: string[] }
  | { type: 'paragraph'; lines: string[] };

type InlineToken =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string }
  | { type: 'strike'; value: string }
  | { type: 'link'; label: string; href: string };

const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const URL_PATTERN = /(https?:\/\/[^\s)]+)(?!\))/g;
const HEADING_PATTERN = /^(#{1,3})\s+(.+?)\s*$/;
const ORDERED_LIST_PATTERN = /^\d+\.\s+(.+?)\s*$/;
const UNORDERED_LIST_PATTERN = /^[-*]\s+(.+?)\s*$/;
const BLOCKQUOTE_PATTERN = /^>\s?(.*)$/;

function sanitizeLink(href: string) {
  return /^https?:\/\//i.test(href) ? href : null;
}

function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let cursor = 0;

  const pushFormattedText = (value: string) => {
    const pattern = /(\*\*([^*]+)\*\*|~~([^~]+)~~|\*([^*]+)\*)/g;
    let innerCursor = 0;

    for (const match of value.matchAll(pattern)) {
      const full = match[0];
      const index = match.index ?? 0;

      if (index > innerCursor) {
        tokens.push({ type: 'text', value: value.slice(innerCursor, index) });
      }

      if (match[2]) {
        tokens.push({ type: 'bold', value: match[2] });
      } else if (match[3]) {
        tokens.push({ type: 'strike', value: match[3] });
      } else if (match[4]) {
        tokens.push({ type: 'italic', value: match[4] });
      } else {
        tokens.push({ type: 'text', value: full });
      }

      innerCursor = index + full.length;
    }

    if (innerCursor < value.length) {
      tokens.push({ type: 'text', value: value.slice(innerCursor) });
    }
  };

  for (const match of text.matchAll(MARKDOWN_LINK_PATTERN)) {
    const full = match[0];
    const label = match[1];
    const href = sanitizeLink(match[2]);
    const index = match.index ?? 0;

    if (index > cursor) {
      pushFormattedText(text.slice(cursor, index));
    }

    if (href) {
      tokens.push({ type: 'link', label, href });
    } else {
      tokens.push({ type: 'text', value: full });
    }

    cursor = index + full.length;
  }

  if (cursor < text.length) {
    const tail = text.slice(cursor);
    let tailCursor = 0;

    for (const match of tail.matchAll(URL_PATTERN)) {
      const full = match[0];
      const href = sanitizeLink(full);
      const index = match.index ?? 0;

      if (index > tailCursor) {
        pushFormattedText(tail.slice(tailCursor, index));
      }

      if (href) {
        tokens.push({ type: 'link', label: full, href });
      } else {
        tokens.push({ type: 'text', value: full });
      }

      tailCursor = index + full.length;
    }

    if (tailCursor < tail.length) {
      pushFormattedText(tail.slice(tailCursor));
    }
  }

  return tokens;
}

function renderInline(text: string, linkClassName: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let key = 0;

  for (const token of parseInline(text)) {
    if (token.type === 'text') {
      nodes.push(token.value);
      continue;
    }

    if (token.type === 'bold') {
      nodes.push(
        <strong key={'strong-' + key++} className="font-semibold text-[var(--foreground)]">
          {token.value}
        </strong>,
      );
      continue;
    }

    if (token.type === 'italic') {
      nodes.push(
        <em key={'em-' + key++} className="italic">
          {token.value}
        </em>,
      );
      continue;
    }

    if (token.type === 'strike') {
      nodes.push(
        <s key={'strike-' + key++} className="opacity-80">
          {token.value}
        </s>,
      );
      continue;
    }

    nodes.push(
      <a
        key={'link-' + key++}
        href={token.href}
        target="_blank"
        rel="noreferrer"
        className={linkClassName}
      >
        {token.label}
      </a>,
    );
  }

  return nodes;
}

function parseBlocks(content: string): Block[] {
  const blocks: Block[] = [];
  const normalizedLines = content.replace(/\r\n/g, '\n').split('\n');
  let index = 0;

  while (index < normalizedLines.length) {
    const rawLine = normalizedLines[index];
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const headingMatch = line.match(HEADING_PATTERN);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: Math.min(headingMatch[1].length, 3) as 1 | 2 | 3,
        text: headingMatch[2],
      });
      index += 1;
      continue;
    }

    if (BLOCKQUOTE_PATTERN.test(line)) {
      const lines: string[] = [];
      while (index < normalizedLines.length) {
        const quoteLine = normalizedLines[index].trimEnd();
        const match = quoteLine.match(BLOCKQUOTE_PATTERN);
        if (!match) {
          break;
        }
        lines.push(match[1]);
        index += 1;
      }
      blocks.push({ type: 'blockquote', lines });
      continue;
    }

    if (UNORDERED_LIST_PATTERN.test(line)) {
      const items: string[] = [];
      while (index < normalizedLines.length) {
        const listLine = normalizedLines[index].trimEnd();
        const match = listLine.match(UNORDERED_LIST_PATTERN);
        if (!match) {
          break;
        }
        items.push(match[1]);
        index += 1;
      }
      blocks.push({ type: 'unordered-list', items });
      continue;
    }

    if (ORDERED_LIST_PATTERN.test(line)) {
      const items: string[] = [];
      while (index < normalizedLines.length) {
        const listLine = normalizedLines[index].trimEnd();
        const match = listLine.match(ORDERED_LIST_PATTERN);
        if (!match) {
          break;
        }
        items.push(match[1]);
        index += 1;
      }
      blocks.push({ type: 'ordered-list', items });
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < normalizedLines.length) {
      const paragraphLine = normalizedLines[index].trimEnd();
      if (!paragraphLine.trim()) {
        break;
      }
      if (
        HEADING_PATTERN.test(paragraphLine) ||
        BLOCKQUOTE_PATTERN.test(paragraphLine) ||
        UNORDERED_LIST_PATTERN.test(paragraphLine) ||
        ORDERED_LIST_PATTERN.test(paragraphLine)
      ) {
        if (paragraphLines.length > 0) {
          break;
        }
      }
      paragraphLines.push(paragraphLine);
      index += 1;
      if (index < normalizedLines.length && !normalizedLines[index].trim()) {
        break;
      }
    }
    blocks.push({ type: 'paragraph', lines: paragraphLines });
  }

  return blocks;
}

function renderLines(lines: string[], linkClassName: string) {
  return lines.map((line, lineIndex) => (
    <span key={'line-' + lineIndex}>
      {renderInline(line, linkClassName)}
      {lineIndex < lines.length - 1 ? <br /> : null}
    </span>
  ));
}

export default function SafeMarkdown({
  content,
  className = '',
  textClassName = 'text-sm leading-7 text-[var(--foreground-soft)] md:text-base',
  linkClassName = 'font-semibold text-cyan-300 transition hover:text-cyan-200',
}: SafeMarkdownProps) {
  const trimmed = content?.trim();

  if (!trimmed) {
    return null;
  }

  const blocks = parseBlocks(trimmed);

  return (
    <div className={className}>
      {blocks.map((block, blockIndex) => {
        if (block.type === 'heading') {
          const headingClassName =
            block.level === 1
              ? 'text-2xl font-semibold text-[var(--foreground)]'
              : block.level === 2
                ? 'text-xl font-semibold text-[var(--foreground)]'
                : 'text-lg font-semibold text-[var(--foreground)]';

          return (
            <div key={'block-' + blockIndex} className={blockIndex > 0 ? 'mt-5' : ''}>
              <div className={headingClassName}>{renderInline(block.text, linkClassName)}</div>
            </div>
          );
        }

        if (block.type === 'blockquote') {
          return (
            <blockquote
              key={'block-' + blockIndex}
              className={(blockIndex > 0 ? 'mt-5 ' : '') + 'border-l-2 border-cyan-400/40 pl-4 ' + textClassName}
            >
              {renderLines(block.lines, linkClassName)}
            </blockquote>
          );
        }

        if (block.type === 'unordered-list') {
          return (
            <ul
              key={'block-' + blockIndex}
              className={(blockIndex > 0 ? 'mt-5 ' : '') + 'list-disc space-y-2 pl-5 ' + textClassName}
            >
              {block.items.map((item, itemIndex) => (
                <li key={'item-' + itemIndex}>{renderInline(item, linkClassName)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === 'ordered-list') {
          return (
            <ol
              key={'block-' + blockIndex}
              className={(blockIndex > 0 ? 'mt-5 ' : '') + 'list-decimal space-y-2 pl-5 ' + textClassName}
            >
              {block.items.map((item, itemIndex) => (
                <li key={'item-' + itemIndex}>{renderInline(item, linkClassName)}</li>
              ))}
            </ol>
          );
        }

        return (
          <p
            key={'block-' + blockIndex}
            className={(blockIndex > 0 ? 'mt-5 ' : '') + 'whitespace-pre-wrap break-words [overflow-wrap:anywhere] ' + textClassName}
          >
            {renderLines(block.lines, linkClassName)}
          </p>
        );
      })}
    </div>
  );
}
