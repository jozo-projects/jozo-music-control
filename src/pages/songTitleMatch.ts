// Mirror the backend song-name boundary when combining cached and local results.
export function exactSongTitle(query: string, title: string): boolean {
  const phrase = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\b(?:music|karaoke|official|mv)\b/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!phrase) return false;
  const normalizedTitle = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = `(?:^|[-|–—])\\s*(?:\\[karaoke\\]\\s*|karaoke\\s+)?${escaped}(?=\\s*(?:$|[-|–—]|\\(\\s*(?:official|mv|lyric|lyrics|live|lofi|remix|the playah|karaoke|audio|version|cover|beat)\\b|\\[\\s*(?:official|karaoke|lyric|live)\\b|karaoke\\b|official\\b|mv\\b|lyric\\b|live\\b|remix\\b))`;
  return new RegExp(pattern, 'i').test(normalizedTitle);
}
