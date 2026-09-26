import { useEffect, useState } from 'react';
import { CollapsiblePanel } from '../../shared/CollapsiblePanel';
import { PushTaskList } from './PushTaskList';
import { PushTaskForm, NewTaskInput } from './PushTaskForm';
import { getElectronApi } from '../../api/electronApi';
import { PushTask } from '../../shared/types';

const DEFAULT_CYCLE_HOURS = 24;

interface EditingTask extends NewTaskInput {
  id: string;
}

export function PushTaskPanel() {
  const [tasks, setTasks] = useState<PushTask[]>([]);
  const [now, setNow] = useState(Date.now());
  const [editing, setEditing] = useState<EditingTask | null>(null);
  const [flashStarts, setFlashStarts] = useState<Record<string, number>>({});

  useEffect(() => {
    const api = getElectronApi();
    api.listTasks().then(setTasks);
    const unsubscribe = api.onTasksUpdated(setTasks);
    const unsubscribePushed = api.onTasksPushed((ids) => {
      const startedAt = Date.now();
      setNow(startedAt);
      setFlashStarts((prev) => ({ ...prev, ...Object.fromEntries(ids.map((id) => [id, startedAt])) }));
    });
    const clockId = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      unsubscribe();
      unsubscribePushed();
      clearInterval(clockId);
    };
  }, []);

  async function handleSubmit(input: NewTaskInput) {
    const api = getElectronApi();
    if (editing) {
      const original = tasks.find((t) => t.id === editing.id);
      setEditing(null);
      if (!original) {
        return;
      }
      const offsetsChanged = original.offsetsHours.join(',') !== input.offsetsHours.join(',');
      const updated: PushTask = {
        ...original,
        name: input.name,
        offsetsHours: input.offsetsHours,
        ...(offsetsChanged ? { cycleStart: Date.now(), pushedOffsetIndexes: [] } : {}),
      };
      setTasks(await api.updateTask(updated));
      return;
    }
    setTasks(await api.addTask({ ...input, cycleHours: DEFAULT_CYCLE_HOURS }));
  }

  async function handleToggleDone(id: string) {
    const api = getElectronApi();
    setTasks(await api.markTaskDone(id));
  }

  async function handleDelete(id: string) {
    const api = getElectronApi();
    if (editing?.id === id) {
      setEditing(null);
    }
    setTasks(await api.deleteTask(id));
  }

  function handleEdit(id: string) {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      setEditing({ id, name: task.name, offsetsHours: task.offsetsHours });
    }
  }

  return (
    <CollapsiblePanel
      title="Đầu việc cần push"
      badge={tasks.filter((t) => !t.done).length}
      defaultExpanded={true}
    >
      <PushTaskForm onSubmit={handleSubmit} editing={editing} onCancelEdit={() => setEditing(null)} />
      <PushTaskList
        tasks={tasks}
        now={now}
        flashStarts={flashStarts}
        onToggleDone={handleToggleDone}
        onDelete={handleDelete}
        onEditOffsets={handleEdit}
      />
    </CollapsiblePanel>
  );
}
