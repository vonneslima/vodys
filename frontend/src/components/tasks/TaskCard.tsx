'use client';

import { useState } from 'react';
import { MoreVertical, Pencil, Trash2, CheckCircle2, Circle, Clock, Tag } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PRIORITY_CONFIG, STATUS_CONFIG, formatRelative, isOverdue } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusToggle: (task: Task) => void;
}

export function TaskCard({ task, onEdit, onDelete, onStatusToggle }: TaskCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const priorityCfg = PRIORITY_CONFIG[task.priority];
  const statusCfg = STATUS_CONFIG[task.status];
  const overdue = isOverdue(task.dueDate, task.status);
  const isDone = task.status === 'DONE';

  return (
    <Card
      className={cn(
        'group relative transition-all duration-200 hover:-translate-y-0.5',
        isDone && 'opacity-70'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Status toggle */}
          <button
            onClick={() => onStatusToggle(task)}
            className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-primary"
            aria-label={isDone ? 'Mark as not done' : 'Mark as done'}
          >
            {isDone ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : task.status === 'IN_PROGRESS' ? (
              <Clock className="h-5 w-5 text-blue-500" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            {/* Title */}
            <p
              className={cn(
                'font-medium text-sm leading-snug',
                isDone && 'line-through text-muted-foreground'
              )}
            >
              {task.title}
            </p>

            {/* Description */}
            {task.description && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{task.description}</p>
            )}

            {/* Meta row */}
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {/* Subject */}
              {task.subject && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: task.subject.color }}
                  />
                  {task.subject.name}
                </span>
              )}

              {/* Due date */}
              {task.dueDate && (
                <span
                  className={cn(
                    'text-xs',
                    overdue ? 'font-medium text-destructive' : 'text-muted-foreground'
                  )}
                >
                  {overdue ? '⚠ ' : ''}{formatRelative(task.dueDate)}
                </span>
              )}

              {/* Priority */}
              <Badge
                variant="outline"
                className={cn('h-5 px-1.5 text-[10px]', priorityCfg.bg, priorityCfg.color)}
              >
                {priorityCfg.label}
              </Badge>

              {/* Status */}
              <Badge
                variant="outline"
                className={cn('h-5 px-1.5 text-[10px]', statusCfg.bg, statusCfg.color)}
              >
                {statusCfg.label}
              </Badge>
            </div>

            {/* Tags */}
            {task.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {task.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                  >
                    <Tag className="h-2.5 w-2.5" />
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Subtask progress */}
            {task._count && task._count.subtasks > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                {task.subtasks?.filter((s) => s.status === 'DONE').length ?? 0}/{task._count.subtasks} subtasks
              </div>
            )}
          </div>

          {/* Actions menu */}
          <DropdownMenu.Root open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenu.Trigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Task actions"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 min-w-[140px] rounded-lg border border-border bg-popover p-1 shadow-lg animate-fade-in"
                align="end"
                sideOffset={4}
              >
                <DropdownMenu.Item
                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-accent"
                  onClick={() => { onEdit(task); setIsMenuOpen(false); }}
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-border" />
                <DropdownMenu.Item
                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive outline-none hover:bg-destructive/10"
                  onClick={() => { onDelete(task.id); setIsMenuOpen(false); }}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </CardContent>
    </Card>
  );
}
