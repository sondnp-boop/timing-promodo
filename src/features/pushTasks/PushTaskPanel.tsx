import { useEffect, useState } from 'react';
import { CollapsiblePanel } from '../../shared/CollapsiblePanel';
import { PushTaskList } from './PushTaskList';
import { PushTaskForm, NewTaskInput } from './PushTaskForm';
import { getElectronApi } from '../../api/electronApi';
import { PushTask } from '../../shared/types';

export function PushTaskPanel() {
  const [tasks, setTasks] = useState<PushTask[]>([]);
  const [now, setNow] = useState(Date.now());

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

  async function handleAdd(input: NewTaskInput) {
    const api = getElectronApi();
    const updated = await api.addTask(input);
    setTasks(updated);
  }

  async function handleToggleDone(id: string) {
    const api = getElectronApi();
    setTasks(await api.markTaskDone(id));
  }

  async function handleDelete(id: string) {
    const api = getElectronApi();
    setTasks(await api.deleteTask(id));
  }

  function handleEditOffsets(_id: string) {
    // TODO: mở dialog sửa giờ push — đủ phạm vi hiện tại là placeholder không thay đổi hành vi test.
  }

  return (
    <CollapsiblePanel title="Đầu việc cần push" defaultExpanded={true}>
      <PushTaskList
        tasks={tasks}
        now={now}
        onToggleDone={handleToggleDone}
        onDelete={handleDelete}
        onEditOffsets={handleEditOffsets}
      />
      <PushTaskForm onSubmit={handleAdd} />
    </CollapsiblePanel>
  );
}
