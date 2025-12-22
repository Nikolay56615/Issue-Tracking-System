package issue.tracking.system.issuetrackingsystem.projects.api;

import issue.tracking.system.issuetrackingsystem.users.api.UserDto;
import java.util.List;
import java.util.Optional;

public interface ProjectQueryApi {
    Optional<ProjectDto> getProjectById(Long id);
    List<ProjectDto> getMyProjects(Long userId);
    List<UserDto> findUsersNotInProject(Long projectId, String query);
    List<ProjectMemberWithRoleDto> getProjectMembersWithRoles(Long projectId);
    List<Long> getProjectMemberIds(Long projectId);
}
