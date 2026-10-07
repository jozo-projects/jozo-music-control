export function mergeSearchResults(local: Video[], remote: Video[]): Video[] {
  if (local.length === 0) return remote;
  if (remote.length === 0) return local;

  const localIds = new Set(local.map((item) => item.video_id));
  const uniqueRemote = remote.filter((item) => !localIds.has(item.video_id));
  const relevance = (item: Video) =>
    typeof item.match_score === 'number' && Number.isFinite(item.match_score)
      ? item.match_score
      : Number.NEGATIVE_INFINITY;

  // Stable sort: on equal relevance, local (already ordered by play_count) stays first.
  return [...local, ...uniqueRemote].sort((a, b) => relevance(b) - relevance(a) || 0);
}
