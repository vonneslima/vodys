'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Modal';
import type { Task, Subject } from '@/types';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(5000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']),
  dueDate: z.string().optional(),
  estimatedMin: z.coerce.number().int().positive().optional().or(z.literal('')),
  subjectId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Task> & { title: string }) => void;
  task?: Task | null;
  isLoading?: boolean;
}

export function TaskForm({ open, onClose, onSubmit, task, isLoading }: TaskFormProps) {
  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => api.get<{ data: Subject[] }>('/subjects').then((r) => r.data.data),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      priority: 'MEDIUM',
      status: 'TODO',
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description ?? '',
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate ? task.dueDate.slice(0, 16) : '',
        estimatedMin: task.estimatedMin ?? '',
        subjectId: task.subjectId ?? '',
      } as FormValues);
    } else {
      reset({ priority: 'MEDIUM', status: 'TODO' });
    }
  }, [task, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFormSubmit = (data: FormValues) => {
    onSubmit({
      ...data,
      id: task?.id,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      estimatedMin: data.estimatedMin ? Number(data.estimatedMin) : undefined,
      subjectId: data.subjectId || undefined,
    } as Partial<Task> & { title: string });
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'New Task'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
          <Input
            label="Title"
            placeholder="What needs to be done?"
            error={errors.title?.message}
            {...register('title')}
          />

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              placeholder="Add more details..."
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Priority</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('priority')}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('status')}
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Due Date"
              type="datetime-local"
              error={errors.dueDate?.message}
              {...register('dueDate')}
            />
            <Input
              label="Estimated time (min)"
              type="number"
              placeholder="e.g. 60"
              error={errors.estimatedMin?.message}
              {...register('estimatedMin')}
            />
          </div>

          {subjects && subjects.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Subject</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('subjectId')}
              >
                <option value="">No subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {task ? 'Save Changes' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
