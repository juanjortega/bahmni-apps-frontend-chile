import { BASE_PATH } from '../constants/app';

export const DEFAULT_LOCALE = 'en';
export const LOCALE_STORAGE_KEY = 'NG_TRANSLATE_LANG_KEY';
// Idioma elegido a mano por el usuario. La GUI Angular chilena usa la misma clave, así que la
// elección vale en las dos GUIs. Sin ella manda el idioma de la sesión de OpenMRS.
export const EXPLICIT_LOCALE_STORAGE_KEY = 'bahmni.uiLocale';

export const BUNDLED_TRANSLATIONS_URL_TEMPLATE = (
  namespace: string,
  lang: string,
) => BASE_PATH + `${namespace}/locales/locale_${lang}.json`;

export const CONFIG_TRANSLATIONS_URL_TEMPLATE = (
  namespace: string,
  lang: string,
) => `/bahmni_config/openmrs/i18n/${namespace}/locale_${lang}.json`;
