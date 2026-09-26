import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CollapsiblePanel } from '../../src/shared/CollapsiblePanel';

describe('CollapsiblePanel', () => {
  it('mặc định expanded=true thì hiện nội dung', () => {
    render(
      <CollapsiblePanel title="Panel A" defaultExpanded={true}>
        <div>Nội dung A</div>
      </CollapsiblePanel>
    );
    expect(screen.getByText('Nội dung A')).toBeInTheDocument();
  });

  it('mặc định expanded=false thì ẩn nội dung', () => {
    render(
      <CollapsiblePanel title="Panel B" defaultExpanded={false}>
        <div>Nội dung B</div>
      </CollapsiblePanel>
    );
    expect(screen.queryByText('Nội dung B')).not.toBeInTheDocument();
  });

  it('hiển thị badge cạnh tiêu đề khi có, kể cả 0; ẩn khi không truyền', () => {
    const { rerender } = render(
      <CollapsiblePanel title="P" defaultExpanded={false}>
        <div />
      </CollapsiblePanel>
    );
    expect(screen.queryByTestId('panel-badge')).not.toBeInTheDocument();
    rerender(
      <CollapsiblePanel title="P" badge={3} defaultExpanded={false}>
        <div />
      </CollapsiblePanel>
    );
    expect(screen.getByTestId('panel-badge')).toHaveTextContent('3');
    rerender(
      <CollapsiblePanel title="P" badge={0} defaultExpanded={false}>
        <div />
      </CollapsiblePanel>
    );
    expect(screen.getByTestId('panel-badge')).toHaveTextContent('0');
  });

  it('click vào header toggle đúng trạng thái', () => {
    render(
      <CollapsiblePanel title="Panel C" defaultExpanded={false}>
        <div>Nội dung C</div>
      </CollapsiblePanel>
    );
    expect(screen.queryByText('Nội dung C')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Panel C'));
    expect(screen.getByText('Nội dung C')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Panel C'));
    expect(screen.queryByText('Nội dung C')).not.toBeInTheDocument();
  });
});
