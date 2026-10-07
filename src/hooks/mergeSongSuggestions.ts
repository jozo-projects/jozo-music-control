const normalize = (title: string) => title.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase();
const compact = (title: string) => normalize(title).replace(/[^a-z0-9]/g, "");

// Only derive a name from a matching source title; never complete a query from a hard-coded song list.
const songNameFromVideo = (raw: string, keyword: string, karaoke: boolean): string | null => {
  const query = normalize(keyword);
  if (!query || /\bmashup\b/i.test(raw) && !/\bmashup\b/i.test(keyword)) return null;
  if (keyword.trim().toLocaleLowerCase("vi-VN") !== query && !raw.toLocaleLowerCase("vi-VN").includes(keyword.trim().toLocaleLowerCase("vi-VN"))) return null;
  if (/\b(?:amv|nonstop|remix|speed\s*up)\b|\s+x\s+|^\s*top\s+(?:các\s+)?ca\s+khúc/i.test(raw)) return null;
  if (!normalize(raw).includes(query) && !compact(raw).includes(compact(keyword))) return null;
  // In music mode a karaoke-only video is not evidence of an official recording.
  if (!karaoke && /\bkaraoke\b/i.test(raw) && !/\bofficial\b/i.test(raw)) return null;

  const stripped = raw
    .replace(/^\s*(?:\[\s*karaoke[^\]]*\]\s*[-:]?\s*|karaoke(?:\s+hd)?\s*[:-]?\s*)/i, "")
    .trim();
  const parts = stripped.split(/\s+[|–—-]\s+|\s*\|\s*/).map((part) => part.trim()).filter(Boolean);
  const artistFirst = parts.length > 1 && compact(parts[0]) === compact(keyword)
    && parts[0].split(/\s+/).length <= 2 && !/^(official|karaoke|lyric|audio)/i.test(parts[1]);
  const artistAfter = parts.slice(1).some((part) => compact(part) === compact(keyword));
  let name = (artistFirst ? parts[1] : parts[0] ?? "")
    .replace(/\s*\((?:prod\.?|produced|official|remix|beat)[^)]*\)/gi, "")
    .replace(/\s*\[(?:official|karaoke|lyric|audio|remix|beat)[^\]]*\]/gi, "")
    .replace(/\s+karaoke\b.*$/i, "")
    .replace(/\s+(?:official|lyric|music video|mv|beat)\b.*$/i, "")
    .trim();
  if (!name || /\b(?:mashup|nonstop)\b/i.test(name)) return null;
  if (!artistFirst && !artistAfter && !normalize(name).startsWith(query)) return null;
  if (compact(name) === compact(keyword) && (artistFirst || artistAfter || name.split(/\s+/).length === 1 && normalize(name) !== query)) return null;
  // Preserve mixed-case source names, but make ALL-CAPS YouTube titles readable.
  if (name === name.toLocaleUpperCase("vi-VN")) {
    name = name.toLocaleLowerCase("vi-VN").replace(/(^|\s)(\p{L})/gu, (_, space: string, letter: string) => space + letter.toLocaleUpperCase("vi-VN"));
  }
  return `${name} ${karaoke ? "karaoke" : "official MV"}`;
};

const artistFromTitles = (titles: string[], keyword: string): string | null => {
  const query = normalize(keyword);
  for (const title of titles) {
    const segments = title.split(/\s+[|–—-]\s+|\s*\|\s*|\]\s*-\s*/).map((part) => part.trim());
    for (const [index, segment] of segments.entries()) {
      const artist = segment.replace(/\s+x\s+.*$/i, "").replace(/\s*\([^)]*\).*$/, "").trim();
      const words = artist.split(/\s+/);
      if (words.length < 2 || words.length > 4 || !normalize(artist).startsWith(query)) continue;
      // The first segment may be the song; only trust it when the same name appears as the credited artist.
      if (index === 0 && !segments.slice(1).some((part) => compact(part) === compact(artist))) continue;
      return artist === artist.toLocaleUpperCase("vi-VN")
        ? artist.toLocaleLowerCase("vi-VN").replace(/(^|\s)(\p{L})/gu, (_, space: string, letter: string) => space + letter.toLocaleUpperCase("vi-VN"))
        : artist;
    }
  }
  return null;
};

export const mergeSongSuggestions = (local?: string[], remote?: string[], karaoke = false, keyword?: string): string[] => {
  const unique = new Set<string>();
  const suggestions: string[] = [];
  const baseName = (title: string) => normalize(title).replace(/\s+(?:karaoke|official mv)$/, "");
  const candidates = [...(local ?? []), ...(remote ?? [])];
  if (karaoke) {
    candidates.sort((a, b) => Number(/karaoke/i.test(b)) - Number(/karaoke/i.test(a)));
  }
  const artist = keyword ? artistFromTitles(candidates, keyword) : null;
  if (artist) {
    const related = candidates.filter((title) => normalize(title).includes(normalize(artist)))
      .filter((title) => compact(title) !== compact(`${artist} - ${artist}`));
    return [artist, ...[...new Map(related.map((title) => [normalize(title.trim()), title.trim()])).values()]].slice(0, 7);
  }
  for (const title of candidates) {
    const clean = keyword ? songNameFromVideo(title, keyword, karaoke) : title.trim();
    if (!clean) continue;
    const key = normalize(clean);
    if (unique.has(key)) continue;
    if (keyword) {
      const base = baseName(clean);
      const duplicateIndex = suggestions.findIndex((existing) => {
        const previous = baseName(existing);
        return previous.split(" ").length >= 3 && base.startsWith(`${previous} `)
          || base.split(" ").length >= 3 && previous.startsWith(`${base} `);
      });
      if (duplicateIndex >= 0) {
        if (base.length < baseName(suggestions[duplicateIndex]).length) {
          suggestions[duplicateIndex] = clean;
        }
        continue;
      }
    }
    unique.add(key);
    suggestions.push(clean);
  }
  // Once distinct song names are covered, retain alternate matching videos instead of
  // collapsing every rendition into its first song-name suggestion.
  if (keyword && suggestions.length >= 2 && suggestions.length < 7) {
    const phrase = normalize(keyword);
    for (const title of candidates) {
      const raw = title.trim();
      const normalized = normalize(raw);
      if (!normalized.includes(phrase) || keyword.trim().toLocaleLowerCase("vi-VN") !== phrase
        && !raw.toLocaleLowerCase("vi-VN").includes(keyword.trim().toLocaleLowerCase("vi-VN"))) continue;
      if (/\b(?:mashup|amv|nonstop|remix|speed\s*up|parody)\b|\s+x\s+/i.test(raw)) continue;
      if (!karaoke && /\bkaraoke\b/i.test(raw) && !/\bofficial\b/i.test(raw)) continue;
      const bareTitle = normalized.replace(/^\[karaoke\]\s*/, "")
        .replace(/\s*(?:\|\s*)?(?:official\s+(?:music video|mv)|karaoke)$/, "").trim();
      if (suggestions.some((existing) => normalize(existing) === normalized || baseName(existing) === bareTitle)) continue;
      if (unique.has(normalized)) continue;
      unique.add(normalized);
      suggestions.push(raw);
      if (suggestions.length === 7) break;
    }
  }
  return suggestions.slice(0, 7);
};
