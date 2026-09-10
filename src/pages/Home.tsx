import SongCard from "@/components/SongCard";
import { useImageBackground } from "@/contexts/ImageBackgroundContext";
import {
  useMusicCategoriesQuery,
  useMusicCategorySongsQuery,
} from "@/hooks/useMusicCategoriesQuery";
import {
  isMusicCategoryActive,
  reconcileCategorySelection,
} from "@/utils/categorySelection";
import React, { useEffect, useMemo } from "react";

const Home: React.FC = () => {
  const { selectedBackground, setSelectedBackground } = useImageBackground();
  const categoriesQuery = useMusicCategoriesQuery();
  const activeCategories = useMemo(
    () => (categoriesQuery.data ?? []).filter(isMusicCategoryActive),
    [categoriesQuery.data],
  );
  const selectedCategory = activeCategories.find(
    (category) => category._id === selectedBackground?.id,
  );
  const songsQuery = useMusicCategorySongsQuery(selectedCategory?._id ?? null);
  const songs = useMemo(
    () => songsQuery.data?.pages.flatMap((page) => page.songs) ?? [],
    [songsQuery.data],
  );

  useEffect(() => {
    if (!categoriesQuery.isSuccess) return;

    setSelectedBackground((current) => {
      const next = reconcileCategorySelection(activeCategories, current);

      if (
        current?.id === next?.id &&
        current?.imageUrl === next?.imageUrl
      ) {
        return current;
      }

      return next;
    });
  }, [activeCategories, categoriesQuery.isSuccess, setSelectedBackground]);

  const handleCategoryClick = (category: MusicCategory) => {
    setSelectedBackground({ id: category._id, imageUrl: category.imageUrl });
  };

  return (
    <div className="p-4 space-y-8">
      <section>
        <div className="flex flex-wrap gap-3">
          {categoriesQuery.isPending &&
            Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="h-11 w-36 animate-pulse rounded-lg bg-white/20"
              />
            ))}

          {categoriesQuery.isError && (
            <div className="rounded-lg bg-brand-950/80 p-4">
              <p>Không thể tải danh mục nhạc.</p>
              <button
                type="button"
                className="mt-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground"
                onClick={() => void categoriesQuery.refetch()}
              >
                Thử lại
              </button>
            </div>
          )}

          {categoriesQuery.isSuccess && activeCategories.length === 0 && (
            <p className="rounded-lg bg-brand-950/80 p-4">
              Chưa có danh mục nhạc.
            </p>
          )}

          {activeCategories.map((category) => (
            <button
              key={category._id}
              type="button"
              className={`p-2 rounded-lg text-sm font-medium shadow-sm transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                selectedBackground?.id === category._id
                  ? "bg-primary text-primary-foreground shadow-brand-soft ring-2 ring-white/35 scale-105"
                  : "bg-white/95 text-brand-700 border border-brand-200 hover:bg-brand-50 hover:border-brand-300 hover:scale-105"
              }`}
              onClick={() => handleCategoryClick(category)}
            >
              <img
                src={category.imageUrl}
                alt={category.name}
                className="w-7 h-7 object-cover flex-shrink-0"
              />
              {category.name}
            </button>
          ))}
        </div>
      </section>

      {selectedCategory && (
        <section key={selectedCategory._id} className="!mt-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold">{selectedCategory.name}</h2>
          </div>

          {songsQuery.isPending && (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <div
                  key={index}
                  className="h-60 animate-pulse rounded-lg bg-white/20"
                />
              ))}
            </div>
          )}

          {songsQuery.isError && (
            <div className="rounded-lg bg-brand-950/80 p-4">
              <p>Không thể tải bài hát trong danh mục.</p>
              <button
                type="button"
                className="mt-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground"
                onClick={() => void songsQuery.refetch()}
              >
                Thử lại
              </button>
            </div>
          )}

          {songsQuery.isSuccess && songs.length === 0 && (
            <p className="rounded-lg bg-brand-950/80 p-4">
              Danh mục này chưa có bài hát.
            </p>
          )}

          {songs.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {songs.map((video, index) => (
                <SongCard
                  key={`${selectedCategory._id}-${video.video_id}-${index}`}
                  {...video}
                />
              ))}
            </div>
          )}

          {songsQuery.hasNextPage && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                className="rounded-lg bg-primary px-5 py-2 font-medium text-primary-foreground disabled:opacity-60"
                disabled={songsQuery.isFetchingNextPage}
                onClick={() => void songsQuery.fetchNextPage()}
              >
                {songsQuery.isFetchingNextPage ? "Đang tải..." : "Xem thêm"}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
export default Home;
