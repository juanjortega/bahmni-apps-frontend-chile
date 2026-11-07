import { useTranslation } from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { useCallback, useEffect, useRef } from 'react';
import {
  clampSplit,
  type ConsultationOpenMode,
  DEFAULT_SPLIT,
  fetchPreference,
  readLocalOpenMode,
  readLocalSplit,
  saveOpenMode,
  saveSplit,
} from './consultationPreference';

const SPLIT_SAVE_DELAY_MS = 600;

/**
 * Modo y división preferidos para abrir la consulta (ADR-034). Se lee una sola vez y solo se escribe cuando el clínico elige un
 * modo: nada se dispara con otras lecturas ni escrituras. Se devuelve un ref para no redibujar la página.
 */
export const useConsultationPreference = (userUuid: string | undefined) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const preferred = useRef<ConsultationOpenMode>(
    readLocalOpenMode() ?? 'lateral',
  );
  const preferredSplit = useRef<number>(readLocalSplit() ?? DEFAULT_SPLIT);
  // Cada guardado lee y reescribe las propiedades del usuario: van de a uno para no pisarse.
  const pendingSave = useRef<Promise<void>>(Promise.resolve());
  const splitTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!userUuid) return;
    let cancelled = false;
    fetchPreference(userUuid)
      .then(({ mode, split }) => {
        if (cancelled) return;
        if (mode) preferred.current = mode;
        if (split !== null) preferredSplit.current = split;
      })
      .catch(() => {
        // Sin acceso al usuario: queda lo del navegador.
      });
    return () => {
      cancelled = true;
      clearTimeout(splitTimer.current);
    };
  }, [userUuid]);

  const enqueueSave = useCallback(
    (save: () => Promise<void>) => {
      pendingSave.current = pendingSave.current.then(save).catch(() => {
        addNotification({
          title: t('CHILE_MODE_NOT_SAVED_TITLE'),
          message: t('CHILE_MODE_NOT_SAVED_MESSAGE'),
          type: 'warning',
          timeout: 5000,
        });
      });
    },
    [addNotification, t],
  );

  const remember = useCallback(
    (mode: ConsultationOpenMode) => {
      if (preferred.current === mode) return;
      preferred.current = mode;
      enqueueSave(() => saveOpenMode(mode, userUuid));
    },
    [userUuid, enqueueSave],
  );

  const rememberSplit = useCallback(
    (percent: number) => {
      const split = clampSplit(percent);
      clearTimeout(splitTimer.current);
      if (split === preferredSplit.current) return;
      splitTimer.current = setTimeout(() => {
        preferredSplit.current = split;
        enqueueSave(() => saveSplit(split, userUuid));
      }, SPLIT_SAVE_DELAY_MS);
    },
    [userUuid, enqueueSave],
  );

  return { preferred, preferredSplit, remember, rememberSplit };
};
