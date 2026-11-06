import { useTranslation } from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { useEffect, useRef } from 'react';
import { hasUnsavedConsultation } from './useUnsavedConsultation';

/**
 * Distribución chilena (ADR-034): la ruta no puede detener «Atrás», así que al cambiar de paciente con un borrador se
 * avisa después de descartarlo. Se lee durante el render, antes de que se desmonte la consulta y limpie el indicador.
 */
export const useDiscardedOnPatientChange = (
  patientUuid: string | null,
): void => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const previous = useRef(patientUuid);
  const discarded =
    previous.current !== patientUuid && hasUnsavedConsultation();
  previous.current = patientUuid;

  useEffect(() => {
    if (!discarded) return;
    addNotification({
      title: t('CONSULTATION_DISCARDED_PATIENT_CHANGED_TITLE'),
      message: t('CONSULTATION_DISCARDED_PATIENT_CHANGED_MESSAGE'),
      type: 'warning',
    });
  }, [discarded, addNotification, t]);
};
