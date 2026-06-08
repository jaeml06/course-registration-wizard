import { useEffect, useRef } from 'react';

const LEAVE_CONFIRM_MESSAGE =
  '작성 중인 신청 정보가 있습니다. 페이지를 나갈까요?';
const HISTORY_GUARD_STATE = {
  __courseRegistrationLeaveGuard: true,
};

export function useLeavePrevention(shouldBlock: boolean) {
  const allowNavigationRef = useRef(false);

  useEffect(() => {
    if (!shouldBlock) {
      allowNavigationRef.current = false;
      return;
    }

    allowNavigationRef.current = false;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = '';
    }

    function handlePopState() {
      if (allowNavigationRef.current) {
        return;
      }

      const shouldLeave = window.confirm(LEAVE_CONFIRM_MESSAGE);

      if (!shouldLeave) {
        window.history.pushState(
          HISTORY_GUARD_STATE,
          '',
          window.location.href,
        );
        return;
      }

      allowNavigationRef.current = true;
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    }

    window.history.pushState(HISTORY_GUARD_STATE, '', window.location.href);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [shouldBlock]);
}
