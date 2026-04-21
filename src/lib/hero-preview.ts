export function getHeroPreviewAccentClass(elementName: string | null | undefined) {
  const normalized = (elementName ?? '').trim().toLocaleLowerCase();

  if (normalized.includes('ice') || normalized.includes('лед') || normalized.includes('лёд')) {
    return 'border-sky-300/60 bg-gradient-to-b from-sky-400/72 via-sky-400/28 to-sky-950/12 shadow-[0_0_28px_rgba(56,189,248,0.32)]';
  }

  if (normalized.includes('fire') || normalized.includes('огонь')) {
    return 'border-rose-300/60 bg-gradient-to-b from-rose-400/72 via-rose-400/28 to-red-950/12 shadow-[0_0_28px_rgba(251,113,133,0.3)]';
  }

  if (normalized.includes('nature') || normalized.includes('природа')) {
    return 'border-emerald-300/60 bg-gradient-to-b from-emerald-400/72 via-emerald-400/28 to-emerald-950/12 shadow-[0_0_28px_rgba(52,211,153,0.3)]';
  }

  if (normalized.includes('dark') || normalized.includes('тьма')) {
    return 'border-violet-300/60 bg-gradient-to-b from-violet-400/68 via-violet-400/28 to-purple-950/16 shadow-[0_0_28px_rgba(167,139,250,0.3)]';
  }

  if (normalized.includes('holy') || normalized.includes('свят')) {
    return 'border-amber-300/70 bg-gradient-to-b from-amber-300/70 via-amber-300/28 to-yellow-950/10 shadow-[0_0_28px_rgba(251,191,36,0.28)]';
  }

  return 'border-[var(--border)] bg-gradient-to-b from-[var(--surface-strong)] to-[var(--surface)]';
}
