import { hasPrivilege, useTranslation } from '@bahmni/services';
import { useUserPrivilege } from '@bahmni/widgets';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import type { InputControl } from '../../components/forms';
import { type ConsultationTabConfig, resolveTabs } from './resolveTabs';
import styles from './styles/consulta.module.scss';

interface ConsultationTabsProps {
  tabs?: ConsultationTabConfig[];
  entries: InputControl[];
  /** Controles con problemas en el último intento de guardar. */
  invalidKeys: string[];
  renderEntry: (entry: InputControl) => React.ReactNode;
}

/**
 * Consulta ordenada por temas (ADR-034). **Todos los controles quedan montados desde el inicio y solo se ocultan**, como
 * en la columna de Bahmni: el borrador y el guardado no cambian, y no hay guardado por tema.
 */
export const ConsultationTabs: React.FC<ConsultationTabsProps> = ({
  tabs,
  entries,
  invalidKeys,
  renderEntry,
}) => {
  const { t } = useTranslation();
  const { userPrivileges } = useUserPrivilege();

  // Un tema sin controles visibles para el rol no se muestra.
  const allowedEntries = useMemo(
    () =>
      entries.filter(
        (entry) =>
          !entry.privilege || hasPrivilege(userPrivileges, entry.privilege),
      ),
    [entries, userPrivileges],
  );
  const resolved = useMemo(
    () => resolveTabs(tabs, allowedEntries),
    [tabs, allowedEntries],
  );

  const subscribe = useCallback(
    (onChange: () => void) => {
      const unsubscribe = entries.map((entry) => entry.subscribe(onChange));
      return () => unsubscribe.forEach((stop) => stop());
    },
    [entries],
  );
  const withData = useSyncExternalStore(subscribe, () =>
    entries
      .filter((entry) => entry.hasData())
      .map((entry) => entry.key)
      .join(','),
  );

  const [selected, setSelected] = useState<string | null>(null);
  const firstInvalidTab = resolved?.tabs.find((tab) =>
    tab.entries.some((entry) => invalidKeys.includes(entry.key)),
  )?.id;

  // Al fallar la validación, lleva al primer tema con problemas.
  useEffect(() => {
    if (firstInvalidTab) setSelected(firstInvalidTab);
  }, [firstInvalidTab, invalidKeys]);

  if (!resolved) return <>{entries.map(renderEntry)}</>;

  const active =
    resolved.tabs.find((tab) => tab.id === selected)?.id ?? resolved.tabs[0].id;
  const dataKeys = withData ? withData.split(',') : [];

  return (
    <>
      {resolved.fixed.map(renderEntry)}
      <div
        role="tablist"
        aria-label={t('CHILE_TABS_LABEL')}
        className={styles.tabs}
      >
        {resolved.tabs.map((tab) => {
          const invalid = tab.entries.some((entry) =>
            invalidKeys.includes(entry.key),
          );
          const hasData = tab.entries.some((entry) =>
            dataKeys.includes(entry.key),
          );
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`consultation-tab-${tab.id}`}
              aria-selected={tab.id === active}
              aria-controls={`consultation-panel-${tab.id}`}
              className={tab.id === active ? styles.tabActive : styles.tab}
              data-testid={`consultation-tab-${tab.id}`}
              onClick={() => setSelected(tab.id)}
            >
              {t(tab.label)}
              {invalid && (
                <span className={styles.tabInvalid}>
                  {t('CHILE_TAB_NEEDS_REVIEW')}
                </span>
              )}
              {!invalid && hasData && (
                <span
                  className={styles.tabDot}
                  role="img"
                  aria-label={t('CHILE_TAB_HAS_DATA')}
                />
              )}
            </button>
          );
        })}
      </div>
      {resolved.tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`consultation-panel-${tab.id}`}
          aria-labelledby={`consultation-tab-${tab.id}`}
          hidden={tab.id !== active}
          data-testid={`consultation-panel-${tab.id}`}
        >
          {tab.entries.map(renderEntry)}
        </div>
      ))}
    </>
  );
};
