export function buildSearchQuery(query: string, karaoke = false): string {
  const trimmed = query.toLowerCase().trim();
  if (!trimmed) return '';
  if (karaoke && /\bkaraoke\b/.test(trimmed)) return trimmed;
  if (!karaoke && /\b(?:official\s+mv|music|mv)$/.test(trimmed)) return trimmed;
  return `${trimmed} ${karaoke ? 'karaoke' : 'music'}`;
}
