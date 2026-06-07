'use client';

import DictionaryMiniIcon from './DictionaryMiniIcon';
import HeroInfoPopover from './admin/HeroInfoPopover';

type DictionaryInlineValueProps = {
  label: string;
  value: string;
  imageUrl?: string | null;
  iconSize?: number;
  chromelessIcon?: boolean;
  valueClassName?: string;
  tooltipContent?: string | null;
};

export default function DictionaryInlineValue({
  label,
  value,
  imageUrl,
  iconSize = 20,
  chromelessIcon = false,
  valueClassName = '',
  tooltipContent,
}: DictionaryInlineValueProps) {
  const iconNode = (
    <DictionaryMiniIcon imageUrl={imageUrl} label={value} size={iconSize} chromeless={chromelessIcon} />
  );

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <span className="shrink-0 self-center">{label}:</span>
      <span className="flex min-w-0 flex-1 items-center gap-2">
        {imageUrl && tooltipContent ? (
          <HeroInfoPopover
            label={label}
            content={tooltipContent}
            triggerClassName="inline-flex shrink-0 rounded-xl transition hover:scale-[1.03]"
            trigger={iconNode}
          />
        ) : (
          iconNode
        )}
        <span className={`min-w-0 leading-tight [overflow-wrap:anywhere] ${valueClassName}`}>{value}</span>
      </span>
    </div>
  );
}
