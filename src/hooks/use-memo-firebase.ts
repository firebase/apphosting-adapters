'use client';
import * as React from 'react';
import { isEqual } from 'lodash';

// A helper to show a warning in the console if the dependencies of a useMemo call change too often.
const useDependencyChangeWarning = (
  dependencies: React.DependencyList,
  hookName: string
) => {
  const previousDeps = usePrevious(dependencies);

  React.useEffect(() => {
    if (previousDeps) {
      if (!isEqual(previousDeps, dependencies)) {
        console.warn(
          `${hookName} dependencies have changed. This may cause infinite loops.`,
          {
            previous: previousDeps,
            current: dependencies,
          }
        );
      }
    }
  }, [dependencies, previousDeps, hookName]);
};

function usePrevious<T>(value: T): T | undefined {
  const ref = React.useRef<T>();
  React.useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}


// A wrapper around useMemo that adds a warning if the dependencies change too often.
export function useMemoFirebase<T>(
  factory: () => T,
  deps: React.DependencyList | undefined
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedValue = React.useMemo(factory, deps);

  if (process.env.NODE_ENV === 'development') {
    // We disable the eslint rule here because we are passing the dependencies to the useMemo hook above.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useDependencyChangeWarning(deps || [], 'useMemoFirebase');
  }

  return memoizedValue;
}
