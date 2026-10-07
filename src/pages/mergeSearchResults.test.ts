import { describe, expect, it } from 'vitest';
import { mergeSearchResults } from './mergeSearchResults';

const video = (video_id: string, match_score?: number): Video => ({
  video_id,
  title: video_id,
  thumbnail: '',
  author: '',
  duration: 120,
  match_score,
});

describe('mergeSearchResults', () => {
  it('shows local results immediately while remote is pending', () => {
    const local = [video('popular-local', 1), video('exact-local', 5)];
    expect(mergeSearchResults(local, [])).toEqual(local);
  });

  it('puts a more relevant remote song ahead of a loosely matching popular local song', () => {
    const local = [video('long-local', 1), video('another-local', 0.5)];
    const remote = [video('karaoke-tim-em', 5)];
    expect(mergeSearchResults(local, remote).map((item) => item.video_id)).toEqual([
      'karaoke-tim-em', 'long-local', 'another-local',
    ]);
  });

  it('keeps local metadata when the same video exists in both lists', () => {
    const saved = { ...video('shared', 2), is_saved: true, source: 'local' };
    const remote = { ...video('shared', 2), is_saved: false, source: 'yt' };
    expect(mergeSearchResults([saved], [remote])).toEqual([saved]);
  });

  it('prefers local on equal relevance and preserves local popularity order', () => {
    expect(mergeSearchResults([video('more-played', 3), video('less-played', 3)], [video('remote', 3)])
      .map((item) => item.video_id)).toEqual(['more-played', 'less-played', 'remote']);
  });

  it('does not let missing or invalid scores outrank scored results', () => {
    expect(mergeSearchResults([video('unscored'), video('invalid', Number.NaN)], [video('scored', 2)])
      .map((item) => item.video_id)).toEqual(['scored', 'unscored', 'invalid']);
  });
});
