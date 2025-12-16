package issue.tracking.system.issuetrackingsystem.projects.api;

import issue.tracking.system.issuetrackingsystem.projects.internal.ProjectRole;

public interface ProjectCommandApi {
    ProjectDto createProject(String name, Long ownerId);
    void inviteUser(Long projectId, Long userId, ProjectRole role);
}
