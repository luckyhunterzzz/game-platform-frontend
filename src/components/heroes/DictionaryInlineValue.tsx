'use client';

import DictionaryMiniIcon from './DictionaryMiniIcon';

type DictionaryInlineValueProps = {
  label: string;
  value: string;
  imageUrl?: string | null;
  iconSize?: number;
  chromelessIcon?: boolean;
  valueClassName?: string;
};

export default function DictionaryInlineValue({
  label,
  value,
  imageUrl,
  iconSize = 20,
  chromelessIcon = false,
  valueClassName = '',
}: DictionaryInlineValueProps) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <span className="shrink-0 self-center">{label}:</span>
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <DictionaryMiniIcon imageUrl={imageUrl} label={value} size={iconSize} chromeless={chromelessIcon} />
        <span className={`min-w-0 leading-tight [overflow-wrap:anywhere] ${valueClassName}`}>{value}</span>
      </span>
    </div>
  );
}
