import { render } from '@testing-library/react';
import React from 'react';
import ActionAreaLayout from '../index';

type LayoutCallback = (layout: Record<string, number>) => void;

let reportLayout: LayoutCallback = () => undefined;
const panelProps: Record<string, Record<string, unknown>> = {};

jest.mock('react-resizable-panels', () => ({
  Group: ({
    children,
    onLayoutChanged,
  }: {
    children: React.ReactNode;
    onLayoutChanged: LayoutCallback;
  }) => {
    reportLayout = onLayoutChanged;
    return <div>{children}</div>;
  },
  Panel: ({
    children,
    id,
    ...props
  }: {
    children: React.ReactNode;
    id: string;
  }) => {
    panelProps[id] = props;
    return <div id={id}>{children}</div>;
  },
  Separator: () => <div />,
}));

describe('ActionAreaLayout split', () => {
  const base = {
    headerWSideNav: <div />,
    mainDisplay: <div />,
    actionArea: <div />,
  };

  it('keeps the original sizes when nothing is passed', () => {
    render(<ActionAreaLayout {...base} isActionAreaVisible />);

    expect(panelProps['main-display-panel']).toMatchObject({
      defaultSize: 40,
      minSize: 40,
    });
    expect(panelProps['action-area-panel']).toMatchObject({
      defaultSize: 60,
      minSize: 40,
    });
  });

  it('uses the sizes it receives', () => {
    render(
      <ActionAreaLayout
        {...base}
        isActionAreaVisible
        mainDisplaySize={55}
        mainDisplayMinSize="360px"
        actionAreaMinSize="560px"
      />,
    );

    expect(panelProps['main-display-panel']).toMatchObject({
      defaultSize: 55,
      minSize: '360px',
    });
    expect(panelProps['action-area-panel']).toMatchObject({
      defaultSize: 45,
      minSize: '560px',
    });
  });

  it('reports the split only while the action area is open', () => {
    const onSplitChange = jest.fn();
    const { rerender } = render(
      <ActionAreaLayout
        {...base}
        isActionAreaVisible={false}
        onSplitChange={onSplitChange}
      />,
    );

    reportLayout({ 'main-display-panel': 100 });
    expect(onSplitChange).not.toHaveBeenCalled();

    rerender(
      <ActionAreaLayout
        {...base}
        isActionAreaVisible
        onSplitChange={onSplitChange}
      />,
    );
    reportLayout({ 'main-display-panel': 52, 'action-area-panel': 48 });

    expect(onSplitChange).toHaveBeenCalledWith(52);
  });
});
