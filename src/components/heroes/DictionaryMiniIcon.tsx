'use client';

type DictionaryMiniIconProps = {
  imageUrl?: string | null;
  label: string;
  size?: number;
  className?: string;
};

export default function DictionaryMiniIcon({
  imageUrl,
  label,
  size = 20,
  className = '',
}: DictionaryMiniIconProps) {
  const style = {
    width: `${size}px`,
    height: `${size}px`,
  };

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-strong)] ${className}`}
      style={style}
      aria-hidden="true"
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-full w-full object-contain p-[2px]" />
      ) : (
        <span className="text-[10px] font-semibold uppercase text-[var(--foreground-muted)]">
          {label.slice(0, 1)}
        </span>
      )}
    </span>
  );
}
