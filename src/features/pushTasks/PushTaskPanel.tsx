import { useEffect, useState } from 'react';
import { CollapsiblePanel } from '../../shared/CollapsiblePanel';
import { PushTaskList } from './PushTaskList';
import { PushTaskForm, NewTaskInput } from './PushTaskForm';
import { ExportDialog } from './ExportDialog';
import { ConfirmDialog } from '../../shared/Modal';
import { getElectronApi } from '../../api/electronApi';
import { PushTask } from '../../shared/types';

interface EditingTask extends NewTaskInput {
  id: string;
}

export function PushTaskPanel() {
  const [tasks, setTasks] = useState<PushTask[]>([]);
  const [now, setNow] = useState(Date.now());
  const [editing, setEditing] = useState<EditingTask | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PushTask | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    const api = getElectronApi();
    api.listTasks().then(setTasks);
    const unsubscribe = api.onTasksUpdated(setTasks);
    const clockId = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      unsubscribe();
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
    setTasks(await api.addTask(input));
  }

  async function handleToggleDone(id: string) {
    const api = getElectronApi();
    setTasks(await api.markTaskDone(id));
  }

  function handleDelete(id: string) {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      setPendingDelete(task);
    }
  }

  async function confirmDelete() {
    const task = pendingDelete;
    setPendingDelete(null);
    if (!task) {
      return;
    }
    if (editing?.id === task.id) {
      setEditing(null);
    }
    setTasks(await getElectronApi().deleteTask(task.id));
  }

  async function confirmReset() {
    setShowReset(false);
    setTasks(await getElectronApi().resetTasksStart());
  }

  function handleEdit(id: string) {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      setEditing({ id, name: task.name, offsetsHours: task.offsetsHours });
    }
  }

  return (
    <>
      <CollapsiblePanel
        title="Đầu việc cần push"
        badge={tasks.filter((t) => !t.done).length}
        headerExtra={
          <>
            <button type="button" className="panel-action-btn" onClick={() => setShowExport(true)}>
              Export
            </button>
            <button
              type="button"
              className="panel-action-btn"
              disabled={tasks.length === 0}
              onClick={() => setShowReset(true)}
            >
              Reset
            </button>
          </>
        }
        defaultExpanded={true}
      >
        <PushTaskForm onSubmit={handleSubmit} editing={editing} onCancelEdit={() => setEditing(null)} />
        <PushTaskList
          tasks={tasks}
          now={now}
          onToggleDone={handleToggleDone}
          onDelete={handleDelete}
          onEditOffsets={handleEdit}
        />
      </CollapsiblePanel>
      {pendingDelete && (
        <ConfirmDialog
          message={`Xóa đầu việc "${pendingDelete.name.replace(/\s+/g, ' ').trim()}"?`}
          confirmLabel="Xóa"
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
      {showReset && (
        <ConfirmDialog
          message="Bạn có muốn đặt lại giờ khởi tạo các đầu việc?"
          confirmLabel="Đặt lại"
          onConfirm={confirmReset}
          onCancel={() => setShowReset(false)}
        />
      )}
      {showExport &&<ExportDialog tasks={tasks} now={now} onClose={() => setShowExport(false)} />}
    </>
  );
}
