import { describe, expect, it } from "vitest";
import { normalizePublicCategorySong } from "./songNormalization";

describe("normalizePublicCategorySong", () => {
  it("preserves a complete public category song", () => {
    const song = {
      video_id: "video-123",
      title: "Bài hát",
      author: "Nghệ sĩ",
      thumbnail: "https://example.com/thumbnail.jpg",
      duration: 245,
      url: "https://example.com/watch/video-123",
    };

    expect(normalizePublicCategorySong(song)).toEqual(song);
  });

  it("fills optional backend fields with safe defaults", () => {
    expect(
      normalizePublicCategorySong({
        video_id: "video-456",
        title: "Bài hát thiếu metadata",
      }),
    ).toEqual({
      video_id: "video-456",
      title: "Bài hát thiếu metadata",
      author: "Không rõ nghệ sĩ",
      thumbnail: "",
      duration: 0,
      url: "https://www.youtube.com/watch?v=video-456",
    });
  });

  it.each([undefined, null, Number.NaN, Number.POSITIVE_INFINITY, "120"])(
    "normalizes a non-finite numeric duration (%s) to zero",
    (duration) => {
      expect(
        normalizePublicCategorySong({
          video_id: "duration-test",
          title: "Duration test",
          duration,
        }),
      ).toMatchObject({ duration: 0 });
    },
  );

  it("normalizes null and empty optional strings", () => {
    expect(
      normalizePublicCategorySong({
        video_id: "special id&value",
        title: "Fallback test",
        author: null,
        thumbnail: null,
        duration: 10,
        url: "",
      }),
    ).toEqual({
      video_id: "special id&value",
      title: "Fallback test",
      author: "Không rõ nghệ sĩ",
      thumbnail: "",
      duration: 10,
      url: "https://www.youtube.com/watch?v=special id&value",
    });
  });
});
