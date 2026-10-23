import { get, post } from '../api';
import { SESSION_URL } from '../constants/app';
import {
  BUNDLED_TRANSLATIONS_URL_TEMPLATE,
  LOCALE_STORAGE_KEY,
  DEFAULT_LOCALE,
  CONFIG_TRANSLATIONS_URL_TEMPLATE,
  EXPLICIT_LOCALE_STORAGE_KEY,
} from './constants';

interface SessionLocaleResponse {
  locale?: string;
  allowedLocales?: string[];
}

/**
 * Fetches user's preferred locale from the local storage.
 * @returns The user's preferred locale code if valid, or DEFAULT_LOCALE if not found or invalid
 */
export const getUserPreferredLocale = (): string => {
  const localeStorageKey = localStorage.getItem(LOCALE_STORAGE_KEY);
  const userLocale = localeStorageKey ?? DEFAULT_LOCALE;
  return userLocale;
};

/**
 * Resolves the UI locale with the same priority as the Chilean AngularJS UI:
 * the locale the user picked explicitly, then the OpenMRS session locale (which
 * already resolves the user's defaultLocale and then the default_locale global
 * property), then whatever is stored, then DEFAULT_LOCALE.
 */
export const resolveUserLocale = async (): Promise<string> => {
  const explicit = localStorage.getItem(EXPLICIT_LOCALE_STORAGE_KEY);
  if (explicit) return explicit;
  try {
    const session = await get<SessionLocaleResponse>(SESSION_URL);
    if (session?.locale) return session.locale;
  } catch {
    // No session yet (e.g. before login): fall back to the stored locale.
  }
  return getUserPreferredLocale();
};

/**
 * Locales the OpenMRS server accepts (the allowed locales global property).
 * Returns an empty list when the session cannot be read.
 */
export const getAllowedLocales = async (): Promise<string[]> => {
  try {
    const session = await get<SessionLocaleResponse>(SESSION_URL);
    return session?.allowedLocales ?? [];
  } catch {
    return [];
  }
};

/**
 * Stores the locale the user picked and switches the OpenMRS session to it, so
 * server-side messages follow the UI. The caller reloads the page to apply it.
 */
export const setUserLocale = async (locale: string): Promise<void> => {
  localStorage.setItem(EXPLICIT_LOCALE_STORAGE_KEY, locale);
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  try {
    await post(SESSION_URL, { locale });
  } catch {
    // The UI language still changes; only server messages stay in the old one.
  }
};

/**
 * Fetches translations from a URL using the API service.
 * Returns an empty object if the request fails for any reason.
 *
 * @param url - URL to fetch translations from
 * @returns A promise that resolves to a translations object or empty object on failure
 */
export const getTranslationFile = async (
  url: string,
): Promise<Record<string, string>> => {
  try {
    const response = await get<Record<string, string>>(url);
    if (!response) {
      // eslint-disable-next-line no-console
      console.error(`Invalid response from ${url}`);
      return {};
    }
    return response;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Failed to load translations from ${url}:`, error);
    return {};
  }
};
/**
 * Fetches and merges translations from bundled and namespace-specific config sources.
 * This function retrieves translations from both bundled and configuration sources,
 * then merges them with configuration translations taking precedence.
 * Either source can fail independently without affecting the other.
 *
 * @param namespace - Namespace for the translations (e.g., 'clinical', 'registration')
 * @param lang - Language code to fetch translations for (e.g., 'en', 'es')
 * @returns A promise that resolves to a merged translations object where config translations override bundled ones
 * @throws Will not throw errors, but will log warnings for failed fetches
 */
const getMergedTranslations = async (
  namespace: string,
  lang: string,
): Promise<Record<string, string>> => {
  let bundledTranslations: Record<string, string> = {};
  let configTranslations: Record<string, string> = {};

  bundledTranslations = await getTranslationFile(
    BUNDLED_TRANSLATIONS_URL_TEMPLATE(namespace, lang),
  );

  configTranslations = await getTranslationFile(
    CONFIG_TRANSLATIONS_URL_TEMPLATE(namespace, lang),
  );

  return {
    ...bundledTranslations,
    ...configTranslations,
  };
};

/**
 * Fetches translations for a specified language and English fallback if needed.
 * This function follows the i18next resource structure where translations are
 * organized by language code and namespace.
 *
 * @param lang - Language code to fetch translations for (e.g., 'en', 'es')
 * @param namespace - Namespace for the translations (e.g., 'clinical', 'registration')
 * @returns Promise resolving to an object with translations keyed by language code
 * @throws Will not throw errors, but will return empty translations on failure
 */
export const getTranslations = async (
  lang: string,
  namespace: string,
): Promise<Record<string, Record<string, Record<string, string>>>> => {
  const translations: Record<
    string,
    Record<string, Record<string, string>>
  > = {};

  // Get translations for requested language
  translations[lang] = {
    [namespace]: await getMergedTranslations(namespace, lang),
  };

  // Add English fallback for non-English languages
  if (lang !== 'en') {
    translations.en = {
      [namespace]: await getMergedTranslations(namespace, 'en'),
    };
  }

  return translations;
};

export const normalizeTranslationKey = (
  module: string,
  fieldName: string,
): string => {
  const normalizedModule = module.toUpperCase();
  const normalizedFieldName = fieldName
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_]/g, '');
  return `${normalizedModule}_${normalizedFieldName}`;
};

/**
 * Observation form translations structure
 */
export interface ObservationFormTranslations {
  labels: Record<string, string>;
  concepts: Record<string, string>;
}

/**
 * Extracts translations for observation forms from API response for a specific locale
 * @param data - API response array containing translations
 * @param locale - The locale to extract translations for (e.g., 'en', 'es')
 * @returns ObservationFormTranslations object with labels and concepts
 */
export const extractObservationFormTranslations = (
  data: unknown,
  locale: string,
): ObservationFormTranslations => {
  const defaultTranslations: ObservationFormTranslations = {
    labels: {},
    concepts: {},
  };

  if (!Array.isArray(data)) {
    return defaultTranslations;
  }

  const localeData = data.find(
    (item) =>
      item &&
      typeof item === 'object' &&
      'locale' in item &&
      item.locale === locale,
  );

  if (!localeData || typeof localeData !== 'object') {
    return defaultTranslations;
  }

  return {
    labels: (localeData.labels as Record<string, string>) ?? {},
    concepts: (localeData.concepts as Record<string, string>) ?? {},
  };
};
