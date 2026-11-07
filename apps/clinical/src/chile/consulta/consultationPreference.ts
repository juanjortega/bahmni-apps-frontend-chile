import { get, post, USER_PINNED_PREFERENCE_URL } from '@bahmni/services';

export type ConsultationOpenMode = 'lateral' | 'completa';

/** Misma propiedad de usuario y formato que `bcui.espacio.<módulo>` de bahmni-clinical-ui (ADR-033). */
export const PREFERENCE_KEY = 'bcui.espacio.clinical-v2';

/** Ancho de la ficha en el modo lateral, en %: mismos valores que dental. */
export const DEFAULT_SPLIT = 40;
const SPLIT_MIN = 25;
const SPLIT_MAX = 70;

export const clampSplit = (percent: number): number =>
  Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, Math.round(percent)));

export const parseSplit = (raw: string | null | undefined): number | null => {
  if (!raw) return null;
  try {
    const split = (JSON.parse(raw) as { s?: unknown }).s;
    return typeof split === 'number' && Number.isFinite(split)
      ? clampSplit(split)
      : null;
  } catch {
    return null;
  }
};

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

interface PreferenceChange {
  m?: ConsultationOpenMode;
  s?: number;
}

/** Conserva lo demás que ya estuviera guardado (división, bloques). */
const mergePreference = (
  change: PreferenceChange,
  previous: string | null | undefined,
): string => {
  let rest: Record<string, unknown> = {};
  try {
    const parsed = previous ? JSON.parse(previous) : null;
    if (parsed && typeof parsed === 'object') rest = parsed;
  } catch {
    rest = {};
  }
  return JSON.stringify({ ...rest, ...change });
};

export const readLocalOpenMode = (): ConsultationOpenMode | null => {
  try {
    return parseOpenMode(localStorage.getItem(PREFERENCE_KEY));
  } catch {
    return null;
  }
};

export const readLocalSplit = (): number | null => {
  try {
    return parseSplit(localStorage.getItem(PREFERENCE_KEY));
  } catch {
    return null;
  }
};

interface UserWithProperties {
  userProperties?: Record<string, string>;
}

export const fetchPreference = async (
  userUuid: string,
): Promise<{
  mode: ConsultationOpenMode | null;
  split: number | null;
}> => {
  const user = await get<UserWithProperties>(
    USER_PINNED_PREFERENCE_URL(userUuid),
  );
  const raw = user?.userProperties?.[PREFERENCE_KEY];
  return { mode: parseOpenMode(raw), split: parseSplit(raw) };
};

/**
 * Guarda en el navegador y en el usuario de OpenMRS. `POST user/{uuid}` reemplaza todas las propiedades, así que se
 * leen antes y se envían completas; si no se pueden leer no se escribe. Si falla (por ejemplo, sin `Edit Users`), queda
 * en el navegador y el error llega a quien llama.
 */
const savePreference = async (
  change: PreferenceChange,
  userUuid: string | undefined,
): Promise<void> => {
  let local: string | null = null;
  try {
    local = localStorage.getItem(PREFERENCE_KEY);
    localStorage.setItem(PREFERENCE_KEY, mergePreference(change, local));
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
      [PREFERENCE_KEY]: mergePreference(
        change,
        user.userProperties[PREFERENCE_KEY],
      ),
    },
  });
};

export const saveOpenMode = (
  mode: ConsultationOpenMode,
  userUuid: string | undefined,
): Promise<void> => savePreference({ m: mode }, userUuid);

export const saveSplit = (
  split: number,
  userUuid: string | undefined,
): Promise<void> => savePreference({ s: split }, userUuid);
