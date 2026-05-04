import SongCard from "@/components/SongCard";
import { SHOW_CATEGORIES, type Video } from "@/constant/categories";
import { useImageBackground } from "@/contexts/ImageBackgroundContext";
import React, { useMemo } from "react";

const Home: React.FC = () => {
  // State để quản lý category được chọn
  const { backgroundId, setBackgroundId } = useImageBackground();

  // Sử dụng categories từ constant
  const showCategories = SHOW_CATEGORIES;

  // Hàm xử lý khi chọn category
  const handleCategoryClick = (categoryId: string) => {
    setBackgroundId(categoryId);
  };

  // Lấy videos của category được chọn - sử dụng useMemo để tránh tính toán lại
  const selectedCategoryVideos = useMemo(() => {
    if (!backgroundId) return [];
    const category = showCategories.find((cat) => cat.id === backgroundId);
    return category ? category.videos : [];
  }, [backgroundId, showCategories]);

  // Memoize selected category name
  const selectedCategoryName = useMemo(() => {
    if (!backgroundId) return "";
    const category = showCategories.find((cat) => cat.id === backgroundId);
    return category ? category.name : "";
  }, [backgroundId, showCategories]);

  return (
    <div className="p-4 space-y-8">
      {/* Show Categories Section */}
      <section>
        <div className="flex flex-wrap gap-3">
          {showCategories.map((category) => (
            <button
              key={category.id}
              className={`p-2 rounded-lg text-sm font-medium shadow-sm transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                backgroundId === category.id
                  ? "bg-primary text-primary-foreground shadow-brand-soft ring-2 ring-white/35 scale-105"
                  : "bg-white/95 text-brand-700 border border-brand-200 hover:bg-brand-50 hover:border-brand-300 hover:scale-105"
              }`}
              onClick={() => handleCategoryClick(category.id)}
            >
              <img
                src={category.image}
                alt={category.name}
                className="w-7 h-7 object-cover flex-shrink-0"
              />
              {category.name}
            </button>
          ))}
        </div>
      </section>

      {/* Selected Category Videos Section */}
      {backgroundId && (
        <section key={backgroundId}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{selectedCategoryName}</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedCategoryVideos.map((video: Video) => (
              <SongCard key={`${backgroundId}-${video.video_id}`} {...video} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
export default Home;
