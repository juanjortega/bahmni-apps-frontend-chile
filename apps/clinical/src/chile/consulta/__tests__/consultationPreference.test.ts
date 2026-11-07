import { get, post } from '@bahmni/services';
import {
  fetchPreference,
  parseOpenMode,
  parseSplit,
  PREFERENCE_KEY,
  readLocalOpenMode,
  readLocalSplit,
  saveOpenMode,
  saveSplit,
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

  it('keeps the split within the range of the dental module', () => {
    expect(parseSplit('{"s":50}')).toBe(50);
    expect(parseSplit('{"s":5}')).toBe(25);
    expect(parseSplit('{"s":95}')).toBe(70);
    expect(parseSplit('{"s":"50"}')).toBeNull();
    expect(parseSplit('{"m":"lateral"}')).toBeNull();
    expect(parseSplit('no es json')).toBeNull();
  });

  it('reads the mode and the split saved on the user', async () => {
    (get as jest.Mock).mockResolvedValue({
      userProperties: { [PREFERENCE_KEY]: '{"m":"completa","s":55}' },
    });

    await expect(fetchPreference('u-1')).resolves.toEqual({
      mode: 'completa',
      split: 55,
    });
  });

  it('saves the split without touching the mode or other properties', async () => {
    (get as jest.Mock).mockResolvedValue({
      userProperties: {
        defaultLocale: 'es',
        [PREFERENCE_KEY]: '{"m":"completa"}',
      },
    });

    await saveSplit(55, 'u-1');

    const [, body] = (post as jest.Mock).mock.calls[0];
    expect(body.userProperties.defaultLocale).toBe('es');
    expect(JSON.parse(body.userProperties[PREFERENCE_KEY])).toEqual({
      m: 'completa',
      s: 55,
    });
    expect(readLocalSplit()).toBe(55);
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
