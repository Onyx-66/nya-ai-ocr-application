import { useState } from 'react';
import DriveBrowser from '@/components/batch/DriveBrowser';
import { FolderOpen, X, HardDrive } from 'lucide-react';

export default function DriveFolderButton({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(() => (value ? (localStorage.getItem('driveFolderName') || 'Selected folder') : ''));

  const pick = ({ id, name: n }) => {
    setName(n);
    localStorage.setItem('driveFolderName', n);
    onChange(id);
  };
  const clear = () => {
    setName('');
    localStorage.removeItem('driveFolderName');
    onChange(null);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-[hsl(var(--c-accent))] hover:bg-[hsl(var(--c-accent-2))] text-white rounded-lg px-3 py-2 text-sm font-medium"
        >
          <FolderOpen className="w-4 h-4" /> Browse Google Drive
        </button>
        {value && (
          <button
            onClick={clear}
            title="Clear selection"
            className="flex items-center gap-1.5 bg-[hsl(var(--c-soft))] hover:bg-[hsl(var(--c-soft-2))] text-[hsl(var(--c-text-soft))] rounded-lg px-3 py-2 text-sm"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {value && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[hsl(var(--c-dim))] truncate">
          <HardDrive className="w-3.5 h-3.5 shrink-0" /> {name}
        </p>
      )}
      <DriveBrowser open={open} onClose={() => setOpen(false)} onSelect={pick} />
    </>
  );
}