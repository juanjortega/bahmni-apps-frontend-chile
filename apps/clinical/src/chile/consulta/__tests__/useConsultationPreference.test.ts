import { act, renderHook } from '@testing-library/react';
import {
  fetchPreference,
  saveOpenMode,
  saveSplit,
} from '../consultationPreference';
import { useConsultationPreference } from '../useConsultationPreference';

const mockAddNotification = jest.fn();

jest.mock('@bahmni/services', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@bahmni/widgets', () => ({
  useNotification: () => ({ addNotification: mockAddNotification }),
}));

jest.mock('../consultationPreference', () => ({
  ...jest.requireActual('../consultationPreference'),
  fetchPreference: jest.fn(),
  saveOpenMode: jest.fn(),
  saveSplit: jest.fn(),
}));

const flush = () => act(async () => undefined);

describe('useConsultationPreference', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    localStorage.clear();
    (fetchPreference as jest.Mock).mockResolvedValue({
      mode: null,
      split: 50,
    });
    (saveOpenMode as jest.Mock).mockResolvedValue(undefined);
    (saveSplit as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const setup = async () => {
    const view = renderHook(() => useConsultationPreference('u-1'));
    await flush();
    return view.result;
  };

  it('uses the split saved on the user', async () => {
    const result = await setup();

    expect(result.current.preferredSplit.current).toBe(50);
  });

  it('writes once after the drag ends, with the last value', async () => {
    const result = await setup();

    act(() => {
      result.current.rememberSplit(45.2);
      result.current.rememberSplit(60.4);
      jest.advanceTimersByTime(600);
    });
    await flush();

    expect(saveSplit).toHaveBeenCalledTimes(1);
    expect(saveSplit).toHaveBeenCalledWith(60, 'u-1');
    expect(result.current.preferredSplit.current).toBe(60);
  });

  it('does not write when the split did not change', async () => {
    const result = await setup();

    act(() => {
      result.current.rememberSplit(50.3);
      jest.advanceTimersByTime(600);
    });
    await flush();

    expect(saveSplit).not.toHaveBeenCalled();
  });

  it('saves one at a time, so the writes do not overwrite each other', async () => {
    let finishMode: () => void = () => undefined;
    (saveOpenMode as jest.Mock).mockReturnValue(
      new Promise<void>((resolve) => {
        finishMode = resolve;
      }),
    );
    const result = await setup();

    act(() => {
      result.current.remember('completa');
      result.current.rememberSplit(60);
      jest.advanceTimersByTime(600);
    });
    await flush();
    expect(saveSplit).not.toHaveBeenCalled();

    finishMode();
    await flush();
    expect(saveSplit).toHaveBeenCalledTimes(1);
  });

  it('warns and keeps working when a save fails', async () => {
    (saveSplit as jest.Mock).mockRejectedValueOnce(new Error('sin permiso'));
    const result = await setup();

    act(() => {
      result.current.rememberSplit(60);
      jest.advanceTimersByTime(600);
    });
    await flush();

    expect(mockAddNotification).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.remember('completa');
    });
    await flush();
    expect(saveOpenMode).toHaveBeenCalledTimes(1);
  });
});
