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
  it('does not treat arbitrary words in parentheses as a version label', () => {
    const remote = [
      { ...video('different', 6), title: 'Tháng Năm (Không Quên)', views: 50000000 },
      { ...video('exact', 5), title: 'Tháng Năm (Official MV)', views: 1000000 },
    ];
    expect(mergeSearchResults([], remote, 'tháng năm music').map((v) => v.video_id))
      .toEqual(['exact', 'different']);
  });
  it('keeps backend provider order for comparable exact-title remote results', () => {
    const remote = [
      { ...video('provider-first', 5), title: 'Tháng Năm - SOOBIN', views: 1000000, recall: 1 },
      { ...video('slightly-higher', 5), title: 'Tháng Năm - SOOBIN', views: 1200000, recall: 1 },
    ];
    expect(mergeSearchResults([], remote, 'tháng năm music').map((v) => v.video_id))
      .toEqual(['provider-first', 'slightly-higher']);
  });
  it('places an exact song name before a popular partial match across sources', () => {
    const local = [
      { ...video('long-local', 6), title: 'Tháng Năm Không Quên', media_status: 'ready' as const, hls_url: 'https://media.example/long.m3u8' },
    ];
    const remote = [
      { ...video('long-remote', 6), title: 'Tháng Năm Đẹp Nhất Cuộc Đời', views: 50000000, recall: 1, title_match: true },
      { ...video('exact', 5), title: 'SOOBIN - THÁNG NĂM (Official Music Video)', views: 20000000, recall: 1, title_match: true },
      { ...video('version', 4), title: 'Tháng Năm (Lofi Ver.) - Soobin', views: 19000000 },
    ];
    expect(mergeSearchResults(local, remote, 'tháng năm music').map((v) => v.video_id))
      .toEqual(['exact', 'version', 'long-local', 'long-remote']);
  });

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

  it('keeps ready local HLS first when remote results arrive', () => {
    const local = [
      { ...video('hls', 2), hls_url: 'https://media.example/master.m3u8', media_status: 'ready' as const },
      video('popular-no-hls', 4),
    ];
    expect(mergeSearchResults(local, [video('remote', 3)]).map((v) => v.video_id))
      .toEqual(['hls', 'popular-no-hls', 'remote']);
  });

  it('shows karaoke first and keeps remote view counts for saved local duplicates', () => {
    const local = [
      { ...video('Rzm_kltwHbg', 5.75), title: 'Chạm Khẽ Tim Anh Một Chút Thôi | Noo Phước Thịnh | LYRIC VIDEO', source: 'local' },
      { ...video('DdLN2ASANaY', 5.05), title: '[Karaoke] Chạm khẽ tim anh một chút thôi - Noo Phước Thịnh', source: 'local' },
      { ...video('TjsLEeIN8xM', 4.8), title: 'Chạm Khẽ Tim Anh Một Chút Thôi KARAOKE - Noo Phước Thịnh', source: 'local' },
    ];
    const remote = [
      { ...video('Rzm_kltwHbg', 5.75), title: local[0].title, views: 101467022, source: 'yt', title_match: true, recall: 1 },
      { ...video('gU6h1qlvd4w', 5.2), title: 'CHẠM KHẼ TIM ANH MỘT CHÚT THÔI - MYRA TRẦN live', views: 280142, source: 'yt', title_match: true, recall: 1 },
      { ...video('DdLN2ASANaY', 5.05), title: local[1].title, views: 1210808, source: 'yt', title_match: false, recall: 1 },
      { ...video('TjsLEeIN8xM', 4.8), title: local[2].title, views: 34725, source: 'yt', title_match: true, recall: 0.85 },
    ];
    const combined = mergeSearchResults(local, remote, 'chạm khẽ tim anh một chút thôi karaoke');
    expect(combined.map((v) => v.video_id)).toEqual([
      'DdLN2ASANaY', 'TjsLEeIN8xM', 'Rzm_kltwHbg', 'gU6h1qlvd4w',
    ]);
    expect(combined[0]).toMatchObject({ source: 'local', views: 1210808 });
  });

  it('keeps karaoke HLS first, without promoting a non-karaoke HLS above karaoke', () => {
    const local = [
      { ...video('hls-lyric', 6), title: 'Định Mệnh lyric', hls_url: 'https://media.example/lyric.m3u8', media_status: 'ready' as const },
      { ...video('hls-karaoke', 4), title: 'Định Mệnh Karaoke', hls_url: 'https://media.example/hls.m3u8', media_status: 'ready' as const },
    ];
    const remote = [{ ...video('views-karaoke', 5), title: 'Định Mệnh Karaoke', views: 2000000 }];
    expect(mergeSearchResults(local, remote, 'định mệnh karaoke').map((v) => v.video_id))
      .toEqual(['hls-karaoke', 'views-karaoke', 'hls-lyric']);
  });

  it('keeps exact-title remote ahead of a more viewed different song', () => {
    const remote = [
      { ...video('different', 4), views: 4000000, title_match: false, recall: 1 },
      { ...video('exact', 4), views: 1700000, title_match: true, recall: 1 },
    ];
    expect(mergeSearchResults([], remote).map((v) => v.video_id)).toEqual(['exact', 'different']);
  });

  it('prefers highly viewed remote videos when relevance is comparable', () => {
    const remote = [
      { ...video('few-views', 4), views: 100 },
      { ...video('many-views', 3), views: 1000000 },
    ];
    expect(mergeSearchResults([], remote).map((v) => v.video_id))
      .toEqual(['many-views', 'few-views']);
  });
});
