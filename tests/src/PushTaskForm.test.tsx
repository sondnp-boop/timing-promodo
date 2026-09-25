import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PushTaskForm } from '../../src/features/pushTasks/PushTaskForm';

function setup() {
  const onSubmit = vi.fn();
  render(<PushTaskForm onSubmit={onSubmit} />);
  const name = screen.getByLabelText('Tên đầu việc');
  const offsets = screen.getByLabelText('Mốc nhắc (giờ)');
  return { onSubmit, name, offsets };
}

describe('PushTaskForm', () => {
  it('chỉ có 2 ô nhập, không còn ô người push, ô chu kỳ, nút thêm', () => {
    setup();
    expect(screen.getAllByRole('textbox')).toHaveLength(2);
    expect(screen.queryByPlaceholderText('Người push')).not.toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('mặc định mốc nhắc là 3,6,9', () => {
    const { offsets } = setup();
    expect(offsets).toHaveValue('3,6,9');
  });

  it('Enter trong ô tên thêm đầu việc và xóa ô tên', () => {
    const { onSubmit, name } = setup();
    fireEvent.change(name, { target: { value: 'Task A' } });
    fireEvent.keyDown(name, { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Task A', offsetsHours: [3, 6, 9] });
    expect(name).toHaveValue('');
  });

  it('Enter trong ô mốc nhắc cũng thêm đầu việc', () => {
    const { onSubmit, name, offsets } = setup();
    fireEvent.change(name, { target: { value: 'Task B' } });
    fireEvent.change(offsets, { target: { value: '1, 2' } });
    fireEvent.keyDown(offsets, { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Task B', offsetsHours: [1, 2] });
  });

  it('Shift+Enter không thêm đầu việc (để xuống dòng)', () => {
    const { onSubmit, name, offsets } = setup();
    fireEvent.change(name, { target: { value: 'Task C' } });
    expect(fireEvent.keyDown(name, { key: 'Enter', shiftKey: true })).toBe(true);
    expect(fireEvent.keyDown(offsets, { key: 'Enter', shiftKey: true })).toBe(true);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('Enter thường bị preventDefault để không chèn xuống dòng', () => {
    const { name } = setup();
    fireEvent.change(name, { target: { value: 'Task D' } });
    expect(fireEvent.keyDown(name, { key: 'Enter' })).toBe(false);
  });

  it('mốc nhắc phân tách được bằng xuống dòng', () => {
    const { onSubmit, name, offsets } = setup();
    fireEvent.change(name, { target: { value: 'Task E' } });
    fireEvent.change(offsets, { target: { value: '2\n4,5' } });
    fireEvent.keyDown(name, { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Task E', offsetsHours: [2, 4, 5] });
  });

  it('không thêm khi tên rỗng hoặc mốc nhắc không hợp lệ', () => {
    const { onSubmit, name, offsets } = setup();
    fireEvent.keyDown(name, { key: 'Enter' });
    fireEvent.change(name, { target: { value: 'Task F' } });
    fireEvent.change(offsets, { target: { value: 'abc' } });
    fireEvent.keyDown(name, { key: 'Enter' });
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
