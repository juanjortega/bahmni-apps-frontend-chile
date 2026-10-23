import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { LOCALE_STORAGE_KEY } from './constants';
import {
  getTranslations,
  getUserPreferredLocale,
  resolveUserLocale,
} from './translationService';

/**
 * Initialize i18n with pre-loaded translations for a specific namespace
 * This function should be called before rendering the app
 *
 * @param namespace - The namespace for translations (e.g., 'clinical', 'registration')
 * @returns Initialized i18n instance
 */
export const initI18n = async (namespace: string) => {
  // The first namespace resolves the locale (explicit choice, then session) and
  // stores it, so the language detector and the date helpers read the same one.
  if (!i18n.isInitialized) {
    localStorage.setItem(LOCALE_STORAGE_KEY, await resolveUserLocale());
  }
  const userPreferredLocale = getUserPreferredLocale();
  const translations = await getTranslations(userPreferredLocale, namespace);

  if (i18n.isInitialized) {
    // Add namespace without reinitializing to preserve existing namespaces
    Object.entries(translations).forEach(([lang, namespaces]) => {
      Object.entries(namespaces).forEach(([ns, resources]) => {
        i18n.addResourceBundle(lang, ns, resources, true, true);
      });
    });

    i18n.options.defaultNS = namespace;
    i18n.options.fallbackNS = Object.keys(i18n.store.data[i18n.language] ?? {});
  } else {
    // First initialization
    await i18n
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        fallbackLng: 'en',
        ns: [namespace],
        defaultNS: namespace,
        resources: translations,
        detection: {
          order: ['localStorage'],
          lookupLocalStorage: LOCALE_STORAGE_KEY,
        },
        interpolation: {
          escapeValue: false,
        },
        react: {
          useSuspense: true,
        },
      });
  }

  return i18n;
};

export default initI18n;
