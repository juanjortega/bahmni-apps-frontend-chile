import {
  AllergyStatus,
  getFormattedAllergies,
  useTranslation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import styles from './styles/consulta.module.scss';

/**
 * Alergias en la banda del paciente (ADR-018): siempre a la vista. Comparte la consulta con el widget del tablero. Si
 * no se pudieron leer lo dice, porque nunca debe parecer que el paciente no tiene alergias.
 */
export const PatientAllergies: React.FC<{ patientUuid: string }> = ({
  patientUuid,
}) => {
  const { t } = useTranslation();
  const { data, isError, isPending } = useQuery({
    queryKey: ['allergies', patientUuid],
    queryFn: () => getFormattedAllergies(patientUuid),
  });

  if (isPending) return null;

  const active = (data ?? []).filter(
    (allergy) => allergy.status === AllergyStatus.Active,
  );

  return (
    <div className={styles.allergies} data-testid="patient-band-allergies">
      <span className={styles.allergiesLabel}>
        {t('CHILE_BAND_ALLERGIES_LABEL')}
      </span>
      {isError && !data && (
        <span className={styles.allergyAlert} role="alert">
          {t('CHILE_BAND_ALLERGIES_UNAVAILABLE')}
        </span>
      )}
      {data && active.length === 0 && (
        <span>{t('CHILE_BAND_ALLERGIES_NONE')}</span>
      )}
      {active.length > 0 && (
        <span className={styles.allergyAlert}>
          {active.map((allergy) => allergy.display).join(', ')}
        </span>
      )}
    </div>
  );
};
