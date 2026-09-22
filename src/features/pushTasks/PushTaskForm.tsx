import { FormEvent, useState } from 'react';

export interface NewTaskInput {
  name: string;
  pusher: string;
  cycleHours: number;
  offsetsHours: number[];
}

interface PushTaskFormProps {
  onSubmit: (input: NewTaskInput) => void;
}

export function PushTaskForm({ onSubmit }: PushTaskFormProps) {
  const [name, setName] = useState('');
  const [pusher, setPusher] = useState('');
  const [cycleHours, setCycleHours] = useState(24);
  const [offsetsText, setOffsetsText] = useState('3,6,9');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const offsetsHours = offsetsText
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n) && n > 0);
    if (!name.trim() || offsetsHours.length === 0) {
      return;
    }
    onSubmit({ name: name.trim(), pusher: pusher.trim(), cycleHours, offsetsHours });
    setName('');
    setPusher('');
  }

  return (
    <form className="push-task-form" onSubmit={handleSubmit}>
      <input placeholder="Tên đầu việc" value={name} onChange={(e) => setName(e.target.value)} />
      <input placeholder="Người push" value={pusher} onChange={(e) => setPusher(e.target.value)} />
      <input
        type="number"
        placeholder="Chu kỳ (giờ)"
        value={cycleHours}
        onChange={(e) => setCycleHours(Number(e.target.value))}
      />
      <input
        placeholder="Mốc nhắc (giờ), vd 3,6,9"
        value={offsetsText}
        onChange={(e) => setOffsetsText(e.target.value)}
      />
      <button type="submit">Thêm đầu việc</button>
    </form>
  );
}
