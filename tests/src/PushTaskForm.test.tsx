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

  it('ban đầu cả 2 ô trống; ô mốc nhắc chỉ có gợi ý 3,6,9', () => {
    const { name, offsets } = setup();
    expect(name).toHaveValue('');
    expect(offsets).toHaveValue('');
    expect(offsets).toHaveAttribute('placeholder', '3,6,9');
  });

  it('Enter trong ô tên thêm đầu việc rồi xóa trắng cả 2 ô', () => {
    const { onSubmit, name, offsets } = setup();
    fireEvent.change(name, { target: { value: 'Task A' } });
    fireEvent.change(offsets, { target: { value: '3,6,9' } });
    fireEvent.keyDown(name, { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Task A', offsetsHours: [3, 6, 9] });
    expect(name).toHaveValue('');
    expect(offsets).toHaveValue('');
  });

  it('Enter trong ô mốc nhắc cũng xóa trắng cả 2 ô', () => {
    const { onSubmit, name, offsets } = setup();
    fireEvent.change(name, { target: { value: 'Task A' } });
    fireEvent.change(offsets, { target: { value: '1,2' } });
    fireEvent.keyDown(offsets, { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(name).toHaveValue('');
    expect(offsets).toHaveValue('');
  });

  it('không xóa ô nào khi dữ liệu chưa hợp lệ (Enter không thêm được)', () => {
    const { onSubmit, name, offsets } = setup();
    fireEvent.change(name, { target: { value: 'Task A' } });
    fireEvent.keyDown(name, { key: 'Enter' });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(name).toHaveValue('Task A');
    expect(offsets).toHaveValue('');
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

  it('textarea giãn chiều cao theo scrollHeight khi nội dung xuống dòng', () => {
    Object.defineProperty(HTMLTextAreaElement.prototype, 'scrollHeight', {
      configurable: true,
      get(this: HTMLTextAreaElement) {
        return this.value.split('\n').length * 20;
      },
    });
    try {
      const { name } = setup();
      expect(name.style.height).toBe('20px');
      fireEvent.change(name, { target: { value: 'a\nb\nc' } });
      expect(name.style.height).toBe('60px');
    } finally {
      delete (HTMLTextAreaElement.prototype as any).scrollHeight;
    }
  });

  it('chế độ sửa: điền tên + mốc giờ và hiện nhãn "Sửa"; thoát thì cả 2 ô trống', () => {
    const onSubmit = vi.fn();
    const { rerender } = render(<PushTaskForm onSubmit={onSubmit} />);
    expect(screen.queryByText('Sửa')).not.toBeInTheDocument();

    const editing = { name: 'Task X', offsetsHours: [2, 4] };
    rerender(<PushTaskForm onSubmit={onSubmit} editing={editing} />);
    expect(screen.getByText('Sửa')).toBeInTheDocument();
    expect(screen.getByLabelText('Tên đầu việc')).toHaveValue('Task X');
    expect(screen.getByLabelText('Mốc nhắc (giờ)')).toHaveValue('2,4');

    fireEvent.keyDown(screen.getByLabelText('Tên đầu việc'), { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Task X', offsetsHours: [2, 4] });

    rerender(<PushTaskForm onSubmit={onSubmit} editing={null} />);
    expect(screen.queryByText('Sửa')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Tên đầu việc')).toHaveValue('');
    expect(screen.getByLabelText('Mốc nhắc (giờ)')).toHaveValue('');
  });

  it('Escape gọi onCancelEdit khi đang sửa, không làm gì khi thêm mới', () => {
    const onCancelEdit = vi.fn();
    const editing = { name: 'Task X', offsetsHours: [2] };
    const { rerender } = render(<PushTaskForm onSubmit={vi.fn()} onCancelEdit={onCancelEdit} />);
    fireEvent.keyDown(screen.getByLabelText('Tên đầu việc'), { key: 'Escape' });
    expect(onCancelEdit).not.toHaveBeenCalled();

    rerender(<PushTaskForm onSubmit={vi.fn()} editing={editing} onCancelEdit={onCancelEdit} />);
    fireEvent.keyDown(screen.getByLabelText('Tên đầu việc'), { key: 'Escape' });
    expect(onCancelEdit).toHaveBeenCalledTimes(1);
  });
});
