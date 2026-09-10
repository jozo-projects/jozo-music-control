import type { CategoryBackground } from "@/utils/categorySelection";
import { createContext, type Dispatch, useContext, useState } from "react";

interface ImageBackgroundContextType {
  selectedBackground: CategoryBackground | null;
  setSelectedBackground: Dispatch<
    React.SetStateAction<CategoryBackground | null>
  >;
}

export const ImageBackgroundContext = createContext<ImageBackgroundContextType>(
  {
    selectedBackground: null,
    setSelectedBackground: () => null,
  },
);

export const useImageBackground = () => {
  const context = useContext(ImageBackgroundContext);

  if (!context) {
    throw new Error(
      "useImageBackground must be used within a ImageBackgroundProvider",
    );
  }
  return context;
};

interface ImageBackgroundProviderProps {
  children: React.ReactNode;
}

export function ImageBackgroundProvider({
  children,
}: ImageBackgroundProviderProps) {
  const [selectedBackground, setSelectedBackground] =
    useState<CategoryBackground | null>(null);

  return (
    <ImageBackgroundContext.Provider
      value={{ selectedBackground, setSelectedBackground }}
    >
      {children}
    </ImageBackgroundContext.Provider>
  );
}
