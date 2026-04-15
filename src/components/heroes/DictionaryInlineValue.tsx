'use client';

import DictionaryMiniIcon from './DictionaryMiniIcon';

type DictionaryInlineValueProps = {
  label: string;
  value: string;
  imageUrl?: string | null;
  iconSize?: number;
  valueClassName?: string;
};

export default function DictionaryInlineValue({
  label,
  value,
  imageUrl,
  iconSize = 20,
  valueClassName = '',
}: DictionaryInlineValueProps) {
  return (
    <div className="flex min-w-0 flex-1 items-start gap-2">
      <span className="shrink-0">{label}:</span>
      <span className="flex min-w-0 flex-1 items-start gap-2">
        <DictionaryMiniIcon imageUrl={imageUrl} label={value} size={iconSize} />
        <span className={`min-w-0 whitespace-normal leading-5 [overflow-wrap:anywhere] ${valueClassName}`}>{value}</span>
      </span>
    </div>
  );
}
