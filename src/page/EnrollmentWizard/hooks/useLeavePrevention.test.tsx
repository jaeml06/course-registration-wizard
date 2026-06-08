import { renderHook } from '@testing-library/react';

import { useLeavePrevention } from './useLeavePrevention';

function dispatchBeforeUnload() {
  const event = new Event('beforeunload', {
    cancelable: true,
  }) as BeforeUnloadEvent;

  window.dispatchEvent(event);

  return event;
}

describe('useLeavePrevention', () => {
  test('shouldBlock true이면 beforeunload에서 기본 이탈 확인을 요청한다', () => {
    renderHook(() => useLeavePrevention(true));

    const event = dispatchBeforeUnload();

    expect(event.defaultPrevented).toBe(true);
  });

  test('shouldBlock false이거나 unmount되면 이벤트 리스너를 제거한다', () => {
    const { rerender, unmount } = renderHook(
      ({ shouldBlock }: { shouldBlock: boolean }) =>
        useLeavePrevention(shouldBlock),
      {
        initialProps: {
          shouldBlock: false,
        },
      },
    );

    expect(dispatchBeforeUnload().defaultPrevented).toBe(false);

    rerender({ shouldBlock: true });
    expect(dispatchBeforeUnload().defaultPrevented).toBe(true);

    unmount();
    expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
  });

  test('popstate 발생 시 취소하면 현재 페이지에 머무를 수 있게 history guard를 다시 만든다', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const pushState = vi.spyOn(window.history, 'pushState');

    renderHook(() => useLeavePrevention(true));
    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(confirm).toHaveBeenCalledWith(
      '작성 중인 신청 정보가 있습니다. 페이지를 나갈까요?',
    );
    expect(pushState).toHaveBeenCalledWith(
      expect.objectContaining({
        __courseRegistrationLeaveGuard: true,
      }),
      '',
      window.location.href,
    );
  });

  test('popstate 확인 시 이탈 허용 상태가 되어 같은 이벤트를 다시 막지 않는다', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderHook(() => useLeavePrevention(true));
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(confirm).toHaveBeenCalledTimes(1);
  });
});
