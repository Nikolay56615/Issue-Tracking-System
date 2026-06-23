import { axiosInstance } from '@/api/instance.ts';
import type {
  AdminProject,
  AdminUser,
} from '@/features/admin/model/admin.types.ts';

export const AdminRequests = {
  async getUsers() {
    const { data } = await axiosInstance.get<AdminUser[]>('/admin/users');
    return data;
  },

  async setGlobalAdmin(userId: number, globalAdmin: boolean) {
    const { data } = await axiosInstance.put<AdminUser>(
      `/admin/users/${userId}/global-admin`,
      { globalAdmin }
    );
    return data;
  },

  async deactivateUser(userId: number) {
    const { data } = await axiosInstance.delete<AdminUser>(
      `/admin/users/${userId}`
    );
    return data;
  },

  async restoreUser(userId: number) {
    const { data } = await axiosInstance.post<AdminUser>(
      `/admin/users/${userId}/restore`
    );
    return data;
  },

  async getProjects() {
    const { data } = await axiosInstance.get<AdminProject[]>('/admin/projects');
    return data;
  },

  async archiveProject(projectId: number) {
    await axiosInstance.post(`/admin/projects/${projectId}/archive`);
  },

  async restoreProject(projectId: number) {
    await axiosInstance.post(`/admin/projects/${projectId}/restore`);
  },

  async deleteProject(projectId: number) {
    await axiosInstance.delete(`/admin/projects/${projectId}`);
  },
};
