import SafeMarkdown from '@/components/markdown/SafeMarkdown';
export default function EventRichText({
  text,
  className = '',
}: {
  text?: string | null;
  className?: string;
}) {
  return <SafeMarkdown content={text} className={className} />;
}