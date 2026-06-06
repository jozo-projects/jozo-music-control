import { CategoriesId } from "@/assets/images/categories";
import { createContext, Dispatch, useContext, useState } from "react";

interface ImageBackgroundContextType {
  backgroundId: string;
  setBackgroundId: Dispatch<React.SetStateAction<string>>;
}

export const ImageBackgroundContext = createContext<ImageBackgroundContextType>(
  {
    backgroundId: "",
    setBackgroundId: () => null,
  }
);

export const useImageBackground = () => {
  const context = useContext(ImageBackgroundContext);

  if (!context) {
    throw new Error(
      "useImageBackground must be used within a ImageBackgroundProvider"
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
  const [backgroundId, setBackgroundId] = useState<string>(
    CategoriesId.ANH_TRAI_SAY_HI
  );

  return (
    <ImageBackgroundContext.Provider value={{ backgroundId, setBackgroundId }}>
      {children}
    </ImageBackgroundContext.Provider>
  );
}
