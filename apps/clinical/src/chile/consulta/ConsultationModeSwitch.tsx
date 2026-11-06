import { Button } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import React from 'react';
import styles from './styles/consulta.module.scss';

export type ConsultationMode = 'ficha' | 'lateral' | 'completa';

const MODES: { mode: ConsultationMode; labelKey: string }[] = [
  { mode: 'ficha', labelKey: 'CHILE_MODE_CHART' },
  { mode: 'lateral', labelKey: 'CHILE_MODE_SIDE' },
  { mode: 'completa', labelKey: 'CHILE_MODE_FULL' },
];

/** Qué se ve con una consulta abierta (ADR-034). Cambiar de modo nunca desmonta la consulta. */
export const ConsultationModeSwitch: React.FC<{
  mode: ConsultationMode;
  onChange: (mode: ConsultationMode) => void;
}> = ({ mode, onChange }) => {
  const { t } = useTranslation();
  return (
    <div
      role="group"
      aria-label={t('CHILE_MODE_LABEL')}
      className={styles.modeSwitch}
      data-testid="consultation-mode-switch"
    >
      {MODES.map((item) => (
        <Button
          key={item.mode}
          size="sm"
          kind={item.mode === mode ? 'primary' : 'tertiary'}
          aria-pressed={item.mode === mode}
          onClick={() => onChange(item.mode)}
          data-testid={`consultation-mode-${item.mode}`}
        >
          {t(item.labelKey)}
        </Button>
      ))}
    </div>
  );
};
