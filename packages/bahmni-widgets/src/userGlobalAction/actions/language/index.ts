import { setUserLocale } from '@bahmni/services';
import { UserAction } from '../../models';

export const LANGUAGE_ACTION_ID_PREFIX = 'user-language-';

// Each language is named in itself ("Español", "English"), as language pickers do:
// whoever reads the menu in the wrong language still recognises their own.
export const getLanguageName = (locale: string): string => {
  try {
    const name = new Intl.DisplayNames([locale], { type: 'language' }).of(
      locale,
    );
    if (name && name !== locale) {
      return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
    }
  } catch {
    // Unknown or malformed locale: show the code itself.
  }
  return locale;
};

/**
 * One menu action per allowed locale other than the current one. Choosing it
 * stores the locale, switches the OpenMRS session and reloads the page, since
 * every app loads its translations when it starts.
 */
export const buildLanguageActions = (
  allowedLocales: string[],
  currentLocale: string,
  reload: () => void = () => window.location.reload(),
): UserAction[] =>
  allowedLocales
    .filter((locale) => locale && locale !== currentLocale)
    .map((locale, index) => ({
      id: `${LANGUAGE_ACTION_ID_PREFIX}${locale}`,
      label: getLanguageName(locale),
      onClick: async () => {
        await setUserLocale(locale);
        reload();
      },
      priority: 9000 + index,
    }));
