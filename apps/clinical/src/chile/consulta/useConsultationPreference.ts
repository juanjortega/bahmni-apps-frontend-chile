import { useTranslation } from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { useCallback, useEffect, useRef } from 'react';
import {
  type ConsultationOpenMode,
  fetchOpenMode,
  readLocalOpenMode,
  saveOpenMode,
} from './consultationPreference';

/**
 * Modo preferido para abrir la consulta (ADR-034). Se lee una sola vez y solo se escribe cuando el clínico elige un
 * modo: nada se dispara con otras lecturas ni escrituras. Se devuelve un ref para no redibujar la página.
 */
export const useConsultationPreference = (userUuid: string | undefined) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const preferred = useRef<ConsultationOpenMode>(
    readLocalOpenMode() ?? 'lateral',
  );

  useEffect(() => {
    if (!userUuid) return;
    let cancelled = false;
    fetchOpenMode(userUuid)
      .then((mode) => {
        if (!cancelled && mode) preferred.current = mode;
      })
      .catch(() => {
        // Sin acceso al usuario: queda lo del navegador.
      });
    return () => {
      cancelled = true;
    };
  }, [userUuid]);

  const remember = useCallback(
    (mode: ConsultationOpenMode) => {
      if (preferred.current === mode) return;
      preferred.current = mode;
      saveOpenMode(mode, userUuid).catch(() => {
        addNotification({
          title: t('CHILE_MODE_NOT_SAVED_TITLE'),
          message: t('CHILE_MODE_NOT_SAVED_MESSAGE'),
          type: 'warning',
          timeout: 5000,
        });
      });
    },
    [userUuid, addNotification, t],
  );

  return { preferred, remember };
};
