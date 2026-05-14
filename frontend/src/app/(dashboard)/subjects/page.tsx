'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, BookOpen, MoreVertical, Pencil, Trash2, Archive } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useForm } from 'react-hook-form';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import type { Subject } from '@/types';

const ICON_OPTIONS = ['book', 'calculator', 'atom', 'code', 'globe', 'music', 'flask', 'pencil', 'cpu', 'chart'];
const COLOR_OPTIONS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f59e0b', '#10b981', '#3b82f6', '#06b6d4',
  '#84cc16', '#f97316',
];

interface SubjectFormValues {
  name: string;
  description: string;
  color: string;
  icon: string;
}

function SubjectFormDialog({
  open,
  onClose,
  subject,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  subject?: Subject | null;
  onSubmit: (data: SubjectFormValues) => void;
  isLoading?: boolean;
}) {
  const { register, handleSubmit, watch, setValue, reset } = useForm<SubjectFormValues>({
    defaultValues: subject
      ? { name: subject.name, description: subject.description ?? '', color: subject.color, icon: subject.icon }
      : { name: '', description: '', color: '#6366f1', icon: 'book' },
  });

  const color = watch('color');
  const icon = watch('icon');

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{subject ? 'Edit Subject' : 'New Subject'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <Input label="Subject name" placeholder="e.g. Mathematics" {...register('name', { required: true })} />
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="flex min-h-[70px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              placeholder="What will you study?"
              {...register('description')}
            />
          </div>
          {/* Color picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue('color', c)}
                  className="h-7 w-7 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    outline: color === c ? `3px solid ${c}` : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={isLoading}>{subject ? 'Save' : 'Create'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function SubjectsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => api.get<{ data: Subject[] }>('/subjects').then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: SubjectFormValues) => api.post('/subjects', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['subjects'] }); toast.success('Subject created!'); setShowForm(false); },
    onError: () => toast.error('Failed to create subject'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: SubjectFormValues & { id: string }) => api.patch(`/subjects/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['subjects'] }); toast.success('Subject updated'); setEditingSubject(null); setShowForm(false); },
    onError: () => toast.error('Failed to update subject'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/subjects/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['subjects'] }); toast.success('Subject deleted'); },
    onError: () => toast.error('Failed to delete subject'),
  });

  const handleSubmit = (data: SubjectFormValues) => {
    if (editingSubject) {
      updateMutation.mutate({ id: editingSubject.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this subject? Tasks will be unassigned.')) deleteMutation.mutate(id);
  };

  const activeSubjects = subjects.filter((s) => !s.isArchived);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subjects</h1>
          <p className="text-muted-foreground mt-0.5">{activeSubjects.length} active subjects</p>
        </div>
        <Button className="gap-2" onClick={() => { setEditingSubject(null); setShowForm(true); }}>
          <Plus className="h-4 w-4" /> New Subject
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>
      ) : subjects.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
            <BookOpen className="h-10 w-10 text-muted-foreground/40" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold">No subjects yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Create your first subject to get started</p>
          </div>
          <Button onClick={() => setShowForm(true)}>Create Subject</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <Card key={subject.id} className="group overflow-hidden">
              {/* Color strip */}
              <div className="h-1.5 w-full" style={{ backgroundColor: subject.color }} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-white text-lg"
                      style={{ backgroundColor: subject.color }}
                    >
                      📚
                    </div>
                    <div>
                      <h3 className="font-semibold">{subject.name}</h3>
                      {subject.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{subject.description}</p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content className="z-50 min-w-[130px] rounded-lg border border-border bg-popover p-1 shadow-lg" align="end">
                        <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent outline-none" onClick={() => { setEditingSubject(subject); setShowForm(true); }}>
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator className="my-1 h-px bg-border" />
                        <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 outline-none" onClick={() => handleDelete(subject.id)}>
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>

                <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{subject._count?.tasks ?? 0} tasks</span>
                  <span>·</span>
                  <span>{subject._count?.events ?? 0} events</span>
                  {subject.isArchived && <Badge variant="secondary">Archived</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SubjectFormDialog
        open={showForm}
        onClose={() => { setShowForm(false); setEditingSubject(null); }}
        subject={editingSubject}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
