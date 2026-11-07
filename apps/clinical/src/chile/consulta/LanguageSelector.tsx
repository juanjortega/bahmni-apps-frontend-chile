import { Dropdown } from '@bahmni/design-system';
import {
  getAllowedLocales,
  getUserPreferredLocale,
  setUserLocale,
  useTranslation,
} from '@bahmni/services';
import React, { useEffect, useState } from 'react';

const languageName = (locale: string): string => {
  try {
    const name = new Intl.DisplayNames([locale], { type: 'language' }).of(
      locale,
    );
    return name
      ? name.charAt(0).toLocaleUpperCase(locale) + name.slice(1)
      : locale;
  } catch {
    return locale;
  }
};

/**
 * Idioma visible en la barra (ADR-034), en el mismo orden que los demás módulos. Usa la sesión y el navegador, sin
 * escribir en el usuario. Recarga la página: con un borrador, el navegador pregunta antes.
 */
export const LanguageSelector: React.FC = () => {
  const { t } = useTranslation();
  const [locales, setLocales] = useState<string[]>([]);
  const current = getUserPreferredLocale();

  useEffect(() => {
    let cancelled = false;
    getAllowedLocales().then((allowed) => {
      if (!cancelled) setLocales(allowed);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (locales.length < 2) return null;

  return (
    <Dropdown
      id="chile-language-selector"
      data-testid="chile-language-selector"
      titleText={t('CHILE_LANGUAGE_LABEL')}
      hideLabel
      label={languageName(current)}
      items={locales}
      itemToString={(locale: string | null) =>
        locale ? languageName(locale) : ''
      }
      selectedItem={locales.includes(current) ? current : null}
      onChange={async ({ selectedItem }: { selectedItem: string | null }) => {
        if (!selectedItem || selectedItem === current) return;
        await setUserLocale(selectedItem);
        window.location.reload();
      }}
      size="sm"
    />
  );
};
