import {axiosInstance} from "@/api/instance.ts";
import type {Project} from "@/features/profile/model/profile.types.ts";

export const fetchProjects = async () => {
  const { data } = await axiosInstance.get<Project[]>('/projects')

  return data
}