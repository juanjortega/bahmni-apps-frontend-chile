import { get, post, USER_PINNED_PREFERENCE_URL } from '@bahmni/services';

export type ConsultationOpenMode = 'lateral' | 'completa';

/** Misma propiedad de usuario y formato que `bcui.espacio.<módulo>` de bahmni-clinical-ui (ADR-033). */
export const PREFERENCE_KEY = 'bcui.espacio.clinical-v2';

export const parseOpenMode = (
  raw: string | null | undefined,
): ConsultationOpenMode | null => {
  if (!raw) return null;
  try {
    const mode = (JSON.parse(raw) as { m?: unknown }).m;
    return mode === 'lateral' || mode === 'completa' ? mode : null;
  } catch {
    return null;
  }
};

/** Conserva lo demás que ya estuviera guardado (división, bloques). */
const serializeOpenMode = (
  mode: ConsultationOpenMode,
  previous: string | null | undefined,
): string => {
  let rest: Record<string, unknown> = {};
  try {
    const parsed = previous ? JSON.parse(previous) : null;
    if (parsed && typeof parsed === 'object') rest = parsed;
  } catch {
    rest = {};
  }
  return JSON.stringify({ ...rest, m: mode });
};

export const readLocalOpenMode = (): ConsultationOpenMode | null => {
  try {
    return parseOpenMode(localStorage.getItem(PREFERENCE_KEY));
  } catch {
    return null;
  }
};

interface UserWithProperties {
  userProperties?: Record<string, string>;
}

export const fetchOpenMode = async (
  userUuid: string,
): Promise<ConsultationOpenMode | null> => {
  const user = await get<UserWithProperties>(
    USER_PINNED_PREFERENCE_URL(userUuid),
  );
  return parseOpenMode(user?.userProperties?.[PREFERENCE_KEY]);
};

/**
 * Guarda en el navegador y en el usuario de OpenMRS. `POST user/{uuid}` reemplaza todas las propiedades, así que se
 * leen antes y se envían completas; si no se pueden leer no se escribe. Si falla (por ejemplo, sin `Edit Users`), queda
 * en el navegador y el error llega a quien llama.
 */
export const saveOpenMode = async (
  mode: ConsultationOpenMode,
  userUuid: string | undefined,
): Promise<void> => {
  let local: string | null = null;
  try {
    local = localStorage.getItem(PREFERENCE_KEY);
    localStorage.setItem(PREFERENCE_KEY, serializeOpenMode(mode, local));
  } catch {
    // Almacenamiento bloqueado: se intenta igual en el usuario.
  }
  if (!userUuid) throw new Error('Sin usuario');
  const url = USER_PINNED_PREFERENCE_URL(userUuid);
  const user = await get<UserWithProperties>(url);
  if (!user?.userProperties) {
    throw new Error('No se pudieron leer las propiedades del usuario');
  }
  await post(url, {
    userProperties: {
      ...user.userProperties,
      [PREFERENCE_KEY]: serializeOpenMode(
        mode,
        user.userProperties[PREFERENCE_KEY],
      ),
    },
  });
};
