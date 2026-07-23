"use client";

import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  // 항상 false로 시작해야 SSR과 첫 클라이언트 렌더가 일치함(hydration mismatch 방지).
  // 실제 값은 마운트 후 이 effect에서만 동기화한다.
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- window.matchMedia는 브라우저 전용 API라 마운트 시점에만 읽을 수 있음
    setMatches(media.matches);
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}
