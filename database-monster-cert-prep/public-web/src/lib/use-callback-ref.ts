"use client";

import { useEffect, useMemo, useRef } from "react";

/**
 * Returns a stable function identity that always calls the latest version of
 * the supplied callback. Lets effects/handlers depend on a callback without
 * re-running when the parent passes a new closure each render.
 */
export function useCallbackRef<Args extends unknown[], Return>(
  callback?: (...args: Args) => Return,
): (...args: Args) => Return | undefined {
  const ref = useRef(callback);

  useEffect(() => {
    ref.current = callback;
  });

  return useMemo(
    () =>
      (...args: Args) =>
        ref.current?.(...args),
    [],
  );
}
