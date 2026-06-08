import { useEffect, useRef } from 'react';

const LEAVE_CONFIRM_MESSAGE =
  '작성 중인 신청 정보가 있습니다. 페이지를 나갈까요?';
// 뒤로가기를 막기 위해 history에 끼워 넣는 더미 상태 표식.
const HISTORY_GUARD_STATE = {
  __courseRegistrationLeaveGuard: true,
};

/**
 * 작성 중 이탈을 막는 훅. 두 가지 이탈 경로를 함께 다룬다:
 *  - 새로고침/탭 닫기 → beforeunload(브라우저 기본 확인창)
 *  - 뒤로가기 → popstate(직접 만든 confirm)
 * 라우터나 외부 의존성 없이 두 케이스를 모두 처리하려고 이렇게 구성했다(README 참고).
 */
export function useLeavePrevention(shouldBlock: boolean) {
  // 사용자가 "나가기"에 동의한 뒤에는 가드를 통과시키기 위한 플래그.
  const allowNavigationRef = useRef(false);

  useEffect(() => {
    // 막을 필요가 없으면 리스너를 달지 않는다.
    if (!shouldBlock) {
      allowNavigationRef.current = false;
      return;
    }

    allowNavigationRef.current = false;

    // 새로고침/닫기: preventDefault + returnValue 설정이 브라우저 기본 확인창을 띄우는 규약.
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = '';
    }

    // 뒤로가기: 사용자가 거부하면 더미 상태를 다시 밀어 넣어 "제자리"에 머물게 한다.
    function handlePopState() {
      if (allowNavigationRef.current) {
        return;
      }

      const shouldLeave = window.confirm(LEAVE_CONFIRM_MESSAGE);

      if (!shouldLeave) {
        // 방금 소비된 history 항목을 되돌려 페이지를 떠나지 않게 한다.
        window.history.pushState(
          HISTORY_GUARD_STATE,
          '',
          window.location.href,
        );
        return;
      }

      // 떠나기로 했으면 가드를 풀고 리스너를 제거해 실제로 나가게 둔다.
      allowNavigationRef.current = true;
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    }

    // 가드용 history 항목을 하나 쌓아 두어야 첫 뒤로가기를 popstate로 가로챌 수 있다.
    window.history.pushState(HISTORY_GUARD_STATE, '', window.location.href);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    // 의존성(shouldBlock)이 바뀌거나 언마운트되면 리스너를 정리한다.
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [shouldBlock]);
}
