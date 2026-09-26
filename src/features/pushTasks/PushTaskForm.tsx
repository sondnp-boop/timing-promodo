import { KeyboardEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface NewTaskInput {
  name: string;
  offsetsHours: number[];
}

interface PushTaskFormProps {
  onSubmit: (input: NewTaskInput) => void;
  editing?: NewTaskInput | null;
  onCancelEdit?: () => void;
}

function useAutoGrow(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return ref;
}

export function PushTaskForm({ onSubmit, editing, onCancelEdit }: PushTaskFormProps) {
  const [name, setName] = useState('');
  const [offsetsText, setOffsetsText] = useState('');
  const nameRef = useAutoGrow(name);
  const offsetsRef = useAutoGrow(offsetsText);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setOffsetsText(editing.offsetsHours.join(','));
    } else {
      setName('');
      setOffsetsText('');
    }
  }, [editing]);

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
    setOffsetsText('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    } else if (e.key === 'Escape' && editing) {
      onCancelEdit?.();
    }
  }

  return (
    <div className="push-task-form-wrapper">
      {editing && <div className="push-task-form__label">Sửa</div>}
      <div className="push-task-form">
        <textarea
          ref={nameRef}
          className="push-task-form__name"
          rows={1}
          placeholder="Tên đầu việc"
          aria-label="Tên đầu việc"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <textarea
          ref={offsetsRef}
          className="push-task-form__offsets"
          rows={1}
          placeholder="3,6,9"
          aria-label="Mốc nhắc (giờ)"
          value={offsetsText}
          onChange={(e) => setOffsetsText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
}
