import { KeyboardEvent, useState } from 'react';

export interface NewTaskInput {
  name: string;
  offsetsHours: number[];
}

interface PushTaskFormProps {
  onSubmit: (input: NewTaskInput) => void;
}

export function PushTaskForm({ onSubmit }: PushTaskFormProps) {
  const [name, setName] = useState('');
  const [offsetsText, setOffsetsText] = useState('3,6,9');

  function submit() {
    const offsetsHours = offsetsText
      .split(/[,\s]+/)
      .map(Number)
      .filter((n) => Number.isFinite(n) && n > 0);
    if (!name.trim() || offsetsHours.length === 0) {
      return;
    }
    onSubmit({ name: name.trim(), offsetsHours });
    setName('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="push-task-form">
      <textarea
        className="push-task-form__name"
        rows={1}
        placeholder="Tên đầu việc"
        aria-label="Tên đầu việc"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <textarea
        className="push-task-form__offsets"
        rows={1}
        placeholder="3,6,9"
        aria-label="Mốc nhắc (giờ)"
        value={offsetsText}
        onChange={(e) => setOffsetsText(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
