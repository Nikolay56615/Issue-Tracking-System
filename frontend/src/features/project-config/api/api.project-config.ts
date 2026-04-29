import { axiosInstance } from '@/api/instance.ts';
import type {
  ProjectConfig,
  ProjectTemplate,
} from '@/features/project-config/model/project-config.types.ts';

export const getProjectConfig = async (projectId: number) => {
  const { data } = await axiosInstance.get<ProjectConfig>(
    `/projects/${projectId}/config`
  );

  return data;
};

export const updateProjectConfig = async (
  projectId: number,
  config: ProjectConfig
) => {
  const { data } = await axiosInstance.put<ProjectConfig>(
    `/projects/${projectId}/config`,
    config
  );

  return data;
};

export const exportProjectTemplate = async (projectId: number) => {
  const { data } = await axiosInstance.get<ProjectTemplate>(
    `/projects/${projectId}/template`
  );

  return data;
};

export const applyProjectTemplate = async (
  projectId: number,
  sourceProjectId: number
) => {
  const { data } = await axiosInstance.post<ProjectConfig>(
    `/projects/${projectId}/template`,
    {
      sourceProjectId,
    }
  );

  return data;
};
