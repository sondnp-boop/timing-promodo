import { useState } from 'react';
import { Modal } from '../../shared/Modal';
import { buildExportText } from '../../shared/exportTasks';
import { getElectronApi } from '../../api/electronApi';
import { PushTask } from '../../shared/types';

interface ExportDialogProps {
  tasks: PushTask[];
  now: number;
  onClose: () => void;
}

export function ExportDialog({ tasks, now, onClose }: ExportDialogProps) {
  const [copied, setCopied] = useState(false);
  const text = buildExportText(tasks, now);

  async function handleCopy() {
    await getElectronApi().copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Modal title="Export" onClose={onClose}>
      <pre className="export-text" data-testid="export-text">
        {text || 'Chưa có đầu việc nào.'}
      </pre>
      <div className="modal__actions">
        <button type="button" className="modal__btn" onClick={onClose}>
          Đóng
        </button>
        <button type="button" className="modal__btn modal__btn--primary" disabled={!text} onClick={handleCopy}>
          {copied ? 'Đã copy!' : 'Copy to Clipboard'}
        </button>
      </div>
    </Modal>
  );
}
