import { formatDateTime, getFormattedAge } from '@bahmni/services';
import { createPatientDetailsViewModel } from '../utils';
import {
  mockFullPatient,
  mockMinimalPatient,
} from './__mocks__/patientDetailsMocks';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  formatDateTime: jest.fn(),
  getFormattedAge: jest.fn(),
}));

const mockedFormatDateTime = formatDateTime as jest.MockedFunction<
  typeof formatDateTime
>;
const mockedGetFormattedAge = getFormattedAge as jest.MockedFunction<
  typeof getFormattedAge
>;

const t = (key: string) => key;

describe('createPatientDetailsViewModel', () => {
  beforeEach(() => {
    mockedGetFormattedAge.mockReturnValue('35YEARS 2MONTHS 15DAYS');
    mockedFormatDateTime.mockReturnValue({
      formattedResult: '01 Jan 1990',
      error: undefined,
    });
  });

  it('maps all fields from a full patient', () => {
    const result = createPatientDetailsViewModel(mockFullPatient, t);

    expect(result).toEqual({
      fullName: 'John Doe',
      gender: 'male',
      formattedIdentifiers: 'MRN123456 | OP789',
      ageDetails: '35YEARS 2MONTHS 15DAYS | 01 Jan 1990',
    });
  });

  it('returns empty strings for all missing fields', () => {
    const result = createPatientDetailsViewModel(mockMinimalPatient, t);

    expect(result).toEqual({
      fullName: '',
      gender: '',
      formattedIdentifiers: '',
      ageDetails: '',
    });
  });

  it('filters out null and empty identifier values', () => {
    const patient = {
      ...mockFullPatient,
      identifiers: new Map<string, string | null>([
        ['MRN', 'MRN123'],
        ['Empty', ''],
        ['Null', null],
        ['ID', 'ID456'],
      ]),
    };

    const result = createPatientDetailsViewModel(patient, t);

    expect(result.formattedIdentifiers).toBe('MRN123 | ID456');
  });

  it('returns only age when formatted date is empty', () => {
    mockedFormatDateTime.mockReturnValue({
      formattedResult: '',
      error: undefined,
    });

    const result = createPatientDetailsViewModel(mockFullPatient, t);

    expect(result.ageDetails).toBe('35YEARS 2MONTHS 15DAYS');
  });

  it('translates the FHIR gender with the GENDER_<initial> keys', () => {
    const translations: Record<string, string> = {
      GENDER_F: 'Femenino',
      GENDER_M: 'Masculino',
    };
    const tEs = (key: string) => translations[key] ?? key;

    expect(
      createPatientDetailsViewModel(
        { ...mockFullPatient, gender: 'female' },
        tEs,
      ).gender,
    ).toBe('Femenino');
    expect(
      createPatientDetailsViewModel({ ...mockFullPatient, gender: 'male' }, tEs)
        .gender,
    ).toBe('Masculino');
    expect(
      createPatientDetailsViewModel(
        { ...mockFullPatient, gender: 'other' },
        tEs,
      ).gender,
    ).toBe('other');
  });
});
