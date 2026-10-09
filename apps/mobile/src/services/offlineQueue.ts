import * as SecureStore from 'expo-secure-store';
import { TaskDto, ProjectDto } from '@ismo/shared';
import { AxiosInstance } from 'axios';

const CACHE_TASKS_KEY = 'cache_tasks_v1';
const CACHE_PROJECTS_KEY = 'cache_projects_v1';
const QUEUE_MUTATIONS_KEY = 'queue_mutations_v1';

export interface QueuedMutation {
  id: string;
  type: 'CREATE_TASK' | 'UPDATE_TASK' | 'DELETE_TASK';
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  payload?: any;
  timestamp: number;
  optimisticId?: string;
  taskName?: string;
}

// Memory fallback in case SecureStore has string length limitations
let memoryTasksCache: TaskDto[] | null = null;
let memoryProjectsCache: ProjectDto[] | null = null;

// ====================== CACHE MANAGEMENT ======================

export async function getCachedTasks(): Promise<TaskDto[]> {
  try {
    if (memoryTasksCache) return memoryTasksCache;
    const raw = await SecureStore.getItemAsync(CACHE_TASKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    memoryTasksCache = parsed;
    return parsed;
  } catch (err) {
    console.warn('Failed to load cached tasks from SecureStore', err);
    return memoryTasksCache || [];
  }
}

export async function setCachedTasks(tasks: TaskDto[]): Promise<void> {
  memoryTasksCache = tasks;
  try {
    await SecureStore.setItemAsync(CACHE_TASKS_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.warn('Failed to save tasks cache to SecureStore', err);
  }
}

export async function getCachedProjects(): Promise<ProjectDto[]> {
  try {
    if (memoryProjectsCache) return memoryProjectsCache;
    const raw = await SecureStore.getItemAsync(CACHE_PROJECTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    memoryProjectsCache = parsed;
    return parsed;
  } catch (err) {
    console.warn('Failed to load cached projects from SecureStore', err);
    return memoryProjectsCache || [];
  }
}

export async function setCachedProjects(projects: ProjectDto[]): Promise<void> {
  memoryProjectsCache = projects;
  try {
    await SecureStore.setItemAsync(CACHE_PROJECTS_KEY, JSON.stringify(projects));
  } catch (err) {
    console.warn('Failed to save projects cache to SecureStore', err);
  }
}

// ====================== MUTATION QUEUE ======================

export async function getPendingMutations(): Promise<QueuedMutation[]> {
  try {
    const raw = await SecureStore.getItemAsync(QUEUE_MUTATIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to get pending mutations', err);
    return [];
  }
}

export async function enqueueMutation(mutation: Omit<QueuedMutation, 'id' | 'timestamp'>): Promise<QueuedMutation> {
  const current = await getPendingMutations();
  const newMutation: QueuedMutation = {
    ...mutation,
    id: 'mutation_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    timestamp: Date.now(),
  };

  current.push(newMutation);
  try {
    await SecureStore.setItemAsync(QUEUE_MUTATIONS_KEY, JSON.stringify(current));
  } catch (err) {
    console.warn('Failed to persist mutation to queue', err);
  }
  return newMutation;
}

export async function clearPendingMutations(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(QUEUE_MUTATIONS_KEY);
  } catch (err) {
    console.warn('Failed to clear mutations queue', err);
  }
}

// ====================== SYNC FLUSH ======================

export interface FlushResult {
  processed: number;
  failed: number;
  errors: string[];
}

export async function flushPendingMutations(apiClient: AxiosInstance): Promise<FlushResult> {
  const mutations = await getPendingMutations();
  if (mutations.length === 0) {
    return { processed: 0, failed: 0, errors: [] };
  }

  const remaining: QueuedMutation[] = [];
  let processed = 0;
  const errors: string[] = [];

  for (const item of mutations) {
    try {
      if (item.method === 'POST') {
        await apiClient.post(item.endpoint, item.payload);
      } else if (item.method === 'PUT') {
        await apiClient.put(item.endpoint, item.payload);
      } else if (item.method === 'DELETE') {
        await apiClient.delete(item.endpoint);
      }
      processed++;
    } catch (err: any) {
      console.warn(`Failed to execute queued mutation ${item.id}`, err?.message);
      // If server returned 404 (resource already gone or invalid), drop it to avoid blocking queue
      if (err.response?.status === 404) {
        processed++;
      } else {
        remaining.push(item);
        errors.push(err.response?.data?.message || err.message || 'Network sync error');
      }
    }
  }

  try {
    if (remaining.length === 0) {
      await clearPendingMutations();
    } else {
      await SecureStore.setItemAsync(QUEUE_MUTATIONS_KEY, JSON.stringify(remaining));
    }
  } catch (e) {
    console.warn('Failed to update remaining queue', e);
  }

  return {
    processed,
    failed: remaining.length,
    errors,
  };
}
