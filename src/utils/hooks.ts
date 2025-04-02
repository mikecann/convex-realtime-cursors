import { useEffect, useRef } from "react";
import { useQueries } from "convex/react";
import { makeUseQueryWithStatus } from "convex-helpers/react";

/**
 * Custom hook for using requestAnimationFrame with a dependency array similar to useEffect
 * @param callback Function to call on each animation frame
 * @param deps Dependencies array that will trigger restarting the animation loop when changed
 */
export function useAnimationFrame(
  callback: (time: number) => void,
  deps: React.DependencyList = [],
) {
  const requestIdRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number>(0);

  useEffect(() => {
    const animate = (time: number) => {
      // Call the callback with the current time
      callback(time);

      // Store time for next frame
      previousTimeRef.current = time;

      // Setup next animation frame
      requestIdRef.current = requestAnimationFrame(animate);
    };

    // Start animation loop
    requestIdRef.current = requestAnimationFrame(animate);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current);
        requestIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export const useQueryWithStatus = makeUseQueryWithStatus(useQueries);
