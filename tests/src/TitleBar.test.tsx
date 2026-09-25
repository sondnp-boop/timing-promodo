import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TitleBar } from '../../src/shared/TitleBar';

describe('TitleBar', () => {
  it('bấm nút thu nhỏ gọi electronAPI.minimizeWindow', () => {
    const minimizeWindow = vi.fn();
    (window as any).electronAPI = { minimizeWindow };
    render(<TitleBar />);
    fireEvent.click(screen.getByLabelText('Thu nhỏ cửa sổ'));
    expect(minimizeWindow).toHaveBeenCalledTimes(1);
  });
});
