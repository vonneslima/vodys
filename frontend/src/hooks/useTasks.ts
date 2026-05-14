'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Task, ApiResponse } from '@/types';

interface TaskFilters {
  status?: string;
  priority?: string;
  subjectId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useTasks(filters: TaskFilters = {}) {
  const queryClient = useQueryClient();
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => v !== undefined && params.set(k, String(v)));

  const query = useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Task[]>>(`/tasks?${params}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Task> & { title: string }) =>
      api.post<ApiResponse<Task>>('/tasks', data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-stats'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: Partial<Task> & { id: string }) =>
      api.patch<ApiResponse<Task>>(`/tasks/${id}`, data).then((r) => r.data.data),
    onMutate: async ({ id, ...data }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previous = queryClient.getQueryData(['tasks', filters]);
      queryClient.setQueryData(['tasks', filters], (old: ApiResponse<Task[]> | undefined) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((t) => (t.id === id ? { ...t, ...data } : t)),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['tasks', filters], ctx?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-stats'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-stats'] });
    },
  });

  return {
    tasks: query.data?.data ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
    error: query.error,
    createTask: createMutation.mutate,
    updateTask: updateMutation.mutate,
    deleteTask: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useTaskStats() {
  return useQuery({
    queryKey: ['task-stats'],
    queryFn: async () => {
      const res = await api.get('/tasks/stats');
      return res.data.data;
    },
  });
}
