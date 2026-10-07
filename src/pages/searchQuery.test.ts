import { describe, expect, it } from 'vitest';
import { buildSearchQuery } from './searchQuery';

describe('buildSearchQuery', () => {
  it('keeps numeric song titles and only adds music', () => {
    expect(buildSearchQuery('Yeu 5', false)).toBe('yeu 5 music');
  });
  it('uses karaoke mode without hashtags for short song names', () => {
    expect(buildSearchQuery('  Tìm Em  ', true)).toBe('tìm em karaoke');
  });
  it('does not append hashtags or extra karaoke keywords', () => {
    expect(buildSearchQuery('  Nơi này có anh  ', false)).toBe('nơi này có anh music');
  });
  it('does not repeat karaoke when selecting a completed suggestion', () => {
    expect(buildSearchQuery('Em Của Ngày Hôm Qua karaoke', true)).toBe('em của ngày hôm qua karaoke');
  });
  it('does not append music after an official MV suggestion', () => {
    expect(buildSearchQuery('Em Của Ngày Hôm Qua official MV', false)).toBe('em của ngày hôm qua official mv');
  });
  it('does not append karaoke again when a selected video title already contains it', () => {
    expect(buildSearchQuery('[Karaoke] Chạm Khẽ Tim Anh Một Chút Thôi - Noo Phước Thịnh', true))
      .toBe('[karaoke] chạm khẽ tim anh một chút thôi - noo phước thịnh');
  });
});
