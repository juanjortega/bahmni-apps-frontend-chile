import { get, post } from '../../api';
import { EXPLICIT_LOCALE_STORAGE_KEY, LOCALE_STORAGE_KEY } from '../constants';
import {
  getAllowedLocales,
  resolveUserLocale,
  setUserLocale,
} from '../translationService';

jest.mock('../../api');

const mockGet = get as jest.MockedFunction<typeof get>;
const mockPost = post as jest.MockedFunction<typeof post>;

describe('locale preference', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('resolveUserLocale', () => {
    it('prefers the locale the user picked explicitly, without asking the server', async () => {
      localStorage.setItem(EXPLICIT_LOCALE_STORAGE_KEY, 'en');

      await expect(resolveUserLocale()).resolves.toBe('en');
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('uses the OpenMRS session locale when there is no explicit choice', async () => {
      localStorage.setItem(LOCALE_STORAGE_KEY, 'en');
      mockGet.mockResolvedValue({ locale: 'es', allowedLocales: ['en', 'es'] });

      await expect(resolveUserLocale()).resolves.toBe('es');
      expect(mockGet).toHaveBeenCalledWith('/openmrs/ws/rest/v1/session');
    });

    it('falls back to the stored locale when the session cannot be read', async () => {
      localStorage.setItem(LOCALE_STORAGE_KEY, 'fr');
      mockGet.mockRejectedValue(new Error('401'));

      await expect(resolveUserLocale()).resolves.toBe('fr');
    });

    it('falls back to English when nothing is known', async () => {
      mockGet.mockResolvedValue({});

      await expect(resolveUserLocale()).resolves.toBe('en');
    });
  });

  describe('getAllowedLocales', () => {
    it('returns the server allowed locales', async () => {
      mockGet.mockResolvedValue({ locale: 'es', allowedLocales: ['en', 'es'] });

      await expect(getAllowedLocales()).resolves.toEqual(['en', 'es']);
    });

    it('returns an empty list when the session cannot be read', async () => {
      mockGet.mockRejectedValue(new Error('network'));

      await expect(getAllowedLocales()).resolves.toEqual([]);
    });
  });

  describe('setUserLocale', () => {
    it('stores the explicit choice, the applied locale and updates the session', async () => {
      mockPost.mockResolvedValue({});

      await setUserLocale('es');

      expect(localStorage.getItem(EXPLICIT_LOCALE_STORAGE_KEY)).toBe('es');
      expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('es');
      expect(mockPost).toHaveBeenCalledWith('/openmrs/ws/rest/v1/session', {
        locale: 'es',
      });
    });

    it('still changes the UI language when the session update fails', async () => {
      mockPost.mockRejectedValue(new Error('500'));

      await expect(setUserLocale('en')).resolves.toBeUndefined();
      expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en');
    });
  });
});
