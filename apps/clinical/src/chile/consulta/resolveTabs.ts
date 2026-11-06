/** Temas de la consulta (ADR-034): `consultationPad.tabs` en `clinical/v2/app.json`. Solo ordenan, no guardan. */
export interface ConsultationTabConfig {
  id: string;
  /** Clave de traducción. */
  label: string;
  /** `type` de los controles de `consultationPad.inputControls`. */
  inputControls: string[];
}

export const OTHERS_TAB_ID = 'chile-otros';
const OTHERS_TAB_LABEL = 'CHILE_TAB_OTHERS';
const FIXED_CONTROL = 'encounterDetails';

interface HasKey {
  key: string;
}

export interface ResolvedTab<T> {
  id: string;
  label: string;
  entries: T[];
}

export interface ResolvedTabs<T> {
  /** Detalles del encuentro: siempre a la vista, sobre los temas. */
  fixed: T[];
  tabs: ResolvedTab<T>[];
}

/**
 * Reparte los controles visibles entre los temas del centro. Ningún control desaparece: lo no listado va a «Otros», y un
 * control listado dos veces queda en el primero. Devuelve `null` si no hay al menos dos temas con controles: entonces
 * la consulta se muestra como en Bahmni, en una sola columna.
 */
export const resolveTabs = <T extends HasKey>(
  config: ConsultationTabConfig[] | undefined,
  entries: T[],
): ResolvedTabs<T> | null => {
  if (!config?.length) return null;

  const fixed = entries.filter((entry) => entry.key === FIXED_CONTROL);
  const pending = entries.filter((entry) => entry.key !== FIXED_CONTROL);
  const used = new Set<string>();

  const tabs: ResolvedTab<T>[] = config.map((tab) => {
    const tabEntries = pending.filter(
      (entry) => tab.inputControls.includes(entry.key) && !used.has(entry.key),
    );
    tabEntries.forEach((entry) => used.add(entry.key));
    return { id: tab.id, label: tab.label, entries: tabEntries };
  });

  const others = pending.filter((entry) => !used.has(entry.key));
  if (others.length) {
    tabs.push({
      id: OTHERS_TAB_ID,
      label: OTHERS_TAB_LABEL,
      entries: others,
    });
  }

  const visible = tabs.filter((tab) => tab.entries.length > 0);
  return visible.length >= 2 ? { fixed, tabs: visible } : null;
};
