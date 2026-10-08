import { exactSongTitle } from './songTitleMatch';

export function mergeSearchResults(local: Video[], remote: Video[], query = ''): Video[] {
  const karaokeIntent = /\bkaraoke\b/i.test(query);
  const remoteById = new Map(remote.map((item) => [item.video_id, item]));
  // Keep local playback/HLS metadata; transfer YouTube popularity for the same video.
  const enrichedLocal = local.map((item) => {
    const remoteViews = remoteById.get(item.video_id)?.views;
    return remoteViews === undefined ? item : { ...item, views: remoteViews };
  });
  const localIds = new Set(local.map((item) => item.video_id));
  const uniqueRemote = remote.filter((item) => !localIds.has(item.video_id));
  const readyHls = (item: Video) => item.media_status === 'ready' && Boolean(item.hls_url?.trim());
  // Local API orders HLS first and play_count within each group; preserve that order.
  const hlsLocal = enrichedLocal.filter(readyHls);
  const otherLocal = enrichedLocal.filter((item) => !readyHls(item));
  // With a query, keep the backend's provider/popularity ranking within each intent/name tier.
  // For older cached responses, still lift exact titles ahead of longer songs.
  const rankedRemote = [...uniqueRemote].sort((a, b) => query.trim()
    ? (karaokeIntent ? Number(/\bkaraoke\b/i.test(b.title)) - Number(/\bkaraoke\b/i.test(a.title)) : 0) ||
      Number(exactSongTitle(query, b.title)) - Number(exactSongTitle(query, a.title))
    : Number(b.recall === 1) - Number(a.recall === 1) ||
      Number(b.title_match) - Number(a.title_match) ||
      (b.views || 0) - (a.views || 0)
  );
  const relevance = (item: Video) =>
    typeof item.match_score === 'number' && Number.isFinite(item.match_score)
      ? item.match_score
      : Number.NEGATIVE_INFINITY;

  // Merge two ordered lists without re-sorting either source: only cross-source relevance decides.
  const combined: Video[] = [...hlsLocal];
  let i = 0;
  let j = 0;
  while (i < otherLocal.length && j < rankedRemote.length) {
    if (relevance(rankedRemote[j]) > relevance(otherLocal[i])) {
      combined.push(rankedRemote[j++]);
    } else {
      combined.push(otherLocal[i++]);
    }
  }
  const merged = [...combined, ...otherLocal.slice(i), ...rankedRemote.slice(j)];
  if (!query.trim()) return merged;
  const karaokeTitle = (item: Video) => /\bkaraoke\b/i.test(item.title);
  // Exact song name outranks a different longer song, even when the latter has HLS or more views.
  // Keep partial matches below rather than hiding them. Stable ties retain the source order.
  return merged.sort((a, b) =>
    (karaokeIntent ? Number(karaokeTitle(b)) - Number(karaokeTitle(a)) : 0) ||
    Number(exactSongTitle(query, b.title)) - Number(exactSongTitle(query, a.title)) ||
    Number(readyHls(b)) - Number(readyHls(a)) ||
    (karaokeIntent ? (b.views || 0) - (a.views || 0) : 0)
  );
}
