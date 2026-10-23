import { get } from '../api';
import { OPENMRS_REST_V1, SESSION_URL } from '../constants/app';
import { getFormattedError } from '../errorHandling';
import { UserPrivilege, SessionResponse } from './models';

// OpenMRS RoleConstants.SUPERUSER: the backend grants this role every
// privilege, yet /session lists none for it, so the UI hid every tile.
export const SUPERUSER_ROLE = 'System Developer';
const PRIVILEGE_URL = OPENMRS_REST_V1 + '/privilege';
// The server caps a page at 1000 (absolute limit) and defaults to 50.
const PRIVILEGE_PAGE_SIZE = 500;

interface PrivilegePage {
  results?: UserPrivilege[];
  links?: { rel: string }[];
}

const isSuperUser = (session: SessionResponse): boolean =>
  !!session.user?.roles?.some(
    (role) => (role.name ?? role.display) === SUPERUSER_ROLE,
  );

/**
 * Every privilege defined on the server, page by page: what a superuser holds.
 */
const getAllPrivileges = async (): Promise<UserPrivilege[]> => {
  const privileges: UserPrivilege[] = [];
  for (let startIndex = 0; ; startIndex += PRIVILEGE_PAGE_SIZE) {
    const page = await get<PrivilegePage>(
      `${PRIVILEGE_URL}?v=custom:(uuid,name)&limit=${PRIVILEGE_PAGE_SIZE}&startIndex=${startIndex}`,
    );
    privileges.push(...(page.results ?? []));
    if (!page.links?.some((link) => link.rel === 'next')) {
      return privileges;
    }
  }
};

/**
 * Fetches current user privileges from session API. A superuser (System
 * Developer role) gets every privilege defined on the server, as the backend
 * treats it.
 * @returns Promise that resolves to array of user privileges or null if failed
 * @throws Error if fetch fails
 */
export const getCurrentUserPrivileges = async (): Promise<
  UserPrivilege[] | null
> => {
  try {
    const session = await get<SessionResponse>(SESSION_URL);

    if (!session.user) {
      return null;
    }

    if (isSuperUser(session)) {
      try {
        return await getAllPrivileges();
      } catch {
        // Fall back to what the session lists; better than failing the app.
      }
    }

    return session.user.privileges;
  } catch (error) {
    const { message } = getFormattedError(error);
    throw new Error(message);
  }
};

/**
 * Check if user has a specific privilege or any of the given privileges
 * @param userPrivileges - Array of user privileges from session API
 * @param requiredPrivilege - Name of the privilege or array of privilege names to check
 * @returns true if user has any of the required privileges, false otherwise
 */
export const hasPrivilege = (
  userPrivileges: UserPrivilege[] | null,
  requiredPrivilege: string | string[] | undefined,
): boolean => {
  if (!userPrivileges || userPrivileges.length === 0) {
    return false;
  }

  if (!requiredPrivilege || requiredPrivilege.length === 0) {
    return true;
  }

  const requiredPrivileges = Array.isArray(requiredPrivilege)
    ? requiredPrivilege
    : [requiredPrivilege];

  return userPrivileges.some((userPrivilege) =>
    requiredPrivileges.includes(userPrivilege.name),
  );
};
