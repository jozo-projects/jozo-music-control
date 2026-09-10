export interface CategoryBackground {
  id: string;
  imageUrl: string;
}

/** BE có thể không trả isActive — thiếu field coi như đang active */
export const isMusicCategoryActive = (category: MusicCategory): boolean =>
  category.isActive !== false;

export const reconcileCategorySelection = (
  categories: MusicCategory[],
  current: CategoryBackground | null,
): CategoryBackground | null => {
  const selectedCategory = current
    ? categories.find(
        (category) =>
          category._id === current.id && isMusicCategoryActive(category),
      )
    : undefined;
  const nextCategory =
    selectedCategory ?? categories.find(isMusicCategoryActive);

  return nextCategory
    ? { id: nextCategory._id, imageUrl: nextCategory.imageUrl }
    : null;
};
