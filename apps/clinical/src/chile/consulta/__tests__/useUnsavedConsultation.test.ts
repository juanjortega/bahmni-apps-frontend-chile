import { renderHook } from '@testing-library/react';
import {
  hasUnsavedConsultation,
  useUnsavedConsultation,
} from '../useUnsavedConsultation';

const fireBeforeUnload = () => {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
};

describe('useUnsavedConsultation', () => {
  it('does nothing without data', () => {
    renderHook(() => useUnsavedConsultation(false));

    expect(hasUnsavedConsultation()).toBe(false);
    expect(fireBeforeUnload()).toBe(false);
  });

  it('warns before leaving while there is data', () => {
    const { unmount } = renderHook(() => useUnsavedConsultation(true));

    expect(hasUnsavedConsultation()).toBe(true);
    expect(fireBeforeUnload()).toBe(true);

    unmount();
  });

  it('stops warning when the data is gone or the consultation closes', () => {
    const { rerender, unmount } = renderHook(
      ({ hasData }) => useUnsavedConsultation(hasData),
      { initialProps: { hasData: true } },
    );

    rerender({ hasData: false });
    expect(hasUnsavedConsultation()).toBe(false);
    expect(fireBeforeUnload()).toBe(false);

    rerender({ hasData: true });
    unmount();
    expect(hasUnsavedConsultation()).toBe(false);
    expect(fireBeforeUnload()).toBe(false);
  });
});
