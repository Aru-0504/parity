export type ParityEventType =
  | 'CONNECTED'
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_DELETED'
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_DELETED'
  | 'ACTIVITY_LOGGED';

export interface ParityRealtimeEvent<T = any> {
  type: ParityEventType;
  timestamp: string;
  data: T;
}
