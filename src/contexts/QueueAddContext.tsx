import { useQueueMutations } from "@/hooks/useQueueMutations";
import React, { createContext, useContext } from "react";

type QueueAddContextValue = ReturnType<typeof useQueueMutations>;

const QueueAddContext = createContext<QueueAddContextValue | null>(null);

export const QueueAddProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const mutations = useQueueMutations();
  return (
    <QueueAddContext.Provider value={mutations}>
      {children}
    </QueueAddContext.Provider>
  );
};

export const useQueueAdd = (): QueueAddContextValue => {
  const context = useContext(QueueAddContext);
  if (!context) {
    throw new Error("useQueueAdd must be used within QueueAddProvider");
  }
  return context;
};
