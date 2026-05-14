'use client';

import { useState } from 'react';
import { Plus, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';

interface SubtaskListProps {
  parentId: string;
  subtasks: Pick<Task, 'id' | 'title' | 'status'>[];
  onToggle: (id: string, isDone: boolean) => void;
  onAdd: (title: string) => void;
  onDelete: (id: string) => void;
}

export function SubtaskList({ subtasks, onToggle, onAdd, onDelete }: SubtaskListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleAdd = () => {
    if (newTitle.trim()) {
      onAdd(newTitle.trim());
      setNewTitle('');
      setIsAdding(false);
    }
  };

  const doneCount = subtasks.filter((s) => s.status === 'DONE').length;

  return (
    <div className="space-y-2">
      {subtasks.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <span>{doneCount}/{subtasks.length} completed</span>
          <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${(doneCount / subtasks.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {subtasks.map((subtask) => (
        <div key={subtask.id} className="flex items-center gap-2 group">
          <button
            onClick={() => onToggle(subtask.id, subtask.status !== 'DONE')}
            className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
          >
            {subtask.status === 'DONE' ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
          </button>
          <span
            className={cn(
              'flex-1 text-sm',
              subtask.status === 'DONE' && 'line-through text-muted-foreground'
            )}
          >
            {subtask.title}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(subtask.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}

      {isAdding ? (
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Subtask title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') { setIsAdding(false); setNewTitle(''); }
            }}
            autoFocus
            className="h-8 text-sm"
          />
          <Button size="sm" className="h-8" onClick={handleAdd} disabled={!newTitle.trim()}>
            Add
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8"
            onClick={() => { setIsAdding(false); setNewTitle(''); }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="h-3.5 w-3.5" /> Add subtask
        </Button>
      )}
    </div>
  );
}
