export interface ActivityLogDto {
  id: string;
  userId: string;
  projectId: string | null;
  action: string;
  entityType: 'TASK' | 'PROJECT';
  entityId: string;
  message: string;
  createdAt: string;
  project?: {
    id: string;
    name: string;
  };
}
