import { LOCALE_STORAGE_KEY } from '../../i18n/constants';
import { formatDateTime, getDateFnsLocale, getTimeFormat } from '../date';

describe('locale-aware date formatting', () => {
  afterEach(() => localStorage.clear());

  describe('getTimeFormat', () => {
    it('uses 24 h for Spanish', () => {
      expect(getTimeFormat('es')).toBe('HH:mm');
      expect(getTimeFormat('es-CL')).toBe('HH:mm');
    });

    it('keeps 12 h for US English', () => {
      expect(getTimeFormat('en')).toBe('h:mm a');
    });

    it('keeps the default for a malformed locale', () => {
      expect(getTimeFormat('not a locale')).toBe('h:mm a');
    });

    it('reads the UI locale when none is given', () => {
      localStorage.setItem(LOCALE_STORAGE_KEY, 'es');
      expect(getTimeFormat()).toBe('HH:mm');
    });
  });

  describe('getDateFnsLocale', () => {
    it('maps the UI language to a date-fns locale', () => {
      expect(getDateFnsLocale('es')?.code).toBe('es');
      expect(getDateFnsLocale('pt_BR')?.code).toBe('pt-BR');
    });

    it('leaves unknown languages to the date-fns default', () => {
      expect(getDateFnsLocale('km')).toBeUndefined();
    });
  });

  describe('formatDateTime in Spanish', () => {
    beforeEach(() => localStorage.setItem(LOCALE_STORAGE_KEY, 'es'));

    it('shows the time in 24 h', () => {
      const result = formatDateTime(
        new Date(2026, 9, 23, 14, 5),
        undefined,
        true,
      );
      expect(result.formattedResult).toMatch(/14:05$/);
    });

    it('names the month in Spanish', () => {
      const result = formatDateTime(
        new Date(2026, 9, 23),
        undefined,
        false,
        'dd MMM yyyy',
      );
      expect(result.formattedResult).toBe('23 oct 2026');
    });
  });
});
