"use client";

import { createContext, useCallback, useContext, useState } from "react";

const HighlightedNodesContext = createContext<{
  highlightedNodeIds: Set<string>;
  setHighlightedNodeIds: (ids: Set<string>) => void;
} | null>(null);

export function HighlightedNodesProvider({ children }: { children: React.ReactNode }) {
  const [highlightedNodeIds, setState] = useState<Set<string>>(() => new Set());
  const setHighlightedNodeIds = useCallback((ids: Set<string>) => {
    setState(new Set(ids));
  }, []);
  return (
    <HighlightedNodesContext.Provider value={{ highlightedNodeIds, setHighlightedNodeIds }}>
      {children}
    </HighlightedNodesContext.Provider>
  );
}

export function useHighlightedNodes() {
  const ctx = useContext(HighlightedNodesContext);
  return ctx ?? { highlightedNodeIds: new Set<string>(), setHighlightedNodeIds: () => {} };
}
