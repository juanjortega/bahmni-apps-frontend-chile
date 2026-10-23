import { setUserLocale } from '@bahmni/services';
import {
  buildLanguageActions,
  getLanguageName,
  LANGUAGE_ACTION_ID_PREFIX,
} from '../index';

jest.mock('@bahmni/services', () => ({
  setUserLocale: jest.fn(() => Promise.resolve()),
}));

describe('language actions', () => {
  beforeEach(() => jest.clearAllMocks());

  it('names each language in itself', () => {
    expect(getLanguageName('es')).toBe('Español');
    expect(getLanguageName('en')).toBe('English');
  });

  it('falls back to the code for an unknown locale', () => {
    expect(getLanguageName('not a locale')).toBe('not a locale');
  });

  it('offers every allowed locale except the current one', () => {
    const actions = buildLanguageActions(['en', 'es', 'fr'], 'es');

    expect(actions.map((a) => a.id)).toEqual([
      `${LANGUAGE_ACTION_ID_PREFIX}en`,
      `${LANGUAGE_ACTION_ID_PREFIX}fr`,
    ]);
    expect(actions.map((a) => a.label)).toEqual(['English', 'Français']);
  });

  it('offers nothing when only the current locale is allowed', () => {
    expect(buildLanguageActions(['es'], 'es')).toEqual([]);
  });

  it('stores the chosen locale and reloads', async () => {
    const reload = jest.fn();
    const [english] = buildLanguageActions(['en', 'es'], 'es', reload);

    await english.onClick();

    expect(setUserLocale).toHaveBeenCalledWith('en');
    expect(reload).toHaveBeenCalled();
  });
});
