import { useIdleNowPlayingScreensaver } from "@/hooks/useIdleNowPlayingScreensaver";
import { useQueueQuery } from "@/hooks/useQueueQuery";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type NowPlayingExpandContextValue = {
  isExpanded: boolean;
  expand: () => void;
  collapse: () => void;
};

const NowPlayingExpandContext =
  createContext<NowPlayingExpandContextValue | null>(null);

export const NowPlayingExpandProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: queueData } = useQueueQuery();
  const hasNowPlaying = Boolean(queueData?.result?.nowPlaying);

  const expand = useCallback(() => setIsExpanded(true), []);
  const collapse = useCallback(() => setIsExpanded(false), []);

  useIdleNowPlayingScreensaver({
    enabled: hasNowPlaying,
    isExpanded,
    expand,
  });

  const value = useMemo(
    () => ({ isExpanded, expand, collapse }),
    [isExpanded, expand, collapse],
  );

  return (
    <NowPlayingExpandContext.Provider value={value}>
      {children}
    </NowPlayingExpandContext.Provider>
  );
};

export const useNowPlayingExpand = () => {
  const context = useContext(NowPlayingExpandContext);
  if (!context) {
    throw new Error(
      "useNowPlayingExpand must be used within NowPlayingExpandProvider",
    );
  }
  return context;
};
