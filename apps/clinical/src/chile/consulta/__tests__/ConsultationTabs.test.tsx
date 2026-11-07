import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import type { InputControl } from '../../../components/forms';
import { ConsultationTabs } from '../ConsultationTabs';
import { type ConsultationTabConfig, resolveTabs } from '../resolveTabs';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: () => ({ t: (key: string) => key }),
  hasPrivilege: (_: unknown, required: string[]) => required[0] !== 'NO',
}));

jest.mock('@bahmni/widgets', () => ({
  useUserPrivilege: () => ({ userPrivileges: [] }),
}));

const entry = (key: string, extra: Partial<InputControl> = {}): InputControl =>
  ({
    key,
    component: () => null,
    reset: jest.fn(),
    validate: () => true,
    hasData: () => false,
    subscribe: () => () => undefined,
    ...extra,
  }) as unknown as InputControl;

const CONFIG: ConsultationTabConfig[] = [
  { id: 'evaluacion', label: 'EVAL', inputControls: ['allergies'] },
  { id: 'tratamiento', label: 'TRAT', inputControls: ['medication'] },
];

const renderTabs = (
  entries: InputControl[],
  invalidKeys: string[] = [],
  tabs: ConsultationTabConfig[] | undefined = CONFIG,
) =>
  render(
    <ConsultationTabs
      tabs={tabs}
      entries={entries}
      invalidKeys={invalidKeys}
      renderEntry={(item) => (
        <input key={item.key} aria-label={item.key} data-testid={item.key} />
      )}
    />,
  );

describe('resolveTabs', () => {
  const keys = (list: { key: string }[]) => list.map((item) => item.key);

  it('keeps encounter details out of the tabs', () => {
    const result = resolveTabs(CONFIG, [
      { key: 'encounterDetails' },
      { key: 'allergies' },
      { key: 'medication' },
    ]);

    expect(keys(result!.fixed)).toEqual(['encounterDetails']);
    expect(result!.tabs.map((tab) => tab.id)).toEqual([
      'evaluacion',
      'tratamiento',
    ]);
  });

  it('never loses a control: what is not listed goes to Others', () => {
    const result = resolveTabs(CONFIG, [
      { key: 'allergies' },
      { key: 'medication' },
      { key: 'vaccination' },
    ]);

    expect(keys(result!.tabs[2].entries)).toEqual(['vaccination']);
  });

  it('keeps a control listed twice in the first tab', () => {
    const result = resolveTabs(
      [
        { id: 'a', label: 'A', inputControls: ['allergies', 'medication'] },
        {
          id: 'b',
          label: 'B',
          inputControls: ['medication', 'investigations'],
        },
      ],
      [{ key: 'allergies' }, { key: 'medication' }, { key: 'investigations' }],
    );

    expect(keys(result!.tabs[0].entries)).toEqual(['allergies', 'medication']);
    expect(keys(result!.tabs[1].entries)).toEqual(['investigations']);
  });

  it('uses the single column without config or with one tab', () => {
    expect(resolveTabs(undefined, [{ key: 'allergies' }])).toBeNull();
    expect(resolveTabs(CONFIG, [{ key: 'allergies' }])).toBeNull();
  });
});

describe('ConsultationTabs', () => {
  const both = () => [entry('allergies'), entry('medication')];

  it('renders every control without tabs when there is no config', () => {
    renderTabs(both(), [], []);

    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.getByTestId('allergies')).toBeInTheDocument();
    expect(screen.getByTestId('medication')).toBeInTheDocument();
  });

  it('keeps what was typed when changing tabs, because all stay mounted', () => {
    renderTabs(both());

    const allergies = screen.getByTestId('allergies') as HTMLInputElement;
    fireEvent.change(allergies, { target: { value: 'penicilina' } });
    expect(screen.getByTestId('medication')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('consultation-tab-tratamiento'));
    expect(screen.getByTestId('consultation-panel-evaluacion')).toHaveAttribute(
      'hidden',
    );

    fireEvent.click(screen.getByTestId('consultation-tab-evaluacion'));
    expect(screen.getByTestId('allergies')).toBe(allergies);
    expect(allergies.value).toBe('penicilina');
  });

  it('marks the tabs with data', () => {
    renderTabs([
      entry('allergies'),
      entry('medication', { hasData: () => true }),
    ]);

    expect(
      screen
        .getByTestId('consultation-tab-tratamiento')
        .querySelector('[role="img"]'),
    ).toBeInTheDocument();
    expect(
      screen
        .getByTestId('consultation-tab-evaluacion')
        .querySelector('[role="img"]'),
    ).not.toBeInTheDocument();
  });

  it('opens and marks the first tab with problems', () => {
    renderTabs(both(), ['medication']);

    expect(screen.getByTestId('consultation-tab-tratamiento')).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(
      screen.getByTestId('consultation-tab-tratamiento'),
    ).toHaveTextContent('CHILE_TAB_NEEDS_REVIEW');
  });

  it('hides a tab with no control the role can use', () => {
    renderTabs(
      [
        entry('allergies'),
        entry('medication', { privilege: ['NO'] }),
        entry('investigations'),
      ],
      [],
      [
        ...CONFIG,
        { id: 'ordenes', label: 'ORD', inputControls: ['investigations'] },
      ],
    );

    expect(
      screen.queryByTestId('consultation-tab-tratamiento'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('consultation-tab-ordenes')).toBeInTheDocument();
  });
});
