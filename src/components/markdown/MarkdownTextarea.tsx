'use client';

import { useRef } from 'react';
import MarkdownToolbar, { type MarkdownAction } from './MarkdownToolbar';

type MarkdownTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  textareaClassName?: string;
  toolbarLabels?: {
    linkPrompt: string;
  };
};

function wrapSelection(value: string, selectionStart: number, selectionEnd: number, before: string, after = before) {
  const selected = value.slice(selectionStart, selectionEnd) || 'text';
  const nextValue = value.slice(0, selectionStart) + before + selected + after + value.slice(selectionEnd);
  const caretStart = selectionStart + before.length;
  const caretEnd = caretStart + selected.length;

  return { nextValue, caretStart, caretEnd };
}

function prefixLines(value: string, selectionStart: number, selectionEnd: number, prefixBuilder: (index: number) => string) {
  const lineStart = value.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1;
  const lineEndCandidate = value.indexOf('\n', selectionEnd);
  const lineEnd = lineEndCandidate === -1 ? value.length : lineEndCandidate;
  const selectedBlock = value.slice(lineStart, lineEnd);
  const lines = selectedBlock.split('\n');
  const prefixedLines = lines.map((line, index) => prefixBuilder(index) + line);
  const nextBlock = prefixedLines.join('\n');
  const nextValue = value.slice(0, lineStart) + nextBlock + value.slice(lineEnd);

  return {
    nextValue,
    caretStart: lineStart,
    caretEnd: lineStart + nextBlock.length,
  };
}

export default function MarkdownTextarea({
  value,
  onChange,
  rows = 5,
  disabled = false,
  placeholder,
  className = '',
  textareaClassName = '',
  toolbarLabels = {
    linkPrompt: 'Enter URL',
  },
}: MarkdownTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const applyAction = (action: MarkdownAction) => {
    const textarea = textareaRef.current;
    if (!textarea || disabled) {
      return;
    }

    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    let result: { nextValue: string; caretStart: number; caretEnd: number } | null = null;

    if (action.type === 'bold') {
      result = wrapSelection(value, selectionStart, selectionEnd, '**');
    } else if (action.type === 'italic') {
      result = wrapSelection(value, selectionStart, selectionEnd, '*');
    } else if (action.type === 'strike') {
      result = wrapSelection(value, selectionStart, selectionEnd, '~~');
    } else if (action.type === 'quote') {
      result = prefixLines(value, selectionStart, selectionEnd, () => '> ');
    } else if (action.type === 'bullet-list') {
      result = prefixLines(value, selectionStart, selectionEnd, () => '- ');
    } else if (action.type === 'ordered-list') {
      result = prefixLines(value, selectionStart, selectionEnd, (index) => String(index + 1) + '. ');
    } else if (action.type === 'link') {
      const selected = value.slice(selectionStart, selectionEnd) || '@label';
      const url = window.prompt(toolbarLabels.linkPrompt, 'https://');
      if (!url) {
        textarea.focus();
        return;
      }

      const nextValue = value.slice(0, selectionStart) + '[' + selected + '](' + url + ')' + value.slice(selectionEnd);
      result = {
        nextValue,
        caretStart: selectionStart + 1,
        caretEnd: selectionStart + 1 + selected.length,
      };
    }

    if (!result) {
      return;
    }

    onChange(result.nextValue);

    requestAnimationFrame(() => {
      const currentTextarea = textareaRef.current;
      if (!currentTextarea) {
        return;
      }

      currentTextarea.focus();
      currentTextarea.setSelectionRange(result.caretStart, result.caretEnd);
    });
  };

  return (
    <div className={(className ? className + ' ' : '') + 'space-y-2'}>
      <MarkdownToolbar disabled={disabled} onApply={applyAction} />
      <textarea
        ref={textareaRef}
        rows={rows}
        value={value}
        disabled={disabled}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
        className={'w-full rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400/40 ' + textareaClassName}
        placeholder={placeholder}
      />
    </div>
  );
}
