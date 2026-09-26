import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDialog, Modal } from '../../src/shared/Modal';

describe('Modal', () => {
  it('hiện tiêu đề và nội dung dạng dialog', () => {
    render(
      <Modal title="Tiêu đề" onClose={vi.fn()}>
        <div>Nội dung</div>
      </Modal>
    );
    expect(screen.getByRole('dialog', { name: 'Tiêu đề' })).toBeInTheDocument();
    expect(screen.getByText('Nội dung')).toBeInTheDocument();
  });

  it('Escape và bấm nền tối đóng; bấm trong hộp thì không', () => {
    const onClose = vi.fn();
    render(
      <Modal title="T" onClose={onClose}>
        <div>Nội dung</div>
      </Modal>
    );
    fireEvent.click(screen.getByText('Nội dung'));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('modal-overlay'));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(document, { key: 'a' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

describe('ConfirmDialog', () => {
  it('hiện thông điệp; Đồng ý gọi onConfirm, Hủy gọi onCancel', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog message="Xóa việc A?" confirmLabel="Xóa" onConfirm={onConfirm} onCancel={onCancel} />);
    expect(screen.getByText('Xóa việc A?')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Hủy'));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Xóa'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
