import { AllergyStatus, getFormattedAllergies } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { PatientAllergies } from '../PatientAllergies';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getFormattedAllergies: jest.fn(),
  useTranslation: () => ({ t: (key: string) => key }),
}));

const renderBand = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <PatientAllergies patientUuid="patient-a" />
    </QueryClientProvider>,
  );

describe('PatientAllergies', () => {
  it('shows active allergies only', async () => {
    (getFormattedAllergies as jest.Mock).mockResolvedValue([
      { display: 'Penicilina', status: AllergyStatus.Active },
      { display: 'Polen', status: AllergyStatus.Inactive },
    ]);

    renderBand();

    expect(await screen.findByText('Penicilina')).toBeInTheDocument();
    expect(screen.queryByText(/Polen/)).not.toBeInTheDocument();
  });

  it('says when there are none recorded', async () => {
    (getFormattedAllergies as jest.Mock).mockResolvedValue([]);

    renderBand();

    expect(
      await screen.findByText('CHILE_BAND_ALLERGIES_NONE'),
    ).toBeInTheDocument();
  });

  it('never reads as "no allergies" when they could not be loaded', async () => {
    (getFormattedAllergies as jest.Mock).mockRejectedValue(new Error('Red'));

    renderBand();

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'CHILE_BAND_ALLERGIES_UNAVAILABLE',
      ),
    );
    expect(
      screen.queryByText('CHILE_BAND_ALLERGIES_NONE'),
    ).not.toBeInTheDocument();
  });
});
