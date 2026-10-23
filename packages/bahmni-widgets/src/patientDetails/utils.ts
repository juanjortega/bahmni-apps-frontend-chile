import {
  FormattedPatientData,
  formatDateTime,
  getFormattedAge,
} from '@bahmni/services';
import { PatientDetailsViewModel } from './models';

function formatPatientIdentifiers(
  identifiers: Map<string, string | null>,
): string {
  if (!identifiers.size) return '';
  const joined = Array.from(identifiers.values())
    .filter((value) => value != null && value !== '')
    .join(' | ');
  return joined || '';
}

function formatAgeDetails(
  birthDate: string | null,
  t: (key: string) => string,
): string {
  if (!birthDate) return '';
  const age = getFormattedAge(birthDate, t);
  const date = formatDateTime(birthDate, t).formattedResult;
  return [age, date].filter(Boolean).join(' | ') || '';
}

// FHIR trae el sexo como female/male/other/unknown; las traducciones usan GENDER_F/M/O/U.
// Sin traducción para la clave, se muestra el valor tal como viene.
function formatPatientGender(
  gender: string | null | undefined,
  t: (key: string) => string,
): string {
  const raw = (gender ?? '').trim();
  if (!raw) return '';
  const key = `GENDER_${raw.charAt(0).toUpperCase()}`;
  const translated = t(key);
  return translated && translated !== key ? translated : raw;
}

export function createPatientDetailsViewModel(
  patient: FormattedPatientData,
  t: (key: string) => string,
): PatientDetailsViewModel {
  return {
    fullName: patient.fullName ?? '',
    gender: formatPatientGender(patient.gender, t),
    formattedIdentifiers: formatPatientIdentifiers(patient.identifiers),
    ageDetails: formatAgeDetails(patient.birthDate, t),
  };
}
