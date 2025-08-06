import { createContext, useContext } from "react";

interface Optimize {
  prefillExample: () => void;
}

const OptimizeContext = createContext<Optimize>({
  prefillExample: () => {},
});

export const useOptimize = useContext(OptimizeContext);
