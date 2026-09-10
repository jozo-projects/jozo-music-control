import { describe, expect, it } from "vitest";

import { reconcileCategorySelection } from "./categorySelection";

const categories: MusicCategory[] = [
  {
    _id: "inactive",
    name: "Đã ẩn",
    slug: "da-an",
    imageUrl: "/inactive.jpg",
    isActive: false,
    position: 0,
  },
  {
    _id: "first-active",
    name: "Đầu tiên",
    slug: "dau-tien",
    imageUrl: "/first.jpg",
    isActive: true,
    position: 1,
  },
  {
    _id: "selected",
    name: "Đang chọn",
    slug: "dang-chon",
    imageUrl: "/selected.jpg",
    isActive: true,
    position: 2,
  },
];

describe("reconcileCategorySelection", () => {
  it("selects the first active category when there is no selection", () => {
    expect(reconcileCategorySelection(categories, null)).toEqual({
      id: "first-active",
      imageUrl: "/first.jpg",
    });
  });

  it("keeps an active selection and refreshes its image URL", () => {
    expect(
      reconcileCategorySelection(categories, {
        id: "selected",
        imageUrl: "/old.jpg",
      }),
    ).toEqual({ id: "selected", imageUrl: "/selected.jpg" });
  });

  it("selects the first active category when the current one is absent", () => {
    expect(
      reconcileCategorySelection(categories, {
        id: "removed",
        imageUrl: "/removed.jpg",
      }),
    ).toEqual({ id: "first-active", imageUrl: "/first.jpg" });
  });

  it("returns null when there are no active categories", () => {
    expect(reconcileCategorySelection(categories.slice(0, 1), null)).toBeNull();
  });

  it("treats missing isActive as active", () => {
    const withoutFlag: MusicCategory[] = [
      {
        _id: "test",
        name: "Test",
        slug: "test",
        imageUrl: "/test.jpg",
        position: 0,
      },
    ];

    expect(reconcileCategorySelection(withoutFlag, null)).toEqual({
      id: "test",
      imageUrl: "/test.jpg",
    });
  });
});
