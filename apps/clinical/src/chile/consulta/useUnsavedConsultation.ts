import { useEffect } from 'react';

let unsaved = false;

/** Si hay una consulta con datos sin guardar en esta ventana. */
export const hasUnsavedConsultation = (): boolean => unsaved;

/**
 * Distribución chilena (ADR-034): con un borrador de consulta, el navegador pregunta antes de recargar o cerrar. Eso
 * también cubre el cambio de idioma, que recarga la página.
 */
export const useUnsavedConsultation = (hasData: boolean): void => {
  useEffect(() => {
    if (!hasData) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    unsaved = true;
    window.addEventListener('beforeunload', warn);
    return () => {
      unsaved = false;
      window.removeEventListener('beforeunload', warn);
    };
  }, [hasData]);
};
