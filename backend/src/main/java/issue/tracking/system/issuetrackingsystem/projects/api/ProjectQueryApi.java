package issue.tracking.system.issuetrackingsystem.projects.api;

import java.util.List;
import java.util.Optional;

public interface ProjectQueryApi {
    Optional<ProjectDto> getProjectById(Long id);
    List<ProjectDto> getMyProjects(Long userId);
    List<Long> getProjectMemberIds(Long projectId);
}
