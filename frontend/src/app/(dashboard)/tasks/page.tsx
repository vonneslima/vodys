'use client';

import { useState } from 'react';
import { Plus, Filter, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskForm } from '@/components/tasks/TaskForm';
import { Spinner } from '@/components/ui/Spinner';
import { useTasks } from '@/hooks/useTasks';
import { toast } from '@/components/ui/Toast';
import type { Task, TaskStatus, Priority } from '@/types';

type Filters = {
  status?: TaskStatus;
  priority?: Priority;
  search?: string;
};

export default function TasksPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [showFilters, setShowFilters] = useState(false);

  const { tasks, isLoading, createTask, updateTask, deleteTask, isCreating, isUpdating } =
    useTasks(filters);

  const handleCreate = (data: Partial<Task> & { title: string }) => {
    createTask(data, {
      onSuccess: () => toast.success('Task created!'),
      onError: () => toast.error('Failed to create task'),
    });
  };

  const handleUpdate = (data: Partial<Task> & { title: string }) => {
    if (!editingTask) return;
    updateTask({ id: editingTask.id, ...data }, {
      onSuccess: () => toast.success('Task updated'),
      onError: () => toast.error('Failed to update task'),
    });
    setEditingTask(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this task? Subtasks will also be deleted.')) return;
    deleteTask(id, {
      onSuccess: () => toast.success('Task deleted'),
      onError: () => toast.error('Failed to delete task'),
    });
  };

  const handleStatusToggle = (task: Task) => {
    const newStatus: TaskStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
    updateTask(
      { id: task.id, status: newStatus },
      { onSuccess: () => newStatus === 'DONE' && toast.success('Task completed! 🎉') }
    );
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const todoTasks = tasks.filter((t) => t.status === 'TODO');
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');
  const doneTasks = tasks.filter((t) => t.status === 'DONE');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-muted-foreground mt-0.5">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
          <Button size="sm" className="gap-2" onClick={() => { setEditingTask(null); setShowForm(true); }}>
            <Plus className="h-4 w-4" /> New Task
          </Button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <Input
          placeholder="Search tasks..."
          leftIcon={<Search className="h-4 w-4" />}
          value={filters.search ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined }))}
        />
        {showFilters && (
          <div className="flex flex-wrap gap-3 rounded-lg border border-border bg-card p-4 animate-fade-in">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={filters.status ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, status: (e.target.value as TaskStatus) || undefined }))}
              >
                <option value="">All</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Priority</label>
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={filters.priority ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, priority: (e.target.value as Priority) || undefined }))}
              >
                <option value="">All</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button variant="ghost" size="sm" onClick={() => setFilters({})}>Clear filters</Button>
            </div>
          </div>
        )}
      </div>

      {/* Kanban-style columns */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* To Do */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-muted-foreground" />
              <h2 className="font-semibold">To Do</h2>
              <span className="ml-auto text-sm text-muted-foreground">{todoTasks.length}</span>
            </div>
            {todoTasks.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No tasks here
              </div>
            ) : (
              todoTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onStatusToggle={handleStatusToggle}
                />
              ))
            )}
          </div>

          {/* In Progress */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <h2 className="font-semibold">In Progress</h2>
              <span className="ml-auto text-sm text-muted-foreground">{inProgressTasks.length}</span>
            </div>
            {inProgressTasks.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Nothing in progress
              </div>
            ) : (
              inProgressTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onStatusToggle={handleStatusToggle}
                />
              ))
            )}
          </div>

          {/* Done */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <h2 className="font-semibold">Done</h2>
              <span className="ml-auto text-sm text-muted-foreground">{doneTasks.length}</span>
            </div>
            {doneTasks.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No completed tasks yet
              </div>
            ) : (
              doneTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onStatusToggle={handleStatusToggle}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Task form modal */}
      <TaskForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditingTask(null); }}
        onSubmit={editingTask ? handleUpdate : handleCreate}
        task={editingTask}
        isLoading={isCreating || isUpdating}
      />
    </div>
  );
}
