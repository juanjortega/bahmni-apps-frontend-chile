import { OPENMRS_FHIR_R4 } from '../constants/app';

export const IMMUNIZATION_FHIR_URL = OPENMRS_FHIR_R4 + '/Immunization';

// fhir2 2.5.x only searches Immunization by patient and _sort: any other
// parameter (status included) answers 400, so status is filtered client-side.
export const PATIENT_IMMUNIZATION_URL = (patientUuid: string) =>
  `${IMMUNIZATION_FHIR_URL}?patient=${patientUuid}&_sort=-date&_count=100`;
