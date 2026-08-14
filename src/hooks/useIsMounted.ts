"use client";

import { useSyncExternalStore } from "react";

// 구독할 외부 스토어가 없으므로 빈 구독 함수를 재사용한다.
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * 하이드레이션이 끝났는지 여부.
 * 서버 렌더와 첫 클라이언트 렌더에서는 false, 그 이후 true가 된다.
 *
 * "지금 시각"에 의존하는 UI를 서버에서 렌더하면 그 시점의 날짜가 HTML에 굳어버리고,
 * React는 하이드레이션 때 속성 불일치(disabled 등)를 고쳐주지 않아 그대로 남는다.
 * 그런 UI는 이 훅으로 감싸 클라이언트에서만 렌더한다.
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
