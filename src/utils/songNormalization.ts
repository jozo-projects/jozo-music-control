export interface PublicCategorySongDto {
  video_id: string;
  title: string;
  author?: string | null;
  thumbnail?: string | null;
  duration?: unknown;
  url?: string | null;
}

export interface NormalizedPublicCategorySong {
  video_id: string;
  title: string;
  author: string;
  thumbnail: string;
  duration: number;
  url: string;
}

export const normalizePublicCategorySong = (
  song: PublicCategorySongDto,
): NormalizedPublicCategorySong => ({
  video_id: song.video_id,
  title: song.title,
  author:
    typeof song.author === "string" && song.author
      ? song.author
      : "Không rõ nghệ sĩ",
  thumbnail: typeof song.thumbnail === "string" ? song.thumbnail : "",
  duration:
    typeof song.duration === "number" && Number.isFinite(song.duration)
      ? song.duration
      : 0,
  url:
    typeof song.url === "string" && song.url
      ? song.url
      : `https://www.youtube.com/watch?v=${song.video_id}`,
});
