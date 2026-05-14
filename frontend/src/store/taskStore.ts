import { create } from 'zustand';
import type { Task } from '@/types';

interface TaskState {
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  selectedTask: null,
  setSelectedTask: (task) => set({ selectedTask: task }),
}));
