import { get, post } from '@bahmni/services';
import {
  fetchOpenMode,
  parseOpenMode,
  PREFERENCE_KEY,
  readLocalOpenMode,
  saveOpenMode,
} from '../consultationPreference';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  get: jest.fn(),
  post: jest.fn(),
}));

describe('consultationPreference', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (post as jest.Mock).mockResolvedValue({});
  });

  it('understands only known modes', () => {
    expect(parseOpenMode('{"m":"completa"}')).toBe('completa');
    expect(parseOpenMode('{"m":"otro"}')).toBeNull();
    expect(parseOpenMode('no es json')).toBeNull();
    expect(parseOpenMode(undefined)).toBeNull();
  });

  it('reads the mode saved on the user', async () => {
    (get as jest.Mock).mockResolvedValue({
      userProperties: { [PREFERENCE_KEY]: '{"m":"completa"}' },
    });

    await expect(fetchOpenMode('u-1')).resolves.toBe('completa');
  });

  it('keeps the other user properties and the rest of the preference', async () => {
    (get as jest.Mock).mockResolvedValue({
      userProperties: {
        defaultLocale: 'es',
        [PREFERENCE_KEY]: '{"m":"lateral","s":50}',
      },
    });

    await saveOpenMode('completa', 'u-1');

    const [, body] = (post as jest.Mock).mock.calls[0];
    expect(body.userProperties.defaultLocale).toBe('es');
    expect(JSON.parse(body.userProperties[PREFERENCE_KEY])).toEqual({
      m: 'completa',
      s: 50,
    });
  });

  it('does not write when the properties cannot be read, and stays in the browser', async () => {
    (get as jest.Mock).mockResolvedValue({ uuid: 'u-1' });

    await expect(saveOpenMode('completa', 'u-1')).rejects.toThrow();

    expect(post).not.toHaveBeenCalled();
    expect(readLocalOpenMode()).toBe('completa');
  });
});
