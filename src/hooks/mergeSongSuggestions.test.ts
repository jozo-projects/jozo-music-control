import { describe, expect, it } from "vitest";
import { mergeSongSuggestions } from "./mergeSongSuggestions";

describe("mergeSongSuggestions", () => {
  it("shows local suggestions immediately while remote is pending", () => {
    expect(mergeSongSuggestions(["Bài A", "Bài B"], undefined)).toEqual(["Bài A", "Bài B"]);
  });

  it("keeps local first, appends unique remote suggestions and caps at seven", () => {
    expect(mergeSongSuggestions(
      ["Bài 1", "Bài 2", "Bài 3", "Bài 4", "Bài 5"],
      ["bài 1", " BÀI 2 ", "Bài 6", "Bài 7", "Bài 8"],
    )).toEqual(["Bài 1", "Bài 2", "Bài 3", "Bài 4", "Bài 5", "Bài 6", "Bài 7"]);
  });

  it("puts karaoke suggestions ahead of non-karaoke across sources when karaoke mode is on", () => {
    expect(mergeSongSuggestions(
      ["Chúng ta không thuộc về nhau | Official MV", "Chúng Ta Không Thuộc Về Nhau Karaoke"],
      ["Karaoke Chúng Ta Không Thuộc Về Nhau Beat Gốc", "Chúng ta không thuộc về nhau"],
      true,
    )).toEqual([
      "Chúng Ta Không Thuộc Về Nhau Karaoke",
      "Karaoke Chúng Ta Không Thuộc Về Nhau Beat Gốc",
      "Chúng ta không thuộc về nhau | Official MV",
      "Chúng ta không thuộc về nhau",
    ]);
  });

  it("preserves source order when karaoke mode is off", () => {
    expect(mergeSongSuggestions(["Bài nhạc thường"], ["Bài Karaoke"], false)).toEqual([
      "Bài nhạc thường", "Bài Karaoke",
    ]);
  });

  it("completes an unaccented partial song name from local titles in karaoke mode", () => {
    expect(mergeSongSuggestions([
      "EM CỦA NGÀY HÔM QUA | SƠN TÙNG M-TP | KARAOKE REMIX ONIONN",
      "Karaoke: Em Của Ngày Hôm Qua | Sơn Tùng M-TP",
      "Em Của Ngày Hôm Qua - Sơn Tùng MTP [OFFICIAL MV]",
    ], undefined, true, "Em cua ngay")).toEqual(["Em Của Ngày Hôm Qua karaoke"]);
  });

  it("uses the completed title with official MV in music mode", () => {
    expect(mergeSongSuggestions([
      "Em Của Ngày Hôm Qua - Sơn Tùng MTP [OFFICIAL MV]",
      "KARAOKE Em Của Ngày Mai",
    ], undefined, false, "Em cua ngay")).toEqual(["Em Của Ngày Hôm Qua official MV"]);
  });

  it("prefers the actual song over a mashup for an unaccented full query", () => {
    expect(mergeSongSuggestions([
      "[ Karaoke ] Mashup Lạc Trôi ft Chúng Ta Không Thuộc Về Nhau - Sơn Tùng",
      "[ Karaoke ] Chúng Ta Không Thuộc Về Nhau Karaoke - Sơn Tùng M-TP / Beat Gốc",
      "Chúng Ta Không Thuộc Về Nhau | Official Music Video | Sơn Tùng M-TP",
    ], undefined, true, "chung ta khong thuoc ve nhau")).toEqual([
      "Chúng Ta Không Thuộc Về Nhau karaoke",
    ]);
  });

  it("extracts the song rather than the artist from an artist-first video title", () => {
    expect(mergeSongSuggestions([
      "HIEUTHUHAI - Người Im Lặng Gặp Người Hay Nói (prod. by Kewtiie) | Official Lyric Video",
    ], undefined, false, "Hieu THu Hai")).toEqual([
      "Người Im Lặng Gặp Người Hay Nói official MV",
    ]);
  });

  it("does not invent a completion when no source matches the query", () => {
    expect(mergeSongSuggestions(["Bài khác - Ca sĩ khác"], undefined, true, "Em cua ngay")).toEqual([]);
  });

  it("ignores fan edits, remixes and unrelated karaoke variants for a partial title", () => {
    expect(mergeSongSuggestions([
      "[AMV] Chúng ta không thuộc về nhau - Anime Edit",
      "Em của ngày hôm qua x Every night Remix (AUDIO)",
      "KARAOKE KHÔNG BÈ EM CỦA NGÀY MAI",
      "Em Của Ngày Hôm Qua | Official Music Video",
    ], undefined, false, "Em cua ngay")).toEqual(["Em Của Ngày Hôm Qua official MV"]);
    expect(mergeSongSuggestions(["[AMV] Chúng ta không thuộc về nhau - Anime Edit"], undefined, false, "chung ta khong thuoc ve nhau")).toEqual([]);
  });

  it("does not suggest an artist's name as if it were a song", () => {
    expect(mergeSongSuggestions(["HIEUTHUHAI", "TOP các ca khúc HAY NHẤT của HIEUTHUHAI"], undefined, false, "Hieu THu Hai")).toEqual([]);
  });

  it("recognizes an artist in the second segment and keeps the related video", () => {
    const video = "Không Thể Say - Hiếu Thứ Hai | Arista Music Center | Piano Cover";
    expect(mergeSongSuggestions([video], undefined, false, "Hieu THu Hai")).toEqual([
      "Hiếu Thứ Hai", video,
    ]);
  });

  it("collapses an artist-appended video title into the completed song suggestion", () => {
    expect(mergeSongSuggestions([
      "Karaoke: Em Của Ngày Hôm Qua | Sơn Tùng M-TP",
    ], ["Karaoke Em Của Ngày Hôm Qua Sơn Tùng M TP full beat"], true, "Em cua ngay")).toEqual([
      "Em Của Ngày Hôm Qua karaoke",
    ]);
  });

  it("suggests the artist and related local video titles for a partial unaccented artist query", () => {
    const videos = [
      "[Karaoke] Chạm Khẽ Tim Anh Một Chút Thôi - Noo Phước Thịnh (In The Moonlight)",
      "Chạm Khẽ Tim Anh Một Chút Thôi[ KARAOKE- BEAT CHUẨN]- Noo Phước Thịnh",
      "[Karaoke] Những Kẻ Mộng Mơ - Noo Phước Thịnh x Lâm Bảo Ngọc (XHTĐRLX3)",
    ];
    expect(mergeSongSuggestions(videos, undefined, true, "noo phuoc")).toEqual([
      "Noo Phước Thịnh", ...videos,
    ]);
  });

  it("adds distinct related remote videos without crowding out the artist or exceeding seven", () => {
    const local = [
      "Bài 1 - Noo Phước Thịnh", "Bài 2 - Noo Phước Thịnh", "Bài 3 - Noo Phước Thịnh",
      "Bài 4 - Noo Phước Thịnh", "Bài 5 - Noo Phước Thịnh",
    ];
    const remote = [
      "Bài 5 - Noo Phước Thịnh", "Bài 6 - Noo Phước Thịnh", "Bài 7 - Noo Phước Thịnh",
    ];
    expect(mergeSongSuggestions(local, remote, false, "noo phuoc")).toEqual([
      "Noo Phước Thịnh", ...local, remote[1],
    ]);
  });

  it("does not invent an artist from an unrelated title or an incomplete delimiter segment", () => {
    expect(mergeSongSuggestions(["Noo Phước Thịnh - Noo Phước Thịnh"], undefined, false, "noo phuoc")).toEqual(["Noo Phước Thịnh"]);
    expect(mergeSongSuggestions(["Bài khác - Ca sĩ khác"], undefined, false, "noo phuoc")).toEqual([]);
  });

  it("fills short song-name dropdowns with distinct video titles containing the full phrase", () => {
    expect(mergeSongSuggestions(
      ["Chờ Anh Về | Official MV", "Gửi Cho Anh | Karaoke"],
      [
        "Chờ Anh Nhé feat Hoàng Rob", "CHỜ ANH VỀ feat B Ray AMEE",
        "Em Vẫn Chờ Anh | Official MV", "Chờ Anh Về Live | Official MV",
        "Chờ Anh Về Acoustic | Official MV", "Chờ Anh Về Lyric | Official MV",
        "Trao Cho Anh | Official MV",
      ], false, "cho anh",
    )).toEqual([
      "Chờ Anh Về official MV", "Chờ Anh Nhé feat Hoàng Rob official MV",
      "CHỜ ANH VỀ feat B Ray AMEE", "Em Vẫn Chờ Anh | Official MV",
      "Chờ Anh Về Live | Official MV", "Chờ Anh Về Acoustic | Official MV",
      "Chờ Anh Về Lyric | Official MV",
    ]);
  });

  it("does not pad a partial song query with noisy edits, unrelated phrases or karaoke in music mode", () => {
    expect(mergeSongSuggestions(
      ["Em Của Ngày Hôm Qua | Official MV"],
      ["Em của ngày hôm qua x Every night Remix (AUDIO)", "Gửi Cho Anh | Karaoke"],
      false, "Em cua ngay",
    )).toEqual(["Em Của Ngày Hôm Qua official MV"]);
  });

  it("keeps accented song queries distinct from different Vietnamese words after removing tones", () => {
    expect(mergeSongSuggestions(
      ["Cho Anh Một Chút Hy Vọng | Official MV", "Chờ Anh Trong Đêm | Official MV"],
      ["Trao Cho Anh | Official MV", "Chờ Anh Nhé | Official MV"],
      false, "chờ anh",
    )).toEqual(["Chờ Anh Trong Đêm official MV", "Chờ Anh Nhé official MV"]);
  });

  it("still shows remote suggestions when local is unavailable", () => {
    expect(mergeSongSuggestions(undefined, ["Bài A", "Bài B"])).toEqual(["Bài A", "Bài B"]);
  });
});
